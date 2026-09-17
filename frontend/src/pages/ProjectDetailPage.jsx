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
import { getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext.jsx";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddSite, setShowAddSite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function loadData() {
    setIsLoading(true);
    Promise.all([getProject(projectId), listSitesForProject(projectId)])
      .then(([projectData, sitesData]) => {
        setProject(projectData);
        setSites(sitesData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

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
        <div className="flex gap-2">
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
