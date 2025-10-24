
"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { onAuthStateChanged, FullUserProfile } from "@/firebase/auth";
import { initializeFirebase } from "@/firebase";

// initialize firebase app
const { firestore } = initializeFirebase();

// Main Hook
export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (!authUser) {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // fetch when mount 
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as FullUserProfile);
        } else {
          setUserData(null);
        }
        setIsLoading(false);
      }, (error) => {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setIsLoading(false);
      });
      return () => unsubscribeFirestore();
    }
  }, [user]);

  return { user, userData, isLoading };
};
