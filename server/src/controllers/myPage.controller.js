import {
  getMyPage,
  getPublicMyPageBySlug,
  updateMyPage,
  updateTheme,
} from "../services/myPage.service.js";

function hasThemePayload(body = {}) {
  if (body.theme && typeof body.theme === "object") {
    return true;
  }

  return [
    "backgroundColor",
    "cardColor",
    "textColor",
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
    "buttonStyle",
    "buttonShadow",
    "buttonRadius",
    "primaryButtonsLayout",
    "primaryButtonContentAlign",
    "secondaryLinksStyle",
    "secondaryLinksIconLayout",
    "secondaryLinksSize",
    "secondaryLinksAlign",
    "secondaryLinksPosition",
    "animationPreset",
  ].some((key) => Object.hasOwn(body, key));
}

export async function getMyPageHandler(_req, res, next) {
  try {
    const page = await getMyPage();
    res.json({ ok: true, page });
  } catch (error) {
    next(error);
  }
}

export async function updateMyPageHandler(req, res, next) {
  try {
    const useThemeUpdate = hasThemePayload(req.body);
    const page = useThemeUpdate
      ? await updateTheme(req.body.theme || req.body)
      : await updateMyPage(req.body);

    res.json({
      ok: true,
      page,
      message: useThemeUpdate
        ? "Tema atualizado com sucesso."
        : "Página atualizada com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicMyPageHandler(req, res, next) {
  try {
    const page = await getPublicMyPageBySlug(req.params.slug);
    res.json({ ok: true, page });
  } catch (error) {
    next(error);
  }
}
