// AppError -> JSON error middleware contract.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  static badRequest(msg = "Invalid request", details) {
    return new AppError(400, "VALIDATION_ERROR", msg, details);
  }
  static unauthorized(msg = "Authentication required") {
    return new AppError(401, "UNAUTHENTICATED", msg);
  }
  static forbidden(msg = "Not allowed") {
    return new AppError(403, "FORBIDDEN", msg);
  }
  static notFound(msg = "Not found") {
    return new AppError(404, "NOT_FOUND", msg);
  }
  static conflict(msg = "Conflict") {
    return new AppError(409, "CONFLICT", msg);
  }
}
