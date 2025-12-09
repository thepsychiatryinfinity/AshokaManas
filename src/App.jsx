import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, CheckCircle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, Lock, ChevronRight, UserCheck, Ban, Copy, Check, WifiOff
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion, increment, serverTimestamp, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// --- Firebase Config ---
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

const TRIGGER_WORDS = [
  'die', 'kill', 'suicide', 'end it', 'hang myself', 'poison', 'cut myself', 
  'harm', 'self-harm', 'hurt myself', 'hurting',
  'kidnap', 'kidnapped', 'abduct', 'ransom', 'hostage', 
  'murder', 'shoot', 'gun', 'knife', 'bomb', 'stab',
  'abuse', 'molest', 'rape', 'assault', 'violence',
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
    legalText: "Peer support only. Not medical advice. In emergency, call 108.",
    protocol: "NEVER prescribe meds here.",
    verifyTitle: "Are you a Doctor?",
    verifyText: "Get the Blue Badge.",
    verifyBtn: "Request Verification",
    adminBtn: "Admin Panel",
    volunteer: "Student Internship?",
    apply: "Apply to Moderate"
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
    protocol: "మందులను సూచించవద్దు.",
    verifyTitle: "మీరు డాక్టరా?",
    verifyText: "బ్లూ బ్యాడ్జ్ పొందండి.",
    verifyBtn: "ధృవీకరించండి",
    adminBtn: "అడ్మిన్ ప్యానెల్",
    volunteer: "ఇంటర్న్‌షిప్?",
    apply: "దరఖాస్తు చేయండి"
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

const AppLogo = ({ size = "sm" }) => (
  <div className={`${size === 'lg' ? 'w-40 h-40' : size === 'md' ? 'w-12 h-12' : 'w-8 h-8'} flex items-center justify-center`}>
    <img src="/logo.png" alt="AshokaManas" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-teal-700 font-bold">AM</span>'; }} />
  </div>
);

// --- MODALS ---
// ... (VerificationModal code same as before, simplified for length)
const VerificationModal = ({ user, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copyID = () => { navigator.clipboard.writeText(user.uid); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const mailLink = `mailto:${ADMIN_EMAIL}?subject=Verify Me&body=UserID: ${user?.uid}`;
  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button>
        <h3 className="text-lg font-bold text-slate-800">Doctor Verification</h3>
        <p className="text-xs text-slate-500 mb-4">Send your User ID to admin.</p>
        <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between mb-4 border border-slate-200">
          <code className="text-xs text-slate-600 font-mono truncate max-w-[200px]">{user?.uid || "No ID"}</code>
          <button onClick={copyID} className="text-slate-500">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
        </div>
        <a href={mailLink} className="block w-full bg-sky-600 text-white py-3 rounded-xl font-bold text-sm">Email Me</a>
      </div>
    </div>
  );
};

// ... LegalGateModal, SOSModal, BlockedContentModal same structure as V26 ...
const LegalGateModal = ({ onAccept, lang }) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex flex-col items-center justify-center mb-6"><AppLogo size="lg" /><h2 className="text-2xl font-bold text-center text-teal-900 mt-4">{TRANSLATIONS[lang].appName}</h2></div>
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-sm text-red-900 space-y-2"><div className="flex items-center gap-2 font-bold"><AlertOctagon size={16}/> SAFETY</div><p className="text-xs"><strong>ZERO TOLERANCE:</strong> No abuse, violence, or harm.</p></div>
      <Button onClick={onAccept} className="w-full py-3 text-lg">{TRANSLATIONS[lang].agree}</Button>
    </div>
  </div>
);

const SOSModal = ({ onClose, lang }) => (
  <div className="fixed inset-0 bg-rose-900/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 animate-bounce-in relative">
      <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full"><X size={20} /></button>
      <div className="mt-4"><AlertTriangle size={56} className="text-rose-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-slate-900 mb-2">Emergency Help</h3><div className="space-y-3"><a href="tel:108" className="block w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><Siren size={24} /> Call 108 / 988</a></div></div>
    </div>
  </div>
);

const BlockedContentModal = ({ onClose, triggerWord }) => (
  <div className="fixed inset-0 bg-rose-900/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 animate-bounce-in relative">
      <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full"><X size={20} /></button>
      <div className="mt-4"><Ban size={56} className="text-rose-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-slate-900 mb-2">Blocked</h3><p className="text-slate-600 mb-4 text-sm">Word: <span className="font-bold text-rose-600">"{triggerWord}"</span></p><div className="bg-rose-50 p-3 rounded-xl border border-rose-100"><a href="tel:108" className="block w-full bg-rose-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Siren size={20} /> Call 108</a></div></div>
    </div>
  </div>
);

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
  const [showBlocked, setShowBlocked] = useState(false);
  const [blockedTrigger, setBlockedTrigger] = useState('');
  const [showVerify, setShowVerify] = useState(false); 
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // --- FORCE LOADING FIX ---
  useEffect(() => {
    signInAnonymously(auth).catch(e => console.log("Login err:", e));
    const timer = setTimeout(() => { setIsLoading(false); }, 2500); // 2.5s Timeout
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); if(u) setIsLoading(false); }), []);

  useEffect(() => {
    if (!user) return; // Only fetch profile if user exists
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
      else { setDoc(doc(db, 'artifacts', appId, 'public', 'users', user.uid), { isExpert: false }); }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const agreed = localStorage.getItem('ashoka_legal_agreed');
    if (agreed) setHasAgreedToLegal(true);
  }, []);

  // Fetch Posts - RESILIENT VERSION (Runs even if user is null for read-only)
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v27')); 
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(data);
    }, (error) => { console.log("Fetch error (likely auth):", error); });
    return () => unsub();
  }, []);

  const checkSafety = (text) => {
    const found = BLOCKED_WORDS.find(w => text.toLowerCase().includes(w));
    if (found) { setBlockedTrigger(found); setShowBlocked(true); return false; }
    return true; 
  };

  const handleCreatePost = async () => {
    if (!user) { alert("Connecting... Please wait."); return; }
    if (!newPostContent.trim() || !checkSafety(newPostContent)) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v27'), {
      content: newPostContent, space: activeSpace, authorId: user.uid, isExpert: userData?.isExpert || false, likes: 0, commentCount: 0, comments: [], createdAt: serverTimestamp()
    });
    setNewPostContent(''); setView('feed');
  };

  const handleComment = async () => {
    if (!user) { alert("Connecting..."); return; }
    if (!newComment.trim() || !checkSafety(newComment)) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v27', selectedPost.id);
    await updateDoc(ref, { comments: arrayUnion({ text: newComment, authorId: user.uid, isExpert: userData?.isExpert || false, createdAt: Date.now() }), commentCount: increment(1) });
    setNewComment('');
  };

  const SpaceSidebar = ({ mobile = false }) => (
    <div className={`space-y-2 h-full flex flex-col ${mobile ? 'p-4' : 'p-0'}`}>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {SPACES.map(space => (
          <Button key={space.id} variant={activeSpace === space.id ? 'spaceActive' : 'space'} onClick={() => { setActiveSpace(space.id); if(mobile) setMobileMenuOpen(false); setView('feed'); }} className="rounded-lg mb-1">
            <div className={`p-1.5 rounded-md ${activeSpace === space.id ? 'bg-white' : space.bg}`}><space.icon size={18} className={space.color} /></div><span>{t[space.key]}</span>
          </Button>
        ))}
      </div>
      <div className="px-4 pb-6 space-y-4">
        {!userData?.isExpert && <div className="bg-sky-50 border border-sky-100 rounded-xl p-3"><h4 className="font-bold text-sky-800 text-xs mb-1">{t.verifyTitle}</h4><button onClick={() => { setShowVerify(true); if(mobile) setMobileMenuOpen(false); }} className="w-full bg-white border border-sky-200 text-sky-700 text-xs font-bold py-2 rounded-lg">{t.verifyBtn}</button></div>}
      </div>
    </div>
  );

  const renderFeed = () => {
    const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
    const filteredPosts = posts.filter(p => p.space === activeSpace);
    return (
      <div className="flex-1 min-h-screen pb-20 md:pb-0 bg-slate-50/50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
           <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-[10px] text-amber-900 font-medium"><strong>Disclaimer:</strong> {TRANSLATIONS[lang].legalText}</p></div>
           <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3"><button className="md:hidden p-2 bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}><Menu size={24} className="text-slate-700" /></button><h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><span className="hidden md:block">{t('appName')}</span><span className="md:hidden">{TRANSLATIONS[lang][activeSpaceObj?.key]}</span></h1></div>
            <div className="flex gap-2"><button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-slate-700"><Globe size={14} /> {lang === 'en' ? 'తెలుగు' : 'English'}</button><Button size="sm" onClick={() => setView('create')}><PenSquare size={16} /> <span className="hidden sm:inline">{t('newPost')}</span></Button></div>
           </div>
        </div>
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {filteredPosts.length > 0 ? filteredPosts.map(post => (
            <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${post.isExpert ? 'border-sky-200' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2">{post.isExpert && <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield size={10} /> Doctor</span>}</div></div>
              <p className="text-slate-800 font-medium leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-slate-400 text-sm border-t border-slate-50 pt-2"><button className="flex items-center gap-1.5"><Heart size={18} /> {post.likes || 0}</button><div className="flex items-center gap-1.5"><MessageCircle size={18} /> {post.commentCount || 0}</div></div>
            </div>
          )) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><activeSpaceObj.icon size={32} /></div><h3 className="text-slate-800 font-bold text-lg">Welcome to {activeSpaceObj.id}</h3><Button onClick={() => setView('create')}>Create First Post</Button></div>
          )}
        </div>
        {!user && <div className="fixed bottom-0 w-full bg-red-600 text-white text-center text-xs py-1 z-[10000]">Offline Mode (Read Only)</div>}
      </div>
    );
  };

  const renderCreate = () => (
    <div className="flex-1 bg-white min-h-screen">
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10"><button onClick={() => setView('feed')} className="p-2 -ml-2 text-slate-400"><X size={24} /></button><span className="font-bold text-slate-700">{t('newPost')}</span><Button size="sm" disabled={!newPostContent.trim()} onClick={handleCreatePost}>Publish</Button></div>
      <div className="p-4 max-w-2xl mx-auto"><textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={t('writePlace')} className="w-full h-48 p-4 text-lg text-slate-800 border-none focus:ring-0 outline-none resize-none" /></div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedPost) return null;
    return (
      <div className="flex-1 bg-slate-50 min-h-screen pb-24">
        <div className="bg-white sticky top-0 z-10 border-b border-slate-100 px-4 py-3 flex items-center gap-3"><button onClick={() => setView('feed')} className="p-2 -ml-2"><ChevronRight size={24} className="rotate-180 text-slate-600" /></button><span className="font-bold text-slate-700">{t('discuss')}</span></div>
        <div className="max-w-3xl mx-auto"><div className="bg-white p-6 mb-4 border-b border-slate-100 shadow-sm"><p className="text-xl text-slate-800 font-medium mb-6">{selectedPost.content}</p></div><div className="px-4 space-y-4">{selectedPost.comments?.map((c, i) => (<div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><p className="text-slate-700 text-sm">{c.text}</p></div>))}</div></div>
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 z-[9999]"><div className="max-w-3xl mx-auto flex gap-2"><input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t('writePlace')} className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none" /><Button onClick={handleComment} disabled={!newComment.trim()}><Send size={18} /></Button></div></div>
      </div>
    );
  };

  if (isLoading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-teal-800 gap-4 p-4"><Leaf className="animate-bounce" size={48} /><p className="font-medium animate-pulse">Loading AshokaManas...</p></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {!hasAgreedToLegal && <LegalGateModal lang={lang} onAccept={() => {setHasAgreedToLegal(true); localStorage.setItem('ashoka_legal_agreed', 'true');}} />}
      {showBlocked && <BlockedContentModal triggerWord={blockedTrigger} onClose={() => setShowBlocked(false)} />}
      {showVerify && <VerificationModal user={user} onClose={() => setShowVerify(false)} />}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-20"><div className="p-5 border-b border-slate-100"><AppLogo size="md" /></div><div className="p-4 flex-1 overflow-hidden"><SpaceSidebar activeSpace={activeSpace} setActiveSpace={setActiveSpace} userData={userData} setShowVerify={setShowVerify} lang={lang} setView={setView} /></div></div>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-slate-900/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}><div className="w-72 h-full bg-white p-4 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100"><AppLogo size="sm" /><button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div><div className="flex-1 overflow-y-auto"><SpaceSidebar activeSpace={activeSpace} setActiveSpace={setActiveSpace} setMobileMenuOpen={setMobileMenuOpen} userData={userData} setShowVerify={setShowVerify} lang={lang} setView={setView} mobile /></div></div></div>}
      <div className="flex-1 md:ml-64 transition-all duration-200">{view === 'feed' && renderFeed()}{view === 'create' && renderCreate()}{view === 'post-detail' && renderDetail()}</div>
    </div>
  );
}


