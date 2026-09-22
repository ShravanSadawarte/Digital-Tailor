const BASE = import.meta.env.VITE_API_URL || "/api";

async function csrfToken() {
  try {
    const r = await fetch(`${BASE}/auth/csrf`, { credentials: "include" });
    const d = await r.json();
    return d.csrfToken || "";
  } catch {
    return "";
  }
}

// Admin catalog photo — products, cloth/neck/sleeve designs, QR codes.
// Returns { url } pointing at the public /api/files/<name> path.
export async function uploadCatalog(file) {
  const token = await csrfToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/uploads/admin`, {
    method: "POST",
    credentials: "include",
    headers: token ? { "x-csrf-token": token } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
  return data;
}

// Upload a reference/screenshot image linked to exactly one design or order.
export async function uploadRef({ file, design_id, order_id }) {
  const token = await csrfToken();
  const fd = new FormData();
  fd.append("file", file);
  if (design_id) fd.append("design_id", String(design_id));
  if (order_id) fd.append("order_id", String(order_id));
  const res = await fetch(`${BASE}/uploads`, {
    method: "POST",
    credentials: "include",
    headers: token ? { "x-csrf-token": token } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
  return data;
}
