import {
  createLink,
  deleteLink,
  reorderLinks,
  toggleLink,
  updateLink,
} from "../services/myPage.service.js";

export async function createLinkHandler(req, res, next) {
  try {
    const page = await createLink(req.body);
    res.status(201).json({ ok: true, page, message: "Link criado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function updateLinkHandler(req, res, next) {
  try {
    const page = await updateLink(req.params.id, req.body);
    res.json({ ok: true, page, message: "Link atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function deleteLinkHandler(req, res, next) {
  try {
    const page = await deleteLink(req.params.id);
    res.json({ ok: true, page, message: "Link excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function toggleLinkHandler(req, res, next) {
  try {
    const page = await toggleLink(req.params.id);
    res.json({ ok: true, page, message: "Status do link atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function reorderLinksHandler(req, res, next) {
  try {
    const page = await reorderLinks(req.body.ids || []);
    res.json({ ok: true, page, message: "Links reordenados com sucesso." });
  } catch (error) {
    next(error);
  }
}
