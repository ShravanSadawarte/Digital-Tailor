import { Router } from "express";
import { store } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { promptLimiter } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { pageOut } from "../utils/paging.js";
import { generatePrompt } from "../services/prompts.service.js";
import { promptPartialSchema, promptSchema } from "../validation/schemas.js";

const r = Router();

// Generate Fashion Prompt — text only. Optional auth: logged-in users get history.
r.post("/generate", promptLimiter, validate(promptSchema), async (req, res, next) => {
  try {
    const userId = req.session?.userId || null;
    const { prompt, historyId } = await generatePrompt({ userId, designId: req.body.design_id, prefs: req.body });
    res.json({ prompt, history_id: historyId });
  } catch (e) { next(e); }
});

r.post("/designs/:id/prompt", promptLimiter, validate(promptPartialSchema, "body"), async (req, res, next) => {
  try {
    const userId = req.session?.userId || null;
    const design = await store.getDesign(req.params.id);
    if (!design) {
      const err = new Error("Design not found");
      err.status = 404;
      err.code = "NOT_FOUND";
      throw err;
    }
    if (userId && design.customer_id !== Number(userId)) {
      const err = new Error("Design not found");
      err.status = 404;
      err.code = "NOT_FOUND";
      throw err;
    }
    const { prompt, historyId } = await generatePrompt({ userId, designId: design.id, prefs: req.body });
    res.json({ prompt, history_id: historyId });
  } catch (e) { next(e); }
});

r.get("/history", requireAuth, async (req, res, next) => {
  try {
    res.json(pageOut(await store.listPromptHistory(req.user.id, { page: req.query.page, limit: req.query.limit })));
  } catch (e) { next(e); }
});

export default r;
