// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALbQt08Th6E7WaTYospJ4YKztgG6Di_hE",
  authDomain: "archives-335bc.firebaseapp.com",
  projectId: "archives-335bc",
  storageBucket: "archives-335bc.firebasestorage.app",
  messagingSenderId: "853422244666",
  appId: "1:853422244666:web:65ac1721ed385aa6308603",
  measurementId: "G-7CLZE63591"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);