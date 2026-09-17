import { api } from "./api";

export async function listSitesForProject(projectId) {
  const { data } = await api.get(`/projects/${projectId}/sites`);
  return data;
}

export async function createSite(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/sites`, payload);
  return data;
}

export async function getSite(siteId) {
  const { data } = await api.get(`/sites/${siteId}`);
  return data;
}

export async function updateSite(siteId, payload) {
  const { data } = await api.put(`/sites/${siteId}`, payload);
  return data;
}

export async function deleteSite(siteId) {
  await api.delete(`/sites/${siteId}`);
}

export async function fetchSitesGeoJSON() {
  const { data } = await api.get("/sites/map");
  return data;
}
