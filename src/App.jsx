import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, ChevronRight, Copy, Check, Lock, TreePine, Info, 
  Trash2, FileText, Search, RefreshCw, Pin, Moon, Sun, Smile, Meh, Frown
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, 
  arrayUnion, increment, serverTimestamp, setDoc, getDoc, deleteDoc, 
  orderBy, limit 
} from 'firebase/firestore';

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
const appId = "default-app-id"; 

// --- CONSTANTS ---
const APP_NAME = "AshokaManas";
const ADMIN_EMAIL = "ashokamanas11@gmail.com";
const POSTS_COLLECTION = 'ashoka_posts_v44'; // KEEPING DATA SAFE
const POST_LIMIT = 50; // Increased limit for better UX

// --- SECURITY KEYS ---
const KEY_ADMIN = "ASHOKA-SUPER-ADMIN-99"; 
const KEY_DOCTOR = "ASHOKA-DOC-VERIFY"; 

const BLOCKED_WORDS = [
  'suicide', 'kill myself', 'die', 'end it', 'hang myself', 'poison', 'cut myself', 
  'self-harm', 'hurt myself', 'ending my life',
  'kidnap', 'kidnapped', 'abduct', 'ransom', 'hostage', 
  'murder', 'shoot', 'gun', 'knife', 'bomb', 'stab',
  'abuse', 'molest', 'rape', 'assault', 'violence', 'humiliate', 'torture',
  'fuck', 'shit', 'bitch', 'asshole', 'sex', 'porn', 'nude',
  'stupid', 'idiot', 'loser', 'ugly', 'fat', 'retard',
  'ఆత్మహత్య', 'చంపడం', 'దూషించడం'
];

const TRANSLATIONS = {
  en: {
    appName: "AshokaManas",
    clinical: "Clinical Hub",
    adverse: "Adverse Effects",
    general: "General Support",
    addiction: "Addiction Support",
    child: "Child & Adolescent",
    story: "My Story",
    caregiver: "Caregiver Burden",
    newPost: "New Post",
    discuss: "Discussion",
    agree: "I Agree & Enter",
    legalTitle: "Medical Disclaimer",
    legalText: "Peer support only. Not medical advice. In emergency, call 108.",
    verifyTitle: "Are you a Doctor?",
    verifyText: "Get the Blue Badge.",
    verifyBtn: "Verify Profile",
    adminBtn: "Admin Dashboard",
    zeroTolerance: "ZERO TOLERANCE: Child Abuse, Sexual Abuse, & Humiliation are banned.",
    searchPlace: "Search topics...",
    pin: "Pin Post"
  },
  te: {
    appName: "అశోకమనస్",
    clinical: "క్లినికల్ హబ్",
    adverse: "దుష్ప్రభావాలు",
    general: "సాధారణ మద్దతు",
    addiction: "వ్యసన విముక్తి",
    child: "పిల్లలు & కౌమారదశ",
    story: "నా కథ",
    caregiver: "సంరక్షకుల భారం",
    newPost: "పోస్ట్ చేయండి",
    discuss: "చర్చ",
    agree: "నేను అంగీకరిస్తున్నాను",
    legalTitle: "నిరాకరణ",
    legalText: "వైద్య సేవ కాదు. 108 కి కాల్ చేయండి.",
    verifyTitle: "ధృవీకరించండి",
    verifyBtn: "అభ్యర్థన",
    adminBtn: "అడ్మిన్ ప్యానెల్",
    zeroTolerance: "గమనిక: లైంగిక వేధింపులు మరియు హింస పూర్తిగా నిషేధించబడ్డాయి.",
    searchPlace: "వెతకండి...",
    pin: "పిన్ చేయండి"
  }
};

