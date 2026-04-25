import admin from 'firebase-admin';
import type { VercelRequest } from '@vercel/node';

if (!admin.apps?.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set. Initializing admin without credentials.");
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "demo-project"
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    admin.initializeApp();
  }
}

export async function verifyToken(req: VercelRequest) {
  const authHeader = req.headers.authorization || (req.headers as any).Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Unauthorized: Invalid token');
  }
}
