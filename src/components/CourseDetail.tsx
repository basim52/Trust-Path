/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, ChevronLeft, ChevronRight, CheckCircle, Circle, Award, 
  HelpCircle, Shield, AlertCircle, RefreshCw, Eye, ThumbsUp, ArrowLeft, 
  NotebookPen, Heart, Sparkles, Brain, Trophy, Check, Lock, Star, GraduationCap,
  Bookmark, UserCheck, Flame, BookOpenCheck
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
  toggleParagraphComplete?: (key: string) => void;
}

export default function CourseDetail({
  progress, courses, addPoints, markLessonComplete, markCourseCertified, studentName, setActiveTab, toggleParagraphComplete
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

  // Setup active course & reset states
  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveLessonIdx(0);
    resetExercise();
    setIsTakingQuiz(false);
    setQuizAnswers({});
    setQuizScore(null);
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
      // Writing or CBT reframe is validated as success upon entry of text (10+ characters)
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
      addPoints(50); // XP bonus for passing the exam!
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

  // Custom Category Mapper for beautiful design token generation
  const getCategoryTheme = (category: string) => {
    switch(category) {
      case 'self-esteem':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-100/80',
          badge: 'bg-rose-100 text-rose-900',
          iconBg: 'bg-rose-50 text-rose-600',
          gradient: 'from-rose-500 to-pink-600',
          accentColor: '#e11d48',
          emoji: '❤️',
          label: 'تقدير وعلاج الذات'
        };
      case 'confidence':
        return {
          bg: 'bg-amber-50 text-amber-850 border-amber-100/80',
          badge: 'bg-amber-100 text-amber-950',
          iconBg: 'bg-amber-50 text-amber-600',
          gradient: 'from-amber-500 to-orange-600',
          accentColor: '#d97706',
          emoji: '⚡',
          label: 'بناء الثقة والجرأة'
        };
      default:
        return {
          bg: 'bg-indigo-50 text-indigo-850 border-indigo-100/80',
          badge: 'bg-indigo-100 text-indigo-950',
          iconBg: 'bg-indigo-50 text-indigo-600',
          gradient: 'from-indigo-500 to-blue-600',
          accentColor: '#4f46e5',
          emoji: '🎯',
          label: 'المهارات الحوارية والاجتماعية'
        };
    }
  };

  // Pure aesthetic custom renderer for markdown-like structures
  const renderFormattedContent = (content: string, courseId = 'default-course', lessonId = 'default-lesson') => {
    // Helper helper to parse bold text **like this**
    const parseBoldText = (text: string) => {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-extrabold text-slate-900 bg-emerald-50/60 px-1.5 py-0.5 rounded border border-emerald-100/30">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : text;
    };

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        i++;
        continue;
      }

      // 1. Table parsing
      if (trimmedLine.startsWith('|')) {
        const tableRows: string[] = [];
        const tableIndex = i;
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableRows.push(lines[i].trim());
          i++;
        }

        if (tableRows.length > 0) {
          const parseRowCells = (rowStr: string) => {
            return rowStr
              .split('|')
              .map(cell => cell.trim())
              .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1);
          };

          const headerCells = parseRowCells(tableRows[0]);
          const hasSeparator = tableRows[1] && tableRows[1].includes('---');
          const dataRowsStartIdx = hasSeparator ? 2 : 1;
          const dataRows = tableRows.slice(dataRowsStartIdx).map(row => parseRowCells(row));

          const blockKey = `${courseId}-${lessonId}-table-${tableIndex}`;
          const isCompleted = !!progress.completedParagraphs?.[blockKey];

          elements.push(
            <div 
              key={`table-${tableIndex}`} 
              className={`overflow-x-auto my-4 border rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                isCompleted 
                  ? 'border-emerald-200 bg-emerald-50/10 shadow-xs' 
                  : 'border-slate-150 bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100" dir="rtl">
                <span className="text-[11px] font-bold text-slate-400">جدول توضيحي</span>
                <button
                  onClick={() => toggleParagraphComplete?.(blockKey)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 cursor-pointer ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm' 
                      : 'border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-50'
                  }`}
                  title={isCompleted ? "تم الإنجاز" : "تحديد كمكتمل"}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                    {headerCells.map((cell, cIdx) => (
                      <th key={cIdx} className="p-3 text-xs md:text-sm font-extrabold text-slate-800">
                        {parseBoldText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((rowCells, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                      {rowCells.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 text-xs md:text-sm text-slate-600 font-medium">
                          {parseBoldText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // 2. Headings (Check H4 first so H3 doesn't greedily match it)
      if (trimmedLine.startsWith('####')) {
        const text = trimmedLine.replace(/^####\s*/, '').trim();
        elements.push(
          <div 
            key={`h4-${i}`} 
            className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4 flex items-center gap-2.5 shadow-xs my-3"
          >
            <div className="w-2 h-6 bg-emerald-600 rounded-full shrink-0" />
            <h4 className="text-sm md:text-base font-extrabold text-slate-850">
              {parseBoldText(text)}
            </h4>
          </div>
        );
        i++;
        continue;
      }

      if (trimmedLine.startsWith('###')) {
        const text = trimmedLine.replace(/^###\s*/, '').trim();
        elements.push(
          <div 
            key={`h3-${i}`} 
            className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm my-3"
          >
            <div className="w-2.5 h-8 bg-emerald-500 rounded-full shrink-0" />
            <h3 className="text-base md:text-lg font-black text-slate-850 tracking-tight">
              {parseBoldText(text)}
            </h3>
          </div>
        );
        i++;
        continue;
      }

      // 3. Blockquotes
      if (trimmedLine.startsWith('>')) {
        const rawText = trimmedLine.replace(/^>\s*/, '').trim();
        const blockKey = `${courseId}-${lessonId}-quote-${i}`;
        const isCompleted = !!progress.completedParagraphs?.[blockKey];
        elements.push(
          <div 
            key={`quote-${i}`} 
            className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 flex justify-between gap-4 items-center my-3 ${
              isCompleted 
                ? 'border-emerald-200 bg-emerald-50/10 shadow-xs' 
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-600/20 border-r-4'
            }`}
          >
            <div className="text-xs md:text-sm text-emerald-950 font-bold leading-relaxed text-right flex-1">
              {parseBoldText(rawText)}
            </div>
            <button
              onClick={() => toggleParagraphComplete?.(blockKey)}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 cursor-pointer ${
                isCompleted 
                  ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm' 
                  : 'border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-50'
              }`}
              title={isCompleted ? "تم الإنجاز" : "تحديد كمكتمل"}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        );
        i++;
        continue;
      }

      // 4. Numbered Lists
      if (trimmedLine.match(/^\d+\./)) {
        const dotIndex = trimmedLine.indexOf('.');
        const num = trimmedLine.substring(0, dotIndex);
        const text = trimmedLine.substring(dotIndex + 1).trim();
        const blockKey = `${courseId}-${lessonId}-num-${i}`;
        const isCompleted = !!progress.completedParagraphs?.[blockKey];
        elements.push(
          <div 
            key={`num-${i}`} 
            className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 flex justify-between gap-4 items-start w-full my-3 ${
              isCompleted 
                ? 'border-emerald-200 bg-emerald-50/10 shadow-xs' 
                : 'bg-white border-slate-150 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div className="flex gap-4 items-start flex-1 text-right">
              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                {num}
              </span>
              <div className="flex-1 text-xs md:text-sm text-slate-700 font-bold leading-relaxed">
                {parseBoldText(text)}
              </div>
            </div>
            <button
              onClick={() => toggleParagraphComplete?.(blockKey)}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 cursor-pointer ${
                isCompleted 
                  ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm' 
                  : 'border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-50'
              }`}
              title={isCompleted ? "تم الإنجاز" : "تحديد كمكتمل"}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        );
        i++;
        continue;
      }

      // 5. Bullet lists
      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const text = trimmedLine.replace(/^[-*]\s*/, '').trim();
        const blockKey = `${courseId}-${lessonId}-bullet-${i}`;
        const isCompleted = !!progress.completedParagraphs?.[blockKey];
        elements.push(
          <div 
            key={`bullet-${i}`} 
            className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 flex justify-between gap-4 items-start w-full my-3 ${
              isCompleted 
                ? 'border-emerald-200 bg-emerald-50/10 shadow-xs' 
                : 'bg-white border-slate-150 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div className="flex gap-4 items-start flex-1 text-right">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-sm" />
              <div className="flex-1 text-xs md:text-sm text-slate-700 font-bold leading-relaxed">
                {parseBoldText(text)}
              </div>
            </div>
            <button
              onClick={() => toggleParagraphComplete?.(blockKey)}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 cursor-pointer ${
                isCompleted 
                  ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm' 
                  : 'border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-50'
              }`}
              title={isCompleted ? "تم الإنجاز" : "تحديد كمكتمل"}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        );
        i++;
        continue;
      }

      // 6. Default paragraph card
      const blockKey = `${courseId}-${lessonId}-p-${i}`;
      const isCompleted = !!progress.completedParagraphs?.[blockKey];
      elements.push(
        <div 
          key={`p-${i}`} 
          className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 flex justify-between gap-4 items-start my-3 ${
            isCompleted 
              ? 'border-emerald-200 bg-emerald-50/10 shadow-xs' 
              : 'bg-white border-slate-150 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="text-[13px] md:text-[14.5px] text-slate-600 leading-relaxed font-normal text-justify flex-1">
            {parseBoldText(trimmedLine)}
          </div>
          <button
            onClick={() => toggleParagraphComplete?.(blockKey)}
            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 cursor-pointer ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm' 
                : 'border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-50'
            }`}
            title={isCompleted ? "تم الإنجاز" : "تحديد كمكتمل"}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      );
      i++;
    }

    return (
      <div className="space-y-4 font-sans animate-fade-in" dir="rtl">
        {elements}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans" id="courses-module" dir="rtl">
      
      {/* 1. COURSE CATALOG VIEW (If no active course player is selected) */}
      {!selectedCourse ? (
        <div className="space-y-12" id="catalog-section">
          
          {/* Header Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto" id="catalog-header">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border border-emerald-100/80 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm" id="catalog-badge">
              <GraduationCap className="w-4 h-4 text-emerald-600 animate-bounce" />
              <span>منهاج مَسار لعلم النفس السلوكي CBT والذكاء الاصطناعي</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight" id="catalog-title">
              المسارات والدورات التعليمية المعتمدة
            </h1>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed" id="catalog-subtitle">
              منهاج علمي وتطبيقي متكامل تم تصميمه بالتعاون مع خبراء الإرشاد السلوكي لمساعدتك على تجاوز القلق والكمالية السامة وتطوير مرونتك الاجتماعية.
            </p>
          </div>

          {/* Core Grid with Sophisticated Light Theme styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="catalog-grid">
            {courses.map((course) => {
              const isCertified = isCourseCertified(course.id);
              const finishedCount = course.lessons.filter(l => progress.completedLessons.includes(`${course.id}-${l.id}`)).length;
              const percent = Math.round((finishedCount / course.lessons.length) * 100);
              const theme = getCategoryTheme(course.category);

              return (
                <div 
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                  id={`course-card-${course.id}`}
                >
                  <div className="space-y-5" id={`course-card-body-${course.id}`}>
                    
                    {/* Category Label and badge */}
                    <div className="flex justify-between items-center" id={`course-card-header-${course.id}`}>
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${theme.bg}`} id={`category-badge-${course.id}`}>
                        {theme.emoji} {theme.label}
                      </span>

                      {isCertified ? (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm" id={`cert-unlocked-tag-${course.id}`}>
                          🏆 شهادة معتمدة
                        </span>
                      ) : percent > 0 ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full" id={`progress-percent-${course.id}`}>
                          مستمر {percent}%
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold px-2.5 py-1 rounded-full" id={`not-started-tag-${course.id}`}>
                          مسار متاح
                        </span>
                      )}
                    </div>

                    {/* Title and Short Description */}
                    <div className="space-y-2.5" id={`course-text-meta-${course.id}`}>
                      <h3 className="font-extrabold text-slate-800 text-xl leading-snug hover:text-emerald-700 transition-colors" id={`course-title-h3-${course.id}`}>
                        {course.title}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed min-h-[60px]" id={`course-desc-p-${course.id}`}>
                        {course.description}
                      </p>
                    </div>

                    {/* High-fidelity custom progress bar */}
                    {percent > 0 && (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100" id={`course-progress-bar-wrap-${course.id}`}>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>إنجاز الدروس</span>
                          <span className="text-emerald-700">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Course statistics footer */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4" id={`course-stats-${course.id}`}>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                        <BookOpen className="w-4 h-4 text-slate-300" />
                        الدروس: {course.lessonsCount}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                        <RefreshCw className="w-4 h-4 text-slate-300 animate-spin-slow" />
                        المدة: {course.duration}
                      </span>
                    </div>
                  </div>

                  {/* Primary CTA button */}
                  <div className="pt-6 mt-6 border-t border-slate-50" id={`course-card-footer-${course.id}`}>
                    <button
                      onClick={() => selectCourse(course)}
                      className={`w-full py-3.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                        percent > 0 
                          ? 'bg-slate-800 hover:bg-slate-900 text-white hover:shadow-md' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
                      }`}
                      id={`course-select-btn-${course.id}`}
                    >
                      <span>{percent > 0 ? 'مواصلة التدريب السلوكي' : 'بدء المسار التفاعلي'}</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Methodology Info Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-850 text-slate-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between border border-slate-800 shadow-xl" id="learning-path-info-banner">
            <div className="flex items-center gap-4" id="banner-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-emerald-500/25" id="banner-icon">
                🎯
              </div>
              <div className="space-y-1.5" id="banner-text">
                <h4 className="font-extrabold text-base text-white">كيف تحقق أقصى استفادة من مناهج مَسار؟</h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  تتكون مساراتنا من تجارب متكاملة: تدرس المحتوى العلمي المبسط أولاً، ثم تجيب على التمارين التطبيقية لترسيخ عادات التفكير البديلة وتخطي عقبات الكمالية في كراستك الخاصة بنجاح.
                </p>
              </div>
            </div>
            <div className="shrink-0 font-black text-xs text-emerald-400 bg-emerald-950/60 px-5 py-3 rounded-2xl border border-emerald-900/50 flex items-center gap-2" id="banner-points-info">
              <Flame className="w-4 h-4 text-emerald-500" />
              <span>مكافأة اجتياز الامتحان: +50 XP شهادة معتمدة</span>
            </div>
          </div>

        </div>
      ) : (
        
        /* 2. COURSE PLAYER / TWO-COLUMN DASHBOARD (If a course is selected) */
        <div className="space-y-6" id="course-player">
          
          {/* Breadcrumb & Navigation Header Block */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-150" id="player-banner">
            
            {/* Elegant Back button matching layout schema exactly */}
            <button
              onClick={() => setSelectedCourse(null)}
              className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-fit group"
              id="player-back-btn"
            >
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-white group-hover:bg-slate-50 shadow-sm transition-all">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
              <span>العودة لقائمة المسارات</span>
            </button>
            
            {/* Meta tags for high alignment */}
            <div className="text-right space-y-1" id="player-meta-title">
              <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/80 uppercase tracking-wider shadow-sm" id="active-course-category">
                {getCategoryTheme(selectedCourse.category).emoji} {getCategoryTheme(selectedCourse.category).label}
              </span>
              <h2 className="text-2xl font-black text-slate-800" id="player-course-title">
                {selectedCourse.title}
              </h2>
            </div>
          </div>

          {/* The Elegant Two-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="player-workspace">
            
            {/* SIDEBAR COLUMN (4 cols): Curriculum and roadmap. Stays elegant on the side */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 lg:sticky lg:top-6" id="player-directory">
              
              <div className="border-b border-slate-50 pb-3" id="dir-title-area">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-wider flex items-center gap-2" id="dir-title">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>خارطة ومنهج الدروس</span>
                </h3>
              </div>

              {/* Progress Tracker list */}
              <div className="space-y-3" id="dir-lessons-list">
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
                      className={`w-full text-right p-4 rounded-2xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-md transform -translate-x-1' 
                          : isCompleted
                          ? 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-400'
                      }`}
                      id={`dir-lesson-btn-${lesson.id}`}
                    >
                      <div className="flex items-center gap-3" id={`dir-lesson-meta-${lesson.id}`}>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-emerald-500 text-white shadow' : 'bg-slate-100 text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <span className="font-extrabold leading-snug text-right max-w-[170px] truncate" id={`dir-lesson-title-${lesson.id}`}>
                          {lesson.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2" id={`dir-lesson-status-${lesson.id}`}>
                        <span className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'} font-semibold`}>
                          {lesson.duration}
                        </span>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" id={`dir-lesson-check-${lesson.id}`} />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-200 shrink-0" id={`dir-lesson-circle-${lesson.id}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Assessment Panel block */}
              <div className="pt-5 border-t border-slate-100 space-y-4" id="dir-exam-panel">
                <button
                  disabled={!areAllLessonsFinished()}
                  onClick={handleStartQuiz}
                  className={`w-full font-black text-xs py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isCourseCertified(selectedCourse.id)
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : isTakingQuiz
                      ? 'bg-emerald-600 text-white'
                      : areAllLessonsFinished()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
                      : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed'
                  }`}
                  id="btn-trigger-exam"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>
                    {isCourseCertified(selectedCourse.id) 
                      ? 'الامتحان مجتاز بنجاح 🎓' 
                      : 'خوض التقييم والامتحان النهائي'}
                  </span>
                </button>
                
                {!areAllLessonsFinished() && (
                  <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100" id="dir-exam-tip">
                    <Lock className="w-3.5 h-3.5 text-slate-300 mt-0.5" />
                    <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                      يفتح الاختبار والاعتماد تلقائياً فور انتهائك من إتمام تمارين جميع الدروس السلوكية في خارطة المنهج.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* MAIN CONTENT COLUMN (8 cols): Reading player or Exam workbook area */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm min-h-[580px] flex flex-col justify-between" id="player-active-panel">
              
              {!isTakingQuiz ? (
                /* ACTIVE LESSON WORKSPACE VIEW */
                (() => {
                  const lesson: Lesson = selectedCourse.lessons[activeLessonIdx];
                  if (!lesson) return null;

                  return (
                    <div className="space-y-6 flex-1 flex flex-col justify-between" id={`lesson-player-viewport-${lesson.id}`}>
                      
                      {/* Active Reading Body */}
                      <div className="space-y-6" id={`lesson-reading-${lesson.id}`}>
                        
                        {/* Dynamic Lesson Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5" id={`lesson-title-bar-${lesson.id}`}>
                          <div>
                            <span className="text-[11px] text-emerald-800 font-extrabold tracking-widest block uppercase mb-1" id={`lesson-no-tag-${lesson.id}`}>
                              الدرس {activeLessonIdx + 1} من {selectedCourse.lessons.length}
                            </span>
                            <h3 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight leading-snug" id={`lesson-title-h3-${lesson.id}`}>
                              {lesson.title}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-2xl w-fit shrink-0 shadow-sm" id={`lesson-reading-dur-${lesson.id}`}>
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                            <span className="text-[11px] text-slate-600 font-bold">
                              {lesson.duration} قراءة متفحصة
                            </span>
                          </div>
                        </div>

                        {/* Interactive formatted reader */}
                        <div className="text-slate-700 text-sm md:text-base leading-relaxed pr-1 max-h-[350px] overflow-y-auto font-sans" id={`lesson-html-body-${lesson.id}`}>
                          {renderFormattedContent(lesson.content, selectedCourse.id, lesson.id)}
                        </div>
                      </div>

                      {/* Interactive Workbook / Exercise Panel */}
                      <div className="bg-gradient-to-br from-emerald-50/20 to-teal-50/10 border border-emerald-100/40 rounded-3xl p-6 space-y-5 mt-8" id={`lesson-exercise-box-${lesson.id}`}>
                        
                        {/* Title & Badge */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs" id={`lesson-exercise-header-${lesson.id}`}>
                          <span className="font-extrabold text-slate-800 flex items-center gap-2 text-sm">
                            <NotebookPen className="w-5 h-5 text-emerald-600" />
                            <span>كراسة التدريب العملي والتطبيق النفسي</span>
                          </span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-extrabold w-fit">
                            جائزة الإكمال: +15 XP
                          </span>
                        </div>

                        {/* Exercise Instruction */}
                        <div className="space-y-2" id={`lesson-exercise-instruct-${lesson.id}`}>
                          <p className="text-xs text-slate-400 font-extrabold">التعليمات والمهمة الحالية:</p>
                          <p className="text-xs md:text-sm text-slate-800 font-extrabold leading-relaxed bg-white p-3 rounded-2xl border border-slate-100 shadow-sm" id={`lesson-exercise-q-${lesson.id}`}>
                            {lesson.exercise.question}
                          </p>
                        </div>

                        {/* Interactive option builder */}
                        {lesson.exercise.type === 'selection' ? (
                          <div className="space-y-2.5 pt-1" id={`exercise-selection-${lesson.id}`}>
                            {lesson.exercise.options?.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                disabled={exerciseChecked}
                                onClick={() => setSelectedOption(opt)}
                                className={`w-full text-right p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                  exerciseChecked
                                    ? opt === lesson.exercise.correctAnswer
                                      ? 'bg-emerald-500 text-white border-emerald-500 shadow'
                                      : selectedOption === opt
                                      ? 'bg-red-500 text-white border-red-500 shadow'
                                      : 'bg-white border-slate-100 text-slate-300'
                                    : selectedOption === opt
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-sm'
                                    : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                                }`}
                                id={`exercise-opt-btn-${lesson.id}-${oIdx}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="pt-1" id={`exercise-text-${lesson.id}`}>
                            <textarea
                              value={exerciseAnswer}
                              onChange={(e) => setExerciseAnswer(e.target.value)}
                              placeholder={lesson.exercise.placeholder || "أجب هنا في دفترك الشخصي السري..."}
                              disabled={exerciseChecked}
                              className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs focus:outline-none focus:border-emerald-500 text-right min-h-[100px] font-sans leading-relaxed shadow-sm focus:ring-1 focus:ring-emerald-500"
                              dir="rtl"
                              id={`exercise-textarea-${lesson.id}`}
                            />
                          </div>
                        )}

                        {/* CBT Insight Guideline card */}
                        <div className="text-[11px] text-slate-500 bg-white/60 p-3.5 rounded-2xl border border-slate-150/40 flex gap-2" id={`exercise-tip-${lesson.id}`}>
                          <span className="text-amber-500 font-extrabold select-none shrink-0">💡 توجيه سلوكي:</span>
                          <span className="font-medium leading-relaxed">{lesson.exercise.tip}</span>
                        </div>

                        {/* Check execution feedback and navigations */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-slate-100" id={`exercise-actions-bar-${lesson.id}`}>
                          
                          <div className="flex-1" id={`exercise-status-tag-${lesson.id}`}>
                            {exerciseChecked && (
                              <div className={`text-xs font-bold p-3.5 rounded-2xl border leading-relaxed ${exerciseSuccess ? 'bg-emerald-50 border-emerald-100 text-emerald-950' : 'bg-red-50 border-red-100 text-red-950'}`} id={`exercise-badge-${lesson.id}`}>
                                {exerciseSuccess 
                                  ? '✨ رائع جداً! تم تدوين هذه الملاحظة السلوكية في ملفك وتم تفعيل المكافأة (+15 XP)' 
                                  : '❌ الإجابة المكتوبة قصيرة جداً للتحقق العلمي (أدخل 10 أحرف على الأقل للمرور).'}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex gap-2.5" id={`exercise-action-buttons-${lesson.id}`}>
                            {!exerciseChecked ? (
                              <button
                                type="button"
                                onClick={() => handleCheckExercise(lesson)}
                                disabled={lesson.exercise.type === 'selection' ? !selectedOption : exerciseAnswer.trim().length < 10}
                                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs py-3 px-6 rounded-2xl cursor-pointer transition-all shadow-sm"
                                id={`exercise-submit-${lesson.id}`}
                              >
                                تدوين وإكمال الدرس
                              </button>
                            ) : (
                              <div className="flex gap-2" id={`exercise-next-nav-${lesson.id}`}>
                                {!exerciseSuccess && (
                                  <button
                                    onClick={resetExercise}
                                    className="bg-white border border-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-slate-50 cursor-pointer"
                                    id={`exercise-retry-${lesson.id}`}
                                  >
                                    إعادة المحاولة
                                  </button>
                                )}
                                {activeLessonIdx < selectedCourse.lessons.length - 1 ? (
                                  <button
                                    onClick={handleNextLesson}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all shadow-md"
                                    id={`exercise-next-btn-${lesson.id}`}
                                  >
                                    الانتقال للدرس التالي
                                  </button>
                                ) : (
                                  <span className="text-xs text-emerald-900 font-extrabold px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl" id={`exercise-lessons-done-${lesson.id}`}>
                                    🎉 أحسنت! أكملت جميع الدروس، يمكنك الآن خوض الامتحان النهائي!
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Manual Pagers */}
                      <div className="flex justify-between border-t border-slate-100 pt-5 mt-6" id="lesson-pagers">
                        <button
                          onClick={handlePrevLesson}
                          disabled={activeLessonIdx === 0}
                          className="border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white rounded-xl py-2 px-4 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
                          id="lesson-prev-pager"
                        >
                          <ChevronRight className="w-4 h-4" /> 
                          <span>الدرس السابق</span>
                        </button>
                        <button
                          onClick={handleNextLesson}
                          disabled={activeLessonIdx === selectedCourse.lessons.length - 1}
                          className="border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white rounded-xl py-2 px-4 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
                          id="lesson-next-pager"
                        >
                          <span>الدرس التالي</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })()
              ) : (
                
                /* EXAM / QUIZ PANEL VIEW CARD */
                <div className="space-y-6 flex-1 flex flex-col justify-between" id="exam-viewport">
                  
                  <div className="space-y-5" id="exam-body">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-5" id="exam-header">
                      <div>
                        <span className="text-[11px] font-black text-amber-900 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full inline-block" id="exam-badge">
                          الامتحان الشامل للمسار التدريبي
                        </span>
                        <h3 className="font-black text-slate-800 text-xl md:text-2xl mt-2" id="exam-title-h3">
                          التقييم الختامي لمنح شهادة الإتمام
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 font-extrabold bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full shadow-sm shrink-0 w-fit" id="exam-pass-rule">
                        الحد الأدنى للاجتياز: 70%
                      </span>
                    </div>

                    {quizScore === null ? (
                      /* ACTIVE QUESTIONS LIST */
                      <div className="space-y-5 max-h-[440px] overflow-y-auto pr-1" id="exam-questions-list">
                        {selectedCourse.quiz.map((q, idx) => (
                          <div key={q.id} className="space-y-4 p-5 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-100" id={`exam-q-box-${q.id}`}>
                            <h4 className="font-extrabold text-slate-800 text-xs md:text-sm flex gap-3 items-start leading-relaxed" id={`exam-q-text-${q.id}`}>
                              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow">{idx + 1}</span>
                              <span>{q.question}</span>
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-2.5 pt-1" id={`exam-options-grid-${q.id}`}>
                              {q.options.map((opt, oIdx) => {
                                const isSelected = quizAnswers[q.id] === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleQuizAnswer(q.id, oIdx)}
                                    className={`w-full text-right p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-sm' 
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
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
                      /* EXAM SCORECARD & COMPREHENSIVE EXPLANATIONS */
                      <div className="text-center space-y-6 py-4" id="exam-scorecard-results">
                        
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-black mx-auto shadow-inner border-4 ${
                          quizScore >= 70 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-red-50 border-red-200 text-red-850'
                        }`} id="exam-res-circle">
                          {quizScore}%
                        </div>

                        {quizScore >= 70 ? (
                          <div className="space-y-4 max-w-lg mx-auto bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100" id="exam-success-panel">
                            <h4 className="text-xl font-black text-emerald-900" id="exam-success-h4">
                              مبروك النجاح الباهر والاعتماد! 🎉
                            </h4>
                            <p className="text-xs md:text-sm text-slate-600 leading-relaxed" id="exam-success-p">
                              لقد أتممت كافة الفحوصات والتمارين العلمية بنجاح مبهر. تم تسجيل وثيقة الإتمام الرسمية باسمك: <span className="text-emerald-900 font-extrabold underline">"{studentName || 'مستكشف مَسار'}"</span>. يمكنك الحصول على شهادتك والبدء في طباعتها مباشرة الآن!
                            </p>
                            <div className="pt-2" id="exam-success-action-wrap">
                              <button
                                onClick={() => {
                                  setSelectedCourse(null);
                                  setActiveTab('dashboard');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-6 rounded-2xl cursor-pointer transition-all inline-flex items-center gap-2 shadow hover:-translate-y-0.5"
                                id="btn-goto-cert-wall"
                              >
                                <Award className="w-4 h-4" /> 
                                <span>الانتقال لمعرض الشهادات لطباعتها فوراً</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 max-w-lg mx-auto bg-red-50/30 p-6 rounded-3xl border border-red-100" id="exam-fail-panel">
                            <h4 className="text-xl font-black text-red-900" id="exam-fail-h4">
                              فرصة قادمة أفضل، لم تتجاوز حد النجاح المطلوب
                            </h4>
                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed" id="exam-fail-p">
                              لا تقلق يا صديقي، التدريب السلوكي رحلة نمو مستمرة وليس مجرد اختبار. نوصيك بتمشيط الدروس والحديث مع كوتش الذكاء الاصطناعي مجدداً، ثم إعادة التقدم للامتحان في أي وقت لاحق.
                            </p>
                            <div className="pt-2" id="exam-fail-action-wrap">
                              <button
                                onClick={() => {
                                  setQuizScore(null);
                                  setQuizAnswers({});
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3 px-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 shadow"
                                id="btn-retry-exam"
                              >
                                إعادة خوض التقييم الشامل
                              </button>
                            </div>
                          </div>
                        )}

                        {/* High level scientific interpretations */}
                        <div className="border-t border-slate-100 pt-6 text-right space-y-4 max-w-xl mx-auto" id="exam-explanation-board">
                          <h5 className="font-extrabold text-slate-800 text-sm flex items-center gap-2" id="exam-explanation-h5">
                            <HelpCircle className="w-5 h-5 text-emerald-600" /> 
                            <span>التحليل العلمي والتفسير المعرفي لأسئلة التقييم:</span>
                          </h5>
                          
                          <div className="space-y-3" id="exam-explanations-list">
                            {selectedCourse.quiz.map((q, idx) => (
                              <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2" id={`exam-ex-item-${q.id}`}>
                                <span className="font-extrabold text-slate-800 block text-xs" id={`exam-ex-q-${q.id}`}>
                                  {idx + 1}. {q.question}
                                </span>
                                <p className="text-slate-600 font-medium text-xs leading-relaxed" id={`exam-ex-body-${q.id}`}>
                                  💡 <span className="text-emerald-800 font-bold">التوجيه السلوكي الصحيح:</span> {q.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Submission triggers */}
                  {quizScore === null && (
                    <div className="flex justify-end pt-5 border-t border-slate-100 mt-6" id="exam-footer">
                      <button
                        disabled={Object.keys(quizAnswers).length < selectedCourse.quiz.length}
                        onClick={handleSubmitQuiz}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-3 px-6 rounded-2xl cursor-pointer transition-all flex items-center gap-1.5 shadow"
                        id="btn-submit-exam"
                      >
                        <span>تسليم التقييم للتحليل والاعتماد</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
