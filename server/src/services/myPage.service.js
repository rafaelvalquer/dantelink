import MyPage from "../models/MyPage.js";
import {
  createCollectionId,
  createCollectionItemId,
  createLinkId,
} from "../utils/ids.js";
import {
  applyOrderByIds,
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
  buttonShadow: "soft",
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

const SOCIAL_PLATFORMS = new Set(["instagram", "facebook", "youtube", "tiktok"]);

const DEFAULT_PAGE = {
  title: "Mutantwear",
  slug: "mutantwear",
  bio: "Viva a Mutação.",
  avatarUrl: "https://placehold.co/160x160/png?text=MW",
  theme: { ...THEME_DEFAULTS },
  links: [
    {
      id: createLinkId(),
      title: "Instagram",
      url: "https://www.instagram.com/use.mutant/",
      isActive: true,
      order: 0,
      type: "social",
      platform: "instagram",
      handle: "use.mutant",
    },
  ],
  collections: [
    {
      id: createCollectionId(),
      title: "teste",
      isActive: false,
      order: 0,
      items: [],
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

function isSocialPlatform(value) {
  return SOCIAL_PLATFORMS.has(String(value || "").trim().toLowerCase());
}

function inferSocialPlatform(link = {}) {
  if (isSocialPlatform(link.platform)) {
    return String(link.platform).trim().toLowerCase();
  }

  const sample = `${link.title || ""} ${link.url || ""}`.toLowerCase();
  if (sample.includes("instagram")) return "instagram";
  if (sample.includes("facebook")) return "facebook";
  if (sample.includes("tiktok")) return "tiktok";
  if (sample.includes("youtube") || sample.includes("youtu.be")) return "youtube";
  return "";
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

function normalizeSocialHandle(value = "", platform = "") {
  const sample = String(value || "").trim();
  if (!sample || platform === "facebook") return "";

  const extracted = sample.includes("http")
    ? extractHandleFromUrl(sample, platform)
    : sample;

  return extracted.replace(/^@+/, "").replace(/\s+/g, "").replace(/\/+$/, "");
}

function buildSocialUrl(platform = "", handle = "", fallbackUrl = "") {
  const safeHandle = normalizeSocialHandle(handle, platform);

  if (platform === "instagram") {
    return safeHandle ? `https://www.instagram.com/${safeHandle}/` : "";
  }

  if (platform === "tiktok") {
    return safeHandle ? `https://www.tiktok.com/@${safeHandle}` : "";
  }

  if (platform === "youtube") {
    return safeHandle ? `https://www.youtube.com/@${safeHandle}` : "";
  }

  if (platform === "facebook") {
    return String(fallbackUrl || "").trim();
  }

  return String(fallbackUrl || "").trim();
}

function normalizeLink(link = {}, orderFallback = 0) {
  const source = toPlainObject(link) || {};
  const type = typeof source.type === "string" && source.type.trim()
    ? source.type.trim()
    : "link";
  const title = typeof source.title === "string" && source.title.trim()
    ? source.title.trim()
    : "Novo link";
  const platform = type === "social" ? inferSocialPlatform(source) : "";
  const handle =
    type === "social" && platform && platform !== "facebook"
      ? normalizeSocialHandle(source.handle || source.url || "", platform)
      : "";
  const url =
    type === "social"
      ? buildSocialUrl(platform, handle, source.url)
      : typeof source.url === "string"
        ? source.url.trim()
        : "";

  return {
    id: source.id,
    title,
    url,
    isActive: source.isActive !== false,
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : orderFallback,
    type,
    platform,
    handle,
  };
}

function normalizeLinks(links = []) {
  return normalizeOrder(links).map((link, index) => normalizeLink(link, index));
}

function normalizeCollections(collections = []) {
  return normalizeOrder(collections).map((collection) => ({
    ...collection,
    items: normalizeOrder(collection.items || []),
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
    buttonStyle: legacyRadius
      ? THEME_DEFAULTS.buttonStyle
      : typeof normalizedTheme.buttonStyle === "string" &&
          normalizedTheme.buttonStyle.trim()
        ? normalizedTheme.buttonStyle.trim()
        : THEME_DEFAULTS.buttonStyle,
    buttonRadius:
      typeof normalizedTheme.buttonRadius === "string" &&
      normalizedTheme.buttonRadius.trim()
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
    collections: normalizeCollections(page.collections || []),
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

function applyDocumentNormalization(page) {
  page.links = normalizeLinks((page.links || []).map((link) => toPlainObject(link)));
  page.collections = normalizeCollections(
    (page.collections || []).map((collection) => toPlainObject(collection)),
  );
  return page;
}

async function getMainPageDocument() {
  let page = await MyPage.findOne().sort({ createdAt: 1 });

  if (!page) {
    page = await MyPage.create(DEFAULT_PAGE);
  }

  return page;
}

function findLinkIndex(page, id) {
  return (page.links || []).findIndex((link) => String(link.id) === String(id));
}

function findCollectionIndex(page, id) {
  return (page.collections || []).findIndex(
    (collection) => String(collection.id) === String(id),
  );
}

function findCollectionItemIndex(collection, itemId) {
  return (collection.items || []).findIndex(
    (item) => String(item.id) === String(itemId),
  );
}

function ensureCollection(page, collectionId) {
  const collectionIndex = findCollectionIndex(page, collectionId);

  if (collectionIndex === -1) {
    throw createHttpError(404, "Coleção não encontrada.", "COLLECTION_NOT_FOUND");
  }

  return {
    collectionIndex,
    collection: page.collections[collectionIndex],
  };
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
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    url: typeof payload.url === "string" ? payload.url.trim() : undefined,
    isActive:
      typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    type: typeof payload.type === "string" ? payload.type.trim() : undefined,
    platform:
      typeof payload.platform === "string" ? payload.platform.trim().toLowerCase() : undefined,
    handle: typeof payload.handle === "string" ? payload.handle.trim() : undefined,
  };
}

function sanitizeCollectionPayload(payload = {}) {
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    isActive:
      typeof payload.isActive === "boolean" ? payload.isActive : undefined,
  };
}

function sanitizeCollectionItemPayload(payload = {}) {
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    url: typeof payload.url === "string" ? payload.url.trim() : undefined,
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

  page.links.push({
    id: createLinkId(),
    title: data.title || "Novo link",
    url: data.url || "",
    isActive: data.isActive ?? true,
    order: page.links.length,
    type: data.type || "link",
    platform: data.type === "social" ? data.platform || "" : "",
    handle: data.type === "social" ? data.handle || "" : "",
  });

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

  page.links[linkIndex] = {
    ...currentLink,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  };

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

  page.links = normalizeOrder(nextLinks.map((link) => toPlainObject(link)));
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

  page.links = applyOrderByIds(
    (page.links || []).map((link) => toPlainObject(link)),
    ids,
  );

  await page.save();
  return serializePage(page);
}

export async function createCollection(payload = {}) {
  const page = await getMainPageDocument();
  const data = sanitizeCollectionPayload(payload);

  page.collections.push({
    id: createCollectionId(),
    title: data.title || "Nova coleção",
    isActive: data.isActive ?? true,
    order: page.collections.length,
    items: [],
  });

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function updateCollection(id, payload = {}) {
  const page = await getMainPageDocument();
  const collectionIndex = findCollectionIndex(page, id);

  if (collectionIndex === -1) {
    throw createHttpError(404, "Coleção não encontrada.", "COLLECTION_NOT_FOUND");
  }

  const currentCollection = toPlainObject(page.collections[collectionIndex]);
  const updates = sanitizeCollectionPayload(payload);

  page.collections[collectionIndex] = {
    ...currentCollection,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  };

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function deleteCollection(id) {
  const page = await getMainPageDocument();
  const nextCollections = (page.collections || []).filter(
    (collection) => String(collection.id) !== String(id),
  );

  if (nextCollections.length === (page.collections || []).length) {
    throw createHttpError(404, "Coleção não encontrada.", "COLLECTION_NOT_FOUND");
  }

  page.collections = normalizeCollections(
    nextCollections.map((collection) => toPlainObject(collection)),
  );

  await page.save();
  return serializePage(page);
}

export async function toggleCollection(id) {
  const page = await getMainPageDocument();
  const collectionIndex = findCollectionIndex(page, id);

  if (collectionIndex === -1) {
    throw createHttpError(404, "Coleção não encontrada.", "COLLECTION_NOT_FOUND");
  }

  const currentCollection = toPlainObject(page.collections[collectionIndex]);
  page.collections[collectionIndex] = {
    ...currentCollection,
    isActive: !currentCollection.isActive,
  };

  await page.save();
  return serializePage(page);
}

export async function reorderCollections(ids = []) {
  const page = await getMainPageDocument();
  const orderedCollections = applyOrderByIds(
    (page.collections || []).map((collection) => toPlainObject(collection)),
    ids,
  );

  page.collections = normalizeCollections(orderedCollections);
  await page.save();
  return serializePage(page);
}

export async function createCollectionItem(collectionId, payload = {}) {
  const page = await getMainPageDocument();
  const { collectionIndex, collection } = ensureCollection(page, collectionId);
  const data = sanitizeCollectionItemPayload(payload);
  const collectionPlain = toPlainObject(collection);

  page.collections[collectionIndex] = {
    ...collectionPlain,
    items: normalizeOrder([
      ...(collectionPlain.items || []),
      {
        id: createCollectionItemId(),
        title: data.title || "Novo item",
        url: data.url || "",
        isActive: data.isActive ?? true,
        order: (collectionPlain.items || []).length,
      },
    ]),
  };

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function updateCollectionItem(collectionId, itemId, payload = {}) {
  const page = await getMainPageDocument();
  const { collectionIndex, collection } = ensureCollection(page, collectionId);
  const collectionPlain = toPlainObject(collection);
  const itemIndex = findCollectionItemIndex(collectionPlain, itemId);

  if (itemIndex === -1) {
    throw createHttpError(
      404,
      "Item da coleção não encontrado.",
      "COLLECTION_ITEM_NOT_FOUND",
    );
  }

  const updates = sanitizeCollectionItemPayload(payload);
  const currentItem = toPlainObject(collectionPlain.items[itemIndex]);
  const nextItems = [...(collectionPlain.items || [])];

  nextItems[itemIndex] = {
    ...currentItem,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  };

  page.collections[collectionIndex] = {
    ...collectionPlain,
    items: normalizeOrder(nextItems),
  };

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function deleteCollectionItem(collectionId, itemId) {
  const page = await getMainPageDocument();
  const { collectionIndex, collection } = ensureCollection(page, collectionId);
  const collectionPlain = toPlainObject(collection);
  const nextItems = (collectionPlain.items || []).filter(
    (item) => String(item.id) !== String(itemId),
  );

  if (nextItems.length === (collectionPlain.items || []).length) {
    throw createHttpError(
      404,
      "Item da coleção não encontrado.",
      "COLLECTION_ITEM_NOT_FOUND",
    );
  }

  page.collections[collectionIndex] = {
    ...collectionPlain,
    items: normalizeOrder(nextItems),
  };

  applyDocumentNormalization(page);
  await page.save();
  return serializePage(page);
}

export async function reorderCollectionItems(collectionId, ids = []) {
  const page = await getMainPageDocument();
  const { collectionIndex, collection } = ensureCollection(page, collectionId);
  const collectionPlain = toPlainObject(collection);

  page.collections[collectionIndex] = {
    ...collectionPlain,
    items: applyOrderByIds(
      (collectionPlain.items || []).map((item) => toPlainObject(item)),
      ids,
    ),
  };

  applyDocumentNormalization(page);
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

export async function getPublicMyPageBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw createHttpError(400, "Slug inválido.", "INVALID_SLUG");
  }

  const page = await MyPage.findOne({ slug: normalizedSlug });

  if (!page) {
    throw createHttpError(404, "Página pública não encontrada.", "PUBLIC_PAGE_NOT_FOUND");
  }

  const publicPage = serializePage(page);

  return {
    title: publicPage.title,
    slug: publicPage.slug,
    bio: publicPage.bio,
    avatarUrl: publicPage.avatarUrl,
    theme: publicPage.theme,
    links: sortByOrder(publicPage.links || []).filter((link) => link.isActive),
    collections: sortByOrder(publicPage.collections || [])
      .filter((collection) => collection.isActive)
      .map((collection) => ({
        ...collection,
        items: sortByOrder(collection.items || []).filter((item) => item.isActive),
      })),
    shop: publicPage.shop?.isActive ? publicPage.shop : null,
  };
}
