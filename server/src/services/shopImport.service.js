import { createHttpError } from "../utils/httpError.js";
import { logInfo, logWarn } from "../utils/logger.js";

const FETCH_TIMEOUT_MS = 8000;
const MERCADO_LIVRE_HOSTS = [
  "mercadolivre.com.br",
  "mercadolibre.com",
  "mercadolibre.com.mx",
  "mercadolibre.com.ar",
  "mercadolibre.com.co",
  "mercadolibre.com.uy",
];
const AMAZON_BR_HOSTS = [
  "amazon.com.br",
  "www.amazon.com.br",
];
const MERCADO_LIVRE_API_BASE = "https://api.mercadolibre.com";

function createImportResult({
  sourceUrl = "",
  title = "",
  price = null,
  currency = "BRL",
  imageUrl = "",
  importMode = "manual",
}) {
  const normalizedPrice = Number(price);
  const hasValidPrice = Number.isFinite(normalizedPrice) && normalizedPrice > 0;
  const hasCoreData = Boolean(title && imageUrl && hasValidPrice);
  const hasAnyData = Boolean(title || imageUrl || hasValidPrice);

  return {
    sourceUrl,
    title: normalizeWhitespace(title),
    price: hasValidPrice ? normalizedPrice : null,
    currency: String(currency || "BRL").trim().toUpperCase() || "BRL",
    imageUrl: sanitizeImageUrl(imageUrl),
    importMode,
    status: hasCoreData ? "complete" : hasAnyData ? "partial" : "manual",
  };
}

