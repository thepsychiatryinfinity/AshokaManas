import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, Users, Shield, AlertTriangle, TreePine, Flame, Activity, 
  Zap, Moon, Sun, ChevronDown, Siren, Clock, Wind, Waves, 
  CheckCircle2, Globe, Gamepad2, Trophy, Volume2, VolumeX,
  Lock, ArrowRight, User, Settings, Sparkles, AlertCircle, Brush,
  MessageSquare, LayoutDashboard, ShieldAlert, EyeOff, Search,
  Send, Flag, Stethoscope, Pill, Baby, HeartHandshake, ScrollText,
  Mail, ShieldCheck, Pin
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, doc, onSnapshot, setDoc, serverTimestamp, 
  collection, addDoc, updateDoc, enableIndexedDbPersistence 
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Using a stable ID to ensure data consistency
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ashokamanas-v55-core';

try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

const ADMIN_KEY = "ASHOKA-SUPER-ADMIN-99";
const DOCTOR_KEY = "ASHOKA-DOC-VERIFY";

// --- WAVY RIVER SOUND ENGINE ---
const SoundEngine = {
  ctx: null,
  riverNode: null,
  init() { 
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playHeartSound() {
    this.init();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(60, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.5);
  },
  playBurnSound() {
    this.init();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(100, this.ctx.currentTime);
    g.gain.setValueAtTime(0.05, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 1.5);
  },
  toggleRiver(active) {
    this.init();
    if (active) {
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      this.riverNode = this.ctx.createBufferSource();
      this.riverNode.buffer = buffer;
      this.riverNode.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.25;
      const lfoG = this.ctx.createGain();
      lfoG.gain.value = 150;
      lfo.connect(lfoG); lfoG.connect(filter.frequency);
      lfo.start();
      const g = this.ctx.createGain(); g.gain.value = 0.03;
      this.riverNode.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
      this.riverNode.start();
    } else if (this.riverNode) {
      this.riverNode.stop();
      this.riverNode = null;
    }
  }
};

const SACRED_HALLS = [
  { id: 'General', label: 'General Support', te: 'సాధారణ మద్దతు', icon: Users, color: 'emerald', sticky: 'Identity protected. Professional peer-to-peer involvement only.' },
  { id: 'Clinical', label: 'Clinical Hub', te: 'క్లినికల్ హబ్', icon: Stethoscope, color: 'cyan', expertOnly: true, sticky: 'Restricted for Verified Experts. Psycho-educational insights only.' },
  { id: 'Caregiver', label: 'Caregiver Burden', te: 'సంరక్షకుల భారం', icon: HeartHandshake, color: 'rose', sticky: 'You support others, we support you. Self-care is a mandate.' },
  { id: 'Addiction', label: 'Addiction Support', te: 'వ్యసన విముక్తి', icon: Pill, color: 'amber', sticky: 'Total anonymity. One day at a time towards healing.' },
  { id: 'Child', label: 'Child & Adolescent', te: 'పిల్లలు & కౌమారదశ', icon: Baby, color: 'pink', sticky: 'Minors must use only under parent/guardian supervision.' },
  { id: 'SideEffects', label: 'Side Effects', te: 'దుష్ప్రభావాలు', icon: AlertCircle, color: 'orange', sticky: 'CRITICAL: Consult your prescribing doctor before changing any medication.' },
  { id: 'Stories', label: 'My Story', te: 'నా కథ', icon: ScrollText, color: 'fuchsia', sticky: 'Your journey belongs to you. Keep your narrative safe and anonymous.' },
];

const LEGAL_GUIDE = [
  { id: 1, t: "1. Medical Disclaimer", m: "ASHOKAMANAS™ MEDICAL DISCLAIMER. No doctor-patient relationship is created. Peer support only." },
  { id: 2, t: "2. Emergency Protocol", m: "Not an emergency service. Call 108 or 14416 (Tele-MANAS) if in immediate crisis." },
  { id: 3, t: "3. No Prescriptions", m: "No medical prescriptions, diagnosis, or clinical treatment plans are provided here." },
  { id: 4, t: "4. User Responsibility", m: "You are responsible for your own health decisions. Consult professionals before acting." },
  { id: 5, t: "5. Intermediary Status", m: "AshokaManas™ acts as an Intermediary under the IT Act, 2000." },
  { id: 6, t: "6. Eligibility", m: "Platform intended for adults 18+. Minors require strict parental supervision." },
  { id: 7, t: "7. Zero Tolerance", m: "Absolute ban for abuse, harassment, bullying, or commercial solicitation." },
  { id: 8, t: "8. Termination Rights", m: "We reserve the right to ban or delete accounts without notice for code violations." },
  { id: 9, t: "9. Data Minimalism", m: "Strict No-Knowledge architecture. No Phones, Names, or GPS collected." },
  { id: 10, t: "10. Anonymity Limits", m: "Logs provided to authorities ONLY via valid court orders from Indian Law Enforcement." },
  { id: 11, t: "11. Grievance Redressal", m: "Grievance Officer: Dr. Pydala Rama Krishna Reddy. Contact: ashokamanas11@gmail.com." },
  { id: 12, t: "12. Jurisdiction", m: "Exclusive jurisdiction of courts in Nandyala District, Andhra Pradesh." },
  { id: 13, t: "13. Indemnification", m: "User liability applies. Bad-faith litigation results in 100% legal fee liability (Loser Pays All)." },
  { id: 14, t: "14. No Algorithm Bias", m: "Chronological feed only. We do not use engagement algorithms to manipulate emotions." },
  { id: 15, t: "15. External Links", m: "Not responsible for safety or content of third-party links shared by users." },
  { id: 16, t: "16. Gratuitous Service", m: "Provided free and voluntarily. No 'Consumer' rights for free peer interactions." },
  { id: 17, t: "17. Good Samaritan Act", m: "Volunteers protected for good-faith crisis interventions. No liability for timing." },
  { id: 18, t: "18. Not a Clinical Establishment", m: "Digital sanctuary hub, not a registered clinical hospital or surgery." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isAdmin: false, isExpert: false, streak: 0, level: 'Member' });
  const [flow, setFlow] = useState('gate'); 
  const [view, setView] = useState('home'); 
  const [activeHall, setActiveHall] = useState(null);
  const [lang, setLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [riverActive, setRiverActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) setUserData(snap.data());
      else setDoc(userRef, { uid: user.uid, isAdmin: false, isExpert: false, streak: 1, level: 'Leaf Member', lastActive: serverTimestamp() });
    });
  }, [user]);

  const STICKY_TEXT = lang === 'en' 
    ? "Not a medical services. For emergencies consult nearest hospital, click sos" 
    : "వైద్య సేవలు కాదు. అత్యవసర పరిస్థితుల్లో సమీప ఆసుపత్రిని సంప్రదించండి, sos క్లిక్ చేయండి";

  if (flow === 'gate') return <GateView onAccept={() => setFlow('main')} lang={lang} setLang={setLang} disclaimer={STICKY_TEXT} />;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#04110C] text-[#E0F2F1]' : 'bg-[#F9FBF9] text-[#064E3B]'} font-sans transition-all duration-1000 select-none overflow-x-hidden`}>
      
      {/* SECURITY OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-[0.02] bg-[radial-gradient(circle,black_1px,transparent_1px)] bg-[size:30px_30px]"></div>

      {/* SAFETY RIBBON */}
      <div className="fixed top-0 left-0 right-0 z-[200] bg-yellow-400 border-b-2 border-yellow-600 p-3 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-2 text-yellow-950 font-black">
          <Pin size={16} className="text-yellow-700" />
          <p className="text-[10px] md:text-xs uppercase tracking-tight leading-none">{STICKY_TEXT}</p>
        </div>
        <button onClick={() => setShowSOS(true)} className="px-5 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl shadow-lg border-b-4 border-red-900 active:scale-95 transition-all flex items-center gap-2">
          <Siren size={14} className="animate-pulse" /> SOS
        </button>
      </div>

      <header className="fixed top-[52px] left-0 right-0 p-4 md:p-6 flex justify-between items-center bg-inherit/90 backdrop-blur-3xl z-[150] border-b border-black/5">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => { setView('home'); setActiveHall(null); }}>
          <div className="p-2 bg-[#065F46] rounded-xl group-hover:rotate-6 transition-transform shadow-lg">
            <TreePine className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase leading-none">
              AshokaManas<sup className="text-[10px] ml-0.5">™</sup>
            </h1>
            <p className="text-[8px] font-bold text-emerald-600/50 uppercase tracking-[0.4em] mt-1 italic">©️ 2025 All Rights Reserved</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => { SoundEngine.toggleRiver(!riverActive); setRiverActive(!riverActive); }} className={`p-3 rounded-2xl transition-all shadow-sm ${riverActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-white dark:bg-emerald-900/40 text-blue-600'}`}>
            {riverActive ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-white dark:bg-emerald-900/40 rounded-2xl shadow-sm border border-emerald-100">
            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
          <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="px-3 py-1.5 bg-[#064E3B] text-white rounded-lg text-[10px] font-black uppercase shadow-lg">{lang === 'en' ? 'తెలుగు' : 'EN'}</button>
        </div>
      </header>

      {/* ADJUSTED MAIN CONTENT (pt to avoid ribbon overlap) */}
      <main className="max-w-4xl mx-auto pt-[140px] px-5 pb-48 relative z-10 animate-in fade-in duration-1000">
        
        {/* SEARCH BAR (Only show when not in specific tool view) */}
        {!activeHall && (
          <div className="mb-8 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? "Search for halls or tools..." : "శోధించండి..."}
              className="w-full p-5 pl-14 bg-white/50 dark:bg-emerald-900/10 backdrop-blur-xl rounded-[40px] border border-black/5 outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-sm"
            />
          </div>
        )}

        {view === 'home' && !activeHall && <HomeGrid setHall={setActiveHall} setView={setView} lang={lang} query={searchQuery} />}
        {activeHall && <HallView hall={activeHall} onBack={() => setActiveHall(null)} userData={userData} user={user} lang={lang} query={searchQuery} setView={setView} />}
        {view === 'lab' && <HealingLab lang={lang} query={searchQuery} />}
        {view === 'games' && <MindGames lang={lang} />}
        {view === 'legal' && <LegalView lang={lang} query={searchQuery} />}
        {view === 'profile' && <ProfileView userData={userData} setView={setView} user={user} />}
        {view === 'admin' && <AdminPanel />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-white/80 dark:bg-emerald-950/80 backdrop-blur-3xl border border-emerald-100 p-4 flex justify-around rounded-[45px] z-[180] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]">
        <NavBtn icon={LayoutDashboard} active={view === 'home' && !activeHall} onClick={() => { setView('home'); setActiveHall(null); }} />
        <NavBtn icon={Flame} active={view === 'lab'} onClick={() => { setView('lab'); setActiveHall(null); }} />
        <NavBtn icon={Gamepad2} active={view === 'games'} onClick={() => { setView('games'); setActiveHall(null); }} />
        <NavBtn icon={User} active={view === 'profile'} onClick={() => { setView('profile'); setActiveHall(null); }} />
      </nav>

      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
    </div>
  );
}

