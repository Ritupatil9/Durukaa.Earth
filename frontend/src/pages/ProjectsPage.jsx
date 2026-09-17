import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import CreateProjectModal from "../components/CreateProjectModal.jsx";
import { listProjects } from "../services/projectService";
import { getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext.jsx";

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  function loadProjects() {
    setIsLoading(true);
    listProjects()
      .then(setProjects)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadProjects, []);

  function handleCreated(project) {
    setShowCreateModal(false);
    showToast(`Project "${project.name}" created.`);
    loadProjects();
  }

  return (
    <DashboardLayout title="Projects">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Manage your carbon &amp; biodiversity projects.</p>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Project
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start adding sites and tracking analytics."
          action={
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              + Create Project
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card block p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {project.description || "No description provided."}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>{project.site_count} site(s)</span>
                <span>{project.total_area_hectares.toLocaleString()} ha</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </DashboardLayout>
  );
}
