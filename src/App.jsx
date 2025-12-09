import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, CheckCircle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, Lock, ChevronRight, UserCheck, Ban, Copy, Check
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';

// --- YOUR REAL KEYS (Pre-Filled) ---
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
  'suicide', 'kill myself', 'die', 'end it', 'hang myself', 'poison', 'cut myself', 
  'harm', 'self-harm', 'hurt myself', 'hurting',
  'kidnap', 'kidnapped', 'abduct', 'ransom', 'hostage', 
  'murder', 'shoot', 'gun', 'knife', 'bomb', 'stab',
  'abuse', 'molest', 'rape', 'assault', 'violence',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'sex', 'porn',
  'stupid', 'idiot', 'loser', 'ugly', 'fat', 'dumb', 'retard',
  'చనిపోవాలని', 'ఆత్మహత్య', 'చంపడం'
];

const SPACES = [
  { id: 'General', name: 'General Support', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Clinical', name: 'Clinical Hub', icon: Stethoscope, color: 'text-cyan-700', bg: 'bg-cyan-50' },
  { id: 'Caregiver', name: 'Caregiver Burden', icon: HeartHandshake, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Addiction', name: 'Addiction Support', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'ChildAdolescent', name: 'Child & Adolescent', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'Adverse', name: 'Adverse Effects', icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-50' }, 
  { id: 'Stories', name: 'My Story', icon: ScrollText, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
];

// --- Simple Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const base = "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    space: "w-full justify-start text-left hover:bg-slate-50 text-slate-600",
    spaceActive: "w-full justify-start text-left bg-teal-50 text-teal-800 font-bold border border-teal-100"
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}>{children}</button>;
};

const AppLogo = ({ size = "sm" }) => (
  <div className={`${size === 'lg' ? 'w-32 h-32' : 'w-8 h-8'} flex items-center justify-center`}>
    <img src="/logo.png" alt="AM" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '🌲'; }} />
  </div>
);

// --- MODALS ---
const LegalGateModal = ({ onAccept }) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex flex-col items-center justify-center mb-6"><AppLogo size="lg" /><h2 className="text-2xl font-bold text-center text-teal-900 mt-4">AshokaManas</h2></div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-700 space-y-3"><p><strong>Medical Disclaimer:</strong> Not a medical service. In emergency, call 108.</p><p><strong>Zero Tolerance:</strong> No abuse, violence, or harm allowed.</p></div>
      <Button onClick={onAccept} className="w-full py-3 text-lg">I Agree & Enter</Button>
    </div>
  </div>
);

const SOSModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-rose-900/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 animate-bounce-in relative">
      <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full"><X size={20} /></button>
      <div className="mt-4"><AlertTriangle size={56} className="text-rose-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-slate-900 mb-2">Emergency Help</h3><div className="space-y-3"><a href="tel:108" className="block w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><Siren size={24} /> Call 108 / 988</a></div></div>
    </div>
  </div>
);

