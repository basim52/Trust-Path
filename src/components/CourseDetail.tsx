/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, ChevronLeft, ChevronRight, CheckCircle, Circle, Award, 
  HelpCircle, Shield, AlertCircle, RefreshCw, Eye, ThumbsUp, ArrowRight, NotebookPen
} from 'lucide-react';
import { Course, Lesson, TraineeProgress, QuizQuestion } from '../types';

interface CourseDetailProps {
  progress: TraineeProgress;
  courses: Course[];
  addPoints: (p: number) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  markCourseCertified: (courseId: string, courseTitle: string) => void;
  studentName: string;
  setActiveTab: (tab: string) => void;
}

export default function CourseDetail({
  progress, courses, addPoints, markLessonComplete, markCourseCertified, studentName, setActiveTab
}: CourseDetailProps) {

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  
  // Exercise state
  const [exerciseAnswer, setExerciseAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [exerciseChecked, setExerciseChecked] = useState(false);
  const [exerciseSuccess, setExerciseSuccess] = useState(false);

  // Quiz state
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizExplanationIdx, setQuizExplanationIdx] = useState<number | null>(null);

  // Setup active course & reset states
  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveLessonIdx(0);
    resetExercise();
    setIsTakingQuiz(false);
    setQuizAnswers({});
    setQuizScore(null);
    setQuizExplanationIdx(null);
  };

  const resetExercise = () => {
    setExerciseAnswer('');
    setSelectedOption(null);
    setExerciseChecked(false);
    setExerciseSuccess(false);
  };

  const handleNextLesson = () => {
    if (!selectedCourse) return;
    if (activeLessonIdx < selectedCourse.lessons.length - 1) {
      setActiveLessonIdx(prev => prev + 1);
      resetExercise();
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(prev => prev - 1);
      resetExercise();
    }
  };

  const handleCheckExercise = (lesson: Lesson) => {
    if (exerciseChecked) return;
    setExerciseChecked(true);

    if (lesson.exercise.type === 'selection') {
      const isCorrect = selectedOption === lesson.exercise.correctAnswer;
      setExerciseSuccess(isCorrect);
      if (isCorrect) {
        addPoints(15);
        markLessonComplete(selectedCourse!.id, lesson.id);
      }
    } else {
      // Writing or CBT reframe is always validated as success upon entry of text
      const isFilled = exerciseAnswer.trim().length >= 10;
      setExerciseSuccess(isFilled);
      if (isFilled) {
        addPoints(15);
        markLessonComplete(selectedCourse!.id, lesson.id);
      }
    }
  };

  // Quiz flow
  const handleStartQuiz = () => {
    setIsTakingQuiz(true);
    setQuizAnswers({});
    setQuizScore(null);
    setQuizExplanationIdx(null);
  };

  const handleQuizAnswer = (questionId: string, optIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!selectedCourse) return;
    let correctCount = 0;
    selectedCourse.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / selectedCourse.quiz.length) * 100);
    setQuizScore(percent);

    if (percent >= 70) {
      addPoints(50); // Big bonus for passing the exam!
      markCourseCertified(selectedCourse.id, selectedCourse.title);
    }
  };

  // Helper to check if a specific lesson is completed
  const isLessonCompleted = (lessonId: string) => {
    return progress.completedLessons.includes(`${selectedCourse?.id}-${lessonId}`);
  };

  // Helper to check if all lessons of active course are finished
  const areAllLessonsFinished = () => {
    if (!selectedCourse) return false;
    return selectedCourse.lessons.every(lesson => isLessonCompleted(lesson.id));
  };

  const isCourseCertified = (courseId: string) => {
    return progress.completedCourses.includes(courseId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="courses-module">
      
      {/* If no course is selected, show beautiful catalogs list */}
      {!selectedCourse ? (
        <div className="space-y-8" id="catalog-section">
          <div className="text-center" id="catalog-header">
            <span className="bg-emerald-100 text-emerald-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider" id="catalog-badge">
              منهاج علم النفس الإيجابي
            </span>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-2" id="catalog-title">📚 المسارات والدورات التعليمية المعتمدة</h1>
            <p className="text-slate-500 max-w-2xl mx-auto mt-2 text-sm leading-relaxed" id="catalog-subtitle">
              منهاج متكامل تم تصميمه بعناية لمرافقة تراكمك التنموي النفسي. ابدأ بالمسار الذي يناسب احتياجك لتشاهد كيف تتحول ثقتك بنفسك إلى واقع ملموس.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="catalog-grid">
            {courses.map((course) => {
              const isCertified = isCourseCertified(course.id);
              const finishedCount = course.lessons.filter(l => progress.completedLessons.includes(`${course.id}-${l.id}`)).length;
              const percent = Math.round((finishedCount / course.lessons.length) * 100);

              return (
                <div 
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
                  id={`course-card-${course.id}`}
                >
                  <div className="space-y-4" id={`course-card-body-${course.id}`}>
                    <div className="flex justify-between items-start" id={`course-card-header-${course.id}`}>
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-lg" id={`course-icon-wrap-${course.id}`}>
                        {course.category === 'self-esteem' ? '❤️' : course.category === 'confidence' ? '⚡' : '🎯'}
                      </div>
                      {isCertified ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" id={`cert-unlocked-tag-${course.id}`}>
                          🏆 تم منح الشهادة
                        </span>
                      ) : percent > 0 ? (
                        <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full" id={`progress-percent-${course.id}`}>
                          جاري التعلم {percent}%
                        </span>
                      ) : (
                        <span className="bg-emerald-100/50 text-emerald-950 text-[10px] font-bold px-2 py-0.5 rounded-full" id={`not-started-tag-${course.id}`}>
                          مسار متاح
                        </span>
                      )}
                    </div>

                    <div id={`course-text-meta-${course.id}`}>
                      <h3 className="font-extrabold text-slate-800 text-base" id={`course-title-h3-${course.id}`}>{course.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2" id={`course-desc-p-${course.id}`}>{course.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-400" id={`course-stats-${course.id}`}>
                      <span>📚 الدروس: {course.lessonsCount}</span>
                      <span>⏱️ المدة: {course.duration}</span>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-50 mt-4" id={`course-card-footer-${course.id}`}>
                    <button
                      onClick={() => selectCourse(course)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      id={`course-select-btn-${course.id}`}
                    >
                      {percent > 0 ? 'مواصلة المسار التفاعلي' : 'بدء المسار التفاعلي'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* COURSE PLAYER VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="course-player">
          
          {/* Back Button and course title */}
          <div className="lg:col-span-12 flex items-center justify-between" id="player-banner">
            <button
              onClick={() => setSelectedCourse(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              id="player-back-btn"
            >
              <ChevronRight className="w-4 h-4" /> العودة لقائمة المسارات
            </button>
            <h2 className="text-lg font-black text-slate-800" id="player-course-title">
              {selectedCourse.title}
            </h2>
          </div>

          {/* Left Column (4 cols): Lessons Roadmap Directory */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm h-[560px] flex flex-col justify-between" id="player-directory">
            <div className="space-y-4 overflow-y-auto" id="player-directory-content">
              <h3 className="font-extrabold text-slate-700 text-xs border-b border-slate-100 pb-3 uppercase tracking-wider" id="dir-title">
                فهرس الدروس المعتمدة
              </h3>

              <div className="space-y-2" id="dir-lessons-list">
                {selectedCourse.lessons.map((lesson, idx) => {
                  const isCompleted = isLessonCompleted(lesson.id);
                  const isActive = idx === activeLessonIdx && !isTakingQuiz;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonIdx(idx);
                        resetExercise();
                        setIsTakingQuiz(false);
                      }}
                      className={`w-full text-right p-3 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${isActive ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 font-bold' : 'border-slate-100 hover:bg-slate-50 text-slate-600'}`}
                      id={`dir-lesson-btn-${lesson.id}`}
                    >
                      <div className="flex items-center gap-2" id={`dir-lesson-meta-${lesson.id}`}>
                        <span className="text-[10px] text-slate-400 font-bold" id={`dir-lesson-no-${lesson.id}`}>{idx + 1}.</span>
                        <span className="truncate max-w-[170px]" id={`dir-lesson-title-${lesson.id}`}>{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5" id={`dir-lesson-status-${lesson.id}`}>
                        <span className="text-[9px] text-slate-400 font-medium">{lesson.duration}</span>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" id={`dir-lesson-check-${lesson.id}`} />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" id={`dir-lesson-circle-${lesson.id}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Final Exam Section trigger */}
            <div className="pt-4 border-t border-slate-100" id="dir-exam-panel">
              <button
                disabled={!areAllLessonsFinished()}
                onClick={handleStartQuiz}
                className={`w-full font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCourseCertified(selectedCourse.id)
                    ? 'bg-emerald-500 text-white border border-emerald-500 hover:bg-emerald-600'
                    : isTakingQuiz
                    ? 'bg-emerald-600 text-white'
                    : areAllLessonsFinished()
                    ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:scale-[1.02]'
                    : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed'
                }`}
                id="btn-trigger-exam"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>
                  {isCourseCertified(selectedCourse.id) 
                    ? 'الامتحان مجتاز (شهادة مفعلة)' 
                    : 'بدء الامتحان النهائي للدورة'}
                </span>
              </button>
              {!areAllLessonsFinished() && (
                <p className="text-[9px] text-slate-400 text-center mt-2" id="dir-exam-tip">
                  🔒 يفتح الاختبار النهائي بمجرد إتمام تمارين الدروس الأربعة أعلاه.
                </p>
              )}
            </div>
          </div>

          {/* Right Column (8 cols): ACTIVE LESSON PLAYER OR EXAM WORKBOOK */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[560px] flex flex-col justify-between" id="player-active-panel">
            
            {!isTakingQuiz ? (
              /* LESSON READING VIEW */
              (() => {
                const lesson: Lesson = selectedCourse.lessons[activeLessonIdx];
                if (!lesson) return null;

                return (
                  <div className="space-y-6 flex-1 flex flex-col justify-between" id={`lesson-player-viewport-${lesson.id}`}>
                    <div className="space-y-4" id={`lesson-reading-${lesson.id}`}>
                      {/* Lesson Title header */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3" id={`lesson-title-bar-${lesson.id}`}>
                        <div>
                          <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest block" id={`lesson-no-tag-${lesson.id}`}>الدرس {activeLessonIdx + 1} من {selectedCourse.lessons.length}</span>
                          <h3 className="font-extrabold text-slate-800 text-lg" id={`lesson-title-h3-${lesson.id}`}>{lesson.title}</h3>
                        </div>
                        <span className="bg-slate-50 text-slate-500 text-xs px-2.5 py-1 rounded-full font-bold" id={`lesson-reading-dur-${lesson.id}`}>📖 {lesson.duration} قراءة</span>
                      </div>

                      {/* Lesson Body Content (Formatted text) */}
                      <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line text-right font-sans max-h-[280px] overflow-y-auto pr-1" id={`lesson-html-body-${lesson.id}`}>
                        {lesson.content}
                      </div>
                    </div>

                    {/* Lesson Interactive Workbook Exercise Card */}
                    <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-4 space-y-3 mt-4" id={`lesson-exercise-box-${lesson.id}`}>
                      <div className="flex justify-between items-center text-xs" id={`lesson-exercise-header-${lesson.id}`}>
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <NotebookPen className="w-3.5 h-3.5" /> كراسة التدريب العملي والتطبيق النفسي
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">جائزة التمرين: +15 نقطة XP</span>
                      </div>

                      <p className="text-xs text-slate-700 font-semibold" id={`lesson-exercise-q-${lesson.id}`}>{lesson.exercise.question}</p>

                      {/* Exercise inputs based on type */}
                      {lesson.exercise.type === 'selection' ? (
                        <div className="space-y-2 pt-1" id={`exercise-selection-${lesson.id}`}>
                          {lesson.exercise.options?.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              disabled={exerciseChecked}
                              onClick={() => setSelectedOption(opt)}
                              className={`w-full text-right p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                exerciseChecked
                                  ? opt === lesson.exercise.correctAnswer
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : selectedOption === opt
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-white border-slate-100 text-slate-400'
                                  : selectedOption === opt
                                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                              id={`exercise-opt-btn-${lesson.id}-${oIdx}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div id={`exercise-text-${lesson.id}`}>
                          <textarea
                            value={exerciseAnswer}
                            onChange={(e) => setExerciseAnswer(e.target.value)}
                            placeholder={lesson.exercise.placeholder || "أجب هنا في دفتري العملي الشخصي السري..."}
                            disabled={exerciseChecked}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 text-right min-h-[70px]"
                            dir="rtl"
                            id={`exercise-textarea-${lesson.id}`}
                          />
                        </div>
                      )}

                      {/* TIP panel */}
                      <p className="text-[10px] text-slate-400 italic" id={`exercise-tip-${lesson.id}`}>
                        💡 إرشاد: {lesson.exercise.tip}
                      </p>

                      {/* Submit exercise action */}
                      <div className="flex justify-between items-center pt-2" id={`exercise-actions-bar-${lesson.id}`}>
                        <div id={`exercise-status-tag-${lesson.id}`}>
                          {exerciseChecked && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${exerciseSuccess ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`} id={`exercise-badge-${lesson.id}`}>
                              {exerciseSuccess 
                                ? '✨ مذهل! تم تدوين إنجازك في ملفك الشخصي (+15 XP)' 
                                : '❌ الإجابة تحتاج لإعادة مراجعة، يرجى قراءة الدرس والمحاولة مجدداً'}
                            </span>
                          )}
                        </div>

                        {!exerciseChecked ? (
                          <button
                            type="button"
                            onClick={() => handleCheckExercise(lesson)}
                            disabled={lesson.exercise.type === 'selection' ? !selectedOption : exerciseAnswer.trim().length < 10}
                            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition-colors"
                            id={`exercise-submit-${lesson.id}`}
                          >
                            تدوين وإكمال الدرس
                          </button>
                        ) : (
                          <div className="flex gap-2" id={`exercise-next-nav-${lesson.id}`}>
                            {!exerciseSuccess && (
                              <button
                                onClick={resetExercise}
                                className="bg-white border border-slate-200 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                                id={`exercise-retry-${lesson.id}`}
                              >
                                إعادة المحاولة
                              </button>
                            )}
                            {activeLessonIdx < selectedCourse.lessons.length - 1 ? (
                              <button
                                onClick={handleNextLesson}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg cursor-pointer transition-colors"
                                id={`exercise-next-btn-${lesson.id}`}
                              >
                                الانتقال للدرس التالي
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded" id={`exercise-lessons-done-${lesson.id}`}>
                                🎉 أكملت جميع الدروس بنجاح!
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Left/Right manual Lesson navigation buttons */}
                    <div className="flex justify-between border-t border-slate-100 pt-4 mt-6" id="lesson-pagers">
                      <button
                        onClick={handlePrevLesson}
                        disabled={activeLessonIdx === 0}
                        className="border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white rounded-xl py-1.5 px-4 text-xs font-semibold cursor-pointer flex items-center gap-1"
                        id="lesson-prev-pager"
                      >
                        <ChevronRight className="w-4 h-4" /> الدرس السابق
                      </button>
                      <button
                        onClick={handleNextLesson}
                        disabled={activeLessonIdx === selectedCourse.lessons.length - 1}
                        className="border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white rounded-xl py-1.5 px-4 text-xs font-semibold cursor-pointer flex items-center gap-1"
                        id="lesson-next-pager"
                      >
                        الدرس التالي <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })()
            ) : (
              /* EXAM VIEW CARD PANEL */
              <div className="space-y-6 flex-1 flex flex-col justify-between" id="exam-viewport">
                <div className="space-y-4" id="exam-body">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3" id="exam-header">
                    <div>
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/50 px-2.5 py-1 rounded inline-block" id="exam-badge">الامتحان الشامل والاعتماد</span>
                      <h3 className="font-extrabold text-slate-800 text-lg mt-2" id="exam-title-h3">التقييم الختامي لمنح شهادة الإتمام</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-bold" id="exam-pass-rule">معدل النجاح المطلوب: 70%</span>
                  </div>

                  {quizScore === null ? (
                    /* ACTIVE QUESTIONS GRID */
                    <div className="space-y-6 max-h-[380px] overflow-y-auto pr-1" id="exam-questions-list">
                      {selectedCourse.quiz.map((q, idx) => (
                        <div key={q.id} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100" id={`exam-q-box-${q.id}`}>
                          <h4 className="font-extrabold text-slate-800 text-xs flex gap-1.5 items-start" id={`exam-q-text-${q.id}`}>
                            <span>{idx + 1}.</span>
                            <span>{q.question}</span>
                          </h4>
                          <div className="grid grid-cols-1 gap-2" id={`exam-options-grid-${q.id}`}>
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizAnswers[q.id] === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleQuizAnswer(q.id, oIdx)}
                                  className={`w-full text-right p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${isSelected ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                  id={`exam-opt-btn-${q.id}-${oIdx}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* EXAM RESULTS AND EVALUATION WALL */
                    <div className="text-center space-y-6 py-6" id="exam-scorecard-results">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black mx-auto shadow-inner ${quizScore >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`} id="exam-res-circle">
                        {quizScore}%
                      </div>

                      {quizScore >= 70 ? (
                        <div className="space-y-3 max-w-md mx-auto" id="exam-success-panel">
                          <h4 className="text-lg font-black text-slate-800" id="exam-success-h4">تهانينا الحارة! لقد تفوقت واجتزت الامتحان بنجاح 🎓</h4>
                          <p className="text-xs text-slate-500 leading-relaxed" id="exam-success-p">
                            يسعدنا إعلامك بأنه تم إصدار **وثيقة إتمام معتمدة** باسمك الثلاثي: <span className="text-emerald-800 font-bold">"{studentName || 'المتدرب المتميز'}"</span>. يمكنك استعراضها وطباعتها الآن مباشرة من لوحة تحكم المتدرب في أي وقت!
                          </p>
                          <div className="pt-3" id="exam-success-action-wrap">
                            <button
                              onClick={() => {
                                setSelectedCourse(null);
                                setActiveTab('dashboard'); // go back to dashboard to view and print cert
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-sm"
                              id="btn-goto-cert-wall"
                            >
                              <Award className="w-4 h-4" /> الانتقال لمعرض الشهادات وطباعتها
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 max-w-md mx-auto" id="exam-fail-panel">
                          <h4 className="text-lg font-black text-slate-800" id="exam-fail-h4">حظاً أوفر، لم تحقق معدل النجاح المطلوب (70%)</h4>
                          <p className="text-xs text-slate-500" id="exam-fail-p">
                            ننصحك بإعادة قراءة دروس الدورة التفاعلية بعناية والحديث مع المستشار الذكي، وتكرار المحاولة متى ما كنت مستعداً.
                          </p>
                          <div className="pt-3" id="exam-fail-action-wrap">
                            <button
                              onClick={() => {
                                setQuizScore(null);
                                setQuizAnswers({});
                              }}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition-colors"
                              id="btn-retry-exam"
                            >
                              إعادة تقديم الامتحان النهائي
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display Question Explanations to aid trainee's developmental growth */}
                      <div className="border-t border-slate-100 pt-4 text-right space-y-3 max-w-xl mx-auto" id="exam-explanation-board">
                        <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1" id="exam-explanation-h5">
                          <HelpCircle className="w-4 h-4 text-slate-400" /> تحليل علمي ومعرفي لأسئلة التقييم:
                        </h5>
                        <div className="space-y-2" id="exam-explanations-list">
                          {selectedCourse.quiz.map((q, idx) => (
                            <div key={q.id} className="p-3 bg-slate-50 rounded-lg text-xs" id={`exam-ex-item-${q.id}`}>
                              <span className="font-bold text-slate-700 block" id={`exam-ex-q-${q.id}`}>{idx + 1}. {q.question}</span>
                              <p className="text-slate-500 mt-1 font-medium" id={`exam-ex-body-${q.id}`}>
                                💡 تفسير الحل الصحيح: <span className="text-slate-600 font-semibold">{q.explanation}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Exam Submition Action */}
                {quizScore === null && (
                  <div className="flex justify-end pt-4 border-t border-slate-100 mt-6" id="exam-footer">
                    <button
                      disabled={Object.keys(quizAnswers).length < selectedCourse.quiz.length}
                      onClick={handleSubmitQuiz}
                      className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                      id="btn-submit-exam"
                    >
                      <span>تقديم الامتحان للتقييم والتصحيح</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
