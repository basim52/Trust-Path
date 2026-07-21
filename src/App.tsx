/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, Sparkles, Heart, Smile, BookOpen, Brain, 
  Lightbulb, ShieldCheck, UserCheck, Trash2, HelpCircle, LogOut, Loader2
} from 'lucide-react';
import { TraineeProgress, Course, COURSES_DATA, PREDEFINED_HABITS, ReframedThought, Certificate } from './types';
import TraineeDashboard from './components/TraineeDashboard';
import CourseDetail from './components/CourseDetail';
import AICoach from './components/AI_Coach';
import SuggestionsSection from './components/SuggestionsSection';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Initial state skeleton
const INITIAL_PROGRESS: TraineeProgress = {
  completedCourses: [],
  completedLessons: [],
  quizScores: {},
  certificates: [],
  dailyHabits: {},
  habitStreak: 1,
  points: 25, // starting gift XP
  gratitudeJournal: [],
  thoughtReframings: [],
  assessments: {},
  completedParagraphs: {}
};

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [progress, setProgress] = useState<TraineeProgress>(INITIAL_PROGRESS);
  const [studentName, setStudentName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email || '' });
        
        // Load data from firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.progress) {
            setProgress(data.progress);
          } else {
            setProgress(INITIAL_PROGRESS);
          }
          if (data.name) {
            setStudentName(data.name);
          } else {
            setStudentName('');
          }
        } else {
          // New user (or first time DB is provisioned), write local progress if any
          const localSaved = localStorage.getItem('trainee_progress_v1');
          let startingProgress = INITIAL_PROGRESS;
          if (localSaved) {
            try { startingProgress = JSON.parse(localSaved); } catch (e) {}
          }
          const localName = localStorage.getItem('trainee_student_name_v1') || '';
          
          setProgress(startingProgress);
          setStudentName(localName);

          await setDoc(docRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: localName,
            lastActive: new Date().toISOString(),
            progress: startingProgress
          });
        }
      } else {
        setUser(null);
        // Fallback to local storage for guests, or reset
        const saved = localStorage.getItem('trainee_progress_v1');
        if (saved) {
          try { setProgress(JSON.parse(saved)); } catch (e) { setProgress(INITIAL_PROGRESS); }
        } else {
          setProgress(INITIAL_PROGRESS);
        }
        setStudentName(localStorage.getItem('trainee_student_name_v1') || '');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state to Firestore (if logged in) and local storage
  useEffect(() => {
    if (!authLoading) {
      localStorage.setItem('trainee_progress_v1', JSON.stringify(progress));
      
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        setDoc(docRef, {
          uid: user.uid,
          email: user.email,
          name: studentName,
          lastActive: new Date().toISOString(),
          progress: progress
        }, { merge: true }).catch(err => {
          console.error("Error syncing progress to Firestore:", err);
        });
      }
    }
  }, [progress, user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      localStorage.setItem('trainee_student_name_v1', studentName);
    }
  }, [studentName, authLoading]);

  // Handle Auth success from screen
  const handleAuthSuccess = (uid: string, email: string, name: string, fetchedProgress: TraineeProgress | null) => {
    setUser({ uid, email });
    if (name) setStudentName(name);
    if (fetchedProgress) {
      setProgress(fetchedProgress);
    }
    // Set default tab for basim5252 as admin
    if (email === 'basim5252@gmail.com') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('هل ترغب في تسجيل الخروج من حسابك؟')) {
      await signOut(auth);
      setActiveTab('dashboard');
    }
  };

  // Handle resetting state for demo/testing
  const handleResetData = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط مسارك التنموي وحذف النقاط والشهادات؟')) {
      setProgress(INITIAL_PROGRESS);
      setActiveTab('dashboard');
    }
  };

  // Trainee core action handlers
  const addPoints = (amount: number) => {
    setProgress(prev => ({
      ...prev,
      points: prev.points + amount
    }));
  };

  const toggleHabit = (habitId: string) => {
    setProgress(prev => {
      const currentCompleted = !!prev.dailyHabits[habitId];
      const updatedHabits = { ...prev.dailyHabits, [habitId]: !currentCompleted };
      
      // Calculate streak bonus
      let pointsAwarded = 0;
      const habit = PREDEFINED_HABITS.find(h => h.id === habitId);
      if (habit) {
        pointsAwarded = currentCompleted ? -habit.points : habit.points;
      }

      // If completed first habit of the day, increment streak
      const wasEmpty = Object.values(prev.dailyHabits).every(v => !v);
      const isNotEmpty = Object.values(updatedHabits).some(v => v);
      let streakDelta = 0;
      if (wasEmpty && isNotEmpty) {
        streakDelta = 1;
      } else if (!isNotEmpty && !wasEmpty) {
        streakDelta = -1;
      }

      return {
        ...prev,
        dailyHabits: updatedHabits,
        points: Math.max(0, prev.points + pointsAwarded),
        habitStreak: Math.max(1, prev.habitStreak + streakDelta)
      };
    });
  };

  const addGratitudeEntry = (items: string[]) => {
    const entry = {
      id: `grat-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG'),
      items
    };

    setProgress(prev => ({
      ...prev,
      gratitudeJournal: [...prev.gratitudeJournal, entry]
    }));
  };

  const addReframedThought = (original: string, reframed: string, category: string) => {
    const thought: ReframedThought = {
      id: `thought-${Date.now()}`,
      original,
      reframed,
      category,
      date: new Date().toLocaleDateString('ar-EG')
    };

    setProgress(prev => ({
      ...prev,
      thoughtReframings: [...prev.thoughtReframings, thought]
    }));
  };

  const saveAssessmentResult = (
    type: 'self-esteem' | 'confidence', 
    score: number, 
    level: string, 
    answers: Record<string, number>
  ) => {
    setProgress(prev => ({
      ...prev,
      assessments: {
        ...prev.assessments,
        [type]: {
          score,
          level,
          date: new Date().toLocaleDateString('ar-EG'),
          answers
        }
      }
    }));
  };

  const markLessonComplete = (courseId: string, lessonId: string) => {
    const compositeId = `${courseId}-${lessonId}`;
    setProgress(prev => {
      if (prev.completedLessons.includes(compositeId)) return prev;
      return {
        ...prev,
        completedLessons: [...prev.completedLessons, compositeId]
      };
    });
  };

  const markCourseCertified = (courseId: string, courseTitle: string) => {
    setProgress(prev => {
      if (prev.completedCourses.includes(courseId)) return prev;

      // Create new dynamic certificate
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const certificate: Certificate = {
        id: `cert-${courseId}-${Date.now()}`,
        courseId,
        courseTitle,
        studentName: studentName || 'المشترك المتميز',
        issuedAt: new Date().toLocaleDateString('ar-EG'),
        verificationCode: `MT-${courseId.slice(0, 3).toUpperCase()}-${randomCode}`
      };

      return {
        ...prev,
        completedCourses: [...prev.completedCourses, courseId],
        certificates: [...prev.certificates, certificate]
      };
    });
  };

  const toggleParagraphComplete = (key: string) => {
    setProgress(prev => {
      const current = prev.completedParagraphs || {};
      const updated = {
        ...current,
        [key]: !current[key]
      };
      return {
        ...prev,
        completedParagraphs: updated
      };
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs font-black text-slate-500">جاري تحميل مسار الثقة والتطوير...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthScreen onAuthSuccess={handleAuthSuccess} initialProgress={INITIAL_PROGRESS} />
      </div>
    );
  }

  const isAdmin = user.email === 'basim5252@gmail.com';

  const navTabs = [
    ...(isAdmin ? [{ id: 'admin', label: 'لوحة إدارة المتدربين 🔐', icon: <UserCheck className="w-4 h-4" /> }] : []),
    { id: 'dashboard', label: 'لوحة التحكم والتقدم', icon: <Smile className="w-4 h-4" /> },
    { id: 'courses', label: 'الدورات والتمارين', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'coach', label: 'المستشار النفسي الذكي', icon: <Brain className="w-4 h-4" /> },
    { id: 'suggestions', label: 'توصيات المنصة', icon: <Lightbulb className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900" dir="rtl" id="app-root-container">
      
      {/* 1. Header Navbar in Arabic */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md" id="main-header">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between" id="header-inner">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3" id="branding-logo">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm" id="logo-icon">
              ✨
            </div>
            <div>
              <span className="font-black text-slate-900 text-base block font-sans" id="brand-title">مَسار الثّقَة</span>
              <span className="text-[10px] text-slate-400 font-bold block" id="brand-tag">بناء الشخصية وتقدير الذات</span>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="hidden md:flex gap-1" id="desktop-nav">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-xs' : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'}`}
                id={`tab-btn-${tab.id}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User Fast Badge Stats */}
          <div className="flex items-center gap-3" id="header-user-status">
            <div className="hidden sm:flex flex-col text-left items-end" dir="rtl">
              <span className="text-[10px] font-black text-slate-700">{studentName || 'المتدرب'}</span>
              <span className="text-[9px] text-slate-400 font-bold">{user.email}</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-2" id="header-xp-badge">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs font-extrabold text-emerald-800" id="header-xp-val">{progress.points} XP</span>
            </div>

            {/* Reset helper */}
            <button
              onClick={handleResetData}
              className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 transition-colors cursor-pointer"
              title="إعادة ضبط البيانات"
              id="btn-reset-data"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Logout helper */}
            <button
              onClick={handleSignOut}
              className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 transition-colors cursor-pointer"
              title="تسجيل الخروج"
              id="btn-sign-out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation tabs (Visible only on small screens) */}
        <div className="md:hidden border-t border-slate-100 bg-white" id="mobile-nav-bar">
          <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} divide-x divide-slate-100`} id="mobile-nav-grid">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 text-center font-bold text-[10px] transition-colors cursor-pointer ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-900' : 'text-slate-500 hover:bg-slate-50'}`}
                id={`mobile-tab-${tab.id}`}
              >
                <div className="flex justify-center">{tab.icon}</div>
                <span className="block mt-0.5">{tab.id === 'admin' ? 'الإدارة' : tab.id === 'dashboard' ? 'اللوحة' : tab.id === 'courses' ? 'الدورات' : tab.id === 'coach' ? 'المستشار' : 'التوصيات'}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. Main Content viewport wrapper */}
      <main className="min-h-[calc(100vh-160px)] pb-16" id="main-content-wrapper">
        
        {/* Render tab panel conditionally */}
        {(() => {
          switch (activeTab) {
            case 'admin':
              return isAdmin ? <AdminDashboard adminEmail={user.email} /> : null;
            case 'dashboard':
              return (
                <TraineeDashboard
                  progress={progress}
                  addPoints={addPoints}
                  toggleHabit={toggleHabit}
                  addGratitudeEntry={addGratitudeEntry}
                  saveAssessmentResult={saveAssessmentResult}
                  studentName={studentName}
                  setStudentName={setStudentName}
                  courses={COURSES_DATA}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              );
            case 'courses':
              return (
                <CourseDetail
                  progress={progress}
                  courses={COURSES_DATA}
                  addPoints={addPoints}
                  markLessonComplete={markLessonComplete}
                  markCourseCertified={markCourseCertified}
                  studentName={studentName}
                  setActiveTab={setActiveTab}
                  toggleParagraphComplete={toggleParagraphComplete}
                />
              );
            case 'coach':
              return (
                <AICoach
                  points={progress.points}
                  addPoints={addPoints}
                  thoughtReframings={progress.thoughtReframings}
                  addReframedThought={addReframedThought}
                />
              );
            case 'suggestions':
              return <SuggestionsSection />;
            default:
              return null;
          }
        })()}

      </main>

      {/* 3. Footer branding in Arabic */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-semibold" id="main-footer">
        <div className="max-w-6xl mx-auto px-4 space-y-2" id="footer-inner">
          <p id="footer-logo-text">✨ مسار الثقة والتطوير الشخصي - رحلة نحو الوعي بالذات وتأكيد القيمة النفسية</p>
          <p className="text-[10px]" id="footer-copyright">© 2026 جميع الحقوق محفوظة لمتدربي المنصة المبدعين</p>
        </div>
      </footer>

    </div>
  );
}
