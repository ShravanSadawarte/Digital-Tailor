# Digital Tailor — Security (SECURITY)

> Application is not implemented. Divide below is explicit.
>
> **Boundary (2026-09-11):** Image-processing security requirements are REMOVED because Digital Tailor
> neither processes nor stores visualization photos or generated images. Photo handling below covers
> **tailoring references (fabric/design) only**. Visualization photos go directly to ChatGPT under its policies.

## IMPLEMENTED

None. No authentication, authorization, validation, upload handling, secrets management, prompt API, or AI integration exists yet.

## MISSING

Everything: password hashing, session/JWT handling, RBAC, server validation (incl. prompt inputs), parameterized queries, XSS escaping, CSRF, CORS restriction, rate limiting (incl. prompt endpoints), file-upload checks, prompt-injection defenses, secrets handling, audit logging, privacy controls, backup.

## RECOMMENDED

The complete strategy future implementation MUST follow. Every TASKS.md Phase 3/7/12 task references this file.

---

### 1. Authentication (RECOMMENDED)

- Hash with **Argon2id** (preferred; `argon2` npm, memory 19MB+, time 2+) or **bcrypt cost ≥12**. Never MD5/SHA-only. Password column is `password_hash` only.
- Login must use constant-time compare (library default), regenerate session on success, return generic "Invalid credentials" (no user enumeration).
- Sessions (default): `express-session` + MySQL store; cookie `HttpOnly; Secure (prod); SameSite=Lax; Path=/; Max-Age` short (e.g., 7 days, sliding). Alternative JWT-in-httpOnly-cookie only if documented; never localStorage.
- Logout destroys server session + clears cookie. Password change invalidates other sessions (future: `session_version` column).
- Rate-limit: login/register ≤ 10–20 attempts / 15 min / IP + stricter per-account lockout messaging without enumeration.

### 2. Authorization (RECOMMENDED)

- Roles: `customer`, `admin`. Middleware `requireAuth` → `requireRole('admin')`.
- **Never trust role from browser.** Role comes from server session → DB user row per request (or signed session + DB check on privilege change).
- Ownership: every customer resource query includes `customer_id = req.user.id` (designs, measurements, prompts/history, orders, appointments); admin access logged to `admin_actions`.
- Frontend role-hiding is UX only.

### 3. Input Validation (RECOMMENDED)

- Validate all user-controlled data server-side (body/query/params/headers/file meta, **prompt preference fields**) with one schema library (`zod`/`express-validator`).
- Allow-lists for enums (roles, statuses, option types, occasions, styles, fits, reasons, field keys). Length caps on all strings (prompt free-text ≤500/field, total prompt ≤4000 chars). Numeric ranges for measurements/prices.
- Reject unknown measurement keys; reject option values not in `garment_options`; reject photo/binary fields on prompt endpoints.
- **Prompt-injection protection (where applicable):** treat all preference free-text as data, never instructions; strip control characters and system-prompt-like directives (`system:`, `ignore previous instructions`, role-play overrides); cap lengths; escape before template interpolation; log rejected attempts without storing PII beyond IDs.

### 4. SQL Injection (RECOMMENDED)

- **Parameterized queries / prepared statements only** (`mysql2/promise` `execute(sql, params)`). No string-concatenated SQL. No ORM raw without binding. Prompt inputs_snapshot JSON is bound as a parameter, never interpolated.
- DB user has least privilege (SELECT/INSERT/UPDATE/DELETE on app schema only; no FILE/GRANT/SUPER). Migrations use separate privileged user locally, never in app runtime.

### 5. XSS (RECOMMENDED)

