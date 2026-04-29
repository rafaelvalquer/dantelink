import { createHttpError } from "../utils/httpError.js";

export function notFound(req, _res, next) {
  next(
    createHttpError(
      404,
      `Rota não encontrada: ${req.method} ${req.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
}
