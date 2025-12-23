import express from "express";
import cors from "cors";

import { connectDB } from "./lib/db.js";

import productsRouter from "./routes/products.js";
import importsRouter from "./routes/imports.js";

const app = express();

/**
 * Serverless-safe DB connection:
 * - In Vercel, the function may spin up/down, so we connect lazily and cache the promise.
 */
let dbReadyPromise = null;
async function ensureDb() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB();
  }
  return dbReadyPromise;
}

/**
 * CORS:
 * - allow localhost (dev)
 * - allow Firebase hosting (*.web.app / *.firebaseapp.com)
 * - allow explicit CLIENT_ORIGIN if provided
 */
function isAllowedOrigin(origin) {
  if (!origin) return true; // allow server-to-server / curl with no origin

  const allowedExact = new Set(["http://localhost:5173", "http://localhost:3000"]);
  if (process.env.CLIENT_ORIGIN) allowedExact.add(process.env.CLIENT_ORIGIN);

  if (allowedExact.has(origin)) return true;

  // Firebase hosting domains
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname.endsWith(".web.app")) return true;
    if (hostname.endsWith(".firebaseapp.com")) return true;
    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "2mb" }));

// Ensure DB before handling routes
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Import/Export Hub API running" });
});

app.use("/products", productsRouter);
app.use("/imports", importsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err?.message || "Internal Server Error" });
});

export default app;
