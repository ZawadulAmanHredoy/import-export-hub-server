import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/db.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const productsRouter = Router();

/** Helpers */
function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function normalizeString(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

/** PUBLIC: Get all products (?limit= & ?search=) */
productsRouter.get("/", async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection("products");

    const limitRaw = req.query.limit;
    const limit = limitRaw
      ? Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 200)
      : 50;

    const search = normalizeString(req.query.search);
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const items = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json(items);
  } catch (e) {
    console.error("GET /products error:", e);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/** PRIVATE: Get my products (MUST be before "/:id") */
productsRouter.get("/my", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection("products");

    const ownerUid = req.user?.uid;
    const items = await col
      .find({ ownerUid })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(items);
  } catch (e) {
    console.error("GET /products/my error:", e);
    res.status(500).json({ message: "Failed to fetch your products" });
  }
});

/** PUBLIC: Get product by id */
productsRouter.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection("products");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const item = await col.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ message: "Product not found" });

    res.json(item);
  } catch (e) {
    console.error("GET /products/:id error:", e);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

/** PRIVATE: Create product */
productsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection("products");

    const name = normalizeString(req.body?.name);
    const price = toNumber(req.body?.price);
    const availableQty = toNumber(req.body?.availableQty);

    if (!name) return res.status(400).json({ message: "Missing required fields: name" });
    if (!Number.isFinite(price)) return res.status(400).json({ message: "Missing required fields: price" });
    if (!Number.isFinite(availableQty)) return res.status(400).json({ message: "Missing required fields: availableQty" });

    const imageUrl = normalizeString(req.body?.imageUrl) || "";
    const originCountry = normalizeString(req.body?.originCountry) || "";
    const ratingRaw = req.body?.rating;
    const rating = Number.isFinite(toNumber(ratingRaw)) ? toNumber(ratingRaw) : 0;

    const doc = {
      name,
      imageUrl,
      originCountry,
      rating,
      price,
      availableQty,
      ownerUid: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const result = await col.insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (e) {
    console.error("POST /products error:", e);
    res.status(500).json({ message: "Failed to create product" });
  }
});

/** PRIVATE: Update product (owner only) */
productsRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection("products");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid product id" });

    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    if (existing.ownerUid !== req.user.uid) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const update = {};
    if (req.body?.name !== undefined) update.name = normalizeString(req.body.name);
    if (req.body?.imageUrl !== undefined) update.imageUrl = normalizeString(req.body.imageUrl);
    if (req.body?.originCountry !== undefined) update.originCountry = normalizeString(req.body.originCountry);

    if (req.body?.rating !== undefined) {
      const r = toNumber(req.body.rating);
      if (Number.isFinite(r)) update.rating = r;
    }

    if (req.body?.price !== undefined) {
      const p = toNumber(req.body.price);
      if (Number.isFinite(p)) update.price = p;
    }

    if (req.body?.availableQty !== undefined) {
      const q = toNumber(req.body.availableQty);
      if (Number.isFinite(q)) update.availableQty = q;
    }

    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (e) {
    console.error("PUT /products/:id error:", e);
    res.status(500).json({ message: "Failed to update product" });
  }
});

/** PRIVATE: Delete product (owner only) */
productsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection("products");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid product id" });

    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    if (existing.ownerUid !== req.user.uid) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await col.deleteOne({ _id: new ObjectId(id) });
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (e) {
    console.error("DELETE /products/:id error:", e);
    res.status(500).json({ message: "Failed to delete product" });
  }
});
