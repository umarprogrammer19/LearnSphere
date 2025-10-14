import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBB184nw_es0XgxWMfLdbttdpOIiwwAvfo",
  authDomain: "education-system-uzass.firebaseapp.com",
  projectId: "education-system-uzass",
  storageBucket: "education-system-uzass.firebasestorage.app",
  messagingSenderId: "722272209383",
  appId: "1:722272209383:web:911b5593808f1b4561d542",
  measurementId: "G-30NEZ7MPS4"
};
// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

const storage = getStorage(firebaseApp); // Add this line to initialize storage

export { firebaseApp, storage };