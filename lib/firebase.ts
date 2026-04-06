import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpkZlJMO5f5xlJFqQluopkcQS6PuS0LOo",
  authDomain: "eduboost-ai-b63fd.firebaseapp.com",
  projectId: "eduboost-ai-b63fd",
  storageBucket: "eduboost-ai-b63fd.firebasestorage.app",
  messagingSenderId: "655038480651",
  appId: "1:655038480651:web:95f0ee285de19f4d57a20e",
  measurementId: "G-FMS6JGCTVB",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);