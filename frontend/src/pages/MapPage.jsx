import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import SitesMap from "../components/SitesMap.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import { fetchSitesGeoJSON } from "../services/siteService";
import { getErrorMessage } from "../services/api";

export default function MapPage() {
  const navigate = useNavigate();
  const [geojson, setGeojson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSitesGeoJSON()
      .then(setGeojson)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout title="Map">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {isLoading ? (
        <LoadingSkeleton rows={1} className="h-[70vh]" />
      ) : (
        <div className="card p-4">
          <SitesMap
            geojson={geojson}
            className="h-[70vh]"
            onFeatureClick={(props) => navigate(`/sites/${props.id}`)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
