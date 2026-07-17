import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config obtained from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBMAEcYrSx-wDDtUtlcb1vpoWYIFNYTo9M",
  authDomain: "gen-lang-client-0583467398.firebaseapp.com",
  projectId: "gen-lang-client-0583467398",
  storageBucket: "gen-lang-client-0583467398.firebasestorage.app",
  messagingSenderId: "375818640212",
  appId: "1:375818640212:web:fec199c8b90bb8be63c6c1"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID
export const db = getFirestore(
  app,
  "ai-studio-accountphonesync-ded1e0ad-c6e9-4bcf-83d5-d7f9176c160b"
);

