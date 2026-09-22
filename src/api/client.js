// API client for the Digital Tailor Express backend.
// Same-origin (/api) in dev via Vite proxy; VITE_API_URL override for prod.
const BASE = import.meta.env.VITE_API_URL || "/api";

let csrf = null;

async function ensureCsrf() {
  if (csrf) return;
  try {
    const r = await fetch(`${BASE}/auth/csrf`, { credentials: "include" });
    const data = await r.json();
    csrf = data.csrfToken || null;
  } catch {
    csrf = null;
  }
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(method, path, body, retried = false) {
  if (method !== "GET") await ensureCsrf();
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrf && method !== "GET") headers["x-csrf-token"] = csrf;
  const res = await fetch(BASE + path, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Token may have rotated — refresh once and retry mutations.
    if (!retried && res.status === 403 && method !== "GET" && data?.error?.code === "FORBIDDEN") {
      csrf = null;
      await ensureCsrf();
      return api(method, path, body, true);
    }
    throw new ApiError(res.status, data?.error?.code || "ERROR", data?.error?.message || "Request failed", data?.error?.details);
  }
  return data;
}

export const get = (p) => api("GET", p);
export const post = (p, b) => api("POST", p, b);
export const put = (p, b) => api("PUT", p, b);
export const patch = (p, b) => api("PATCH", p, b);
export const del = (p) => api("DELETE", p);
