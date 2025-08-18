// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEwtAtYOHru_6j6nNkCDeJX7Vq3MN8yJc",
  authDomain: "willmington-1caef.firebaseapp.com",
  projectId: "willmington-1caef",
  storageBucket: "willmington-1caef.appspot.com",
  messagingSenderId: "343677991901",
  appId: "1:343677991901:web:83b3b16f39974161961434"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);