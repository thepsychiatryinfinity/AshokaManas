import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// --- YOUR REAL KEYS ---
const firebaseConfig = {
  apiKey: "AIzaSyDyipE8alZJTB7diAmBkgR4AaPeS7x0JrQ",
  authDomain: "ashokamanas.firebaseapp.com",
  projectId: "ashokamanas",
  storageBucket: "ashokamanas.firebasestorage.app",
  messagingSenderId: "1080479867672",
  appId: "1:1080479867672:web:7087c826da63fd231c746d",
  measurementId: "G-HY8TS7H8LW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [logs, setLogs] = useState([]);
  const [posts, setPosts] = useState([]);

  // Function to print text to the screen
  const log = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    log("🚀 App Started (V37 Debug Mode)");
    
    try {
      // 1. Test Auth
      log("Step 1: Attempting Login...");
      const userCred = await signInAnonymously(auth);
      log(`✅ Logged in as: ${userCred.user.uid.slice(0,5)}...`);

      // 2. Test Database Write
      log("Step 2: Attempting to Write...");
      await addDoc(collection(db, 'debug_test'), {
        test: "Hello World",
        time: serverTimestamp()
      });
      log("✅ Write Successful!");

      // 3. Test Database Read
      log("Step 3: Attempting to Read...");
      const snapshot = await getDocs(collection(db, 'debug_test'));
      log(`✅ Read Successful! Found ${snapshot.size} docs.`);
      setPosts(snapshot.docs.map(d => d.data()));

    } catch (error) {
      log("❌ FATAL ERROR:");
      log(error.message); // THIS WILL SHOW YOU THE EXACT PROBLEM
      log("Code: " + error.code);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1 style={{ color: 'teal' }}>AshokaManas Debugger</h1>
      <p>If you see Red Text below, send it to me.</p>
      
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        color: '#00ff00', 
        padding: 15, 
        borderRadius: 10,
        minHeight: 300,
        overflow: 'auto',
        marginBottom: 20
      }}>
        {logs.map((l, i) => (
          <div key={i} style={{ 
            marginBottom: 5, 
            color: l.includes("❌") ? 'red' : '#00ff00' 
          }}>
            {l}
          </div>
        ))}
      </div>

      <button 
        onClick={() => window.location.reload()}
        style={{ padding: '15px', width: '100%', fontSize: '16px' }}
      >
        Retry Connection
      </button>
    </div>
  );
}


