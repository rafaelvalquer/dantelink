export function getShopPath(page = {}) {
  const slug = String(page?.slug || "").trim();
  return slug ? `/${slug}/shop` : "/minha-pagina/shop";
}

export function getShopPreviewLink(links = []) {
  return (links || []).find(
    (link) => link?.isActive && String(link?.type || "").trim().toLowerCase() === "shop-preview",
  ) || null;
}

export function resolvePrimaryLinkHref(link = {}, page = {}) {
  if (link?.type === "shop-preview") {
    return getShopPath(page);
  }

  return String(link?.url || "").trim();
}

export function sortActiveProducts(products = []) {
  return [...(products || [])]
    .filter((product) => product?.isActive)
    .sort((left, right) => Number(left?.order ?? 0) - Number(right?.order ?? 0));
}

export function formatProductPrice(product = {}) {
  if (!Number.isFinite(Number(product?.price))) {
    return "";
  }

  const currency = String(product?.currency || "BRL").trim().toUpperCase() || "BRL";

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(Number(product.price));
  } catch {
    return `${currency} ${Number(product.price).toFixed(2)}`;
  }
}
