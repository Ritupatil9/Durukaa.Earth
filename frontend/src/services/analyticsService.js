import { api } from "./api";

export async function listSiteAnalytics(siteId) {
  const { data } = await api.get(`/sites/${siteId}/analytics`);
  return data;
}

export async function createSiteAnalytics(siteId, payload) {
  const { data } = await api.post(`/sites/${siteId}/analytics`, payload);
  return data;
}

export async function getSiteSummary(siteId) {
  const { data } = await api.get(`/sites/${siteId}/summary`);
  return data;
}

export async function getDashboardSummary() {
  const { data } = await api.get("/dashboard/summary");
  return data;
}
