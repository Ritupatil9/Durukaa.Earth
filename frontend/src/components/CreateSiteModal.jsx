import { useState } from "react";
import SitesMap from "./SitesMap.jsx";
import { createSite } from "../services/siteService";
import { getErrorMessage } from "../services/api";

/**
 * Full "Add Site" flow: draw a polygon on the map, edit it, then fill in
 * name/description and save. Area is intentionally NOT computed client
 * side for the final saved value -- the backend recalculates it from the
 * PostGIS geometry so it can never be spoofed. We only show a rough
 * client-side estimate as a courtesy while drawing.
 */
export default function CreateSiteModal({ projectId, onClose, onCreated }) {
  const [geometry, setGeometry] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!geometry) {
      setError("Please draw a site boundary on the map first.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const site = await createSite(projectId, { ...form, geometry });
      onCreated(site);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-3xl p-6">
        <h3 className="text-base font-semibold text-gray-900">Add Site</h3>
        <p className="mt-1 text-sm text-gray-500">
          Use the polygon tool (top-left of the map) to draw the site boundary. You can edit
          vertices by clicking and dragging them, and delete with the trash icon.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-4">
          <SitesMap drawEnabled onDrawChange={setGeometry} className="h-[320px]" />
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {geometry
            ? "Boundary drawn. Area will be calculated by the server on save."
            : "No boundary drawn yet."}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label-field" htmlFor="site-name">
              Site Name
            </label>
            <input
              id="site-name"
              required
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="site-description">
              Description
            </label>
            <textarea
              id="site-description"
              rows={2}
              className="input-field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !geometry}>
              {isSubmitting ? "Saving..." : "Save Site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