// --- GATEWAY ---

function GateView({ onAccept, lang, setLang, disclaimer }) {
  return (
    <div className="min-h-screen bg-[#042116] flex flex-col items-center justify-center p-8 text-white text-center relative overflow-hidden">
      <div className="relative mb-12 animate-in zoom-in duration-1000">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150"></div>
        <div className="relative p-6 bg-white/5 rounded-[45px] border border-white/10 shadow-2xl">
          <TreePine size={80} className="text-emerald-400" />
        </div>
      </div>
      <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none">AshokaManas<sup className="text-xl ml-1 font-bold">™</sup></h1>
      <p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-[0.6em] mb-12 italic">Sanctuary Hub</p>
      
      <div className="max-w-md w-full space-y-4 mb-14">
        <GateCard icon={ShieldAlert} title="Disclaimer" text={disclaimer} />
        <GateCard icon={EyeOff} title="Zero Tolerance" text="Permanent ban for abuse, harassment, or commercial solicitation." />
        <GateCard icon={Users} title="Parental Guidance" text="For adults 18+. Minors require strict parental supervision." />
      </div>

      <button onClick={() => { SoundEngine.init(); onAccept(); }} className="w-full max-w-sm py-6 bg-white text-emerald-950 rounded-[40px] font-black text-2xl shadow-2xl active:scale-95 transition-all uppercase tracking-tighter">
          {lang === 'en' ? 'Agree & Continue' : 'అంగీకరిస్తున్నాను'}
      </button>

      <div className="mt-10 flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400/40">
        <button onClick={() => setLang('en')} className={lang === 'en' ? 'text-white border-b-2 border-white' : ''}>English</button>
        <button onClick={() => setLang('te')} className={lang === 'te' ? 'text-white border-b-2 border-white' : ''}>తెలుగు</button>
      </div>
    </div>
  );
}

