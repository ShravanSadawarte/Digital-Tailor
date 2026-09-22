import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { migrate } from "./db/index.js";

try {
  const applied = await migrate();
  if (applied.length) console.log(`Migrations applied: ${applied.join(", ")}`);
} catch (e) {
  console.error("Migration failed:", e.message);
  if (env.dbDriver === "mysql") process.exit(1);
}

const app = createApp();
app.listen(env.port, () => {
  console.log(`Digital Tailor API on ${env.appBaseUrl} (db: ${env.dbDriver}, env: ${env.nodeEnv})`);
});
