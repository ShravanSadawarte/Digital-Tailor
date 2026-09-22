import crypto from "crypto";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { store } from "./db/index.js";
import { env } from "./config/env.js";
import { authLimiter, checkCsrf, globalLimiter } from "./middleware/security.js";
import { catalogDirPath } from "./middleware/upload.js";
import adminRoutes from "./routes/admin.js";
import appointmentsRoutes from "./routes/appointments.js";
import authRoutes from "./routes/auth.js";
import customersRoutes from "./routes/customers.js";
import designsRoutes from "./routes/designs.js";
import garmentsRoutes from "./routes/garments.js";
import measurementsRoutes from "./routes/measurements.js";
import offersRoutes from "./routes/offers.js";
import ordersRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import promptsRoutes from "./routes/prompts.js";
import uploadsRoutes from "./routes/uploads.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan(env.isProd ? "combined" : "dev"));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(
    session({
      name: "dt.sid",
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.isProd,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(globalLimiter);

  app.get("/healthz", (_req, res) => res.json({ ok: true, driver: process.env.DB_DRIVER || "file" }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api", checkCsrf);
  app.use("/api/customers", customersRoutes);
  app.use("/api/measurements", measurementsRoutes);
  app.use("/api/garments", garmentsRoutes);
  app.get("/api/categories", async (_req, res, next) => {
    try {
      res.json({ data: await store.listCategories(true) });
    } catch (e) { next(e); }
  });
  app.use("/api/designs", designsRoutes);
  app.use("/api/prompts", promptsRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/payment-info", paymentRoutes);
  app.use("/api/offers", offersRoutes);
  app.use("/api/appointments", appointmentsRoutes);
  app.use("/api/uploads", uploadsRoutes);
  app.use("/api/admin", adminRoutes);

  // Public catalog photos (product/design images uploaded by admin).
  // Random UUID filenames, images only — safe to serve without auth.
  app.use("/api/files", express.static(catalogDirPath(), {
    maxAge: "7d",
    immutable: true,
    fallthrough: true,
  }));

  app.use("/api", (_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Unknown endpoint" } }));

  // Central error handler — never leak stacks/SQL to clients.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const requestId = req.id || crypto.randomUUID();
    if (err?.code === "INVALID_FILE" || err?.status === 400 || err?.status === 404 || err?.status === 401 || err?.status === 403 || err?.status === 409 || err?.status === 429) {
      const status = err.status || 400;
      return res.status(status).json({ error: { code: err.code || "ERROR", message: err.message || "Request failed" } });
    }
    console.error(`[${requestId}]`, err?.code || err?.message || err);
    res.status(err?.status || 500).json({
      error: {
        code: err?.code && typeof err.code === "string" ? err.code : "INTERNAL_ERROR",
        message: err?.status ? err.message : "Something went wrong",
      },
    });
  });
  return app;
}
