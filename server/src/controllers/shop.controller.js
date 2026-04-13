import { updateShop } from "../services/myPage.service.js";

export async function updateShopHandler(req, res, next) {
  try {
    const page = await updateShop(req.body);
    res.json({ ok: true, page, message: "Loja atualizada com sucesso." });
  } catch (error) {
    next(error);
  }
}
