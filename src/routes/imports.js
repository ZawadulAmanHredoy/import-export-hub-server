import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/db.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const importsRouter = Router();

// POST /imports (private) - Import Now with qty <= availableQty; reduce product qty with $inc
importsRouter.post("/", requireAuth, async (req, res) => {
  const db = getDB();
  const { productId, quantity } = req.body || {};
  const qty = Number(quantity);

  if (!productId || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const products = db.collection("products");
  const imports = db.collection("imports");

  // Atomic-ish: only decrement if enough stock
  const result = await products.updateOne(
    { _id: new ObjectId(productId), availableQty: { $gte: qty } },
    { $inc: { availableQty: -qty } }
  );

  if (result.matchedCount === 0) {
    return res.status(400).json({ message: "Not enough quantity available" });
  }

  const importDoc = {
    userUid: req.user.uid,
    productId: new ObjectId(productId),
    quantity: qty,
    createdAt: new Date()
  };

  const ins = await imports.insertOne(importDoc);
  res.status(201).json({ _id: ins.insertedId, ...importDoc });
});

// GET /imports/my (private) - include product fields
importsRouter.get("/my", requireAuth, async (req, res) => {
  const db = getDB();

  const rows = await db.collection("imports").aggregate([
    { $match: { userUid: req.user.uid } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" }
  ]).toArray();

  res.json(rows);
});

// DELETE /imports/:id (private) - remove import record only (requirement: remove from UI+DB)
importsRouter.delete("/:id", requireAuth, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const existing = await db.collection("imports").findOne({ _id: new ObjectId(id) });
  if (!existing) return res.status(404).json({ message: "Not found" });
  if (existing.userUid !== req.user.uid) return res.status(403).json({ message: "Forbidden" });

  await db.collection("imports").deleteOne({ _id: new ObjectId(id) });
  res.json({ ok: true });
});
