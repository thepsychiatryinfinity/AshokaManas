import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, Users, Shield, AlertTriangle, TreePine, Flame, Activity, 
  Zap, Moon, Sun, ChevronDown, Siren, Clock, Wind, Waves, 
  CheckCircle2, Globe, Gamepad2, Trophy, Volume2, VolumeX,
  Lock, ArrowRight, User, Settings, Sparkles, AlertCircle, Brush,
  MessageSquare, LayoutDashboard, ShieldAlert, EyeOff, Search,
  Send, Flag, Stethoscope, Pill, Baby, HeartHandshake, ScrollText,
  Mail, ShieldCheck, Pin, Trash2, ThumbsUp, Droplets, Mountain, Fan
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, doc, onSnapshot, setDoc, serverTimestamp, 
  collection, addDoc, updateDoc, deleteDoc, query, orderBy, limit 
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ashokamanas-v55-titanium';

const ADMIN_KEY = "ASHOKA-SUPER-ADMIN-99";
const DOCTOR_KEY = "ASHOKA-DOC-VERIFY";

// --- TITANIUM AUDIO ENGINE ---
const SoundEngine = {
  ctx: null,
  riverNode: null,
  init() { 
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playFreq(f, type = 'sine', d = 0.8) {
    this.init();
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, this.ctx.currentTime);
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + d);
  },
  playHeart() { this.playFreq(60, 'sine', 0.6); },
  playPop() { this.playFreq(1000, 'sine', 0.1); },
  playBurn() { this.playFreq(80, 'sawtooth', 2.0); },
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
      this.riverNode.buffer = buffer; this.riverNode.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 450;
      const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.2;
      const lfoG = this.ctx.createGain(); lfoG.gain.value = 180;
      lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
      const g = this.ctx.createGain(); g.gain.value = 0.03;
      this.riverNode.connect(f); f.connect(g); g.connect(this.ctx.destination);
      this.riverNode.start();
    } else if (this.riverNode) { this.riverNode.stop(); this.riverNode = null; }
  }
};

// --- DATA: LEGAL VERBATIM ---
const LEGAL_CONTENT = [
  { t: "MEDICAL DISCLAIMER", m: "ASHOKAMANAS: MEDICAL DISCLAIMER\n\n1. No Doctor-Patient Relationship\nUse of the AshokaManas platform (App or Website) does not create a doctor-patient relationship between you and Dr. Pydala Rama Krishna Reddy, or any other verified expert on the platform. The content provided here is for Informational, Educational, and Peer Support purposes only.\n\n2. Not for Emergencies\nThis platform is NOT an emergency service. We cannot provide immediate medical intervention.\n\nIf you are feeling suicidal, planning self-harm, or experiencing a medical emergency, STOP using this app immediately and:\nCall 108 (Ambulance/Emergency).\nCall 14416 (Tele-MANAS Government Helpline).\nGo to the nearest Emergency Room.\n\n3. No Prescriptions\nAshokaManas is a supportive community. Verified Experts on this platform provide guidance on coping strategies, lifestyle changes, and general medical facts. They will NOT provide official medical prescriptions, diagnosis, or treatment plans via public chats. Any mention of medication is for educational discussion only.\n\n4. User Responsibility\nYou agree that you are responsible for your own health decisions. Never disregard professional medical advice or delay seeking it because of something you have read on AshokaManas." },
  { t: "TERMS OF SERVICE", m: "ASHOKAMANAS: TERMS OF USE\n\n1. Nature of Platform (Intermediary Status)\nAshokaManas functions as an 'Intermediary' under the Information Technology Act, 2000. We provide the technical platform for users to communicate. We are not responsible for the content posted by users.\n\n2. Eligibility\nYou must be 18 years or older to use this platform independently. Users under 18 may use the 'Child & Adolescent' space only under the supervision of a parent or legal guardian.\n\n3. Zero Tolerance Policy\nWe enforce a strict policy against Abuse, Violence, Privacy Violations, and Impersonation. Banning is immediate and permanent for violators.\n\n4. Termination\nAshokaManas reserves the right to suspend, ban, or delete any user account without prior notice if these terms are violated." },
  { t: "PRIVACY POLICY", m: "ASHOKAMANAS: PRIVACY POLICY\n\n1. Data Minimalism\nWe follow a strict 'No-Knowledge' privacy architecture. We DO NOT collect: Real Names, Phone Numbers, Email Addresses, GPS Location, or Contacts.\n\n2. Anonymity\nInteractions are anonymous. However, we cooperate with Indian Law Enforcement Agencies by providing server logs if requested via valid court orders in criminal investigations.\n\n3. Data Storage\nStored securely on Google Firebase (Cloud Firestore)." },
  { t: "CODE OF CONDUCT", m: "FOR USERS:\nDO speak openly, support others with kind words, use the flag button for safety.\nDON'T share phone numbers, ask for money, or treat this as a dating app.\n\nFOR EXPERTS:\nDO provide psycho-education, clarify myths.\nDON'T give specific prescriptions or dosages in public comments." },
  { t: "GRIEVANCE REDRESSAL", m: "Grievance Officer:\nName: Dr. Pydala Rama Krishna Reddy\nEmail: ashokamanas11@gmail.com\nResponse Time: Within 24-48 Hours." },
  { t: "INDEMNIFICATION", m: "You agree to indemnify and hold harmless Dr. Pydala Rama Krishna Reddy, AshokaManas, and its affiliates from any claims, damages, or legal fees arising from your violation of these Terms or your posting of any illegal content. If your actions cost us money, you agree to reimburse us." },
  { t: "USER BILL OF RIGHTS", m: "Right to Anonymity: We promise not to track you.\nRight to Safety: We promise to delete abuse.\nRight to Ownership: Your story belongs to you.\nRight to Forget: You can delete your account anytime." },
  { t: "NOT A CLINICAL ESTABLISHMENT", m: "AshokaManas is a digital information intermediary and peer-support community. It is NOT a 'Clinical Establishment' under the Clinical Establishments (Registration and Regulation) Act, 2010. We do not admit patients, provide pathology, or offer emergency care." }
];

