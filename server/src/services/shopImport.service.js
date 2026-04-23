const FETCH_TIMEOUT_MS = 8000;
const MERCADO_LIVRE_HOSTS = [
  "mercadolivre.com.br",
  "mercadolibre.com",
  "mercadolibre.com.mx",
  "mercadolibre.com.ar",
  "mercadolibre.com.co",
  "mercadolibre.com.uy",
];

function createImportResult({
  sourceUrl = "",
  title = "",
  price = null,
  currency = "BRL",
  imageUrl = "",
  importMode = "manual",
}) {
  const hasCoreData = Boolean(title && imageUrl && Number.isFinite(Number(price)));
  const hasAnyData = Boolean(title || imageUrl || Number.isFinite(Number(price)));

  return {
    sourceUrl,
    title,
    price: Number.isFinite(Number(price)) ? Number(price) : null,
    currency: String(currency || "BRL").trim().toUpperCase() || "BRL",
    imageUrl,
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
      const error = new Error("Nao foi possivel consultar a URL do produto.");
      error.status = 502;
      error.code = "SHOP_IMPORT_REQUEST_FAILED";
      throw error;
    }

    return response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("A importacao demorou mais do que o esperado.");
      timeoutError.status = 504;
      timeoutError.code = "SHOP_IMPORT_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function importShopProductFromUrl(sourceUrl = "") {
  const normalizedUrl = normalizeWhitespace(sourceUrl);

  if (!/^https?:\/\//i.test(normalizedUrl)) {
    const error = new Error("Informe uma URL valida para importar o produto.");
    error.status = 400;
    error.code = "SHOP_IMPORT_INVALID_URL";
    throw error;
  }

  const html = await fetchHtml(normalizedUrl);
  const domain = parseDomain(normalizedUrl);

  const candidates = [];

  if (MERCADO_LIVRE_HOSTS.some((host) => domain.includes(host))) {
    candidates.push(extractMercadoLivreMetadata(html, normalizedUrl));
  }

  candidates.push(extractProductFromJsonLd(html, normalizedUrl));
  candidates.push(extractOpenGraphMetadata(html, normalizedUrl));

  const best = candidates.find((candidate) => candidate.status === "complete")
    || candidates.find((candidate) => candidate.status === "partial")
    || createImportResult({ sourceUrl: normalizedUrl });

  return {
    ...best,
    sourceUrl: normalizedUrl,
  };
}