// --- HOME GRID ---

function HomeGrid({ setHall, setView, lang, query }) {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10">
      {/* RESPONSIVE HEART CENTERPIECE */}
      <div className="relative rounded-[70px] bg-gradient-to-br from-[#065F46] to-[#064E3B] p-12 text-center text-white shadow-[0_40px_100px_-20px_rgba(6,78,59,0.4)] overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
           onClick={() => SoundEngine.playHeartSound()}>
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%"><circle cx="50%" cy="50%" r="40%" fill="none" stroke="white" strokeWidth="1" className="animate-pulse" /></svg>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="w-32 h-32 bg-white/5 backdrop-blur-xl rounded-[45px] mx-auto flex items-center justify-center border border-white/10 shadow-2xl">
            <Heart size={64} className="text-emerald-300 drop-shadow-[0_0_15px_rgba(110,231,183,0.5)]" fill="currentColor" />
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Safe Interaction</h2>
          <div className="h-1.5 w-20 bg-emerald-400 mx-auto rounded-full"></div>
          <p className="text-[10px] text-emerald-200/40 font-black uppercase tracking-[0.5em] italic">Click to connect</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {SACRED_HALLS.filter(h => (lang === 'en' ? h.label : h.te).toLowerCase().includes(query.toLowerCase())).map(h => (
          <button key={h.id} onClick={() => setHall(h)} className="p-8 bg-white dark:bg-[#064E3B]/20 rounded-[50px] shadow-sm hover:shadow-2xl transition-all text-left flex items-center gap-6 border border-emerald-50 dark:border-emerald-900 group">
            <div className={`p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform`}><h.icon size={32} /></div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter leading-none text-emerald-950 dark:text-emerald-50">{lang === 'en' ? h.label : h.te}</h3>
              <p className="text-[10px] font-bold text-emerald-600/40 uppercase mt-2 tracking-widest">Active Hall</p>
            </div>
          </button>
        ))}
        <button onClick={() => setView('legal')} className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[55px] flex items-center gap-6 text-left border border-slate-200 col-span-1 md:col-span-2 hover:bg-white transition-all">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-[28px] text-slate-600 shadow-md"><Shield size={36}/></div>
          <div><h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Legal Guide<sup className="text-xs ml-1 font-bold">™</sup></h3><p className="text-[10px] opacity-40 uppercase font-black tracking-widest mt-2">18 Essential Points of Protection</p></div>
        </button>
      </div>
    </div>
  );
}