// --- MAIN APP ---
export default function AshokaManasPlatform() {
  const [user, setUser] = useState(null);
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false);
  const [activeSpace, setActiveSpace] = useState('General');
  const [view, setView] = useState('feed'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [showSOS, setShowSOS] = useState(false);
  const [newComment, setNewComment] = useState('');

  // --- STABLE AUTH (V24 Logic) ---
  useEffect(() => {
    // 1. Try to login immediately
    signInAnonymously(auth).catch(e => console.error("Login Error:", e));
    // 2. Listen for user state
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    const agreed = localStorage.getItem('ashoka_legal_agreed');
    if (agreed) setHasAgreedToLegal(true);
  }, []);

  // --- STABLE DATA FETCHING ---
  useEffect(() => {
    // Note: We use a new collection 'ashoka_posts_v28' to ensure no corrupt data breaks the app
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v28'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(data);
    }, (error) => {
      console.log("Database Error (Check Console for Permissions):", error);
    });
    return () => unsub();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    // Safety Filter
    const lower = newPostContent.toLowerCase();
    if (BLOCKED_WORDS.some(w => lower.includes(w))) { setShowSOS(true); return; }

    if (!user) { alert("Still connecting... please wait 5 seconds."); return; }

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v28'), {
      content: newPostContent,
      space: activeSpace, 
      authorId: user.uid,
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
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v28', selectedPost.id);
    await updateDoc(ref, {
      comments: arrayUnion({ text: newComment, authorId: user.uid, createdAt: Date.now() }),
      commentCount: increment(1)
    });
    setNewComment('');
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v28', post.id);
    await updateDoc(ref, { likes: increment(1) });
  };

  const SpaceSidebar = ({ mobile = false }) => (
    <div className={`space-y-2 h-full flex flex-col ${mobile ? 'p-4' : 'p-0'}`}>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {SPACES.map(space => (
          <Button key={space.id} variant={activeSpace === space.id ? 'spaceActive' : 'space'} onClick={() => { setActiveSpace(space.id); if(mobile) setMobileMenuOpen(false); setView('feed'); }} className="mb-1">
            <div className={`p-1.5 rounded-md ${space.bg} ${space.color} mr-2`}><space.icon size={18} /></div>{space.name}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderFeed = () => {
    const filteredPosts = posts.filter(p => activeSpace === 'General' ? true : p.space === activeSpace);
    const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
    
    return (
      <div className="flex-1 min-h-screen pb-20 md:pb-0 bg-slate-50/50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1 bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}><Menu size={24} className="text-slate-600" /></button>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><div className="md:hidden"><AppLogo size="sm"/></div>{activeSpaceObj?.name}</h1>
          </div>
          <Button onClick={() => setView('create')}><PenSquare size={16} /> New Post</Button>
        </div>

        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {filteredPosts.map(post => (
            <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <p className="text-slate-800 font-medium leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-slate-400 text-sm border-t border-slate-50 pt-2">
                <button onClick={(e) => handleLike(e, post)} className="flex items-center gap-1.5"><Heart size={18} /> {post.likes || 0}</button>
                <div className="flex items-center gap-1.5"><MessageCircle size={18} /> {post.commentCount || 0}</div>
              </div>
            </div>
          ))}
          {filteredPosts.length === 0 && <div className="text-center py-20 text-slate-400"><p>No posts yet in {activeSpaceObj?.name}.</p></div>}
        </div>
      </div>
    );
  };

  const renderCreate = () => (
    <div className="flex-1 bg-white min-h-screen">
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={() => setView('feed')} className="p-2 -ml-2 text-slate-400"><X size={24} /></button>
        <span className="font-bold text-slate-700">New Post to {activeSpace}</span>
        <Button onClick={handleCreatePost}>Publish</Button>
      </div>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs text-slate-600"><strong>Reminder:</strong> No abusive, blameful, unfair, or violent language.</div>
        <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Share your thoughts..." className="w-full h-48 p-4 text-lg text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 outline-none resize-none" />
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedPost) return null;
    return (
      <div className="flex-1 bg-slate-50 min-h-screen pb-24">
        <div className="bg-white sticky top-0 z-10 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView('feed')} className="p-2 -ml-2"><ChevronRight size={24} className="rotate-180 text-slate-600" /></button>
          <span className="font-bold text-slate-700">Discussion</span>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-6 mb-4 border-b border-slate-100 shadow-sm"><p className="text-xl text-slate-800 font-medium mb-6">{selectedPost.content}</p></div>
          <div className="px-4 space-y-4">{selectedPost.comments?.map((c, i) => (<div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><p className="text-slate-700 text-sm">{c.text}</p></div>))}</div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a reply..." className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none" />
            <Button onClick={handleComment} disabled={!newComment.trim()}><Send size={18} /></Button>
          </div>
        </div>
      </div>
    );
  };

  // --- THE STUCK LEAF FIX ---
  // If user is null but we are still loading, show leaf. BUT force a text link to allow manual retry if stuck.
  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center text-teal-700 bg-teal-50">
      <Leaf className="animate-bounce mb-4" size={48} />
      <p className="text-sm font-bold animate-pulse">Connecting to Secure Server...</p>
      <button onClick={() => window.location.reload()} className="mt-8 text-xs underline text-teal-600">Tap here if stuck for more than 5 seconds</button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <button onClick={() => setShowSOS(true)} className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-300 flex items-center justify-center animate-pulse"><Siren size={24} /></button>
      {!hasAgreedToLegal && <LegalGateModal onAccept={() => {setHasAgreedToLegal(true); localStorage.setItem('ashoka_legal_agreed', 'true');}} />}
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-20"><div className="p-5 border-b border-slate-100"><AppLogo size="md" /></div><div className="p-4 flex-1 overflow-hidden"><SpaceSidebar /></div></div>
      
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white p-4 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100"><AppLogo size="sm" /><button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div>
             <div className="flex-1 overflow-y-auto"><SpaceSidebar mobile /></div>
          </div>
        </div>
      )}
      
      <div className="flex-1 md:ml-64 transition-all duration-200">
        {view === 'feed' && renderFeed()}
        {view === 'create' && renderCreate()}
        {view === 'post-detail' && renderDetail()}
      </div>
    </div>
  );
}


