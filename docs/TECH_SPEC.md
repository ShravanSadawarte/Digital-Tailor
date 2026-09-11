# Digital Tailor — Technical Specification (TECH_SPEC)

> `CURRENT: Not implemented.`
> Below is the `RECOMMENDED` specification for future implementation.
> No backend, database, auth, upload, or AI integration described here exists yet.
>
> **Boundary (2026-09-11):** Digital Tailor generates **text prompts only**. No image-generation model
> is required inside Digital Tailor infrastructure. No GPU, image workers, image queues,
> or generated-image storage.

- **Stack (planned):** HTML5 + CSS3 + Vanilla JS → Node.js + Express REST API → MySQL. External: ChatGPT (manual prompt-copy/open in v1; user attaches own photo there).
- **Related:** PRD.md, ARCHITECTURE.md, DATABASE.md, API_SPEC.md, UI_SPEC.md, SECURITY.md

---

## 1. Technology Stack (RECOMMENDED)

| Layer | Choice | Why (small-business fit) |
|---|---|---|
| Frontend | HTML5, CSS3 (custom properties), Vanilla JS (no framework) | Zero build complexity, fast on low-end phones, easy for college/small-team maintenance. No React/Next.js in v1. |
| Backend | Node.js LTS (≥20) + Express.js 4/5 | Simple REST, huge docs/community, easy hosting on single VPS/shared host. |
| Database | MySQL 8 (InnoDB, utf8mb4) | Relational fit for orders/measurements/prompts; transactions + FKs; cheap hosting. No MongoDB/Supabase/Firebase in v1. |
| Auth | Server sessions (`express-session` + MySQL store) **or** short-lived JWT in httpOnly cookie — pick ONE (see §6). | Avoids localStorage token XSS pitfalls; CSRF handled per choice. |
| Hashing | Argon2id (preferred) or bcrypt (cost ≥12) | See SECURITY.md. |
| Validation | `zod` or `express-validator` (lightweight, pick one) | Single source of server-side schemas (incl. prompt inputs). |
| File upload | `multer` (disk storage, strict filter) | Tailoring reference images only (fabric/design). NOT visualization photos. Virus-scan hook point for future. |
| Prompt generation | Deterministic template builder (`promptBuilder.js`) in v1; optional external LLM for **text only** later | No image model. Text dependency only if added. |
| Logging | `pino` or `morgan` + file rotation | Structured request logs without ELK. |
| Rate limit | `express-rate-limit` | Auth + order/appointment + **prompt** endpoints. |
| CORS | `cors` (restrict origins in prod) |  |
| Testing (future) | `vitest` or `jest` + `supertest` | API/integration tests; see TEST_PLAN.md. |
| Migrations | `node --run` scripts + plain SQL files (`db/migrations/`) or `knex` query-builder only if team prefers | Keep SQL visible; no ORM required in v1. |

**Explicitly NOT in v1:** React, Next.js, MongoDB, Supabase, Firebase, GraphQL, Redis, Kafka, Kubernetes, microservices, **GPU servers, image-generation models (Stable Diffusion / DALL-E style), virtual try-on systems, image-inference workers/queues, generated-image storage/CDN**.

### Runtime requirements (RECOMMENDED)

- Node.js LTS, npm; MySQL 8 server; modern browsers (Chrome/Edge/Firefox/Safari, last 2 versions); HTTPS in production; ~1 vCPU / 1 GB RAM VPS sufficient for MVP traffic. **No GPU required** — lightweight text-only app.

---

## 2. Repository / Project Structure (RECOMMENDED)

