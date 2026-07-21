/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, Heart, Smile, Star, CheckSquare, ListTodo, Plus, Calendar, 
  BarChart2, ChevronRight, AwardIcon, Compass, Sparkles, User, RefreshCw, Printer, Share2, Shield, Eye
} from 'lucide-react';
import { 
  TraineeProgress, PREDEFINED_HABITS, CONFIDENCE_ASSESSMENT, 
  ESTEEM_ASSESSMENT, AFFIRMATIONS, Course, AssessmentQuestion, Certificate 
} from '../types';

interface TraineeDashboardProps {
  progress: TraineeProgress;
  addPoints: (p: number) => void;
  toggleHabit: (habitId: string) => void;
  addGratitudeEntry: (items: string[]) => void;
  saveAssessmentResult: (type: 'self-esteem' | 'confidence', score: number, level: string, answers: Record<string, number>) => void;
  studentName: string;
  setStudentName: (name: string) => void;
  courses: Course[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TraineeDashboard({
  progress, addPoints, toggleHabit, addGratitudeEntry, 
  saveAssessmentResult, studentName, setStudentName, courses, activeTab, setActiveTab
}: TraineeDashboardProps) {

  // Local state
  const [mood, setMood] = useState<string | null>(null);
  const [moodLog, setMoodLog] = useState<{ date: string; mood: string }[]>([]);
  const [gratitudeInputs, setGratitudeInputs] = useState(['', '', '']);
  const [activeAssessment, setActiveAssessment] = useState<'self-esteem' | 'confidence' | null>(null);
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  
  // AI Coach Feedback loading state
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [aiFeedbackResult, setAiFeedbackResult] = useState<string | null>(null);

  // Certificate Modal state
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Randomized Daily Affirmation
  const [dailyAffirmation, setDailyAffirmation] = useState(AFFIRMATIONS[0]);

  const spinAffirmation = () => {
    const available = AFFIRMATIONS.filter(a => a !== dailyAffirmation);
    const rand = available[Math.floor(Math.random() * available.length)];
    setDailyAffirmation(rand);
    addPoints(2); // minor points for reading daily affirmations
  };

  const handleMoodSelect = (selectedMood: string) => {
    setMood(selectedMood);
    setMoodLog(prev => [{ date: new Date().toLocaleDateString('ar-EG'), mood: selectedMood }, ...prev.slice(0, 4)]);
    addPoints(5);
  };

  const handleGratitudeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gratitudeInputs.some(input => !input.trim())) return;
    addGratitudeEntry(gratitudeInputs);
    setGratitudeInputs(['', '', '']);
    addPoints(15);
  };

  // Assessment flow helpers
  const startAssessment = (type: 'self-esteem' | 'confidence') => {
    setActiveAssessment(type);
    setAssessmentStep(0);
    setAssessmentAnswers({});
    setAiFeedbackResult(null);
  };

  const selectAnswer = (questionId: string, score: number) => {
    setAssessmentAnswers(prev => ({ ...prev, [questionId]: score }));
    
    const questions = activeAssessment === 'self-esteem' ? ESTEEM_ASSESSMENT : CONFIDENCE_ASSESSMENT;
    if (assessmentStep < questions.length - 1) {
      setAssessmentStep(prev => prev + 1);
    } else {
      // End of assessment, compute score
      const updatedAnswers: Record<string, number> = { ...assessmentAnswers, [questionId]: score };
      let totalScore = 0;
      Object.values(updatedAnswers).forEach((s: number) => { totalScore += s; });

      // Max score is 20 (5 questions * 4 max score)
      let level = "";
      if (totalScore >= 17) level = "متزن وممتاز (ثقة وتقدير عالي جداً)";
      else if (totalScore >= 13) level = "متوسط ومستقر (هناك فرص جيدة للتعزيز)";
      else if (totalScore >= 8) level = "بحاجة لتطوير (مخاوف وجلد ذات يحتاج معالجة)";
      else level = "منخفض جداً (ننصح بالبدء بالدورات والمستشار فوراً)";

      saveAssessmentResult(activeAssessment!, totalScore, level, updatedAnswers);
      addPoints(30); // Assessment complete points
      setAssessmentStep(prev => prev + 1); // move to results card
    }
  };

