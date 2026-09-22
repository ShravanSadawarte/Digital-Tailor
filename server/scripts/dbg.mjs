import { createApp } from "../src/app.js";
import { seedFileStore } from "../src/db/seedFile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dataPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "db.json");
fs.rmSync(dataPath, { force: true });
await seedFileStore();

const app = createApp();
const server = await new Promise((res) => { const s = app.listen(0, () => res(s)); });
const base = `http://127.0.0.1:${server.address().port}`;
let cookie = "";
async function req(method, p, body, csrf) {
  const h = { "Content-Type": "application/json" };
  if (cookie) h.Cookie = cookie;
  if (csrf) h["x-csrf-token"] = csrf;
  const res = await fetch(base + p, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}
let csrf = "";
await req("POST", "/api/auth/register", { name: "Pri", phone: "+919110000011", password: "secret123" });
await req("POST", "/api/auth/login", { identifier: "+919110000011", password: "secret123" });
csrf = (await req("GET", "/api/auth/csrf")).data.csrfToken;
const kurti = { bust: 92, waist: 78, hip: 96, shoulder: 38, armhole: 52, sleeve_length: 45, kurti_length: 105, neck_width: 15, front_neck_depth: 14, back_neck_depth: 10 };
const prof = await req("POST", "/api/measurements", { name: "std", garment_hint: "kurti", values: kurti }, csrf);
console.log("profile:", prof.status, JSON.stringify(prof.data).slice(0, 200));
const gs = await req("GET", "/api/garments");
const gid = gs.data.data[0].id;
const des = await req("POST", "/api/designs", { garment_id: gid, title: "d", color: "Emerald Green", neck: "Round" }, csrf);
console.log("design:", des.status, JSON.stringify(des.data).slice(0, 300));
const offers = await req("GET", "/api/offers");
const off = offers.data.data.find((o) => o.first_order_only);
const ord = await req("POST", "/api/orders", { design_id: des.data.id, measurement_profile_id: prof.data.id, offer_id: off.id }, csrf);
console.log("order:", ord.status, JSON.stringify(ord.data).slice(0, 300));
server.close();
process.exit(0);
