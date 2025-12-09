import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, CheckCircle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, Lock, ChevronRight, UserCheck, Ban
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

// --- SAFETY FILTERS ---
const BLOCKED_WORDS = [
  'suicide', 'kill myself', 'die', 'end it', 'hang myself', 'poison', 'cut myself', 'ఆత్మహత్య',
  'kidnap', 'abduct', 'ransom', 'hostage', 'murder', 'shoot', 'gun', 'knife', 'bomb',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'sex', 'porn', 'nude', 'lanja', 'puku', 'modda',
  'stupid', 'idiot', 'loser', 'ugly', 'fat', 'dumb', 'retard', 'useless', 'worthless'
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
    legalText: "Peer support only. In emergency, call 108.",
    protocol: "NEVER prescribe meds here.",
    verifyTitle: "Are you a Doctor?",
    verifyText: "Get the Blue Badge.",
    verifyBtn: "Request Verification",
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
    <div className="bg-teal-700 rounded-full w-full h-full flex items-center justify-center text-white font-bold shadow-sm">AM</div>
  </div>
);

// --- SIDEBAR COMPONENT ---
const SpaceSidebar = ({ activeSpace, setActiveSpace, setMobileMenuOpen, userData, setShowVerify, lang, setView }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1 mb-6">
        <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Spaces</h3>
        {SPACES.map(space => (
          <Button
            key={space.id}
            variant={activeSpace === space.id ? 'spaceActive' : 'space'}
            onClick={() => {
              setActiveSpace(space.id);
              if (setMobileMenuOpen) setMobileMenuOpen(false);
            }}
            className="px-4 py-3 rounded-lg mx-2"
          >
            <div className={`p-1.5 rounded-md ${activeSpace === space.id ? 'bg-white' : space.bg}`}>
              <space.icon size={18} className={space.color} />
            </div>
            <span>{t[space.key]}</span>
          </Button>
        ))}
      </div>

      <div className="mt-auto px-4 pb-6 space-y-4">
        {/* Verification Card (Hide if already Expert) */}
        {!userData?.isExpert && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-800 text-sm mb-1">{t.verifyTitle}</h4>
            <p className="text-xs text-slate-500 mb-3">{t.verifyText}</p>
            <button 
              onClick={() => { setShowVerify(true); if(setMobileMenuOpen) setMobileMenuOpen(false); }}
              className="w-full bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-50"
            >
              {t.verifyBtn}
            </button>
          </div>
        )}

        {/* ADMIN BUTTON - Shows if isAdmin is true */}
        {userData?.isAdmin && (
           <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 animate-pulse">
             <div className="flex items-center gap-2 mb-2 text-teal-800 font-bold text-xs"><Lock size={14}/> ADMIN ACCESS</div>
             <button onClick={() => { setView('admin'); if(setMobileMenuOpen) setMobileMenuOpen(false); }} className="w-full bg-teal-700 text-white text-xs font-bold py-2 rounded-lg hover:bg-teal-800 flex items-center justify-center gap-2">
               <UserCheck size={14} /> Open Admin Panel
             </button>
           </div>
        )}
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
      const userRef = doc(db, 'artifacts', appId, 'public', 'users', req.userId);
      await setDoc(userRef, { isExpert: true, verifiedAt: Date.now(), name: req.name }, { merge: true });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'verification_requests', req.id));
      alert(`Verified Dr. ${req.name} successfully.`);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleReject = async (reqId) => {
    if(confirm("Reject this request?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'verification_requests', reqId));
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen p-4">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Lock size={20} /> Admin Verification Center</h2>
        <button onClick={onClose} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wide">Pending Requests ({requests.length})</h3>
        {requests.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <CheckCircle className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-500 text-sm">No pending doctor requests.</p>
          </div>
        )}
        {requests.map(req => (
          <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg text-slate-800">{req.name}</p>
              <p className="text-sm text-slate-600"><strong>Reg No:</strong> {req.regNo}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(req)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm flex items-center gap-2"><CheckCircle size={16}/> Approve</button>
              <button onClick={() => handleReject(req.id)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- REQUEST MODAL (With Master Key Fix) ---
const RequestVerificationModal = ({ user, onClose }) => {
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name || !regNo) return;

    // *** MASTER KEY LOGIC ***
    if (regNo.trim() === "ASHOKA-MASTER-KEY") {
      const userRef = doc(db, 'artifacts', appId, 'public', 'users', user.uid);
      // We set isAdmin: true. The real-time listener in the main App will pick this up instantly.
      await setDoc(userRef, { isExpert: true, isAdmin: true, verifiedAt: Date.now() }, { merge: true });
      alert("✅ ACCESS GRANTED. Look at the bottom of the sidebar!");
      onClose(); // Close modal immediately
      return;
    }

    // Normal User Flow
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'verification_requests'), {
      userId: user.uid,
      name: name,
      regNo: regNo,
      createdAt: Date.now()
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button>
        {!submitted ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-600"><Stethoscope size={24} /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Doctor Verification</h3>
            <p className="text-xs text-slate-500 mb-6">Enter your details.</p>
            <div className="space-y-3 text-left">
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none" placeholder="Full Name (Dr. ...)" />
              <input value={regNo} onChange={e=>setRegNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none" placeholder="Medical Reg Number" />
              <button onClick={handleSubmit} disabled={!name || !regNo} className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-sky-700">Submit Request</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><CheckCircle size={24} /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Request Sent!</h3>
            <button onClick={onClose} className="mt-6 text-sky-600 font-bold text-sm">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- LEGAL GATE ---
const LegalGateModal = ({ onAccept, lang }) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex flex-col items-center justify-center mb-6"><AppLogo size="lg" /><h2 className="text-2xl font-bold text-center text-teal-900 mt-4">{TRANSLATIONS[lang].appName}</h2></div>
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-sm text-red-900 space-y-2">
        <div className="flex items-center gap-2 font-bold"><AlertOctagon size={16}/> SAFETY & CIVILITY</div>
        <p className="text-xs leading-relaxed">
          <strong>ZERO TOLERANCE:</strong><br/>
          - No abusive, vulgar, or humiliating language.<br/>
          - No mention of kidnapping or violence.<br/>
          - Violators will be <strong>blocked automatically</strong>.
        </p>
      </div>
      <Button onClick={onAccept} className="w-full py-3 text-lg">{TRANSLATIONS[lang].agree}</Button>
    </div>
  </div>
);

// --- BLOCKED CONTENT MODAL ---
const BlockedContentModal = ({ onClose, triggerWord }) => (
  <div className="fixed inset-0 bg-rose-900/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 animate-bounce-in relative">
      <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full"><X size={20} /></button>
      <div className="mt-4">
        <Ban size={56} className="text-rose-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Content Blocked</h3>
        <p className="text-slate-600 mb-4 text-sm">
          Your post contains restricted words 
          {triggerWord ? <span className="font-bold text-rose-600"> ("{triggerWord}")</span> : ""}.
          <br/>We do not allow abuse, violence, or humiliation on this platform.
        </p>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
           <p className="text-xs text-rose-800 font-bold mb-2">Need immediate help?</p>
           <a href="tel:108" className="block w-full bg-rose-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Siren size={20} /> Call 108 / 112</a>
        </div>
      </div>
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

  const t = (key) => TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.error(e); }
    };
    init();
    
    // Auth Listener
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
    });
  }, []);

  // REAL-TIME USER DATA LISTENER (Fixes the Admin issue)
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'users', user.uid);
    
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Initialize user if not exists
        setDoc(userRef, { isExpert: false, joinedAt: Date.now() });
        setUserData({ isExpert: false });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const agreed = localStorage.getItem('ashoka_legal_agreed');
    if (agreed) setHasAgreedToLegal(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v20')); 
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(data);
    });
    return () => unsub();
  }, [user]);

  const checkSafety = (text) => {
    const lowerText = text.toLowerCase();
    const foundWord = BLOCKED_WORDS.find(word => lowerText.includes(word));
    if (foundWord) {
      setBlockedTrigger(foundWord);
      setShowBlocked(true);
      return false; 
    }
    return true; 
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    if (!checkSafety(newPostContent)) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v20'), {
      content: newPostContent,
      space: activeSpace, 
      authorId: user.uid,
      isExpert: userData?.isExpert || false, 
      likes: 0,
      commentCount: 0,
      comments: [],
      createdAt: serverTimestamp()
    });
    setNewPostContent('');
    setView('feed');
  };

  const handleComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    if (!checkSafety(newComment)) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v20', selectedPost.id);
    await updateDoc(ref, {
      comments: arrayUnion({ text: newComment, authorId: user.uid, isExpert: userData?.isExpert || false, createdAt: Date.now() }),
      commentCount: increment(1)
    });
    setNewComment('');
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v20', post.id);
    await updateDoc(ref, { likes: increment(1) });
  };

  const FilterIcon = ({ activeSpaceObj }) => {
    if(!activeSpaceObj) return null;
    const Icon = activeSpaceObj.icon;
    return <Icon size={14} className={activeSpaceObj.color.split(' ')[0]} />;
  };

  const renderFeed = () => {
    const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
    const filteredPosts = posts.filter(p => p.space === activeSpace);
    
    return (
      <div className="flex-1 min-h-screen pb-20 md:pb-0 bg-slate-50/50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1 hover:bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}><Menu size={24} className="text-slate-600" /></button>
            <div className="flex items-center gap-2">
               <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <div className="md:hidden"><AppLogo size="sm"/></div>
                 <span className="md:hidden">{TRANSLATIONS[lang][activeSpaceObj?.key]}</span>
                 <span className="hidden md:block">{t('appName')}</span>
               </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200"><Globe size={14} /> {lang === 'en' ? 'తెలుగు' : 'English'}</button>
            <Button size="sm" onClick={() => setView('create')}><PenSquare size={16} /> <span className="hidden sm:inline">{t('newPost')}</span></Button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          <div className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${activeSpaceObj?.bg} border-slate-200 text-slate-600`}>
             <FilterIcon activeSpaceObj={activeSpaceObj} />
             <span>Viewing Space: <strong>{TRANSLATIONS[lang][activeSpaceObj?.key] || activeSpaceObj?.name}</strong></span>
          </div>

          {filteredPosts.map(post => (
            <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${post.isExpert ? 'border-sky-200 ring-1 ring-sky-100' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {post.isExpert && <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield size={10} /> Verified Doctor</span>}
                  {!post.isExpert && <span className="text-[10px] text-slate-400">Anonymous Member</span>}
                </div>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-slate-400 text-sm border-t border-slate-50 pt-2">
                <button className="flex items-center gap-1.5"><Heart size={18} /> {post.likes || 0}</button>
                <div className="flex items-center gap-1.5"><MessageCircle size={18} /> {post.commentCount || 0}</div>
              </div>
            </div>
          ))}
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p>No posts here yet.</p>
              <Button onClick={() => setView('create')} variant="ghost" className="mt-2 text-indigo-600">Be the first to post</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCreate = () => {
    const isClinical = activeSpace === 'Clinical';
    const isAdverse = activeSpace === 'Adverse';
    
    return (
      <div className="flex-1 bg-white min-h-screen">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => setView('feed')} className="p-2 -ml-2 text-slate-400"><X size={24} /></button>
          <span className="font-bold text-slate-700">{t('newPost')}</span>
          <Button size="sm" disabled={!newPostContent.trim()} onClick={handleCreatePost}>Publish</Button>
        </div>
        <div className="p-4 max-w-2xl mx-auto">
          <div className="bg-slate-100 rounded-lg p-2 mb-4 text-xs text-slate-500 font-medium text-center">
            Posting to: <span className="text-slate-800 font-bold">{TRANSLATIONS[lang][SPACES.find(s=>s.id===activeSpace)?.key]}</span>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex gap-2 items-start"><Shield size={16} className="text-slate-400 shrink-0 mt-0.5" /><p className="text-xs text-slate-600"><strong>Safe Space:</strong> No abuse, violence, or bullying. Posts are filtered.</p></div>
          {isClinical && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r shadow-sm"><div className="flex gap-3"><Lock className="text-red-600 shrink-0" size={24} /><div><h4 className="font-bold text-red-900 text-sm">STRICT MEDICAL CONFIDENTIALITY</h4><p className="text-xs text-red-800 mt-1 leading-relaxed"><strong>ABSOLUTELY NO PII.</strong> Do not post patient names, exact dates, or identifiable locations.</p></div></div></div>}
          {isAdverse && <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-4"><AlertCircle className="text-orange-600 shrink-0" size={24} /><div><h3 className="text-orange-900 font-bold text-sm">Safety Warning</h3><p className="text-orange-800/80 text-xs mt-1"><strong>Do not stop medication based on comments.</strong> Consult your doctor.</p></div></div>}
          <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={t('writePlace')} className="w-full h-48 p-4 text-lg text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 outline-none resize-none" />
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedPost) return null;
    return (
      <div className="flex-1 bg-slate-50 min-h-screen pb-24">
        <div className="bg-white sticky top-0 z-10 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView('feed')} className="p-2 -ml-2"><ChevronRight size={24} className="rotate-180 text-slate-600" /></button>
          <span className="font-bold text-slate-700">{t('discuss')}</span>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-6 mb-4 border-b border-slate-100 shadow-sm">
             <div className="mb-2">{selectedPost.isExpert && <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Shield size={10} /> Verified Doctor</span>}</div>
             <p className="text-xl text-slate-800 font-medium mb-6">{selectedPost.content}</p>
             <Button variant="ghost" size="sm" onClick={(e) => handleLike(e, selectedPost)}><ThumbsUp size={18} className="mr-2" /> {t('support')} ({selectedPost.likes})</Button>
          </div>
          <div className="px-4 space-y-4">
            {selectedPost.comments?.map((c, i) => (
              <div key={i} className={`bg-white p-5 rounded-xl border shadow-sm ${c.isExpert ? 'border-sky-200 bg-sky-50/30' : 'border-slate-200'}`}><div className="mb-1">{c.isExpert && <span className="text-sky-700 text-[10px] font-bold flex items-center gap-1"><Shield size={10} /> Verified Answer</span>}</div><p className="text-slate-700 text-sm">{c.text}</p></div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 z-[9999]">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t('writePlace')} className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none" />
            <Button onClick={handleComment} disabled={!newComment.trim()}><Send size={18} /></Button>
          </div>
        </div>
      </div>
    );
  };

  if (!user) return <div className="h-screen flex items-center justify-center text-teal-700"><Leaf className="animate-bounce" size={40} /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {!hasAgreedToLegal && <LegalGateModal lang={lang} onAccept={() => {setHasAgreedToLegal(true); localStorage.setItem('ashoka_legal_agreed', 'true');}} />}
      
      {/* BLOCKED CONTENT ALERT */}
      {showBlocked && <BlockedContentModal triggerWord={blockedTrigger} onClose={() => setShowBlocked(false)} />}
      
      {/* MODALS */}
      {showVerify && <RequestVerificationModal user={user} onClose={() => setShowVerify(false)} />}
      
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-20">
        <div className="p-5 border-b border-slate-100"><AppLogo size="md" /></div>
        <div className="p-4 flex-1 overflow-hidden">
          <SpaceSidebar 
            activeSpace={activeSpace} 
            setActiveSpace={setActiveSpace} 
            userData={userData}
            setShowVerify={setShowVerify}
            lang={lang}
            setView={setView}
          />
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white p-4 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100"><AppLogo size="sm" /><button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div>
             <div className="flex-1 overflow-y-auto">
               <SpaceSidebar 
                 activeSpace={activeSpace} 
                 setActiveSpace={setActiveSpace} 
                 setMobileMenuOpen={setMobileMenuOpen}
                 userData={userData}
                 setShowVerify={setShowVerify}
                 lang={lang}
                 setView={setView}
                 mobile 
               />
             </div>
          </div>
        </div>
      )}
      <div className="flex-1 md:ml-64 transition-all duration-200">
        {view === 'feed' && renderFeed()}
        {view === 'create' && renderCreate()}
        {view === 'post-detail' && renderDetail()}
        {view === 'admin' && <AdminPanel onClose={() => setView('feed')} />}
      </div>
    </div>
  );
}
