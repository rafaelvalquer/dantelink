import MyPage from "../models/MyPage.js";
import User from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { normalizeSlug } from "../utils/slug.js";

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

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeDisplayName(value = "") {
  return String(value || "").trim();
}

function getEmailLocalPart(email = "") {
  return normalizeEmail(email).split("@")[0] || "";
}

function buildInitialSlug(email = "", displayName = "") {
  return (
    normalizeSlug(displayName) ||
    normalizeSlug(getEmailLocalPart(email)) ||
    "minha-pagina"
  );
}

async function ensureUniqueSlug(baseSlug = "") {
  const safeBaseSlug = normalizeSlug(baseSlug) || "minha-pagina";
  let candidate = safeBaseSlug;
  let suffix = 1;

  while (await MyPage.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${safeBaseSlug}-${suffix}`;
  }

  return candidate;
}

function buildInitialPage(ownerId, { email = "", displayName = "" } = {}) {
  const normalizedDisplayName = normalizeDisplayName(displayName);
  const fallbackTitle = normalizedDisplayName || getEmailLocalPart(email) || "Minha pagina";

  return {
    ownerId,
    title: fallbackTitle,
    slug: buildInitialSlug(email, normalizedDisplayName),
    bio: "Compartilhe tudo o que importa em um so lugar.",
    avatarUrl: "",
    links: [],
    secondaryLinks: [],
    shop: {
      isActive: true,
      title: "Ver loja completa",
      description: "0 produtos",
      productsCount: 0,
      products: [],
    },
  };
}

function serializeUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName || "",
  };
}

function serializePageSummary(page) {
  return {
    id: String(page._id),
    title: page.title,
    slug: page.slug,
  };
}

export async function registerUser(payload = {}) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const displayName = normalizeDisplayName(payload.displayName);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError(400, "Informe um e-mail valido.", "AUTH_INVALID_EMAIL");
  }

  if (await User.exists({ email })) {
    throw createHttpError(409, "Este e-mail ja esta em uso.", "AUTH_EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(password);
  const createdUser = await User.create({
    email,
    passwordHash,
    displayName,
  });

  try {
    const pageData = buildInitialPage(createdUser._id, { email, displayName });
    pageData.slug = await ensureUniqueSlug(pageData.slug);

    const createdPage = await MyPage.create(pageData);

    return {
      user: serializeUser(createdUser),
      pageSummary: serializePageSummary(createdPage),
    };
  } catch (error) {
    await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    throw error;
  }
}

export async function loginUser(payload = {}) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  if (!email || !password) {
    throw createHttpError(400, "Informe e-mail e senha.", "AUTH_CREDENTIALS_REQUIRED");
  }

  const user = await User.findOne({ email });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createHttpError(401, "E-mail ou senha invalidos.", "AUTH_INVALID_CREDENTIALS");
  }

  const page = await MyPage.findOne({ ownerId: user._id }).sort({ createdAt: 1 });

  return {
    user: serializeUser(user),
    pageSummary: page ? serializePageSummary(page) : null,
  };
}

export async function getAuthUserById(userId = "") {
  const user = await User.findById(String(userId || "").trim());

  if (!user) {
    throw createHttpError(401, "Sessao invalida ou expirada.", "AUTH_USER_NOT_FOUND");
  }

  const page = await MyPage.findOne({ ownerId: user._id }).sort({ createdAt: 1 });

  return {
    user: serializeUser(user),
    pageSummary: page ? serializePageSummary(page) : null,
  };
}
