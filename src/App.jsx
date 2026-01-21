import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Users, Shield, AlertTriangle, Flame, Activity, 
  Zap, Siren, Wind, Volume2, VolumeX,
  Lock, User, Sparkles, AlertCircle, Brush,
  Search, Send, Flag, Stethoscope, Pill, Baby, HeartHandshake, ScrollText,
  Pin, Trash2, Droplets, Mountain, Fan,
  Database, Gavel, Crown, ArrowUp, ArrowLeft, X, CheckSquare, Edit3, Wallet, Play, Reply, ShieldCheck, Home, BrainCircuit, TreePine, Copy, Bell, MessageCircle, RefreshCw, BookOpen, Loader, Fingerprint, Globe, Sun as SunIcon, Cloud, CloudRain, CloudLightning, Check
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, doc, onSnapshot, setDoc, serverTimestamp, 
  collection, addDoc, updateDoc, deleteDoc, query, orderBy, limit, where, getDocs
} from 'firebase/firestore';

// --- CONFIGURATION GUARD ---
const firebaseConfig = {
  apiKey: "AIzaSyDyipE8alZJTB7diAmBkgR4AaPeS7x0JrQ",
  authDomain: "ashokamanas.firebaseapp.com",
  projectId: "ashokamanas",
  storageBucket: "ashokamanas.firebasestorage.app",
  messagingSenderId: "1080479867672",
  appId: "1:1080479867672:web:7087c826da63fd231c746d",
  measurementId: "G-HY8TS7H8LW"
};

let db, auth, appId = 'ashokamanas-live-v1';
let isFirebaseInitialized = false;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseInitialized = true;
} catch (e) { console.warn("Offline Mode Active."); }

// --- KEYS ---
const ADMIN_KEY = "ASHOKA-SUPER-ADMIN-99";
const DOCTOR_KEY = "ASHOKA-DOC-VERIFY";

// --- SOUND ENGINE ---
const SoundEngine = {
  ctx: null,
  init() { 
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {}
  },
  playFreq(f, type = 'sine', duration = 0.1) {
    this.init();
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator(); 
      const g = this.ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.1, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + duration);
    } catch(e) {}
  },
  playClick() { this.playFreq(400, 'triangle', 0.05); },
  playPop() { this.playFreq(600, 'sine', 0.1); },
  playBurn() { this.playFreq(100, 'sawtooth', 1.5); },
  playAncient(f) { this.playFreq(f, 'sine', 3.0); }
};

// --- DATA ---
const WELCOME_MESSAGES = {
  General: { en: "Welcome to Peer Support.", te: "సాధారణ మద్దతు హాల్‌కు స్వాగతం." },
  Clinical: { en: "Welcome to Clinical Hub.", te: "క్లినికల్ హబ్." },
  Caregiver: { en: "Caregiver Support.", te: "సంరక్షకులు." },
  Addiction: { en: "Addiction Recovery.", te: "వ్యసన విముక్తి." },
  Child: { en: "Child & Teen Space.", te: "పిల్లల హాల్." },
  SideEffects: { en: "Medication Support.", te: "మందుల సమాచారం." },
  Stories: { en: "My Story.", te: "నా కథ." },
  Lab: { en: "Wellness Lab.", te: "వెల్నెస్ ల్యాబ్." }
};

const DEFAULT_LEGAL = [
  { t: "MEDICAL DISCLAIMER", m: "Not a replacement for professional medical advice. Call 108 for emergencies." },
  { t: "COMMUNITY GUIDELINES", m: "Zero tolerance for abuse or hate speech." },
  { t: "PRIVACY POLICY", m: "No personal identifiers collected." }
];

const DEFAULT_CARDS = [
  { id: 1, category: "Self", title: "The Void | శూన్యం", question: "Why do I feel empty?", answer: "Because you are a tool waiting to be used.", ancestralRoot: "Purpose was survival.", awarenessLogic: "Create meaning.", action: "Help someone today." }
];

