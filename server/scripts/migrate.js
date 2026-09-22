import { migrate } from "../src/db/index.js";

const applied = await migrate();
console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Already up to date");
process.exit(0);
