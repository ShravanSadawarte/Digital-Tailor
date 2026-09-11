# Digital Tailor — Rules for AI Coding Agents (RULES)

> These rules are binding for every future AI/human change. Violating them is a defect.
> Stack: HTML/CSS/Vanilla JS + Node/Express + MySQL. Keep it small and safe.

---

## 0. PERMANENT PRODUCT RULE (2026-09-11 — binding unless PRD explicitly changes it)

> **Digital Tailor does not generate fashion images. Digital Tailor generates personalized AI prompts that users can copy and use with ChatGPT and their own photo.**
>
> Consequences: no built-in image generation, virtual try-on/fitting, image-generation APIs, image inference,
> GPU image infra, generated-image storage/galleries, or visualization-photo handling inside Digital Tailor.
> Prompt APIs return text only. The user attaches their photo directly in ChatGPT. Any future developer or AI
> coding assistant must follow this rule unless the product requirements are explicitly changed.

## 1. GENERAL RULES

1. Read relevant documentation before coding (at minimum: PRD.md + TECH_SPEC.md + the spec for your area + your TASKS.md task). Obey §0 above all feature requests that contradict it.
2. Inspect existing code before modifying it (`read`/`grep`; never assume file contents).
3. Never assume a feature exists — verify (`NO APIs / NOT IMPLEMENTED` labels mean it).
4. Never invent an API (method/path/field) — use API_SPEC.md or propose a docs update first. Never invent `/generate-image`, `/virtual-try-on`, or similar endpoints.
5. Never invent a database field/table — use DATABASE.md or propose a migration + docs update. Never add generated-image/image-job/model-metadata tables.
6. Never invent dependencies — follow TECH_SPEC.md; new deps need justification (see §6). No image-model/GPU/queue deps.
7. Never rewrite working code unnecessarily; smallest safe diff wins.
8. Keep changes focused — one TASKS.md task per change unless explicitly told otherwise.
9. Preserve existing behavior unless the task explicitly changes it (check tests + UI_SPEC states).
10. Ask for clarification when requirements conflict (quote the conflicting doc lines). If a request conflicts with §0, stop and escalate instead of building image features.

## 2. ARCHITECTURE RULES

- Follow `docs/ARCHITECTURE.md` (PLANNED) + `TECH_SPEC.md` layering: `routes → controllers → services → db/queries → MySQL`. AI boundary: `preferences → prompt generation → text prompt`.
- Keep frontend/backend responsibilities separate: price, offer eligibility, ownership, status transitions, prompt validation are computed server-side; frontend values are hints.
- Do not duplicate business logic between `public/js` and `src/` except the pure `promptBuilder` (kept in sync + tested).
- Database access only through backend `src/db/*` with parameterized queries. **Never connect the browser directly to MySQL** (no DB creds in frontend, ever).
- No microservices/queues/caches/ORM/GraphQL/GPU workers/image pipelines unless a TASKS.md task + docs update justifies them (image pipeline additionally needs §0 to change).

## 3. SECURITY RULES

- Never hardcode secrets; never commit `.env`; never expose DB creds/API keys (incl. text-LLM keys)/session secrets; never put secrets in frontend JS, URLs, or logs.
- Validate all server inputs (allow-lists, ranges, lengths) incl. prompt preferences; use parameterized SQL exclusively; screen prompt free-text for injection.
- Authorize on the server: `requireAuth` + `requireRole` + ownership (`customer_id = req.user.id`); do not trust client-sent roles/ids/totals.
- Escape user content on render (`textContent`, no `innerHTML` with user/prompt data); keep CSP/nosniff headers.
- Do not disable rate limits (incl. prompt limits), CSRF, validation, or auth checks to "fix" a bug — fix the root cause.
- Uploads: tailoring refs only per SECURITY.md §9 (MIME sniff, ext, size, random names, gated serving). Reject photos on prompt endpoints.
- AI privacy: backend sends nothing image-related anywhere; never add server-side image calls/keys or photo handling without a SECURITY.md update + PRD change to §0 + consent UI.
- Report security implications in every change summary.

## 4. AI CODING WORKFLOW

**Before coding:**

1. Read `docs/PRD.md` (incl. §10 prompt rules).
2. Read `docs/TECH_SPEC.md` (incl. §14 text-only boundary).
3. Read relevant architecture docs (`ARCHITECTURE.md` + `DATABASE.md`/`API_SPEC.md`/`UI_SPEC.md`/`SECURITY.md` as needed).
4. Read the assigned task in `docs/TASKS.md` (full entry, not just title).
5. Inspect existing files that the task touches.
6. Explain intended changes (files + behavior + tests) briefly.
7. Implement the smallest safe change.

**After coding:**

1. Run tests (`npm test` or task-specified subset, incl. prompt TC-Pxx where touched).
2. Run linting (`npm run lint`) and build/start check.
3. `git status/diff` — review every hunk; stage only intended files; never commit secrets/photos.
4. Check security implications (authz, validation, XSS, SQL, uploads, prompt injection, secrets, key exposure via bundle scan).
5. Update affected docs if behavior/contracts changed (API/DATABASE/UI/TEST deltas).
6. Update `docs/CHANGELOG.md` (Unreleased → Added/Changed/Fixed/Security) for meaningful changes.

## 5. TASK DISCIPLINE

- Implement ONE task at a time. Do not bundle unrelated tasks, refactors, or "improvements."
- If blocked (missing spec, conflicting docs, failing baseline tests), stop and report — do not improvise APIs/schemas.
- Keep tasks small: if a change exceeds ~200 lines or touches >5 files, split it and note the split in the summary.
- Acceptance criteria in the task entry are the definition of done.

## 6. DEPENDENCY RULE

Before adding any dependency:

1. Explain why it is needed (what breaks without it).
2. Check whether Node stdlib / existing deps / a few lines of code solve it.
3. Prefer lightweight, maintained packages; pin versions; note license concerns.
4. Update `TECH_SPEC.md` + `TASKS.md` + `CHANGELOG.md` if architecture changes (e.g., adding ORM, JWT library, uploader, or text-LLM client).

---

*End of RULES. Read this file (§0 first) at the start of every implementation session.*