const HALLS = [
  { id: 'General', label: 'General Support', te: 'సాధారణ', icon: Users, color: 'emerald', sticky: 'Identity Protected.' },
  { id: 'Clinical', label: 'Clinical Hub', te: 'క్లినికల్', icon: Stethoscope, color: 'cyan', expertOnly: true, sticky: 'Verified Experts Only.' },
  { id: 'Caregiver', label: 'Caregiver Burden', te: 'సంరక్షకుల', icon: HeartHandshake, color: 'rose', sticky: 'Self-care is vital.' },
  { id: 'Addiction', label: 'Addiction Support', te: 'వ్యసన విముక్తి', icon: Pill, color: 'amber', sticky: 'One day at a time.' },
  { id: 'Child', label: 'Child & Adolescent', te: 'పిల్లలు', icon: Baby, color: 'pink', sticky: 'Supervision Required.' },
  { id: 'SideEffects', label: 'Side Effects', te: 'దుష్ప్రభావాలు', icon: AlertCircle, color: 'orange', sticky: 'Consult your doctor.' },
  { id: 'Stories', label: 'My Story', te: 'నా కథ', icon: ScrollText, color: 'fuchsia', sticky: 'Your journey matters.' },
];

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ role: 'guest', streak: 0, level: 'Leaf' });
  const [view, setView] = useState('gate'); 
  const [activeHall, setActiveHall] = useState(null);
  const [lang, setLang] = useState('en');
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSOS, setShowSOS] = useState(false);
  const [showMitra, setShowMitra] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMood, setShowMood] = useState(false);
  
  // LIVE GLOBAL STATE
  const [masterCards, setMasterCards] = useState(() => {
    const saved = localStorage.getItem('ashoka_cards');
    return saved ? JSON.parse(saved) : DEFAULT_CARDS;
  });
  const [legalDocs, setLegalDocs] = useState(DEFAULT_LEGAL);
  const [mitraConfig, setMitraConfig] = useState({ persona: "You are Mitra, a wise friend.", key: "" });
  const [treasury, setTreasury] = useState({ india: "", global: "" });
  const [globalAlert, setGlobalAlert] = useState(""); 
  const [policyLink, setPolicyLink] = useState("");
  const [manualLink, setManualLink] = useState("");
  
  const [userList, setUserList] = useState([{uid:"u1", status:"active"}]);
  const [whispers, setWhispers] = useState([]); 
  const [paymentRequests, setPaymentRequests] = useState([]); 

  useEffect(() => {
    if (!isFirebaseInitialized) { setLoading(false); return; }
    
    // FIX: Properly capture the unsubscribe function
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid);
        onSnapshot(ref, (snap) => {
          if (snap.exists()) setUserData(snap.data());
          else setDoc(ref, { uid: u.uid, role: 'guest', streak: 1, level: 'Leaf', lastActive: serverTimestamp() });
          
          const lastMood = localStorage.getItem('ashoka_last_mood_date');
          const today = new Date().toDateString();
          if (lastMood !== today) setShowMood(true);

          setLoading(false);
        });
      } else {
        try {
          await signInAnonymously(auth);
        } catch(e) {
          console.log("Auth failed, possibly due to iframe restrictions. Continuing as offline guest.");
          setLoading(false);
        }
        setLoading(false);
      }
    });
    
    // FIX: Return the unsubscribe function correctly
    return () => unsubscribeAuth();
  }, []);

  // CLOUD SYNC
  useEffect(() => {
    if (!isFirebaseInitialized) return;
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'global_settings');
    const unsubConfig = onSnapshot(configRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.legal) { setLegalDocs(data.legal); localStorage.setItem('ashoka_legal', JSON.stringify(data.legal)); }
            if (data.treasury) setTreasury(data.treasury);
            if (data.persona) setMitraConfig(prev => ({...prev, persona: data.persona}));
            if (data.ai_key) setMitraConfig(prev => ({...prev, key: data.ai_key}));
            if (data.alert) setGlobalAlert(data.alert);
            if (data.policy) setPolicyLink(data.policy);
            if (data.manual) setManualLink(data.manual);
        }
    });
    const cardsRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'master_deck');
    const unsubCards = onSnapshot(cardsRef, (doc) => {
        if (doc.exists() && doc.data().cards) {
            setMasterCards(doc.data().cards);
            localStorage.setItem('ashoka_cards', JSON.stringify(doc.data().cards));
        }
    });
    const whispersRef = collection(db, 'artifacts', appId, 'public', 'data', 'whispers');
    const unsubWhispers = onSnapshot(query(whispersRef, orderBy('createdAt', 'desc'), limit(20)), (snap) => {
       setWhispers(snap.docs.map(d => d.data()));
    });
    const paymentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'payment_requests');
    const unsubPayments = onSnapshot(query(paymentsRef, orderBy('createdAt', 'desc'), limit(20)), (snap) => {
       setPaymentRequests(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubConfig(); unsubCards(); unsubWhispers(); unsubPayments(); };
  }, []);

  const showNotify = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const STICKY_TEXT = lang === 'en' ? "Educational Only. Not Medical Advice." : "అవగాహన కోసం మాత్రమే. వైద్య సలహా కాదు.";

  if (loading) return <div className="min-h-screen bg-[#020b08] flex items-center justify-center text-emerald-500"><Loader className="animate-spin" size={32}/></div>;

  if (view === 'gate') return <GateView onAccept={() => setView('home')} lang={lang} setLang={setLang} policyLink={policyLink} manualLink={manualLink} />;

  return (
    <div className={`min-h-screen font-sans bg-[#020b08] text-[#E0F2F1] transition-all duration-700 select-none overflow-x-hidden relative`}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute top-[20%] right-[30%] w-1 h-1 bg-emerald-400 rounded-full blur-[1px] animate-[ping_4s_infinite]"></div>
         <div className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 bg-yellow-100 rounded-full blur-[1px] animate-[ping_6s_infinite]"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5"></div>
      </div>
      {globalAlert && ( <div className="fixed top-[45px] left-0 right-0 z-[390] bg-red-900/90 text-white text-[10px] font-black uppercase tracking-widest p-2 text-center animate-pulse border-b border-red-500">🚨 {globalAlert}</div> )}
      {notification && ( <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-emerald-600 text-white rounded-full shadow-2xl font-bold text-xs animate-in slide-in-from-top-10 flex items-center gap-2 border border-emerald-400/50"><ShieldCheck size={14} /> {notification}</div> )}
      
      <div className="fixed top-0 left-0 right-0 z-[400] backdrop-blur-md border-b border-emerald-500/20 p-2 flex justify-between items-center shadow-lg bg-[#020b08]/80">
        <div className="flex items-center gap-2 font-black px-2 text-emerald-100/70"><ShieldCheck size={14} className="text-emerald-500" /><p className="text-[10px] uppercase tracking-tight font-bold">{STICKY_TEXT}</p></div>
        <button onClick={() => setShowSOS(true)} className="px-4 py-1.5 bg-red-600/20 text-red-500 border border-red-500/50 text-[10px] font-black rounded-lg shadow-sm active:scale-95 transition-all animate-pulse hover:bg-red-600 hover:text-white">SOS</button>
      </div>
      <header className="fixed top-[48px] left-0 right-0 p-4 flex justify-between items-center z-[350]">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('home'); setActiveHall(null); }}>
          <div className="p-2.5 bg-[#065F46] rounded-2xl shadow-[0_0_20px_rgba(6,95,70,0.5)] border border-white/10 group-hover:rotate-6 transition-transform duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div><Shield className="text-white relative z-10" size={22} />
          </div>
          <div><h1 className="font-black text-xl tracking-tighter uppercase leading-none bg-gradient-to-r from-emerald-100 via-white to-emerald-200 bg-clip-text text-transparent drop-shadow-sm">ASHOKAMANAS<sup className="text-[8px] ml-0.5 text-emerald-500">TM</sup></h1></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="px-3 py-1.5 border border-white/10 text-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-sm bg-white/5 hover:bg-white/10">{lang === 'en' ? 'తెలుగు' : 'EN'}</button>
        </div>
      </header>
      <main className={`max-w-4xl mx-auto px-5 pb-40 relative z-10 animate-in fade-in duration-700 ${globalAlert ? 'pt-[160px]' : 'pt-[130px]'}`}>
        {!activeHall && (<div className="mb-8 relative group"><Search className="absolute left-6 top-1/2 -translate-y-1/2 size={16} text-emerald-500/50" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={lang === 'en' ? "Search..." : "వెతకండి..."} className="w-full p-4 pl-12 backdrop-blur-xl rounded-[30px] border outline-none font-medium text-sm transition-all shadow-inner bg-white/5 border-white/10 text-emerald-100 focus:border-emerald-500/50"/></div>)}
        {view === 'home' && !activeHall && <HomeHub setHall={setActiveHall} setView={setView} lang={lang} query={searchQuery} openMitra={() => setShowMitra(true)} userData={userData} notify={showNotify} />}
        {activeHall && <HallView hall={activeHall} onBack={() => setActiveHall(null)} userData={userData} user={user} lang={lang} query={searchQuery} setView={setView} setUserData={setUserData} notify={showNotify} />}
        {view === 'lab' && <LabView />}
        {view === 'games' && <GamesView />}
        {view === 'legal' && <LegalView lang={lang} docs={legalDocs} policyLink={policyLink} manualLink={manualLink} />}
        {view === 'profile' && <ProfileView userData={userData} setView={setView} user={user} lang={lang} setUserData={setUserData} treasury={treasury} notify={showNotify} setWhispers={setWhispers} />}
        {view === 'admin' && <AdminView cards={masterCards} setCards={setMasterCards} docs={legalDocs} setDocs={setLegalDocs} config={mitraConfig} setConfig={setMitraConfig} treasury={treasury} setTreasury={setTreasury} users={userList} setUsers={setUserList} notify={showNotify} alert={globalAlert} setAlert={setGlobalAlert} whispers={whispers} setPolicyLink={setPolicyLink} policyLink={policyLink} setManualLink={setManualLink} manualLink={manualLink} setView={setView} paymentRequests={paymentRequests} />}
        {view === 'master-deck' && <WisdomDeck onBack={() => setView('home')} lang={lang} cards={masterCards} userData={userData} setView={setView} notify={showNotify} />}
      </main>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md backdrop-blur-xl border p-2 flex justify-around rounded-[40px] z-[500] shadow-2xl bg-[#020604]/80 border-white/10">
        <NavBtn icon={Home} active={view === 'home'} onClick={() => { setView('home'); setActiveHall(null); }} />
        <NavBtn icon={Flame} active={view === 'lab'} onClick={() => { setView('lab'); setActiveHall(null); }} />
        <NavBtn icon={Zap} active={view === 'games'} onClick={() => { setView('games'); setActiveHall(null); }} />
        <NavBtn icon={User} active={view === 'profile'} onClick={() => { setView('profile'); setActiveHall(null); }} />
      </nav>
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      {showMitra && <DeepMitra onBack={() => setShowMitra(false)} persona={mitraConfig.persona} userData={userData} setView={setView} notify={showNotify} />}
      {showMood && <MoodModal onClose={() => setShowMood(false)} notify={showNotify} />}
    </div>
  );
}

