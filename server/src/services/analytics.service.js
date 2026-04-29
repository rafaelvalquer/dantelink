import MyPage from "../models/MyPage.js";
import MyPageAnalyticsDaily from "../models/MyPageAnalyticsDaily.js";
import { normalizeSlug } from "../utils/slug.js";

const APP_TIMEZONE = "America/Sao_Paulo";
const ORIGIN_LABELS = [
  "Direto",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Google",
  "X",
  "Telegram",
  "E-mail",
  "Outros",
];
const RANGE_CONFIG = {
  "7d": 7,
  "28d": 28,
  lifetime: null,
};

function formatDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateKeysForRange(range = "7d") {
  const totalDays = RANGE_CONFIG[range];

  if (!totalDays) {
    return [];
  }

  const keys = [];
  const now = new Date();

  for (let index = totalDays - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    keys.push(formatDateKey(date));
  }

  return keys;
}

function extractUtmSource(urlValue = "") {
  const sample = String(urlValue || "").trim();
  if (!sample) {
    return "";
  }

  try {
    const parsed = sample.startsWith("http")
      ? new URL(sample)
      : new URL(sample, "https://dandelink.local");

    return String(parsed.searchParams.get("utm_source") || "").trim();
  } catch {
    return "";
  }
}

function classifyOriginFromSource(source = "") {
  const normalized = String(source || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("instagram")) return "Instagram";
  if (normalized.includes("facebook")) return "Facebook";
  if (normalized.includes("whatsapp")) return "WhatsApp";
  if (normalized.includes("tiktok")) return "TikTok";
  if (normalized.includes("youtube")) return "YouTube";
  if (normalized.includes("linkedin")) return "LinkedIn";
  if (normalized === "x" || normalized.includes("twitter")) return "X";
  if (normalized.includes("telegram")) return "Telegram";
  if (normalized.includes("email") || normalized.includes("mail")) return "E-mail";
  if (normalized.includes("google")) return "Google";
  return "Outros";
}

function classifyOriginFromReferrer(referrer = "") {
  const sample = String(referrer || "").trim();
  if (!sample) {
    return "Direto";
  }

  try {
    const hostname = new URL(sample).hostname.replace(/^www\./i, "").toLowerCase();
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("facebook")) return "Facebook";
    if (hostname.includes("whatsapp")) return "WhatsApp";
    if (hostname.includes("tiktok")) return "TikTok";
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("google")) return "Google";
    if (hostname === "x.com" || hostname.includes("twitter")) return "X";
    if (hostname.includes("telegram") || hostname.includes("t.me")) return "Telegram";
    if (hostname.includes("mail.")) return "E-mail";
    return "Outros";
  } catch {
    return "Direto";
  }
}

function resolveOrigin({ locationSearch = "", referrer = "", refererHeader = "" } = {}) {
  const utmSource =
    extractUtmSource(locationSearch)
    || extractUtmSource(refererHeader)
    || extractUtmSource(referrer);

  if (utmSource) {
    return classifyOriginFromSource(utmSource);
  }

  return classifyOriginFromReferrer(referrer || refererHeader);
}

function toPlainMetric(metric = null) {
  return {
    total: Number(metric?.total || 0),
    byOrigin: Object.fromEntries(
      Object.entries(metric?.byOrigin || {}).map(([key, value]) => [key, Number(value || 0)]),
    ),
  };
}

function normalizeRange(range = "7d") {
  return Object.hasOwn(RANGE_CONFIG, range) ? range : "7d";
}

function toMetricMap(metricMap = {}) {
  if (metricMap instanceof Map) {
    return Object.fromEntries(metricMap.entries());
  }
  return Object(metricMap || {});
}

async function getPageBySlug(slug = "") {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw createHttpError(400, "Slug inválido.", "INVALID_SLUG");
  }

  const page = await MyPage.findOne({ slug: normalizedSlug });

  if (!page) {
    throw createHttpError(404, "Página pública não encontrada.", "PUBLIC_PAGE_NOT_FOUND");
  }

  return page;
}

async function getPageByOwnerId(ownerId) {
  const page = await MyPage.findOne({ ownerId });

  if (!page) {
    throw createHttpError(404, "Página não encontrada.", "PAGE_NOT_FOUND");
  }

  return page;
}

async function incrementDailyMetric(page, operations = {}) {
  const dateKey = formatDateKey(new Date());
  const update = {
    $setOnInsert: {
      pageId: page._id,
      ownerId: page.ownerId,
      dateKey,
    },
    $inc: operations,
  };

  await MyPageAnalyticsDaily.updateOne(
    { pageId: page._id, dateKey },
    update,
    { upsert: true },
  );
}

