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
      <section className="animate-rise mb-7 flex flex-col justify-between gap-5 rounded-3xl bg-forest-900 px-6 py-7 text-white shadow-xl shadow-forest-900/10 sm:flex-row sm:items-end lg:px-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-forest-300">Western Ghats / live overview</p>
          <h2 className="display-font max-w-xl text-3xl leading-tight sm:text-4xl">Measure what the forest is becoming.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-forest-100/75">A clear view of the places, projects, and ecological signals moving your restoration work forward.</p>
        </div>
        <Link to="/projects" className="inline-flex w-fit items-center rounded-xl bg-[#d9e8c8] px-4 py-2.5 text-sm font-bold text-forest-900 transition hover:bg-white">View projects <span className="ml-2">-&gt;</span></Link>
      </section>

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

      <div className="card mt-7 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-forest-600">Spatial view</p>
            <h2 className="display-font text-2xl text-forest-900">All sites</h2>
          </div>
          <Link to="/map" className="rounded-lg px-3 py-2 text-sm font-bold text-forest-700 transition hover:bg-forest-50">
            Full map -&gt;
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
