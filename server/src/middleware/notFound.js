export function notFound(req, _res, next) {
  const error = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  error.code = "ROUTE_NOT_FOUND";
  next(error);
}
