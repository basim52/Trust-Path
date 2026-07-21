import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0689175056",
  appId: "1:652115799495:web:f1d76fa19f396f1d4abde2",
  apiKey: "AIzaSyCn26iKPQYiPm8Ah_k1OpkZ-kcYNnqoQSg",
  authDomain: "gen-lang-client-0689175056.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-fb281702-591e-4d5d-883d-77b76897de57",
  storageBucket: "gen-lang-client-0689175056.firebasestorage.app",
  messagingSenderId: "652115799495"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
