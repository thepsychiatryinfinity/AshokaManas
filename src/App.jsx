import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, ChevronRight, Copy, Check, Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion, increment, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

// --- YOUR REAL FIREBASE KEYS ---
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

const BLOCKED_WORDS = ['suicide', 'kill', 'die', 'harm', 'abuse', 'rape', 'fuck', 'shit', 'idiot', 'stupid', 'ఆత్మహత్య'];

const TRANSLATIONS = {
  en: {
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
    legalTitle: "Disclaimer",
    legalText: "Peer support only. Not medical advice. Call 108.",
    verifyTitle: "Verify Profile",
    verifyBtn: "Request Badge"
  },
  te: {
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
    verifyBtn: "అభ్యర్థన"
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

// --- COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const variants = {
    primary: "bg-teal-800 text-white shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200",
    space: "w-full text-left text-slate-600",
    spaceActive: "w-full text-left bg-teal-50 text-teal-800 font-bold border border-teal-100"
  };
  return <button onClick={onClick} disabled={disabled} className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${variants[variant]} ${className}`}>{children}</button>;
};

const AppLogo = () => <div className="w-12 h-12 flex items-center justify-center text-2xl">🌳</div>; // Text Fallback to prevent Image Crash

// --- MAIN APP ---
export default function AshokaManasPlatform() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isExpert: false }); // Default to false to prevent crash
  const [hasAgreed, setHasAgreed] = useState(false);
  const [lang, setLang] = useState('en'); 
  const [activeSpace, setActiveSpace] = useState('General');
  const [view, setView] = useState('feed'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // 1. Auth Setup
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Safe Profile Fetch
        try {
          const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'users', u.uid));
          if (snap.exists()) setUserData(snap.data());
          else await setDoc(doc(db, 'artifacts', appId, 'public', 'users', u.uid), { isExpert: false });
        } catch(e) { console.log("Profile fetch skipped"); }
      }
    });
  }, []);

  // 2. Data Fetch (V39)
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v39')); 
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.log("Data mode: Offline/Read-only"));
    return () => unsub();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    const lower = newPostContent.toLowerCase();
    if (BLOCKED_WORDS.some(w => lower.includes(w))) { alert("Unsafe content blocked."); return; }
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v39'), {
      content: newPostContent, space: activeSpace, authorId: user?.uid, isExpert: userData.isExpert, likes: 0, comments: [], createdAt: serverTimestamp()
    });
    setNewPostContent(''); setView('feed');
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v39', selectedPost.id);
    await updateDoc(ref, { comments: arrayUnion({ text: newComment, authorId: user?.uid, isExpert: userData.isExpert, createdAt: Date.now() }) });
    setNewComment('');
  };

  // --- RENDER ---
  if (!hasAgreed) return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AppLogo />
        <h2 className="text-2xl font-bold text-teal-900 mt-4 mb-2">{APP_NAME}</h2>
        <div className="bg-slate-50 p-4 rounded-xl border mb-6 text-sm text-slate-600">
           <p className="mb-2 font-bold">{t('legalTitle')}</p>
           <p>{t('legalText')}</p>
        </div>
        <Button onClick={() => setHasAgreed(true)} className="w-full py-3 text-lg">{t('agree')}</Button>
        <div className="flex justify-center gap-4 mt-6 text-sm text-teal-700 font-bold">
           <button onClick={() => setLang('en')}>English</button>
           <span className="text-slate-300">|</span>
           <button onClick={() => setLang('te')}>తెలుగు</button>
        </div>
      </div>
    </div>
  );

  const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
  const filteredPosts = posts.filter(p => p.space === activeSpace);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200`}>
        <div className="p-4 border-b flex justify-between items-center"><span className="font-bold text-teal-900 text-lg flex gap-2"><AppLogo/> {APP_NAME}</span><button className="md:hidden" onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div>
        <div className="p-4 overflow-y-auto h-full pb-20">
          {SPACES.map(s => (
            <Button key={s.id} variant={activeSpace === s.id ? 'spaceActive' : 'space'} onClick={() => { setActiveSpace(s.id); setMobileMenuOpen(false); setView('feed'); }} className="mb-1 justify-start">
              <s.icon size={18} className={`mr-2 ${s.color}`} /> {t(s.key)}
            </Button>
          ))}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <a href={`mailto:${ADMIN_EMAIL}?subject=Verify Me&body=ID:${user?.uid}`} className="block w-full bg-sky-50 text-sky-700 text-center py-2 rounded-lg text-xs font-bold border border-sky-100">{t('verifyBtn')}</a>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 md:ml-64">
        <div className="bg-white border-b p-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 bg-slate-100 rounded" onClick={() => setMobileMenuOpen(true)}><Menu size={20}/></button>
            <h1 className="font-bold text-slate-800">{t(activeSpaceObj?.key)}</h1>
          </div>
          <Button size="sm" onClick={() => setView('create')}><PenSquare size={16}/> {t('newPost')}</Button>
        </div>

        {view === 'feed' && (
          <div className="p-4 space-y-4 pb-24">
            <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-900 flex items-center gap-2"><AlertTriangle size={12}/> {t('legalText')}</div>
            {filteredPosts.length === 0 ? <div className="text-center py-20 opacity-40">No posts yet.</div> : filteredPosts.map(post => (
              <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className={`bg-white p-4 rounded-xl shadow-sm border ${post.isExpert ? 'border-sky-200 ring-1 ring-sky-100' : 'border-slate-100'}`}>
                {post.isExpert && <div className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full w-fit mb-2 font-bold flex items-center gap-1"><Shield size={10}/> Verified Doctor</div>}
                <p className="text-slate-800 mb-2">{post.content}</p>
                <div className="text-xs text-slate-400 flex gap-4"><span>{post.likes || 0} Likes</span><span>{post.comments?.length || 0} Comments</span></div>
              </div>
            ))}
          </div>
        )}

        {view === 'create' && (
          <div className="p-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h2 className="font-bold mb-4">{t('newPost')}</h2>
              <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full h-32 border p-3 rounded-lg mb-4" placeholder="Type here..." />
              <div className="flex gap-2"><Button onClick={handleCreatePost}>Publish</Button><Button variant="secondary" onClick={() => setView('feed')}>Cancel</Button></div>
            </div>
          </div>
        )}

        {view === 'post-detail' && selectedPost && (
          <div className="p-4 pb-24">
            <button onClick={() => setView('feed')} className="mb-4 text-slate-500 flex items-center gap-1 text-sm"><ChevronRight className="rotate-180" size={16}/> Back</button>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
               {selectedPost.isExpert && <div className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full w-fit mb-2 font-bold">Verified Doctor</div>}
               <p className="text-lg font-medium">{selectedPost.content}</p>
            </div>
            <div className="space-y-3">
              {selectedPost.comments?.map((c, i) => (
                <div key={i} className={`p-3 rounded-lg border ${c.isExpert ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-100'}`}>
                  {c.isExpert && <div className="text-[10px] text-sky-700 font-bold mb-1">Doctor's Reply</div>}
                  <p className="text-sm text-slate-700">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t p-3 flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-slate-100 rounded-lg px-3 outline-none" placeholder="Reply..." />
              <Button onClick={handleComment}><Send size={18}/></Button>
            </div>
          </div>
        )}
      </div>
      
      {/* SOS FAB */}
      <a href="tel:108" className="fixed bottom-6 right-6 w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center animate-pulse z-50"><Siren size={24}/></a>
    </div>
  );
}