- Escape all user content on render — incl. generated prompt text and preference values: use `textContent`, never `innerHTML` with user/prompt data; if templating, auto-escape; notes/prefs are plain text — no HTML allowed.
- `Content-Security-Policy` (strict, no inline scripts in prod or nonce-based), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'self'`.
- Cookie `HttpOnly` so stolen markup can't read session.

### 6. CSRF (RECOMMENDED)

- Because auth is cookie-based, add CSRF protection for state-changing routes (incl. prompt generation if authed): `SameSite=Lax` + per-session CSRF token (double-submit or `csrf-csrf` package); frontend `api.js` attaches header; server rejects missing/invalid token with `403`.
- If JWT-in-cookie chosen, same requirement. If Bearer-in-memory chosen instead (not recommended for this stack), document and still restrict CORS.

### 7. CORS (RECOMMENDED)

- Same-origin in v1 (frontend + API on one host) → CORS closed. If split later: `CORS_ORIGIN` allow-list from `.env`, no `*`, credentials only to listed origin.

### 8. Rate Limiting (RECOMMENDED)

- `express-rate-limit`: global ~100/15min/IP; auth endpoints stricter; order/appointment creation moderate; **prompt endpoints strict** (e.g., 30 generations/15min/IP + per-user cap) to prevent abuse of any paid text LLM and scraping. Return `429 + Retry-After`. Log prompt rate-limit hits by ID.

### 9. File Upload Security (RECOMMENDED — tailoring references only)

No visualization-photo or generated-image handling exists, so no image-generation upload surface exists. For legitimate tailoring refs (fabric photos, design references) validate:
- **MIME by sniffing** (not client header alone) — allow `image/jpeg/png/webp` only.
- **Extension** whitelist `.jpg .jpeg .png .webp` + **size** ≤5 MB + dimension cap.
- **Filename:** discard original for storage; `crypto.randomUUID() + ext`; keep original name only as sanitized display string.
- **Storage:** outside webroot or gated controller with auth/ownership check; `nosniff`, no execute permission; strip EXIF if library available.
- Link via `uploaded_references`; delete file+row on owner delete. Future virus-scan hook documented.
- The prompt UI must not offer photo upload; if a photo is POSTed to a prompt endpoint, reject with `400`.

### 10. Secrets (RECOMMENDED)

Never commit: DB passwords, AI provider API keys, JWT/session secrets. Use `.env` (gitignored) + committed `.env.example` (no secrets):

```bash
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
PROMPT_LLM_PROVIDER=
PROMPT_LLM_API_KEY=
PROMPT_LLM_MODEL=
```

**Never expose AI provider API keys in the frontend.** Text-LLM keys (if ever configured) live server-side only. Fail-fast on missing required vars. Rotate secrets on leak. No secrets in logs, URLs, or frontend JS.

### 11. Privacy (RECOMMENDED)

#### Digital Tailor handles:
- Fashion preferences, prompt-generation inputs, generated **text** prompts (and text history), application/account data only as required (auth, measurements for tailoring, orders, appointments, offers).

#### Digital Tailor does NOT handle:
- The user's photo for visualization, generated fashion images, image-generation model inference, or image-generation API requests.

- Access control: owner + admin only (BR-005); admin views logged (prompt text truncated in logs).
- Minimal collection: only garment-relevant measurement fields + styling prefs needed for the prompt; no unnecessary PII in prompts (warn users not to include full name/address).
- Retention: inactive accounts/deleted designs purge tailoring files within 30 days and may purge prompt history per published policy (document before launch); customer can request deletion via tailor.
- Secure storage: DB + tailoring uploads on access-controlled host; backups encrypted at rest where provider supports; no PII or image data in logs (IDs/lengths only).
- Secure external AI API communication if a text LLM is used: TLS, server-side key, per-request auth, rate limits, PII minimization, no photo forwarding (there is nothing to forward).

### 12. AI Privacy (RECOMMENDED)

- **v1:** backend sends NOTHING to an image service (none exists). Prompt generation is local template logic; the user manually copies the text prompt and attaches their own photo **directly in ChatGPT**. Our privacy notice must say: "Digital Tailor creates the prompt only. If you use ChatGPT for visualization, your prompt and any photo you upload are handled by ChatGPT under its own privacy policies and terms, not ours. Don't include your full name, address, or other sensitive info in the prompt."
- Do not claim Digital Tailor guarantees privacy for ChatGPT or other external AI services.
- **Future text-LLM polish only (optional):** explicit notice, server-side key (never frontend), PII minimization (design attributes only, no phone/address/photo), no training-data opt-in by default, logged audit of proxy calls (IDs only).

---

*End of SECURITY. All controls RECOMMENDED; none implemented. Text-prompt boundary (2026-09-11) applies.*
