import admin from "firebase-admin";

let initAttempted = false;

function getEnv(name) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v) : null;
}

/**
 * Lazy Firebase Admin init:
 * - Avoid crashing the whole serverless function when env vars are missing.
 * - If not configured, return null.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  // only try once per warm lambda
  if (initAttempted) return null;
  initAttempted = true;

  const projectId = getEnv("FB_PROJECT_ID");
  const clientEmail = getEnv("FB_CLIENT_EMAIL");
  const privateKeyRaw = getEnv("FB_PRIVATE_KEY");

  if (!projectId || !clientEmail || !privateKeyRaw) {
    // Not configured on this environment
    return null;
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin;
}
