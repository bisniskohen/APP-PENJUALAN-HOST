
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// WARNING: It is highly recommended to use environment variables for Firebase config
// and not to commit them to version control. These keys are visible to anyone and should be secured.
const firebaseConfig = {
  apiKey: "AIzaSyCWS1wujDKhzIZgXbljXPtPblyPY271HX8",
  authDomain: "penjualan-live.firebaseapp.com",
  projectId: "penjualan-live",
  storageBucket: "penjualan-live.firebasestorage.app",
  messagingSenderId: "805652897805",
  appId: "1:805652897805:web:c42e97172e349c47e5b544",
  measurementId: "G-SYR3NYEHC5"
};


const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

export { app, auth, db };