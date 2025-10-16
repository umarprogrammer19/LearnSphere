
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

let app: App;

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Initialize with service account key if present
    const serviceAccount = JSON.parse(serviceAccountKey);
    app = initializeApp({
      credential: credential.cert(serviceAccount),
    });
  } else {
    // Otherwise, initialize with Application Default Credentials (ADC)
    // This is the standard for Firebase-managed environments (like App Hosting)
    app = initializeApp();
  }
} else {
  // Use the existing app if already initialized
  app = getApps()[0];
}

export { app };
