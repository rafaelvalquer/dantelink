const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

export async function request(method, path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Falha na requisição com status ${response.status}`);
  }

  return data;
}

export function getMyPage() {
  return request("GET", "/my-page");
}

export function saveMyPageProfile(payload) {
  return request("PUT", "/my-page", payload);
}

export async function uploadMyPageAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/my-page/avatar`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Falha no upload com status ${response.status}`);
  }

  return data;
}

export function saveMyPageTheme(theme) {
  return request("PUT", "/my-page", { theme });
}

export function getPublicMyPage(slug) {
  return request("GET", `/my-page/public/${encodeURIComponent(slug)}`);
}

export function createLink(payload) {
  return request("POST", "/my-page/links", payload);
}

export function saveLink(id, payload) {
  return request("PUT", `/my-page/links/${id}`, payload);
}

export function removeLink(id) {
  return request("DELETE", `/my-page/links/${id}`);
}

export function toggleLink(id) {
  return request("PATCH", `/my-page/links/${id}/toggle`);
}

export function reorderLinks(ids) {
  return request("PATCH", "/my-page/links/reorder", { ids });
}

export function searchLocationSuggestions(query) {
  const normalizedQuery = String(query || "").trim();
  return request(
    "GET",
    `/my-page/locations/autocomplete?q=${encodeURIComponent(normalizedQuery)}`,
  );
}

export function createSecondaryLink(payload) {
  return request("POST", "/my-page/secondary-links", payload);
}

export function saveSecondaryLink(id, payload) {
  return request("PUT", `/my-page/secondary-links/${id}`, payload);
}

export function removeSecondaryLink(id) {
  return request("DELETE", `/my-page/secondary-links/${id}`);
}

export function toggleSecondaryLink(id) {
  return request("PATCH", `/my-page/secondary-links/${id}/toggle`);
}

export function reorderSecondaryLinks(ids) {
  return request("PATCH", "/my-page/secondary-links/reorder", { ids });
}

export function saveShop(payload) {
  return request("PUT", "/my-page/shop", payload);
}