```text
digital-tailor/
├── public/                 # static frontend (HTML/CSS/JS, catalog images)
│   ├── index.html          # Home
│   ├── garments.html, customize.html, measurements.html, preview.html
│   ├── orders.html, appointments.html, offers.html, contact.html
│   ├── prompt.html         # Prompt Studio (preference form + prompt result + copy)
│   ├── login.html, register.html, dashboard/
│   ├── admin/              # admin pages
│   ├── css/                # style.css (CSS variables), admin.css
│   └── js/                 # api.js (fetch wrapper), pages/*.js, prompt.js
├── src/                    # backend (Node + Express)
│   ├── app.js              # express app factory
│   ├── server.js           # listen
│   ├── config/             # env.js, db.js, constants.js
│   ├── middleware/         # auth.js, requireRole.js, validate.js, rateLimit.js, upload.js, error.js
│   ├── routes/             # auth.routes.js, garments.routes.js, prompts.routes.js, ... (thin)
│   ├── controllers/        # ... (request/response only)
│   ├── services/           # prompts.service.js, orders.service.js, offers.service.js, ... (business logic)
│   ├── db/                 # pool.js, queries/*.js (parameterized SQL only)
│   └── utils/              # passwords.js, promptBuilder.js, errors.js, logger.js
├── db/
│   ├── schema.sql          # RECOMMENDED schema (from DATABASE.md)
│   ├── migrations/         # 001_*.sql, 002_*.sql ...
│   └── seeds/              # categories, garments, demo offers (dev only)
├── docs/                   # this documentation set
├── .env.example            # required vars (no secrets)
├── package.json
└── README.md
```

> NOTE: This structure is RECOMMENDED. `CURRENT:` only `docs/` + `README.md` exist as documentation; no backend/frontend/db implementation exists. No image-generation service, worker, or gallery exists or is planned.

---

## 3. Frontend Architecture (RECOMMENDED)

- **Multi-page static site** (no SPA framework). Each page: semantic HTML + one CSS bundle + small page JS.
- **Shared modules:** `public/js/api.js` (fetch wrapper: JSON, credentials, error mapping), `auth.js` (session state → nav), `prompt.js` (pure function building the **ChatGPT text prompt** from preference object — unit-testable, no network, no image code).
- **No in-site image generation UI.** No "Generate Image" / "Try On" buttons. The prompt result screen offers **Copy Prompt + Open ChatGPT + step-by-step instructions** (`Generate Prompt → Copy Prompt → Open ChatGPT → Attach Photo → Paste Prompt`).
- **State:** server is source of truth; minimal localStorage only for draft preferences (non-sensitive) + prompt text. Never store passwords, roles, photos, or other users' data.
- **Rendering:** server returns JSON (prompt API returns **text**); JS renders lists/cards; all user content escaped via `textContent` / escape helper (no `innerHTML` with user data).
- **Progressive enhancement:** catalog/customizer/prompt form usable with JS; forms POST with validation fallback messages.
- **Assets:** responsive catalog images (`srcset`), lazy loading, CSS variables for theme (see UI_SPEC.md). No generated-image CDN.

---

## 4. Backend Architecture (RECOMMENDED)

Layered Express app:

```text
Route (parse/auth) → validate(schema) → controller → service (rules+transactions) → db/queries (parameterized SQL) → MySQL
```

Preferred AI boundary:

```text
Frontend
   ↓
Backend/API
   ↓
Prompt Generation (template builder; optional external LLM for TEXT only)
   ↓
AI Provider (text-generation dependency only, if used)
   ↓
Text Prompt (returned to user; never an image)
```

- **Routes** are thin; **services** own business rules (prompt validation, offer eligibility, status transitions, measurement confirmation).
- **Forbidden (unless explicitly re-approved):** `/generate-image`, `/virtual-try-on`, `/generate-fashion-image`, `/image-inference` endpoints; image-model hosting; GPU workers; image queues.
- The primary AI-related backend operation is conceptually: `fashion preferences → AI prompt generation → text prompt`.
- **Error flow:** services throw `AppError(status, code, message)`; central `error.js` middleware maps to `{ error: { code, message, details? } }` with correct HTTP status; 500s logged, generic message to client.
- **Transactions:** order creation (order + items + measurement snapshot + status row + offer usage) in ONE InnoDB transaction. Prompt saves are lightweight (no transaction needed beyond single-row insert).
- **No business logic in frontend** that must be trusted (price, offer, status, ownership, prompt validation all re-checked server-side).

---

## 5. MySQL Architecture (RECOMMENDED)

