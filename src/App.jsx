import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, Users, Shield, AlertTriangle, TreePine, Flame, Activity, 
  Zap, Moon, Sun, ChevronDown, Siren, Clock, Wind, Waves, 
  CheckCircle2, Globe, Gamepad2, Trophy, Volume2, VolumeX,
  Lock, ArrowRight, User, Settings, Sparkles, AlertCircle, Brush,
  MessageSquare, LayoutDashboard, ShieldAlert, EyeOff, Search,
  Send, Flag, Stethoscope, Pill, Baby, HeartHandshake, ScrollText,
  Mail, ShieldCheck, Pin, Trash2, ThumbsUp, CreditCard, HelpCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, doc, onSnapshot, setDoc, serverTimestamp, 
  collection, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';

// --- CONFIGURATION GUARD ---
const firebaseConfig = JSON.parse(__firebase_config || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ashokamanas-v62-sustenance';

const ADMIN_KEY = "ASHOKA-SUPER-ADMIN-99";

// --- SOUND ENGINE ---
const SoundEngine = {
  ctx: null,
  riverNode: null,
  init() { 
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playFreq(f, type = 'sine', d = 1.0) {
    this.init();
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, this.ctx.currentTime);
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + d);
  },
  playHeart() { this.playFreq(58, 'sine', 0.8); },
  playPop() { this.playFreq(1100, 'sine', 0.1); },
  playBurn() { this.playFreq(80, 'sawtooth', 2.0); },
  toggleRiver(active) {
    this.init();
    if (active && this.ctx) {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
      this.riverNode = this.ctx.createBufferSource();
      this.riverNode.buffer = buffer; this.riverNode.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      const g = this.ctx.createGain(); g.gain.value = 0.05;
      this.riverNode.connect(f); f.connect(g); g.connect(this.ctx.destination);
      this.riverNode.start();
    } else if (this.riverNode) { this.riverNode.stop(); this.riverNode = null; }
  }
};

// --- DATA: AWARENESS CODE WITH SUSTENANCE CLAUSE ---
const LEGAL_DATA = [
  { t: "SANCTUARY CODE", m: "ASHOKAMANAS: AWARENESS DISCLAIMER\n\n1. Awareness, Not Cure\nAshokaManas™ is a platform for knowledge and awareness. We are guides, not clinicians. We do not offer cures, only the path to 30% awareness which is necessary for healing.\n\n2. Nature of Platform\nThis is an educational resource. No doctor-patient relationship is created.\n\n3. Emergency Protocol\nWe are NOT an emergency service. Call 108 in a crisis." },
  { t: "SUSTENANCE FEE POLICY", m: "1. Purpose of Contribution\nAny fee or contribution paid by the user is strictly for 'Sanctuary Sustenance.' This covers cloud server charges and the technical efforts involved in maintaining the digital infrastructure.\n\n2. No Result-Based Liability\nAs this is an awareness and educational app, the fee does not constitute a contract for a specific health outcome. Users are paying for access to tools and knowledge, not for a clinical result.\n\n3. No Consumer Suit Waiver\nBy accessing the paid features, you acknowledge that you are a seeker of knowledge, and the sanctuary is provided on a best-effort basis for awareness purposes." },
  { t: "PRIVACY PLEDGE", m: "Data Minimalism: No names, no phone numbers, no tracking. Your journey is anonymous." },
  { t: "GRIEVANCE REDRESSAL", m: "Officer: Dr. Pydala Rama Krishna Reddy\nEmail: ashokamanas11@gmail.com\nResponse: 24-48 Hours." }
];

