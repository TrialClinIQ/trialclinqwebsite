import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAY2_-gd060r3s3Pxp2Gjs40dfaYe3ZAVs",
  authDomain: "trialcliniq.firebaseapp.com",
  projectId: "trialcliniq",
  storageBucket: "trialcliniq.firebasestorage.app",
  messagingSenderId: "192075898822",
  appId: "1:192075898822:web:33861d85a90d4089255cc7",
  measurementId: "G-55Y2QV4DD2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
