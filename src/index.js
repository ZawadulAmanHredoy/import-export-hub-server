import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { productsRouter } from "./routes/products.js";
import { importsRouter } from "./routes/imports.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: false
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, name: "Import Export Hub API" });
});

app.use("/products", productsRouter);
app.use("/imports", importsRouter);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`API running on port ${port}`));
  })
  .catch((e) => {
    console.error("DB connection failed:", e);
    process.exit(1);
  });
