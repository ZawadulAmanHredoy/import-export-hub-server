import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin (safe init)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// MongoDB (single connection)
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || "importExportHub");
  }
  return db;
}

async function fetchProducts(req) {
  const database = await getDB();
  const search = (req.query.search || "").trim();
  const query = search ? { name: { $regex: search, $options: "i" } } : {};

  return database
    .collection("products")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

// ✅ Health routes (both)
app.get("/", (_req, res) => res.json({ ok: true, name: "Import Export Hub API" }));
app.get("/api", (_req, res) => res.json({ ok: true, name: "Import Export Hub API" }));

// ✅ Products routes (both)
app.get("/products", async (req, res) => {
  const products = await fetchProducts(req);
  res.json(products);
});

app.get("/api/products", async (req, res) => {
  const products = await fetchProducts(req);
  res.json(products);
});

// ✅ Fallback
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
