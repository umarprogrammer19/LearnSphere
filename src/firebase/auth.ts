"use client";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

const { auth, firestore } = initializeFirebase();

// User data structure
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  country: string;
  city: string;
}

// --- User Profile Management ---
const createUserProfile = async (user: User, additionalData: Partial<UserData> = {}) => {
  const userRef = doc(firestore, "users", user.uid);
  const data = {
    uid: user.uid,
    email: user.email || additionalData.email || "",
    firstName: additionalData.firstName || "",
    lastName: additionalData.lastName || "",
    phoneNumber: user.phoneNumber || additionalData.phoneNumber || "",
    dateOfBirth: additionalData.dateOfBirth || "",
    country: additionalData.country || "",
    city: additionalData.city || "",
    
    // Defaults
    role: "student",
    qualification: "",
    board: "",
    classGrade: "",
    about: "",
    profileImageUrl: user.photoURL || "",
    schoolName: "",
    availableSlots: [],
    
    // System fields
    isEmailVerified: user.emailVerified,
    isPhoneVerified: !!user.phoneNumber,
    tutorVerificationStatus: "pending",
    
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  // Use merge: true to avoid overwriting existing data on login
  await setDoc(userRef, data, { merge: true });
};

// --- Email/Password Auth ---
export const handleEmailSignUp = async (
  email: string,
  password: string,
  userData: UserData
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  await createUserProfile(user, userData);
  await sendEmailVerification(user);
  return user;
};

export const handleEmailSignIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  const userRef = doc(firestore, `users/${user.uid}`);
  await setDoc(
    userRef,
    {
      lastActiveAt: serverTimestamp(),
      isEmailVerified: user.emailVerified,
    },
    { merge: true }
  );
  return user;
};

// --- Social Logins ---
const handleSocialSignIn = async (provider: "google" | "microsoft") => {
    const authProvider = provider === 'google' 
        ? new GoogleAuthProvider() 
        : new OAuthProvider("microsoft.com");
  
    try {
        const userCredential = await signInWithPopup(auth, authProvider);
        const user = userCredential.user;
        
        const [firstName, ...lastNameParts] = (user.displayName || "").split(" ");
        const lastName = lastNameParts.join(" ");

        await createUserProfile(user, { firstName, lastName, email: user.email ?? '' });
        return user;
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            console.warn('Authentication popup was closed by the user.');
            // This is a user action, not necessarily an app error. 
            // We can choose to return null or re-throw a more specific error.
            return null;
        }
        // For other errors, we log and re-throw to be handled by the caller.
        console.error(`Error during ${provider} sign-in:`, error);
        throw error;
    }
};

export const handleGoogleSignIn = () => {
  return handleSocialSignIn("google");
};

export const handleMicrosoftSignIn = () => {
  return handleSocialSignIn("microsoft");
};

// --- Phone Auth (OTP) ---
export const getRecaptchaVerifier = (containerId: string) => {
  if (window.recaptchaVerifier) {
    // To avoid creating multiple verifiers
    return window.recaptchaVerifier;
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: (response: any) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
  });
  return window.recaptchaVerifier;
};

export const startPhoneSignIn = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const confirmOtp = async (
  confirmationResult: ConfirmationResult,
  code: string
) => {
  const result = await confirmationResult.confirm(code);
  const user = result.user;
  const userRef = doc(firestore, `users/${user.uid}`);
  await setDoc(userRef, { isPhoneVerified: true, phoneNumber: user.phoneNumber }, { merge: true });
  return user;
};


// --- Other Auth Actions ---
export const handlePasswordReset = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const handleSignOut = async () => {
  return signOut(auth);
};

// --- Auth State Observer ---
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onFirebaseAuthStateChanged(auth, callback);
};

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}