function getPrimaryLinkHref(page, link = {}) {
  if (String(link?.type || "").trim().toLowerCase() === "shop-preview") {
    return page?.slug ? `/${page.slug}/shop` : "/minha-página/shop";
  }

  return String(link?.url || "").trim();
}

function getLinkById(page, id) {
  return (page.links || []).find((link) => String(link.id) === String(id)) || null;
}

function getProductById(page, id) {
  return (page.shop?.products || []).find((product) => String(product.id) === String(id)) || null;
}

export async function registerPublicPageView(slug, payload = {}, headers = {}) {
  const page = await getPageBySlug(slug);
  const origin = resolveOrigin({
    locationSearch: payload.locationSearch,
    referrer: payload.referrer,
    refererHeader: headers.referer,
  });

  await incrementDailyMetric(page, {
    pageViewsTotal: 1,
    [`pageViewsByOrigin.${origin}`]: 1,
  });

  return { ok: true };
}

export async function registerPublicLinkClickAndResolve(slug, linkId, headers = {}) {
  const page = await getPageBySlug(slug);
  const link = getLinkById(page, linkId);

  if (!link || link.isActive === false) {
    throw createHttpError(404, "Link não encontrado.", "LINK_NOT_FOUND");
  }

  const destination = getPrimaryLinkHref(page, link);

  if (!destination) {
    throw createHttpError(400, "Este link não possui um destino válido.", "LINK_TARGET_MISSING");
  }

  const origin = resolveOrigin({
    refererHeader: headers.referer,
  });

  await incrementDailyMetric(page, {
    [`linkClicksByLinkId.${String(link.id)}.total`]: 1,
    [`linkClicksByLinkId.${String(link.id)}.byOrigin.${origin}`]: 1,
  });

  return destination;
}

export async function registerPublicProductClickAndResolve(slug, productId, headers = {}) {
  const page = await getPageBySlug(slug);
  const product = getProductById(page, productId);

  if (!product || product.isActive === false) {
    throw createHttpError(404, "Produto não encontrado.", "SHOP_PRODUCT_NOT_FOUND");
  }

  const destination = String(product.sourceUrl || "").trim();

  if (!destination) {
    throw createHttpError(400, "Este produto não possui uma URL válida.", "SHOP_PRODUCT_URL_REQUIRED");
  }

  const origin = resolveOrigin({
    refererHeader: headers.referer,
  });

  await incrementDailyMetric(page, {
    [`productClicksByProductId.${String(product.id)}.total`]: 1,
    [`productClicksByProductId.${String(product.id)}.byOrigin.${origin}`]: 1,
  });

  return destination;
}

function createEmptyOriginMap() {
  return Object.fromEntries(ORIGIN_LABELS.map((label) => [label, 0]));
}

function sumOriginCounts(base, next = {}) {
  const normalized = next instanceof Map ? Object.fromEntries(next.entries()) : Object(next || {});

  for (const label of ORIGIN_LABELS) {
    base[label] = Number(base[label] || 0) + Number(normalized[label] || 0);
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (!Object.hasOwn(base, key)) {
      base[key] = Number(base[key] || 0) + Number(value || 0);
    }
  }

  return base;
}

function sumMetricBucket(bucketMap = {}, entityId = "") {
  const metrics = bucketMap instanceof Map ? bucketMap.get(String(entityId)) : bucketMap?.[String(entityId)];
  return toPlainMetric(metrics);
}

function buildDailySeries(documents = []) {
  return documents.map((doc) => {
    const linkClicksTotal = Object.values(toMetricMap(doc.linkClicksByLinkId)).reduce(
      (sum, metric) => sum + Number(metric?.total || 0),
      0,
    );
    const productClicksTotal = Object.values(toMetricMap(doc.productClicksByProductId)).reduce(
      (sum, metric) => sum + Number(metric?.total || 0),
      0,
    );

    return {
      date: doc.dateKey,
      pageViews: Number(doc.pageViewsTotal || 0),
      linkClicks: linkClicksTotal,
      productClicks: productClicksTotal,
    };
  });
}

