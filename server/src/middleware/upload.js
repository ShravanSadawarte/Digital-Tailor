import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { env } from "../config/env.js";

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function destDir() {
  const now = new Date();
  const dir = path.join(
    SERVER_ROOT,
    env.uploadDir,
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0")
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function catalogDir() {
  const dir = path.join(SERVER_ROOT, env.uploadDir, "catalog");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function catalogDirPath() {
  return catalogDir();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, destDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${crypto.randomUUID()}${ALLOWED_EXT.has(ext) ? ext : ".bin"}`);
  },
});

// Sniff magic bytes — never trust the client-sent MIME alone.
function sniffedMime(filePath) {
  const head = fs.readFileSync(filePath).subarray(0, 12);
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
  )
    return "image/png";
  if (
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  )
    return "image/webp";
  return null;
}

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) return cb(null, true);
    const err = new Error("Only JPG, PNG or WEBP images are allowed");
    err.status = 400;
    err.code = "INVALID_FILE";
    cb(err);
  },
});

// Catalog photos (products, cloth/neck/sleeve designs, QR) — admin only,
// served publicly at /api/files/<name> so the shop can display them.
const catalogStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, catalogDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${crypto.randomUUID()}${ALLOWED_EXT.has(ext) ? ext : ".bin"}`);
  },
});

export const catalogUpload = multer({
  storage: catalogStorage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) return cb(null, true);
    const err = new Error("Only JPG, PNG or WEBP images are allowed");
    err.status = 400;
    err.code = "INVALID_FILE";
    cb(err);
  },
});

export function verifyUpload(req, _res, next) {
  if (!req.file) return next();
  const mime = sniffedMime(req.file.path);
  if (!mime) {
    fs.rm(req.file.path, { force: true }, () => {});
    const err = new Error("File content is not a valid image");
    err.status = 400;
    err.code = "INVALID_FILE";
    return next(err);
  }
  req.file.detectedMime = mime;
  next();
}
