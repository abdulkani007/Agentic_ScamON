import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAbXUAh7iQLK3gejr-UsN6ZgspG-_iM9cg",
  authDomain: "scamon-320cc.firebaseapp.com",
  projectId: "scamon-320cc",
  storageBucket: "scamon-320cc.firebasestorage.app",
  messagingSenderId: "601255475677",
  appId: "1:601255475677:web:b5b7848c2738393dc55e34",
  measurementId: "G-ET5Z4C9NHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
};
