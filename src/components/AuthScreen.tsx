import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  AuthError,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { TraineeProgress } from '../types';
import { Mail, Lock, User, Sparkles, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onAuthSuccess: (uid: string, email: string, name: string, progress: TraineeProgress | null) => void;
  initialProgress: TraineeProgress;
}

export default function AuthScreen({ onAuthSuccess, initialProgress }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showGoogleTroubleshooting, setShowGoogleTroubleshooting] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const getArError = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'عنوان البريد الإلكتروني غير صالح.';
      case 'auth/user-disabled':
        return 'تم تعطيل حساب هذا المستخدم.';
      case 'auth/user-not-found':
        return 'لا يوجد مستخدم مسجل بهذا البريد الإلكتروني.';
      case 'auth/wrong-password':
        return 'كلمة المرور غير صحيحة.';
      case 'auth/email-already-in-use':
        return 'البريد الإلكتروني مستخدم بالفعل بحساب آخر. الرجاء التبديل إلى "تسجيل الدخول" بالأعلى للدخول إلى حسابك.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة جداً (يجب أن لا تقل عن 6 خانات).';
      case 'auth/invalid-credential':
        return 'بيانات الاعتماد غير صالحة، يرجى التحقق من البريد وكلمة المرور.';
      default:
        return 'حدث خطأ غير متوقع: ' + error.message;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      setLoading(false);
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('يرجى إدخال اسمك الكريم لتخصيص الشهادات.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        const uid = userCredential.user.uid;
        
        // Fetch custom progress from Firestore
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          onAuthSuccess(uid, trimmedEmail, userData.name || '', userData.progress || null);
        } else {
          onAuthSuccess(uid, trimmedEmail, '', null);
        }
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        const uid = userCredential.user.uid;
        const studentName = name.trim();

        // Setup user doc in Firestore
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, {
          uid,
          email: trimmedEmail,
          name: studentName,
          lastActive: new Date().toISOString(),
          progress: initialProgress
        });

        onAuthSuccess(uid, trimmedEmail, studentName, initialProgress);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(getArError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setShowGoogleTroubleshooting(false);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      const email = user.email || '';
      const name = user.displayName || 'مشارك مجهول';
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        onAuthSuccess(user.uid, email, userData.name || name, userData.progress || null);
      } else {
        // Create user document with initial progress
        await setDoc(userDocRef, {
          uid: user.uid,
          email: email,
          name: name,
          lastActive: new Date().toISOString(),
          progress: initialProgress
        });
        onAuthSuccess(user.uid, email, name, initialProgress);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setShowGoogleTroubleshooting(true);
      if (err.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالمنبثقات لهذا الموقع أو فتح التطبيق في علامة تبويب جديدة مستقلة.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('تم إلغاء عملية تسجيل الدخول من جوجل.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول بجوجل. المتصفحات تمنع النوافذ المنبثقة وحفظ الجلسات تلقائياً للمواقع التي تفتح داخل نافذة مدمجة (Iframe).');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-slate-150 rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Brand Banner */}
        <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-1 text-[11px] font-bold px-2.5">
            نظام متصل وآمن 🔒
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-sm backdrop-blur-xs">
            ✨
          </div>
          <h1 className="text-2xl font-black tracking-tight font-sans">مَسار الثّقَة</h1>
          <p className="text-emerald-100 text-xs mt-1.5 font-medium leading-relaxed">
            منصتكم التفاعلية المتكاملة لبناء الشخصية القوية وتقدير الذات
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 p-1 bg-slate-50">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all rounded-2xl cursor-pointer ${
              isLogin 
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all rounded-2xl cursor-pointer ${
              !isLogin 
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs font-semibold flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{error}</span>
              </div>
              
              {error.includes('البريد الإلكتروني مستخدم بالفعل') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className="mt-1 text-right text-emerald-700 hover:text-emerald-800 underline text-[11px] font-black cursor-pointer self-start"
                >
                  اضغط هنا للتبديل الفوري إلى "تسجيل الدخول" 🔑
                </button>
              )}

              {showGoogleTroubleshooting && (
                <div className="mt-3 bg-white p-4 rounded-xl border border-red-100 text-slate-700 text-[11px] font-semibold space-y-3 shadow-3xs" dir="rtl">
                  <p className="text-red-700 font-extrabold text-[12px] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    ⚙️ دليل حل مشكلة تسجيل دخول Google:
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-extrabold text-emerald-800">الحل الأول والسريع (موصى به لجميع المتصفحات):</p>
                    <p className="leading-relaxed text-slate-600">
                      اضغط على زر <strong className="text-slate-800">"فتح في علامة تبويب جديدة" ↗️</strong> الموجود في أعلى يمين نافذة معاينة AI Studio. يمنع المتصفح النوافذ المنبثقة من العمل بشكل طبيعي إذا كان التطبيق مفتوحاً داخل نافذة مدمجة (Iframe).
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full mt-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح التطبيق في نافذة مستقلة وتكرار المحاولة</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-2">
                    <p className="font-extrabold text-amber-800">الحل الثاني (إذا كنت مالك المشروع في Firebase):</p>
                    <p className="leading-relaxed text-slate-500">
                      يجب عليك ترخيص وإضافة نطاقات المعاينة المعتمدة في لوحة تحكم Firebase الخاصة بك. اذهب إلى:
                      <br />
                      <strong className="text-slate-700">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</strong>
                      <br />
                      وقم بإضافة المجالين التاليين كـ <strong className="text-slate-700">Authorized Domains</strong>:
                    </p>
                    <ul className="list-disc list-inside bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[9.5px] text-slate-600 space-y-1 select-all" dir="ltr">
                      <li>ais-dev-rxwrvbvebudbsolfywpljw-287964971170.europe-west2.run.app</li>
                      <li>ais-pre-rxwrvbvebudbsolfywpljw-287964971170.europe-west2.run.app</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Name Field (Sign Up Only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">الاسم الكريم بالكامل</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="مثال: باسم العتيبي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right"
                  required={!isLogin}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">سيتم طباعة هذا الاسم على شهادات إنجاز الدورات.</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700">البريد الإلكتروني</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-left"
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black text-slate-700">كلمة المرور</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-left"
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              loading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري المعالجة...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isLogin ? 'تسجيل الدخول إلى حسابي' : 'إنشاء حساب جديد وتفعيل المسار'}</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-150"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-400">أو سجل عبر</span>
            <div className="flex-grow border-t border-slate-150"></div>
          </div>

          {/* Google Login Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" referrerPolicy="no-referrer">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.65 0 3.13.57 4.3 1.69l3.22-3.22C17.56 1.77 14.97 1 12 1 7.35 1 3.4 3.65 1.51 7.5l3.75 2.91C6.15 7.15 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.71 2.88c2.17-2 3.7-4.94 3.7-8.61z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.26 14.75a7.12 7.12 0 0 1 0-4.5L1.51 7.34a11.96 11.96 0 0 0 0 10.32l3.75-2.91z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.25 1.1-3.13 0-5.85-2.11-6.79-5.37L1.46 16.3A11.97 11.97 0 0 0 12 23z"
                />
              </svg>
              <span>تسجيل الدخول السريع باستخدام Google</span>
            </button>

            {isInIframe && (
              <div className="bg-amber-50/75 border border-amber-100 p-3 rounded-xl text-[10.5px] text-amber-800 font-bold leading-relaxed space-y-1.5">
                <p className="flex items-center gap-1 text-amber-900">
                  ⚠️ <span>ملاحظة أمان هامة للمعالجة داخل الإطار (Iframe):</span>
                </p>
                <p className="text-amber-800/90">
                  بما أن التطبيق يفتح داخل إطار مدمج، فقد يمنع المتصفح نوافذ تسجيل دخول جوجل المنبثقة لحماية خصوصيتك. يرجى الضغط على زر <strong className="text-amber-950 underline cursor-pointer hover:text-emerald-700" onClick={() => window.open(window.location.href, '_blank')}>فتح في علامة تبويب جديدة ↗️</strong> بالأعلى لتسجيل الدخول بجوجل بنجاح تام وسريع.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Informative Footer */}
        <div className="px-8 pb-8 text-center border-t border-slate-50 pt-4 bg-slate-50/50">
          <p className="text-[11px] text-slate-400 font-semibold">
            {isLogin ? 'ليس لديك حساب بعد؟ قم بالتبديل لإنشاء حساب وتأمين تقدمك.' : 'لديك حساب بالفعل؟ قم بالتبديل لتسجيل الدخول.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
