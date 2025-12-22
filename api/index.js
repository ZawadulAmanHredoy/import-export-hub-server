import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
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

// ---------- Auth middleware (optional but recommended for Add Export) ----------
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
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

// Health
app.get("/", (_req, res) => res.json({ ok: true, name: "Import Export Hub API" }));
app.get("/api", (_req, res) => res.json({ ok: true, name: "Import Export Hub API" }));

// GET products (both)
app.get("/products", async (req, res) => res.json(await getProducts(req)));
app.get("/api/products", async (req, res) => res.json(await getProducts(req)));

// ✅ POST products (both) - protected
app.post("/products", verifyFirebaseToken, async (req, res) => {
  const database = await getDB();
  const body = req.body || {};

  const doc = {
    name: String(body.name || "").trim(),
    imageUrl: String(body.imageUrl || "").trim(),
    price: Number(body.price || 0),
    originCountry: String(body.originCountry || "").trim(),
    rating: Number(body.rating || 0),
    availableQty: Number(body.availableQty || 0),
    createdAt: new Date(),
    ownerEmail: req.user?.email || null,
  };

  // Basic validation
  if (!doc.name || !doc.imageUrl || !doc.originCountry) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (Number.isNaN(doc.price) || doc.price < 0) {
    return res.status(400).json({ message: "Invalid price" });
  }
  if (Number.isNaN(doc.availableQty) || doc.availableQty < 0) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  const result = await database.collection("products").insertOne(doc);
  return res.status(201).json({ insertedId: result.insertedId });
});

app.post("/api/products", verifyFirebaseToken, async (req, res) => {
  // same handler as /products
  req.url = "/products";
  return app(req, res);
});

// Fallback
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

export default app;
