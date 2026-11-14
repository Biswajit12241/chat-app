import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getServiceAccountPath(): string {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './secrets/serviceAccountKey.json';

  // Check absolute path
  if (path.isAbsolute(envPath) && fs.existsSync(envPath)) {
    return envPath;
  }

  // Check relative to cwd
  const cwdPath = path.resolve(process.cwd(), envPath);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  // Check relative to backend directory
  const backendRelative = path.resolve(__dirname, '../../', envPath);
  if (fs.existsSync(backendRelative)) {
    return backendRelative;
  }

  // Check direct backend/secrets fallback
  const directFallback = path.resolve(__dirname, '../../secrets/serviceAccountKey.json');
  if (fs.existsSync(directFallback)) {
    return directFallback;
  }

  throw new Error(`Firebase service account file not found at: ${envPath}`);
}

let app: App;
if (getApps().length === 0) {
  const serviceAccountFile = getServiceAccountPath();
  const serviceAccountData = JSON.parse(fs.readFileSync(serviceAccountFile, 'utf8'));

  app = initializeApp({
    credential: cert(serviceAccountData),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountData.project_id,
  });
} else {
  app = getApps()[0] as App;
}

export const firestore: Firestore = getFirestore(app);
export { FieldValue, Timestamp };

/**
 * Tests Firebase Firestore connectivity.
 */
export async function testFirebaseConnection(): Promise<void> {
  const collections = await firestore.listCollections();
  console.log(
    `[Firebase] Successfully connected to Firestore. Collections: ${collections.map((c) => c.id).join(', ') || '(empty)'}`
  );
}
