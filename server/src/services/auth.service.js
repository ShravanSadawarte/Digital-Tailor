import { store } from "../db/index.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";

function normalizePhone(phone) {
  return String(phone).replace(/[\s-]/g, "");
}

export async function register({ name, phone, email, password }) {
  phone = normalizePhone(phone);
  const dup = await store.findUserByLogin(phone);
  if (dup) throw AppError.conflict("Phone number already registered");
  if (email) {
    const dupE = await store.findUserByLogin(email);
    if (dupE) throw AppError.conflict("Email already registered");
  }
  const user = await store.createUser({ name, phone, email: email || null, passwordHash: await hashPassword(password) });
  return { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role };
}

export async function login({ identifier, password }) {
  const user = await store.findUserByLogin(String(identifier).trim());
  if (!user || !user.is_active) throw new AppError(401, "UNAUTHENTICATED", "Invalid credentials");
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new AppError(401, "UNAUTHENTICATED", "Invalid credentials");
  return { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role };
}

export function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      resolve();
    });
  });
}
