import { useState } from "react";
import { createProject } from "../services/projectService";
import { getErrorMessage } from "../services/api";

export default function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const project = await createProject(form);
      onCreated(project);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900">Create Project</h3>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label-field" htmlFor="project-name">
              Project Name
            </label>
            <input
              id="project-name"
              required
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              rows={3}
              className="input-field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
