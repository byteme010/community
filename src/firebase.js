import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAnwt9Ejg1EFTlDykM24OsJvl3mFijh4dk",
  authDomain: "clareo-533ee.firebaseapp.com",
  projectId: "clareo-533ee",
  storageBucket: "clareo-533ee.firebasestorage.app",
  messagingSenderId: "282873797222",
  appId: "1:282873797222:web:d9e56b965777d69b812ba7",
  measurementId: "G-MZNNVFECQ7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
