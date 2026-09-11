# Digital Tailor — API Specification (API_SPEC)

> `CURRENT API STATUS: NO APIs IMPLEMENTED`
> Everything below is `RECOMMENDED API` for future implementation.
> Do not treat any endpoint as existing. Base URL (planned): same origin, prefix `/api`, JSON only.
>
> **Boundary (2026-09-11):** The API returns **text prompts, never images**. There are NO
> `/generate-image`, `/virtual-try-on`, `/generate-fashion-image`, or `/image-inference` endpoints.
> Forbidden concepts (do not add without explicit re-approval): image-generation APIs/services/queues/workers,
> virtual try-on, GPU inference, generated-image storage/URLs.

- Related: PRD.md (§6–7, §10), TECH_SPEC.md (§6–10, §14), DATABASE.md, SECURITY.md, TEST_PLAN.md
- Conventions: auth cookie session (see TECH_SPEC §7); pagination `?page&limit`; errors `{ error: { code, message, details? } }`.

**Standard codes used:** `200, 201, 204, 400, 401, 403, 404, 409, 429, 500`.
**Common error codes:** `VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, PROMPT_INVALID, RATE_LIMITED, INTERNAL_ERROR`.

---

## 1. Authentication

### API-A01 `POST /api/auth/register` — RECOMMENDED API
- **Purpose:** Create customer account (FR-001).
- **Auth:** none. **Rate-limited:** yes (strict).
- **Request:** `{ "name": "Priya", "phone": "+9198…", "email?": "…", "password": "≥8 chars" }`
- **Validation:** name 2–100; phone normalize + unique; email optional unique; password min 8.
- **Response `201`:** `{ "user": { "id", "name", "phone", "email", "role": "customer" } }` + session cookie.
- **Errors:** `400 VALIDATION_ERROR`, `409 CONFLICT` (phone/email taken), `429 RATE_LIMITED`.

### API-A02 `POST /api/auth/login` — RECOMMENDED API
- **Purpose:** Customer/admin login (FR-002/FR-023).
- **Request:** `{ "identifier": "phone or email", "password": "…" }`
- **Response `200`:** `{ "user": { … "role" } }` + session cookie (session regenerated).
- **Errors:** `400`, `401 UNAUTHENTICATED` (generic "invalid credentials" — no user enumeration), `429`.

### API-A03 `POST /api/auth/logout` — RECOMMENDED API
- **Auth:** required. **Response `204`.** Destroys session.

### API-A04 `GET /api/auth/me` — RECOMMENDED API
- **Auth:** required. **Response `200`:** `{ "user": { … } }`; else `401`.

---

## 2. Customer profile

### API-C01 `GET /api/customers/profile` — RECOMMENDED API
- **Auth:** customer. **Response `200`:** `{ "profile": { "name","phone","email","address","city","notes" } }`.

### API-C02 `PUT /api/customers/profile` — RECOMMENDED API
- **Auth:** customer. **Request:** `{ "name?","address?","city?","notes?" }` (phone/email change via separate verified flow — future).
- **Response `200`:** updated profile. **Errors:** `400`.

---

## 3. Measurements (FR-005)

Ownership: `where customer_id = req.user.id` on every query (BR-005).

### API-M01 `GET /api/measurements` — RECOMMENDED API
- **Auth:** customer. **Response `200`:** `{ "data": [ { "id","name","garment_hint","is_default","values": { "bust": 92.5, … } } ] }`.

### API-M02 `POST /api/measurements` — RECOMMENDED API
- **Request:** `{ "name": "My standard", "garment_hint?": "kurti", "values": { "bust": 92, "waist": 78, … } }`
- **Validation:** known `field_key`s only; numeric; per-field ranges (e.g., bust 60–160, neck depths 2–30); required-ness checked against `garment_hint` if provided; reject unknown keys.
- **Response `201`:** created profile. **Errors:** `400 VALIDATION_ERROR`.

