import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import StatCard from "../components/StatCard.jsx";
import TimeSeriesChart from "../components/TimeSeriesChart.jsx";
import { getSite } from "../services/siteService";
import { getProject } from "../services/projectService";
import { getSiteSummary, listSiteAnalytics } from "../services/analyticsService";
import { getErrorMessage } from "../services/api";

export default function SiteDetailPage() {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getSite(siteId)
      .then((siteData) => {
        if (!isMounted) return;
        setSite(siteData);
        return Promise.all([
          getProject(siteData.project_id),
          getSiteSummary(siteId),
          listSiteAnalytics(siteId),
        ]);
      })
      .then((result) => {
        if (!isMounted || !result) return;
        const [projectData, summaryData, analyticsData] = result;
        setProject(projectData);
        setSummary(summaryData);
        setAnalytics(analyticsData);
      })
      .catch((err) => isMounted && setError(getErrorMessage(err)))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  if (isLoading) {
    return (
      <DashboardLayout title="Site">
        <LoadingSkeleton rows={5} />
      </DashboardLayout>
    );
  }

  if (error || !site) {
    return (
      <DashboardLayout title="Site">
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || "Site not found."}
        </div>
      </DashboardLayout>
    );
  }

  const labels = analytics.map((a) => new Date(a.recorded_date).getFullYear().toString());

  return (
    <DashboardLayout title={site.name}>
      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{site.name}</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Demo data</span>
            </div>
            <p className="text-sm text-gray-500">
              Project:{" "}
              {project ? (
                <a
                  href={`/projects/${project.id}`}
                  className="font-medium text-forest-700 hover:underline"
                >
                  {project.name}
                </a>
              ) : (
                "—"
              )}
            </p>
            {site.description && <p className="mt-2 text-sm text-gray-600">{site.description}</p>}
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Area: {site.area_hectares.toLocaleString()} ha</p>
            <p>Created {new Date(site.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon="🌍"
          label="Carbon Stock"
          value={summary?.latest_carbon_stock ?? "—"}
          suffix="tCO₂e"
        />
        <StatCard
          icon="🌱"
          label="Carbon Sequestration"
          value={analytics.length ? analytics[analytics.length - 1].carbon_sequestration : "—"}
          suffix="tCO₂e/yr"
        />
        <StatCard
          icon="🦋"
          label="Biodiversity Index"
          value={summary?.latest_biodiversity_index ?? "—"}
        />
        <StatCard
          icon="🌳"
          label="Tree Cover"
          value={summary?.latest_tree_cover_percentage ?? "—"}
          suffix="%"
        />
        <StatCard icon="🐾" label="Species Count" value={summary?.latest_species_count ?? "—"} />
      </div>

      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <strong>Measurement provenance:</strong> {summary?.data_note} Values are deterministic seed records created for this demonstration.
      </p>

      {analytics.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-gray-500">
          No analytics records yet for this site.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TimeSeriesChart
            title="Carbon Stock Over Time"
            labels={labels}
            data={analytics.map((a) => a.carbon_stock)}
            unit="tCO₂e"
            color="#2f7550"
          />
          <TimeSeriesChart
            title="Biodiversity Index Over Time"
            labels={labels}
            data={analytics.map((a) => a.biodiversity_index)}
            unit="index (0-1)"
            color="#5fae80"
          />
          <TimeSeriesChart
            title="Tree Cover Over Time"
            labels={labels}
            data={analytics.map((a) => a.tree_cover_percentage)}
            unit="%"
            color="#265d41"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