const HALLS = [
  { id: 'General', label: 'General Support', te: 'సాధారణ మద్దతు', icon: Users, color: 'emerald', sticky: 'Identity Protected. Professional peer involvement only.' },
  { id: 'Clinical', label: 'Clinical Hub', te: 'క్లినికల్ హబ్', icon: Stethoscope, color: 'cyan', expertOnly: true, sticky: 'Restricted for Verified Experts. Psycho-educational insights only.' },
  { id: 'Caregiver', label: 'Caregiver Burden', te: 'సంరక్షకుల భారం', icon: HeartHandshake, color: 'rose', sticky: 'Self-care is vital. You are not alone in this emotional journey.' },
  { id: 'Addiction', label: 'Addiction Support', te: 'వ్యసన విముక్తి', icon: Pill, color: 'amber', sticky: 'Total anonymity guaranteed. One day at a time.' },
  { id: 'Child', label: 'Child & Adolescent', te: 'పిల్లలు & కౌమారదశ', icon: Baby, color: 'pink', sticky: 'Platform intended for adults. Minors must use under parent/guardian guidance.' },
  { id: 'SideEffects', label: 'Side Effects', te: 'దుష్ప్రభావాలు', icon: AlertCircle, color: 'orange', sticky: 'CRITICAL: Never stop medication without consulting your doctor.' },
  { id: 'Stories', label: 'My Story', te: 'నా కథ', icon: ScrollText, color: 'fuchsia', sticky: 'Your journey belongs to you. Share safely within our professional code.' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isExpert: false, streak: 0, level: 'Member' });
  const [view, setView] = useState('gate'); // gate, home, lab, games, legal, profile, admin
  const [activeHall, setActiveHall] = useState(null);
  const [lang, setLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [riverActive, setRiverActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setUserData(snap.data());
      else setDoc(ref, { uid: user.uid, isExpert: false, streak: 1, level: 'Leaf', lastActive: serverTimestamp() });
    });
  }, [user]);

  const STICKY_TEXT = lang === 'en' 
    ? "Not a medical services. For emergencies consult nearest hospital, click sos" 
    : "వైద్య సేవలు కాదు. అత్యవసర పరిస్థితుల్లో సమీప ఆసుపత్రిని సంప్రదించండి, sos క్లిక్ చేయండి";

  if (view === 'gate') return <GateView onAccept={() => setView('home')} lang={lang} setLang={setLang} disclaimer={STICKY_TEXT} />;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#04110C] text-[#D1FAE5]' : 'bg-[#F9FBF9] text-[#064E3B]'} font-sans transition-all duration-1000 select-none overflow-x-hidden`}>
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-[0.02] bg-[radial-gradient(circle,black_1px,transparent_1px)] bg-[size:30px_30px]"></div>

      {/* SAFETY BAR */}
      <div className="fixed top-0 left-0 right-0 z-[400] bg-[#FBDF3A] border-b-2 border-[#D97706] p-3 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-2 text-yellow-950 font-black">
          <Pin size={16} className="text-yellow-700" />
          <p className="text-[10px] md:text-xs uppercase tracking-tight leading-none">{STICKY_TEXT}</p>
        </div>
        <button onClick={() => setShowSOS(true)} className="px-5 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl shadow-lg border-b-4 border-red-900 active:scale-95 transition-all flex items-center gap-2">
          <Siren size={14} /> SOS
        </button>
      </div>

      <header className="fixed top-[52px] left-0 right-0 p-4 md:p-6 flex justify-between items-center bg-inherit/90 backdrop-blur-3xl z-[350] border-b border-black/5">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => { setView('home'); setActiveHall(null); }}>
          <div className="p-2 bg-[#065F46] rounded-xl shadow-lg group-hover:rotate-6 transition-transform">
            <TreePine className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase leading-none">AshokaManas<sup className="text-[10px] ml-0.5 font-bold italic">™</sup></h1>
            <p className="text-[8px] font-bold text-emerald-600/50 uppercase tracking-[0.4em] mt-1 italic">Copyright ©️ Ashokanmanas ™️</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { SoundEngine.toggleRiver(!riverActive); setRiverActive(!riverActive); }} className={`p-3 rounded-2xl transition-all shadow-sm ${riverActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-white dark:bg-emerald-950/20 text-blue-600'}`}>
            {riverActive ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-white dark:bg-emerald-950/40 rounded-2xl shadow-sm border border-emerald-100">
            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
          <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="px-3 py-1.5 bg-[#064E3B] text-white rounded-lg text-[10px] font-black uppercase shadow-lg">{lang === 'en' ? 'తెలుగు' : 'EN'}</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-[140px] px-5 pb-48 relative z-10 animate-in fade-in duration-1000">
        
        {!activeHall && view !== 'admin' && (
          <div className="mb-8 relative group animate-in slide-in-from-top-4">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? "Search wisdom or tools..." : "శోధించండి..."}
              className="w-full p-5 pl-14 bg-white/50 dark:bg-emerald-900/10 backdrop-blur-xl rounded-[40px] border border-black/5 outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-sm shadow-sm"
            />
          </div>
        )}

        {view === 'home' && !activeHall && <HomeHub setHall={setActiveHall} setView={setView} lang={lang} query={searchQuery} />}
        {activeHall && <HallView hall={activeHall} onBack={() => setActiveHall(null)} userData={userData} user={user} lang={lang} query={searchQuery} setView={setView} />}
        {view === 'lab' && <LabView lang={lang} query={searchQuery} />}
        {view === 'games' && <GamesView lang={lang} />}
        {view === 'legal' && <LegalView lang={lang} query={searchQuery} />}
        {view === 'profile' && <ProfileView userData={userData} setView={setView} user={user} />}
        {view === 'admin' && <AdminView />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-white/80 dark:bg-emerald-950/80 backdrop-blur-3xl border border-emerald-100 p-4 flex justify-around rounded-[45px] z-[500] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]">
        <NavBtn icon={LayoutDashboard} active={view === 'home'} onClick={() => { setView('home'); setActiveHall(null); }} />
        <NavBtn icon={Flame} active={view === 'lab'} onClick={() => { setView('lab'); setActiveHall(null); }} />
        <NavBtn icon={Gamepad2} active={view === 'games'} onClick={() => { setView('games'); setActiveHall(null); }} />
        <NavBtn icon={User} active={view === 'profile'} onClick={() => { setView('profile'); setActiveHall(null); }} />
      </nav>

      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
    </div>
  );
}

