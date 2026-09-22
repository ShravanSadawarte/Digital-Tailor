import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { pageOut } from "../utils/paging.js";
import { appointmentSchema, apptStatusSchema } from "../validation/schemas.js";

const r = Router();
r.use(requireAuth);

r.post("/", validate(appointmentSchema), async (req, res, next) => {
  try {
    if (new Date(req.body.scheduled_at) <= new Date()) {
      throw AppError.badRequest("Appointment must be in the future");
    }
    if (req.body.order_id) {
      const o = await store.getOrder(req.body.order_id);
      if (!o || o.customer_id !== Number(req.user.id)) throw AppError.notFound("Order not found");
    }
    res.status(201).json(await store.createAppt({
      customerId: req.user.id,
      orderId: req.body.order_id || null,
      reason: req.body.reason,
      scheduledAt: req.body.scheduled_at,
      notes: req.body.notes || null,
    }));
  } catch (e) { next(e); }
});

r.get("/", async (req, res, next) => {
  try {
    const admin = req.session.role === "admin";
    res.json(pageOut(await store.listAppts({
      customerId: admin ? req.query.customer_id : req.user.id,
      status: req.query.status, date: req.query.date,
      page: req.query.page, limit: req.query.limit,
    })));
  } catch (e) { next(e); }
});

r.patch("/:id/status", async (req, res, next) => {
  try {
    const parsed = apptStatusSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest("Validation failed");
    const a = await store.getAppt(req.params.id);
    if (!a) throw AppError.notFound("Appointment not found");
    const admin = req.session.role === "admin";
    if (!admin) {
      if (a.customer_id !== Number(req.user.id) || parsed.data.to !== "CANCELLED" || a.status !== "REQUESTED") {
        throw AppError.forbidden("You can only cancel your own requested appointment");
      }
    }
    res.json(await store.setApptStatus(a.id, parsed.data.to));
  } catch (e) { next(e); }
});

export default r;
