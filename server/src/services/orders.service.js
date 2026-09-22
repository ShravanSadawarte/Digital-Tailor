import { store } from "../db/index.js";
import { AppError } from "../utils/errors.js";
import { checkOfferEligible, checkRequiredMeasurements, discountFor, priceFor } from "./pricing.service.js";

const TRANSITIONS = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["MEASUREMENT_PENDING", "CANCELLED"],
  MEASUREMENT_PENDING: ["MEASUREMENT_CONFIRMED", "CANCELLED"],
  MEASUREMENT_CONFIRMED: ["FABRIC_PENDING"],
  FABRIC_PENDING: ["CUTTING"],
  CUTTING: ["STITCHING"],
  STITCHING: ["TRIAL_READY"],
  TRIAL_READY: ["ALTERATION", "READY"],
  ALTERATION: ["READY", "CANCELLED"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function createOrder(customerId, { design_id, measurement_profile_id, offer_id, notes }) {
  const design = await store.getDesign(design_id);
  if (!design || design.customer_id !== Number(customerId)) throw AppError.notFound("Design not found");
  const profile = await store.getMProfile(measurement_profile_id);
  if (!profile || profile.customer_id !== Number(customerId)) throw AppError.notFound("Measurement profile not found");
  const values = await store.getMValues(profile.id);
  checkRequiredMeasurements(profile.garment_hint, values);

  const { garment, unitPrice, snapshot } = await priceFor(design.garment_id, design);
  const subtotal = unitPrice;
  let discount = 0;
  let offerUsage = null;
  if (offer_id) {
    const offer = await store.getOffer(offer_id);
    const orderCount = await store.countCustomerOrders(customerId);
    const check = checkOfferEligible(offer, {
      subtotal, categoryId: garment.category_id, isFirstOrder: orderCount === 0,
    });
    if (!check.ok) {
      const err = new AppError(400, check.code, "Offer cannot be applied");
      throw err;
    }
    const used = await store.countOfferUsage(offer.id);
    if (offer.usage_limit && used >= offer.usage_limit) {
      throw new AppError(400, "OFFER_LIMIT", "Offer usage limit reached");
    }
    discount = discountFor(offer, subtotal);
    offerUsage = { offerId: offer.id, discount };
  }

  const orderId = await store.createOrderFull({
    header: { customerId, measurementProfileId: profile.id, subtotal, discount, total: subtotal - discount, notes },
    item: { designId: design.id, garmentId: garment.id, qty: 1, unitPrice, options: { ...snapshot, fabric_source: design.fabric_source, occasion: design.occasion } },
    measurements: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { value: v, source: "customer" }])),
    offerUsage,
  });
  return store.getOrder(orderId);
}

export async function orderDetail(orderId, { customerId, admin = false }) {
  const order = await store.getOrder(orderId);
  if (!order || (!admin && order.customer_id !== Number(customerId))) throw AppError.notFound("Order not found");
  const [items, measurements, history] = await Promise.all([
    store.getOrderItems(order.id),
    store.getOrderMeasurements(order.id),
    store.getOrderHistory(order.id),
  ]);
  // Best-effort names so tracking screens don't show bare IDs.
  const named = await Promise.all(items.map(async (it) => {
    let garment_name = null, design_title = null;
    try { garment_name = (await store.getGarment(it.garment_id))?.name || null; } catch { /* keep null */ }
    try { design_title = (await store.getDesign(it.design_id))?.title || null; } catch { /* keep null */ }
    return { ...it, garment_name, design_title };
  }));
  return { ...order, items: named, measurements, history };
}

export async function transitionOrder(orderId, to, { by, note, admin = false }) {
  const order = await store.getOrder(orderId);
  if (!order) throw AppError.notFound("Order not found");
  if (!TRANSITIONS[order.status]?.includes(to)) {
    throw new AppError(400, "INVALID_TRANSITION", `Cannot move from ${order.status} to ${to}`);
  }
  if (!admin && to === "CANCELLED" && !["REQUESTED", "CONFIRMED"].includes(order.status)) {
    throw AppError.forbidden("Only staff can cancel at this stage");
  }
  await store.setOrderStatus(order.id, to);
  await store.addOrderHistory(order.id, order.status, to, by, note);
  await store.logAction({ adminId: by, action: "order.status", entity: "orders", entityId: order.id, detail: { from: order.status, to } }).catch(() => {});
  return store.getOrder(order.id);
}

export async function confirmMeasurements(orderId, values, adminId) {
  const order = await store.getOrder(orderId);
  if (!order) throw AppError.notFound("Order not found");
  if (["DELIVERED", "CANCELLED"].includes(order.status)) {
    throw new AppError(400, "INVALID_TRANSITION", "Order is closed");
  }
  await store.replaceOrderMeasurements(order.id, values, "tailor");
  await store.logAction({ adminId, action: "order.measurements", entity: "orders", entityId: order.id, detail: { fields: Object.keys(values) } }).catch(() => {});
  return store.getOrderMeasurements(order.id);
}
