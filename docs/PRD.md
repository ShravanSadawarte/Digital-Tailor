# Digital Tailor — Product Requirements Document (PRD)

> `CURRENT STATUS: NOT IMPLEMENTED`
> This document describes the **PLANNED / RECOMMENDED** product.
> No application functionality described here is implemented yet.
> See `docs/CHANGELOG.md` and `docs/TASKS.md` for status and roadmap.
>
> **Official product direction (2026-09-11):** Digital Tailor is a **fashion styling and AI prompt-generation platform**.
> It does **NOT** provide built-in AI image generation, virtual try-on, image generation APIs, or AI image processing.
> It generates **personalized, ready-to-copy AI fashion visualization prompts** that the user pastes into **ChatGPT together with their own photo**.

- **Product:** Digital Tailor
- **Version:** 0.2.0 (prompt-generation direction)
- **Date:** 2026-09-11
- **Audience:** Product owner, tailor/admin, developers, AI coding agents, QA
- **Related docs:** TECH_SPEC.md, ARCHITECTURE.md, DATABASE.md, API_SPEC.md, UI_SPEC.md, SECURITY.md, TEST_PLAN.md, TASKS.md, RULES.md

---

## 1. Product Overview

### 1.1 What is Digital Tailor?

Digital Tailor is a **women-focused digital tailoring platform** for a real, small tailoring business, now focused as a **fashion styling and AI prompt-generation platform**. It does not replace stitching — it digitizes everything *around* stitching: design selection, customization, measurements, **personalized AI fashion prompt generation**, order requests, appointments, offers, and order tracking.

> Core value proposition: **Digital Tailor helps users decide what to wear and creates personalized AI fashion visualization prompts that they can use with ChatGPT and their own photo.**
>
> Do NOT describe Digital Tailor as an AI image-generation platform.

### 1.2 Commercial relationship

```text
Customer → Digital Tailor (web app) → Tailor/Admin → Physical Garment → Customer
```

Plus the external visualization path (outside system boundary):

```text
Digital Tailor → Personalized AI Fashion Prompt → User copies prompt → ChatGPT + user's photo → Fashion visualization
```

| Actor | Role |
|---|---|
| Customer (primarily women/girls) | Selects fashion preferences, generates + copies AI prompt, submits order request, books appointment, tracks status. Attaches **own photo directly in ChatGPT** (never in Digital Tailor). |
| Digital Tailor (system) | Stores profiles, measurements, designs, orders, appointments, offers. Generates structured **text prompts** for ChatGPT. Enforces roles and validation. **Does NOT generate images, does NOT receive the user's visualization photo.** |
| Tailor / Admin | Confirms final measurements, confirms fabric, manages catalog/pricing/offers/orders/appointments, updates stitching status. |
| ChatGPT (external service) | Receives the user's photo + pasted prompt and generates the fashion visualization. Outside Digital Tailor's system boundary; its own privacy/terms apply. |
| Physical Garment | Produced offline by the tailor after digital request + in-person confirmation. |

The system is **decision-support + record-keeping**, not manufacturing automation and not an image generator. The tailor's physical measurement and craftsmanship remain authoritative (see BR-001).

### 1.3 Supported garment types (PLANNED)

- Salwar Suit
- Kurti
- Pant Kurti (kurti + pant set)
- Palazzo (and palazzo sets)
- One Piece / One-piece dress
- Custom dresses (festive, casual, formal)
- Other women's customized clothing (blouse, skirt, gown alterations/customization as defined by admin)

Garment categories and options are admin-configurable (FR-024).

### 1.4 What the system does / does not do

**Does (PLANNED):** catalog, customization, fashion preference selection, **personalized AI fashion prompt generation (text only) + copy + ChatGPT usage instructions**, measurement profiles, order requests, appointments, offers, status tracking, reorder.

**Does not (out of scope, see §16):** built-in AI image generation, virtual try-on / virtual fitting, image generation APIs/services/queues/workers, GPU image infrastructure, generated-image storage/galleries, image inference endpoints, auto-cutting, guaranteed-accurate body scanning, payments (v1), logistics, native mobile app, multi-branch ERP.

**Explicitly removed from scope (2026-09-11 decision):** AI image generation inside Digital Tailor; virtual try-on; `/generate-image`, `/virtual-try-on`, `/generate-fashion-image`, `/image-inference` style endpoints; Stable Diffusion / DALL-E style model hosting; generated-image database records/URLs; CDN specifically for generated images.

