import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, PenSquare, Users, Send, ThumbsUp, X, Shield, 
  AlertTriangle, Leaf, Menu, HeartHandshake, 
  Pill, ScrollText, AlertOctagon, Stethoscope, Baby, Siren, 
  AlertCircle, Globe, ChevronRight, Copy, Check, Lock, TreePine, Info, 
  Trash2, FileText
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
const POST_LIMIT = 20;

// --- DUAL KEYS (SECURITY UPGRADE) ---
const KEY_ADMIN = "ASHOKA-SUPER-ADMIN-99"; // FOR YOU ONLY (Admin + Doctor)
const KEY_DOCTOR = "ASHOKA-DOC-VERIFY";   // FOR FRIENDS (Doctor Only)

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
    zeroTolerance: "ZERO TOLERANCE: Child Abuse, Sexual Abuse, & Humiliation are banned."
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
    zeroTolerance: "గమనిక: లైంగిక వేధింపులు మరియు హింస పూర్తిగా నిషేధించబడ్డాయి."
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
    danger: "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200",
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
    
    // --- SPLIT KEY LOGIC ---
    let updateData = { verifiedAt: Date.now() };
    let successMsg = "";

    if (code === KEY_ADMIN) {
      updateData = { ...updateData, isExpert: true, isAdmin: true };
      successMsg = "✅ Admin Access Granted.";
    } else if (code === KEY_DOCTOR) {
      updateData = { ...updateData, isExpert: true, isAdmin: false };
      successMsg = "✅ Doctor Verification Successful.";
    } else {
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=Doctor Verification&body=ID: ${user.uid}`;
      return;
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), updateData, { merge: true });
      alert(successMsg);
      onClose();
      window.location.reload(); 
    } catch (e) { alert("Error: " + e.message); }
  };

  return (
    <div className="fixed inset-0 bg-emerald-900/90 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
        <h3 className="text-lg font-bold text-emerald-900 mb-2">Doctor Verification</h3>
        <p className="text-xs text-slate-500 mb-4">Enter Verification Code.</p>
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter Code" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg mb-4 text-center font-mono" />
        <Button onClick={handleVerify}>Verify Me</Button>
        <p className="text-[10px] text-slate-400 mt-4">Or click without code to email admin.</p>
      </div>
    </div>
  );
};

const AdminPanel = ({ onClose }) => {
  return (
    <div className="flex-1 bg-white min-h-screen p-6">
      <div className="flex justify-between items-center mb-6 border-b border-emerald-100 pb-4">
        <h1 className="text-xl font-bold text-emerald-900 flex items-center gap-2"><Lock/> Admin Dashboard</h1>
        <button onClick={onClose}><X size={24}/></button>
      </div>
      <div className="space-y-4">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <h3 className="font-bold text-emerald-800 mb-2">Your Superpowers:</h3>
          <ul className="text-sm text-emerald-700 space-y-2">
            <li>✅ <strong>Delete Posts:</strong> You see a Trash Can on EVERY post.</li>
            <li>🔑 <strong>Doctor Key:</strong> Share "ASHOKA-DOC-VERIFY".</li>
            <li>🔐 <strong>Admin Key:</strong> Keep "ASHOKA-SUPER-ADMIN-99".</li>
          </ul>
        </div>
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
        <p className="text-xs leading-relaxed font-bold">{TRANSLATIONS[lang].zeroTolerance}</p>
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
      <p className="text-slate-600 mb-2 text-sm font-bold">We care about you too much to let you post this.</p>
      <p className="text-slate-500 mb-6 text-xs">If you are in crisis, please speak to a counselor right now.</p>
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
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid), (snap) => {
          if (snap.exists()) setUserData(snap.data());
          else setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid), { isExpert: false });
        });
      }
    });
  }, []);

  // Data Fetch
  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(POST_LIMIT)
    );
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
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION), {
      content: newPostContent, space: activeSpace, authorId: user?.uid, isExpert: userData.isExpert, likes: 0, comments: [], createdAt: serverTimestamp()
    });
    setNewPostContent(''); setView('feed');
  };

  const handleComment = async () => {
    if (!newComment.trim() || !checkSafety(newComment)) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION, selectedPost.id);
    await updateDoc(ref, { comments: arrayUnion({ text: newComment, authorId: user?.uid, isExpert: userData.isExpert, createdAt: Date.now() }) });
    setNewComment('');
  };

  const handleDelete = async (e, post) => {
    e.stopPropagation();
    if(!confirm("Delete this post? This cannot be undone.")) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', POSTS_COLLECTION, post.id)); } catch(err) { alert("You can only delete your own posts."); }
  };

  if (!hasAgreed) return <LegalGateModal onAccept={() => setHasAgreed(true)} lang={lang} />;

  const activeSpaceObj = SPACES.find(s => s.id === activeSpace);
  const filteredPosts = posts.filter(p => p.space === activeSpace);
  const isClinical = activeSpace === 'Clinical';

  // --- LEGAL CENTER PAGE ---
  if (view === 'legal') return (
    <div className="flex-1 bg-white min-h-screen p-6 font-sans text-slate-900">
      <button onClick={() => setView('feed')} className="mb-6 flex items-center gap-2 text-emerald-800 font-bold"><ChevronRight className="rotate-180"/> Back</button>
      <h1 className="text-2xl font-bold mb-4">Community Constitution</h1>
      
      <div className="space-y-6 text-sm">
        <section className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <h2 className="text-lg font-bold text-teal-800 mb-2 flex items-center gap-2"><Check size={18}/> THE DOs</h2>
          <ul className="list-disc pl-5 space-y-1 text-teal-900">
             <li>Do share your feelings and struggles honestly.</li>
             <li>Do be kind and respectful to others.</li>
             <li>Do report any post that makes you uncomfortable.</li>
             <li>Do verify your profile if you are a medical professional.</li>
          </ul>
        </section>

        <section className="bg-red-50 p-4 rounded-xl border border-red-100">
          <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2"><X size={18}/> THE DON'Ts</h2>
          <ul className="list-disc pl-5 space-y-1 text-red-900">
             <li>Don't share your Phone Number, Email, or Instagram. (Immediate Ban).</li>
             <li>Don't use abusive, violent, or blaming language. (Zero Tolerance).</li>
             <li>Don't ask for or give specific medical prescriptions.</li>
             <li>Don't assume this app replaces your doctor. In emergencies, call 108.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-teal-700">Grievance Officer</h2>
          <p className="text-slate-600">Contact: {ADMIN_EMAIL}</p>
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 font-sans text-slate-900">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      {showVerify && <VerificationModal user={user} onClose={() => setShowVerify(false)} />}

      <button onClick={() => setShowSOS(true)} className="fixed bottom-6 left-6 z-[9000] w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-300 flex items-center justify-center animate-pulse border-4 border-white"><Siren size={24}/></button>
      
      {/* STICKY FOOTER DISCLAIMER */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-100 text-amber-900 text-[10px] p-1 text-center z-[8000] font-bold border-t border-amber-200">
        ⚠️ Not a medical service. For emergencies, click SOS.
      </div>

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
          <div className="mt-6 pt-6 border-t border-emerald-100 space-y-2">
            <Button variant="ghost" onClick={() => { setView('legal'); setMobileMenuOpen(false); }} className="text-xs w-full"><FileText size={14}/> Rules & Safety</Button>
            {!userData?.isExpert && <Button variant="secondary" onClick={() => setShowVerify(true)} className="text-xs w-full">{t('verifyBtn')}</Button>}
            {userData?.isAdmin && <Button variant="primary" onClick={() => setView('admin')} className="text-xs w-full"><Lock size={14}/> {t('adminBtn')}</Button>}
          </div>
        </div>
      </div>

      <div className="flex-1 md:ml-64 relative z-0 pb-6">
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
                    
                    {(user?.uid === post.authorId || userData?.isAdmin) && (
                       <button onClick={(e) => handleDelete(e, post)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                    )}
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{post.content}</p>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex gap-4 text-xs text-slate-400">
                    <span>{post.likes || 0} Likes</span>
                    <span>{post.comments?.length || 0} Comments</span>
                  </div>
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
                   <div><h4 className="font-bold text-red-900 text-xs">CONFIDENTIALITY PROTOCOL</h4><p className="text-[10px] text-red-800 mt-1">Strictly No Patient Names. No Prescriptions. Anonymized Cases Only.</p></div>
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
            <div className="fixed bottom-6 right-0 md:left-64 bg-white border-t border-slate-200 p-4 flex gap-2 z-[9000] w-full md:w-auto mb-4">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-slate-100 rounded-xl px-4 outline-none" placeholder="Reply..." />
              <Button onClick={handleComment}><Send size={18}/></Button>
            </div>
          </div>
        )}

        {view === 'admin' && <AdminPanel onClose={() => setView('feed')} />}
      </div>
    </div>
  );
}


