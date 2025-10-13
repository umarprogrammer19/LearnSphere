"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { onAuthStateChange } from "@/firebase/auth";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();

interface UserData extends DocumentData {
  firstName: string;
  lastName: string;
  isProfileCompleted: boolean;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChange((authUser) => {
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
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
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
