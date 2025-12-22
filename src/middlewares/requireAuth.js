import { firebaseAdmin } from "../lib/firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null, name: decoded.name || null };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
