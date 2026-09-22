import readline from "readline";
import { store } from "../src/db/index.js";
import { hashPassword } from "../src/utils/passwords.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const name = (await ask("Admin name: ")).trim() || "Tailor Admin";
const phone = (await ask("Admin phone: ")).trim();
const email = (await ask("Admin email (optional): ")).trim() || null;
const password = await ask("Password (min 8 chars): ");
rl.close();

if (!phone || password.length < 8) {
  console.error("Phone and a password of 8+ chars are required");
  process.exit(1);
}
const existing = await store.findUserByLogin(phone);
if (existing) {
  console.error("That phone is already registered");
  process.exit(1);
}
const user = await store.createUser({ name, phone, email, passwordHash: await hashPassword(password), role: "admin" });
console.log(`Admin created: id=${user.id} phone=${user.phone}`);
process.exit(0);
