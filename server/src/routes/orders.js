import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { pageOut } from "../utils/paging.js";
import { confirmMeasurements, createOrder, orderDetail, transitionOrder } from "../services/orders.service.js";
import { confirmMeasuresSchema, orderSchema, statusSchema } from "../validation/schemas.js";

const r = Router();
r.use(requireAuth);

r.post("/", validate(orderSchema), async (req, res, next) => {
  try {
    const order = await createOrder(req.user.id, req.body);
    res.status(201).json({ order });
  } catch (e) { next(e); }
});

r.get("/", async (req, res, next) => {
  try {
    const admin = req.session.role === "admin";
    res.json(pageOut(await store.listOrders({
      customerId: admin ? req.query.customer_id : req.user.id,
      status: req.query.status, page: req.query.page, limit: req.query.limit,
    })));
  } catch (e) { next(e); }
});

r.get("/:id", async (req, res, next) => {
  try {
    const admin = req.session.role === "admin";
    res.json(await orderDetail(req.params.id, { customerId: req.user.id, admin }));
  } catch (e) { next(e); }
});

r.patch("/:id/status", requireRole("admin"), validate(statusSchema), async (req, res, next) => {
  try {
    res.json(await transitionOrder(req.params.id, req.body.to, { by: req.user.id, note: req.body.note, admin: true }));
  } catch (e) { next(e); }
});

r.post("/:id/confirm-measurements", requireRole("admin"), validate(confirmMeasuresSchema), async (req, res, next) => {
  try {
    const measurements = await confirmMeasurements(req.params.id, req.body.values, req.user.id);
    const order = await store.getOrder(req.params.id);
    if (order && order.status === "MEASUREMENT_PENDING") {
      await transitionOrder(order.id, "MEASUREMENT_CONFIRMED", { by: req.user.id, note: "Tailor confirmed measurements", admin: true });
    }
    res.json({ measurements, order: await store.getOrder(req.params.id) });
  } catch (e) { next(e); }
});

r.post("/:id/cancel", async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);
    if (!order || order.customer_id !== Number(req.user.id)) throw AppError.notFound("Order not found");
    res.json(await transitionOrder(order.id, "CANCELLED", { by: req.user.id, note: "Cancelled by customer" }));
  } catch (e) { next(e); }
});

export default r;
