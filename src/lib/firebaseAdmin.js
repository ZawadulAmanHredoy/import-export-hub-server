import admin from "firebase-admin";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

if (!admin.apps.length) {
  const projectId = requireEnv("FB_PROJECT_ID");
  const clientEmail = requireEnv("FB_CLIENT_EMAIL");
  const privateKey = requireEnv("FB_PRIVATE_KEY").replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

export const firebaseAdmin = admin;
