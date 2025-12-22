import "dotenv/config";
import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products.js";
import { importsRouter } from "./routes/imports.js";

const app = express();

// Allow local + deployed client
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (like Postman) with no origin
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked origin: " + origin), false);
    },
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

export default app;