### API-M03 `GET /api/measurements/:id` — RECOMMENDED API
- **Response `200`:** one profile or `404` (or `403` if other owner's — return `404` to avoid enumeration; document choice).

### API-M04 `PUT /api/measurements/:id` — RECOMMENDED API
- **Request:** same as M02 (full replace of values) + `is_default?`.
- **Response `200`.** Default-switch done transactionally.

### API-M05 `DELETE /api/measurements/:id` — RECOMMENDED API
- **Response `204`.** Blocked (`409`) if referenced as confirmed snapshot? No — snapshot lives in `order_measurements`, so delete allowed; order history unaffected.

---

## 4. Garments / Catalog (FR-003, FR-024)

### API-G01 `GET /api/garments?category=&q=&page=&limit=` — RECOMMENDED API
- **Auth:** public. **Response `200`:** `{ "data": [ { "id","name","category","base_price","image_path" } ], "pagination" }`. Only `is_active=1`. Images are catalog photography.

### API-G02 `GET /api/garments/:id` — RECOMMENDED API
- **Auth:** public. **Response `200`:** garment + `options` grouped by type (incl. styling types) + category. `404` if inactive/missing.

### API-G03 `GET /api/categories` — RECOMMENDED API
- **Auth:** public. List active categories.

Admin catalog CRUD (`POST/PUT/DELETE /api/admin/garments…`, `/api/admin/categories…`, `/api/admin/options…`) — RECOMMENDED API, `requireRole('admin')`, same validation + `admin_actions` logging. (IDs API-G10…G19 reserved.)

---

## 5. Designs (FR-004, FR-013–FR-015)

### API-D01 `POST /api/designs` — RECOMMENDED API
- **Auth:** customer.
- **Request:** `{ "garment_id", "title", "fabric_source": "own|shop", "fabric_detail?", "color?", "neck?", "sleeve?", "length_opt?", "fit?", "embroidery?", "occasion?", "style?", "footwear?", "accessories?", "hairstyle?", "grooming?", "season?", "location_context?", "background?", "lighting?", "extra_preferences?", "custom_notes?" }`
- **Validation:** garment exists+active; option values must exist in `garment_options` (or free-text only where allowed); free-text caps (≤500/field, notes ≤2000); prompt-injection screening (see SECURITY.md — reject control chars, cap lengths, never execute).
- **Response `201`:** design + server-generated `ai_prompt` text draft (see API-P11).
- **Errors:** `400` (incl. `PROMPT_INVALID`), `404` (garment).

### API-D02 `GET /api/designs` — RECOMMENDED API
- **Auth:** customer (own only). Paginated.

### API-D03 `GET /api/designs/:id` — RECOMMENDED API
- **Auth:** owner or admin.

### API-D04 `PUT /api/designs/:id` — RECOMMENDED API
- **Auth:** owner. Same validation as D01. Regenerates cached prompt text.

### API-D05 `DELETE /api/designs/:id` — RECOMMENDED API
- **Auth:** owner. `204`. Also deletes linked `uploaded_references` rows+files (tailoring refs).

---

## 6. Fashion Prompt Generation (FR-006/FR-027 — TEXT ONLY)

> Concept: `fashion preferences → AI prompt generation → text prompt`. Output is text, not an image.

### API-P11 `POST /api/prompts/generate` — RECOMMENDED API
- **Purpose:** Generate Fashion Prompt (primary AI operation).
- **Auth:** optional-customer (public with stricter rate limit, or customer-only — decide in Phase 7; document choice). **Rate-limited:** yes.
- **Input (fashion preferences):** `{ "occasion?", "outfit_type?"/"garment_id?", "clothing_category?", "colors?", "style?", "fit?", "fabric?", "footwear?", "accessories?", "hairstyle?", "grooming?", "season?", "location_context?", "background?", "lighting?", "photography_style?", "gender?" (default womenswear context), "age_group?" (where appropriate), "extra_preferences?", "design_id?" (to reuse saved prefs) }`
- **Validation:** allow-list enums where defined; free-text caps; missing-preference handling (fill tasteful defaults, never invent PII); prompt-injection screening; no photo/binary fields accepted (reject with `400` if sent).
- **Output (text, not image):** `200 { "prompt": "Use the uploaded photo as the primary reference. Preserve …", "warnings?": [] }` + optional `prompt_history` row (text only).
- **Errors:** `400 VALIDATION_ERROR/PROMPT_INVALID`, `429 RATE_LIMITED`.

### API-P12 `POST /api/designs/:id/prompt` — RECOMMENDED API
- **Purpose:** (Re)generate structured ChatGPT text prompt from a saved design (deterministic template in v1; optional LLM polish later, text-only).
- **Response `200`:** `{ "prompt": "…" }` + cached to `customer_designs.ai_prompt` (+ `prompt_history` row). UI shows BR-002/BR-010/BR-011 notices + ChatGPT steps.

### API-P13 `GET /api/prompts/history` — RECOMMENDED API (if FR-027 approved)
- **Auth:** customer (own only, paginated). **Response:** past `{ id, inputs_snapshot, prompt_text, created_at }` — text only, no images.

---

## 7. Orders (FR-007–FR-008, FR-016–FR-017, FR-022)

### API-O01 `POST /api/orders` — RECOMMENDED API
- **Auth:** customer.
- **Request:** `{ "design_id": 12, "measurement_profile_id": 3, "offer_id?": 5, "notes?" }` (v1: single-item order; multi-item via `items[]` reserved).
- **Server logic (transaction):** load design+garment (price = base + deltas, recomputed — never trust client total); verify measurement profile ownership; verify offer eligibility (active, dates, scope, first-order, usage limit); create `orders` (REQUESTED) + `order_items` (snapshot) + `order_measurements` (copy profile values, source='customer') + `order_status_history` row + `offer_usage` row if applied.
- **Response `201`:** `{ "order": { "id","status":"REQUESTED","subtotal","discount","total" } }`.
- **Errors:** `400` (incl. `OFFER_INVALID`/`OFFER_EXPIRED`), `404`, `409`.

### API-O02 `GET /api/orders` — RECOMMENDED API
- **Auth:** customer (own) / admin (`?customer_id&status&` filters, paginated).

### API-O03 `GET /api/orders/:id` — RECOMMENDED API
- **Auth:** owner or admin. **Response:** order + items + measurement snapshot + status history + offer + appointments link.

### API-O04 `PATCH /api/orders/:id/status` — RECOMMENDED API
- **Auth:** `admin` only (BR-006).
- **Request:** `{ "to": "CONFIRMED|…|DELIVERED|CANCELLED", "note?" }`
- **Validation:** transition must be in allowed state machine (ARCHITECTURE.md §4); terminal states immutable.
- **Response `200`:** updated order. Appends history + `admin_actions` row. **Errors:** `400 INVALID_TRANSITION`, `403`, `404`, `409`.

### API-O05 `POST /api/orders/:id/confirm-measurements` — RECOMMENDED API
- **Auth:** admin. **Request:** `{ "values": { … } }` (final tailor values).
- **Effect:** upserts `order_measurements` with `source='tailor'`; moves order toward MEASUREMENT_CONFIRMED (via O04 or atomically — pick one, document).
- **Why:** implements BR-001.

---

## 8. Offers (FR-009, FR-020)

### API-F01 `GET /api/offers` — RECOMMENDED API
- **Auth:** public (only active, within dates) for customers; admin sees all via `/api/admin/offers`.
- **Response `200`:** list with `discount_type/value/min_order/scope/ends_at`.

### API-F02 `POST /api/offers` — RECOMMENDED API (admin)
- **Request:** `{ "title","description?","discount_type":"percent|flat","discount_value","min_order?","scope_category_id?","first_order_only?","starts_at?","ends_at?","usage_limit?","is_active?" }`
- **Validation:** percent 1–90; flat < min reasonable cap; `ends_at > starts_at`; scope category exists.
- **Response `201`.** Logs `admin_actions`.

### API-F03 `PUT /api/offers/:id` — RECOMMENDED API (admin) · API-F04 `DELETE /api/offers/:id` — RECOMMENDED API (admin, soft-deactivate preferred; hard delete only if unused).

---

## 9. Appointments (FR-010, FR-019)

### API-P01 `POST /api/appointments` — RECOMMENDED API
- **Auth:** customer. **Request:** `{ "reason": "measurement|fabric-drop|design-discussion|trial|delivery|other", "scheduled_at": "ISO future", "order_id?", "notes?" }`
- **Validation:** future datetime; within shop hours (config constant); order ownership if linked.
- **Response `201`.**

### API-P02 `GET /api/appointments` — RECOMMENDED API
- **Auth:** customer (own) / admin (all, `?status&date&` filters).

### API-P03 `PATCH /api/appointments/:id/status` — RECOMMENDED API
- **Auth:** admin (CONFIRMED/COMPLETED/CANCELLED); customer may CANCEL own REQUESTED (document choice).
- **Request:** `{ "to": "…", "note?" }`.

---

## 10. Uploads — tailoring references only (FR-014)

### API-U01 `POST /api/uploads` — RECOMMENDED API
- **Auth:** customer. `multipart/form-data`: `file` + `design_id?`/`order_id?` (exactly one). For fabric/design refs only — **visualization photos must be rejected** (instruct user to attach them in ChatGPT instead).
- **Validation:** MIME sniff `jpeg/png/webp`, ext whitelist, ≤5 MB, ownership of linked design/order.
- **Response `201`:** `{ "id","mime","size_bytes" }`. **Errors:** `400 INVALID_FILE`, `413`.

---

## 11. Admin (FR-011, FR-018, FR-023–FR-025)

`GET /api/admin/summary` (counts by status, today's appointments, active offers), `GET /api/admin/customers`, `GET /api/admin/customers/:id` — all RECOMMENDED API, `requireRole('admin')`, paginated, minimal PII in logs (prompt text truncated).

---

## 12. Traceability excerpt

`FR-006 → API-P11/P12 → customer_designs.ai_prompt + prompt_history (text) → UI Prompt Studio → TC-Pxx → Phase 7 tasks.` Full matrix: TEST_PLAN.md §12.

---

*End of API_SPEC. All endpoints RECOMMENDED; none implemented. Text-prompt boundary (2026-09-11) applies.*
