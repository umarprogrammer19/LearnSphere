
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

let app: App;

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        app = initializeApp({
          credential: credential.cert(serviceAccount),
          // Add projectId here to be explicit, helps in some environments
          projectId: serviceAccount.project_id,
        });
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
        // Fallback to ADC if parsing fails
        app = initializeApp();
    }
  } else {
    // This is the standard for Firebase-managed environments (like App Hosting)
    // and will also work if gcloud auth application-default login has been run.
    app = initializeApp();
  }
} else {
  // Use the existing app if already initialized
  app = getApps()[0];
}

export { app };
