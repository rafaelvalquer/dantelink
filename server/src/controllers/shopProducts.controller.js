import {
  createShopProduct,
  deleteShopProduct,
  importShopProductPreview,
  reorderShopProducts,
  toggleShopProduct,
  updateShopProduct,
} from "../services/myPage.service.js";

export async function importShopProductHandler(req, res, next) {
  try {
    const product = await importShopProductPreview(req.body?.sourceUrl || req.body?.url || "");
    res.json({ ok: true, product, message: "Produto importado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function createShopProductHandler(req, res, next) {
  try {
    const page = await createShopProduct(req.auth.userId, req.body);
    res.status(201).json({ ok: true, page, message: "Produto criado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function updateShopProductHandler(req, res, next) {
  try {
    const page = await updateShopProduct(req.auth.userId, req.params.id, req.body);
    res.json({ ok: true, page, message: "Produto atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function deleteShopProductHandler(req, res, next) {
  try {
    const page = await deleteShopProduct(req.auth.userId, req.params.id);
    res.json({ ok: true, page, message: "Produto excluido com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function toggleShopProductHandler(req, res, next) {
  try {
    const page = await toggleShopProduct(req.auth.userId, req.params.id);
    res.json({ ok: true, page, message: "Status do produto atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function reorderShopProductsHandler(req, res, next) {
  try {
    const page = await reorderShopProducts(req.auth.userId, req.body.ids || []);
    res.json({ ok: true, page, message: "Produtos reordenados com sucesso." });
  } catch (error) {
    next(error);
  }
}