---

## 2. Problem Statement

| # | Traditional pain | Consequence |
|---|---|---|
| P-01 | Customer must visit shop before any design discussion. | Wasted trips, limited reach, lost occasion customers. |
| P-02 | Design discussion is mostly verbal (neck, sleeve, length, fit). | Misunderstanding, rework, repeated discussions. |
| P-03 | Measurements recorded manually on paper/register. | Lost records, re-measurement every visit. |
| P-04 | No visualization before stitching. | Anxiety, mismatch of expectations. |
| P-05 | No reusable customer profile. | Repeat customers treated as new every time. |
| P-06 | No order history / reorder. | Customer cannot say "stitch same as last Diwali suit". |
| P-07 | Offers/promotions are word-of-mouth only. | Festival/seasonal demand not captured digitally. |
| P-08 | Order status only known by visiting/calling. | Calls, uncertainty, poor experience. |
| P-09 | Users don't know what to wear or how to describe it to an AI. | Poor external-AI results; vague/generic prompts. |

Digital Tailor addresses P-01…P-08 with digitized artifacts (`customer_designs`, `measurement_profiles`, `orders` + `order_status_history`, `offers`, `appointments`) and P-04/P-09 with a **high-quality copy-paste prompt** for ChatGPT — without ever handling the user's photo.

---

## 3. Product Goals

| ID | Goal | Measures (§17) |
|---|---|---|
| G-01 | Digitize the tailoring workflow end-to-end (browse → customize → measure → request → confirm → stitch → deliver). | Order can be traced digitally through all RECOMMENDED statuses. |
| G-02 | Improve customer experience (fewer visits, clearer choices). | ≤2 visits for standard order; design stored, not re-explained. |
| G-03 | Reduce repeated design discussions. | Saved designs reusable; custom instructions preserved verbatim. |
| G-04 | Store reusable measurements. | Customer can reuse a profile across orders. |
| G-05 | Allow structured garment customization + fashion preference selection. | Neck/sleeve/length/fit/fabric/color/footwear/accessories/hairstyle/background/lighting etc. captured per design. |
| G-06 | Provide personalized AI fashion prompt generation for ChatGPT (text only). | Prompt generated from preferences; copy + ChatGPT instructions work; API returns text, not an image. |
| G-07 | Improve order management for tailor. | Admin can list/filter/update all orders + history. |
| G-08 | Allow tailor-controlled offers. | Admin CRUD + activation/expiry; customer sees eligible offers. |
| G-09 | Build reusable customer profile. | Profile + measurements + designs + orders linked to one user. |
| G-10 | Increase commercial reach. | Mobile-responsive web usable without install; shareable catalog. |
| G-11 | Minimize personal-image handling (privacy + cost). | Zero visualization photos stored/transmitted by Digital Tailor; no GPU/image infra. |

---

## 4. Target Users

### Primary — Female customers

Women/girls ordering customized stitched clothing for daily wear, office, festivals, weddings, functions. Range from smartphone-comfortable to low-digital-literacy users. UI must be mobile-first, image-oriented, plain-language, with visual measurement guides (see UI_SPEC.md).

### Secondary — Tailor / Admin

The business owner (and optionally 1–2 helpers with admin role). Manages customers, designs, categories, pricing, measurements, orders, stitching status, appointments, offers. Needs a simple, trustworthy back-office, not enterprise ERP.

No other roles in v1. Future roles (e.g., `staff` with limited permissions) are a future enhancement.

---

## 5. User Personas

### Persona 1 — Regular Customer (Priya, 32, office-goer)

- Orders kurtis/suits every 1–2 months.
- Brings some fabric, picks some from tailor.
- Wants: "Save my measurements once, reorder quickly, track status without calling."
- Key features: measurement profiles, reorder, order tracking, offers.

### Persona 2 — Occasion Customer (Ayesha, 24, wedding/festival shopper)

- Orders 2–4 premium outfits per year for Eid/Diwali/weddings.
- Cares about neckline, sleeves, embroidery, exact look.
- Wants: "Help me decide what to wear and give me a prompt I can use with my photo in ChatGPT."
- Key features: preference selection, prompt generator + copy, reference upload (fabric/design only), appointment for trial.