// --- NEW COMPONENTS (MOOD & SOS) ---
function MoodModal({ onClose, notify }) {
  const saveMood = (mood) => {
    localStorage.setItem('ashoka_last_mood_date', new Date().toDateString());
    notify(`Mood Logged: ${mood}`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[900] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 text-center animate-in zoom-in">
       <div>
         <h2 className="text-2xl font-black text-emerald-400 mb-6 uppercase">How is your spirit today?</h2>
         <div className="grid grid-cols-1 gap-3 justify-center">
            <button onClick={()=>saveMood('Sunny')} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-4 hover:bg-yellow-500/20">
                <SunIcon className="text-yellow-400" size={24}/> 
                <div className="text-left"><h3 className="font-bold text-yellow-400">Sunny</h3><p className="text-[10px] text-gray-400">I feel bright, energetic, and hopeful.</p></div>
            </button>
            <button onClick={()=>saveMood('Cloudy')} className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-2xl flex items-center gap-4 hover:bg-gray-500/20">
                <Cloud className="text-gray-400" size={24}/> 
                <div className="text-left"><h3 className="font-bold text-gray-400">Cloudy</h3><p className="text-[10px] text-gray-400">I feel okay, but a bit heavy or neutral.</p></div>
            </button>
            <button onClick={()=>saveMood('Rainy')} className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-4 hover:bg-blue-500/20">
                <CloudRain className="text-blue-400" size={24}/> 
                <div className="text-left"><h3 className="font-bold text-blue-400">Rainy</h3><p className="text-[10px] text-gray-400">I feel sad, heavy, or tearful.</p></div>
            </button>
         </div>
         <button onClick={onClose} className="mt-8 text-xs text-gray-500 underline">Skip for now</button>
       </div>
    </div>
  );
}

const SOSModal = ({ onClose }) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isIndia = tz.includes("Calcutta") || tz.includes("Asia/Kolkata");
  const isUS = tz.includes("America");
  const isUK = tz.includes("London");

  const numbers = isIndia ? {police:"100", amb:"108", help:"14416"} 
                : isUS ? {police:"911", amb:"911", help:"988"}
                : isUK ? {police:"999", amb:"999", help:"111"}
                : {police:"112", amb:"112", help:"112"}; 

  const silentSOS = () => {
      const msg = encodeURIComponent("I need help. I am using AshokaManas SOS. Please check on me.");
      window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-[#310404]/98 backdrop-blur-[100px] z-[1000] flex flex-col items-center justify-center p-8 text-white text-center animate-in zoom-in duration-500">
      <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mb-10 animate-pulse shadow-[0_0_60px_rgba(220,38,38,0.6)]"><Siren size={60} className="text-white" /></div>
      <h2 className="text-6xl font-black uppercase mb-2 tracking-tighter">Emergency</h2>
      <p className="text-xs uppercase tracking-widest text-red-400 mb-8 font-bold">Detected Region: {isIndia ? "India" : "Global"}</p>
      
      <a href={`tel:${numbers.amb}`} className="block w-full py-5 bg-red-600 rounded-[30px] font-black text-2xl shadow-2xl mb-4 border-b-4 border-red-800 active:scale-95 transition-all">CALL AMBULANCE ({numbers.amb})</a>
      <a href={`tel:${numbers.help}`} className="block w-full py-5 bg-blue-600 rounded-[30px] font-black text-xl shadow-2xl border-b-4 border-blue-800 active:scale-95 transition-all">MENTAL HELPLINE ({numbers.help})</a>
      <button onClick={silentSOS} className="block w-full py-5 bg-emerald-600 rounded-[30px] font-black text-xl shadow-2xl border-b-4 border-emerald-800 active:scale-95 transition-all mt-4">SILENT SOS (WHATSAPP)</button>
      
      <button onClick={onClose} className="mt-10 text-gray-500 font-black uppercase tracking-[0.4em] underline decoration-red-900 underline-offset-8 text-[10px] hover:text-white transition-colors">Return to Safety</button>
    </div>
  );
};

// --- GATEVIEW ---
function GateView({ onAccept, lang, setLang, policyLink, manualLink }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="min-h-screen bg-[#020b08] flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-1000 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px]"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="relative mb-8 group cursor-pointer"><div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-110 animate-pulse"></div><h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-400 relative z-10 drop-shadow-sm">ASHOKAMANAS<sup className="text-sm text-emerald-500 ml-1">TM</sup></h1><p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.5em] mt-2">Safe Space • Community</p></div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[35px] p-8 text-left space-y-6 mb-8 max-h-[45vh] overflow-y-auto shadow-2xl relative">
          <div className="space-y-2"><h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 border-b border-red-500/20 pb-1">Disclaimer</h3><p className="text-[11px] text-gray-400 leading-relaxed font-medium">This platform is for Education & Peer Support only. It does NOT establish a Doctor-Patient relationship.</p></div>
          <div className="space-y-2"><h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400 border-b border-orange-500/20 pb-1">Zero Tolerance</h3><p className="text-[11px] text-gray-400 leading-relaxed font-medium">We have Zero Tolerance for abuse, hate speech, bullying, or solicitation. Violations result in immediate permanent exile from the platform.</p></div>
          <div className="space-y-2"><h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 border-b border-blue-500/20 pb-1">Minor Guidance</h3><p className="text-[11px] text-gray-400 leading-relaxed font-medium">Intended for users 18+. Minors must access under Parental Guidance.</p></div>
          <div className="flex gap-4 mt-4">
             {policyLink && <a href={policyLink} target="_blank" className="text-[10px] text-emerald-400 underline">Privacy Policy</a>}
             {manualLink && <a href={manualLink} target="_blank" className="text-[10px] text-emerald-400 underline">User Manual</a>}
          </div>
        </div>
        <div className="space-y-4"><label className="flex items-center justify-center gap-3 p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-emerald-500/20 group"><div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${agreed ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-gray-600'}`}>{agreed && <CheckSquare size={12} className="text-black"/>}</div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-emerald-200">I have read and accept the Protocol</span><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="hidden" /></label><button onClick={() => { SoundEngine.playClick(); onAccept(); }} disabled={!agreed} className={`w-full py-5 rounded-[35px] font-black text-lg shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all uppercase tracking-widest relative overflow-hidden ${agreed ? 'bg-emerald-600 text-white hover:scale-[1.02]' : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}>AGREE & ENTER</button></div>
        <p className="text-[9px] text-white/20 uppercase tracking-widest mt-10">Copyright © AshokaManas™. All rights reserved.</p>
      </div>
    </div>
  );
}

