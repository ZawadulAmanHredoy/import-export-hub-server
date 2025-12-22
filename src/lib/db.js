import { MongoClient } from "mongodb";

let client;
let db;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(process.env.DB_NAME || "importExportHub");
  return db;
}

export function getDB() {
  if (!db) throw new Error("DB not initialized");
  return db;
}
