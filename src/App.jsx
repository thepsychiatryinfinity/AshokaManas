import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

// --- PASTE YOUR REAL FIREBASE CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyDyipE8alZJTB7diAmBkgR4AaPeS7x0JrQ",
  authDomain: "ashokamanas.firebaseapp.com",
  projectId: "ashokamanas",
  storageBucket: "ashokamanas.firebasestorage.app",
  messagingSenderId: "1080479867672",
  appId: "1:1080479867672:web:7087c826da63fd231c746d",
  measurementId: "G-HY8TS7H8LW"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [status, setStatus] = useState("Waiting to Connect...");
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setStatus("Attempting to connect...");
    try {
      // 1. Try Auth
      await signInAnonymously(auth);
      setStatus("Step 1: Login Successful ✅");
      
      // 2. Try Database
      setStatus("Step 2: Checking Database...");
      // We use a test read
      await getDocs(collection(db, 'artifacts', 'default-app-id', 'public', 'data', 'test_collection'));
      setStatus("Step 3: Database Connected! ✅ You are ready to launch the real app.");
    } catch (e) {
      console.error(e);
      setError(e.message);
      setStatus("Connection Failed ❌");
    }
  };

  return (
    <div className="p-10 font-sans max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">AshokaManas Diagnostic</h1>
      
      <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 mb-6">
        <p className="font-mono text-sm mb-4">{status}</p>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded text-xs text-left break-words">
            <strong>Error Detail:</strong> {error}
          </div>
        )}
      </div>

      <button 
        onClick={handleConnect}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold w-full"
      >
        Click to Test Connection
      </button>

      <p className="mt-8 text-xs text-gray-500">
        If you see this screen, your Vercel deployment IS working.
        If you still see the Leaf, your phone is caching the old version.
      </p>
    </div>
  );
}