// --- HOME HUB ---
function HomeHub({ setHall, setView, openMitra, userData, notify }) {
  const isPaid = userData?.role === 'patron' || userData?.role === 'doctor';
  const lockedClick = (feature) => { notify(`${feature} requires Contribution.`); setView('profile'); };
  const [pulse, setPulse] = useState(false); const triggerHeart = () => { setPulse(true); SoundEngine.playFreq(60, 'sine', 0.6); setTimeout(()=>setPulse(false), 1000); };
  return (
    <div className="space-y-8 pb-32">
      <div onClick={triggerHeart} className="relative rounded-[60px] bg-gradient-to-br from-[#064E3B] to-[#022c22] p-10 text-center text-white shadow-2xl overflow-hidden cursor-pointer group border border-emerald-500/20 active:scale-95 transition-all duration-500">
        <div className={`absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl transition-transform duration-1000 ${pulse ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} style={{left:'50%', top:'50%', transform:'translate(-50%, -50%)'}}></div><Heart size={48} className="text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)] animate-pulse mx-auto mb-6 relative z-10" fill="currentColor" /><h2 className="text-4xl font-black uppercase tracking-tighter leading-none relative z-10">Sanctuary</h2><p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[0.4em] mt-4 relative z-10">Tap to Breathe</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => {SoundEngine.playClick(); isPaid ? openMitra() : lockedClick("Deep Mitra");}} className="p-6 border rounded-[40px] text-left relative overflow-hidden group transition-all active:scale-95 bg-[#1e1b4b]/40 border-indigo-500/20 hover:border-indigo-500/50">
            {!isPaid && <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm"><Lock className="text-white opacity-80"/></div>}<div className="absolute top-4 right-4 p-2 rounded-full bg-indigo-500/20 text-indigo-300"><Sparkles size={14}/></div><h3 className="text-lg font-black uppercase tracking-tight mt-6 text-indigo-100">Trusted Companion</h3><p className="text-[9px] font-bold uppercase mt-1 tracking-wider text-indigo-400">AI Friend</p>
        </button>
        <button onClick={() => {SoundEngine.playClick(); isPaid ? setView('master-deck') : lockedClick("Wisdom Deck");}} className="p-6 border rounded-[40px] text-left relative overflow-hidden group transition-all active:scale-95 bg-[#451a03]/40 border-amber-500/20 hover:border-amber-500/50">
            {!isPaid && <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm"><Lock className="text-white opacity-80"/></div>}<div className="absolute top-4 right-4 p-2 rounded-full bg-amber-500/20 text-amber-300"><Crown size={14}/></div><h3 className="text-lg font-black uppercase tracking-tight mt-6 text-amber-100">Master Deck</h3><p className="text-[9px] font-bold uppercase mt-1 tracking-wider text-amber-500">Ancient Wisdom</p>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HALLS.map(h => (
          <button key={h.id} onClick={() => {SoundEngine.playClick(); setHall(h);}} className="p-6 rounded-[40px] shadow-lg transition-all text-left flex items-center gap-5 border active:scale-95 bg-white/5 border-white/5 hover:border-emerald-500/30">
            <div className="p-4 rounded-2xl shadow-inner bg-white/10 text-emerald-400"><h.icon size={24} /></div><div><h3 className="font-black text-lg uppercase tracking-tight leading-none text-emerald-50">{h.label}</h3></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- ADMIN / FOUNDER STUDIO ---
function AdminView({ cards, setCards, docs, setDocs, config, setConfig, treasury, setTreasury, users, setUsers, notify, alert, setAlert, whispers, policyLink, setPolicyLink, manualLink, setManualLink, setView, paymentRequests }) {
  const [tab, setTab] = useState('seed');
  const [jsonInput, setJsonInput] = useState("");
  const [newCard, setNewCard] = useState({ title: "", question: "", answer: "", category: "Self" });
  
  const saveToCloud = async (collectionName, docName, data) => { if(!isFirebaseInitialized) { notify("Offline: Saved Locally"); return; } try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', docName), data, { merge: true }); notify("Cloud Sync Active."); } catch(e) { notify("Sync Failed."); } };
  const depositSeeds = () => { try { const data = JSON.parse(jsonInput); if(Array.isArray(data)) { setCards(prev => [...prev, ...data]); saveToCloud('config', 'master_deck', { cards: [...cards, ...data] }); notify("Seeds Planted."); setJsonInput(""); } } catch(e) { notify("Invalid JSON"); } };
  const updateLegal = (index, field, value) => { const newDocs = [...docs]; newDocs[index][field] = value; setDocs(newDocs); };
  const exileUser = (uid) => { setUsers(users.map(u => u.uid === uid ? {...u, status:'banned'} : u)); notify("User Exiled"); };
  const saveLaw = () => saveToCloud('config', 'global_settings', { legal: docs, policy: policyLink, manual: manualLink });
  const saveBrain = () => saveToCloud('config', 'global_settings', { persona: config.persona, ai_key: config.key });
  const saveTreasury = () => saveToCloud('config', 'global_settings', { treasury: treasury });
  const saveAlert = () => saveToCloud('config', 'global_settings', { alert: alert });
  
  // BANK ACTIONS
  const approvePayment = async (req) => {
      if(isFirebaseInitialized) {
          // 1. Upgrade User
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', req.uid), { role: 'patron' });
          // 2. Mark Request Done
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payment_requests', req.id));
          notify("User Upgraded to Patron");
      }
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black uppercase text-white">Founder Studio</h2><button onClick={()=>setView('home')}><X className="text-white"/></button></div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{['seed', 'law', 'brain', 'treasury', 'bank', 'sentinel', 'editor'].map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${tab === t ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400'}`}>{t}</button>))}</div>
      {tab === 'seed' && ( <div className="space-y-8"><textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className="w-full h-80 border rounded-xl p-6 text-emerald-500 text-sm font-mono leading-relaxed bg-[#0a0a0a] border-white/10" placeholder='Paste JSON Array here...' /><button onClick={depositSeeds} className="w-full py-5 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-emerald-900/40">Execute Deposit</button></div> )}
      {tab === 'law' && ( <div className="space-y-6">{docs.map((d, i) => (<div key={i} className="p-4 rounded-xl border space-y-2 bg-[#111] border-white/10"><input value={d.t} onChange={e => updateLegal(i, 't', e.target.value)} className="w-full bg-transparent font-bold mb-2 outline-none text-white" /><textarea value={d.m} onChange={e => updateLegal(i, 'm', e.target.value)} className="w-full bg-transparent text-xs h-20 outline-none resize-none opacity-70 text-white" /></div>))}<input value={policyLink} onChange={e=>setPolicyLink(e.target.value)} placeholder="Privacy Policy URL" className="w-full p-4 rounded-xl bg-[#111] border border-white/10 text-white text-xs"/><input value={manualLink} onChange={e=>setManualLink(e.target.value)} placeholder="User Manual URL" className="w-full p-4 rounded-xl bg-[#111] border border-white/10 text-white text-xs"/><button onClick={saveLaw} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg">Update Constitution</button></div> )}
      {tab === 'brain' && ( <div className="space-y-4"><input value={config.key} onChange={e => setConfig({...config, key: e.target.value})} className="w-full p-4 rounded-xl text-xs font-mono border outline-none bg-black border-indigo-500/30 text-white" placeholder="API Key" /><textarea value={config.persona} onChange={e => setConfig({...config, persona: e.target.value})} className="w-full h-40 p-4 rounded-xl text-xs font-mono border outline-none bg-black border-indigo-500/30 text-indigo-300" /><button onClick={saveBrain} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg">Save Brain</button></div> )}
      {tab === 'treasury' && ( <div className="space-y-6"><input value={treasury.india} onChange={e=>setTreasury({...treasury, india:e.target.value})} placeholder="Razorpay Link" className="w-full p-4 rounded-xl border outline-none text-xs bg-black border-white/10 text-white" /><input value={treasury.global} onChange={e=>setTreasury({...treasury, global:e.target.value})} placeholder="Global Link" className="w-full p-4 rounded-xl border outline-none text-xs bg-black border-white/10 text-white" /><button onClick={saveTreasury} className="w-full py-3 bg-amber-600 text-black rounded-xl font-bold uppercase text-xs">Save Treasury</button></div> )}
      
      {/* THE BANK */}
      {tab === 'bank' && (
         <div className="space-y-4">
             <h3 className="text-xs uppercase font-bold text-amber-500">Pending Approvals</h3>
             {(!paymentRequests || paymentRequests.length === 0) && <p className="text-center text-xs opacity-50">No pending requests.</p>}
             {paymentRequests?.map((req) => (
                 <div key={req.id} className="p-4 rounded-xl border border-amber-500/30 bg-[#1a1400] flex justify-between items-center">
                     <div>
                         <p className="text-xs font-mono text-amber-200">ID: {req.paymentId}</p>
                         <p className="text-[9px] text-gray-500">User: {req.uid.substring(0,8)}...</p>
                     </div>
                     <button onClick={()=>approvePayment(req)} className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase">Approve</button>
                 </div>
             ))}
         </div>
      )}
      
      {tab === 'sentinel' && ( <div className="space-y-4"><h3 className="text-xs uppercase font-bold text-red-500">Global Alert</h3><input value={alert} onChange={e=>setAlert(e.target.value)} className="w-full p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-200 text-xs" placeholder="Broadcast Message..."/><button onClick={saveAlert} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg mt-2">Broadcast</button><h3 className="text-xs uppercase font-bold text-blue-500 mt-6">Whispers (Feedback)</h3><div className="h-40 overflow-y-auto space-y-2 border border-white/10 rounded-xl p-2">{(whispers||[]).map((w,i)=><div key={i} className="p-3 bg-white/5 rounded-lg text-xs text-gray-400">{w.text}</div>)}{(!whispers || whispers.length===0) && <p className="text-center text-xs opacity-50">No whispers.</p>}</div><h3 className="text-xs uppercase font-bold text-emerald-500 mt-6">User Management</h3><div className="h-40 overflow-y-auto space-y-2 border border-white/10 rounded-xl p-2">{users.map((u, i) => (<div key={i} className="p-4 rounded-xl border flex justify-between items-center bg-[#111] border-white/10"><span className="text-xs font-mono text-white">{u.uid} <span className={u.status==='active'?'text-green-500':'text-red-500'}>({u.status})</span></span>{u.status === 'active' && <button onClick={() => exileUser(u.uid)} className="px-3 py-1 bg-red-600 text-white rounded text-[10px] font-bold uppercase">Exile</button>}</div>))}</div></div> )}
      {tab === 'editor' && ( <div className="space-y-6"><input value={newCard.title} onChange={e=>setNewCard({...newCard, title:e.target.value})} placeholder="Title" className="w-full border p-5 rounded-xl text-lg bg-[#111] border-white/10" /><input value={newCard.question} onChange={e=>setNewCard({...newCard, question:e.target.value})} placeholder="Question" className="w-full border p-5 rounded-xl text-lg bg-[#111] border-white/10" /><textarea value={newCard.answer} onChange={e=>setNewCard({...newCard, answer:e.target.value})} placeholder="Answer" className="w-full border p-5 rounded-xl h-32 text-sm bg-[#111] border-white/10" /><textarea value={newCard.awarenessLogic} onChange={e=>setNewCard({...newCard, awarenessLogic:e.target.value})} placeholder="Logic" className="w-full border p-5 rounded-xl h-32 text-sm bg-[#111] border-white/10" /><button onClick={()=>{setCards(prev => [...prev, { id: Date.now(), ...newCard }]); notify("Card Added.");}} className="w-full py-5 bg-white text-black rounded-xl font-black uppercase text-sm tracking-widest border border-gray-300">PUBLISH CARD</button></div> )}
    </div>
  );
}

// --- PROFILE & SUSTENANCE ---
function ProfileView({ userData, setView, user, lang, setUserData, treasury, notify, setWhispers }) {
  const [agreed, setAgreed] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [key, setKey] = useState("");
  const [whisper, setWhisper] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const verify = () => { if (key === DOCTOR_KEY) { setUserData(p => ({...p, role: 'doctor'})); localStorage.setItem('ashoka_role', 'doctor'); notify("Verified."); setKey(""); } else { notify("Invalid"); } };
  const handleAdmin = () => { if (key === ADMIN_KEY) { setView('admin'); setKey(""); } else { notify("Invalid Admin Key"); } };
  const sendWhisper = async () => { if(!whisper.trim()) return; notify("Sent to Founder"); setWhispers(p=>[...p,{text:whisper, date:Date.now()}]); if(isFirebaseInitialized) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'whispers'), { text: whisper, createdAt: serverTimestamp(), uid: user.uid }); setWhisper(""); };
  const deleteAccount = async () => { if (confirm("⚠️ WARNING: Wipe identity?")) { if (auth) await signOut(auth); localStorage.clear(); window.location.reload(); } };
  const copyID = () => { navigator.clipboard.writeText(user?.uid); notify("Soul ID Copied"); };
  
  // MANUAL MAGIC: Send Request to Founder
  const submitPaymentRequest = async () => {
      if(paymentId.length < 5) { notify("Invalid ID"); return; }
      notify("Verifying with Founder...");
      if(isFirebaseInitialized) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'payment_requests'), {
              uid: user.uid,
              paymentId: paymentId,
              createdAt: serverTimestamp()
          });
          notify("Request Sent! Wait for Approval.");
          setShowPay(false);
      } else {
          notify("Offline: Cannot Verify.");
      }
  };

  const sustText = {
    en: "We are a community-supported space designed for clarity and peace. AshokaManas was built to help you navigate daily stress through self-awareness and proven techniques. We focus on education and peer support.\n\nWhat This Unlocks:\n1. Master Wisdom Deck\n2. Trusted Companion AI\n3. Wellness Tools\n\nYour Contribution:\nThis platform is ad-free and privacy-focused. Your one-time contribution supports the ongoing maintenance, research, and technical costs to keep this space open and secure for years to come.",
    te: "ఇది మనశ్శాంతి కోసం మరియు స్పష్టత కోసం రూపొందించిన వేదిక. రోజువారీ ఒత్తిడిని అర్థం చేసుకోవడానికి మరియు వాటిని దాటడానికి అవసరమైన 'అవగాహన' (Awareness) కల్పించడమే మా లక్ష్యం.\n\nమీకు లభించేవి:\n1. మాస్టర్ విస్డమ్ డెక్\n2. విశ్వసనీయ మిత్ర (AI)\n3. వెల్నెస్ టూల్స్\n\nమీ సహకారం:\nఈ వేదికలో ఎలాంటి ప్రకటనలు (Ads) ఉండవు. మీ ఈ సహకారం, రాబోయే సంవత్సరాల్లో ఈ ప్లాట్‌ఫామ్‌ను నడపడానికి ఉపయోగపడుతుంది."
  };
  
  const refundText = {
    en: "A Note on Refunds:\nBecause AshokaManas is a digital sanctuary, we unlock our entire library of Wisdom, Tools, and AI support for you the moment you join. Since these resources are digital and cannot be 'returned' once seen, this contribution is final and non-refundable.",
    te: "రీఫండ్ పాలసీ (ముఖ్య గమనిక):\nఅశోకమనస్ ఒక డిజిటల్ వేదిక. మీరు చేరగానే మా విజ్ఞానం, టూల్స్ మరియు AI సేవలు అన్నీ మీకు వెంటనే అందుబాటులోకి వస్తాయి. ఒకసారి చూసిన సమాచారాన్ని వెనక్కి ఇవ్వలేము కాబట్టి, ఈ రుసుము వెనక్కి ఇవ్వబడదు (Non-Refundable)."
  };

  return (
    <div className="pb-24 space-y-8">
      <div className="bg-emerald-800 p-8 rounded-[40px] text-center text-white">
        <User size={48} className="mx-auto mb-2"/>
        <h2 className="text-2xl font-black uppercase">{userData.role === 'guest' ? 'Member' : userData.role}</h2>
        <button onClick={copyID} className="mt-4 flex items-center justify-center gap-2 bg-black/20 px-4 py-2 rounded-full text-[10px] font-mono hover:bg-black/40"><Copy size={12}/> ID: {user?.uid?.substring(0,8)}...</button>
      </div>

      <div className="p-6 rounded-[40px] border bg-amber-900/10 border-amber-500/20">
        <div className="flex items-center gap-3 mb-4"><Crown className="text-amber-500"/><h3 className="font-black uppercase text-amber-100">{lang==='en'?"Support Mission":"మద్దతు ఇవ్వండి"}</h3></div>
        {!showPay ? (
          <button onClick={() => setShowPay(true)} className="w-full py-3 bg-amber-600 text-black rounded-xl font-bold uppercase text-xs">Open Contribution</button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl h-40 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap bg-black/20 text-amber-100/80">
               {lang==='en' ? sustText.en : sustText.te}
               <br/><br/>
               <span className="text-red-300 font-bold">{lang==='en' ? refundText.en : refundText.te}</span>
            </div>
            <label className="flex gap-2 items-center text-xs font-bold text-amber-200"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}/> I Accept Non-Refundable Policy</label>
            <div className="grid gap-2">
              <a href={treasury.india || "#"} target="_blank" className={`block text-center w-full py-3 rounded-xl font-bold text-xs border ${agreed ? 'bg-amber-600 text-black' : 'opacity-50 cursor-not-allowed border-white/10'}`}>India (Google Pay / Razorpay)</a>
              <a href={treasury.global || "#"} target="_blank" className={`block text-center w-full py-3 rounded-xl font-bold text-xs border ${agreed ? 'bg-transparent text-amber-500 border-amber-500' : 'opacity-50 cursor-not-allowed border-white/10'}`}>Global (PayPal/Stripe)</a>
            </div>
            {/* MANUAL MAGIC BOX */}
            <div className="pt-4 border-t border-white/10 mt-4">
                <p className="text-[10px] text-gray-400 mb-2">Already Paid? Paste Transaction ID:</p>
                <div className="flex gap-2">
                    <input value={paymentId} onChange={e=>setPaymentId(e.target.value)} placeholder="e.g. pay_M8s..." className="flex-1 p-3 rounded-xl bg-black/30 text-white text-xs outline-none border border-white/10"/>
                    <button onClick={submitPaymentRequest} className="px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold">Verify</button>
                </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 rounded-[40px] border bg-white/5 border-white/5">
        <h3 className="font-bold uppercase text-xs mb-4 opacity-50 text-white">Restore / Admin</h3>
        <div className="flex gap-2 mb-4">
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="Key" className="flex-1 p-3 rounded-xl text-center font-bold text-xs outline-none bg-black/30 text-white" />
          <button onClick={verify} className="px-4 bg-emerald-800 text-white rounded-xl text-xs font-bold">Verify</button>
        </div>
        <p className="text-[9px] mb-4 text-center text-gray-500">Lost your device? Enter Access Key to Restore.</p>
        <button onClick={() => { if(key === ADMIN_KEY) setView('admin'); else notify("Admin Key Required"); }} className="w-full py-3 bg-indigo-900 text-white rounded-xl font-bold text-xs uppercase">Founder Console</button>
      </div>
      
      <div className="p-6 rounded-[40px] border bg-white/5 border-white/5">
        <h3 className="font-bold uppercase text-xs mb-4 opacity-50 text-white">Whisper to Founder</h3>
        <div className="flex gap-2">
          <input value={whisper} onChange={e => setWhisper(e.target.value)} placeholder="Private Feedback..." className="flex-1 p-3 rounded-xl text-xs outline-none bg-black/30 text-white" />
          <button onClick={sendWhisper} className="px-4 bg-white/10 text-white rounded-xl"><Send size={14}/></button>
        </div>
      </div>

      <div className="text-center">
         <button onClick={deleteAccount} className="text-red-500 text-xs font-bold uppercase underline">Delete Identity</button>
      </div>
    </div>
  );
}

// --- DEEP MITRA AI (REPLACED AS REQUESTED) ---
function DeepMitra({ onBack, persona, userData, setView, notify }) {
  const [msgs, setMsgs] = useState([{role: 'bot', text: "Namaste. I am your Trusted Companion. Listening."}]);
  const [txt, setTxt] = useState("");
  
  if (userData?.role === 'guest') { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white p-8 text-center"><div className="space-y-4"><Lock size={40} className="mx-auto text-indigo-500"/><h2 className="text-xl font-bold">Patron Companion</h2><p className="text-xs opacity-60">Deep Mitra requires support contribution.</p><button onClick={()=>{onBack(); setView('profile'); notify("Check Profile");}} className="px-6 py-2 bg-indigo-600 rounded-full text-xs font-bold">Unlock</button><button onClick={onBack} className="block w-full mt-4 text-xs opacity-50">Back</button></div></div>; }

  const reply = async () => {
    if(!txt.trim()) return;
    setMsgs(p => [...p, {role: 'user', text: txt}]);
    setTxt(""); // Added for UI cleanup
    
    // MEDICAL FILTER
    if (txt.toLowerCase().includes("diagnos") || txt.toLowerCase().includes("medic")) {
        setTimeout(() => setMsgs(p => [...p, {role: 'bot', text: "I am a wise friend, not a doctor. I cannot provide medical diagnosis."}]), 500);
        return;
    }

    // EXTENSION WIRING: Write to 'ai_chats' collection
    if (isFirebaseInitialized) {
        try {
            const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ai_chats'), {
                prompt: txt,
                persona: persona, 
                createdAt: serverTimestamp()
            });
            // LISTEN FOR RESPONSE
            const unsub = onSnapshot(docRef, (snap) => {
                if (snap.exists() && snap.data().response) {
                    setMsgs(p => [...p, {role: 'bot', text: snap.data().response}]);
                    unsub(); // Stop listening once answered
                }
            });
            setTimeout(() => setMsgs(p => [...p, {role: 'bot', text: "Reflecting..."}]), 1000);
        } catch(e) {
            setTimeout(() => setMsgs(p => [...p, {role: 'bot', text: "Connection weak. I am listening locally."}]), 500);
        }
    } else {
        setTimeout(() => setMsgs(p => [...p, {role: 'bot', text: "I hear you. Tell me more."}]), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-10 bg-[#020617]/95">
      <div className="p-4 border-b flex justify-between items-center bg-black/20 border-white/10">
        <div className="flex items-center gap-3"><div className="p-2 bg-indigo-600 rounded-lg"><BrainCircuit size={18} className="text-white"/></div><div><h3 className="text-sm font-black uppercase tracking-wider text-white">Trusted Companion</h3><p className="text-[9px] text-indigo-400">Safe Space AI</p></div></div>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10"><X size={18} className="text-gray-400"/></button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`p-4 rounded-2xl max-w-[80%] text-sm font-medium ${m.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-white/10 text-gray-200'}`}>{m.text}</div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2 bg-black/40 border-white/10">
        <input value={txt} onChange={e => setTxt(e.target.value)} className="flex-1 p-3 rounded-xl outline-none bg-white/10 text-white border-white/5" placeholder="Type..." />
        <button onClick={reply} className="p-3 bg-indigo-600 text-white rounded-xl"><Send size={18}/></button>
      </div>
    </div>
  );
}

// --- UPDATED WISDOM DECK (Q&A + CATEGORIES) ---
function WisdomDeck({ onBack, lang, cards, userData, setView, notify }) {
  const [exp, setExp] = useState(null);
  const [filter, setFilter] = useState("All");

  // UNLOCK FOR PATRON OR DOCTOR
  const isUnlocked = userData?.role === 'patron' || userData?.role === 'doctor';
  
  if (!isUnlocked) { 
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white p-8 text-center">
        <div className="space-y-4">
          <Lock size={40} className="mx-auto text-amber-500"/>
          <h2 className="text-xl font-bold">Ancient Wisdom</h2>
          <p className="text-xs opacity-60">Master Deck requires support contribution.</p>
          <button onClick={()=>{onBack(); setView('profile'); notify("Check Profile");}} className="px-6 py-2 bg-amber-600 rounded-full text-xs font-bold text-black">Unlock</button>
          <button onClick={onBack} className="block w-full mt-4 text-xs opacity-50">Back</button>
        </div>
      </div>
    ); 
  }

  // Filter Logic (Safely handles missing categories)
  const filteredCards = filter === 'All' 
    ? cards 
    : cards.filter(c => c.category === filter);
  
  return (
    <div className="min-h-screen p-4 bg-black text-amber-50">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black uppercase">Master Deck</h2>
        <button onClick={onBack}><X/></button>
      </div>

      {/* Category Filter Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
         {['All', 'Self', 'Mind', 'Life', 'Crisis', 'Relationships'].map(f => (
           <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all ${filter===f ? 'bg-amber-500 text-black border-amber-500' : 'border-amber-900 text-amber-700 bg-transparent'}`}>
             {f}
           </button>
         ))}
      </div>

      <div className="space-y-6">
        {filteredCards.map(c => (
           <div key={c.id} className="p-6 rounded-[30px] border bg-[#1c1204] border-amber-900/30 transition-all hover:border-amber-500/30">
             {/* Title */}
             <h3 className="text-lg font-black uppercase mb-4 text-amber-100 tracking-tight">{c.title}</h3>
             
             {/* Question / Hurdle (Bold) */}
             <p className="text-sm font-bold text-amber-50 mb-2 leading-relaxed">
               {c.question || c.hurdle}
             </p>

             {/* Expanded Content */}
             {exp === c.id ? (
               <div className="space-y-4 pt-4 border-t border-amber-500/20 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2">
                 
                 {/* The Answer */}
                 {c.answer && <p className="text-amber-200/90 italic mb-4 border-l-2 border-amber-500/50 pl-3">{c.answer}</p>}
                 
                 {/* Details */}
                 {c.ancestralRoot && <p><strong className="text-amber-500 text-xs uppercase block mb-1 tracking-widest">Ancestral Root</strong> {c.ancestralRoot}</p>}
                 {c.awarenessLogic && <p><strong className="text-amber-500 text-xs uppercase block mb-1 tracking-widest">Forensic Logic</strong> {c.awarenessLogic}</p>}
                 
                 {/* Action Box */}
                 <div className="p-4 bg-amber-900/20 rounded-xl border border-amber-500/10 mt-4">
                     <strong className="text-amber-500 text-xs uppercase block mb-1 tracking-widest flex items-center gap-2"><Flame size={12}/> Action</strong> 
                     {c.action}
                 </div>

                 <button onClick={() => setExp(null)} className="text-xs opacity-50 uppercase w-full text-center mt-6 py-2">Close Card</button>
               </div>
             ) : ( 
               <button onClick={() => setExp(c.id)} className="w-full py-3 bg-amber-700/20 text-amber-500 font-bold uppercase text-xs rounded-xl mt-4 hover:bg-amber-700/30 transition-colors">
                 Read Answer
               </button> 
             )}
           </div>
        ))}
        {filteredCards.length === 0 && <p className="text-center text-xs opacity-50 mt-10">No wisdom found in this category yet.</p>}
      </div>
    </div>
  );
}

