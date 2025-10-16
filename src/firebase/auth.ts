"use client";

import { initializeFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  ConfirmationResult,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithCredential,
  OAuthProvider,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  PhoneAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";


const { auth, firestore } = initializeFirebase();


// --- User data types ---
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  country: string;
  city: string;
}

export interface FullUserProfile extends UserData {
  uid: string;
  role: "student" | "teacher" | "shop_owner" | "rider";
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  tutorVerificationStatus: "pending" | "verified" | "rejected" | "unverified";
  qualification: string;
  board: string;
  classGrade: string;
  about: string;
  profileImageUrl: string;
  schoolName: string;
  availableSlots: any[];
  currentLocation: { latitude: string, longitude: string };
  location: { latitude: number, longitude: number } | null;
  locationType: "tutor_home" | "student_home" | "online" | "center";
  teachingSubjects: string[];
  hourlyPricing: number;
  CNIC: string;
  degreeScreenshots: string[];
  isProfileCompleted: boolean;
  createdAt: any;
  updatedAt: any;
  lastActiveAt?: any;
}


// --- User Profile Management ---
const createUserProfile = async (user: User, additionalData: Partial<UserData> = {}) => {
  const userRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const updateData: Partial<FullUserProfile> = {
      lastActiveAt: serverTimestamp(),
      isEmailVerified: user.emailVerified,
      profileImageUrl: user.photoURL || userDoc.data()?.profileImageUrl || '',
    };
    if (!userDoc.data().firstName && (additionalData.firstName || user.displayName)) {
      updateData.firstName = additionalData.firstName || user.displayName?.split(' ')[0];
    }
    if (!userDoc.data().lastName && (additionalData.lastName || user.displayName)) {
      const nameParts = user.displayName?.split(' ') || [];
      updateData.lastName = additionalData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
    }
    await setDoc(userRef, updateData, { merge: true });
    return;
  }

  const nameParts = user.displayName?.split(' ') || [];
  const firstName = additionalData.firstName || (nameParts[0] || '');
  const lastName = additionalData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');


  const data: Partial<FullUserProfile> = {
    uid: user.uid,
    email: user.email || additionalData.email || "",
    firstName,
    lastName,
    phoneNumber: user.phoneNumber || additionalData.phoneNumber || "",
    dateOfBirth: additionalData.dateOfBirth || "",
    country: additionalData.country || "",
    city: additionalData.city || "",

    role: "student",
    isEmailVerified: user.emailVerified,
    isPhoneVerified: !!user.phoneNumber,
    tutorVerificationStatus: "unverified",
    isProfileCompleted: false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

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
  const displayName = `${userData.firstName} ${userData.lastName}`;
  await updateProfile(user, { displayName });
  await createUserProfile(user, userData);
  // Important: Send email verification to the user.
  // The user will not be able to log in until their email is verified.
  await sendEmailVerification(user);
  return user;
};

export const handleEmailSignIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
    // Prevent login if email is not verified and throw a specific error code.
    await signOut(auth);
    const error: any = new Error("Email not verified");
    error.code = "auth/email-not-verified";
    throw error;
  }

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
const handleSocialSignIn = async (providerName: "google" | "microsoft") => {
  const provider = providerName === 'google'
    ? new GoogleAuthProvider()
    : new OAuthProvider("microsoft.com");

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    await createUserProfile(user);
    return user;
  } catch (error: any) {
    if (error.code !== "auth/popup-closed-by-user") {
      console.error(`Error during ${providerName} sign-in:`, error);
      throw error;
    }
    return null;
  }
};

export const handleGoogleSignIn = () => handleSocialSignIn("google");

export const handleMicrosoftSignIn = () => handleSocialSignIn("microsoft");

// --- Phone Auth (OTP) ---

/**
 * Initializes and returns a reCAPTCHA verifier.
 * This is a critical step for phone authentication to prevent abuse.
 * It's designed to be called once per page load.
 * @param containerId The ID of the DOM element where the reCAPTCHA widget should be rendered.
 * @param toast A function to display user-facing notifications.
 * @returns A RecaptchaVerifier instance.
 */
export const getRecaptchaVerifier = (containerId: string, toast: (options: any) => void) => {
  if (typeof window === 'undefined') {
    return null; // Should not be called on server
  }

  // Reuse existing verifier if it's already on the window object to avoid re-initialization errors.
  if (window.recaptchaVerifier) {
     window.recaptchaVerifier.clear();
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: (response: any) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
    'expired-callback': () => {
      // Response expired. Ask user to solve reCAPTCHA again.
      toast({
        title: "reCAPTCHA Expired",
        description: "Please try sending the code again.",
        variant: "destructive"
      });
    }
  });

  window.recaptchaVerifier = verifier;
  return verifier;
};


export const startPhoneSignIn = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

/**
 * Confirms the OTP and links the phone number to the existing authenticated user.
 * It then updates the user's profile in Firestore to reflect their new 'teacher' role and verified phone status.
 * This approach prevents the creation of duplicate user documents by merging data into the existing user record.
 * @param confirmationResult The result from the initial `startPhoneSignIn` call.
 * @param code The 6-digit OTP code entered by the user.
 * @param currentUser The currently logged-in Firebase user.
 * @param phoneNumber The phone number being verified (must be passed from the OTP form).
 */
export const confirmOtp = async (
  confirmationResult: ConfirmationResult,
  code: string,
  currentUser: User,
  phoneNumber: string
) => {
  const credential = PhoneAuthProvider.credential(
    confirmationResult.verificationId,
    code
  );

  // Link the phone credential to the currently signed-in user account.
  // This is crucial to avoid creating a new anonymous user.
  const userCredential = await linkWithCredential(currentUser, credential);
  const updatedUser = userCredential.user;

  const userRef = doc(firestore, `users/${updatedUser.uid}`);

  // Use `updateDoc` to merge new information into the existing user document.
  // This ensures we don't overwrite other profile data.
  // The phone number is passed in from the form to ensure we're using the correct, verified number.
  await updateDoc(userRef, {
    isPhoneVerified: true,
    phoneNumber: phoneNumber, // Use the verified phone number from the form.
    updatedAt: serverTimestamp(),
  } as Partial<FullUserProfile>);

  return updatedUser;
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
