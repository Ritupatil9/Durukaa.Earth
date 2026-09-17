import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import StatCard from "../components/StatCard.jsx";
import SitesMap from "../components/SitesMap.jsx";
import { getDashboardSummary } from "../services/analyticsService";
import { fetchSitesGeoJSON } from "../services/siteService";
import { getErrorMessage } from "../services/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getDashboardSummary(), fetchSitesGeoJSON()])
      .then(([summaryData, geojsonData]) => {
        if (!isMounted) return;
        setSummary(summaryData);
        setGeojson(geojsonData);
      })
      .catch((err) => isMounted && setError(getErrorMessage(err)))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon="🗂️"
          label="Total Projects"
          value={summary?.total_projects ?? "—"}
          isLoading={isLoading}
        />
        <StatCard
          icon="📍"
          label="Total Sites"
          value={summary?.total_sites ?? "—"}
          isLoading={isLoading}
        />
        <StatCard
          icon="📐"
          label="Total Area"
          value={summary ? summary.total_area_hectares.toLocaleString() : "—"}
          suffix="ha"
          isLoading={isLoading}
        />
        <StatCard
          icon="🌿"
          label="Avg. Biodiversity Index"
          value={summary?.average_biodiversity_index ?? "—"}
          isLoading={isLoading}
        />
        <StatCard
          icon="🌍"
          label="Total Carbon Stock"
          value={summary ? summary.total_carbon_stock.toLocaleString() : "—"}
          suffix="tCO₂e"
          isLoading={isLoading}
        />
      </div>

      <div className="card mt-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">All sites</h2>
          <Link to="/map" className="text-sm font-medium text-forest-700 hover:underline">
            Open full map
          </Link>
        </div>
        <SitesMap
          geojson={geojson}
          className="h-[360px]"
          onFeatureClick={(props) => (window.location.href = `/sites/${props.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
