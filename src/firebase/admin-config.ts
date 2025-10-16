import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// This is a placeholder for your service account key.
// In production, you should use Application Default Credentials.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

let app: App;

if (getApps().length === 0) {
  app = initializeApp({
    credential: serviceAccount ? credential.cert(serviceAccount) : undefined,
  });
} else {
  app = getApps()[0];
}

export { app };