// --- SUB-VIEWS ---

function GateView({ onAccept, lang, setLang, disclaimer }) {
  return (
    <div className="min-h-screen bg-[#042116] flex flex-col items-center justify-center p-8 text-white text-center relative overflow-hidden">
      <div className="relative mb-12 animate-in zoom-in duration-1000">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl scale-150 rounded-full"></div>
        <div className="relative p-6 bg-white/5 rounded-[45px] border border-white/10 shadow-2xl"><TreePine size={80} className="text-emerald-400" /></div>
      </div>
      <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none text-white">AshokaManas<sup className="text-xl ml-1 font-bold italic">™</sup></h1>
      
      <div className="max-w-md w-full space-y-4 mb-14 text-left">
        <GateSection icon={ShieldAlert} title="Medical Disclaimer" text="No doctor-patient relationship created. Content is for informational, educational, and peer-support purposes only. Not an emergency service." />
        <GateSection icon={EyeOff} title="Zero Tolerance" text="Absolute ban against abuse, harassment, or solicitation. Banning is immediate and permanent for violators." />
        <GateSection icon={Users} title="Minor Protection" text="Independent use is for 18+. Minors must use ONLY under strict direct supervision of a parent or legal guardian." />
      </div>

      <button onClick={() => { SoundEngine.init(); onAccept(); }} className="w-full max-w-sm py-6 bg-white text-[#042116] rounded-[40px] font-black text-2xl shadow-2xl active:scale-95 transition-all">
          {lang === 'en' ? 'AGREE & CONTINUE' : 'అంగీకరిస్తున్నాను'}
      </button>

      <div className="mt-10 flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400/40">
        <button onClick={() => setLang('en')} className={lang === 'en' ? 'text-white border-b-2 border-white' : ''}>English</button>
        <button onClick={() => setLang('te')} className={lang === 'te' ? 'text-white border-b-2 border-white' : ''}>తెలుగు</button>
      </div>
      <p className="mt-20 text-[9px] font-black uppercase tracking-widest opacity-30 italic leading-relaxed">Copyright ©️ Ashokanmanas ™️ all rights are reserved</p>
    </div>
  );
}

function GateSection({ icon: Icon, title, text }) {
  return (
    <div className="p-5 bg-white/5 rounded-[35px] border border-white/10 flex gap-5 backdrop-blur-xl">
      <Icon size={24} className="shrink-0 text-emerald-400 mt-1" />
      <div><h4 className="text-[10px] font-black uppercase text-emerald-500 mb-1">{title}</h4><p className="text-[11px] font-bold leading-tight opacity-90">{text}</p></div>
    </div>
  );
}

