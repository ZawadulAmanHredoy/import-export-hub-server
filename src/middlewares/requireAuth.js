import { getFirebaseAdmin } from "../lib/firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      return res.status(500).json({
        message:
          "Firebase Admin is not configured on the server. Set FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY in Vercel env.",
      });
    }

    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = await firebaseAdmin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
