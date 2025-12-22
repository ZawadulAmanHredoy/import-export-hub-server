import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Firebase Admin ----------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// ---------- MongoDB ----------
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || "importExportHub");
  }
  return db;
}

// ✅ Health check (Vercel /api -> Express "/")
app.get("/", (req, res) => {
  res.json({ ok: true, name: "Import Export Hub API" });
});

// ✅ Products list (Vercel /api/products -> Express "/products")
app.get("/products", async (req, res) => {
  const database = await getDB();
  const search = (req.query.search || "").trim();

  const query = search
    ? { name: { $regex: search, $options: "i" } }
    : {};

  const products = await database
    .collection("products")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  res.json(products);
});

// ✅ Fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
