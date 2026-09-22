import { AppError } from "../utils/errors.js";

// Validate req[source] against a zod schema. Strips unknown keys.
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return next(
        AppError.badRequest(
          "Validation failed",
          parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
        )
      );
    }
    req[source] = parsed.data;
    next();
  };
}