  const getAiDetailedFeedback = async (type: 'self-esteem' | 'confidence', score: number, answers: Record<string, number>) => {
    setIsGeneratingFeedback(true);
    setAiFeedbackResult(null);
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assessmentType: type,
          score,
          answers
        })
      });

      if (!response.ok) throw new Error('فشل توليد التقرير');
      const data = await response.json();
      setAiFeedbackResult(data.reply);
      addPoints(15);
    } catch (err) {
      console.error(err);
      setAiFeedbackResult(`*أهلاً بك المتدرب المتميز: ${studentName || 'المشترك'}!*\n\nتظهر نتائجك درجة (${score}/20). نحن نوصي بالبدء الفوري بدورة **"أساسيات تقدير الذات"** لتطوير نظرة إيجابية واقعية تجاه نفسك، والتواصل يومياً مع المستشار الذكي لمتابعة تقدمك.\n\n*خطوتك العملية اليوم:* استبدل لوم النفس بعبارة تعاطف: "أنا بشر، أتعلم وأتطور باستمرار".`);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // Level determination based on points
  const getLevelName = (p: number) => {
    if (p >= 500) return "مرشد وواثق ذاتي ملهم 👑";
    if (p >= 300) return "ممارس الثقة المتمكن ✨";
    if (p >= 150) return "مستكشف تقدير الذات 🚀";
    return "مبتدئ النمو والوعي 🌱";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="dashboard-module">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-gradient-to-l from-emerald-600 to-teal-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 mb-8" id="hero-banner">
        <div className="flex items-center gap-4 relative z-10" id="hero-profile-area">
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0" id="profile-avatar">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2" id="hero-greeting">
              <h1 className="text-xl font-extrabold text-white">أهلاً بك في مسار النمو،</h1>
              <input 
                type="text" 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="اكتب اسمك الثلاثي لطباعة الشهادة..."
                className="bg-transparent border-b border-dashed border-emerald-200 text-white font-extrabold text-lg focus:outline-none focus:border-white w-44 px-1"
                id="student-name-input"
              />
            </div>
            <p className="text-xs text-emerald-100 font-medium mt-1" id="hero-level-display">
              مستوى تقدمك الحالي: <span className="text-white font-bold bg-white/25 px-2.5 py-0.5 rounded-full">{getLevelName(progress.points)}</span>
            </p>
          </div>
        </div>

        {/* Scoring Statistics */}
        <div className="flex gap-4 items-center bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-xs relative z-10" id="points-stat-box">
          <div className="text-center px-4 border-l border-white/25" id="stat-points">
            <span className="block text-2xl font-black text-white" id="points-counter">{progress.points}</span>
            <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">نقاط التطوير XP</span>
          </div>
          <div className="text-center px-4" id="stat-certs">
            <span className="block text-2xl font-black text-white" id="certs-counter">{progress.certificates.length}</span>
            <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">الشهادات المكتسبة</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-grid">
        
        {/* Left Column (8 cols): Interactive Exercises, Self-Assessments & Journal */}
        <div className="lg:col-span-8 space-y-8" id="dash-left-column">
          
          {/* A. Affirmations Wheel & Mood Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="wheel-mood-grid">
            
            {/* Affirmation Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[230px]" id="affirmations-card">
              <div id="affirmation-header" className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> تأكيدك الإيجابي اليومي
                </span>
                <button 
                  onClick={spinAffirmation}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="تغيير التأكيد"
                  id="btn-spin-affirmation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-slate-700 text-base font-medium leading-relaxed py-4 text-center italic" id="affirmation-body">
                " {dailyAffirmation} "
              </p>

              <div className="text-center" id="affirmation-footer">
                <span className="text-[10px] text-slate-400">
                  رددها بتركيز وعمق داخلي 3 مرات لتبرمج عقلك الباطن
                </span>
              </div>
            </div>

            {/* Mood Tracker Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[230px]" id="mood-tracker-card">
              <div id="mood-header">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-emerald-500" /> متابعة حالتك ومزاجك اليومي
                </span>
                <h3 className="font-bold text-slate-800 text-sm mt-1" id="mood-prompt">كيف تشعر تجاه نفسك اليوم؟</h3>
              </div>

              <div className="flex justify-around py-3" id="mood-emojis">
                {[
                  { emoji: '😊', label: 'واثق وسعيد', points: 5 },
                  { emoji: '😌', label: 'مسترخٍ ومتزن', points: 5 },
                  { emoji: '😐', label: 'مقبول وعادي', points: 5 },
                  { emoji: '😔', label: 'متردد وقلق', points: 5 },
                  { emoji: '😠', label: 'محبط وناقم', points: 5 }
                ].map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMoodSelect(m.label)}
                    className={`text-2xl p-2 rounded-xl transition-all hover:scale-125 cursor-pointer ${mood === m.label ? 'bg-emerald-50 border border-emerald-300 scale-110 shadow-xs' : 'hover:bg-slate-50'}`}
                    title={m.label}
                    id={`mood-btn-${idx}`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>

              <div className="text-center text-xs text-slate-500" id="mood-feedback">
                {mood ? (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full inline-block" id="mood-logged-tag">
                    تم تسجيل شعورك: {mood} (+5 نقاط تطوير)
                  </span>
                ) : (
                  <span className="text-slate-400">تسجيل المزاج يساعد على مراقبة استقرارك النفسي</span>
                )}
              </div>
            </div>

          </div>

          {/* B. Self-Assessments (Confidence & Self-Esteem Scales) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm" id="assessments-container">
            <div className="flex items-center gap-3 mb-6" id="assessments-title-area">
              <div className="p-2 bg-slate-50 text-slate-700 rounded-xl" id="assessments-icon-wrap">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 text-base" id="assessments-h2">📊 مقاييس النمو النفسي والوعي بالذات</h2>
                <p className="text-xs text-slate-500 font-medium" id="assessments-sub">أجب بصدق عن الأسئلة وسيقوم المستشار الذكي بتقديم توصيات مخصصة لك</p>
              </div>
            </div>

            {/* If no active assessment is chosen, show options */}
            {!activeAssessment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="assessments-selector">
                
                {/* 1. Self Esteem Assessment Button */}
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3 flex flex-col justify-between" id="box-esteem-ass">
                  <div>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded" id="label-esteem-tag">تقدير قبول الذات</span>
                    <h3 className="font-bold text-slate-800 text-sm mt-2" id="title-esteem-ass">مقياس قبول وتقدير الذات</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1" id="desc-esteem-ass">قياس مدى حبك لذاتك، ترويضك للناقد الداخلي، وقدرتك على تقبل نقاط القصور كإنسان طبيعي.</p>
                  </div>
                  <div className="pt-2 flex justify-between items-center" id="footer-esteem-ass">
                    <span className="text-xs text-slate-400 font-bold" id="score-esteem-ass">
                      {progress.assessments['self-esteem'] ? `آخر نتيجة: ${progress.assessments['self-esteem'].score}/20` : 'لم يتم الاختبار بعد'}
                    </span>
                    <button 
                      onClick={() => startAssessment('self-esteem')}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      id="btn-start-esteem-ass"
                    >
                      {progress.assessments['self-esteem'] ? 'إعادة التقييم' : 'بدء المقياس'}
                    </button>
                  </div>
                </div>

                {/* 2. Self Confidence Assessment Button */}
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3 flex flex-col justify-between" id="box-confidence-ass">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded" id="label-conf-tag">الجرأة والثبات</span>
                    <h3 className="font-bold text-slate-800 text-sm mt-2" id="title-confidence-ass">مقياس الثقة بالنفس والجرأة الاجتماعية</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1" id="desc-confidence-ass">قياس جراءتك الاجتماعية، قدرتك على التعامل مع الجمهور والرهاب، ومستوى ثباتك ومواجهة الرفض.</p>
                  </div>
                  <div className="pt-2 flex justify-between items-center" id="footer-confidence-ass">
                    <span className="text-xs text-slate-400 font-bold" id="score-confidence-ass">
                      {progress.assessments['confidence'] ? `آخر نتيجة: ${progress.assessments['confidence'].score}/20` : 'لم يتم الاختبار بعد'}
                    </span>
                    <button 
                      onClick={() => startAssessment('confidence')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      id="btn-start-confidence-ass"
                    >
                      {progress.assessments['confidence'] ? 'إعادة التقييم' : 'بدء المقياس'}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* ACTIVE ASSESSMENT FLOW SCREEN */
              <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 relative" id="active-assessment-board">
                
                {/* Close Assessment Button */}
                <button 
                  onClick={() => setActiveAssessment(null)}
                  className="absolute left-4 top-4 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  id="btn-close-assessment"
                >
                  إلغاء المقياس ✕
                </button>

                {/* Header info */}
                <div className="mb-4" id="active-ass-header">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/50 px-2.5 py-1 rounded" id="active-ass-title">
                    {activeAssessment === 'self-esteem' ? 'مقياس قبول وتقدير الذات' : 'مقياس الثقة والجرأة الاجتماعية'}
                  </span>
                </div>

                {/* Questions Sliders or Final Scorecard */}
                {(() => {
                  const questions = activeAssessment === 'self-esteem' ? ESTEEM_ASSESSMENT : CONFIDENCE_ASSESSMENT;
                  
                  // Scenario step
                  if (assessmentStep < questions.length) {
                    const q: AssessmentQuestion = questions[assessmentStep];
                    return (
                      <div className="space-y-4" id={`ass-step-box-${assessmentStep}`}>
                        <div className="flex justify-between text-xs text-slate-400 font-bold" id="ass-steps-counter">
                          <span>السؤال {assessmentStep + 1} من {questions.length}</span>
                          <span>نسبة الإنجاز: {Math.round(((assessmentStep) / questions.length) * 100)}%</span>
                        </div>
                        
                        <h3 className="font-extrabold text-slate-800 text-base" id={`ass-q-text-${q.id}`}>{q.text}</h3>
                        
                        <div className="grid grid-cols-1 gap-3 pt-2" id={`ass-options-${q.id}`}>
                          {q.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => selectAnswer(q.id, opt.score)}
                              className="w-full text-right p-4 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-xl text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-xs"
                              id={`ass-option-btn-${q.id}-${oIdx}`}
                            >
                              {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    // Result scorecard!
                    const result = progress.assessments[activeAssessment];
                    if (!result) return null;
                    return (
                      <div className="text-center space-y-4 py-4" id="assessment-scorecard">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl font-black mx-auto shadow-inner" id="scorecard-circle">
                          {result.score}/20
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg" id="scorecard-title">تم إنهاء المقياس بنجاح! 🎉</h3>
                        <p className="text-sm text-slate-600 font-medium" id="scorecard-level">
                          مستواك الحالي: <span className="text-emerald-800 font-bold">{result.level}</span>
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3" id="scorecard-actions">
                          <button
                            onClick={() => getAiDetailedFeedback(activeAssessment, result.score, result.answers)}
                            disabled={isGeneratingFeedback}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
                            id="btn-get-ai-analysis"
                          >
                            {isGeneratingFeedback ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                <span>جاري استشارة المستشار الذكي...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-emerald-200" />
                                <span>الحصول على تحليل المستشار الذكي المخصص</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setActiveAssessment(null)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-colors"
                            id="btn-scorecard-exit"
                          >
                            رجوع للقائمة الرئيسية
                          </button>
                        </div>

                        {/* AI Coach Detailed Feedback Panel */}
                        {aiFeedbackResult && (
                          <div className="mt-6 text-right bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-3" id="ai-feedback-board">
                            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5" id="ai-feedback-header">
                              <Sparkles className="w-4 h-4 text-emerald-500" /> تقرير وتوصيات المستشار الذكي المخصصة:
                            </h4>
                            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3 font-sans" id="ai-feedback-text">
                              {aiFeedbackResult}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}

              </div>
            )}
          </div>

          {/* C. Daily Gratitude Journal Diary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6" id="gratitude-journal-card">
            <div className="flex items-center gap-3 justify-between" id="gratitude-header-row">
              <div className="flex items-center gap-3" id="gratitude-meta">
                <div className="p-2 bg-red-50 text-red-500 rounded-xl" id="gratitude-icon-wrap">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 text-base" id="gratitude-h2">📓 دفتر مذكرات الامتنان والتقدير الذاتي</h2>
                  <p className="text-xs text-slate-500 font-medium" id="gratitude-sub">اكتب 3 أشياء بسيطة ومتميزة تشعر بالامتنان والتقدير لها اليوم لتزيد سعادتك النفسية</p>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-bold" id="gratitude-award-tag">جائزة التدوين: +15 نقطة XP</div>
            </div>

            <form onSubmit={handleGratitudeSubmit} className="space-y-3" id="gratitude-form">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="gratitude-inputs-grid">
                {gratitudeInputs.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const updated = [...gratitudeInputs];
                      updated[idx] = e.target.value;
                      setGratitudeInputs(updated);
                    }}
                    placeholder={`الشيء رقم ${idx + 1} الممتن له...`}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-400 text-right font-sans bg-slate-50/50"
                    dir="rtl"
                    required
                    id={`gratitude-input-${idx}`}
                  />
                ))}
              </div>
              <div className="text-left" id="gratitude-submit-wrap">
                <button
                  type="submit"
                  disabled={gratitudeInputs.some(input => !input.trim())}
                  className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  id="gratitude-save-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> حفظ في مفكرتي السرية اليومية
                </button>
              </div>
            </form>

            {/* List of saved gratitudes */}
            {progress.gratitudeJournal.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100" id="gratitude-history-area">
                <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1" id="grat-hist-title">
                  📝 ذكريات الامتنان المسجلة ({progress.gratitudeJournal.length})
                </h3>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1" id="gratitude-scroll">
                  {progress.gratitudeJournal.slice().reverse().map((entry) => (
                    <div key={entry.id} className="p-3 bg-red-50/30 rounded-xl text-xs border border-red-100/50 space-y-1.5" id={`grat-item-${entry.id}`}>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold" id={`grat-item-meta-${entry.id}`}>
                        <span>🗓️ {entry.date}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium mr-2 text-right" id={`grat-item-list-${entry.id}`}>
                        {entry.items.map((it, idx) => (
                          <li key={idx} className="mr-2" id={`grat-sub-item-${entry.id}-${idx}`}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Developer Coded Habits & Achievements (Certificates) */}
        <div className="lg:col-span-4 space-y-8" id="dash-right-column">
          
          {/* A. Habit Tracker Panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4" id="habit-tracker-panel">
            <div className="flex items-center justify-between" id="habit-title-row">
              <div className="flex items-center gap-2" id="habit-heading">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-850 text-sm">تتبع العادات التنموية</h3>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold" id="habit-streak-display">
                🔥 تتابع: {progress.habitStreak} أيام
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed" id="habit-prompt-p">
              أكمل المهام النفسية والسلوكية اليومية لتغذي ثقتك وتحصد نقاط XP الإضافية:
            </p>

            <div className="space-y-3" id="habits-list">
              {PREDEFINED_HABITS.map((habit) => {
                const isCompleted = !!progress.dailyHabits[habit.id];
                return (
                  <div 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50'}`}
                    id={`habit-row-${habit.id}`}
                  >
                    <div className="flex items-center gap-3" id={`habit-detail-${habit.id}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`} id={`habit-check-box-${habit.id}`}>
                        {isCompleted && <CheckSquare className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`} id={`habit-title-span-${habit.id}`}>
                        {habit.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" id={`habit-points-tag-${habit.id}`}>
                      +{habit.points} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Certificates Gallery Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4" id="certificates-wall-panel">
            <div className="flex items-center gap-2" id="certs-heading-row">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-850 text-sm">وثائق وإثباتات التميز ({progress.certificates.length})</h3>
            </div>

            {progress.certificates.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200" id="certs-empty-box">
                <AwardIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold" id="certs-empty-p">لم تحصل على أي شهادة إتمام بعد.</p>
                <p className="text-[10px] text-slate-400 mt-1 px-4" id="certs-empty-guide">أنهِ جميع دروس أي دورة واجتز اختبارها النهائي بنسبة 70% للحصول على شهادتك!</p>
              </div>
            ) : (
              <div className="space-y-3" id="certs-list">
                {progress.certificates.map((cert) => (
                  <div 
                    key={cert.id}
                    className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center justify-between"
                    id={`cert-item-${cert.id}`}
                  >
                    <div id={`cert-item-meta-${cert.id}`}>
                      <h4 className="text-xs font-bold text-slate-800" id={`cert-item-title-${cert.id}`}>{cert.courseTitle}</h4>
                      <span className="text-[9px] text-slate-400 block font-medium" id={`cert-item-date-${cert.id}`}>منحت في: {cert.issuedAt}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="bg-white border border-emerald-200 text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                      id={`cert-view-btn-${cert.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> عرض وثيقة الإتمام
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>



        </div>

      </div>

      {/* 2. Full-Screen Elegant Certificate Modal Backdrop */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="certificate-modal-overlay">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative border-8 border-double border-emerald-800" id="certificate-modal-box">
            
            {/* Close modal Button */}
            <button 
              onClick={() => setSelectedCertificate(null)}
              className="absolute left-4 top-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              id="btn-close-cert-modal"
            >
              ✕
            </button>

            {/* High Fidelity Certificate Design Area */}
            <div className="border-4 border-emerald-100 p-8 text-center space-y-6 relative overflow-hidden bg-[radial-gradient(#f4fbf7_1px,transparent_1px)] [background-size:16px_16px]" id="certificate-print-area">
              
              {/* Background watermark badge */}
              <div className="absolute right-1/2 bottom-1/2 translate-x-1/2 translate-y-1/2 opacity-[0.03]" id="cert-watermark">
                <Award className="w-[350px] h-[350px] text-emerald-900" />
              </div>

              {/* Certificate Header */}
              <div className="space-y-2" id="cert-print-header">
                <span className="text-emerald-800 text-xs font-bold tracking-wider uppercase block">وثيقة إتمام وتأهيل معتمدة</span>
                <h2 className="text-3xl font-black text-slate-850 font-sans" id="cert-print-logo">مَسار الثّقَة والتّطوِير الشَّخصِي</h2>
                <div className="w-24 h-1 bg-emerald-600 mx-auto my-3" id="cert-divider-line"></div>
              </div>

              {/* Trainee description */}
              <div className="space-y-4 pt-4" id="cert-print-body">
                <p className="text-sm text-slate-500 font-medium">تشهد إدارة منصة "مسار الثقة" بأن المتدرب المتميز:</p>
                <p className="text-2xl font-black text-emerald-950 font-sans border-b-2 border-dashed border-emerald-300 w-max mx-auto px-6 py-1" id="cert-print-trainee-name">
                  {selectedCertificate.studentName || 'صديق المنصة المتميز'}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto pt-2">
                  قد اجتاز بنجاح وتفوق جميع الدروس التدريبية، التمارين المعرفية السلوكية والاختبار النهائي التقييمي في المسار التنموي:
                </p>
                <p className="text-lg font-extrabold text-slate-800 bg-emerald-50/50 px-4 py-1.5 rounded-lg w-max mx-auto border border-emerald-100" id="cert-print-course-title">
                  {selectedCertificate.courseTitle}
                </p>
              </div>

              {/* Certificate Signatures and Gold Seal */}
              <div className="grid grid-cols-3 items-end pt-8 gap-4" id="cert-print-footer">
                <div className="text-right text-xs text-slate-500 space-y-1" id="cert-sign-left">
                  <span className="block font-bold">التاريخ:</span>
                  <span className="block font-semibold text-slate-700">{selectedCertificate.issuedAt}</span>
                </div>
                <div className="flex justify-center" id="cert-sign-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full border-4 border-emerald-400 flex items-center justify-center text-emerald-800 text-xl font-bold shadow-xs relative" id="cert-gold-seal">
                    🏆
                    <span className="absolute inset-0 border border-dashed border-emerald-600 rounded-full animate-spin-slow"></span>
                  </div>
                </div>
                <div className="text-left text-xs text-slate-500 space-y-1" id="cert-sign-right">
                  <span className="block font-bold">الرمز التسلسلي:</span>
                  <span className="block font-semibold text-slate-700">{selectedCertificate.verificationCode}</span>
                </div>
              </div>

              {/* Extra branding footer */}
              <p className="text-[9px] text-slate-400 pt-6" id="cert-disclaimer">
                هذه الشهادة تؤكد الالتزام التنموي الشخصي للمتدرب وتجاوزه للتقييمات الذاتية بنجاح.
              </p>
            </div>

            {/* Modal Controls: Print and Close */}
            <div className="flex justify-end gap-3" id="cert-modal-controls">
              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                id="btn-print-certificate"
              >
                <Printer className="w-4 h-4" /> طباعة أو حفظ كـ PDF
              </button>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition-colors"
                id="btn-dismiss-cert-modal"
              >
                رجوع للوحة التحكم
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