function normalizeWhitespace(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function sanitizeImageUrl(value = "") {
  const sample = normalizeWhitespace(decodeHtmlEntities(value));
  if (!sample) return "";
  return sample.replace(/\\u002F/g, "/").replace(/\\\//g, "/");
}

function normalizeCurrency(value = "") {
  const sample = String(value || "").trim().toUpperCase();
  if (!sample) return "BRL";
  if (sample === "R$") return "BRL";
  return sample.slice(0, 8);
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const sample = String(value)
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!sample) return null;

  const normalized = sample.includes(",") && sample.includes(".")
    ? sample.replace(/\./g, "").replace(",", ".")
    : sample.includes(",")
      ? sample.replace(",", ".")
      : sample;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseDomain(sourceUrl = "") {
  try {
    return new URL(sourceUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isMercadoLivreUrl(sourceUrl = "") {
  const domain = parseDomain(sourceUrl);
  return MERCADO_LIVRE_HOSTS.some((host) => domain.includes(host));
}

function isAmazonBrUrl(sourceUrl = "") {
  const domain = parseDomain(sourceUrl);
  return AMAZON_BR_HOSTS.some((host) => domain === host || domain.endsWith(`.${host}`));
}

function parseUrl(sourceUrl = "") {
  try {
    return new URL(sourceUrl);
  } catch {
    return null;
  }
}

function extractMercadoLivreItemId(sourceUrl = "") {
  const parsed = parseUrl(sourceUrl);
  const fromQuery = String(
    parsed?.searchParams.get("wid")
      || parsed?.searchParams.get("item_id")
      || parsed?.searchParams.get("itemId")
      || "",
  )
    .trim()
    .toUpperCase();

  if (/^ML[A-Z]\d+$/i.test(fromQuery)) {
    return fromQuery;
  }

  const source = String(sourceUrl || "").trim().toUpperCase();
  const itemMatches = [...source.matchAll(/\bML[A-Z]\d+\b/g)];
  for (const match of itemMatches) {
    const candidate = String(match?.[0] || "").trim();
    if (candidate && candidate !== extractMercadoLivreProductId(sourceUrl)) {
      return candidate;
    }
  }

  return "";
}

function extractMercadoLivreProductId(sourceUrl = "") {
  const source = String(sourceUrl || "").trim().toUpperCase();
  const pathMatch = source.match(/\/P\/(ML[A-Z]\d+)\b/);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  return "";
}

function getMercadoLivrePictureUrl(pictures = []) {
  for (const picture of pictures || []) {
    const candidateFromString =
      typeof picture === "string" ? sanitizeImageUrl(picture) : "";
    if (candidateFromString) {
      return candidateFromString;
    }

    const candidate =
      sanitizeImageUrl(picture?.secure_url)
      || sanitizeImageUrl(picture?.url)
      || sanitizeImageUrl(picture?.source)
      || sanitizeImageUrl(picture?.large)
      || sanitizeImageUrl(picture?.max_size)
      || sanitizeImageUrl(picture?.image);

    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function normalizeAmazonProductUrl(sourceUrl = "") {
  const parsed = parseUrl(sourceUrl);
  if (!parsed || !isAmazonBrUrl(sourceUrl)) {
    return normalizeWhitespace(sourceUrl);
  }

  const asinMatch =
    parsed.pathname.match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i)
    || parsed.pathname.match(/\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i);

  if (!asinMatch?.[1]) {
    return parsed.toString();
  }

  const normalized = new URL(parsed.origin);
  normalized.pathname = `/dp/${asinMatch[1].toUpperCase()}`;
  return normalized.toString();
}

function extractAmazonPriceFromString(value = "") {
  const sample = normalizeWhitespace(decodeHtmlEntities(value));
  if (!sample) {
    return null;
  }

  const match = sample.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d{2})?)/);
  return normalizePrice(match?.[1] || sample);
}

function extractAmazonPriceFromHtml(html = "") {
  const candidates = [
    html.match(/id=["']priceblock_ourprice["'][^>]*>\s*([^<]+)/i)?.[1],
    html.match(/id=["']priceblock_dealprice["'][^>]*>\s*([^<]+)/i)?.[1],
    html.match(/id=["']priceblock_saleprice["'][^>]*>\s*([^<]+)/i)?.[1],
    html.match(/id=["']corePriceDisplay_desktop_feature_div["'][\s\S]*?a-offscreen["'][^>]*>\s*([^<]+)/i)?.[1],
    html.match(/"priceToPay"\s*:\s*\{[\s\S]*?"amount"\s*:\s*([\d.]+)/i)?.[1],
    html.match(/"displayPrice"\s*:\s*"([^"]+)"/i)?.[1],
  ];

  for (const candidate of candidates) {
    const price = extractAmazonPriceFromString(candidate || "");
    if (price !== null) {
      return price;
    }
  }

  return null;
}

function extractAmazonTitleFromHtml(html = "") {
  return (
    normalizeWhitespace(
      decodeHtmlEntities(
        html.match(/id=["']productTitle["'][^>]*>\s*([\s\S]*?)\s*<\/span>/i)?.[1] || "",
      ),
    )
    || matchMetaContent(html, "property", "og:title")
    || matchMetaContent(html, "name", "twitter:title")
    || matchTitleTag(html)
  );
}

function extractAmazonImageFromHtml(html = "") {
  return (
    sanitizeImageUrl(
      html.match(/id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/i)?.[1] || "",
    )
    || sanitizeImageUrl(
      html.match(/"hiRes"\s*:\s*"([^"]+)"/i)?.[1] || "",
    )
    || sanitizeImageUrl(
      html.match(/"large"\s*:\s*"([^"]+)"/i)?.[1] || "",
    )
    || sanitizeImageUrl(matchMetaContent(html, "property", "og:image"))
    || sanitizeImageUrl(matchMetaContent(html, "name", "twitter:image"))
  );
}

function extractAmazonMetadata(html = "", sourceUrl = "") {
  return createImportResult({
    sourceUrl,
    title: extractAmazonTitleFromHtml(html),
    price: extractAmazonPriceFromHtml(html),
    currency: "BRL",
    imageUrl: extractAmazonImageFromHtml(html),
    importMode: "amazon-html",
  });
}

function extractAmazonJsonLd(html = "", sourceUrl = "") {
  const result = extractProductFromJsonLd(html, sourceUrl);
  return {
    ...result,
    importMode: result.status === "manual" ? "manual" : "amazon-json-ld",
  };
}

function extractAmazonOpenGraph(html = "", sourceUrl = "") {
  const result = extractOpenGraphMetadata(html, sourceUrl);
  return {
    ...result,
    importMode: result.status === "manual" ? "manual" : "amazon-open-graph",
  };
}

function getCandidateScore(candidate = {}) {
  if (!candidate || candidate.status === "manual") {
    return -1;
  }

  let score = 0;

  if (candidate.title) score += 3;
  if (candidate.imageUrl) score += 3;
  if (Number.isFinite(Number(candidate.price)) && Number(candidate.price) > 0) score += 4;
  if (candidate.status === "complete") score += 10;
  if (candidate.importMode?.includes("item-api")) score += 2;
  if (candidate.importMode?.includes("product-api")) score += 1;

  return score;
}

function pickBestCandidate(candidates = []) {
  return candidates
    .filter(Boolean)
    .filter((candidate) => candidate.status !== "manual")
    .sort((left, right) => getCandidateScore(right) - getCandidateScore(left))[0] || null;
}

function matchMetaContent(html = "", attribute, value) {
  const pattern = new RegExp(
    `<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${value}["'][^>]*>`,
    "i",
  );

  const match = html.match(pattern) || html.match(reversePattern);
  return normalizeWhitespace(decodeHtmlEntities(match?.[1] || ""));
}

function matchTitleTag(html = "") {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeWhitespace(decodeHtmlEntities(match?.[1] || ""));
}

function extractJsonLdBlocks(html = "") {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return matches
    .map((match) => String(match?.[1] || "").trim())
    .filter(Boolean);
}

function flattenJsonLdNodes(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.flatMap((item) => flattenJsonLdNodes(item));
  }
  if (typeof input !== "object") {
    return [];
  }
  if (Array.isArray(input["@graph"])) {
    return flattenJsonLdNodes(input["@graph"]);
  }
  return [input];
}

function getJsonLdType(node = {}) {
  const value = node?.["@type"];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").toLowerCase());
  }
  return [String(value || "").toLowerCase()];
}

function extractProductFromJsonLd(html = "", sourceUrl = "") {
  for (const block of extractJsonLdBlocks(html)) {
    try {
      const payload = JSON.parse(block);
      const candidates = flattenJsonLdNodes(payload);
      const product = candidates.find((node) => getJsonLdType(node).includes("product"));

      if (!product) {
        continue;
      }

      const offers = Array.isArray(product.offers)
        ? product.offers.find(Boolean) || {}
        : product.offers || {};
      const image = Array.isArray(product.image) ? product.image[0] : product.image;

      return createImportResult({
        sourceUrl,
        title: normalizeWhitespace(product.name || product.headline || ""),
        price: normalizePrice(offers.price || product.price),
        currency: normalizeCurrency(offers.priceCurrency || product.priceCurrency || "BRL"),
        imageUrl: sanitizeImageUrl(image || ""),
        importMode: "json-ld",
      });
    } catch {
      continue;
    }
  }

  return createImportResult({ sourceUrl });
}

function extractMercadoLivreMetadata(html = "", sourceUrl = "") {
  const title =
    matchMetaContent(html, "property", "og:title") ||
    matchMetaContent(html, "name", "twitter:title") ||
    matchTitleTag(html);
  const imageUrl =
    sanitizeImageUrl(matchMetaContent(html, "property", "og:image")) ||
    sanitizeImageUrl(matchMetaContent(html, "name", "twitter:image"));
  const metaPrice =
    matchMetaContent(html, "property", "product:price:amount") ||
    matchMetaContent(html, "name", "price");
  const metaCurrency =
    matchMetaContent(html, "property", "product:price:currency") ||
    matchMetaContent(html, "name", "currency");
  const jsonPriceMatch = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i);
  const jsonCurrencyMatch =
    html.match(/"currency_id"\s*:\s*"([A-Z]{3})"/i) ||
    html.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/i);

  return createImportResult({
    sourceUrl,
    title,
    price: normalizePrice(metaPrice || jsonPriceMatch?.[1]),
    currency: normalizeCurrency(metaCurrency || jsonCurrencyMatch?.[1] || "BRL"),
    imageUrl,
    importMode: "mercadolivre",
  });
}

async function fetchMercadoLivreJson(pathname = "") {
  if (!pathname) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${MERCADO_LIVRE_API_BASE}${pathname}`, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "dandelink/1.0 (shop import mercadolivre fallback)",
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractMercadoLivreItemApiResult(payload = {}, sourceUrl = "") {
  if (!payload || typeof payload !== "object") {
    return createImportResult({ sourceUrl });
  }

  const pictures = Array.isArray(payload.pictures) ? payload.pictures : [];

  return createImportResult({
    sourceUrl,
    title: normalizeWhitespace(payload.title || payload.name || ""),
    price: normalizePrice(
      payload.price
        || payload.base_price
        || payload.original_price
        || payload.sale_price
        || payload.price_amount,
    ),
    currency: normalizeCurrency(
      payload.currency_id
        || payload.currency
        || payload.sale_price?.currency_id
        || "BRL",
    ),
    imageUrl:
      getMercadoLivrePictureUrl(pictures)
      || sanitizeImageUrl(payload.secure_thumbnail)
      || sanitizeImageUrl(payload.thumbnail),
    importMode: "mercadolivre-item-api",
  });
}

function extractMercadoLivreProductApiResult(payload = {}, sourceUrl = "") {
  if (!payload || typeof payload !== "object") {
    return createImportResult({ sourceUrl });
  }

  const buyBoxWinner = payload.buy_box_winner || {};
  const mainPicture =
    payload.main_picture?.secure_url
    || payload.main_picture?.url
    || payload.main_picture?.source
    || payload.main_picture?.image;

  return createImportResult({
    sourceUrl,
    title: normalizeWhitespace(
      payload.name || payload.title || buyBoxWinner.title || "",
    ),
    price: normalizePrice(
      payload.price
        || payload.base_price
        || payload.original_price
        || payload.sale_price
        || buyBoxWinner.price
        || buyBoxWinner.base_price
        || buyBoxWinner.original_price,
    ),
    currency: normalizeCurrency(
      payload.currency_id
        || buyBoxWinner.currency_id
        || buyBoxWinner.currency
        || "BRL",
    ),
    imageUrl:
      sanitizeImageUrl(mainPicture)
      || getMercadoLivrePictureUrl(payload.pictures)
      || sanitizeImageUrl(buyBoxWinner.secure_thumbnail)
      || sanitizeImageUrl(buyBoxWinner.thumbnail),
    importMode: "mercadolivre-product-api",
  });
}

async function resolveMercadoLivreByItemId(itemId = "", sourceUrl = "") {
  const normalizedItemId = String(itemId || "").trim().toUpperCase();
  if (!/^ML[A-Z]\d+$/.test(normalizedItemId)) {
    return createImportResult({ sourceUrl });
  }

  const payload = await fetchMercadoLivreJson(`/items/${normalizedItemId}`);
  return extractMercadoLivreItemApiResult(payload, sourceUrl);
}

async function resolveMercadoLivreByProductId(productId = "", sourceUrl = "") {
  const normalizedProductId = String(productId || "").trim().toUpperCase();
  if (!/^ML[A-Z]\d+$/.test(normalizedProductId)) {
    return createImportResult({ sourceUrl });
  }

  const productPayload = await fetchMercadoLivreJson(`/products/${normalizedProductId}`);
  const productResult = extractMercadoLivreProductApiResult(productPayload, sourceUrl);

  if (productResult.status === "complete") {
    return productResult;
  }

  const winnerItemId = String(
    productPayload?.buy_box_winner?.id
      || productPayload?.buy_box_winner?.item_id
      || "",
  )
    .trim()
    .toUpperCase();

  if (/^ML[A-Z]\d+$/.test(winnerItemId)) {
    const itemResult = await resolveMercadoLivreByItemId(winnerItemId, sourceUrl);
    if (itemResult.status !== "manual") {
      return itemResult;
    }
  }

  return productResult;
}

function extractOpenGraphMetadata(html = "", sourceUrl = "") {
  return createImportResult({
    sourceUrl,
    title:
      matchMetaContent(html, "property", "og:title") ||
      matchMetaContent(html, "name", "twitter:title") ||
      matchTitleTag(html),
    price:
      normalizePrice(matchMetaContent(html, "property", "product:price:amount")) ||
      normalizePrice(matchMetaContent(html, "name", "price")),
    currency:
      normalizeCurrency(
        matchMetaContent(html, "property", "product:price:currency") ||
          matchMetaContent(html, "name", "currency") ||
          "BRL",
      ),
    imageUrl:
      sanitizeImageUrl(matchMetaContent(html, "property", "og:image")) ||
      sanitizeImageUrl(matchMetaContent(html, "name", "twitter:image")),
    importMode: "open-graph",
  });
}

async function fetchHtml(sourceUrl = "") {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw createHttpError(
        502,
        "Não foi possível consultar a URL do produto.",
        "SHOP_IMPORT_REQUEST_FAILED",
      );
    }

    return response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(
        504,
        "A importação demorou mais do que o esperado.",
        "SHOP_IMPORT_TIMEOUT",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function importShopProductFromUrl(sourceUrl = "") {
  const initialUrl = normalizeWhitespace(sourceUrl);
  const normalizedUrl = isAmazonBrUrl(initialUrl)
    ? normalizeAmazonProductUrl(initialUrl)
    : initialUrl;

  if (!/^https?:\/\//i.test(normalizedUrl)) {
    throw createHttpError(
      400,
      "Informe uma URL válida para importar o produto.",
      "SHOP_IMPORT_INVALID_URL",
    );
  }

  const candidates = [];
  const isMercadoLivre = isMercadoLivreUrl(normalizedUrl);
  const isAmazonBr = isAmazonBrUrl(normalizedUrl);
  let html = "";
  let htmlFetchError = null;

  if (isMercadoLivre) {
    const itemId = extractMercadoLivreItemId(normalizedUrl);
    const productId = extractMercadoLivreProductId(normalizedUrl);

    if (itemId) {
      candidates.push(await resolveMercadoLivreByItemId(itemId, normalizedUrl));
    }

    if (productId && productId !== itemId) {
      candidates.push(await resolveMercadoLivreByProductId(productId, normalizedUrl));
    }
  }

  try {
    html = await fetchHtml(normalizedUrl);
  } catch (error) {
    htmlFetchError = error;
    logWarn("shop-import.html-fetch-failed", {
      sourceUrl: normalizedUrl,
      code: error?.code,
      status: error?.status,
      domain: parseDomain(normalizedUrl),
    });
  }

  if (html) {
    if (isMercadoLivre) {
      candidates.push(extractMercadoLivreMetadata(html, normalizedUrl));
    }

    if (isAmazonBr) {
      candidates.push(extractAmazonJsonLd(html, normalizedUrl));
      candidates.push(extractAmazonOpenGraph(html, normalizedUrl));
      candidates.push(extractAmazonMetadata(html, normalizedUrl));
    } else {
      candidates.push(extractProductFromJsonLd(html, normalizedUrl));
      candidates.push(extractOpenGraphMetadata(html, normalizedUrl));
    }
  }

  const best = pickBestCandidate(candidates);

  if (best) {
    logInfo("shop-import.resolved", {
      sourceUrl: normalizedUrl,
      domain: parseDomain(normalizedUrl),
      importMode: best.importMode,
      status: best.status,
      usedHtmlFallback: Boolean(html),
      candidates: candidates.map((candidate) => candidate.importMode).filter(Boolean),
    });

    return {
      ...best,
      sourceUrl: normalizedUrl,
    };
  }

  if (isMercadoLivre && htmlFetchError) {
    throw createHttpError(
      502,
      "Não foi possível importar este produto do Mercado Livre. A página bloqueou a consulta pública e não encontramos dados estruturados suficientes.",
      "SHOP_IMPORT_MERCADOLIVRE_UNAVAILABLE",
    );
  }

  logWarn("shop-import.fallback-manual", {
    sourceUrl: normalizedUrl,
    domain: parseDomain(normalizedUrl),
    candidates: candidates.map((candidate) => candidate.importMode).filter(Boolean),
  });

  return {
    ...createImportResult({ sourceUrl: normalizedUrl }),
    sourceUrl: normalizedUrl,
  };
}
