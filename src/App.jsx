import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Lightbulb, Wind, Users, Send, ThumbsUp, X, Shield, 
  Search, AlertTriangle, CheckCircle, Leaf, Hash, User, ChevronRight, Menu, HeartHandshake, 
  BookOpen, Pill, ScrollText, Ban, AlertOctagon, Info, Stethoscope, Baby, Repeat, Coffee, 
  Siren, FileText, Gavel, Scale, AlertCircle, Globe
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';

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

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    appName: "AshokaManas",
    clinical: "Clinical Hub",
    adverse: "Adverse Effects",
    general: "General Support",
    kids: "Children & Teens",
    daily: "Daily Hurdles",
    ocd: "OCD Support",
    story: "My Story",
    stigma: "Breaking Stigma",
    caregiver: "Caregiver Burden",
    psycho: "Psycho-Education",
    substance: "Substance Abuse",
    anxiety: "Anxiety & Panic",
    depression: "Depression",
    work: "Work Stress",
    newPost: "New Post",
    discuss: "Discussion",
    sos: "I need help",
    agree: "I Agree & Enter",
    support: "Support",
    replies: "Replies",
    publish: "Publish",
    writePlace: "Share your thoughts...",
    legalTitle: "Medical Disclaimer",
    legalText: "This is a peer support platform. Not a medical service. In emergency, call 108/112.",
    protocol: "NEVER prescribe meds. Only give general guidance.",
    volunteer: "Student Internship?",
    apply: "Apply to Moderate"
  },
  te: {
    appName: "అశోకమనస్",
    clinical: "క్లినికల్ హబ్ (Doctors)",
    adverse: "దుష్ప్రభావాలు (Side Effects)",
    general: "సాధారణ మద్దతు",
    kids: "పిల్లలు & టీనేజర్స్",
    daily: "రోజువారీ సవాళ్లు",
    ocd: "OCD మద్దతు",
    story: "నా కథ (My Story)",
    stigma: "అపోహలు - వాస్తవాలు",
    caregiver: "సంరక్షకుల భారం",
    psycho: "మానసిక విద్య",
    substance: "మత్తు పదార్థాల వినియోగం",
    anxiety: "ఆందోళన & భయం",
    depression: "డిప్రెషన్ (నిరాశ)",
    work: "ఒత్తిడి (Work Stress)",
    newPost: "పోస్ట్ చేయండి",
    discuss: "చర్చ (Discussion)",
    sos: "నాకు సహాయం కావాలి",
    agree: "నేను అంగీకరిస్తున్నాను",
    support: "మద్దతు",
    replies: "సమాధానాలు",
    publish: "ప్రచురించండి",
    writePlace: "మీ ఆలోచనలను పంచుకోండి...",
    legalTitle: "నిరాకరణ (Disclaimer)",
    legalText: "ఇది వైద్య సేవ కాదు. అత్యవసరమైతే వెంటనే 108 కి కాల్ చేయండి.",
    protocol: "మందులను సూచించవద్దు. సాధారణ సలహా మాత్రమే ఇవ్వండి.",
    volunteer: "విద్యార్థి ఇంటర్న్‌షిప్?",
    apply: "దరఖాస్తు చేయండి"
  }
};