### Persona 3 — New Customer (Kavya, 19, first-time)

- Never stitched custom before; unsure of measurements.
- Brings her own cloth gifted by family.
- Wants: "Guide me step by step; tell me when to visit; show me exactly how to use the prompt in ChatGPT."
- Key features: guided customizer, visual measurement help, ChatGPT usage instructions, appointment booking, contact tailor.

### Persona 4 — Tailor / Admin (Meena, 45, business owner)

- Runs the physical shop; expert in fitting, limited time for software.
- Wants: "See today's work, update status in one click, create Diwali offer in 2 minutes."
- Key features: admin dashboard, order status updates, measurement confirmation, offer activation, appointment list.

---

## 6. Core Use Cases

### Customer use cases

| UC ID | Use case | Description (PLANNED) |
|---|---|---|
| UC-C01 | Browse garments | List/filter garment categories and garments. |
| UC-C02 | Select garment | View garment details, base price, options, reference images (catalog images, not generated). |
| UC-C03 | Customize garment + select fashion preferences | Choose fabric source (own/shop), color, neck, sleeve, length, fit, embroidery + occasion/outfit/style/footwear/accessories/hairstyle/grooming/background/lighting/season/location context. |
| UC-C04 | Add custom instructions | Free-text notes, e.g. "dark green kurti, round neck, 3/4 sleeves, straight fit, embroidery around neckline". |
| UC-C05 | Upload reference | Upload fabric photo / design reference (jpg/png, size-limited). For tailoring only — NOT the visualization photo. |
| UC-C06 | Create measurement profile | Enter measurements with visual guide; name profile ("My standard", "Post-alteration"). |
| UC-C07 | Save measurements | Persist profile for reuse. |
| UC-C08 | Reuse measurements | Attach a saved profile to a design/order. |
| UC-C09 | Generate personalized AI fashion prompt | System builds detailed text prompt from fashion preferences (text out, no image). |
| UC-C10 | Copy prompt + follow ChatGPT instructions | Copy to clipboard; open ChatGPT; user attaches own photo + pastes prompt in ChatGPT. |
| UC-C11 | Create order/request | Submit design + measurement profile + fabric info + offer (if eligible). |
| UC-C12 | Track order | View current status + history timeline. |
| UC-C13 | Book appointment | Request visit for measurement / fabric drop / trial / delivery. |
| UC-C14 | View offers | See active offers (festival, seasonal, first-order, Today Special). |
| UC-C15 | Apply eligible offer | Attach offer to order if rules pass (dates, garment scope). |
| UC-C16 | View previous orders | List own orders with status. |
| UC-C17 | Reorder previous design | Clone a past design/order into a new request. |
| UC-C18 | Contact tailor | Phone/WhatsApp/address + contact form (PLANNED). |
| UC-C19 | View/regenerate prompt history (text) | Optionally revisit past generated text prompts (no images stored). |

### Admin use cases

| UC ID | Use case |
|---|---|
| UC-A01 | Login (admin role) |
| UC-A02 | Manage customers (view, deactivate) |
| UC-A03 | Manage designs (view customer designs) |
| UC-A04 | Manage garment categories |
| UC-A05 | Manage garments + options + pricing |
| UC-A06 | Manage orders + status transitions |
| UC-A07 | Manage measurements (view/confirm final) |
| UC-A08 | Manage offers (create/activate/expire) |
| UC-A09 | Update stitching status (with history entry) |
| UC-A10 | Manage appointments (confirm/complete/cancel) |

Traceability: UC → FR (§7) → API (API_SPEC.md) → DB (DATABASE.md) → UI (UI_SPEC.md) → Test (TEST_PLAN.md) → Task (TASKS.md). See §18 / docs consistency matrix.

---

## 7. Core Features

`CURRENT STATUS: NOT IMPLEMENTED` for all. `PLANNED` for v1 unless marked future.

