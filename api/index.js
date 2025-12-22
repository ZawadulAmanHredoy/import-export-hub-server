import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// 1. IMPORT THE DB CONNECTION FROM YOUR LIB FILE
// (Make sure the path matches your structure, typically ./lib/db.js)
import { connectDB } from "./lib/db.js";

// 2. Import your routes
import { productsRouter } from "./routes/products.js";
import { importsRouter } from "./routes/imports.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'), false);
  }
}));

app.use(express.json());

// 3. Initialize Firebase Admin (using your existing environment variables)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FB_PROJECT_ID,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        // Fix newline issues in private key
        privateKey: process.env.FB_PRIVATE_KEY 
          ? process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n") 
          : undefined,
      }),
    });
    console.log("Firebase Admin Initialized");
  } catch (error) {
    console.error("Firebase Admin Error:", error);
  }
}

// 4. Connect to Database IMMEDIATELY
// This sets up the 'db' variable inside db.js so other files can use getDB()
connectDB()
  .then(() => console.log("MongoDB Connected via db.js"))
  .catch((err) => console.error("Failed to connect to DB:", err));

// 5. Health Check
app.get("/", (req, res) => {
  res.json({ ok: true, name: "Import Export Hub API", status: "Running" });
});

// 6. Mount the Routes
app.use("/products", productsRouter);
app.use("/imports", importsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;