const SPACES = [
  { id: 'General', key: 'general', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Clinical', key: 'clinical', icon: Stethoscope, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'Caregiver', key: 'caregiver', icon: HeartHandshake, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Addiction', key: 'addiction', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'ChildAdolescent', key: 'child', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'Adverse', key: 'adverse', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' }, 
  { id: 'Stories', key: 'story', icon: ScrollText, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
];

// --- UTILS (Bulletproof Time Fix) ---
const getTimeAgo = (timestamp) => {
  // Safety Check: If time is missing or not ready yet, say "Just now"
  if (!timestamp || typeof timestamp.toDate !== 'function') return 'Just now';
  
  const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  
  return "Just now";
};


// Deterministic Avatar Color
const getAvatarColor = (uid) => {
  const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// --- COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const variants = {
    primary: "bg-emerald-700 text-white shadow-md hover:bg-emerald-800 dark:bg-emerald-600",
    secondary: "bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50 dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-100",
    ghost: "text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-slate-800",
    space: "w-full justify-start text-left hover:bg-white/60 text-emerald-900 font-medium dark:text-slate-200 dark:hover:bg-slate-800",
    spaceActive: "w-full justify-start text-left bg-white text-emerald-900 font-bold border border-emerald-200 shadow-sm dark:bg-slate-800 dark:text-white dark:border-slate-600"
  };
  return <button onClick={onClick} disabled={disabled} className={`px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}>{children}</button>;
};

const AppLogo = ({size}) => <div className={`flex items-center justify-center text-emerald-800 dark:text-emerald-400 ${size==='lg'?'text-6xl':'text-2xl'}`}><TreePine size={size==='lg'?64:24} /></div>;

const MoodMeter = () => (
  <div className="flex justify-between bg-white dark:bg-slate-800 p-3 rounded-xl mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 self-center">Mood?</span>
    <button className="text-2xl hover:scale-125 transition-transform" onClick={()=>alert("It's okay to feel sad. We are here.")}>😢</button>
    <button className="text-2xl hover:scale-125 transition-transform" onClick={()=>alert("Take a deep breath. You got this.")}>😐</button>
    <button className="text-2xl hover:scale-125 transition-transform" onClick={()=>alert("Glad you are feeling okay!")}>🙂</button>
    <button className="text-2xl hover:scale-125 transition-transform" onClick={()=>alert("That is great news!")}>😀</button>
  </div>
);

// --- MODALS ---
const VerificationModal = ({ user, onClose }) => {
  const [code, setCode] = useState("");
  const handleVerify = async () => {
    if (!user) return;
    let updateData = { verifiedAt: Date.now() };
    let msg = "";
    
    if (code === KEY_ADMIN) { updateData = { ...updateData, isExpert: true, isAdmin: true }; msg = "✅ Admin Access Granted."; }
    else if (code === KEY_DOCTOR) { updateData = { ...updateData, isExpert: true, isAdmin: false }; msg = "✅ Doctor Verification Successful."; }
    else { window.location.href = `mailto:${ADMIN_EMAIL}?subject=Verify Me&body=ID: ${user.uid}`; return; }

    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), updateData, { merge: true }); alert(msg); onClose(); window.location.reload(); } 
    catch (e) { alert("Error: " + e.message); }
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400 mb-2">Verify Profile</h3>
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter Secret Key" className="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg mb-4 text-center font-mono dark:text-white" />
        <Button onClick={handleVerify}>Verify</Button>
        <p className="text-[10px] text-slate-400 mt-4">No key? Click verify to email admin.</p>
      </div>
    </div>
  );
};

const LegalGateModal = ({ onAccept, lang }) => (
  <div className="fixed inset-0 bg-emerald-950/95 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-emerald-100 dark:border-slate-800">
      <div className="flex flex-col items-center justify-center mb-6"><AppLogo size="lg" /><h2 className="text-3xl font-bold text-center text-emerald-900 dark:text-emerald-400 mt-4">{TRANSLATIONS[lang].appName}</h2></div>
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-sm text-red-900"><p className="font-bold">{TRANSLATIONS[lang].zeroTolerance}</p></div>
      <div className="bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl p-4 mb-6 text-sm text-emerald-900 dark:text-slate-300 space-y-3"><p>{TRANSLATIONS[lang].legalText}</p></div>
      <Button onClick={onAccept} className="w-full py-4 text-lg">{TRANSLATIONS[lang].agree}</Button>
    </div>
  </div>
);

const SOSModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-rose-950/98 z-[10000] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 relative">
      <div className="mt-4"><AlertTriangle size={56} className="text-rose-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-slate-900 mb-2">Safety Alert</h3><p className="text-slate-600 mb-6 text-sm">We detected unsafe language or contact info. This is a protected space.</p><div className="space-y-3"><a href="tel:108" className="block w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><Siren size={24} /> Call 108 / 988</a><button onClick={onClose} className="block w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200">Go Back & Edit</button></div></div>
    </div>
  </div>
);

// --- MAIN APP ---
export default function AshokaManasPlatform() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isExpert: false }); 
  const [hasAgreed, setHasAgreed] = useState(false);
  const [lang, setLang] = useState('en'); 
  const [activeSpace, setActiveSpace] = useState('General');
  const [view, setView] = useState('feed'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Data State
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // Toggle Dark Mode
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

  // Auth & Profile
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid), (snap) => {
          if (snap.exists()) setUserData(snap.data());
          else setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid), { isExpert: false });
        });
      }
    });
  }, []);

  // Data Fetch (V44 Collection)
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION), orderBy('createdAt', 'desc'), limit(POST_LIMIT)); 
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(data);
    });
    return () => unsub();
  }, []);

  const checkSafety = (text) => {
    const lower = text.toLowerCase();
    if (BLOCKED_WORDS.some(w => lower.includes(w))) { setShowSOS(true); return false; }
    if (/\b\d{10}\b/.test(text) || /(https?:\/\/[^\s]+)/.test(text)) { setShowSOS(true); return false; }
    return true;
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    if (!checkSafety(newPostContent)) return;
    setIsPosting(true);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION), {
      content: newPostContent, space: activeSpace, authorId: user?.uid, isExpert: userData.isExpert, isPinned: false, likes: 0, comments: [], createdAt: serverTimestamp()
    });
    setNewPostContent(''); setView('feed'); setIsPosting(false);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !checkSafety(newComment)) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION, selectedPost.id);
    await updateDoc(ref, { comments: arrayUnion({ text: newComment, authorId: user?.uid, isExpert: userData.isExpert, createdAt: Date.now() }) });
    setNewComment('');
  };

  const handleDelete = async (e, post) => {
    e.stopPropagation();
    if(!confirm("Delete this post permanently?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION, post.id));
  };

  const handlePin = async (e, post) => {
    e.stopPropagation();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION, post.id);
    await updateDoc(ref, { isPinned: !post.isPinned });
  };

  if (!hasAgreed) return <LegalGateModal onAccept={() => setHasAgreed(true)} lang={lang} />;

  const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
  const filteredPosts = posts.filter(p => p.space === activeSpace && (searchQuery ? p.content.toLowerCase().includes(searchQuery.toLowerCase()) : true));
  // Sort: Pinned first, then Newest
  filteredPosts.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);

  // --- LEGAL PAGE ---
  if (view === 'legal') return (
    <div className="flex-1 bg-white dark:bg-slate-900 min-h-screen p-6 font-sans text-slate-900 dark:text-slate-100">
      <button onClick={() => setView('feed')} className="mb-6 flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold"><ChevronRight className="rotate-180"/> Back</button>
      <h1 className="text-2xl font-bold mb-4">Legal & Safety</h1>
      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-400">
        <section><h2 className="text-lg font-bold text-teal-700 dark:text-teal-400">1. Constitution</h2><p>DO share safely. DON'T abuse or share numbers.</p></section>
        <section><h2 className="text-lg font-bold text-teal-700 dark:text-teal-400">2. Privacy</h2><p>Anonymous. No data sold.</p></section>
        <section><h2 className="text-lg font-bold text-teal-700 dark:text-teal-400">3. Grievance</h2><p>Contact: {ADMIN_EMAIL}</p></section>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      {showVerify && <VerificationModal user={user} onClose={() => setShowVerify(false)} />}

      <button onClick={() => setShowSOS(true)} className="fixed bottom-12 left-6 z-[9000] w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-300 flex items-center justify-center animate-pulse border-4 border-white dark:border-slate-800"><Siren size={24}/></button>
      <div className="fixed bottom-0 left-0 right-0 bg-amber-100 text-amber-900 text-[10px] p-1 text-center z-[8000] font-bold border-t border-amber-200">⚠️ Not a medical service. For emergencies, click SOS.</div>

      <div className={`fixed inset-y-0 left-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-emerald-100 dark:border-slate-800 z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 shadow-xl`}>
        <div className="p-6 border-b border-emerald-100 dark:border-slate-800 flex justify-between items-center">
          <span className="font-bold text-emerald-900 dark:text-emerald-400 text-lg flex gap-2 items-center"><AppLogo/> {APP_NAME}</span>
          <button className="md:hidden text-emerald-800 dark:text-emerald-400" onClick={() => setMobileMenuOpen(false)}><X size={24}/></button>
        </div>
        <div className="p-4 overflow-y-auto h-full pb-20">
          <div className="flex justify-between items-center mb-4 px-2">
             <span className="text-xs font-bold text-slate-400">THEME</span>
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">{darkMode ? <Sun size={16}/> : <Moon size={16}/>}</button>
          </div>
          {SPACES.map(s => (
            <Button key={s.id} variant={activeSpace === s.id ? 'spaceActive' : 'space'} onClick={() => { setActiveSpace(s.id); setMobileMenuOpen(false); setView('feed'); }} className="mb-2">
              <s.icon size={18} /> {t(s.key)}
            </Button>
          ))}
          <div className="mt-6 pt-6 border-t border-emerald-100 dark:border-slate-800 space-y-2">
            <Button variant="ghost" onClick={() => { setView('legal'); setMobileMenuOpen(false); }} className="text-xs w-full"><FileText size={14}/> Rules & Safety</Button>
            {!userData?.isExpert && <Button variant="secondary" onClick={() => setShowVerify(true)} className="text-xs w-full">{t('verifyBtn')}</Button>}
          </div>
        </div>
      </div>

      <div className="flex-1 md:ml-64 relative z-0 pb-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 p-3 flex flex-col gap-3 sticky top-0 z-30 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3"><button className="md:hidden p-2 bg-emerald-100 dark:bg-slate-800 rounded text-emerald-800 dark:text-emerald-400" onClick={() => setMobileMenuOpen(true)}><Menu size={20}/></button><h1 className="font-bold text-emerald-900 dark:text-white text-lg">{t(activeSpaceObj?.key)}</h1></div>
            <div className="flex gap-2"><button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="px-3 py-1 bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 rounded-lg text-xs font-bold"><Globe size={14}/></button><Button size="sm" onClick={() => setView('create')}><PenSquare size={16}/> {t('newPost')}</Button></div>
          </div>
          {view === 'feed' && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder={t('searchPlace')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
            </div>
          )}
        </div>

        {view === 'feed' && (
          <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto">
            <MoodMeter />
            {/* CONTEXTUAL BANNER */}
            {activeSpace === 'Adverse' && <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 font-bold">⚠️ Never stop medication without consulting your doctor.</div>}
            {activeSpace === 'Clinical' && <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800 font-bold">🔒 Professional Space. Strict Confidentiality.</div>}

            {filteredPosts.map(post => {
              const colorClass = getAvatarColor(post.authorId || 'anon');
              return (
                <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border transition-all relative ${post.isPinned ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/20' : 'border-emerald-100 dark:border-slate-700 hover:border-emerald-300'}`}>
                  {post.isPinned && <Pin size={16} className="absolute top-4 right-4 text-amber-500 fill-amber-500 rotate-45" />}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${colorClass}`}>{post.isExpert ? 'DR' : 'AN'}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">{post.isExpert && <Shield size={10} className="text-sky-500 fill-sky-500"/>} {post.isExpert ? 'Doctor' : 'Anonymous'}</span>
                        <span className="text-[10px] text-slate-400">{getTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(userData?.isAdmin) && <button onClick={(e) => handlePin(e, post)} className="text-slate-300 hover:text-amber-500"><Pin size={14}/></button>}
                      {(user?.uid === post.authorId || userData?.isAdmin) && <button onClick={(e) => handleDelete(e, post)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Heart size={12}/> {post.likes || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12}/> {post.comments?.length || 0}</span>
                  </div>
                </div>
              );
            })}
            <div className="text-center py-8"><button onClick={() => window.location.reload()} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-xs text-slate-500 flex items-center gap-2 mx-auto"><RefreshCw size={12}/> Check for new posts</button></div>
          </div>
        )}

        {view === 'create' && (
          <div className="p-4 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-700">
              <h2 className="font-bold text-emerald-900 dark:text-white mb-4">{t('newPost')}</h2>
              <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full h-40 border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white p-4 rounded-xl mb-4 outline-none focus:border-emerald-500 whitespace-pre-wrap" placeholder={t('writePlace')} />
              <div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setView('feed')}>Cancel</Button><Button onClick={handleCreatePost} disabled={isPosting}>{isPosting ? <Loader className="animate-spin" size={16}/> : 'Publish'}</Button></div>
            </div>
          </div>
        )}

        {view === 'post-detail' && selectedPost && (
          <div className="p-4 pb-24 max-w-3xl mx-auto">
            <button onClick={() => setView('feed')} className="mb-4 text-emerald-600 flex items-center gap-1 text-sm font-bold"><ChevronRight className="rotate-180" size={16}/> Back</button>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-700 mb-4">
               <div className="flex items-center gap-2 mb-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(selectedPost.authorId)}`}>{selectedPost.isExpert ? 'DR' : 'AN'}</div><div className="text-xs text-slate-400">{getTimeAgo(selectedPost.createdAt)}</div></div>
               <p className="text-lg font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>
            <div className="space-y-3">
              {selectedPost.comments?.map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border ${c.authorId === user?.uid ? 'bg-emerald-50 border-emerald-100 ml-8' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 mr-8'}`}>
                  {c.isExpert && <div className="text-[10px] text-sky-600 font-bold mb-1 flex gap-1 items-center"><Shield size={10}/> Doctor</div>}
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.text}</p>
                  <div className="text-[10px] text-slate-300 mt-2 text-right">{getTimeAgo({toDate: ()=>new Date(c.createdAt)})}</div>
                </div>
              ))}
            </div>
            <div className="fixed bottom-8 right-0 md:left-64 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex gap-2 z-[9000] w-full md:w-auto">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-xl px-4 outline-none" placeholder="Reply..." />
              <Button onClick={handleComment}><Send size={18}/></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

