import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Removed GoogleAuthProvider import

const firebaseConfig = {
  apiKey: "AIzaSyCNTZ7LSK6yQ27l6yPtXM83gV9NmB0EwE4",
  authDomain: "visiotrack-48142.firebaseapp.com",
  projectId: "visiotrack-48142",
  storageBucket: "visiotrack-48142.appspot.com",
  messagingSenderId: "211890624127",
  appId: "1:211890624127:web:3d8ddbeca2e833092b514a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth }; // Removed googleProvider export