export async function getAnalyticsOverview(ownerId, range = "7d") {
  const page = await getPageByOwnerId(ownerId);
  const normalizedRange = normalizeRange(range);
  const rangeKeys = getDateKeysForRange(normalizedRange);
  const query =
    normalizedRange === "lifetime"
      ? { pageId: page._id }
      : { pageId: page._id, dateKey: { $in: rangeKeys } };

  const documents = await MyPageAnalyticsDaily.find(query).sort({ dateKey: 1 }).lean();
  const rangeOrigins = createEmptyOriginMap();
  const lifetimeQuery = { pageId: page._id };
  const lifetimeDocuments =
    normalizedRange === "lifetime"
      ? documents
      : await MyPageAnalyticsDaily.find(lifetimeQuery).sort({ dateKey: 1 }).lean();
  const lifetimeOrigins = createEmptyOriginMap();
  let pageViewsTotal = 0;
  let linkClicksTotal = 0;
  let productClicksTotal = 0;
  const linkTotals = {};
  const productTotals = {};
  const linkLifetimeTotals = {};

  for (const doc of documents) {
    pageViewsTotal += Number(doc.pageViewsTotal || 0);
    sumOriginCounts(rangeOrigins, doc.pageViewsByOrigin);

    for (const [linkId, metric] of Object.entries(toMetricMap(doc.linkClicksByLinkId))) {
      const total = Number(metric?.total || 0);
      linkClicksTotal += total;
      linkTotals[linkId] = Number(linkTotals[linkId] || 0) + total;
    }

    for (const [productId, metric] of Object.entries(toMetricMap(doc.productClicksByProductId))) {
      const total = Number(metric?.total || 0);
      productClicksTotal += total;
      productTotals[productId] = Number(productTotals[productId] || 0) + total;
    }
  }

  for (const doc of lifetimeDocuments) {
    sumOriginCounts(lifetimeOrigins, doc.pageViewsByOrigin);
    for (const [linkId, metric] of Object.entries(toMetricMap(doc.linkClicksByLinkId))) {
      linkLifetimeTotals[linkId] = Number(linkLifetimeTotals[linkId] || 0) + Number(metric?.total || 0);
    }
  }

  const topLinks = Object.entries(linkTotals)
    .map(([id, total]) => {
      const link = getLinkById(page, id);
      return {
        id,
        title: link?.title || "Link",
        type: link?.type || "link",
        total,
      };
    })
    .sort((left, right) => right.total - left.total)
    .slice(0, 5);

  const topProducts = Object.entries(productTotals)
    .map(([id, total]) => {
      const product = getProductById(page, id);
      return {
        id,
        title: product?.title || "Produto",
        total,
      };
    })
    .sort((left, right) => right.total - left.total)
    .slice(0, 5);

  const primaryOrigin = Object.entries(rangeOrigins)
    .sort((left, right) => Number(right[1]) - Number(left[1]))[0]?.[0] || "Direto";

  return {
    page: {
      title: page.title,
      slug: page.slug,
    },
    range: normalizedRange,
    summary: {
      pageViews: pageViewsTotal,
      linkClicks: linkClicksTotal,
      productClicks: productClicksTotal,
      primaryOrigin,
    },
    origins: Object.entries(rangeOrigins).map(([label, total]) => ({
      label,
      total: Number(total || 0),
    })),
    daily: buildDailySeries(documents),
    topLinks,
    topProducts,
    linkSummaries: Object.entries(linkLifetimeTotals).map(([id, total]) => ({
      id,
      total: Number(total || 0),
    })),
  };
}

export async function getLinkAnalyticsInsight(ownerId, linkId, range = "7d") {
  const page = await getPageByOwnerId(ownerId);
  const link = getLinkById(page, linkId);

  if (!link) {
    throw createHttpError(404, "Link não encontrado.", "LINK_NOT_FOUND");
  }

  const normalizedRange = normalizeRange(range);
  const lifetimeDocuments = await MyPageAnalyticsDaily.find({ pageId: page._id }).sort({ dateKey: 1 }).lean();
  const rangeDocuments =
    normalizedRange === "lifetime"
      ? lifetimeDocuments
      : await MyPageAnalyticsDaily.find({
          pageId: page._id,
          dateKey: { $in: getDateKeysForRange(normalizedRange) },
        }).sort({ dateKey: 1 }).lean();

  const lifetimeOrigins = createEmptyOriginMap();
  const rangeOrigins = createEmptyOriginMap();
  let lifetimeTotal = 0;
  let rangeTotal = 0;

  for (const doc of lifetimeDocuments) {
    const metric = sumMetricBucket(toMetricMap(doc.linkClicksByLinkId), linkId);
    lifetimeTotal += metric.total;
    sumOriginCounts(lifetimeOrigins, metric.byOrigin);
  }

  for (const doc of rangeDocuments) {
    const metric = sumMetricBucket(toMetricMap(doc.linkClicksByLinkId), linkId);
    rangeTotal += metric.total;
    sumOriginCounts(rangeOrigins, metric.byOrigin);
  }

  return {
    link: {
      id: String(link.id),
      title: link.title || "Link",
      type: link.type || "link",
    },
    range: normalizedRange,
    lifetimeTotal,
    rangeTotal,
    rows: [
      {
        label: "Total",
        lifetime: lifetimeTotal,
        range: rangeTotal,
      },
      ...ORIGIN_LABELS.map((label) => ({
        label,
        lifetime: Number(lifetimeOrigins[label] || 0),
        range: Number(rangeOrigins[label] || 0),
      })),
    ],
  };
}

