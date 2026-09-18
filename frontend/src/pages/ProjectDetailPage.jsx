import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SitesMap from "../components/SitesMap.jsx";
import CreateSiteModal from "../components/CreateSiteModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { deleteProject, getProject } from "../services/projectService";
import { listSitesForProject } from "../services/siteService";
import { listSiteAnalytics } from "../services/analyticsService";
import { getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext.jsx";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [analyticsBySite, setAnalyticsBySite] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddSite, setShowAddSite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function loadData() {
    setIsLoading(true);
    Promise.all([getProject(projectId), listSitesForProject(projectId)])
      .then(async ([projectData, sitesData]) => {
        const analytics = await Promise.all(
          sitesData.map(async (site) => [site.id, await listSiteAnalytics(site.id)]),
        );
        setProject(projectData);
        setSites(sitesData);
        setAnalyticsBySite(Object.fromEntries(analytics));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  function exportProjectCsv() {
    const rows = [[
      "Project",
      "Site",
      "Area (ha)",
      "Recorded date",
      "Carbon stock (tCO2e)",
      "Carbon sequestration (tCO2e/yr)",
      "Biodiversity index",
      "Tree cover (%)",
      "Species count",
      "Data status",
    ]];

    sites.forEach((site) => {
      const records = analyticsBySite[site.id] || [];
      if (!records.length) {
        rows.push([project.name, site.name, site.area_hectares, "", "", "", "", "", "", "No measurements"]);
        return;
      }
      records.forEach((record) => rows.push([
        project.name,
        site.name,
        site.area_hectares,
        record.recorded_date,
        record.carbon_stock,
        record.carbon_sequestration,
        record.biodiversity_index,
        record.tree_cover_percentage,
        record.species_count,
        "Synthetic demonstration data",
      ]));
    });

    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const impact = sites.reduce(
    (totals, site) => {
      const records = analyticsBySite[site.id] || [];
      const baseline = records[0];
      const current = records[records.length - 1];
      totals.area += Number(site.area_hectares || 0);
      if (baseline && current) {
        totals.baselineCarbon += baseline.carbon_stock;
        totals.currentCarbon += current.carbon_stock;
        totals.baselineTreeCover += baseline.tree_cover_percentage;
        totals.currentTreeCover += current.tree_cover_percentage;
        totals.baselineBiodiversity += baseline.biodiversity_index;
        totals.currentBiodiversity += current.biodiversity_index;
        totals.measuredSites += 1;
      }
      return totals;
    },
    {
      area: 0,
      baselineCarbon: 0,
      currentCarbon: 0,
      baselineTreeCover: 0,
      currentTreeCover: 0,
      baselineBiodiversity: 0,
      currentBiodiversity: 0,
      measuredSites: 0,
    },
  );

  useEffect(loadData, [projectId]);

  function handleSiteCreated(site) {
    setShowAddSite(false);
    showToast(`Site "${site.name}" saved (${site.area_hectares} ha).`);
    loadData();
  }

  async function handleDeleteProject() {
    try {
      await deleteProject(projectId);
      showToast("Project deleted.");
      navigate("/projects");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  const geojson = {
    type: "FeatureCollection",
    features: sites.map((s) => ({
      type: "Feature",
      geometry: s.geometry,
      properties: {
        id: s.id,
        name: s.name,
        project_name: project?.name,
        area_hectares: s.area_hectares,
      },
    })),
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Project">
        <LoadingSkeleton rows={5} />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="Project">
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || "Project not found."}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={project.name}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {project.description || "No description provided."}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportProjectCsv}>
            Download CSV
          </button>
          <button className="btn-primary" onClick={() => setShowAddSite(true)}>
            + Add Site
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Project
          </button>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <SitesMap
          geojson={geojson}
          className="h-[360px]"
          onFeatureClick={(props) => navigate(`/sites/${props.id}`)}
        />
      </div>

      <section className="card mb-6 border-forest-900/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-600">Impact snapshot</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">What changed so far</h2>
            <p className="mt-1 text-sm text-gray-500">Baseline compared with the earliest recorded measurement.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Demo measurements</span>
        </div>
        {impact.measuredSites ? (
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ImpactMetric label="Total Carbon Stock" baseline={impact.baselineCarbon} current={impact.currentCarbon} suffix="tCO2e" />
            <ImpactMetric label="Tree cover" baseline={impact.baselineTreeCover / impact.measuredSites} current={impact.currentTreeCover / impact.measuredSites} suffix="%" />
            <ImpactMetric label="Avg. Biodiversity Index" baseline={impact.baselineBiodiversity / impact.measuredSites} current={impact.currentBiodiversity / impact.measuredSites} />
            <div className="rounded-lg bg-forest-50 p-4">
              <p className="text-xs text-gray-500">Area restored</p>
              <p className="mt-2 text-xl font-semibold text-forest-900">{impact.area.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</p>
              <p className="mt-1 text-xs text-gray-500">Mapped across {sites.length} site(s)</p>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Add measurements to see the project impact story.</p>
        )}
      </section>

      <h2 className="mb-3 text-base font-semibold text-gray-900">Sites</h2>
      {sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="Draw a site boundary on the map to add your first site."
          action={
            <button className="btn-primary" onClick={() => setShowAddSite(true)}>
              + Add Site
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Description</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Area (ha)</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/sites/${site.id}`}
                      className="font-medium text-forest-700 hover:underline"
                    >
                      {site.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{site.description || "—"}</td>
                  <td className="px-4 py-2">{site.area_hectares.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(site.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddSite && (
        <CreateSiteModal
          projectId={projectId}
          onClose={() => setShowAddSite(false)}
          onCreated={handleSiteCreated}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this project?"
        description="This will permanently delete the project and all of its sites and analytics. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteProject}
      />
    </DashboardLayout>
  );
}

function ImpactMetric({ label, baseline, current, suffix = "" }) {
  const change = current - baseline;
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">
        {current.toLocaleString(undefined, { maximumFractionDigits: 2 })} {suffix}
      </p>
      <p className={`mt-1 text-xs font-semibold ${change >= 0 ? "text-forest-700" : "text-red-600"}`}>
        {change >= 0 ? "+" : ""}{change.toLocaleString(undefined, { maximumFractionDigits: 2 })} from baseline
      </p>
    </div>
  );
}
