import {
  createSecondaryLink,
  deleteSecondaryLink,
  reorderSecondaryLinks,
  toggleSecondaryLink,
  updateSecondaryLink,
} from "../services/myPage.service.js";

export async function createSecondaryLinkHandler(req, res, next) {
  try {
    const page = await createSecondaryLink(req.auth.userId, req.body);
    res.status(201).json({
      ok: true,
      page,
      message: "Link secundario criado com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSecondaryLinkHandler(req, res, next) {
  try {
    const page = await updateSecondaryLink(
      req.auth.userId,
      req.params.id,
      req.body,
    );
    res.json({
      ok: true,
      page,
      message: "Link secundario atualizado com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSecondaryLinkHandler(req, res, next) {
  try {
    const page = await deleteSecondaryLink(req.auth.userId, req.params.id);
    res.json({
      ok: true,
      page,
      message: "Link secundario excluido com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSecondaryLinkHandler(req, res, next) {
  try {
    const page = await toggleSecondaryLink(req.auth.userId, req.params.id);
    res.json({
      ok: true,
      page,
      message: "Status do link secundario atualizado com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderSecondaryLinksHandler(req, res, next) {
  try {
    const page = await reorderSecondaryLinks(req.auth.userId, req.body.ids || []);
    res.json({
      ok: true,
      page,
      message: "Links secundarios reordenados com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}
