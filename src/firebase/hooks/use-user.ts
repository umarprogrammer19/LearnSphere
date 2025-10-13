"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { onAuthStateChanged } from "@/firebase/auth";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();

interface UserData extends DocumentData {
  firstName: string;
  lastName: string;
  // Add other fields from your user schema
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
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

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        } else {
          // This case might happen briefly if Firestore creation is slow
          setUserData(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribeFirestore();
    }
  }, [user]);

  return { user, userData, isLoading };
};
