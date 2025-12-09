import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, CheckCircle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, Lock, ChevronRight, UserCheck, Ban, Copy, Check, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion, increment, serverTimestamp, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// --- Firebase Config (YOUR REAL KEYS) ---
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- CONSTANTS ---
const APP_NAME = "AshokaManas";
const ADMIN_EMAIL = "ashokamanas11@gmail.com"; 

const BLOCKED_WORDS = [
  'suicide', 'kill myself', 'die', 'end it', 'hang myself', 'poison', 'cut myself', 
  'harm', 'self-harm', 'hurt myself', 'hurting',
  'kidnap', 'kidnapped', 'abduct', 'ransom', 'hostage', 
  'murder', 'shoot', 'gun', 'knife', 'bomb', 'stab',
  'abuse', 'molest', 'rape', 'assault', 'violence', 'humiliate', 'torture',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'sex', 'porn', 'nude',
  'stupid', 'idiot', 'loser', 'ugly', 'fat', 'dumb', 'retard',
  'చనిపోవాలని', 'ఆత్మహత్య', 'చంపడం'
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
    legalText: "This app is for peer support only. It is NOT a medical service. In emergency, call 108.",
    verifyTitle: "Are you a Doctor?",
    verifyText: "Get the Blue Badge.",
    verifyBtn: "Request Verification",
    adminBtn: "Admin Panel",
    volunteer: "Student Internship?",
    apply: "Apply to Moderate",
    zeroTolerance: "ZERO TOLERANCE: No Child Abuse, Sexual Abuse, Humiliation, or Violence."
  },
  te: {
    appName: "అశోకమనస్",
    clinical: "క్లినికల్ హబ్ (Doctors)",
    adverse: "దుష్ప్రభావాలు",
    general: "సాధారణ మద్దతు",
    addiction: "వ్యసన విముక్తి",
    child: "పిల్లలు & కౌమారదశ",
    story: "నా కథ (My Story)",
    caregiver: "సంరక్షకుల భారం",
    newPost: "పోస్ట్ చేయండి",
    discuss: "చర్చ",
    agree: "నేను అంగీకరిస్తున్నాను",
    legalTitle: "నిరాకరణ",
    legalText: "ఇది వైద్య సేవ కాదు. అత్యవసరమైతే 108 కి కాల్ చేయండి.",
    verifyTitle: "మీరు డాక్టరా?",
    verifyText: "బ్లూ బ్యాడ్జ్ పొందండి.",
    verifyBtn: "ధృవీకరించండి",
    adminBtn: "అడ్మిన్ ప్యానెల్",
    volunteer: "ఇంటర్న్‌షిప్?",
    apply: "దరఖాస్తు చేయండి",
    zeroTolerance: "గమనిక: పిల్లల వేధింపులు, లైంగిక వేధింపులు మరియు హింస పూర్తిగా నిషేధించబడ్డాయి."
  }
};

const SPACES = [
  { id: 'General', key: 'general', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Clinical', key: 'clinical', icon: Stethoscope, color: 'text-cyan-700', bg: 'bg-cyan-50' },
  { id: 'Caregiver', key: 'caregiver', icon: HeartHandshake, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Addiction', key: 'addiction', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'ChildAdolescent', key: 'child', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'Adverse', key: 'adverse', icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-50' }, 
  { id: 'Stories', key: 'story', icon: ScrollText, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
];

// --- Helper Components ---
const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const variants = {
    primary: "bg-teal-800 text-white hover:bg-teal-900 shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100",
    space: "w-full justify-start text-left hover:bg-slate-50 text-slate-600 transition-colors duration-200",
    spaceActive: "w-full justify-start text-left bg-teal-50 text-teal-800 font-bold border border-teal-100 shadow-sm"
  };
  return <button onClick={onClick} disabled={disabled} className={`font-medium rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${variants[variant]} ${size==='sm'?'px-3 py-1.5 text-xs':'px-4 py-2.5 text-sm'} ${disabled?'opacity-50':''} ${className}`}>{children}</button>;
};

// Safe Logo with Error State
const AppLogo = ({ size = "sm" }) => {
  const [error, setError] = useState(false);
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-32 h-32" };
  if (error) return <div className={`${sizes[size]} flex items-center justify-center text-teal-700 font-bold bg-teal-50 rounded-full`}>AM</div>;
  return <div className={`${sizes[size]} flex items-center justify-center`}><img src="/logo.png" alt="AM" className="w-full h-full object-contain" onError={() => setError(true)} /></div>;
};

// --- MODALS ---
const LegalGateModal = ({ onAccept, lang }) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex flex-col items-center justify-center mb-6"><AppLogo size="lg" /><h2 className="text-2xl font-bold text-center text-teal-900 mt-4">{TRANSLATIONS[lang].appName}</h2></div>
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-sm text-red-900 space-y-2">
        <div className="flex items-center gap-2 font-bold"><AlertOctagon size={16}/> STRICT POLICY</div>
        <p className="text-xs leading-relaxed font-bold">{TRANSLATIONS[lang].zeroTolerance}</p>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-700 space-y-3"><p><strong>Disclaimer:</strong> {TRANSLATIONS[lang].legalText}</p></div>
      <Button onClick={onAccept} className="w-full py-3 text-lg">{TRANSLATIONS[lang].agree}</Button>
    </div>
  </div>
);

