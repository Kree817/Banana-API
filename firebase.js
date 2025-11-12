// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB_nWuZUQg7nIr58aIoUPLInyRCsLP8emA",
  authDomain: "banana-quiz-game.firebaseapp.com",
  projectId: "banana-quiz-game",
  storageBucket: "banana-quiz-game.firebasestorage.app",
  messagingSenderId: "187840025221",
  appId: "1:187840025221:web:5b35040af52098c0fdcfec",
  measurementId: "G-XSBPQMSC61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// helpers
async function signupUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userRef = doc(db, "users", cred.user.uid);
  await setDoc(userRef, {
    email,
    createdAt: serverTimestamp(),
    gamesPlayed: 0,
    correctAnswers: 0
  });
  return cred;
}

async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

async function logoutUser() {
  return signOut(auth);
}

async function recordCorrectAnswer(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: auth.currentUser?.email || "",
      createdAt: serverTimestamp(),
      gamesPlayed: 0,
      correctAnswers: 0
    });
  }
  await updateDoc(userRef, {
    gamesPlayed: increment(1),
    correctAnswers: increment(1)
  });
}

async function recordWrongAttempt(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: auth.currentUser?.email || "",
      createdAt: serverTimestamp(),
      gamesPlayed: 0,
      correctAnswers: 0
    });
  }
  await updateDoc(userRef, {
    gamesPlayed: increment(1)
  });
}

export {
  auth, db, onAuthStateChanged,
  signupUser, loginUser, logoutUser,
  recordCorrectAnswer, recordWrongAttempt
};