const SPACES = [
  { id: 'Clinical', key: 'clinical', icon: Stethoscope, color: 'text-cyan-700', bg: 'bg-cyan-50' },
  { id: 'Adverse', key: 'adverse', icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-50' }, 
  { id: 'General', key: 'general', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'KidsTeen', key: 'kids', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' }, 
  { id: 'Daily', key: 'daily', icon: Coffee, color: 'text-emerald-700', bg: 'bg-emerald-50' }, 
  { id: 'OCD', key: 'ocd', icon: Repeat, color: 'text-teal-600', bg: 'bg-teal-50' }, 
  { id: 'Stories', key: 'story', icon: ScrollText, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  { id: 'Stigma', key: 'stigma', icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'Caregiver', key: 'caregiver', icon: HeartHandshake, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'PsychoEd', key: 'psycho', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'Substance', key: 'substance', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'Anxiety', key: 'anxiety', icon: Wind, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'Depression', key: 'depression', icon: Leaf, color: 'text-slate-600', bg: 'bg-slate-50' },
  { id: 'Work', key: 'work', icon: Hash, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const TRIGGER_WORDS = ['die', 'kill', 'suicide', 'end it', 'చనిపోవాలని', 'ఆత్మహత్య'];

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const base = "font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-teal-800 text-white hover:bg-teal-900 shadow-md shadow-teal-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100",
    space: "w-full justify-start text-left hover:bg-slate-50 text-slate-600 transition-colors duration-200",
    spaceActive: "w-full justify-start text-left bg-teal-50 text-teal-800 font-bold border border-teal-100 shadow-sm"
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}>
      {children}
    </button>
  );
};

const AppLogo = ({ size = "sm" }) => {
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-40 h-40" };
  return (
    <div className={`${sizes[size]} flex items-center justify-center`}>
      <img src="/logo.png" alt="AshokaManas" className="w-full h-full object-contain" 
        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-teal-700 font-bold">AM</span>'; }} 
      />
    </div>
  );
};

const LegalGateModal = ({ onAccept, lang }) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
      <div className="flex flex-col items-center justify-center mb-6">
        <AppLogo size="lg" />
        <h2 className="text-2xl font-bold text-center text-teal-900 mt-4">{TRANSLATIONS[lang].appName}</h2>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-700 space-y-3 leading-relaxed">
        <p><strong>1. {TRANSLATIONS[lang].legalTitle}:</strong> {TRANSLATIONS[lang].legalText}</p>
        <p><strong>2. Protocol:</strong> {TRANSLATIONS[lang].protocol}</p>
      </div>
      <Button onClick={onAccept} className="w-full py-3 text-lg">{TRANSLATIONS[lang].agree}</Button>
    </div>
  </div>
);

// --- FIXED SOS MODAL (HIGHEST PRIORITY) ---
const SOSModal = ({ onClose, lang }) => (
  <div className="fixed inset-0 bg-rose-900/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-8 border-rose-500 animate-bounce-in relative">
      
      {/* Explicit Close Button with High Z-Index */}
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="mt-4">
        <AlertTriangle size={56} className="text-rose-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{lang === 'te' ? 'అత్యవసర సహాయం' : 'Emergency Help'}</h3>
        <p className="text-slate-500 mb-6 text-sm">
          {lang === 'te' ? 'మీరు సురక్షితంగా ఉన్నారా?' : 'Are you feeling unsafe?'}
        </p>
        
        <div className="space-y-3">
          <a href="tel:108" className="block w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200">
            <Siren size={24} /> 
            {lang === 'te' ? '108 కి కాల్ చేయండి' : 'Call 108 / 988'}
          </a>
          <button onClick={onClose} className="block w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-200">
            {lang === 'te' ? 'నేను క్షేమంగా ఉన్నాను' : 'I am safe now'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function AshokaManasPlatform() {
  const [user, setUser] = useState(null);
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false);
  const [lang, setLang] = useState('en'); 
  
  const [activeSpace, setActiveSpace] = useState('General');
  const [view, setView] = useState('feed'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // SOS State
  const [showSOS, setShowSOS] = useState(false);
  const [newComment, setNewComment] = useState('');

  const t = (key) => TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const agreed = localStorage.getItem('ashoka_legal_agreed');
    if (agreed) setHasAgreedToLegal(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v15'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(data);
    });
    return () => unsub();
  }, [user]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    // Check for Trigger Words
    const lower = newPostContent.toLowerCase();
    if (TRIGGER_WORDS.some(w => lower.includes(w))) { 
      setShowSOS(true); // Trigger SOS
      return; // Stop posting
    }

    setIsSubmitting(true);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v15'), {
      content: newPostContent,
      space: activeSpace, 
      authorId: user.uid,
      likes: 0,
      commentCount: 0,
      comments: [],
      createdAt: serverTimestamp(),
      authorImpact: Math.floor(Math.random() * 50) 
    });
    setNewPostContent('');
    setView('feed');
    setIsSubmitting(false);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v15', selectedPost.id);
    await updateDoc(ref, {
      comments: arrayUnion({ text: newComment, authorId: user.uid, createdAt: Date.now() }),
      commentCount: increment(1)
    });
    setNewComment('');
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'ashoka_posts_v15', post.id);
    await updateDoc(ref, { likes: increment(1) });
  };

  const SpaceSidebar = ({ mobile = false }) => (
    <div className={`space-y-2 h-full flex flex-col ${mobile ? 'p-4' : 'p-0'}`}>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {SPACES.map(space => (
          <Button
            key={space.id}
            variant={activeSpace === space.id ? 'spaceActive' : 'space'}
            onClick={() => { setActiveSpace(space.id); if(mobile) setMobileMenuOpen(false); setView('feed'); }}
            className="rounded-lg mb-1"
          >
            <div className={`p-1.5 rounded-md ${space.bg} ${space.color} transition-colors`}>
              <space.icon size={16} />
            </div>
            {TRANSLATIONS[lang][space.key] || space.name}
          </Button>
        ))}
        <div className="bg-indigo-50 rounded-xl p-3 mt-4 border border-indigo-100">
           <h4 className="text-xs font-bold text-indigo-800 mb-1">{t('volunteer')}</h4>
           <button className="text-[10px] font-bold bg-indigo-600 text-white w-full py-1.5 rounded">{t('apply')}</button>
        </div>
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
            <button className="md:hidden p-1 hover:bg-slate-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
               <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <div className="md:hidden"><AppLogo size="sm"/></div>
                 <span className="md:hidden">{TRANSLATIONS[lang][activeSpaceObj?.key]}</span>
                 <span className="hidden md:block">{t('appName')}</span>
               </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
              className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <Globe size={14} />
              {lang === 'en' ? 'తెలుగు' : 'English'}
            </button>
            <Button size="sm" onClick={() => setView('create')}>
              <PenSquare size={16} /> <span className="hidden sm:inline">{t('newPost')}</span>
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {filteredPosts.map(post => (
            <div key={post.id} onClick={() => { setSelectedPost(post); setView('post-detail'); }} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <p className="text-slate-800 font-medium leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-slate-400 text-sm border-t border-slate-50 pt-2">
                <button onClick={(e) => handleLike(e, post)} className="flex items-center gap-1.5 hover:text-rose-500">
                  <Heart size={18} className={post.likes > 0 ? "fill-rose-50 text-rose-500" : ""} /> {post.likes || 0}
                </button>
                <div className="flex items-center gap-1.5 hover:text-teal-600">
                  <MessageCircle size={18} /> {post.commentCount || 0}
                </div>
              </div>
            </div>
          ))}
          <div className="mt-8 pt-4 border-t border-slate-200 px-4 text-center">
             <p className="text-[10px] text-slate-400">{t('legalTitle')}: {t('legalText')}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderCreate = () => (
    <div className="flex-1 bg-white min-h-screen">
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={() => setView('feed')} className="p-2 -ml-2 text-slate-400"><X size={24} /></button>
        <span className="font-bold text-slate-700">{t('newPost')}</span>
        <Button size="sm" disabled={!newPostContent.trim() || isSubmitting} onClick={handleCreatePost}>{t('publish')}</Button>
      </div>
      <div className="p-4 max-w-2xl mx-auto">
        <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={t('writePlace')} className="w-full h-48 p-4 text-lg text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 outline-none resize-none" />
      </div>
    </div>
  );

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
             <p className="text-xl text-slate-800 font-medium mb-6">{selectedPost.content}</p>
             <Button variant="ghost" size="sm" onClick={(e) => handleLike(e, selectedPost)}><ThumbsUp size={18} className="mr-2" /> {t('support')} ({selectedPost.likes})</Button>
          </div>
          <div className="px-4 space-y-4">
            {selectedPost.comments?.map((c, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-slate-700 text-sm">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4">
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
      
      {/* FLOATING SOS BUTTON - Now High Priority z-[9998] */}
      <button onClick={() => setShowSOS(true)} className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-300 flex items-center justify-center animate-pulse">
        <Siren size={24} />
      </button>

      {/* LEGAL GATE */}
      {!hasAgreedToLegal && <LegalGateModal lang={lang} onAccept={() => {setHasAgreedToLegal(true); localStorage.setItem('ashoka_legal_agreed', 'true');}} />}
      
      {/* CRISIS POP-UP - MAX PRIORITY z-[9999] */}
      {showSOS && <SOSModal lang={lang} onClose={() => setShowSOS(false)} />}

      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-20">
        <div className="p-5 border-b border-slate-100"><AppLogo size="md" /></div>
        <div className="p-4 flex-1 overflow-hidden"><SpaceSidebar /></div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white p-4 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
               <AppLogo size="sm" />
               <button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button>
             </div>
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