const HALLS = [
  { id: 'General', label: 'Empathy Hall', te: 'సాధారణ మద్దతు', icon: Users, color: 'emerald', welcome: "Welcome. Share your heart anonymously. We are here for awareness." },
  { id: 'Clinical', label: 'Wisdom Hall', te: 'క్లినికల్ హబ్', icon: Stethoscope, color: 'cyan', expertOnly: true, welcome: "Welcome, Guide. Remove your white coat and find awareness for yourself." },
  { id: 'Caregiver', label: 'Supporters Path', te: 'సంరక్షకుల భారం', icon: HeartHandshake, color: 'rose', welcome: "Who supports the supporter? Find rest and self-awareness here." },
  { id: 'Addiction', label: 'Recovery Grove', te: 'వ్యసన విముక్తి', icon: Pill, color: 'amber', welcome: "A grove for clarity. Your battle for awareness is honored here." },
  { id: 'SideEffects', label: 'Medication Insight', te: 'దుష్ప్రభావాలు', icon: AlertCircle, color: 'orange', welcome: "Share lifestyle awareness regarding treatments. Consult your doctor first." },
  { id: 'Stories', label: 'My Legacy', te: 'నా కథ', icon: ScrollText, color: 'fuchsia', welcome: "Your story is a map. Use it for your own awareness and to help others." },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isExpert: false, isAdmin: false, isSustainer: false });
  const [view, setView] = useState('gate'); 
  const [activeHall, setActiveHall] = useState(null);
  const [lang, setLang] = useState('en');
  const [riverActive, setRiverActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) setUser(u);
      else await signInAnonymously(auth);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setUserData(snap.data());
      else setDoc(ref, { uid: user.uid, isExpert: false, isAdmin: false, isSustainer: false, streak: 1, lastActive: serverTimestamp() });
    });
  }, [user]);

  if (view === 'gate') return <GateView onAccept={() => setView('home')} lang={lang} setLang={setLang} />;

  return (
    <div className={`min-h-screen bg-[#F9FBF9] text-[#064E3B] font-sans select-none overflow-x-hidden transition-all duration-1000`}>
      
      {/* SAFETY BAR */}
      <div className="fixed top-0 left-0 right-0 z-[450] bg-[#FBDF3A] border-b-2 border-[#D97706] p-3 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-2 text-yellow-950 font-black uppercase text-[10px]">
          <Pin size={16} /> <p>AshokaManas™ Awareness Sanctuary. Not a clinic.</p>
        </div>
        <button onClick={() => setShowSOS(true)} className="px-5 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl">SOS</button>
      </div>

      <header className="fixed top-[52px] left-0 right-0 p-4 flex justify-between items-center bg-white/90 backdrop-blur-3xl z-[400] border-b border-black/5">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setView('home'); setActiveHall(null); }}>
          <div className="p-2 bg-[#065F46] rounded-xl"><TreePine className="text-white" size={24} /></div>
          <div><h1 className="font-black text-xl tracking-tighter uppercase leading-none">AshokaManas<sup>™</sup></h1></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { SoundEngine.toggleRiver(!riverActive); setRiverActive(!riverActive); }} className={`p-3 rounded-2xl ${riverActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>{riverActive ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button>
          <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="px-3 py-1.5 bg-[#064E3B] text-white rounded-lg text-[10px] font-black">{lang === 'en' ? 'తెలుగు' : 'EN'}</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-[140px] px-5 pb-48 relative z-10 animate-in fade-in duration-1000">
        {!activeHall && (
          <div className="mb-8 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search knowledge..." className="w-full p-5 pl-14 bg-white rounded-[40px] border border-black/5 outline-none font-bold text-sm shadow-sm" />
          </div>
        )}

        {view === 'home' && !activeHall && <HomeHub setHall={setActiveHall} setView={setView} lang={lang} query={searchQuery} />}
        {activeHall && <HallView hall={activeHall} onBack={() => setActiveHall(null)} userData={userData} user={user} lang={lang} query={searchQuery} setView={setView} />}
        {view === 'lab' && <LabView lang={lang} isSustainer={userData.isSustainer} setView={setView} />}
        {view === 'legal' && <LegalView lang={lang} query={searchQuery} />}
        {view === 'profile' && <ProfileView userData={userData} setView={setView} user={user} />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-white/80 backdrop-blur-3xl border border-emerald-100 p-4 flex justify-around rounded-[45px] z-[500] shadow-2xl">
        <NavBtn icon={LayoutDashboard} active={view === 'home'} onClick={() => { setView('home'); setActiveHall(null); }} />
        <NavBtn icon={Flame} active={view === 'lab'} onClick={() => { setView('lab'); setActiveHall(null); }} />
        <NavBtn icon={Shield} active={view === 'legal'} onClick={() => { setView('legal'); setActiveHall(null); }} />
        <NavBtn icon={User} active={view === 'profile'} onClick={() => { setView('profile'); setActiveHall(null); }} />
      </nav>

      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
    </div>
  );
}

// --- GATE ---
function GateView({ onAccept, lang, setLang }) {
  return (
    <div className="min-h-screen bg-[#042116] flex flex-col items-center justify-center p-8 text-white text-center relative overflow-hidden">
      <TreePine size={80} className="text-emerald-400 mb-8" />
      <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none">AshokaManas<sup>™</sup></h1>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-12 opacity-50 italic">Awareness Sanctuary</p>
      
      <div className="max-w-md w-full space-y-4 mb-14 text-left">
        <div className="p-5 bg-white/5 rounded-[30px] border border-white/10 flex gap-4 backdrop-blur-xl">
          <ShieldAlert className="shrink-0 text-emerald-400" />
          <div><h4 className="text-[10px] font-black uppercase text-emerald-500 mb-1">AWARENESS MISSION</h4><p className="text-[11px] font-bold opacity-80">This is an educational sanctuary. We provide knowledge and peer support, not clinical cures.</p></div>
        </div>
        <div className="p-5 bg-white/5 rounded-[30px] border border-white/10 flex gap-4 backdrop-blur-xl">
          <CreditCard className="shrink-0 text-emerald-400" />
          <div><h4 className="text-[10px] font-black uppercase text-emerald-500 mb-1">SUSTENANCE FEE</h4><p className="text-[11px] font-bold opacity-80">Contributions are used purely for server maintenance and efforts. Access knowledge, not a treatment plan.</p></div>
        </div>
      </div>

      <button onClick={() => { SoundEngine.init(); onAccept(); }} className="w-full max-w-sm py-6 bg-white text-[#042116] rounded-[40px] font-black text-2xl shadow-2xl active:scale-95 transition-all">ENTER SANCTUARY</button>
      <p className="mt-20 text-[9px] font-black uppercase tracking-widest opacity-30 italic">Copyright ©️ Ashokanmanas ™️ all rights are reserved</p>
    </div>
  );
}

function HomeHub({ setHall, setView, lang, query }) {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10">
      <div className="relative rounded-[70px] bg-[#065F46] p-12 text-center text-white shadow-2xl overflow-hidden cursor-pointer"
           onClick={() => { SoundEngine.init(); SoundEngine.playHeart(); }}>
        <div className="relative z-10 space-y-4">
          <Heart size={64} className="text-emerald-300 mx-auto animate-pulse" fill="currentColor" />
          <h2 className="text-4xl font-black uppercase tracking-tighter">Safe Interaction</h2>
          <p className="text-[10px] text-emerald-200/40 font-black uppercase tracking-[0.5em] italic">Click the heart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {HALLS.map(h => (
          <button key={h.id} onClick={() => setHall(h)} className="p-8 bg-white rounded-[50px] shadow-sm hover:shadow-xl transition-all text-left flex items-center gap-6 border border-emerald-50 group">
            <div className={`p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform`}><h.icon size={32} /></div>
            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{lang === 'en' ? h.label : h.te}</h3>
          </button>
        ))}
      </div>
    </div>
  );
}

function HallView({ hall, onBack, userData, user, lang, query, setView }) {
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const qPosts = collection(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages');
    return onSnapshot(qPosts, (snap) => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt - a.createdAt)));
  }, [hall.id]);

  const send = async () => {
    if (!msg.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages'), {
      uid: user.uid, text: msg, createdAt: serverTimestamp(), reported: false, likes: 0
    });
    setMsg(""); SoundEngine.playHeart();
  };

  if (hall.expertOnly && !userData?.isExpert) return <ExpertGate setView={setView} onBack={onBack} />;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-10 pb-32">
      <button onClick={onBack} className="text-emerald-800 font-black uppercase text-xs">← Back to Hub</button>
      <div className="p-8 bg-emerald-900 text-white rounded-[60px] shadow-2xl relative overflow-hidden">
        <h3 className="font-black uppercase tracking-widest text-[10px] mb-2 opacity-50 flex items-center gap-2"><Sparkles size={14}/> Sanctuary Guidance</h3>
        <p className="font-bold text-lg leading-relaxed italic">"{lang === 'en' ? (hall.welcome || "") : (WELCOME_TE[hall.id] || "")}"</p>
      </div>

      <div className="p-6 bg-white rounded-[45px] shadow-sm border border-emerald-100 flex gap-4">
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Share awareness..." className="flex-1 bg-transparent border-none outline-none resize-none h-20 text-sm font-bold" />
        <button onClick={send} className="self-end p-5 bg-emerald-800 text-white rounded-3xl shadow-xl active:scale-95"><Send size={24}/></button>
      </div>

      <div className="space-y-4">
        {posts.map(p => (
          <div key={p.id} className={`p-8 bg-white rounded-[45px] shadow-sm border border-emerald-50 flex flex-col gap-4 group`}>
            <p className="text-base font-bold leading-relaxed">{p.text}</p>
            <div className="flex items-center justify-between pt-4 border-t border-black/5">
               <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', hall.id, 'messages', p.id), { likes: (p.likes || 0) + 1 })} className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase"><ThumbsUp size={14}/> Support {p.likes || 0}</button>
               <span className="text-[9px] font-black opacity-30 uppercase">{p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabView({ lang, isSustainer, setView }) {
  if (!isSustainer) return (
    <div className="bg-emerald-950 p-16 rounded-[100px] text-center text-white space-y-10 shadow-2xl">
       <div className="w-32 h-32 bg-white/10 rounded-[50px] mx-auto flex items-center justify-center"><CreditCard size={64} className="text-emerald-400" /></div>
       <h2 className="text-5xl font-black tracking-tighter uppercase leading-none text-white">Maintenance Access</h2>
       <p className="text-lg font-bold opacity-60 leading-relaxed max-w-sm mx-auto italic">To access the Wellness Lab tools, a one-time maintenance contribution is required to keep our servers alive.</p>
       <button onClick={() => setView('profile')} className="px-16 py-6 bg-emerald-400 text-emerald-950 rounded-full font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Contribute to Sanctuary</button>
    </div>
  );
  return (
    <div className="space-y-10 pb-32">
       <div className="text-center mb-6"><h2 className="text-4xl font-black uppercase tracking-tighter text-emerald-950">Awareness Lab<sup>™</sup></h2></div>
       <StationCard icon={Flame} title="Burn Vault" te="Trauma Release" onClick={() => {}} color="bg-emerald-50/50" />
       <StationCard icon={Wind} title="Prana Breath" te="Breath Sync" onClick={() => {}} color="bg-emerald-50/50" />
       <StationCard icon={Sparkles} title="Panchabhoota" te="Element Align" onClick={() => {}} color="bg-emerald-50/50" />
    </div>
  );
}

function LegalView({ lang, query }) {
  return (
    <div className="space-y-6 pb-40 animate-in fade-in">
       <div className="text-center mb-12">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-emerald-950">Sanctuary Code<sup>™</sup></h2>
          <p className="text-[10px] font-black text-emerald-600/40 uppercase mt-2 tracking-widest italic text-center leading-relaxed">ashokamanas ™️ Copyright ©️ at ashokamanas ™️ all the rights reserved</p>
       </div>
       {LEGAL_DATA.map((p, idx) => (
         <LegalTile key={idx} title={p.t} text={p.m} />
       ))}
    </div>
  );
}

function LegalTile({ title, text }) {
  const [o, setO] = useState(false);
  return (
    <div className="bg-white rounded-[45px] border border-black/5 overflow-hidden shadow-sm">
      <button onClick={()=>setO(!o)} className="w-full p-8 flex justify-between font-black uppercase text-sm text-emerald-950 text-left items-center group">
        <span>{title}</span><ChevronDown className={`transition-transform duration-500 ${o ? 'rotate-180' : ''}`} />
      </button>
      {o && <div className="p-10 border-t border-emerald-50 text-[15px] text-gray-500 leading-relaxed font-bold whitespace-pre-wrap">{text}</div>}
    </div>
  );
}

function ProfileView({ userData, setView, user }) {
  const sustain = async () => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), { isSustainer: true });
    alert("Thank you. You are now a Sustainer of the Sanctuary.");
  };
  return (
    <div className="space-y-12 pb-40">
       <div className="bg-[#064E3B] text-white p-16 rounded-[100px] text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="w-28 h-28 bg-white/10 rounded-[45px] mx-auto flex items-center justify-center border border-white/20"><User size={56} /></div>
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Status Rank</h2>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10"><p className="text-4xl font-black leading-none">{userData?.streak || 0}</p><p className="text-[10px] uppercase font-black opacity-30 mt-2">Streak</p></div>
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10"><p className="text-3xl font-black leading-none">{userData?.isSustainer ? 'Sustainer' : 'Seeker'}</p><p className="text-[10px] uppercase font-black opacity-30 mt-2">Level</p></div>
            </div>
          </div>
       </div>
       {!userData?.isSustainer && (
         <div className="bg-white p-12 rounded-[70px] shadow-xl border-2 border-emerald-100 text-center space-y-6">
            <h3 className="text-3xl font-black uppercase flex items-center justify-center gap-3 text-emerald-950"><CreditCard size={36} className="text-blue-500"/> Support the Sanctuary</h3>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Contribute a maintenance fee to keep our awareness mission alive and glitch-free.</p>
            <button onClick={sustain} className="w-full py-8 bg-emerald-800 text-white rounded-full font-black text-2xl shadow-lg active:scale-95 transition-transform uppercase tracking-tighter">CONTRIBUTE ₹99</button>
            <p className="text-[10px] font-bold opacity-30 italic leading-none text-center uppercase">Contribution covers server infrastructure efforts only.</p>
         </div>
       )}
    </div>
  );
}

// --- SHARED HELPERS ---
function NavBtn({ icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-5 rounded-[38px] transition-all duration-500 ${active ? 'bg-[#064E3B] text-white shadow-2xl scale-125' : 'text-emerald-800/30'}`}>
      <Icon size={28} />
    </button>
  );
}