| Feature ID | Feature | User | Description (PLANNED) |
|---|---|---|---|
| FR-001 | Customer Registration | Customer | Register with name, phone/email, password. Validation + hashed password. |
| FR-002 | Customer Login/Logout | Customer | Session or JWT (see TECH_SPEC/ SECURITY). Rate-limited. |
| FR-003 | Garment Browsing | Customer | List categories + garments with catalog images, base price, active flag. |
| FR-004 | Garment Customization + Fashion Preferences | Customer | Structured options: fabric source, color, neck, sleeve, length, fit, embroidery, notes + occasion/outfit/style/footwear/accessories/hairstyle/grooming/season/location/background/lighting. |
| FR-005 | Measurement Profiles | Customer | Multiple named profiles per customer; values per garment-relevant fields. |
| FR-006 | Personalized AI Fashion Prompt Generator | Customer | Auto-generated detailed **text** prompt from preferences; copy + regenerate/edit + ChatGPT instructions. Returns text, never an image. No virtual try-on. |
| FR-007 | Order Creation | Customer | Design + measurement profile + fabric + appointment context → order REQUESTED. |
| FR-008 | Order Tracking | Customer | Own orders + status timeline. |
| FR-009 | Offers (view/apply) | Customer | List active offers; eligibility check on order. |
| FR-010 | Appointment Booking | Customer | Date/time/reason; admin confirms. |
| FR-011 | Admin Dashboard | Admin | Counts: new requests, in-stitching, trials due, appointments today, active offers. |
| FR-012 | Customer Profile | Customer | View/update name, phone, address; change password. |
| FR-013 | Saved Designs | Customer | CRUD own designs (garment + options + notes + refs). |
| FR-014 | Reference Upload | Customer | Upload fabric/design images linked to design/order (tailoring refs only; NOT visualization photos). Validated (type/size). |
| FR-015 | Reorder | Customer | Clone past design/order. |
| FR-016 | Order Status Management | Admin | Transition through RECOMMENDED statuses with history. |
| FR-017 | Final Measurement Confirmation | Admin | Confirm/override measurements used for stitching. |
| FR-018 | Customer Management | Admin | List/search customers, view orders, deactivate. |
| FR-019 | Appointment Management | Admin | Confirm/complete/cancel appointments. |
| FR-020 | Offer Management | Admin | CRUD + activate/deactivate + expiry. |
| FR-021 | Contact Tailor | Customer | Shop info + contact form (stored or emailed per config). |
| FR-022 | Order History | Customer | Paginated own orders. |
| FR-023 | Admin Auth + RBAC | Admin | `customer` / `admin` roles enforced server-side. |
| FR-024 | Catalog Management | Admin | CRUD categories, garments, options, pricing, catalog images. |
| FR-025 | Audit Trail | System | `order_status_history` + `admin_actions` for key changes. |
| FR-026 | Responsive Web UI | All | Mobile-first HTML/CSS/JS, no install. (Future: native app — out of scope.) |
| FR-027 | Prompt History (text) | Customer | Optionally revisit past generated text prompts (no images). See DATABASE.md `prompt_history`. |

Out-of-scope features (NOT to be built): built-in image generation, virtual try-on/fitting, image inference APIs, generated-image storage/galleries — see §16.

---

## 8. Measurement System

`CURRENT STATUS: NOT IMPLEMENTED` — `RECOMMENDED` design below.

### 8.1 Measurement fields (cm; 1 decimal allowed)

| Field key | Label | Applies to (example) |
|---|---|---|
| `bust` | Bust / Chest | Kurti, suit, one-piece, blouse |
| `waist` | Waist | Kurti, pant, palazzo, one-piece |
| `hip` | Hip | Kurti, pant, palazzo, one-piece |
| `shoulder` | Shoulder | Kurti, suit, blouse, one-piece |
| `armhole` | Armhole | Kurti, blouse, one-piece |
| `sleeve_length` | Sleeve Length | Kurti, suit, blouse |
| `kurti_length` | Kurti Length | Kurti, pant-kurti top |
| `dress_length` | Dress Length | One-piece, gown, custom dress |
| `neck_width` | Neck Width | All tops/dresses |
| `front_neck_depth` | Front Neck Depth | All tops/dresses |
| `back_neck_depth` | Back Neck Depth | All tops/dresses |
| `pant_length` | Pant Length | Pant, pant-kurti bottom |
| `palazzo_length` | Palazzo Length | Palazzo |
| `inseam` | Inseam | Pant, palazzo |
| `thigh` | Thigh | Pant, palazzo |
| `bottom_width` | Ankle / Bottom Width | Pant, palazzo, salwar bottom |

