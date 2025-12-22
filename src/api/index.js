import { connectDB } from "../src/lib/db.js";
import app from "../src/app.js";

// Ensure DB connected (Vercel serverless may cold-start)
let ready = false;

export default async function handler(req, res) {
  try {
    if (!ready) {
      await connectDB();
      ready = true;
    }
    return app(req, res);
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: String(e?.message || e) });
  }
}
