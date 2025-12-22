import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/db.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const productsRouter = Router();

// GET /products?limit=6&sort=latest OR /products?search=tea
productsRouter.get("/", async (req, res) => {
  const db = getDB();
  const limit = Number(req.query.limit || 0);
  const sort = req.query.sort === "latest" ? { createdAt: -1 } : { createdAt: -1 };
  const search = (req.query.search || "").trim();

  const filter = search
    ? { name: { $regex: search, $options: "i" } }
    : {};

  const cursor = db.collection("products").find(filter).sort(sort);
  if (limit > 0) cursor.limit(limit);

  const items = await cursor.toArray();
  res.json(items);
});

// GET /products/my (private) - exports created by user
productsRouter.get("/my", requireAuth, async (req, res) => {
  const db = getDB();
  const items = await db
    .collection("products")
    .find({ ownerUid: req.user.uid })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(items);
});

// GET /products/:id
productsRouter.get("/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const item = await db.collection("products").findOne({ _id: new ObjectId(id) });
  if (!item) return res.status(404).json({ message: "Not found" });

  res.json(item);
});

// POST /products (private) - add export/product
productsRouter.post("/", requireAuth, async (req, res) => {
  const db = getDB();
  const { name, imageUrl, price, originCountry, rating, availableQty } = req.body || {};

  if (!name || !imageUrl || !originCountry) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const doc = {
    name,
    imageUrl,
    price: Number(price),
    originCountry,
    rating: Number(rating),
    availableQty: Number(availableQty),
    ownerUid: req.user.uid,
    createdAt: new Date()
  };

  const result = await db.collection("products").insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
});

// PUT /products/:id (private) - update export/product
productsRouter.put("/:id", requireAuth, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const existing = await db.collection("products").findOne({ _id: new ObjectId(id) });
  if (!existing) return res.status(404).json({ message: "Not found" });
  if (existing.ownerUid !== req.user.uid) return res.status(403).json({ message: "Forbidden" });

  const { name, imageUrl, price, originCountry, rating, availableQty } = req.body || {};

  const update = {
    ...(name ? { name } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(originCountry ? { originCountry } : {}),
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(rating !== undefined ? { rating: Number(rating) } : {}),
    ...(availableQty !== undefined ? { availableQty: Number(availableQty) } : {})
  };

  await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: update });
  const updated = await db.collection("products").findOne({ _id: new ObjectId(id) });
  res.json(updated);
});

// DELETE /products/:id (private)
productsRouter.delete("/:id", requireAuth, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const existing = await db.collection("products").findOne({ _id: new ObjectId(id) });
  if (!existing) return res.status(404).json({ message: "Not found" });
  if (existing.ownerUid !== req.user.uid) return res.status(403).json({ message: "Forbidden" });

  await db.collection("products").deleteOne({ _id: new ObjectId(id) });
  res.json({ ok: true });
});