- Engine InnoDB, charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
- FKs with `ON DELETE RESTRICT` for catalog/orders; `CASCADE` only where safe (e.g., `measurement_values` on profile delete by owner; `prompt_history` on user delete per policy).
- Indexes on all FKs + `users(phone)`, `users(email)`, `orders(customer_id, status)`, `offers(active, ends_at)`, `appointments(scheduled_at)`, `prompt_history(user_id, created_at)`.
- Migrations are sequential, reversible where practical; `schema.sql` generated from migrations; seeds only for dev (never prod passwords).
- **No tables for generated images, image jobs/status/URLs, or model metadata.** Only text prompt history (`customer_designs.ai_prompt` cache + optional `prompt_history` text rows) — see DATABASE.md.
- Backups: daily `mysqldump` + weekly restore test (see §15). Small text-only backups; no image-blob strategy needed.

---

## 6. REST API Architecture (RECOMMENDED)

- Base `/api`, JSON in/out, versioned only if breaking (`/api/v1` reserved; start unversioned `/api` and add version on break).
- Auth via cookie session; `GET /api/auth/me` returns `{ user }` or 401.
- Prompt endpoints return **text** (`{ prompt }`), never binary images.
- Standard codes: `200 OK, 201 Created, 204 No Content, 400 Validation, 401 Auth, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Rate-limited, 500 Server`.
- Error body: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`.
- Pagination: `?page&limit` (default 1/20, max 50); response `{ data, pagination: { page, limit, total } }`.
- Every endpoint specified in `docs/API_SPEC.md` with ID, auth, validation, responses. `CURRENT: NO APIs IMPLEMENTED.`

---

## 7. Authentication Strategy (RECOMMENDED)

**Option A (default): server sessions.**

- `express-session` + MySQL session store; cookie `HttpOnly; Secure (prod); SameSite=Lax`.
- Login verifies Argon2id/bcrypt; regenerates session; `req.session.userId/role`.
- CSRF: `SameSite=Lax` + CSRF token for cookie-auth mutations (e.g., `csrf-csrf` double-submit) — see SECURITY.md.

**Option B (alternative): JWT in httpOnly cookie.**

- Short access token (15–60 min) + rotating refresh token in DB; same CSRF requirement.

Pick ONE before Phase 3; document choice in ARCHITECTURE.md + SECURITY.md. Never store JWT in localStorage. Never trust client-sent role.

---

## 8. Authorization Strategy (RECOMMENDED)

- Roles: `customer`, `admin` (future: `staff`).
- Middleware `requireAuth` + `requireRole('admin')` on every protected route.
- Ownership checks in services: `where customer_id = req.user.id` for customer resources (incl. prompts/designs); admin bypass with logging to `admin_actions`.
- All checks server-side; frontend hiding is UX only.

---

## 9. Validation (RECOMMENDED)

- Validate EVERY user-controlled field server-side (body/query/params/file meta, **incl. prompt preference fields**) using one schema library.
- Shared constants for measurement ranges, garment option enums, **prompt preference allow-lists** (occasion, style, fit, footwear, …), status transitions, offer rules.
- Prompt inputs: length caps (e.g., free-text ≤500 chars per field, total prompt ≤4000 chars), allow-list enums where applicable, strip control characters; defend against prompt injection (see SECURITY.md).
- Phone: E.164-ish normalize + length check; email: RFC-simple regex; password: min 8 chars.
- Measurements: numeric, per-field min/max, garment-relevance check; reject unknown keys.
- Files (tailoring refs only): MIME + extension + size + filename sanitization (see §12).

---

## 10. Error Handling (RECOMMENDED)

```js
// utils/errors.js (RECOMMENDED sketch)
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}
// middleware/error.js maps AppError → JSON; unexpected → 500 INTERNAL_ERROR (logged with request id)
```

- Request ID per request (`X-Request-Id`) for log correlation.
- 4xx messages are user-safe; 500 never leaks SQL/stack/API keys.

---

## 11. Logging (RECOMMENDED)

- `pino` (JSON) or `morgan` (dev). Log: method, path, status, duration, request id, user id (if authed). Never log passwords, tokens, session secrets, API keys, full measurements, or **any personal image data (none is handled)** — log prompt IDs/lengths only, never full prompt PII beyond what is needed for debugging (prefer IDs).
- Log levels: `error/warn/info/debug`; `debug` off in prod. Retain 14–30 days.

---

## 12. Configuration / Environment Variables (RECOMMENDED)

`.env` (never committed) + `.env.example` (committed, no secrets):

```bash
# .env.example (RECOMMENDED content)
NODE_ENV=development
PORT=3000
APP_BASE_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_tailor
DB_USER=digital_tailor_app
DB_PASSWORD=change-me
SESSION_SECRET=change-me-generate-32plus-random-chars
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CHATGPT_URL=https://chatgpt.com/
# Optional future text-only LLM for prompt enhancement (server-side only, never frontend):
PROMPT_LLM_PROVIDER=
PROMPT_LLM_API_KEY=
PROMPT_LLM_MODEL=
```

Load via `config/env.js` with fail-fast on missing required vars (except test). Never expose `PROMPT_LLM_API_KEY` to the browser.

---

## 13. File Uploads (RECOMMENDED — tailoring references only)

- Scope: **fabric photos and design references for tailoring only.** Digital Tailor does NOT accept visualization photos and stores no generated images.
- `multer` disk storage to `UPLOAD_DIR/<year>/<month>/`; random filenames (`crypto.randomUUID()` + safe ext); serve via controller with auth check (not static public for private refs) OR signed path.
- Accept: `image/jpeg, image/png, image/webp` only; ext whitelist `.jpg .jpeg .png .webp`; max 5 MB; image dimension cap (e.g., 4000px) via lightweight probe if available.
- Validate MIME by sniffing (not client header alone); strip EXIF where library allows; never execute; set `Content-Disposition: inline` + `X-Content-Type-Options: nosniff`.
- Link rows in `uploaded_references` (owner, design/order id, path, mime, size). Delete file + row on design delete (owner only).

---

## 14. AI Integration (RECOMMENDED — text prompts only)

- **v1: no server-to-image calls, no image API keys, no GPU.** Pure `buildPrompt(preferences)` (deterministic template, client and/or server shared logic) + Copy + `window.open(CHATGPT_URL)`. Backend must NOT embed any AI provider credentials in frontend code.
- `promptBuilder.js` is deterministic and tested (TC-Pxx): given fashion preferences it returns the structured **text** prompt string (with identity-preservation, clothing, fit/fabric, background/lighting, anti-artifact clauses); UI shows BR-002 + BR-010/BR-011 notices and ChatGPT steps.
- **Optional future text enhancement only:** an external LLM may be used to polish prompt wording (text-in → text-out). If used: server-side key in `.env` (`PROMPT_LLM_API_KEY`), never exposed; proxy endpoint with auth + rate limit + PII minimization; store only prompt text + user consent; never accept or forward photos (see SECURITY.md).

```text
Frontend → Backend/API → Prompt Generation → AI Provider (text only, optional) → Text Prompt
Customer → Preferences → Prompt Generator (local/shared JS) → Copy → Open ChatGPT (external, user-driven, user photo)
```

---

## 15. Build / Dev / Production Workflow (RECOMMENDED)

- **Dev:** `npm run dev` (node --watch src/server.js); local MySQL; `npm run migrate`; `npm run seed` (dev only).
- **Build:** no frontend build in v1 (static files). Backend: `npm start`. Lint: `npm run lint`. Tests: `npm test`.
- **Prod:** single VPS/container; reverse proxy (nginx/Caddy) terminates TLS; PM2/systemd keeps Node alive; MySQL managed or co-hosted with backups; `NODE_ENV=production`, restricted CORS, secure cookies, rate limits on. **No GPU nodes, no image workers, no image CDN.**
- **Deployment sketch:** see ARCHITECTURE.md §7. Monitoring: uptime check + disk/DB alerts; backup restore drill monthly. Cost stays at lightweight web-app levels.

---

*End of TECH_SPEC. Status: RECOMMENDED only; nothing implemented. Text-prompt boundary (2026-09-11) applies.*
