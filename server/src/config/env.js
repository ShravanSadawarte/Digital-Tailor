import path from "path";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
dotenvConfig({ path: path.join(SERVER_ROOT, "..", ".env") }); // repo root .env
dotenvConfig({ path: path.join(SERVER_ROOT, ".env") }); // server/.env overrides

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  dbDriver: process.env.DB_DRIVER || "file", // mysql | file
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || "digital_tailor",
    user: process.env.DB_USER || "digital_tailor_app",
    password: process.env.DB_PASSWORD || "",
  },
  sessionSecret: process.env.SESSION_SECRET || "dev-only-change-me",
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5),
  rateWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateMax: Number(process.env.RATE_LIMIT_MAX || 100),
  chatgptUrl: process.env.CHATGPT_URL || "https://chatgpt.com/",
  isProd: (process.env.NODE_ENV || "development") === "production",
};

if (env.isProd && env.sessionSecret === "dev-only-change-me") {
  throw new Error("SESSION_SECRET must be set in production");
}
