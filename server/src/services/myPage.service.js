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

const DEFAULT_PAGE = {
  title: "Mutantwear",
  slug: "mutantwear",
  bio: "Viva a Mutação.",
  avatarUrl: "https://placehold.co/160x160/png?text=MW",
  theme: {
    backgroundColor: "#c4b5fd",
    cardColor: "#f8fafc",
    textColor: "#111827",
    buttonStyle: "rounded-soft",
  },
  links: [
    {
      id: createLinkId(),
      title: "Instagram",
      url: "https://instagram.com/use.mutant",
      isActive: true,
      order: 0,
      type: "social",
      icon: "",
      thumbnail: "",
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

function normalizeCollections(collections = []) {
  return normalizeOrder(collections).map((collection) => ({
    ...collection,
    items: normalizeOrder(collection.items || []),
  }));
}

function serializePage(pageDocument) {
  const page = toPlainObject(pageDocument);

  return {
    ...page,
    links: normalizeOrder(page.links || []),
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
  page.links = normalizeOrder((page.links || []).map((link) => toPlainObject(link)));
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
  return {
    backgroundColor:
      typeof payload.backgroundColor === "string"
        ? payload.backgroundColor.trim()
        : undefined,
    cardColor:
      typeof payload.cardColor === "string" ? payload.cardColor.trim() : undefined,
    textColor:
      typeof payload.textColor === "string" ? payload.textColor.trim() : undefined,
    buttonStyle:
      typeof payload.buttonStyle === "string"
        ? payload.buttonStyle.trim()
        : undefined,
  };
}

function sanitizeLinkPayload(payload = {}) {
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    url: typeof payload.url === "string" ? payload.url.trim() : undefined,
    isActive:
      typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    type: typeof payload.type === "string" ? payload.type.trim() : undefined,
    icon: typeof payload.icon === "string" ? payload.icon.trim() : undefined,
    thumbnail:
      typeof payload.thumbnail === "string" ? payload.thumbnail.trim() : undefined,
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

  page.theme = {
    ...toPlainObject(page.theme),
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ),
  };

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
    icon: data.icon || "",
    thumbnail: data.thumbnail || "",
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