Ranges and required-ness are validated server-side (see API_SPEC.md, TEST_PLAN.md). Example sane ranges: `bust 60–160`, `waist 50–160`, `hip 60–170`, lengths `20–180`, neck depths `2–30`. Exact values finalized in TECH_SPEC/DATABASE.

### 8.2 Garment → required measurements (RECOMMENDED)

**Kurti:** bust, waist, hip, shoulder, armhole, sleeve_length, kurti_length, neck_width, front_neck_depth, back_neck_depth.

**Pant (pant-kurti bottom / standalone):** waist, hip, thigh, inseam, pant_length, bottom_width.

**Palazzo:** waist, hip, thigh, inseam, palazzo_length, bottom_width.

**Salwar Suit (top + bottom):** kurti set + bottom set (bottom type selects pant/palazzo/salwar fields).

**One Piece:** bust, waist, hip, shoulder, armhole, sleeve_length, dress_length, neck_width, front_neck_depth, back_neck_depth.

**Custom dress:** admin/template-defined subset; tailor confirms.

Implementation: `garment_categories` defines expected fields; `measurement_values` stores key→value rows so profiles can hold heterogeneous sets (see DATABASE.md). UI shows only relevant inputs + visual guide per field.

---

## 9. Smart Measurement Strategy

> Do NOT claim camera measurement is accurate. Final tailor measurement is authoritative (BR-001).

| Phase | Name | Status | Description |
|---|---|---|---|
| Phase 1 | Manual entry + visual guides | `PLANNED (v1)` | Number inputs with cm unit, diagrams/tape-position help, range validation. |
| Phase 2 | Saved reusable profiles | `PLANNED (v1)` | Multiple profiles; default profile; attach to orders; tailor-visible. |
| Phase 3 | AI/camera-assisted estimate | `FUTURE` | Photo → landmark estimate → approximate values for customer review. Must be labeled ESTIMATE. |
| Phase 4 | Tailor confirmation | `PLANNED (v1)` | In-shop final measurement overrides customer values; stored as confirmed snapshot on order. |

Phase 3 workflow (future): `Camera/photo → landmark detection → approximate measurements → customer review → tailor confirmation`. Never auto-cut from estimates.

> NOTE: Phase 3 is a future measurement aid only. It is unrelated to fashion visualization photos, which are never sent to Digital Tailor (see §10).

---

## 10. AI Fashion Prompt Generation (official — replaces AI visualization)

`CURRENT STATUS: NOT IMPLEMENTED` — `PLANNED` workflow below.

### Official flow

```text
User → Opens Digital Tailor → Selects fashion preferences → Selects occasion/style/outfit/etc.
→ Digital Tailor generates personalized AI visualization prompt → User clicks "Copy Prompt"
→ User opens ChatGPT → User attaches their own photo → User pastes the Digital Tailor prompt
→ ChatGPT generates the fashion visualization → User evaluates the result
```

Digital Tailor does NOT receive the user's photo as part of this flow. Digital Tailor does NOT generate the final image.

### 10.1 Prompt-generator inputs (PLANNED)

The AI prompt generator may consider: occasion, gender, age group where appropriate, outfit type, clothing category, colors, style, fit, fabric, footwear, accessories, hairstyle, grooming, season, location/cultural context, background, lighting, photography style, additional user preferences — plus tailoring fields already in §8/FR-004 (garment type, neck, sleeves, length, embroidery, custom notes).

### 10.2 System behavior (PLANNED)

1. User completes fashion preference selection.
2. System builds a **personalized, ready-to-copy English text prompt**, e.g.:
   > "Use the uploaded photo as the primary reference. Preserve the person's identity, facial characteristics and realistic body proportions. Show her wearing a dark green cotton straight-fit kurti with a round neckline and gold embroidery around the neck, 3/4 sleeves, knee length, with matching palazzo pants. Footwear: nude block heels. Hairstyle: neat low bun. Background: warm indoor festive setting, soft natural lighting, photorealistic full-length fashion visualization. Use realistic clothing fit, natural fabric drape and natural skin appearance. Avoid distorted faces, extra limbs, warped text or other image artifacts. Festive, modest look."
3. User clicks **Copy Prompt**, then **Open ChatGPT** (link/button with step-by-step instructions).
4. User attaches their own photo **directly in ChatGPT**, pastes the prompt, and generates the visualization there.
5. The generated image stays in ChatGPT. Digital Tailor never receives, processes, or stores it.

