import fs from "fs";
import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { catalogUpload, upload, verifyUpload } from "../middleware/upload.js";
import { AppError } from "../utils/errors.js";

const r = Router();
r.use(requireAuth);

// Admin catalog photo — products, cloth/neck/sleeve designs, QR codes.
// Returns a public URL the shop can display. No design/order link needed.
r.post("/admin", requireRole("admin"), catalogUpload.single("file"), verifyUpload, async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest("No file uploaded");
    const url = `/api/files/${req.file.filename}`;
    await store.logAction({ adminId: req.user.id, action: "catalog.upload", entity: "files", entityId: 0, detail: { file: req.file.filename } }).catch(() => {});
    res.status(201).json({ url, mime: req.file.detectedMime || req.file.mimetype, size_bytes: req.file.size });
  } catch (e) { next(e); }
});

// Fabric/design reference for tailoring only — never visualization photos.
r.post("/", upload.single("file"), verifyUpload, async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest("No file uploaded");
    const { design_id, order_id } = req.body;
    if ((design_id && order_id) || (!design_id && !order_id)) {
      fs.rm(req.file.path, { force: true }, () => {});
      throw AppError.badRequest("Link to exactly one design or order");
    }
    if (design_id) {
      const d = await store.getDesign(design_id);
      if (!d || d.customer_id !== Number(req.user.id)) {
        fs.rm(req.file.path, { force: true }, () => {});
        throw AppError.notFound("Design not found");
      }
    }
    if (order_id) {
      const o = await store.getOrder(order_id);
      if (!o || o.customer_id !== Number(req.user.id)) {
        fs.rm(req.file.path, { force: true }, () => {});
        throw AppError.notFound("Order not found");
      }
    }
    const ref = await store.createRef({
      ownerId: req.user.id, designId: design_id || null, orderId: order_id || null,
      filePath: req.file.path, mime: req.file.detectedMime || req.file.mimetype,
      size: req.file.size, original: req.file.originalname,
    });
    res.status(201).json({ id: ref.id, mime: ref.mime, size_bytes: ref.size_bytes });
  } catch (e) { next(e); }
});

r.get("/:id", async (req, res, next) => {
  try {
    const ref = await store.getRef(req.params.id);
    if (!ref) throw AppError.notFound("File not found");
    const admin = req.session.role === "admin";
    if (!admin && ref.owner_id !== Number(req.user.id)) throw AppError.notFound("File not found");
    res.setHeader("Content-Type", ref.mime || "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    fs.createReadStream(ref.file_path).on("error", () => next(AppError.notFound("File not found"))).pipe(res);
  } catch (e) { next(e); }
});

r.delete("/:id", async (req, res, next) => {
  try {
    const ref = await store.getRef(req.params.id);
    if (!ref || ref.owner_id !== Number(req.user.id)) throw AppError.notFound("File not found");
    await store.deleteRef(ref.id);
    fs.rm(ref.file_path, { force: true }, () => {});
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