function StationCard({ icon: Icon, title, te, onClick, color }) {
  return (
    <button onClick={onClick} className={`p-12 ${color} rounded-[80px] flex items-center gap-10 text-left group border border-black/5 shadow-sm active:scale-95 transition-all`}>
       <div className={`p-6 rounded-[35px] bg-white shadow-xl`}><Icon size={44} className="text-emerald-900" /></div>
       <div><h3 className="text-4xl font-black uppercase tracking-tighter leading-none text-emerald-950">{title}</h3><p className="text-[11px] font-black opacity-30 uppercase mt-3 italic">{te}</p></div>
    </button>
  );
}

function ExpertGate({ setView, onBack }) {
  return (
    <div className="bg-white p-12 rounded-[60px] text-center space-y-10 shadow-2xl border border-emerald-100">
      <Lock size={80} className="mx-auto text-emerald-400 opacity-20" />
      <h2 className="text-4xl font-black uppercase tracking-tighter">Guide Access Only</h2>
      <button onClick={() => { setView('profile'); onBack(); }} className="px-14 py-5 bg-emerald-800 text-white rounded-full font-black uppercase text-xs tracking-widest shadow-xl">Verification Portal</button>
    </div>
  );
}

const SOSModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-[#310404]/98 backdrop-blur-[100px] z-[1000] flex flex-col items-center justify-center p-8 text-white text-center animate-in zoom-in duration-500">
    <Siren size={120} className="text-white mb-10" />
    <h2 className="text-8xl font-black uppercase mb-8 tracking-tighter leading-none">Emergency SOS</h2>
    <div className="w-full max-w-sm space-y-6">
      <a href="tel:108" className="block py-9 bg-red-600 rounded-[60px] font-black text-5xl shadow-2xl border-b-[14px] border-red-900">CALL 108</a>
      <a href="tel:14416" className="block py-9 bg-blue-600 rounded-[60px] font-black text-2xl border-b-[12px] border-blue-900">Tele-MANAS</a>
    </div>
    <button onClick={onClose} className="mt-24 text-gray-500 font-black uppercase tracking-[0.4em] underline decoration-red-600 underline-offset-[20px] hover:text-white transition-colors">Return to Sanctuary</button>
  </div>
);

const WELCOME_TE = {
  General: "ఎంపతీ హాల్‌కు స్వాగతం. మీ ప్రయాణాన్ని అజ్ఞాతంగా పంచుకోండి.",
  Clinical: "గౌరవనీయ నిపుణులకు స్వాగతం. నిపుణులకు మాత్రమే ఉద్దేశించిన ప్రదేశం ఇది.",
  Caregiver: "సపోర్టర్స్ పాత్‌కు స్వాగతం. ఇక్కడ మేము మిమ్మల్ని సపోర్ట్ చేస్తాము.",
  Addiction: "రికవరీ గ్రోవ్‌కు స్వాగతం. మీ స్వస్థత కోసం పూర్తి అజ్ఞాతం మా పునాది.",
  SideEffects: "మెడికేషన్ ఇన్‌సైట్ హాల్‌కు స్వాగతం. మీ వైద్యుడిని సంప్రదించండి.",
  Stories: "నా కథ హాల్‌కు స్వాగతం. మీ కథ ఇతరులకు స్ఫూర్తినిస్తుంది."
};

