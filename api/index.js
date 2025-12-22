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

// ---------- helpers ----------
async function getProducts(req) {
  const database = await getDB();
  const search = (req.query.search || "").trim();
  const query = search ? { name: { $regex: search, $options: "i" } } : {};

  return database
    .collection("products")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

// ✅ root health
app.get("/", (req, res) => {
  res.json({ ok: true, name: "Import Export Hub API" });
});

// ✅ /api health alias
app.get("/api", (req, res) => {
  res.json({ ok: true, name: "Import Export Hub API" });
});

// ✅ products (root)
app.get("/products", async (req, res) => {
  const products = await getProducts(req);
  res.json(products);
});

// ✅ products (api alias)
app.get("/api/products", async (req, res) => {
  const products = await getProducts(req);
  res.json(products);
});

// fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
