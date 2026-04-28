import {
  getAnalyticsOverview,
  getLinkAnalyticsInsight,
  registerPublicLinkClickAndResolve,
  registerPublicPageView,
  registerPublicProductClickAndResolve,
} from "../services/analytics.service.js";

export async function registerPublicPageViewHandler(req, res, next) {
  try {
    await registerPublicPageView(req.params.slug, req.body || {}, req.headers || {});
    res.status(202).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function redirectTrackedLinkHandler(req, res, next) {
  try {
    const destination = await registerPublicLinkClickAndResolve(
      req.params.slug,
      req.params.id,
      req.headers || {},
    );
    res.redirect(302, destination);
  } catch (error) {
    next(error);
  }
}

export async function redirectTrackedProductHandler(req, res, next) {
  try {
    const destination = await registerPublicProductClickAndResolve(
      req.params.slug,
      req.params.id,
      req.headers || {},
    );
    res.redirect(302, destination);
  } catch (error) {
    next(error);
  }
}

export async function getAnalyticsOverviewHandler(req, res, next) {
  try {
    const analytics = await getAnalyticsOverview(
      req.auth.userId,
      req.query.range,
    );
    res.json({ ok: true, analytics });
  } catch (error) {
    next(error);
  }
}

export async function getLinkAnalyticsInsightHandler(req, res, next) {
  try {
    const insight = await getLinkAnalyticsInsight(
      req.auth.userId,
      req.params.id,
      req.query.range,
    );
    res.json({ ok: true, insight });
  } catch (error) {
    next(error);
  }
}
