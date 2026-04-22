import MyPage from "../models/MyPage.js";
import {
  createLinkId,
  createSecondaryLinkId,
} from "../utils/ids.js";
import {
  normalizeOrder,
  sortByOrder,
} from "../utils/order.js";
import { normalizeSlug } from "../utils/slug.js";

const THEME_DEFAULTS = {
  themePreset: "clean_light",
  brandLayout: "classic",
  backgroundStyle: "fill",
  backgroundGradientDirection: "linear_up",
  backgroundPatternVariant: "grid",
  surfaceStyle: "soft",
  surfacePatternVariant: "grid",
  surfaceColor: "#ffffff",
  buttonColor: "#0f172a",
  buttonTextColor: "#ffffff",
  pageTextColor: "#64748b",
  titleTextColor: "#0f172a",
  fontPreset: "inter",
  buttonStyle: "solid",
  buttonShadow: "none",
  buttonRadius: "round",
  primaryButtonsLayout: "stack",
  secondaryLinksStyle: "icon_text",
  secondaryLinksIconLayout: "brand_badge",
  secondaryLinksSize: "medium",
  secondaryLinksAlign: "center",
  animationPreset: "subtle",
  backgroundColor: "#e2e8f0",
  cardColor: "#ffffff",
  textColor: "#64748b",
};

const LEGACY_BUTTON_STYLE_TO_RADIUS = {
  "rounded-soft": "round",
  "rounded-full": "pill",
  "square-soft": "square",
};

const VALID_THEME_OPTIONS = {
  fontPreset: new Set(["inter", "manrope", "jakarta", "editorial"]),
  buttonStyle: new Set(["solid", "soft", "outline", "glass", "metallic"]),
  buttonShadow: new Set(["none", "soft", "strong", "hard"]),
  buttonRadius: new Set(["square", "round", "pill"]),
};

const PRIMARY_LINK_TYPES = new Set([
  "link",
  "shop-preview",
  "whatsapp",
  "location",
]);
const SECONDARY_LINK_PLATFORMS = new Set([
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "site",
]);
const HANDLE_BASED_PLATFORMS = new Set(["instagram", "youtube", "tiktok"]);
const WHATSAPP_DEFAULT_MESSAGE =
  "Ola! Vim pela sua pagina publica e gostaria de mais informacoes.";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_MIN_INTERVAL_MS = 1100;
let lastNominatimRequestAt = 0;

const SECONDARY_PLATFORM_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  site: "Site",
};

const DEFAULT_PAGE = {
  title: "Mutantwear",
  slug: "mutantwear",
  bio: "Viva a Mutação.",
  avatarUrl: "https://placehold.co/160x160/png?text=MW",
  theme: { ...THEME_DEFAULTS },
  links: [],
  secondaryLinks: [
    {
      id: createSecondaryLinkId(),
      title: "Instagram",
      url: "https://www.instagram.com/use.mutant/",
      isActive: true,
      order: 0,
      platform: "instagram",
      handle: "use.mutant",
    },
  ],
  shop: {
    isActive: true,
    title: "Ver loja completa",
    description: "0 produtos",
    productsCount: 0,
  },
};

function createHttpError(status, message, code, details) {
  const error = new Error(message);
  error.status = status;
  if (code) {
    error.code = code;
  }
  if (details) {
    error.details = details;
  }
  return error;
}

function toPlainObject(value) {
  if (!value) {
    return value;
  }

  return typeof value.toObject === "function" ? value.toObject() : { ...value };
}

function isPrimaryLinkType(value) {
  return PRIMARY_LINK_TYPES.has(String(value || "").trim().toLowerCase());
}

function isSecondaryPlatform(value) {
  return SECONDARY_LINK_PLATFORMS.has(
    String(value || "").trim().toLowerCase(),
  );
}

function isHandlePlatform(platform) {
  return HANDLE_BASED_PLATFORMS.has(String(platform || "").trim().toLowerCase());
}

function getSecondaryPlatformLabel(platform = "") {
  const normalizedPlatform = String(platform || "").trim().toLowerCase();
  return SECONDARY_PLATFORM_LABELS[normalizedPlatform] || "Site";
}