// --- HALL VIEW ---

function HallView({ hall, onBack, userData, user, lang, query, setView }) {
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (hall.expertOnly && !userData.isExpert) return;
    const qPosts = collection(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages');
    return onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt - a.createdAt));
    });
  }, [hall.id, hall.expertOnly, userData.isExpert]);

  const send = async () => {
    if (!msg.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages'), {
      uid: user.uid, text: msg, createdAt: serverTimestamp(), reported: false
    });
    setMsg("");
  };

  if (hall.expertOnly && !userData.isExpert) {
    return (
      <div className="bg-white dark:bg-emerald-950 p-10 rounded-[60px] text-center space-y-8 shadow-xl animate-in zoom-in border border-emerald-100">
        <Lock size={64} className="mx-auto text-emerald-400" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Verified Access Required</h2>
        <p className="text-sm font-bold opacity-60 leading-relaxed">The Clinical Hub is restricted to verified healthcare experts. Please verify your profile to gain access.</p>
        <button onClick={() => { setView('profile'); onBack(); }} className="px-10 py-4 bg-emerald-800 text-white rounded-full font-black uppercase text-xs">Go to Verification</button>
      </div>
    );
  }

  const filtered = posts.filter(p => !p.reported && (p.text.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-32">
      <button onClick={onBack} className="text-emerald-800 font-black uppercase text-xs">← Back to Hub</button>

      <div className={`p-10 bg-white dark:bg-[#064E3B] rounded-[60px] border-b-[16px] border-emerald-500 shadow-2xl relative overflow-hidden`}>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm`}><hall.icon size={28}/></div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">{lang === 'en' ? hall.label : hall.te}</h2>
            </div>
            <Pin className="text-emerald-400" size={24} />
          </div>
          <div className={`bg-emerald-50 dark:bg-emerald-950 p-6 rounded-[35px] border border-emerald-100 flex gap-4 items-start shadow-inner`}>
            <AlertCircle className={`text-emerald-600 shrink-0 mt-1`} size={24} />
            <p className="text-sm font-bold leading-tight text-emerald-900 dark:text-emerald-100">{hall.sticky}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4 p-6 bg-white dark:bg-emerald-900 rounded-[45px] shadow-sm border border-emerald-100">
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Share anonymously..." className="flex-1 bg-transparent border-none outline-none resize-none h-20 text-sm font-bold" />
          <button onClick={send} className="self-end p-5 bg-emerald-800 text-white rounded-3xl shadow-lg"><Send size={24}/></button>
        </div>
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="p-8 bg-white dark:bg-emerald-950/20 rounded-[45px] shadow-sm border border-emerald-50 flex justify-between items-start group">
              <p className="text-base font-bold leading-relaxed">{p.text}</p>
              <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', p.id), { reported: true })} className="p-2 opacity-0 group-hover:opacity-100 text-red-300"><Flag size={18}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- HEALING LAB ---

function HealingLab({ lang, query }) {
  const [active, setActive] = useState(null);
  const tools = [
    { id: 'burn', title: 'Burn Vault', te: 'బర్న్ వాల్ట్', icon: Flame, color: 'orange' },
    { id: 'breath', title: 'Prana Breath', te: 'ప్రాణ శ్వాస', icon: Wind, color: 'blue' },
    { id: 'pancha', title: 'Panchabhoota', te: 'పంచభూతాలు', icon: Sparkles, color: 'emerald' }
  ];

  if (active === 'burn') return <BurnVault onBack={() => setActive(null)} />;
  if (active === 'breath') return <PranaBreath onBack={() => setActive(null)} />;
  if (active === 'pancha') return <Panchabhoota onBack={() => setActive(null)} lang={lang} />;

  return (
    <div className="grid grid-cols-1 gap-6 pb-32 animate-in fade-in">
       {tools.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).map(t => (
         <StationCard key={t.id} icon={t.icon} title={t.title} te={t.te} onClick={() => setActive(t.id)} color="bg-emerald-50/50" />
       ))}
    </div>
  );
}

function BurnVault({ onBack }) {
  const [t, setT] = useState(""); const [burn, setB] = useState(false);
  const handle = () => { if(!t) return; SoundEngine.playBurnSound(); setB(true); setTimeout(()=>{setT("");setB(false);},3000); };
  return (
    <div className="bg-[#04110C] p-12 rounded-[70px] text-center min-h-[450px] flex flex-col justify-center relative overflow-hidden shadow-2xl">
      <button onClick={onBack} className="absolute top-8 left-8 text-white/30 font-black text-xs uppercase">Back</button>
      <div className={`transition-all duration-1000 ${burn ? 'opacity-0 scale-150 blur-3xl' : 'opacity-100'}`}>
        <Flame className="mx-auto text-orange-500 mb-8 animate-pulse" size={80} />
        <h3 className="text-white font-black text-3xl uppercase mb-6 tracking-tighter">The Burn Vault</h3>
        <textarea value={t} onChange={e=>setT(e.target.value)} className="w-full p-10 bg-emerald-950/50 text-white rounded-[50px] outline-none border-none resize-none h-44 font-bold text-lg" placeholder="Release what weights you down..." />
        <button onClick={handle} className="w-full py-7 bg-orange-600 text-white rounded-[40px] font-black text-2xl mt-10 shadow-2xl">RELEASE</button>
      </div>
      {burn && <div className="absolute inset-0 flex items-center justify-center text-[150px] animate-bounce">🔥</div>}
    </div>
  );
}

function PranaBreath({ onBack }) {
  const [ph, setPh] = useState("Ready"); const [c, setC] = useState(0); const [s, setS] = useState(1);
  const start = () => {
    setPh("Inhale"); setS(1.8); let count = 1; setC(count);
    const i = setInterval(() => { 
      count++; if(count <= 4) setC(count); 
      else { 
        clearInterval(i); setPh("Hold"); let h=1; setC(h); 
        const hi = setInterval(()=>{ 
          h++; if(h<=7) setC(h); 
          else { 
            clearInterval(hi); setPh("Exhale"); setS(1); let e=1; setC(e); 
            const ei=setInterval(()=>{ e++; if(e<=8) setC(e); else { clearInterval(ei); setPh("Ready"); setC(0); } }, 1000); 
          } 
        }, 1000); 
      } 
    }, 1000);
  };
  return (
    <div className="bg-white dark:bg-emerald-950 p-14 rounded-[70px] shadow-2xl text-center relative border border-emerald-50">
      <button onClick={onBack} className="absolute top-8 left-8 text-emerald-800 font-black text-xs uppercase tracking-widest">Back</button>
      <div className="flex justify-center py-16">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center transition-all duration-[4000ms] border-[12px] border-blue-50 shadow-inner" style={{ width: `${200 * s}px`, height: `${200 * s}px` }}>
          <p className="text-7xl font-black text-blue-600">{c > 0 ? c : ''}</p>
        </div>
      </div>
      <h3 className="text-5xl font-black text-blue-950 dark:text-blue-300 uppercase tracking-tighter leading-none">{ph}</h3>
      {ph === "Ready" && <button onClick={start} className="px-16 py-7 bg-blue-600 text-white rounded-full font-black text-2xl mt-14 shadow-2xl">START 4-7-8</button>}
    </div>
  );
}

function Panchabhoota({ onBack, lang }) {
  const els = [
    { id: 'earth', icon: Mountain, name: 'Earth (Prithvi)', te: 'భూమి', c: 'bg-amber-100', tc: 'text-amber-900', f: 120 },
    { id: 'water', icon: Droplets, name: 'Water (Jala)', te: 'జలం', c: 'bg-blue-100', tc: 'text-blue-900', f: 400 },
    { id: 'fire', icon: Sun, name: 'Fire (Agni)', te: 'అగ్ని', c: 'bg-orange-100', tc: 'text-orange-900', f: 800 },
    { id: 'air', icon: Fan, name: 'Air (Vayu)', te: 'వాయువు', c: 'bg-emerald-100', tc: 'text-emerald-900', f: 1200 },
    { id: 'space', icon: Sparkles, name: 'Space (Akasha)', te: 'ఆకాశం', c: 'bg-purple-100', tc: 'text-purple-900', f: 2000 }
  ];
  return (
    <div className="space-y-6 pb-24 animate-in zoom-in">
      <button onClick={onBack} className="text-emerald-800 font-black uppercase text-xs">← Back</button>
      <div className="grid grid-cols-1 gap-4">
        {els.map(el => (
          <button key={el.id} onClick={() => SoundEngine.playTone(el.f, 1)} className={`${el.c} p-10 rounded-[60px] flex items-center gap-10 shadow-sm hover:scale-[1.02] transition-all text-left`}>
            <div className={`p-6 bg-white rounded-[35px] ${el.tc} shadow-lg`}><el.icon size={36} /></div>
            <div>
              <h3 className={`font-black uppercase text-2xl leading-none ${el.tc}`}>{lang === 'en' ? el.name : el.te}</h3>
              <p className={`text-[10px] font-bold mt-2 ${el.tc} opacity-40 uppercase tracking-widest`}>Healing Station</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- GAMES ---

function MindGames({ lang }) {
  const [active, setActive] = useState(null);
  if (active === 'snake') return <SnakeGame onBack={() => setActive(null)} />;
  if (active === 'bubbles') return <BubblePop onBack={() => setActive(null)} />;
  if (active === 'mandala') return <MandalaArt onBack={() => setActive(null)} lang={lang} />;
  return (
    <div className="grid grid-cols-1 gap-6 pb-24">
      <GameBtn icon={Gamepad2} title="Nature Snake" desc="Classic nature tones." color="bg-emerald-50" onClick={() => setActive('snake')} />
      <GameBtn icon={Zap} title="Bubble Pop" desc="Tap to hear the pop." color="bg-blue-50" onClick={() => setActive('bubbles')} />
      <GameBtn icon={Brush} title="Mandala Art" desc="Sacred geometry tracing." color="bg-purple-50" onClick={() => setActive('mandala')} />
    </div>
  );
}

function SnakeGame({ onBack }) {
  const [s, setS] = useState([{x:10,y:10}]); const [f, setF] = useState({x:5,y:5}); const [d, setD] = useState({x:0,y:-1}); const [go, setGo] = useState(false);
  const move = useCallback(() => {
    const head = { x: s[0].x+d.x, y: s[0].y+d.y };
    if (head.x<0 || head.x>=20 || head.y<0 || head.y>=20 || s.find(b=>b.x===head.x&&b.y===head.y)) { setGo(true); return; }
    const ns = [head,...s]; if (head.x===f.x&&head.y===f.y) { setF({x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)}); SoundEngine.playTone(800, 0.1); } else ns.pop(); setS(ns);
  }, [s,d,f]);
  useEffect(() => { 
    if (!go) { 
      const i = setInterval(move, 200); 
      return () => clearInterval(i); 
    } 
  }, [move,go]);
  return (
    <div className="bg-[#051510] p-8 rounded-[70px] text-center relative max-w-sm mx-auto shadow-2xl border-4 border-emerald-900">
      <button onClick={onBack} className="absolute top-6 left-6 text-white/30 font-black text-[10px] uppercase">Back</button>
      <div className="grid w-full aspect-square bg-[#062419] rounded-[40px] overflow-hidden" style={{ gridTemplateColumns: 'repeat(20, 1fr)', gridTemplateRows: 'repeat(20, 1fr)' }}>
        {Array.from({length:400}).map((_,i) => {
          const x=i%20; const y=Math.floor(i / 20); const isS=s.find(b=>b.x===x&&b.y===y); const isF=f.x===x&&f.y===y;
          return <div key={i} className={`w-full h-full ${isS?'bg-emerald-400':isF?'bg-red-500 rounded-full scale-75 animate-pulse':''}`} />;
        })}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4 w-48 mx-auto">
        <div/><button onClick={()=>setD({x:0,y:-1})} className="p-4 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90">↑</button><div/>
        <button onClick={()=>setD({x:-1,y:0})} className="p-4 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90">←</button>
        <button onClick={()=>setD({x:0,y:1})} className="p-4 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90">↓</button>
        <button onClick={()=>setD({x:1,y:0})} className="p-4 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90">→</button>
      </div>
      {go && <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[70px]"><p className="text-white font-black uppercase text-3xl mb-8">Game Over</p><button onClick={()=>{setS([{x:10,y:10}]);setGo(false);}} className="px-14 py-4 bg-emerald-600 text-white rounded-full font-black text-xl shadow-2xl">Retry</button></div>}
    </div>
  );
}

function BubblePop({ onBack }) {
  const [b, setB] = useState(Array.from({length:12},(_,i)=>({id:i,x:Math.random()*80,y:Math.random()*80})));
  const pop = (id) => { SoundEngine.playTone(1200, 0.05); setB(b.filter(x=>x.id!==id)); setTimeout(()=>setB(p=>[...p,{id:Date.now(),x:Math.random()*80,y:Math.random()*80}]),1500); };
  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-10 rounded-[70px] h-[550px] relative overflow-hidden shadow-inner border border-blue-100">
      <button onClick={onBack} className="absolute top-8 left-8 text-blue-400 font-black text-xs uppercase">← Back</button>
      {b.map(x=>(<button key={x.id} onClick={()=>pop(x.id)} className="absolute w-24 h-24 bg-blue-400/20 rounded-full border-4 border-blue-400/40 flex items-center justify-center transition-all active:scale-0 shadow-lg" style={{left:`${x.x}%`,top:`${x.y}%`}}><div className="w-6 h-6 bg-white/30 rounded-full"></div></button>))}
    </div>
  );
}

function MandalaArt({ onBack, lang }) {
  const ref = useRef(null); const [d, setD] = useState(false);
  const draw = (e) => {
    if(!d) return; const c=ref.current; const ctx=c.getContext('2d'); const r=c.getBoundingClientRect();
    const x = (e.clientX||(e.touches&&e.touches[0].clientX)) - r.left - c.width/2;
    const y = (e.clientY||(e.touches&&e.touches[0].clientY)) - r.top - c.height/2;
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for(let i=0;i<8;i++){ ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.stroke(); }
  };
  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-12 rounded-[70px] text-center relative shadow-inner border border-emerald-100">
      <button onClick={onBack} className="absolute top-8 left-8 text-emerald-400 font-black text-xs uppercase">← Back</button>
      <div className="mb-10 p-8 bg-white dark:bg-[#061B14] rounded-[40px] text-sm font-bold leading-relaxed border border-emerald-100 shadow-sm">
        {lang === 'en' ? 'Mandala symmetry mirrors the mind. Tracing creates geometric calm and focus across 8 sacred directions.' : 'మండల సమరూపత మనస్సును ప్రతిబింబిస్తుంది. ట్రేసింగ్ భౌగోళిక ప్రశాంతతను సృష్టిస్తుంది.'}
      </div>
      <canvas ref={ref} width={340} height={340} onMouseDown={()=>setD(true)} onMouseUp={()=>setD(false)} onMouseMove={draw} onTouchStart={()=>setD(true)} onTouchEnd={()=>setD(false)} onTouchMove={draw} className="mx-auto bg-white rounded-full shadow-2xl border-[12px] border-emerald-50 cursor-crosshair" />
      <button onClick={()=>ref.current.getContext('2d').clearRect(0,0,340,340)} className="mt-10 px-14 py-4 bg-emerald-900 text-white rounded-full font-black text-xs uppercase shadow-xl">Clear Canvas</button>
    </div>
  );
}

// --- LEGAL & PROFILE ---

function LegalView({ lang, query }) {
  return (
    <div className="space-y-6 pb-32 animate-in fade-in">
       <div className="text-center mb-10"><h2 className="text-4xl font-black uppercase tracking-tighter text-emerald-900 dark:text-emerald-50">Legal Guide<sup className="text-lg italic">™</sup></h2><p className="text-[10px] font-black text-emerald-600/40 uppercase mt-2 tracking-widest italic">© 2025 AshokaManas. All Rights Reserved.</p></div>
       {LEGAL_GUIDE.filter(p => p.t.toLowerCase().includes(query.toLowerCase())).map(p => (
         <LegalItem key={p.id} title={p.t} text={p.m} />
       ))}
    </div>
  );
}

function LegalItem({ title, text }) {
  const [o, setO] = useState(false);
  return (
    <div className="bg-white dark:bg-emerald-950/30 rounded-[35px] border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <button onClick={()=>setO(!o)} className="w-full p-8 flex justify-between font-black uppercase text-sm tracking-widest text-emerald-950 dark:text-emerald-100 text-left">
        {title} <ChevronDown className={o ? 'rotate-180' : ''} />
      </button>
      {o && <div className="p-10 border-t border-gray-50 dark:border-emerald-900 text-sm text-gray-500 dark:text-emerald-400 leading-relaxed font-bold animate-in slide-in-from-top-4">{text}</div>}
    </div>
  );
}

function ProfileView({ userData, setView, user }) {
  const [vCode, setVCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const verifyExpert = async () => {
    if (vCode === DOCTOR_KEY) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), { isExpert: true, level: 'Verified Expert' });
      alert("Verification successful.");
    }
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10 pb-32">
       <div className="bg-[#064E3B] text-white p-14 rounded-[80px] text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="w-24 h-24 bg-white/10 rounded-[40px] mx-auto flex items-center justify-center border border-white/20 shadow-inner"><User size={48} /></div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Profile Rank</h2>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10"><p className="text-3xl font-black">{userData.streak}</p><p className="text-[10px] uppercase font-black opacity-30 tracking-widest">Day Streak</p></div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10"><p className="text-3xl font-black">{userData.isExpert ? 'Expert' : 'Member'}</p><p className="text-[10px] uppercase font-black opacity-30 tracking-widest">Status</p></div>
            </div>
          </div>
       </div>

       <div className="bg-white dark:bg-emerald-950/20 p-10 rounded-[60px] shadow-xl border border-emerald-50">
          <h3 className="text-2xl font-black uppercase flex items-center gap-3 text-emerald-950 dark:text-emerald-50"><ShieldCheck size={28} className="text-blue-500"/> Verification</h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Experts enter clinical key to unlock restricted halls.</p>
          <div className="mt-6 flex gap-4">
             <input type="password" value={vCode} onChange={e => setVCode(e.target.value)} className="flex-1 p-5 bg-emerald-50 dark:bg-emerald-950 rounded-[30px] outline-none font-black text-center text-xl" placeholder="••••••••" />
             <button onClick={verifyExpert} className="px-10 bg-emerald-800 text-white rounded-[30px] font-black uppercase text-xs">Verify</button>
          </div>
       </div>

       <div className="bg-white dark:bg-emerald-950/20 p-10 rounded-[60px] shadow-xl border border-emerald-50">
          <h3 className="text-2xl font-black uppercase flex items-center gap-3 text-emerald-950 dark:text-emerald-50"><Settings size={28} className="text-emerald-500"/> Admin Panel</h3>
          <div className="mt-6 flex gap-4">
             <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="flex-1 p-5 bg-emerald-50 dark:bg-emerald-950 rounded-[30px] outline-none font-black text-center text-xl" placeholder="••••" />
             <button onClick={() => adminCode === ADMIN_KEY && setView('admin')} className="px-10 bg-emerald-800 text-white rounded-[30px] font-black uppercase text-xs">Access</button>
          </div>
       </div>
    </div>
  );
}

function AdminPanel() {
  return (
    <div className="p-12 bg-[#051510] text-white rounded-[80px] text-center space-y-10 animate-in fade-in shadow-2xl border border-white/5">
       <Settings size={80} className="mx-auto text-emerald-400 animate-spin-slow" />
       <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Control Hub</h2>
       <p className="opacity-40 uppercase tracking-[0.4em] text-[10px] font-black italic">Platform Surveillance Active</p>
    </div>
  );
}

// --- UI HELPERS ---

function GateCard({ icon: Icon, title, text }) {
  return (
    <div className="p-6 bg-white/5 rounded-[40px] border border-white/10 text-left flex gap-6 backdrop-blur-xl shadow-lg">
      <Icon size={24} className="shrink-0 text-emerald-400" />
      <div><h4 className="text-[10px] font-black uppercase text-emerald-500 mb-1">{title}</h4><p className="text-[12px] font-bold leading-tight opacity-90">{text}</p></div>
    </div>
  );
}

function StationCard({ icon: Icon, title, te, onClick, color }) {
  return (
    <button onClick={onClick} className={`p-10 ${color} rounded-[65px] flex items-center gap-8 text-left group border border-black/5 active:scale-95 transition-all`}>
       <div className={`p-5 rounded-[30px] bg-white shadow-md group-hover:scale-110 transition-transform`}><Icon size={36} className="text-emerald-900" /></div>
       <div><h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-emerald-950">{title}</h3><p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-2">{te}</p></div>
    </button>
  );
}

function GameBtn({ icon: Icon, title, desc, onClick, color }) {
  return (
    <button onClick={onClick} className={`p-10 ${color} rounded-[60px] flex items-center gap-8 text-left shadow-sm hover:shadow-xl transition-all border border-black/5 active:scale-95`}>
      <Icon size={32} className="text-emerald-900" />
      <div><h3 className="font-black text-2xl uppercase leading-none text-emerald-950 dark:text-emerald-50">{title}</h3><p className="text-[11px] opacity-40 font-bold uppercase mt-1 tracking-widest">{desc}</p></div>
    </button>
  );
}

function NavBtn({ icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-5 rounded-[35px] transition-all duration-500 ${active ? 'bg-[#064E3B] dark:bg-emerald-400 text-white dark:text-[#064E3B] shadow-2xl scale-125' : 'text-emerald-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'}`}>
      <Icon size={26} />
    </button>
  );
}

const SOSModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-[#310404]/98 backdrop-blur-[100px] z-[1000] flex flex-col items-center justify-center p-8 text-white text-center animate-in zoom-in duration-500">
    <div className="w-48 h-48 bg-red-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_100px_rgba(220,38,38,1)] mb-12">
      <Siren size={100} className="text-white" />
    </div>
    <h2 className="text-7xl font-black uppercase mb-8 tracking-tighter leading-none text-white drop-shadow-2xl">Emergency SOS</h2>
    <div className="w-full max-w-sm space-y-5">
      <a href="tel:108" className="block py-8 bg-red-600 rounded-[60px] font-black text-4xl shadow-2xl active:scale-95 border-b-[12px] border-red-900 transition-all uppercase tracking-tighter">CALL 108</a>
      <a href="tel:14416" className="block py-8 bg-blue-600 rounded-[60px] font-black text-2xl border-b-[10px] border-blue-900 uppercase tracking-widest">Tele-MANAS</a>
    </div>
    <button onClick={onClose} className="mt-20 text-gray-500 font-black uppercase tracking-[0.3em] underline decoration-red-600 underline-offset-[16px] hover:text-white transition-colors">Return to Platform</button>
  </div>
);

