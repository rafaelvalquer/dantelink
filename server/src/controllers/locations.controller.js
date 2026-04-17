import { searchLocationSuggestions } from "../services/myPage.service.js";

export async function autocompleteLocationsHandler(req, res, next) {
  try {
    const suggestions = await searchLocationSuggestions(req.query.q || "");
    res.json({ ok: true, suggestions });
  } catch (error) {
    next(error);
  }
}