function inferSecondaryPlatform(link = {}) {
  if (isSecondaryPlatform(link.platform)) {
    return String(link.platform).trim().toLowerCase();
  }

  const sample = `${link.title || ""} ${link.url || ""}`.toLowerCase();
  if (sample.includes("instagram")) return "instagram";
  if (sample.includes("facebook")) return "facebook";
  if (sample.includes("tiktok")) return "tiktok";
  if (sample.includes("youtube") || sample.includes("youtu.be")) return "youtube";
  return "site";
}

function extractHandleFromUrl(url = "", platform = "") {
  const sample = String(url || "").trim();
  if (!sample) return "";

  const clean = sample.replace(/[?#].*$/, "").replace(/\/+$/, "");

  if (platform === "instagram") {
    const match = clean.match(/instagram\.com\/([^/?#]+)/i);
    return match ? match[1] : clean.split("/").pop() || "";
  }

  if (platform === "tiktok") {
    const match = clean.match(/tiktok\.com\/@([^/?#]+)/i);
    return match ? match[1] : clean.split("/@").pop()?.split("/")[0] || "";
  }

  if (platform === "youtube") {
    const match = clean.match(/youtube\.com\/@([^/?#]+)/i);
    return match ? match[1] : clean.split("/@").pop()?.split("/")[0] || "";
  }

  return "";
}

function normalizeSecondaryHandle(value = "", platform = "") {
  if (!isHandlePlatform(platform)) return "";

  const sample = String(value || "").trim();
  if (!sample) return "";

  const extracted = sample.includes("http")
    ? extractHandleFromUrl(sample, platform)
    : sample;

  return extracted.replace(/^@+/, "").replace(/\s+/g, "").replace(/\/+$/, "");
}

function buildSecondaryUrl(platform = "", handle = "", fallbackUrl = "") {
  const safeHandle = normalizeSecondaryHandle(handle, platform);

  if (platform === "instagram") {
    return safeHandle ? `https://www.instagram.com/${safeHandle}/` : "";
  }

  if (platform === "tiktok") {
    return safeHandle ? `https://www.tiktok.com/@${safeHandle}` : "";
  }

  if (platform === "youtube") {
    return safeHandle ? `https://www.youtube.com/@${safeHandle}` : "";
  }

  return String(fallbackUrl || "").trim();
}

function normalizePhoneNumber(value = "") {
  return String(value || "").replace(/\D+/g, "");
}

function normalizeWhatsappMessage(value = "") {
  const sample = String(value || "").trim();
  return sample || WHATSAPP_DEFAULT_MESSAGE;
}

function buildWhatsAppUrl(phone = "", message = "") {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return "";

  const normalizedMessage = normalizeWhatsappMessage(message);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(normalizedMessage)}`;
}

function buildLocationUrl(address = "", placeId = "") {
  const safeAddress = String(address || "").trim();
  const fallbackQuery = String(placeId || "").trim();

  if (!safeAddress && !fallbackQuery) return "";

  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("query", safeAddress || fallbackQuery);

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

async function waitForNominatimSlot() {
  const now = Date.now();
  const remaining = NOMINATIM_MIN_INTERVAL_MS - (now - lastNominatimRequestAt);

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  lastNominatimRequestAt = Date.now();
}

function compactParts(parts = []) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .filter((part, index, list) => list.indexOf(part) === index);
}

function formatNominatimSuggestion(item = {}) {
  const address = item?.address || {};
  const street = compactParts([
    address.road,
    address.pedestrian,
    address.cycleway,
    address.footway,
    address.residential,
    item?.name,
    String(item?.display_name || "").split(",")?.[0],
  ])[0] || "";
  const number = String(address.house_number || "").trim();
  const district = compactParts([
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.quarter,
    address.borough,
  ])[0] || "";
  const city = compactParts([
    address.city,
    address.town,
    address.village,
    address.municipality,
  ])[0] || "";
  const mainText = compactParts([street, number]).join(", ");
  const secondaryText = compactParts([district, city]).join(", ");
  const description = compactParts([mainText, secondaryText]).join(", ");

  return {
    description: description || String(item?.display_name || "").trim(),
    placeId: String(item?.place_id || "").trim(),
    mainText: mainText || street || String(item?.display_name || "").split(",")?.[0]?.trim() || "",
    secondaryText,
    lat: String(item?.lat || "").trim(),
    lon: String(item?.lon || "").trim(),
  };
}

function normalizeLink(link = {}, orderFallback = 0) {
  const source = toPlainObject(link) || {};
  const rawType =
    typeof source.type === "string" ? source.type.trim().toLowerCase() : "link";
  const type = isPrimaryLinkType(rawType) ? rawType : "link";
  const title =
    typeof source.title === "string" ? source.title.trim() : "";
  const phone =
    type === "whatsapp" ? normalizePhoneNumber(source.phone) : "";
  const message =
    type === "whatsapp"
      ? normalizeWhatsappMessage(source.message)
      : "";
  const address =
    type === "location" && typeof source.address === "string"
      ? source.address.trim()
      : "";
  const placeId =
    type === "location" && typeof source.placeId === "string"
      ? source.placeId.trim()
      : "";
  const showMap =
    type === "location" ? source.showMap === true : false;
  let url =
    typeof source.url === "string" ? source.url.trim() : "";

  if (type === "whatsapp") {
    url = buildWhatsAppUrl(phone, message);
  } else if (type === "location") {
    url = buildLocationUrl(address, placeId);
  }

  return {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : createLinkId(),
    title,
    url,
    phone,
    message,
    address,
    placeId,
    showMap,
    isActive: source.isActive !== false,
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : orderFallback,
    type,
  };
}

function normalizeLinks(links = []) {
  return normalizeOrder(links).map((link, index) => normalizeLink(link, index));
}

function normalizeSecondaryLink(link = {}, orderFallback = 0) {
  const source = toPlainObject(link) || {};
  const platform = inferSecondaryPlatform(source);
  const handle = normalizeSecondaryHandle(source.handle || source.url || "", platform);
  const url = buildSecondaryUrl(platform, handle, source.url);
  const title = typeof source.title === "string" && source.title.trim()
    ? source.title.trim()
    : getSecondaryPlatformLabel(platform);

  return {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : createSecondaryLinkId(),
    platform,
    title,
    url,
    handle,
    isActive: source.isActive !== false,
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : orderFallback,
  };
}

function buildSecondaryLinkSignature(link = {}) {
  return [
    String(link.platform || "").trim().toLowerCase(),
    String(link.handle || "").trim().toLowerCase(),
    String(link.url || "").trim().toLowerCase(),
    String(link.title || "").trim().toLowerCase(),
  ].join("::");
}

function normalizeSecondaryLinks(links = []) {
  const dedupe = new Set();

  return normalizeOrder(links)
    .map((link, index) => normalizeSecondaryLink(link, index))
    .filter((link) => {
      const signature = buildSecondaryLinkSignature(link);
      if (dedupe.has(signature)) {
        return false;
      }
      dedupe.add(signature);
      return true;
    })
    .map((link, index) => ({ ...link, order: index }));
}

function reorderExistingItemsPreservingIdentity(items = [], ids = [], label = "items") {
  const currentItems = (items || []).map((item) => toPlainObject(item));
  const requestedIds = [];
  const requestedIdSet = new Set();

  (ids || []).forEach((itemId) => {
    const normalizedId = String(itemId || "").trim();
    if (!normalizedId || requestedIdSet.has(normalizedId)) {
      return;
    }

    requestedIds.push(normalizedId);
    requestedIdSet.add(normalizedId);
  });

  const itemMap = new Map();
  const missingIdItems = [];

  currentItems.forEach((item) => {
    const normalizedId = String(item?.id || "").trim();

    if (!normalizedId) {
      missingIdItems.push(item);
      return;
    }

    if (!itemMap.has(normalizedId)) {
      itemMap.set(normalizedId, item);
    }
  });

  if (missingIdItems.length) {
    console.warn(
      `[my-page] reorder for ${label} encontrou item sem id estavel; nenhum novo id foi gerado durante a operacao.`,
    );
  }

  const selected = requestedIds
    .map((itemId) => itemMap.get(itemId))
    .filter(Boolean);
  const remaining = currentItems.filter((item) => {
    const normalizedId = String(item?.id || "").trim();
    return !normalizedId || !requestedIdSet.has(normalizedId);
  });

  return [...selected, ...sortByOrder(remaining)].map((item, index) => ({
    ...item,
    order: index,
  }));
}

function normalizeTheme(theme = {}) {
  const normalizedTheme = toPlainObject(theme) || {};
  const legacyRadius =
    LEGACY_BUTTON_STYLE_TO_RADIUS[normalizedTheme.buttonStyle] || null;
  const surfaceColor = normalizedTheme.surfaceColor || normalizedTheme.cardColor;
  const pageTextColor =
    normalizedTheme.pageTextColor || normalizedTheme.textColor;
  const titleTextColor =
    normalizedTheme.titleTextColor || normalizedTheme.textColor;

  return {
    ...THEME_DEFAULTS,
    ...normalizedTheme,
    backgroundColor:
      typeof normalizedTheme.backgroundColor === "string" &&
      normalizedTheme.backgroundColor.trim()
        ? normalizedTheme.backgroundColor.trim()
        : THEME_DEFAULTS.backgroundColor,
    surfaceColor:
      typeof surfaceColor === "string" && surfaceColor.trim()
        ? surfaceColor.trim()
        : THEME_DEFAULTS.surfaceColor,
    buttonColor:
      typeof normalizedTheme.buttonColor === "string" &&
      normalizedTheme.buttonColor.trim()
        ? normalizedTheme.buttonColor.trim()
        : THEME_DEFAULTS.buttonColor,
    buttonTextColor:
      typeof normalizedTheme.buttonTextColor === "string" &&
      normalizedTheme.buttonTextColor.trim()
        ? normalizedTheme.buttonTextColor.trim()
        : THEME_DEFAULTS.buttonTextColor,
    pageTextColor:
      typeof pageTextColor === "string" && pageTextColor.trim()
        ? pageTextColor.trim()
        : THEME_DEFAULTS.pageTextColor,
    titleTextColor:
      typeof titleTextColor === "string" && titleTextColor.trim()
        ? titleTextColor.trim()
        : THEME_DEFAULTS.titleTextColor,
    fontPreset:
      typeof normalizedTheme.fontPreset === "string" &&
      VALID_THEME_OPTIONS.fontPreset.has(normalizedTheme.fontPreset.trim())
        ? normalizedTheme.fontPreset.trim()
        : THEME_DEFAULTS.fontPreset,
    buttonStyle: legacyRadius
      ? THEME_DEFAULTS.buttonStyle
      : typeof normalizedTheme.buttonStyle === "string" &&
          VALID_THEME_OPTIONS.buttonStyle.has(normalizedTheme.buttonStyle.trim())
        ? normalizedTheme.buttonStyle.trim()
        : THEME_DEFAULTS.buttonStyle,
    buttonShadow:
      typeof normalizedTheme.buttonShadow === "string" &&
      VALID_THEME_OPTIONS.buttonShadow.has(normalizedTheme.buttonShadow.trim())
        ? normalizedTheme.buttonShadow.trim()
        : THEME_DEFAULTS.buttonShadow,
    buttonRadius:
      typeof normalizedTheme.buttonRadius === "string" &&
      VALID_THEME_OPTIONS.buttonRadius.has(normalizedTheme.buttonRadius.trim())
        ? normalizedTheme.buttonRadius.trim()
        : legacyRadius || THEME_DEFAULTS.buttonRadius,
    cardColor:
      typeof surfaceColor === "string" && surfaceColor.trim()
        ? surfaceColor.trim()
        : THEME_DEFAULTS.surfaceColor,
    textColor:
      typeof pageTextColor === "string" && pageTextColor.trim()
        ? pageTextColor.trim()
        : THEME_DEFAULTS.pageTextColor,
  };
}

function serializePage(pageDocument) {
  const page = toPlainObject(pageDocument);

  return {
    ...page,
    theme: normalizeTheme(page.theme || {}),
    links: normalizeLinks(page.links || []),
    secondaryLinks: normalizeSecondaryLinks(page.secondaryLinks || []),
  };
}

async function ensureUniqueSlug(slug, excludeId) {
  const query = { slug };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await MyPage.findOne(query).lean();

  if (existing) {
    throw createHttpError(409, "Slug já está em uso.", "SLUG_ALREADY_EXISTS");
  }
}

function getNormalizedLinkSets(page = {}) {
  const currentLinks = (page.links || []).map((link) => toPlainObject(link));
  const currentSecondaryLinks = (page.secondaryLinks || []).map((link) =>
    toPlainObject(link),
  );
  const legacySocialLinks = currentLinks.filter(
    (link) => String(link?.type || "").trim().toLowerCase() === "social",
  );
  const primaryLinks = currentLinks.filter(
    (link) => String(link?.type || "").trim().toLowerCase() !== "social",
  );

  return {
    links: normalizeLinks(primaryLinks),
    secondaryLinks: normalizeSecondaryLinks([
      ...currentSecondaryLinks,
      ...legacySocialLinks,
    ]),
  };
}

function applyDocumentNormalization(page) {
  const next = getNormalizedLinkSets(page);
  const currentLinks = JSON.stringify((page.links || []).map((link) => toPlainObject(link)));
  const currentSecondaryLinks = JSON.stringify(
    (page.secondaryLinks || []).map((link) => toPlainObject(link)),
  );
  const nextLinks = JSON.stringify(next.links);
  const nextSecondaryLinks = JSON.stringify(next.secondaryLinks);
  const changed =
    currentLinks !== nextLinks || currentSecondaryLinks !== nextSecondaryLinks;

  page.links = next.links;
  page.secondaryLinks = next.secondaryLinks;

  return changed;
}

async function persistNormalizedPage(page) {
  const changed = applyDocumentNormalization(page);
  if (changed) {
    await page.save();
  }
  return page;
}

async function getMainPageDocument() {
  let page = await MyPage.findOne().sort({ createdAt: 1 });

  if (!page) {
    page = await MyPage.create(DEFAULT_PAGE);
  }

  return persistNormalizedPage(page);
}

function findLinkIndex(page, id) {
  return (page.links || []).findIndex((link) => String(link.id) === String(id));
}

function findSecondaryLinkIndex(page, id) {
  return (page.secondaryLinks || []).findIndex(
    (link) => String(link.id) === String(id),
  );
}

function sanitizeProfilePayload(payload = {}) {
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    slug: typeof payload.slug === "string" ? normalizeSlug(payload.slug) : undefined,
    bio: typeof payload.bio === "string" ? payload.bio.trim() : undefined,
    avatarUrl:
      typeof payload.avatarUrl === "string" ? payload.avatarUrl.trim() : undefined,
  };
}

function sanitizeThemePayload(payload = {}) {
  const updates = {};

  for (const key of [
    "themePreset",
    "brandLayout",
    "backgroundStyle",
    "backgroundGradientDirection",
    "backgroundPatternVariant",
    "surfaceStyle",
    "surfacePatternVariant",
    "surfaceColor",
    "buttonColor",
    "buttonTextColor",
    "pageTextColor",
    "titleTextColor",
    "fontPreset",
    "buttonShadow",
    "buttonRadius",
    "primaryButtonsLayout",
    "secondaryLinksStyle",
    "secondaryLinksIconLayout",
    "secondaryLinksSize",
    "secondaryLinksAlign",
    "animationPreset",
    "backgroundColor",
    "cardColor",
    "textColor",
  ]) {
    if (typeof payload[key] === "string") {
      updates[key] = payload[key].trim();
    }
  }

  if (typeof payload.buttonStyle === "string") {
    const buttonStyle = payload.buttonStyle.trim();
    const legacyRadius = LEGACY_BUTTON_STYLE_TO_RADIUS[buttonStyle];
    if (legacyRadius) {
      updates.buttonRadius = legacyRadius;
    } else {
      updates.buttonStyle = buttonStyle;
    }
  }

  if (updates.cardColor && !updates.surfaceColor) {
    updates.surfaceColor = updates.cardColor;
  }

  if (updates.textColor) {
    if (!updates.pageTextColor) {
      updates.pageTextColor = updates.textColor;
    }
    if (!updates.titleTextColor) {
      updates.titleTextColor = updates.textColor;
    }
  }

  return updates;
}

function sanitizeLinkPayload(payload = {}) {
  const rawType =
    typeof payload.type === "string" ? payload.type.trim().toLowerCase() : undefined;

  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    url: typeof payload.url === "string" ? payload.url.trim() : undefined,
    phone: typeof payload.phone === "string" ? payload.phone.trim() : undefined,
    message:
      typeof payload.message === "string" ? payload.message.trim() : undefined,
    address:
      typeof payload.address === "string" ? payload.address.trim() : undefined,
    placeId:
      typeof payload.placeId === "string" ? payload.placeId.trim() : undefined,
    showMap:
      typeof payload.showMap === "boolean" ? payload.showMap : undefined,
    isActive:
      typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    type: isPrimaryLinkType(rawType) ? rawType : undefined,
  };
}

function sanitizeSecondaryLinkPayload(payload = {}) {
  const rawPlatform =
    typeof payload.platform === "string"
      ? payload.platform.trim().toLowerCase()
      : undefined;

  return {
    platform: isSecondaryPlatform(rawPlatform) ? rawPlatform : undefined,
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    url: typeof payload.url === "string" ? payload.url.trim() : undefined,
    handle: typeof payload.handle === "string" ? payload.handle.trim() : undefined,
    isActive:
      typeof payload.isActive === "boolean" ? payload.isActive : undefined,
  };
}

function sanitizeShopPayload(payload = {}) {
  return {
    isActive:
      typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    description:
      typeof payload.description === "string"
        ? payload.description.trim()
        : undefined,
    productsCount:
      typeof payload.productsCount === "number"
        ? payload.productsCount
        : Number.isFinite(Number(payload.productsCount))
          ? Number(payload.productsCount)
          : undefined,
  };
}

export async function getMyPage() {
  const page = await getMainPageDocument();
  return serializePage(page);
}

export async function updateMyPage(payload = {}) {
  const page = await getMainPageDocument();
  const updates = sanitizeProfilePayload(payload);

  if (Object.hasOwn(payload, "slug")) {
    if (!updates.slug) {
      throw createHttpError(400, "O slug não pode ficar vazio.", "INVALID_SLUG");
    }

    await ensureUniqueSlug(updates.slug, page._id);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      page[key] = value;
    }
  }

  await page.save();
  return serializePage(page);
}

export async function updateTheme(payload = {}) {
  const page = await getMainPageDocument();
  const updates = sanitizeThemePayload(payload);

  page.theme = normalizeTheme({
    ...normalizeTheme(page.theme || {}),
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  });

  await page.save();
  return serializePage(page);
}

export async function createLink(payload = {}) {
  const page = await getMainPageDocument();
  const data = sanitizeLinkPayload(payload);

  page.links.push(normalizeLink({
    id: createLinkId(),
    title: data.title || "",
    url: data.url || "",
    phone: data.phone || "",
    message: data.message || "",
    address: data.address || "",
    placeId: data.placeId || "",
    showMap: data.showMap ?? false,
    isActive: data.isActive ?? true,
    order: page.links.length,
    type: data.type || "link",
  }, page.links.length));

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function updateLink(id, payload = {}) {
  const page = await getMainPageDocument();
  const linkIndex = findLinkIndex(page, id);

  if (linkIndex === -1) {
    throw createHttpError(404, "Link não encontrado.", "LINK_NOT_FOUND");
  }

  const currentLink = toPlainObject(page.links[linkIndex]);
  const updates = sanitizeLinkPayload(payload);

  page.links[linkIndex] = normalizeLink(
    {
      ...currentLink,
      ...Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined),
      ),
    },
    currentLink.order ?? linkIndex,
  );

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function deleteLink(id) {
  const page = await getMainPageDocument();
  const nextLinks = (page.links || []).filter(
    (link) => String(link.id) !== String(id),
  );

  if (nextLinks.length === (page.links || []).length) {
    throw createHttpError(404, "Link não encontrado.", "LINK_NOT_FOUND");
  }

  page.links = normalizeLinks(nextLinks.map((link) => toPlainObject(link)));
  await page.save();
  return serializePage(page);
}

export async function toggleLink(id) {
  const page = await getMainPageDocument();
  const linkIndex = findLinkIndex(page, id);

  if (linkIndex === -1) {
    throw createHttpError(404, "Link não encontrado.", "LINK_NOT_FOUND");
  }

  const currentLink = toPlainObject(page.links[linkIndex]);
  page.links[linkIndex] = {
    ...currentLink,
    isActive: !currentLink.isActive,
  };

  await page.save();
  return serializePage(page);
}

export async function reorderLinks(ids = []) {
  const page = await getMainPageDocument();

  page.links = reorderExistingItemsPreservingIdentity(
    page.links || [],
    ids,
    "links",
  );
  await page.save();
  return serializePage(page);
}

export async function createSecondaryLink(payload = {}) {
  const page = await getMainPageDocument();
  const data = sanitizeSecondaryLinkPayload(payload);

  page.secondaryLinks.push({
    id: createSecondaryLinkId(),
    platform: data.platform || "instagram",
    title: data.title || getSecondaryPlatformLabel(data.platform || "instagram"),
    url: data.url || "",
    handle: data.handle || "",
    isActive: data.isActive ?? true,
    order: page.secondaryLinks.length,
  });

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function updateSecondaryLink(id, payload = {}) {
  const page = await getMainPageDocument();
  const linkIndex = findSecondaryLinkIndex(page, id);

  if (linkIndex === -1) {
    throw createHttpError(
      404,
      "Link secundario nao encontrado.",
      "SECONDARY_LINK_NOT_FOUND",
    );
  }

  const currentLink = toPlainObject(page.secondaryLinks[linkIndex]);
  const updates = sanitizeSecondaryLinkPayload(payload);

  page.secondaryLinks[linkIndex] = {
    ...currentLink,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  };

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function deleteSecondaryLink(id) {
  const page = await getMainPageDocument();
  const nextLinks = (page.secondaryLinks || []).filter(
    (link) => String(link.id) !== String(id),
  );

  if (nextLinks.length === (page.secondaryLinks || []).length) {
    throw createHttpError(
      404,
      "Link secundario nao encontrado.",
      "SECONDARY_LINK_NOT_FOUND",
    );
  }

  page.secondaryLinks = normalizeSecondaryLinks(
    nextLinks.map((link) => toPlainObject(link)),
  );
  await page.save();
  return serializePage(page);
}

export async function toggleSecondaryLink(id) {
  const page = await getMainPageDocument();
  const linkIndex = findSecondaryLinkIndex(page, id);

  if (linkIndex === -1) {
    throw createHttpError(
      404,
      "Link secundario nao encontrado.",
      "SECONDARY_LINK_NOT_FOUND",
    );
  }

  const currentLink = toPlainObject(page.secondaryLinks[linkIndex]);
  page.secondaryLinks[linkIndex] = {
    ...currentLink,
    isActive: !currentLink.isActive,
  };

  await page.save();
  return serializePage(page);
}

export async function reorderSecondaryLinks(ids = []) {
  const page = await getMainPageDocument();

  page.secondaryLinks = reorderExistingItemsPreservingIdentity(
    page.secondaryLinks || [],
    ids,
    "secondaryLinks",
  );
  await page.save();
  return serializePage(page);
}

export async function updateShop(payload = {}) {
  const page = await getMainPageDocument();
  const updates = sanitizeShopPayload(payload);

  page.shop = {
    ...toPlainObject(page.shop),
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  };

  await page.save();
  return serializePage(page);
}

export async function searchLocationSuggestions(query = "") {
  const normalizedQuery = String(query || "").trim();

  if (normalizedQuery.length < 3) {
    return [];
  }

  await waitForNominatimSlot();

  const params = new URLSearchParams({
    q: normalizedQuery,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    countrycodes: "br",
    "accept-language": "pt-BR",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "dandelink/1.0 (admin address search)",
      "Accept-Language": "pt-BR",
    },
  });

  if (!response.ok) {
    throw createHttpError(
      502,
      "Falha ao consultar o servico de busca de enderecos.",
      "NOMINATIM_REQUEST_FAILED",
    );
  }

  const payload = await response.json();

  if (!Array.isArray(payload) || !payload.length) {
    return [];
  }

  return payload.map((item) => formatNominatimSuggestion(item));
}

export async function getPublicMyPageBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw createHttpError(400, "Slug inválido.", "INVALID_SLUG");
  }

  const page = await MyPage.findOne({ slug: normalizedSlug });

  if (!page) {
    throw createHttpError(404, "Página pública não encontrada.", "PUBLIC_PAGE_NOT_FOUND");
  }

  await persistNormalizedPage(page);

  const publicPage = serializePage(page);

  return {
    title: publicPage.title,
    slug: publicPage.slug,
    bio: publicPage.bio,
    avatarUrl: publicPage.avatarUrl,
    theme: publicPage.theme,
    links: sortByOrder(publicPage.links || []).filter((link) => link.isActive),
    secondaryLinks: sortByOrder(publicPage.secondaryLinks || []).filter(
      (link) => link.isActive,
    ),
    shop: publicPage.shop?.isActive ? publicPage.shop : null,
  };
}
