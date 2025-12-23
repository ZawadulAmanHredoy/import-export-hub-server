✅ server/README.md
# Import Export Hub — Server (API)

Node.js + Express API deployed on **Vercel** with **MongoDB** and **Firebase Admin** authentication.

---

## Features

- Public products API:
  - `GET /products` (all products)
  - `GET /products/:id` (single product)
- Protected APIs (requires Firebase Auth token):
  - `POST /products` (create product)
  - `GET /products/my` (my products)
  - `PUT /products/:id` (update product)
  - `DELETE /products/:id` (delete product)
  - Imports routes (if enabled in project)
- CORS configured for Firebase Hosting + localhost
- Serverless-ready database connection (Vercel)

---

## Tech Stack

- Node.js
- Express
- MongoDB (Native Driver)
- Firebase Admin (JWT verification)
- Deployed on Vercel

---

## Project Structure


server/
  api/
    index.js              # Vercel serverless entry
  src/
    app.js                # Express app (export default)
    lib/
      db.js               # Mongo connect + getDB()
      firebaseAdmin.js    # Lazy Firebase Admin init
    middlewares/
      requireAuth.js      # Verifies Bearer token
    routes/
      products.js         # Product routes
      imports.js          # Import routes (if used)
  vercel.json             # Vercel routing config
  package.json

Environment Variables (Vercel)

Set these in: Vercel → Project → Settings → Environment Variables

MongoDB (Required)

MONGODB_URI = Your MongoDB connection string

DB_NAME = Your database name (optional if your code defaults it)

Firebase Admin (Required for protected routes)

These are needed for routes using requireAuth:

FB_PROJECT_ID

FB_CLIENT_EMAIL

FB_PRIVATE_KEY

✅ Important for FB_PRIVATE_KEY:

Paste it with \n, not real line breaks.

Example format:

-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n

Optional

CLIENT_ORIGIN = your Firebase hosting URL (example: https://your-app.web.app)

Local Development
1) Install dependencies
cd server
npm install

2) Create .env
MONGODB_URI=your_mongodb_uri
DB_NAME=your_db_name

FB_PROJECT_ID=your_project_id
FB_CLIENT_EMAIL=your_client_email
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

CLIENT_ORIGIN=http://localhost:5173

3) Run locally
npm run dev


Server runs on your configured port (or default).

API Endpoints
Health

GET / → { ok: true, message: ... }

Products (Public)

GET /products

GET /products/:id

Products (Protected)

Requires header:
Authorization: Bearer <firebase_id_token>

POST /products

GET /products/my

PUT /products/:id

DELETE /products/:id

Deployment (Vercel)

Push server to GitHub

Import the repo in Vercel

Set the environment variables

Deploy

Test:

https://<vercel-app>.vercel.app/

https://<vercel-app>.vercel.app/products
