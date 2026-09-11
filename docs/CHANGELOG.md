# Changelog

All meaningful project changes should be documented here.
Format follows Keep a Changelog (Unreleased → Added/Changed/Fixed/Removed/Security).

## [0.2.0] - 2026-09-11 — Prompt-generation direction

### Added

- Personalized AI Fashion Prompt Generator (text-only): fashion preference inputs (occasion, outfit, style, colors, fit, fabric, footwear, accessories, hairstyle, grooming, season, location/cultural context, background, lighting, photography style), prompt quality rules, copy + regenerate/edit, ChatGPT usage instructions (Generate Prompt → Copy Prompt → Open ChatGPT → Attach Photo → Paste Prompt).
- Text-only prompt APIs (`POST /api/prompts/generate`, `POST /api/designs/:id/prompt`, `GET /api/prompts/history`) and text-only `prompt_history` table + `customer_designs` styling columns.
- Prompt test suite (TC-P01…TC-P16) and Phase 7 tasks (builder, history, Prompt Studio UI, quality/security validation).
- Permanent product rule in `RULES.md` §0.

### Changed

- Product repositioned from generic tailoring + preview to **fashion styling and AI prompt-generation platform**: "Digital Tailor helps users decide what to wear and creates personalized AI fashion visualization prompts that they can use with ChatGPT and their own photo."
- External AI standardized on **ChatGPT** (replaces Gemini references); `CHATGPT_URL` + optional server-side text-LLM vars replace `GEMINI_URL`.
- Architecture/infra re-scoped to lightweight web + prompt service; deployment/cost sections updated.

### Removed

- AI image generation removed from Digital Tailor scope (no in-site generation, no image APIs, no inference).
- Virtual try-on / virtual fitting removed from current scope.
- Image-generation infrastructure removed from requirements: GPU servers, image workers/queues, model hosting, large image models, image-generation storage, CDN for generated images.
- Image-generation test topics removed (resolution, latency, GPU inference, model accuracy, image storage/queues).

### Security

- Visualization-photo handling prohibited (BR-011): Digital Tailor does not collect, transmit, or store user photos for visualization; uploads are tailoring refs only; prompt endpoints reject photo fields.
- Added prompt-injection defenses, prompt rate limiting, AI-key non-exposure rule (server-only), bundle scan test (TC-509).
- Privacy clarified: Digital Tailor handles prefs + text prompts + app data; ChatGPT photo/image handling falls under ChatGPT's own policies.

---

## Unreleased

### Added

- (Reserved for post-0.2.0 implementation work starting at `docs/TASKS.md` TASK-101.)

### Changed

- Nothing yet.

### Fixed

- Nothing yet.

### Removed

- Nothing yet.

### Security

- No application controls implemented yet. Security strategy documented in `docs/SECURITY.md` (RECOMMENDED). No secrets committed.

---

## [0.1.0] - 2026-09-11 — Documentation foundation

### Added

- Initial documentation foundation: `docs/PRD.md`, `docs/TECH_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API_SPEC.md`, `docs/UI_SPEC.md`, `docs/SECURITY.md`, `docs/TEST_PLAN.md`, `docs/TASKS.md`, `docs/RULES.md`, `docs/CHANGELOG.md`.
- Root `README.md` with product overview, planned stack/architecture, docs index, and roadmap.

---

## Notes

- **Documentation updated to prompt-generation direction. Application implementation has not started.**
- Current status: App `NOT IMPLEMENTED`; Database `NOT IMPLEMENTED`; API `NOT IMPLEMENTED`; Auth `NOT IMPLEMENTED`; Frontend `NOT IMPLEMENTED`; AI image generation `REMOVED FROM SCOPE`; AI prompt generation (text) `PLANNED`; Smart Measurement `PLANNED / FUTURE`.
- Official architecture: **Digital Tailor → Personalized AI Fashion Prompt → User copies prompt → ChatGPT + user's photo → Fashion visualization**.
- Major next step: begin implementation from `docs/TASKS.md` TASK-101 (do not start in this documentation phase).