// --- RESTORED TOOLS & GAMES (Persistent Chat Logic + Actions) ---
function HallView({ hall, onBack, userData, user, lang, query, setView, setUserData, notify }) {
  const [posts, setPosts] = useState(() => {
     const saved = localStorage.getItem(`chat_${hall.id}`);
     return saved ? JSON.parse(saved) : [];
  }); 
  const [msg, setMsg] = useState(""); const [replyTo, setReplyTo] = useState(null);
  
  useEffect(() => { 
    if (hall.expertOnly && userData?.role !== 'doctor') return; 
    if (!isFirebaseInitialized) return; 
    const qPosts = collection(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages'); 
    return onSnapshot(qPosts, (snap) => {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt - a.createdAt);
        setPosts(fetched);
        localStorage.setItem(`chat_${hall.id}`, JSON.stringify(fetched));
    }); 
  }, [hall, userData]);

  const send = async () => { 
    if (!msg.trim()) return; 
    // Phone/Email Regex Block
    if (/[0-9]{10}/.test(msg) || /\S+@\S+\.\S+/.test(msg)) { notify("Safety Block: Personal Contacts not allowed."); return; }
    // Abuse Dictionary
    const forbidden = ["kill", "die", "suicide", "hate", "stupid", "idiot", "abuse", "scam"];
    if (forbidden.some(w => msg.toLowerCase().includes(w))) { notify("Safety Block: Harmful language detected."); return; }

    const textToSend = replyTo ? `[Replying to: "${replyTo.text.substring(0, 20)}..."]\n${msg}` : msg; 
    const currentUid = user?.uid || "guest_" + Date.now();
    const tempId = "temp_" + Date.now();
    const tempPost = { id: tempId, text: textToSend, uid: currentUid, createdAt: { seconds: Date.now()/1000 }, likes: 0 };
    
    setPosts(prev => [tempPost, ...prev]);
    localStorage.setItem(`chat_${hall.id}`, JSON.stringify([tempPost, ...posts])); 
    
    setMsg(""); setReplyTo(null); SoundEngine.playClick();
    if (isFirebaseInitialized && user) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages'), { uid: user.uid, text: textToSend, createdAt: serverTimestamp(), reported: false, likes: 0, pinned: false }); 
    }
  };
  
  const handleLike = (id, currentLikes) => { 
    // Immediate Visual Feedback
    setPosts(posts.map(p => p.id === id ? {...p, likes: (p.likes || 0) + 1} : p));
    if(isFirebaseInitialized && !id.startsWith("temp")) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', id), { likes: (currentLikes || 0) + 1 }); 
    SoundEngine.playClick(); 
  };

  const handleFlag = (id) => { if(isFirebaseInitialized && !id.startsWith("temp")) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', id), { reported: true }); notify("Reported"); };
  const handleDelete = (id) => { 
      // ZOMBIE KILLER LOGIC: Remove from State AND LocalStorage immediately
      const newPosts = posts.filter(p => p.id !== id);
      setPosts(newPosts);
      localStorage.setItem(`chat_${hall.id}`, JSON.stringify(newPosts));
      notify("Deleted");
      if(isFirebaseInitialized && !id.startsWith("temp")) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', id)); 
  };
  const handlePin = (id, currentPin) => {
      setPosts(posts.map(p => p.id === id ? {...p, pinned: !p.pinned} : p));
      if(userData?.role === 'doctor' && isFirebaseInitialized && !id.startsWith("temp")) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', id), { pinned: !currentPin });
      notify(currentPin ? "Unpinned" : "Pinned");
  };
  
  if (hall.expertOnly && userData?.role !== 'doctor') return <ExpertGate setView={setView} onBack={onBack} setUserData={setUserData} />;
  
  return (
    <div className="pb-24 space-y-4">
      <button onClick={onBack} className="opacity-50 text-xs font-bold uppercase flex gap-2 text-white"><ArrowLeft size={14}/> Back</button>
      <div className="p-8 bg-emerald-900 rounded-[40px] text-white">
        <h2 className="text-2xl font-black uppercase mb-2">{hall.label}</h2>
        <p className="text-sm opacity-80">{WELCOME_MESSAGES[hall.id]?.en}</p>
      </div>
      
      <div className="p-4 rounded-[30px] border bg-white/5 border-white/5">
        {replyTo && <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded mb-2"><span className="text-[10px] opacity-70">Replying to: {replyTo.text.substring(0,15)}...</span><button onClick={()=>setReplyTo(null)}><X size={12}/></button></div>}
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Share..." className="w-full bg-transparent border-none outline-none resize-none h-20 text-sm font-medium text-white" />
        <div className="flex justify-end mt-2"><button onClick={send} className="p-3 bg-emerald-600 rounded-full text-white"><Send size={18}/></button></div>
      </div>
      
      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className={`p-6 rounded-[35px] border bg-white/5 border-white/5 ${p.pinned ? 'border-l-4 border-l-emerald-500' : ''}`}>
            <p className="text-sm font-medium text-gray-200 whitespace-pre-wrap">{p.text}</p>
            <div className="flex gap-4 mt-4 opacity-50 text-white items-center">
              <button onClick={()=>handleLike(p.id, p.likes)} className="flex items-center gap-1 text-[10px] hover:text-emerald-400"><Heart size={12} className={p.likes > 0 ? "fill-white" : ""}/> {p.likes||0}</button>
              <button onClick={()=>{setReplyTo(p); window.scrollTo({top:0, behavior:'smooth'});}} className="text-[10px] hover:text-blue-400"><Reply size={12}/></button>
              <button onClick={()=>handleFlag(p.id)} className="text-[10px] hover:text-red-400"><Flag size={12}/></button>
              {/* Delete logic: Allow if user is author OR user is Doctor (Expert) */}
              {(p.uid === user?.uid || p.uid.startsWith("guest") || userData?.role === 'doctor') && <button onClick={()=>handleDelete(p.id)} className="text-[10px] hover:text-red-500"><Trash2 size={12}/></button>}
              {userData?.role === 'doctor' && <button onClick={()=>handlePin(p.id, p.pinned)} className="text-[10px] hover:text-amber-400"><Pin size={12}/></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegalView({ docs, policyLink, manualLink }) { return <div className="space-y-4 pb-20"><h2 className="text-2xl font-black uppercase text-center text-white">Legal Guide</h2>{docs.map((d,i)=><div key={i} className="p-6 rounded-[30px] border bg-white/5 border-white/10"><h3 className="font-bold text-xs mb-2 opacity-70 text-white">{d.t}</h3><p className="text-xs opacity-60 leading-relaxed text-white">{d.m}</p></div>)} {policyLink && <a href={policyLink} target="_blank" className="block text-center text-xs text-emerald-500 underline mt-6">Full Privacy Policy</a>} {manualLink && <a href={manualLink} target="_blank" className="block text-center text-xs text-emerald-500 underline mt-4">User Manual</a>}</div>; }
function LabView() { const [a, s] = useState(null); if(a==='b')return <BurnVault onBack={()=>s(null)}/>; if(a==='p')return <PranaBreath onBack={()=>s(null)}/>; if(a==='pa')return <Panchabhoota onBack={()=>s(null)}/>; return <div className="space-y-6 animate-in fade-in"><h2 className="text-3xl font-black text-center text-emerald-100 uppercase tracking-tight mb-8">Healing Lab</h2><StationCard icon={Flame} title="Burn Vault" te="బర్న్ వాల్ట్" onClick={()=>s('b')} color="bg-orange-900/20 border-orange-500/30"/><StationCard icon={Wind} title="Breath" te="ప్రాణ" onClick={()=>s('p')} color="bg-blue-900/20 border-blue-500/30"/><StationCard icon={Sparkles} title="Pancha" te="పంచ" onClick={()=>s('pa')} color="bg-emerald-900/20 border-emerald-500/30"/></div>; }
function GamesView() { const [a, s] = useState(null); if(a==='s')return <SnakeGame onBack={()=>s(null)}/>; if(a==='m')return <MandalaArt onBack={()=>s(null)}/>; if(a==='b')return <BubblePop onBack={()=>s(null)}/>; return <div className="space-y-6 animate-in fade-in"><h2 className="text-3xl font-black text-center text-emerald-100 uppercase tracking-tight mb-8">Mind Games</h2><GameBtn icon={Flame} title="Snake" desc="Nature" onClick={()=>s('s')} color="bg-emerald-900/20 border-emerald-500/30"/><GameBtn icon={Brush} title="Mandala" desc="Art" onClick={()=>s('m')} color="bg-purple-900/20 border-purple-500/30"/><GameBtn icon={Zap} title="Bubbles" desc="Pop" onClick={()=>s('b')} color="bg-blue-900/20 border-blue-500/30"/></div>; }
function NavBtn({ icon: Icon, active, onClick }) { return <button onClick={onClick} className={`p-4 rounded-[30px] transition-all duration-500 ${active ? 'bg-emerald-500 text-[#022c22] shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'text-emerald-500/30 hover:bg-white/5 hover:text-emerald-400'}`}><Icon size={24} /></button>; }
function StationCard({ icon: Icon, title, te, onClick, color }) { return <button onClick={onClick} className={`p-8 border rounded-[50px] flex items-center gap-6 w-full text-left shadow-sm active:scale-95 transition-all group bg-white/5 border-white/10`}><Icon size={32} className="text-white/80 group-hover:scale-110 transition-transform"/><div><h3 className="text-xl font-black uppercase text-white">{title}</h3><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{te}</p></div></button>; }
function GameBtn({ icon: Icon, title, desc, onClick, color }) { return <button onClick={onClick} className={`p-8 ${color} border rounded-[50px] flex items-center gap-6 w-full text-left shadow-sm active:scale-95 transition-all group bg-white/5 border-white/10`}><Icon size={32} className="text-white/80 group-hover:scale-110 transition-transform"/><div><h3 className="text-xl font-black uppercase text-white">{title}</h3><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{desc}</p></div></button>; }
function BurnVault({ onBack }) { const [t,T]=useState(""); const [b,B]=useState(false); return <div className="p-10 rounded-[60px] text-center min-h-[400px] flex flex-col justify-center border bg-black border-orange-900/30"><button onClick={onBack} className="text-gray-500 mb-10 text-[10px] uppercase font-bold tracking-widest">Back</button>{!b ? ( <><div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Flame className="text-orange-500" size={40} /></div><textarea value={t} onChange={e => T(e.target.value)} className="p-6 rounded-[30px] w-full h-40 mb-6 border outline-none resize-none font-medium bg-[#111] text-white border-white/10" placeholder="Write it down..." /><button onClick={() => { SoundEngine.playBurn(); B(true); setTimeout(() => { B(false); T(""); }, 2000); }} className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-[30px] w-full font-black uppercase text-xs tracking-widest shadow-lg active:scale-95">Burn to Ash</button></> ) : <div className="text-8xl animate-bounce">🔥</div>}</div>; }
function PranaBreath({ onBack }) { const [s, S] = useState(1); const [t, T] = useState("Ready"); const [c, C] = useState(0); const start = () => { T("Inhale"); S(1.5); let i = 1; const timer = setInterval(() => { C(i++); if (i > 4) { clearInterval(timer); T("Hold"); i = 1; const hTimer = setInterval(() => { C(i++); if (i > 7) { clearInterval(hTimer); T("Exhale"); S(1); i = 1; const eTimer = setInterval(() => { C(i++); if (i > 8) { clearInterval(eTimer); T("Ready"); C(0); } }, 1000); } }, 1000); } }, 1000); }; return <div className="p-16 rounded-[80px] shadow-2xl text-center relative border bg-[#0f172a] border-blue-500/20"><button onClick={onBack} className="absolute top-8 left-8 text-blue-500/50 font-black text-[10px] uppercase tracking-widest">Back</button><div className="flex justify-center py-20"><div className="bg-blue-500/20 rounded-full transition-all duration-[4000ms] border-2 border-blue-400 flex items-center justify-center" style={{ width: `${200 * s}px`, height: `${200 * s}px` }}><div className="text-center"><span className="text-blue-400 font-black uppercase tracking-widest text-xs block">{t}</span><span className="text-4xl font-black text-white">{c > 0 ? c : ''}</span></div></div></div><button onClick={start} className="mt-4 bg-blue-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg active:scale-95">Start 4-7-8</button></div>; }
function Panchabhoota({ onBack }) { return <div className="space-y-4 pb-20"><button onClick={onBack} className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 block">Back</button>{[{t:'Earth (396Hz)',i:Mountain,f:396},{t:'Water (417Hz)',i:Droplets,f:417},{t:'Fire (528Hz)',i:Flame,f:528},{t:'Air (639Hz)',i:Wind,f:639},{t:'Space (963Hz)',i:Sparkles,f:963}].map(e=>(<div key={e.t} onClick={()=>SoundEngine.playAncient(e.f)} className="p-8 border rounded-[40px] flex items-center gap-6 active:scale-95 transition-all cursor-pointer bg-white/5 border-white/5 hover:bg-emerald-900/20"><e.i size={24} className="text-emerald-400"/><div><h3 className="font-black uppercase text-lg text-emerald-100">{e.t}</h3></div></div>))}</div>; }
function SnakeGame({ onBack }) { const [s, SS] = useState([{x:10,y:10}]); const [f, SF] = useState({x:5,y:5}); const [d, SD] = useState({x:0,y:-1}); useEffect(() => { const i = setInterval(() => { const h = {x:s[0].x+d.x, y:s[0].y+d.y}; if(h.x<0||h.x>19||h.y<0||h.y>19) return; const n = [h, ...s]; if(h.x===f.x && h.y===f.y) { SF({x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)}); SoundEngine.playFreq(600,'sine',0.1); } else n.pop(); SS(n); }, 150); return () => clearInterval(i); }, [s, d, f]); return <div className="p-6 rounded-[50px] text-center border-4 bg-black border-emerald-900/50"><button onClick={onBack} className="text-gray-500 text-[10px] uppercase font-bold mb-4">Exit</button><div className="grid grid-cols-[repeat(20,12px)] border mx-auto w-fit gap-[1px] p-1 rounded-xl bg-[#05100a] border-white/5">{Array.from({length:400}).map((_,i)=>{ const x=i%20,y=Math.floor(i/20); const isS=s.some(p=>p.x===x&&p.y===y); const isF=f.x===x&&f.y===y; return <div key={i} className={`w-[12px] h-[12px] rounded-sm ${isS?'bg-emerald-500':isF?'bg-amber-400 animate-pulse': 'bg-white/5'}`}/> })}</div><div className="flex justify-center gap-4 mt-6"><button onClick={()=>SD({x:-1,y:0})} className="p-4 bg-gray-500/20 rounded-full"><ArrowLeft size={16}/></button><button onClick={()=>SD({x:0,y:-1})} className="p-4 bg-gray-500/20 rounded-full"><ArrowUp size={16}/></button><button onClick={()=>SD({x:0,y:1})} className="p-4 bg-gray-500/20 rounded-full"><ArrowUp size={16} className="rotate-180"/></button><button onClick={()=>SD({x:1,y:0})} className="p-4 bg-gray-500/20 rounded-full"><ArrowLeft size={16} className="rotate-180"/></button></div></div>; }
function MandalaArt({ onBack }) { const r = useRef(); const d = e => { if (!r.current) return; const c = r.current.getContext('2d'); const b = r.current.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; const x = clientX - b.left - 150, y = clientY - b.top - 150; c.translate(150, 150); c.strokeStyle = '#10b981'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + 1); c.stroke(); c.save(); c.scale(1, -1); c.moveTo(x, y); c.lineTo(x + 1, y + 1); c.stroke(); c.restore(); } c.setTransform(1, 0, 0, 1, 0, 0); }; return <div className="p-8 rounded-[50px] text-center border-4 bg-black border-purple-900/50"><button onClick={onBack} className="text-gray-500 text-[10px] uppercase font-bold mb-6">Exit</button><canvas ref={r} width={300} height={300} className="rounded-full mx-auto touch-none border cursor-crosshair bg-[#050505] shadow-[0_0_50px_rgba(16,185,129,0.2)] border-white/5" onMouseMove={e => e.buttons === 1 && d(e)} onTouchMove={d} /><button onClick={() => r.current.getContext('2d').clearRect(0, 0, 300, 300)} className="mt-6 px-6 py-2 bg-gray-500/20 rounded-full text-[10px] font-bold uppercase">Clear</button></div>; }
function BubblePop({ onBack }) { const [b, setB] = useState(Array.from({length:15},(_,i)=>({id:i,x:Math.random()*80+10,y:Math.random()*80+10, s: Math.random()*20+40}))); const pop = (id) => { SoundEngine.playPop(); setB(p=>p.filter(i=>i.id!==id)); setTimeout(()=>setB(p=>[...p,{id:Date.now(),x:Math.random()*80+10,y:Math.random()*80+10, s: Math.random()*20+40}]), 500); }; return <div className="p-4 rounded-[60px] h-[500px] relative overflow-hidden border-4 bg-[#0f172a] border-blue-900/30"><button onClick={onBack} className="absolute top-6 left-6 text-blue-400 font-black text-[10px] uppercase z-20">Back</button>{b.map(x=><button key={x.id} onClick={()=>pop(x.id)} className="absolute bg-blue-500/20 rounded-full border border-blue-400/50 backdrop-blur-sm active:scale-90 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]" style={{left:`${x.x}%`,top:`${x.y}%`,width:`${x.s}px`,height:`${x.s}px`}} />)}</div>; }
function ExpertGate({ setView, onBack, setUserData }) { 
  const [key, setKey] = useState("");
  const verify = () => { if(key===DOCTOR_KEY){setUserData(p=>({...p,role:'doctor'})); localStorage.setItem('ashoka_role','doctor'); alert("Verified");} else alert("Invalid"); };
  return (
    <div className="p-12 rounded-[60px] text-center space-y-8 shadow-2xl animate-in zoom-in border bg-[#022c22] border-emerald-500/20">
      <Lock size={60} className="mx-auto opacity-20 text-emerald-400" />
      <h2 className="text-3xl font-black uppercase tracking-tighter text-emerald-100">Expert Only</h2>
      <div className="space-y-4">
        <input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Enter Key" className="w-full p-4 rounded-[30px] text-center font-black outline-none border bg-black/40 text-white border-emerald-500/30"/>
        <button onClick={verify} className="w-full py-4 bg-emerald-700 text-white rounded-full font-black uppercase text-xs tracking-widest shadow-xl border border-emerald-500/50">Unlock Hub</button>
      </div>
      <button onClick={onBack} className="text-[10px] uppercase font-bold text-emerald-500/50">Return</button>
    </div>
  ); 
}
