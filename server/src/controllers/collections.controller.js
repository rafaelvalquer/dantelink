import {
  createCollection,
  createCollectionItem,
  deleteCollection,
  deleteCollectionItem,
  reorderCollectionItems,
  reorderCollections,
  toggleCollection,
  updateCollection,
  updateCollectionItem,
} from "../services/myPage.service.js";

export async function createCollectionHandler(req, res, next) {
  try {
    const page = await createCollection(req.body);
    res
      .status(201)
      .json({ ok: true, page, message: "Coleção criada com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function updateCollectionHandler(req, res, next) {
  try {
    const page = await updateCollection(req.params.id, req.body);
    res.json({ ok: true, page, message: "Coleção atualizada com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function deleteCollectionHandler(req, res, next) {
  try {
    const page = await deleteCollection(req.params.id);
    res.json({ ok: true, page, message: "Coleção excluída com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function toggleCollectionHandler(req, res, next) {
  try {
    const page = await toggleCollection(req.params.id);
    res.json({ ok: true, page, message: "Status da coleção atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function reorderCollectionsHandler(req, res, next) {
  try {
    const page = await reorderCollections(req.body.ids || []);
    res.json({ ok: true, page, message: "Coleções reordenadas com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function createCollectionItemHandler(req, res, next) {
  try {
    const page = await createCollectionItem(req.params.id, req.body);
    res
      .status(201)
      .json({ ok: true, page, message: "Item da coleção criado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function updateCollectionItemHandler(req, res, next) {
  try {
    const page = await updateCollectionItem(
      req.params.id,
      req.params.itemId,
      req.body,
    );
    res.json({ ok: true, page, message: "Item da coleção atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function deleteCollectionItemHandler(req, res, next) {
  try {
    const page = await deleteCollectionItem(req.params.id, req.params.itemId);
    res.json({ ok: true, page, message: "Item da coleção excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function reorderCollectionItemsHandler(req, res, next) {
  try {
    const page = await reorderCollectionItems(req.params.id, req.body.ids || []);
    res.json({
      ok: true,
      page,
      message: "Itens da coleção reordenados com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}
