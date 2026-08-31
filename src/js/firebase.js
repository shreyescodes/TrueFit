import { initializeApp } from 'firebase/app';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPImklFAlLTY1ETkV4YCBRDN9b7VWeHcE",
  projectId: "truefit-442a3",
  storageBucket: "truefit-442a3.firebasestorage.app",
  messagingSenderId: "716212569927",
  appId: "1:716212569927:web:50c85c84a4b0a657fcee62" // Extrapolated from android appId format
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