function HomeHub({ setHall, setView, lang, query }) {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10">
      <div className="relative rounded-[70px] bg-gradient-to-br from-[#065F46] to-[#064E3B] p-12 text-center text-white shadow-2xl overflow-hidden cursor-pointer active:scale-95 transition-all"
           onClick={() => { SoundEngine.init(); SoundEngine.playHeart(); }}>
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%"><circle cx="50%" cy="50%" r="40%" fill="none" stroke="white" strokeWidth="1" className="animate-pulse" /></svg>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="w-32 h-32 bg-white/5 backdrop-blur-xl rounded-[45px] mx-auto flex items-center justify-center border border-white/10 shadow-2xl animate-pulse">
            <Heart size={64} className="text-emerald-300 drop-shadow-[0_0_15px_rgba(110,231,183,0.5)]" fill="currentColor" />
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Safe Interaction</h2>
          <div className="h-1.5 w-24 bg-emerald-400 mx-auto rounded-full"></div>
          <p className="text-[10px] text-emerald-200/40 font-black uppercase tracking-[0.5em] italic">Heart of the forest</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {HALLS_DATA.filter(h => (lang === 'en' ? h.label : h.te).toLowerCase().includes(query.toLowerCase())).map(h => (
          <button key={h.id} onClick={() => setHall(h)} className="p-8 bg-white dark:bg-[#064E3B]/20 rounded-[50px] shadow-sm hover:shadow-2xl transition-all text-left flex items-center gap-6 border border-emerald-50 dark:border-emerald-900 group">
            <div className={`p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform`}><h.icon size={32} /></div>
            <h3 className="font-black text-xl uppercase tracking-tighter leading-none text-emerald-950 dark:text-emerald-50">{lang === 'en' ? h.label : h.te}</h3>
          </button>
        ))}
        <button onClick={() => setView('legal')} className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[55px] flex items-center gap-6 text-left border border-slate-200 col-span-1 md:col-span-2 hover:bg-white transition-all">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-[28px] text-slate-600 shadow-md"><Shield size={36}/></div>
          <div><h3 className="font-black text-2xl uppercase tracking-tighter leading-none text-slate-900 dark:text-white">Legal Guide<sup className="text-xs ml-1 font-bold italic">™</sup></h3><p className="text-[10px] opacity-40 uppercase font-black mt-2">©️ ashokamanas and all rights reserved</p></div>
        </button>
      </div>
    </div>
  );
}

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
      uid: user.uid, text: msg, createdAt: serverTimestamp(), reported: false, likes: 0, pinned: false
    });
    setMsg(""); SoundEngine.playHeart();
  };

  if (hall.expertOnly && !userData.isExpert) return <ExpertGate setView={setView} onBack={onBack} />;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-32">
      <button onClick={onBack} className="text-emerald-800 font-black uppercase text-xs flex items-center gap-2">← Back to Hub</button>
      <div className="p-10 bg-white dark:bg-[#064E3B] rounded-[60px] border-b-[16px] border-emerald-500 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600"><hall.icon size={28}/></div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">{lang === 'en' ? hall.label : hall.te}</h2>
            </div>
            <Pin className="text-emerald-400" size={24} />
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950 p-6 rounded-[35px] border border-emerald-100 flex gap-4 items-start shadow-inner">
            <AlertCircle className="text-emerald-600 shrink-0 mt-1" size={24} />
            <p className="text-sm font-bold leading-tight text-emerald-900 dark:text-emerald-100">{hall.sticky}</p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex gap-4 p-6 bg-white dark:bg-emerald-900/30 rounded-[45px] shadow-sm border border-emerald-100">
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Share anonymously..." className="flex-1 bg-transparent border-none outline-none resize-none h-20 text-sm font-bold" />
          <button onClick={send} className="self-end p-5 bg-emerald-800 text-white rounded-3xl shadow-xl active:scale-95"><Send size={24}/></button>
        </div>
        <div className="space-y-4">
          {posts.filter(p => !p.reported && p.text.toLowerCase().includes(query.toLowerCase())).map(p => (
            <div key={p.id} className={`p-8 bg-white dark:bg-emerald-950/20 rounded-[45px] shadow-sm border border-emerald-50 flex flex-col gap-4 group ${p.pinned ? 'border-l-[12px] border-l-emerald-500' : ''}`}>
              <div className="flex justify-between items-start">
                <p className="text-base font-bold leading-relaxed">{p.text}</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {userData.isExpert && <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', p.id), { pinned: !p.pinned })} className="p-2 text-emerald-500"><Pin size={18}/></button>}
                  {p.uid === user.uid && <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', p.id))} className="p-2 text-red-400"><Trash2 size={18}/></button>}
                  <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', p.id), { reported: true })} className="p-2 text-red-300"><Flag size={18}/></button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <div className="flex items-center gap-4">
                   <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', p.id), { likes: (p.likes || 0) + 1 })} className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase"><ThumbsUp size={14}/> Support {p.likes || 0}</button>
                   <span className="text-[9px] font-black opacity-30 uppercase">{p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LabView({ lang, query }) {
  const [active, setActive] = useState(null);
  if (active === 'burn') return <BurnVault onBack={() => setActive(null)} />;
  if (active === 'breath') return <PranaBreath onBack={() => setActive(null)} />;
  if (active === 'pancha') return <Panchabhoota onBack={() => setActive(null)} lang={lang} />;
  return (
    <div className="grid grid-cols-1 gap-6 pb-32 animate-in fade-in">
       <div className="text-center mb-6"><h2 className="text-4xl font-black uppercase tracking-tighter text-emerald-950 dark:text-emerald-100">Healing Lab<sup className="text-lg italic">™</sup></h2></div>
       <StationCard icon={Flame} title="Burn Vault" te="బర్న్ వాల్ట్" onClick={() => setActive('burn')} color="bg-emerald-50/50 dark:bg-emerald-900/10" />
       <StationCard icon={Wind} title="Prana Breath" te="ప్రాణ శ్వాస" onClick={() => setActive('breath')} color="bg-emerald-50/50 dark:bg-emerald-900/10" />
       <StationCard icon={Sparkles} title="Panchabhoota" te="పంచభూతాలు" onClick={() => setActive('pancha')} color="bg-emerald-50/50 dark:bg-emerald-900/10" />
    </div>
  );
}

function BurnVault({ onBack }) {
  const [t, setT] = useState(""); const [burn, setB] = useState(false);
  const handle = () => { if(!t) return; SoundEngine.init(); SoundEngine.playBurn(); setB(true); setTimeout(()=>{setT("");setB(false);},3000); };
  return (
    <div className="bg-[#04110C] p-12 rounded-[70px] text-center min-h-[500px] flex flex-col justify-center relative overflow-hidden shadow-2xl border-4 border-white/5">
      <button onClick={onBack} className="absolute top-10 left-10 text-white/30 font-black text-xs uppercase tracking-widest">Back</button>
      <div className={`transition-all duration-1000 ${burn ? 'opacity-0 scale-150 blur-3xl' : 'opacity-100'}`}>
        <Flame className="mx-auto text-orange-500 mb-10 animate-pulse" size={100} />
        <h3 className="text-white font-black text-3xl uppercase mb-10 tracking-tighter leading-none">The Burn Vault</h3>
        <textarea value={t} onChange={e=>setT(e.target.value)} className="w-full p-10 bg-white/5 text-white rounded-[60px] outline-none border border-white/10 resize-none h-48 font-bold text-xl" placeholder="Release trauma here..." />
        <button onClick={handle} className="w-full py-8 bg-orange-600 text-white rounded-[50px] font-black text-2xl mt-12 shadow-2xl active:scale-95">RELEASE</button>
      </div>
      {burn && <div className="absolute inset-0 flex items-center justify-center text-[180px] animate-bounce">🔥</div>}
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
    <div className="bg-white dark:bg-[#064E3B] p-16 rounded-[80px] shadow-2xl text-center relative border border-emerald-50">
      <button onClick={onBack} className="absolute top-10 left-10 text-emerald-800 font-black text-xs uppercase tracking-widest">Back</button>
      <div className="flex justify-center py-20">
        <div className="bg-blue-100 dark:bg-emerald-950 rounded-full flex items-center justify-center transition-all duration-[4000ms] border-[12px] border-blue-50 dark:border-emerald-800 shadow-inner" style={{ width: `${220 * s}px`, height: `${220 * s}px` }}>
          <p className="text-8xl font-black text-blue-600 dark:text-emerald-300 drop-shadow-md">{c > 0 ? c : ''}</p>
        </div>
      </div>
      <h3 className="text-6xl font-black text-blue-950 dark:text-blue-300 uppercase tracking-tighter leading-none">{ph}</h3>
      {ph === "Ready" && <button onClick={start} className="px-20 py-8 bg-blue-600 text-white rounded-full font-black text-2xl mt-16 shadow-2xl active:scale-95">START 4-7-8</button>}
    </div>
  );
}

function Panchabhoota({ onBack, lang }) {
  const els = [
    { id: 'earth', icon: Mountain, name: 'Earth (Prithvi)', te: 'భూమి', f: 128, d: "Stability and grounding." },
    { id: 'water', icon: Droplets, name: 'Water (Jala)', te: 'జలం', f: 396, d: "Fluidity and emotional release." },
    { id: 'fire', icon: Sun, name: 'Fire (Agni)', te: 'అగ్ని', f: 639, d: "Transformation and will." },
    { id: 'air', icon: Fan, name: 'Air (Vayu)', te: 'వాయువు', f: 852, d: "Movement and breath." },
    { id: 'space', icon: Sparkles, name: 'Space (Akasha)', te: 'ఆకాశం', f: 963, d: "Consciousness and infinity." }
  ];
  return (
    <div className="space-y-6 pb-24 animate-in zoom-in">
      <button onClick={onBack} className="text-emerald-800 font-black uppercase text-xs">← Back</button>
      <div className="grid grid-cols-1 gap-4">
        {els.map(el => (
          <button key={el.id} onClick={() => { SoundEngine.init(); SoundEngine.playFreq(el.f, 'triangle', 1.5); }} 
                  className="p-10 bg-emerald-50 dark:bg-emerald-950 rounded-[60px] flex items-center gap-10 shadow-sm hover:scale-105 active:scale-95 transition-all text-left border border-emerald-100">
            <div className="p-6 bg-white rounded-[35px] shadow-lg"><el.icon size={36} className="text-emerald-600" /></div>
            <div>
              <h3 className="font-black uppercase text-2xl leading-none text-emerald-950 dark:text-emerald-100">{lang === 'en' ? el.name : el.te}</h3>
              <p className="text-[10px] font-bold mt-2 text-emerald-600 opacity-40 uppercase tracking-widest">{el.d}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GamesView({ lang }) {
  const [active, setActive] = useState(null);
  if (active === 'snake') return <SnakeGame onBack={() => setActive(null)} />;
  if (active === 'bubbles') return <BubblePop onBack={() => setActive(null)} />;
  if (active === 'mandala') return <MandalaArt onBack={() => setActive(null)} lang={lang} />;
  return (
    <div className="grid grid-cols-1 gap-8 pb-32 animate-in fade-in">
      <div className="text-center mb-4"><h2 className="text-4xl font-black uppercase tracking-tighter text-emerald-950 dark:text-emerald-100">Mind Games<sup className="text-lg italic font-bold">™</sup></h2></div>
      <GameBtn icon={Gamepad2} title="Nature Snake" desc="Nature-toned calm." color="bg-emerald-50 dark:bg-emerald-900/10" onClick={() => setActive('snake')} />
      <GameBtn icon={Zap} title="Bubble Pop" desc="Stress relief tapping." color="bg-blue-50 dark:bg-blue-900/10" onClick={() => setActive('bubbles')} />
      <GameBtn icon={Brush} title="Mandala Art" desc="Sacred geometry tracing." color="bg-purple-50 dark:bg-purple-900/10" onClick={() => setActive('mandala')} />
    </div>
  );
}

function SnakeGame({ onBack }) {
  const [s, setS] = useState([{x:10,y:10}]); const [f, setF] = useState({x:5,y:5}); const [d, setD] = useState({x:0,y:-1}); const [go, setGo] = useState(false);
  const move = useCallback(() => {
    const head = { x: s[0].x+d.x, y: s[0].y+d.y };
    if (head.x<0 || head.x>=20 || head.y<0 || head.y>=20 || s.find(b=>b.x===head.x&&b.y===head.y)) { setGo(true); return; }
    const ns = [head,...s]; if (head.x===f.x&&head.y===f.y) { setF({x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)}); SoundEngine.playHeart(); } else ns.pop(); setS(ns);
  }, [s,d,f]);
  useEffect(() => { if (!go) { const i = setInterval(move, 200); return () => clearInterval(i); } }, [move,go]);
  return (
    <div className="bg-[#051510] p-10 rounded-[80px] text-center relative max-w-sm mx-auto shadow-2xl border-4 border-emerald-900">
      <button onClick={onBack} className="absolute top-8 left-8 text-white/30 font-black text-xs uppercase">Back</button>
      <div className="grid w-full aspect-square bg-[#062419] rounded-[40px] overflow-hidden" style={{ gridTemplateColumns: 'repeat(20, 1fr)', gridTemplateRows: 'repeat(20, 1fr)' }}>
        {Array.from({length:400}).map((_,i) => {
          const x=i%20; const y=Math.floor(i / 20); const isS=s.find(b=>b.x===x&&b.y===y); const isF=f.x===x&&f.y===y;
          return <div key={i} className={`w-full h-full ${isS?'bg-emerald-400':isF?'bg-red-500 rounded-full scale-75 animate-pulse':''}`} />;
        })}
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4 w-48 mx-auto pb-4">
        <div/><button onClick={()=>setD({x:0,y:-1})} className="p-5 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90 transition-transform text-2xl font-black">↑</button><div/>
        <button onClick={()=>setD({x:-1,y:0})} className="p-5 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90 transition-transform text-2xl font-black">←</button>
        <button onClick={()=>setD({x:0,y:1})} className="p-5 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90 transition-transform text-2xl font-black">↓</button>
        <button onClick={()=>setD({x:1,y:0})} className="p-5 bg-emerald-800 rounded-3xl text-white shadow-xl active:scale-90 transition-transform text-2xl font-black">→</button>
      </div>
      {go && <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[80px]"><p className="text-white font-black uppercase text-3xl mb-10">Game Over</p><button onClick={()=>{setS([{x:10,y:10}]);setGo(false);}} className="px-16 py-5 bg-emerald-600 text-white rounded-full font-black text-xl shadow-2xl">RESTART</button></div>}
    </div>
  );
}

function BubblePop({ onBack }) {
  const [b, setB] = useState(Array.from({length:12},(_,i)=>({id:i,x:Math.random()*80,y:Math.random()*80})));
  const pop = (id) => { SoundEngine.init(); SoundEngine.playPop(); setB(b.filter(x=>x.id!==id)); setTimeout(()=>setB(p=>[...p,{id:Date.now(),x:Math.random()*80,y:Math.random()*80}]),1200); };
  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-12 rounded-[80px] h-[600px] relative overflow-hidden shadow-inner border-2 border-blue-100/50">
      <button onClick={onBack} className="absolute top-10 left-10 text-blue-400 font-black text-xs uppercase">← Back</button>
      {b.map(x=>(<button key={x.id} onClick={()=>pop(x.id)} className="absolute w-28 h-28 bg-blue-400/20 rounded-full border-4 border-blue-400/40 flex items-center justify-center transition-all active:scale-0 shadow-lg" style={{left:`${x.x}%`,top:`${x.y}%`}}><div className="w-8 h-8 bg-white/30 rounded-full"></div></button>))}
    </div>
  );
}

function MandalaArt({ onBack, lang }) {
  const ref = useRef(null); const [d, setD] = useState(false);
  const draw = (e) => {
    if(!d) return; const c=ref.current; const ctx=c.getContext('2d'); const r=c.getBoundingClientRect();
    const x = (e.clientX||(e.touches&&e.touches[0].clientX)) - r.left - c.width/2;
    const y = (e.clientY||(e.touches&&e.touches[0].clientY)) - r.top - c.height/2;
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for(let i=0;i<8;i++){ ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.stroke(); }
  };
  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-12 rounded-[80px] text-center relative shadow-inner border border-emerald-100">
      <button onClick={onBack} className="absolute top-10 left-10 text-emerald-400 font-black text-xs uppercase tracking-widest">Back</button>
      <canvas ref={ref} width={360} height={360} onMouseDown={()=>setD(true)} onMouseUp={()=>setD(false)} onMouseMove={draw} onTouchStart={()=>setD(true)} onTouchEnd={()=>setD(false)} onTouchMove={draw} className="mx-auto bg-white rounded-full shadow-2xl border-[16px] border-emerald-50 cursor-crosshair mt-10" />
      <button onClick={()=>ref.current.getContext('2d').clearRect(0,0,360,360)} className="mt-12 px-16 py-5 bg-emerald-900 text-white rounded-full font-black text-xs uppercase shadow-xl hover:bg-emerald-800 transition-all">Clear Canvas</button>
    </div>
  );
}

function LegalView({ lang, query }) {
  return (
    <div className="space-y-6 pb-40 animate-in fade-in">
       <div className="text-center mb-12">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-emerald-950 dark:text-emerald-50">Legal Guide<sup className="text-lg italic font-bold">™</sup></h2>
          <p className="text-[10px] font-black text-emerald-600/40 uppercase mt-2 tracking-widest italic">ashokamanas ™️ Copyright ©️ at ashokamanas ™️ all the rights reserved</p>
       </div>
       {LEGAL_CONTENT.filter(p => p.t.toLowerCase().includes(query.toLowerCase())).map((p, idx) => (
         <LegalTile key={idx} title={p.t} text={p.m} />
       ))}
    </div>
  );
}

function LegalTile({ title, text }) {
  const [o, setO] = useState(false);
  return (
    <div className="bg-white dark:bg-emerald-950/30 rounded-[45px] border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <button onClick={()=>setO(!o)} className="w-full p-8 flex justify-between font-black uppercase text-sm tracking-widest text-emerald-950 dark:text-emerald-100 text-left items-center group">
        <span>{title}</span>
        <ChevronDown className={`transition-transform duration-500 ${o ? 'rotate-180' : ''}`} />
      </button>
      {o && <div className="p-10 border-t border-emerald-50 dark:border-emerald-900 text-[15px] text-gray-500 dark:text-emerald-400 leading-relaxed font-bold animate-in slide-in-from-top-4 whitespace-pre-wrap">{text}</div>}
    </div>
  );
}

function ProfileView({ userData, setView, user }) {
  const [vCode, setVCode] = useState("");
  const verify = async () => {
    if (vCode === DOCTOR_KEY) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), { isExpert: true, level: 'Verified Expert' });
      alert("Verified Expert status granted.");
    }
  };
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10 pb-40">
       <div className="bg-[#064E3B] text-white p-16 rounded-[100px] text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="w-28 h-28 bg-white/10 rounded-[45px] mx-auto flex items-center justify-center border border-white/20 shadow-inner"><User size={56} /></div>
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Profile Status</h2>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-sm"><p className="text-4xl font-black leading-none">{userData.streak}</p><p className="text-[10px] uppercase font-black opacity-30 tracking-[0.3em] mt-2">Day Streak</p></div>
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-sm"><p className="text-3xl font-black leading-none">{userData.isExpert ? 'Expert' : 'Member'}</p><p className="text-[10px] uppercase font-black opacity-30 mt-2">Rank</p></div>
            </div>
          </div>
       </div>
       <div className="bg-white dark:bg-emerald-950/20 p-12 rounded-[70px] shadow-xl border border-emerald-50">
          <h3 className="text-3xl font-black uppercase flex items-center gap-3 text-emerald-950 dark:text-emerald-50"><ShieldCheck size={36} className="text-blue-500"/> Expert Verification</h3>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-6">Verified Experts gain restricted Clinical Hub access.</p>
          <div className="mt-8 flex gap-4">
             <input type="password" value={vCode} onChange={e => setVCode(e.target.value)} className="flex-1 p-6 bg-emerald-50 dark:bg-emerald-950 rounded-[35px] outline-none font-black text-center text-2xl border-none shadow-inner" placeholder="••••••••" />
             <button onClick={verify} className="px-12 bg-emerald-800 text-white rounded-full font-black uppercase text-xs shadow-lg">Verify</button>
          </div>
       </div>
    </div>
  );
}

function AdminView() {
  return (
    <div className="p-16 bg-[#051510] text-white rounded-[100px] text-center animate-in fade-in shadow-2xl border border-white/5">
       <Settings size={100} className="mx-auto text-emerald-400 animate-spin-slow" />
       <h2 className="text-6xl font-black uppercase tracking-tighter mt-10">Control Hub</h2>
       <p className="opacity-40 uppercase tracking-[0.5em] text-[11px] font-black italic mt-4">Surveillance Active</p>
    </div>
  );
}

// --- SHARED HELPERS ---

function NavBtn({ icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-5 rounded-[38px] transition-all duration-500 ${active ? 'bg-[#064E3B] dark:bg-emerald-400 text-white dark:text-[#064E3B] shadow-2xl scale-125' : 'text-emerald-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'}`}>
      <Icon size={28} />
    </button>
  );
}

function StationCard({ icon: Icon, title, te, onClick, color }) {
  return (
    <button onClick={onClick} className={`p-12 ${color} rounded-[80px] flex items-center gap-10 text-left group border border-black/5 shadow-sm active:scale-95 transition-all`}>
       <div className={`p-6 rounded-[35px] bg-white shadow-xl`}><Icon size={44} className="text-emerald-900" /></div>
       <div><h3 className="text-4xl font-black uppercase tracking-tighter leading-none text-emerald-950 dark:text-emerald-50">{title}</h3><p className="text-[11px] font-black opacity-30 uppercase mt-3 italic">{te}</p></div>
    </button>
  );
}

function GameBtn({ icon: Icon, title, desc, onClick, color }) {
  return (
    <button onClick={onClick} className={`p-12 ${color} rounded-[80px] flex items-center gap-10 text-left shadow-lg border border-black/5 active:scale-95 transition-all group`}>
      <div className="p-6 bg-white dark:bg-emerald-950 rounded-[35px] shadow-md group-hover:scale-110 transition-transform"><Icon size={40} className="text-emerald-900 dark:text-emerald-400" /></div>
      <div><h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-emerald-950 dark:text-emerald-50">{title}</h3><p className="text-[11px] opacity-40 font-bold uppercase mt-2 tracking-widest italic">{desc}</p></div>
    </button>
  );
}

function ExpertGate({ setView, onBack }) {
  return (
    <div className="bg-white dark:bg-emerald-950 p-12 rounded-[60px] text-center space-y-10 shadow-2xl animate-in zoom-in border border-emerald-100">
      <Lock size={80} className="mx-auto text-emerald-400 opacity-20" />
      <h2 className="text-4xl font-black uppercase tracking-tighter">Expert Restricted Area</h2>
      <p className="text-sm font-bold opacity-60 leading-relaxed max-w-sm mx-auto">Verified clinicians only. Gain your badge in the profile station to enter.</p>
      <button onClick={() => { setView('profile'); onBack(); }} className="px-14 py-5 bg-emerald-800 text-white rounded-full font-black uppercase text-xs tracking-widest shadow-xl">Verification Portal</button>
    </div>
  );
}

const SOSModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-[#310404]/98 backdrop-blur-[100px] z-[1000] flex flex-col items-center justify-center p-8 text-white text-center animate-in zoom-in duration-500">
    <div className="w-56 h-56 bg-red-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_120px_rgba(220,38,38,1)] mb-12"><Siren size={120} className="text-white" /></div>
    <h2 className="text-8xl font-black uppercase mb-8 tracking-tighter leading-none">Emergency SOS</h2>
    <div className="w-full max-w-sm space-y-6">
      <a href="tel:108" className="block py-9 bg-red-600 rounded-[60px] font-black text-5xl shadow-2xl active:scale-95 border-b-[14px] border-red-900 uppercase tracking-tighter">CALL 108</a>
      <a href="tel:14416" className="block py-9 bg-blue-600 rounded-[60px] font-black text-2xl border-b-[12px] border-blue-900 uppercase">Tele-MANAS</a>
    </div>
    <button onClick={onClose} className="mt-24 text-gray-500 font-black uppercase tracking-[0.4em] underline decoration-red-600 underline-offset-[20px] hover:text-white">Return to Platform</button>
  </div>
);

const HALLS_DATA = HALLS; // Alias for mapping

