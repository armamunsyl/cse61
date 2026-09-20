export function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 ? "Something went wrong" : err.message;
  if (process.env.NODE_ENV !== "test" && statusCode >= 500) {
    console.error(err);
  }
  res.status(statusCode).json({ message });
}