### 10.3 AI prompt generator rules (must be documented in UI + TEST_PLAN)

The generated prompt must: be personalized; use the user's selected preferences; be ready to copy and paste; be understandable by ChatGPT; request photorealistic visualization; preserve the person's identity; preserve realistic body proportions; describe clothing clearly; describe fit and fabric realistically; include relevant accessories and footwear; include background and lighting when applicable; avoid unnecessary invented details; avoid overly generic prompts; avoid excessive technical terminology. It must output the final user-ready prompt rather than an explanation. It must instruct the external AI to use the uploaded photo as primary reference, preserve identity/face/proportions, apply the selected clothing with realistic fit and fabric behavior, maintain natural skin and appropriate lighting, and avoid common artifacts.

### 10.4 Limits (must be shown in UI)

- Preview is **informational only** (BR-002); fabric drape, exact shade, and stitching will differ. ChatGPT output does not guarantee the physical garment.
- Digital Tailor handles fashion preferences, prompt inputs, and generated **text** prompts only. It does NOT handle the user's visualization photo, generated images, or image-model inference.
- Once the user leaves Digital Tailor and uploads a photo to ChatGPT, **ChatGPT's own privacy policies and terms apply** — Digital Tailor cannot guarantee external privacy (see SECURITY.md).

---

## 11. Offers

`CURRENT STATUS: NOT IMPLEMENTED` — `PLANNED`.

Admin/tailor can create (examples): festival (Diwali, Navratri, Eid), seasonal, first-order, garment-specific, limited-time, custom promo, **"Today Special"** (admin-controlled promotional message/offer — NOT automated mood/AI logic).

Offer fields (RECOMMENDED): title, description, discount type (percent/flat), value, min order, garment/category scope, start/end datetime, active flag, usage limit, first-order-only flag.

Rules: expiry enforced server-side (BR-003); only admin modifies (BR-004); eligibility re-checked at order creation; expired/inactive offers rejected.

---

## 12. Order Workflow

`RECOMMENDED` statuses — `NOT IMPLEMENTED` yet.

```text
Design Selected
      ↓
Customization / Fashion Preferences Completed
      ↓
Measurement Profile Selected
      ↓
AI Prompt Generation (optional, text only → ChatGPT external)
      ↓
Order Request Submitted (REQUESTED)
      ↓
Customer Visits Tailor (CONFIRMED / MEASUREMENT_PENDING)
      ↓
Final Measurement Confirmed (MEASUREMENT_CONFIRMED)
      ↓
Fabric Received/Confirmed (FABRIC_PENDING → CUTTING)
      ↓
Cutting
      ↓
Stitching
      ↓
Trial/Fitting (TRIAL_READY)
      ↓
Adjustments (ALTERATION, if needed)
      ↓
Ready (READY)
      ↓
Delivered (DELIVERED)
(CANCELLED from eligible states by admin/customer rules)
```

Full state machine + allowed transitions: see ARCHITECTURE.md (§4) and API_SPEC.md (`PATCH /api/orders/:id/status`).

---

## 13. Business Rules

| ID | Rule |
|---|---|
| BR-001 | Final physical measurements confirmed by the tailor override customer-entered measurements for stitching. |
| BR-002 | AI visualization is informational and does not guarantee exact physical appearance. UI must state this. Digital Tailor generates prompts only, never images. |
| BR-003 | An offer may have start/end dates; expired/inactive offers must be rejected server-side. |
| BR-004 | Only `admin` role can create/modify/activate offers, catalog, pricing, and order statuses. |
| BR-005 | A customer can access only their own measurements, designs, prompts, orders, appointments. |
| BR-006 | Order status changes are controlled by authorized staff (admin); customers cannot self-advance stitching states. |
| BR-007 | Measurement values must be within garment-relevant sane ranges; invalid values rejected. |
| BR-008 | Uploaded files must pass type/size/filename checks; never executed as code. Uploads are fabric/design tailoring references only — never visualization photos. |
| BR-009 | `CANCELLED` is terminal; `DELIVERED` is terminal; transitions logged in history. |
| BR-010 | **Digital Tailor does not generate fashion images. It generates personalized AI text prompts for use with ChatGPT + the user's own photo.** No virtual try-on or image-inference endpoints. |
| BR-011 | Digital Tailor must not collect, transmit, or store user photographs for the visualization workflow. The user provides their photo directly to ChatGPT. |

