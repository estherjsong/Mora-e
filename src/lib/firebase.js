// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqMU_V2c8_dARBkU7QZX50ek3MHRDoi9U",
  authDomain: "mora-e.firebaseapp.com",
  projectId: "mora-e",
  storageBucket: "mora-e.firebasestorage.app",
  messagingSenderId: "790647093771",
  appId: "1:790647093771:web:20c0fd8d0de5a24ae9a50e",
  measurementId: "G-5HGX462QYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);