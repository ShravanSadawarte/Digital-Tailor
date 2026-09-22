import { env } from "../src/config/env.js";
import { seed } from "../src/db/index.js";

if (env.isProd) {
  console.error("Refusing to seed in production");
  process.exit(1);
}
console.log(await seed());
process.exit(0);
