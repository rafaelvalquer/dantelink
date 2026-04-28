const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

let authToken = "";
const PUBLIC_VIEW_DEDUP_MS = 30 * 60 * 1000;

export function setApiAuthToken(token = "") {
  authToken = String(token || "").trim();
}

export async function request(method, path, body, { auth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Falha na requisição com status ${response.status}`);
  }

  return data;
}

export function getMyPage() {
  return request("GET", "/my-page", undefined, { auth: true });
}

export function saveMyPageProfile(payload) {
  return request("PUT", "/my-page", payload, { auth: true });
}

export function registerWithPassword(payload) {
  return request("POST", "/auth/register", payload);
}

export function loginWithPassword(payload) {
  return request("POST", "/auth/login", payload);
}

export function getAuthMe() {
  return request("GET", "/auth/me", undefined, { auth: true });
}

export async function uploadMyPageAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/my-page/avatar`, {
    method: "POST",
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : undefined,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Falha no upload com status ${response.status}`);
  }

  return data;
}

async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : undefined,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Falha no upload com status ${response.status}`);
  }

  return data;
}

export function saveMyPageTheme(theme) {
  return request("PUT", "/my-page", { theme }, { auth: true });
}

export function getPublicMyPage(slug) {
  return request("GET", `/my-page/public/${encodeURIComponent(slug)}`);
}

export function getTrackedPublicLinkHref(slug, linkId) {
  return `${API_BASE}/my-page/public/${encodeURIComponent(slug)}/links/${encodeURIComponent(linkId)}/redirect`;
}

export function getTrackedPublicProductHref(slug, productId) {
  return `${API_BASE}/my-page/public/${encodeURIComponent(slug)}/shop/products/${encodeURIComponent(productId)}/redirect`;
}

export function getMyPageAnalytics(range = "7d") {
  return request(
    "GET",
    `/my-page/analytics?range=${encodeURIComponent(range)}`,
    undefined,
    { auth: true },
  );
}

export function getLinkAnalyticsInsight(id, range = "7d") {
  return request(
    "GET",
    `/my-page/analytics/links/${encodeURIComponent(id)}?range=${encodeURIComponent(range)}`,
    undefined,
    { auth: true },
  );
}

export async function trackPublicPageView(slug, { pathname = "", search = "" } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) {
    return;
  }

  const dedupeKey = `dandelink:view:${normalizedSlug}:${pathname || window.location.pathname}`;
  const now = Date.now();
  const previousAt = Number(window.sessionStorage.getItem(dedupeKey) || 0);

  if (previousAt && now - previousAt < PUBLIC_VIEW_DEDUP_MS) {
    return;
  }

  window.sessionStorage.setItem(dedupeKey, String(now));

  const payload = {
    pathname: pathname || window.location.pathname,
    locationSearch: search || window.location.search,
    referrer: document.referrer || "",
  };
  const url = `${API_BASE}/my-page/public/${encodeURIComponent(normalizedSlug)}/view`;

  try {
    if (navigator.sendBeacon) {
      const body = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon(url, body);
      return;
    }
  } catch {
    // Fallback to fetch below.
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Tracking errors should not break the public page.
  }
}

export function createLink(payload) {
  return request("POST", "/my-page/links", payload, { auth: true });
}

export function saveLink(id, payload) {
  return request("PUT", `/my-page/links/${id}`, payload, { auth: true });
}

export function removeLink(id) {
  return request("DELETE", `/my-page/links/${id}`, undefined, { auth: true });
}

export function toggleLink(id) {
  return request("PATCH", `/my-page/links/${id}/toggle`, undefined, { auth: true });
}

export function reorderLinks(ids) {
  return request("PATCH", "/my-page/links/reorder", { ids }, { auth: true });
}

export function searchLocationSuggestions(query) {
  const normalizedQuery = String(query || "").trim();
  return request(
    "GET",
    `/my-page/locations/autocomplete?q=${encodeURIComponent(normalizedQuery)}`,
    undefined,
    { auth: true },
  );
}

export function createSecondaryLink(payload) {
  return request("POST", "/my-page/secondary-links", payload, { auth: true });
}

export function saveSecondaryLink(id, payload) {
  return request("PUT", `/my-page/secondary-links/${id}`, payload, { auth: true });
}

export function removeSecondaryLink(id) {
  return request("DELETE", `/my-page/secondary-links/${id}`, undefined, { auth: true });
}

export function toggleSecondaryLink(id) {
  return request(
    "PATCH",
    `/my-page/secondary-links/${id}/toggle`,
    undefined,
    { auth: true },
  );
}

export function reorderSecondaryLinks(ids) {
  return request("PATCH", "/my-page/secondary-links/reorder", { ids }, { auth: true });
}

export function saveShop(payload) {
  return request("PUT", "/my-page/shop", payload, { auth: true });
}

export function importShopProduct(sourceUrl) {
  return request(
    "POST",
    "/my-page/shop/products/import",
    { sourceUrl },
    { auth: true },
  );
}

export function createShopProduct(payload) {
  return request("POST", "/my-page/shop/products", payload, { auth: true });
}

export function saveShopProduct(id, payload) {
  return request("PUT", `/my-page/shop/products/${id}`, payload, { auth: true });
}

export function removeShopProduct(id) {
  return request("DELETE", `/my-page/shop/products/${id}`, undefined, { auth: true });
}

export function toggleShopProduct(id) {
  return request(
    "PATCH",
    `/my-page/shop/products/${id}/toggle`,
    undefined,
    { auth: true },
  );
}

export function reorderShopProducts(ids) {
  return request("PATCH", "/my-page/shop/products/reorder", { ids }, { auth: true });
}

export function uploadShopProductImage(file) {
  return uploadFile("/my-page/shop/products/image", file);
}

export function internalizeShopProductImage(imageUrl) {
  return request(
    "POST",
    "/my-page/shop/products/image-from-url",
    { imageUrl },
    { auth: true },
  );
}
