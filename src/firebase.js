import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB7K8eDJcUqEcYrztdbniBDnFNyZgMZKzM",
  authDomain: "fmoc-b630e.firebaseapp.com",
  projectId: "fmoc-b630e",
  storageBucket: "fmoc-b630e.firebasestorage.app",
  messagingSenderId: "672420082147",
  appId: "1:672420082147:web:55c7d53a5e96d6397bb0d6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
