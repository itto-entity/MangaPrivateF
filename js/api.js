import "./sw-register.js";

function getApiBaseUrl() {
  const metaUrl = document.querySelector('meta[name="api-base-url"]')?.content?.trim();
  if (metaUrl) {
    if (metaUrl.startsWith("http://") || metaUrl.startsWith("https://")) {
      try {
        const parsed = new URL(metaUrl);
        if (
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
          window.location.hostname &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          parsed.hostname = window.location.hostname;
          return (parsed.origin + parsed.pathname).replace(/\/+$/, "");
        }
        return metaUrl.replace(/\/+$/, "");
      } catch {
        return metaUrl.replace(/\/+$/, "");
      }
    }
    return metaUrl.replace(/\/+$/, "");
  }

  const host = window.location.hostname || "localhost";
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:8000/api/v1`;
}

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken() {
  return localStorage.getItem("manga_access_token");
}

export function setSession(session) {
  localStorage.setItem("manga_access_token", session.access_token);
  localStorage.setItem("manga_refresh_token", session.refresh_token || "");
  localStorage.setItem("manga_user", JSON.stringify(session.user));
}

export function clearSession() {
  ["manga_access_token", "manga_refresh_token", "manga_user"].forEach((key) => localStorage.removeItem(key));
}

export function getCurrentUser() {
  const user = localStorage.getItem("manga_user");
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    clearSession();
    return null;
  }
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server API.", 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && options.clearSessionOnUnauthorized !== false) clearSession();
    throw new ApiError(data?.detail || data?.message || "Request API gagal.", response.status, data);
  }
  return data;
}

export const api = {
  login: (credentials) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    clearSessionOnUnauthorized: false,
  }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getMe: (userId) => request(`/auth/me/${encodeURIComponent(userId)}`),
  getMangas: ({ skip = 0, limit = 20, search = "" } = {}) => {
    const query = new URLSearchParams({ skip, limit });
    if (search.trim()) query.set("search", search.trim());
    return request(`/mangas?${query}`);
  },
  getManga: (slug) => request(`/mangas/${encodeURIComponent(slug)}`),
  getChapters: (slug, { skip = 0, limit = 50 } = {}) =>
    request(`/mangas/${encodeURIComponent(slug)}/chapters?${new URLSearchParams({ skip, limit })}`),
  getChapterPages: (chapterId) => request(`/chapters/${encodeURIComponent(chapterId)}/pages`),
};
