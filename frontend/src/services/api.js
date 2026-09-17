import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("darukaa_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized handling: on an expired/invalid token, force a clean logout
// rather than letting every page re-implement the same redirect logic.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("darukaa_token");
      localStorage.removeItem("darukaa_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Extracts a human-readable message from any Axios/FastAPI error shape.
 */
export function getErrorMessage(error) {
  if (!error.response) {
    return "Network error. Please check your connection and that the API server is running.";
  }
  const { status, data } = error.response;
  const detail = data && data.detail;

  if (Array.isArray(detail)) {
    // FastAPI 422 validation errors
    return detail.map((d) => d.msg).join(", ");
  }
  if (typeof detail === "string") {
    return detail;
  }
  switch (status) {
    case 401:
      return "You need to log in to continue.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "The requested resource was not found.";
    case 422:
      return "Some of the submitted data was invalid.";
    default:
      return "Something went wrong on the server. Please try again.";
  }
}
