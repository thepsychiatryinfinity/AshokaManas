import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, ChevronRight, Copy, Check, Lock, TreePine, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion, increment, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

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
const MASTER_KEY = "ASHOKA-ADMIN-2025"; 
const ADMIN_EMAIL = "ashokamanas11@gmail.com";

const BLOCKED_WORDS = [
  'suicide', 'kill', 'die', 'end it', 'hang', 'poison', 'cut myself', 
  'harm', 'hurt', 'pain', 'abuse', 'molest', 'rape', 'assault', 'violence', 
  'humiliate', 'torture', 'idiot', 'stupid', 'useless', 'ugly', 'fat',
  'fuck', 'shit', 'bitch', 'asshole', 'sex', 'porn', 'nude',
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
    zeroTolerance: "ZERO TOLERANCE: Abuse, Humiliation & Violence are banned."
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
    zeroTolerance: "గమనిక: అవమానించడం మరియు హింస పూర్తిగా నిషేధించబడ్డాయి."
  }
};

const SPACES = [
  { id: 'General', key: 'general', icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { id: 'Clinical', key: 'clinical', icon: Stethoscope, color: 'text-cyan-700', bg: 'bg-cyan-100' },
  { id: 'Caregiver', key: 'caregiver', icon: HeartHandshake, color: 'text-rose-700', bg: 'bg-rose-100' },
  { id: 'Addiction', key: 'addiction', icon: Pill, color: 'text-amber-700', bg: 'bg-amber-100' },
  { id: 'ChildAdolescent', key: 'child', icon: Baby, color: 'text-pink-700', bg: 'bg-pink-100' },
  { id: 'Adverse', key: 'adverse', icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-100' }, 
  { id: 'Stories', key: 'story', icon: ScrollText, color: 'text-fuchsia-700', bg: 'bg-fuchsia-100' },
];

// --- Components ---
const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const variants = {
    primary: "bg-emerald-800 text-white shadow-md hover:bg-emerald-900",
    secondary: "bg-white text-emerald-900 border border-emerald-200",
    ghost: "text-emerald-800 hover:bg-emerald-100",
    space: "w-full justify-start text-left hover:bg-white/60 text-emerald-900 font-medium",
    spaceActive: "w-full justify-start text-left bg-white text-emerald-900 font-bold border border-emerald-200 shadow-sm"
  };
  return <button onClick={onClick} disabled={disabled} className={`px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${variants[variant]} ${className}`}>{children}</button>;
};

const AppLogo = ({size}) => <div className={`flex items-center justify-center text-emerald-800 ${size==='lg'?'text-6xl':'text-2xl'}`}><TreePine size={size==='lg'?64:24} /></div>;

// --- MODALS ---
const VerificationModal = ({ user, onClose }) => {
  const [code, setCode] = useState("");
  
  const handleVerify = async () => {
    if (!user) return;
    if (code === MASTER_KEY) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'users', user.uid), { 
          isExpert: true, 
          isAdmin: true,
          verifiedAt: Date.now() 
        }, { merge: true });
        alert("✅ Success! You are now Verified.");
        onClose();
        window.location.reload();
      } catch (e) {
        alert("Error verifying: " + e.message);
      }
    } else {
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=Doctor Verification&body=ID: ${user.uid}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-900/90 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
        <h3 className="text-lg font-bold text-emerald-900 mb-2">Doctor Verification</h3>
        <p className="text-xs text-slate-500 mb-4">Type the Master Key to verify yourself instantly.</p>
        <input 
          value={code} 
          onChange={e=>setCode(e.target.value)} 
          placeholder="Enter Master Key" 
          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg mb-4 text-center font-mono" 
        />
        <Button onClick={handleVerify}>Verify Me</Button>
        <p className="text-[10px] text-slate-400 mt-4">Or leave blank and click to email admin.</p>
      </div>
    </div>
  );
};

const LegalGateModal = ({ onAccept, lang }) => (
  <div className="fixed inset-0 bg-emerald-950/95 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white/95 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-emerald-100">
      <div className="flex flex-col items-center justify-center mb-6"><AppLogo size="lg" /><h2 className="text-3xl font-bold text-center text-emerald-900 mt-4">{TRANSLATIONS[lang].appName}</h2></div>
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-sm text-red-900">
        <div className="flex items-center gap-2 font-bold mb-1"><AlertOctagon size={16}/> ZERO TOLERANCE</div>
        <p className="text-xs leading-relaxed">No <strong>Abuse, Humiliation, or Violence</strong>. We protect our community strictly.</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 text-sm text-emerald-900 space-y-3"><p><strong>Disclaimer:</strong> {TRANSLATIONS[lang].legalText}</p></div>
      <Button onClick={onAccept} className="w-full py-4 text-lg">{TRANSLATIONS[lang].agree}</Button>
    </div>
  </div>
);

const SOSModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-rose-950/98 z-[10000] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 relative">
      <div className="mt-4"><AlertTriangle size={56} className="text-rose-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-slate-900 mb-2">Safety Alert</h3>
      <p className="text-slate-600 mb-6 text-sm">We detected unsafe language. If you are in crisis, please get help.</p>
      <div className="space-y-3"><a href="tel:108" className="block w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><Siren size={24} /> Call 108 / 988</a><button onClick={onClose} className="block w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200">Go Back & Edit</button></div></div>
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
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // Auth & Profile
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'users', u.uid), (snap) => {
          if (snap.exists()) setUserData(snap.data());
          else setDoc(doc(db, 'artifacts', appId, 'public', 'users', u.uid), { isExpert: false });
        });
      }
    });
  }, []);

  // Data Fetch (V41)
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v41')); 
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsub();
  }, []);

  const checkSafety = (text) => {
    const lower = text.toLowerCase();
    if (BLOCKED_WORDS.some(w => lower.includes(w))) { setShowSOS(true); return false; }
    return true;
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !checkSafety(newPostContent)) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v41'), {
      content: newPostContent, space: activeSpace, authorId: user?.uid, isExpert: userData.isExpert, likes: 0, comments: [], createdAt: serverTimestamp()
    });
    setNewPostContent(''); setView('feed');
  };

  const handleComment = async () => {
    if (!newComment.trim() || !checkSafety(newComment)) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v41', selectedPost.id);
    await updateDoc(ref, { comments: arrayUnion({ text: newComment, authorId: user?.uid, isExpert: userData.isExpert, createdAt: Date.now() }) });
    setNewComment('');
  };

  if (!hasAgreed) return <LegalGateModal onAccept={() => setHasAgreed(true)} lang={lang} />;

  const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
  const filteredPosts = posts.filter(p => p.space === activeSpace);
  const isClinical = activeSpace === 'Clinical';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 font-sans text-slate-900">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      {showVerify && <VerificationModal user={user} onClose={() => setShowVerify(false)} />}

      {/* SOS BUTTON (MOVED TO LEFT) */}
      <button onClick={() => setShowSOS(true)} className="fixed bottom-6 left-6 z-[9000] w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-300 flex items-center justify-center animate-pulse border-4 border-white"><Siren size={24}/></button>

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-xl border-r border-emerald-100 z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 shadow-xl`}>
        <div className="p-6 border-b border-emerald-100 flex justify-between items-center">
          <span className="font-bold text-emerald-900 text-lg flex gap-2 items-center"><AppLogo/> {APP_NAME}</span>
          <button className="md:hidden text-emerald-800" onClick={() => setMobileMenuOpen(false)}><X size={24}/></button>
        </div>
        <div className="p-4 overflow-y-auto h-full pb-20">
          {SPACES.map(s => (
            <Button key={s.id} variant={activeSpace === s.id ? 'spaceActive' : 'space'} onClick={() => { setActiveSpace(s.id); setMobileMenuOpen(false); setView('feed'); }} className="mb-2">
              <s.icon size={18} /> {t(s.key)}
            </Button>
          ))}
          <div className="mt-6 pt-6 border-t border-emerald-100">
            <div className="bg-emerald-100/50 p-3 rounded-xl border border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-800 mb-1 flex gap-1"><Shield size={12}/> {t('verifyTitle')}</h4>
              <button onClick={() => setShowVerify(true)} className="text-[10px] bg-white text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg w-full font-bold shadow-sm">{t('verifyBtn')}</button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 md:ml-64 relative z-0">
        <div className="bg-white/80 backdrop-blur-md border-b border-emerald-100 p-3 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 bg-emerald-100 rounded text-emerald-800" onClick={() => setMobileMenuOpen(true)}><Menu size={20}/></button>
            <h1 className="font-bold text-emerald-900 text-lg">{t(activeSpaceObj?.key)}</h1>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold"><Globe size={14}/></button>
             <Button size="sm" onClick={() => setView('create')}><PenSquare size={16}/> {t('newPost')}</Button>
          </div>
        </div>

        {view === 'feed' && (
          <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg text-xs text-amber-900 flex gap-2 shadow-sm">
              <Info size={16} className="shrink-0"/> {t('legalText')}
            </div>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <activeSpaceObj.icon size={48} className="mx-auto mb-2 text-emerald-300"/>
                <p>Quiet space. Start the conversation.</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${post.isExpert ? 'border-sky-200 bg-sky-50/30' : 'border-emerald-100 hover:border-emerald-300'}`}>
                  <div className="flex justify-between mb-2">
                    {post.isExpert ? <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield size={10}/> Doctor</span> : <span className="text-[10px] text-slate-400">Anonymous</span>}
                    <span className="text-[10px] text-slate-300">Just now</span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{post.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="p-4 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
              <h2 className="font-bold text-emerald-900 mb-4">{t('newPost')} to {t(activeSpaceObj?.key)}</h2>
              {isClinical && (
                 <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4 flex gap-2">
                   <Lock className="text-red-600 shrink-0" size={20} />
                   <div><h4 className="font-bold text-red-900 text-xs">CONFIDENTIALITY</h4><p className="text-[10px] text-red-800 mt-1">Strictly No Patient Names. No Prescriptions.</p></div>
                 </div>
              )}
              <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full h-40 border border-slate-200 p-4 rounded-xl mb-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder={t('writePlace')} />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setView('feed')}>Cancel</Button>
                <Button onClick={handleCreatePost}>Publish</Button>
              </div>
            </div>
          </div>
        )}

        {view === 'post-detail' && selectedPost && (
          <div className="p-4 pb-24 max-w-3xl mx-auto">
            <button onClick={() => setView('feed')} className="mb-4 text-emerald-600 flex items-center gap-1 text-sm font-bold"><ChevronRight className="rotate-180" size={16}/> Back</button>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 mb-4">
               {selectedPost.isExpert && <div className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full w-fit mb-2 font-bold">Verified Doctor</div>}
               <p className="text-lg font-medium text-slate-800">{selectedPost.content}</p>
            </div>
            <div className="space-y-3">
              {selectedPost.comments?.map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border ${c.isExpert ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-100'}`}>
                  {c.isExpert && <div className="text-[10px] text-sky-700 font-bold mb-1 flex gap-1 items-center"><Shield size={10}/> Doctor's Reply</div>}
                  <p className="text-sm text-slate-700">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 flex gap-2 z-[9000] w-full md:w-auto">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-slate-100 rounded-xl px-4 outline-none" placeholder="Reply..." />
              <Button onClick={handleComment}><Send size={18}/></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