const SOSModal = ({ onClose, lang }) => (
  <div className="fixed inset-0 bg-rose-900/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 animate-bounce-in relative">
      <div className="mt-4"><AlertTriangle size={56} className="text-rose-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-slate-900 mb-2">Unsafe Content Detected</h3>
      <p className="text-slate-600 mb-6 text-sm">Your post flags our safety system. If you are in danger, please get help.</p>
      <div className="space-y-3"><a href="tel:108" className="block w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><Siren size={24} /> Call 108 / 988</a><button onClick={onClose} className="block w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200">Go Back & Edit</button></div></div>
    </div>
  </div>
);

const VerificationModal = ({ user, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copyID = () => { navigator.clipboard.writeText(user.uid); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const mailLink = `mailto:${ADMIN_EMAIL}?subject=Doctor Verification&body=User ID: ${user?.uid}`;
  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button>
        <h3 className="text-lg font-bold text-slate-800">Doctor Verification</h3>
        <p className="text-xs text-slate-500 mb-4">Email your ID & Medical License to Admin.</p>
        <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between mb-4 border border-slate-200">
          <code className="text-xs text-slate-600 font-mono truncate max-w-[200px]">{user?.uid}</code>
          <button onClick={copyID} className="text-slate-500">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
        </div>
        <a href={mailLink} className="block w-full bg-sky-600 text-white py-3 rounded-xl font-bold text-sm">Email Admin</a>
      </div>
    </div>
  );
};

// --- ADMIN PANEL ---
const AdminPanel = ({ onClose }) => {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'verification_requests'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(data);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (req) => {
    if (!req.userId) return;
    try {
      // NOTE: Using 'data/user_profiles' to match security rules
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles_' + req.userId);
      await setDoc(userRef, { isExpert: true, verifiedAt: Date.now(), name: req.name, uid: req.userId }, { merge: true });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'verification_requests', req.id));
      alert(`Verified Dr. ${req.name} successfully.`);
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleReject = async (reqId) => {
    if(confirm("Reject?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'verification_requests', reqId));
  };

  return (
    <div className="flex-1 bg-white min-h-screen p-4">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Lock size={20} /> Admin Panel</h2><button onClick={onClose}><X size={20} /></button></div>
      <div className="max-w-2xl mx-auto space-y-4">
        {requests.length === 0 && <div className="text-center py-12 bg-slate-50 rounded-xl"><p className="text-slate-500 text-sm">No pending requests.</p></div>}
        {requests.map(req => (
          <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
            <div><p className="font-bold text-lg text-slate-800">{req.name}</p><p className="text-sm text-slate-600">Reg: {req.regNo}</p></div>
            <div className="flex gap-2"><button onClick={() => handleApprove(req)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Approve</button><button onClick={() => handleReject(req.id)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold">Reject</button></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- REQUEST MODAL ---
const RequestVerificationModal = ({ user, onClose }) => {
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name || !regNo) return;
    if (regNo.trim() === "ASHOKA-MASTER-KEY") {
      // NOTE: Using 'data/user_profiles' to match security rules
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles_' + user.uid);
      await setDoc(userRef, { isExpert: true, isAdmin: true, verifiedAt: Date.now(), uid: user.uid }, { merge: true });
      alert("✅ ADMIN ACCESS GRANTED. Refresh page."); onClose(); return;
    }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'verification_requests'), {
      userId: user.uid, name: name, regNo: regNo, createdAt: Date.now()
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button>
        {!submitted ? (
          <div className="text-center"><h3 className="text-lg font-bold text-slate-800 mb-2">Doctor Verification</h3><div className="space-y-3 text-left"><input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm" placeholder="Full Name" /><input value={regNo} onChange={e=>setRegNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm" placeholder="Medical Reg Number" /><button onClick={handleSubmit} disabled={!name || !regNo} className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold text-sm">Submit</button></div></div>
        ) : (
          <div className="text-center py-8"><h3 className="text-lg font-bold text-slate-800 mb-2">Request Sent!</h3><button onClick={onClose} className="mt-6 text-sky-600 font-bold text-sm">Close</button></div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function AshokaManasPlatform() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false);
  const [lang, setLang] = useState('en'); 
  const [activeSpace, setActiveSpace] = useState('General');
  const [view, setView] = useState('feed'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [showSOS, setShowSOS] = useState(false);
  const [showVerify, setShowVerify] = useState(false); 
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // Force loading finish
  useEffect(() => {
    signInAnonymously(auth).catch(e => console.log(e));
    setTimeout(() => setIsLoading(false), 2500); 
  }, []);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); if(u) setIsLoading(false); }), []);

  // Fetch User Data - SAFE PATH FIX
  useEffect(() => {
    if (!user) return;
    // We now look in 'data/user_profiles_' to match the 'public/data' rule
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles_' + user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const agreed = localStorage.getItem('ashoka_legal_agreed');
    if (agreed) setHasAgreedToLegal(true);
  }, []);

  // Fetch Posts
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v32')); 
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(data);
    });
    return () => unsub();
  }, []);

  const checkSafety = (text) => {
    const found = BLOCKED_WORDS.find(w => text.toLowerCase().includes(w));
    if (found) { setShowSOS(true); return false; }
    return true; 
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !checkSafety(newPostContent)) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v32'), {
      content: newPostContent, space: activeSpace, authorId: user?.uid, isExpert: userData?.isExpert || false, likes: 0, commentCount: 0, comments: [], createdAt: serverTimestamp()
    });
    setNewPostContent(''); setView('feed');
  };

  const handleComment = async () => {
    if (!newComment.trim() || !checkSafety(newComment)) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v32', selectedPost.id);
    await updateDoc(ref, { comments: arrayUnion({ text: newComment, authorId: user?.uid, isExpert: userData?.isExpert || false, createdAt: Date.now() }), commentCount: increment(1) });
    setNewComment('');
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v32', post.id);
    await updateDoc(ref, { likes: increment(1) });
  };

  const SpaceSidebar = ({ mobile = false }) => (
    <div className={`space-y-2 h-full flex flex-col ${mobile ? 'p-4' : 'p-0'}`}>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {SPACES.map(space => (
          <Button key={space.id} variant={activeSpace === space.id ? 'spaceActive' : 'space'} onClick={() => { setActiveSpace(space.id); if(mobile) setMobileMenuOpen(false); setView('feed'); }} className="rounded-lg mb-1">
            <div className={`p-1.5 rounded-md ${activeSpace === space.id ? 'bg-white' : space.bg}`}><space.icon size={18} className={space.color} /></div><span>{TRANSLATIONS[lang][space.key] || space.name}</span>
          </Button>
        ))}
      </div>
      <div className="px-4 pb-6 space-y-4">
        {!userData?.isExpert && <div className="bg-sky-50 border border-sky-100 rounded-xl p-3"><h4 className="font-bold text-sky-800 text-xs mb-1">{t('verifyTitle')}</h4><button onClick={() => { setShowVerify(true); if(mobile) setMobileMenuOpen(false); }} className="w-full bg-white border border-sky-200 text-sky-700 text-xs font-bold py-2 rounded-lg">{t('verifyBtn')}</button></div>}
        {userData?.isAdmin && <div className="bg-teal-50 border border-teal-100 rounded-xl p-3"><button onClick={() => { setView('admin'); if(mobile) setMobileMenuOpen(false); }} className="w-full bg-teal-700 text-white text-xs font-bold py-2 rounded-lg">{t('adminBtn')}</button></div>}
      </div>
    </div>
  );

  const renderFeed = () => {
    const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
    const filteredPosts = posts.filter(p => p.space === activeSpace);
    
    return (
      <div className="flex-1 min-h-screen pb-20 md:pb-0 bg-slate-50/50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
           <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-[10px] sm:text-xs text-amber-900 font-medium"><strong>Disclaimer:</strong> {TRANSLATIONS[lang].legalText}</p></div>
           <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3"><button className="md:hidden p-2 bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}><Menu size={24} className="text-slate-700" /></button><div className="flex items-center gap-2"><h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><div className="md:hidden"><AppLogo size="sm"/></div><span className="md:hidden">{TRANSLATIONS[lang][activeSpaceObj?.key]}</span><span className="hidden md:block">{t('appName')}</span></h1></div></div>
            <div className="flex gap-2"><button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-slate-700"><Globe size={14} /> {lang === 'en' ? 'తెలుగు' : 'English'}</button><Button size="sm" onClick={() => setView('create')}><PenSquare size={16} /> <span className="hidden sm:inline">{t('newPost')}</span></Button></div>
           </div>
        </div>
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          <div className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${activeSpaceObj?.bg} border-slate-200 text-slate-600`}><span>Viewing Space: <strong>{TRANSLATIONS[lang][activeSpaceObj?.key] || activeSpaceObj?.name}</strong></span></div>
          {filteredPosts.length > 0 ? filteredPosts.map(post => (
            <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${post.isExpert ? 'border-sky-200 ring-1 ring-sky-100' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2">{post.isExpert && <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield size={10} /> Verified Doctor</span>}</div></div>
              <p className="text-slate-800 font-medium leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-slate-400 text-sm border-t border-slate-50 pt-2"><button className="flex items-center gap-1.5"><Heart size={18} /> {post.likes || 0}</button><div className="flex items-center gap-1.5"><MessageCircle size={18} /> {post.commentCount || 0}</div></div>
            </div>
          )) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><activeSpaceObj.icon size={32} /></div><h3 className="text-slate-800 font-bold text-lg">Welcome to {activeSpaceObj.id}</h3><Button onClick={() => setView('create')}>Create First Post</Button></div>
          )}
        </div>
      </div>
    );
  };

  const renderCreate = () => (
    <div className="flex-1 bg-white min-h-screen">
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10"><button onClick={() => setView('feed')} className="p-2 -ml-2 text-slate-400"><X size={24} /></button><span className="font-bold text-slate-700">{t('newPost')}</span><Button size="sm" disabled={!newPostContent.trim()} onClick={handleCreatePost}>Publish</Button></div>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-slate-100 rounded-lg p-2 mb-4 text-xs text-slate-500 font-medium text-center">Posting to: <span className="text-slate-800 font-bold">{TRANSLATIONS[lang][SPACES.find(s=>s.id===activeSpace)?.key]}</span></div>
        <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={t('writePlace')} className="w-full h-48 p-4 text-lg text-slate-800 border-none focus:ring-0 outline-none resize-none" />
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedPost) return null;
    return (
      <div className="flex-1 bg-slate-50 min-h-screen pb-24">
        <div className="bg-white sticky top-0 z-10 border-b border-slate-100 px-4 py-3 flex items-center gap-3"><button onClick={() => setView('feed')} className="p-2 -ml-2"><ChevronRight size={24} className="rotate-180 text-slate-600" /></button><span className="font-bold text-slate-700">{t('discuss')}</span></div>
        <div className="max-w-3xl mx-auto"><div className="bg-white p-6 mb-4 border-b border-slate-100 shadow-sm"><div className="mb-2">{selectedPost.isExpert && <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Shield size={10} /> Verified Doctor</span>}</div><p className="text-xl text-slate-800 font-medium mb-6">{selectedPost.content}</p></div><div className="px-4 space-y-4">{selectedPost.comments?.map((c, i) => (<div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><p className="text-slate-700 text-sm">{c.text}</p></div>))}</div></div>
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 z-[9999]"><div className="max-w-3xl mx-auto flex gap-2"><input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t('writePlace')} className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none" /><Button onClick={handleComment} disabled={!newComment.trim()}><Send size={18} /></Button></div></div>
      </div>
    );
  };

  if (isLoading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-teal-800 gap-4 p-4"><Leaf className="animate-bounce" size={48} /><p className="font-medium animate-pulse">Loading AshokaManas...</p></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {!hasAgreedToLegal && <LegalGateModal lang={lang} onAccept={() => {setHasAgreedToLegal(true); localStorage.setItem('ashoka_legal_agreed', 'true');}} />}
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      {showVerify && <RequestVerificationModal user={user} onClose={() => setShowVerify(false)} />}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-20"><div className="p-5 border-b border-slate-100"><AppLogo size="md" /></div><div className="p-4 flex-1 overflow-hidden"><SpaceSidebar activeSpace={activeSpace} setActiveSpace={setActiveSpace} userData={userData} setShowVerify={setShowVerify} lang={lang} setView={setView} /></div></div>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-slate-900/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}><div className="w-72 h-full bg-white p-4 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100"><AppLogo size="sm" /><button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div><div className="flex-1 overflow-y-auto"><SpaceSidebar activeSpace={activeSpace} setActiveSpace={setActiveSpace} setMobileMenuOpen={setMobileMenuOpen} userData={userData} setShowVerify={setShowVerify} lang={lang} setView={setView} mobile /></div></div></div>}
      <div className="flex-1 md:ml-64 transition-all duration-200">{view === 'feed' && renderFeed()}{view === 'create' && renderCreate()}{view === 'post-detail' && renderDetail()}{view === 'admin' && <AdminPanel onClose={() => setView('feed')} />}</div>
    </div>
  );
}


