import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { TraineeProgress } from '../types';
import { Mail, Lock, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
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
        return 'البريد الإلكتروني مستخدم بالفعل بحساب آخر.';
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
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
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
