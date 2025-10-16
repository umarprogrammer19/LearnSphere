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
  role: "student" | "teacher" | "shop_owner" | "rider" | "admin";
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
  location: { latitude: number, longitude: number, formattedAddress?: string, placeName?: string } | null;
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
  await sendEmailVerification(user);
  return user;
};

export const handleEmailSignIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
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
export const getRecaptchaVerifier = (containerId: string, toast: ReturnType<typeof useToast>['toast']) => {
  if (typeof window === 'undefined') {
    return null; 
  }

  if (window.recaptchaVerifier) {
     window.recaptchaVerifier.clear();
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: (response: any) => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
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

  await linkWithCredential(currentUser, credential);

  const userRef = doc(firestore, `users/${currentUser.uid}`);
  
  await updateDoc(userRef, {
    isPhoneVerified: true,
    phoneNumber: phoneNumber,
    updatedAt: serverTimestamp(),
  } as Partial<FullUserProfile>);

  return currentUser;
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
