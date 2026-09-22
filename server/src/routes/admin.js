import { Router } from "express";
import { store } from "../db/index.js";
import { requireRole } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import { pageOut } from "../utils/paging.js";

const r = Router();
r.use(requireRole("admin"));

r.get("/summary", async (_req, res, next) => {
  try {
    res.json(await store.getSummary());
  } catch (e) { next(e); }
});

r.get("/customers", async (req, res, next) => {
  try {
    res.json(pageOut(await store.listUsers({ search: req.query.search, page: req.query.page, limit: req.query.limit })));
  } catch (e) { next(e); }
});

r.get("/customers/:id", async (req, res, next) => {
  try {
    const u = await store.findUserById(req.params.id);
    if (!u) throw AppError.notFound("Customer not found");
    const [profile, orders] = await Promise.all([
      store.getProfileByUser(u.id),
      store.listOrders({ customerId: u.id, page: 1, limit: 50 }),
    ]);
    res.json({ user: { id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, is_active: !!u.is_active }, profile, orders: orders.rows });
  } catch (e) { next(e); }
});

r.patch("/customers/:id/active", async (req, res, next) => {
  try {
    const u = await store.findUserById(req.params.id);
    if (!u) throw AppError.notFound("Customer not found");
    await store.setUserActive(u.id, req.body.is_active !== false);
    await store.logAction({ adminId: req.user.id, action: "customer.active", entity: "users", entityId: u.id }).catch(() => {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.get("/offers", async (_req, res, next) => {
  try {
    const offers = await store.listOffers(false);
    const withUsage = await Promise.all(offers.map(async (o) => ({
      ...o,
      usage: await store.countOfferUsage(o.id).catch(() => 0),
    })));
    res.json({ data: withUsage });
  } catch (e) { next(e); }
});

// Orders with customer names for the tracking board.
r.get("/orders", async (req, res, next) => {
  try {
    const page = await store.listOrders({ status: req.query.status || undefined, page: req.query.page, limit: req.query.limit || 50 });
    const rows = await Promise.all(page.rows.map(async (o) => {
      let customer_name = null, customer_phone = null;
      try {
        const u = await store.findUserById(o.customer_id);
        customer_name = u?.name || null;
        customer_phone = u?.phone || null;
      } catch { /* keep null */ }
      return { ...o, customer_name, customer_phone };
    }));
    res.json(pageOut({ ...page, rows }));
  } catch (e) { next(e); }
});

// Payment screenshots / references attached to an order (UTR proof).
r.get("/orders/:id/refs", async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);
    if (!order) throw AppError.notFound("Order not found");
    res.json({ data: await store.listRefsByOrder(order.id) });
  } catch (e) { next(e); }
});

export default r;