---

## 14. Non-Functional Requirements

| ID | Category | Requirement (PLANNED) — HOW |
|---|---|---|
| NFR-001 | Performance | Light static HTML + minimal JS; p95 list pages < 2s on 4G; p95 prompt generation < 2s (text only, no GPU); paginate lists (≤20/page); index FKs + `created_at`. |
| NFR-002 | Security | See SECURITY.md: hashing, RBAC, parameterized SQL, XSS escaping, CSRF/CORS, rate limits (incl. prompt API), prompt-injection defenses, `.env` secrets. |
| NFR-003 | Availability | Single-node deployment sufficient (no image workers/GPU); graceful DB-failure pages; daily MySQL backup (see TECH_SPEC §Production). |
| NFR-004 | Maintainability | Small Express route/service/db modules; migrations; lint; docs updated with behavior changes. |
| NFR-005 | Responsive Design | Mobile-first CSS (360px baseline); breakpoints in UI_SPEC.md; touch targets ≥44px; copy-to-clipboard works on mobile. |
| NFR-006 | Accessibility | Semantic HTML, labels, focus states, contrast ≥4.5:1 body, keyboard-navigable, alt text on catalog images, prompt readable by screen readers. |
| NFR-007 | Data Integrity | FK constraints, transactions for order creation, server validation, status-history append-only, prompt history text-only. |
| NFR-008 | Privacy | Measurements access-controlled; visualization photos never collected; minimal collection; retention/deletion per SECURITY.md; external-AI terms clearly disclosed. |

---

## 15. Constraints

- Small-business environment: one shop, limited staff time, low ops budget.
- Initial web app: HTML5 + CSS3 + Vanilla JS frontend; Node.js + Express backend; MySQL.
- Limited dev resources: prefer boring, well-understood patterns; no microservices/K8s/Kafka/Redis/GraphQL unless justified.
- AI boundary: external ChatGPT visualization is user-driven; prompt-copy flow must degrade gracefully offline (save design/prompt draft locally). No image-generation model inside Digital Tailor infra.
- Internet required for the ChatGPT step; core catalog/measurement/order/prompt-drafting should still render cached/static content where feasible.

---

## 16. Out of Scope (v1)

- Built-in AI image generation / virtual try-on / virtual fitting / image inference (removed 2026-09-11).
- Image-generation backend, model hosting, GPU servers/workers, image queues, generated-image storage/galleries/CDN for generated images.
- Automated physical cloth cutting / manufacturing automation.
- Fully automated body measurement with guaranteed accuracy.
- Payment gateway (add later as enhancement with PCI-aware provider).
- Delivery logistics / courier integration.
- Multi-branch enterprise architecture.
- Native mobile app (responsive web only; see Future).
- Microservices / Kubernetes / event streaming.

---

## 17. Success Criteria (measurable)

| # | Criterion (post-implementation) |
|---|---|
| S-01 | Customer can complete browse → customize → measure → request without staff help (tested on mobile). |
| S-02 | Reorder of a past design takes < 3 minutes in usability test. |
| S-03 | 100% of orders have a tailor-confirmed measurement snapshot before CUTTING. |
| S-04 | Zero order-status updates without a history row; zero customer access to others' data (authz tests pass). |
| S-05 | Admin creates/activates an offer in < 5 minutes; expired offers auto-rejected (TC coverage). |
| S-06 | Prompt generation works for all catalog garments; copy + Open ChatGPT succeed; prompt contains identity-preservation + clothing + fit/fabric + background/lighting instructions (TC-P lightly). |
| S-07 | p95 key pages < 2s; Lighthouse mobile ≥85; no critical security findings. |
| S-08 | Zero visualization photos stored by Digital Tailor (audit); privacy notice shown on prompt screen. |

---

## 18. Traceability (summary)

Full matrix lives in `docs/TEST_PLAN.md` (§12) and `docs/TASKS.md`.

Example: `FR-006 Prompt Generator → API: POST /api/prompts* → DB: customer_designs.ai_prompt (+ prompt_history text) → UI: Prompt Studio → Tests: TC-Pxx → Tasks: Phase 7`.

---

*End of PRD. Status: documentation updated to prompt-generation direction (2026-09-11); implementation not started. Next: TECH_SPEC.md, ARCHITECTURE.md.*
