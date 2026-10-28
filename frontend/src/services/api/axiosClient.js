import { clearSession, getSession, saveSession } from "../auth/tokenManager";

export const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

function errorMessage(payload, status) {
  if (typeof payload?.detail === "string") return payload.detail;
  if (Array.isArray(payload?.detail)) return payload.detail.map((item) => item.msg).join(" · ");
  return `Request failed (${status})`;
}

async function refreshSession() {
  const session = getSession();
  if (!session?.refresh_token) return null;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) {
    clearSession();
    return null;
  }
  const updated = await response.json();
  saveSession(updated);
  return updated;
}

export async function apiFetch(path, options = {}, retry = true) {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error("BloomSense API is unreachable. Start the backend or enable demo mode.", { cause: error });
  }

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch(path, options, false);
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(payload, response.status));
  return payload;
}
