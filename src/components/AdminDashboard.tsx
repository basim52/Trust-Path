import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TraineeProgress, Course, COURSES_DATA } from '../types';
import { 
  Users, Award, Sparkles, Search, Calendar, FileText, CheckCircle, 
  ChevronRight, Brain, Smile, Activity, RefreshCw, X, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TraineeUser {
  uid: string;
  email: string;
  name: string;
  lastActive?: string;
  progress: TraineeProgress;
}

interface AdminDashboardProps {
  adminEmail: string;
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [trainees, setTrainees] = useState<TraineeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeUser | null>(null);
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'lastActive'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedTrainees: TraineeUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email !== adminEmail) { // hide admin from trainee list to avoid self-pollution
          fetchedTrainees.push({
            uid: doc.id,
            email: data.email || '',
            name: data.name || 'مشارك مجهول',
            lastActive: data.lastActive,
            progress: data.progress as TraineeProgress
          });
        }
      });
      setTrainees(fetchedTrainees);
    } catch (err) {
      console.error("Error fetching trainees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainees();
  }, []);

  const handleSort = (field: 'points' | 'name' | 'lastActive') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter & Sort Trainees
  const filteredTrainees = trainees
    .filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'points') {
        const pointsA = a.progress?.points || 0;
        const pointsB = b.progress?.points || 0;
        comparison = pointsA - pointsB;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'lastActive') {
        const dateA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const dateB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Summary Metrics
  const totalTraineesCount = trainees.length;
  const certifiedCount = trainees.filter(t => (t.progress?.certificates?.length || 0) > 0).length;
  const highXPCount = trainees.filter(t => (t.progress?.points || 0) >= 100).length;
  const totalXP = trainees.reduce((acc, t) => acc + (t.progress?.points || 0), 0);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'غير نشط مؤخراً';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans" dir="rtl">
      
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl" />
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30">
              بوابة المسؤولين والأدمن 🔑
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white">لوحة رقابة ومتابعة المتدربين</h1>
          <p className="text-slate-300 text-xs mt-1.5 font-medium leading-relaxed max-w-xl">
            مرحباً بك يا أستاذ باسم. تتيح لك هذه اللوحة مراقبة تقدم المتدربين في الدورات والتمارين، ورؤية نتائج مقاييسهم النفسية، ومتابعة تفعيلهم لبرنامج "مسار الثقة".
          </p>
        </div>

        <button 
          onClick={fetchTrainees} 
          disabled={loading}
          className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition-all flex items-center gap-2 self-stretch md:self-auto justify-center cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'إجمالي المتدربين', val: totalTraineesCount, desc: 'حسابات مسجلة بالمنصة', icon: <Users className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50/50 border-indigo-100/50' },
          { label: 'متدربون متميزون (100+ XP)', val: highXPCount, desc: 'تفاعل وإنجاز مستمر', icon: <Sparkles className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50/50 border-emerald-100/50' },
          { label: 'الحاصلون على شهادات', val: certifiedCount, desc: 'أتموا دورة كاملة بنجاح', icon: <Award className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50/50 border-amber-100/50' },
          { label: 'إجمالي نقاط الخبرة (XP)', val: totalXP, desc: 'مجموع تقدم النظام', icon: <Activity className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50/50 border-teal-100/50' }
        ].map((kpi, idx) => (
          <div key={idx} className={`p-5 rounded-3xl border bg-white shadow-xs flex flex-col justify-between ${kpi.bg}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black text-slate-500">{kpi.label}</span>
              <div className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100">{kpi.icon}</div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-850 block">{kpi.val}</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Trainees List Container */}
      <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="البحث عن متدرب بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right"
            />
          </div>
          
          {/* Sorting controls */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>ترتيب حسب:</span>
            <button 
              onClick={() => handleSort('points')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${sortBy === 'points' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <span>النقاط</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button 
              onClick={() => handleSort('name')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${sortBy === 'name' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <span>الاسم</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button 
              onClick={() => handleSort('lastActive')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${sortBy === 'lastActive' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <span>آخر ظهور</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs">جاري تحميل سجلات المتدربين من قاعدة البيانات...</span>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-bold">
            <p className="text-sm">لم يتم العثور على أي متدربين يطابقون بحثك.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                  <th className="p-4 pr-6">المتدرب</th>
                  <th className="p-4">إجمالي النقاط XP</th>
                  <th className="p-4">الدورات والدروس المكتملة</th>
                  <th className="p-4">الشهادات</th>
                  <th className="p-4">المقاييس النفسية</th>
                  <th className="p-4">آخر نشاط</th>
                  <th className="p-4 pl-6 text-left">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainees.map((trainee) => {
                  const completedLessonsCount = trainee.progress?.completedLessons?.length || 0;
                  const completedCoursesCount = trainee.progress?.completedCourses?.length || 0;
                  const certCount = trainee.progress?.certificates?.length || 0;
                  const hasSelfEsteem = !!trainee.progress?.assessments?.['self-esteem'];
                  const hasConfidence = !!trainee.progress?.assessments?.['confidence'];

                  return (
                    <tr key={trainee.uid} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name / Email */}
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-100 shrink-0">
                            {trainee.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="block text-xs font-black text-slate-800">{trainee.name}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">{trainee.email}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Points */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-black text-emerald-800">{trainee.progress?.points || 0} XP</span>
                        </div>
                      </td>

                      {/* Course / Lesson counts */}
                      <td className="p-4">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">
                            دروس مكتملة: {completedLessonsCount}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            دورات تامة: {completedCoursesCount}
                          </span>
                        </div>
                      </td>

                      {/* Certificates */}
                      <td className="p-4">
                        {certCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Award className="w-3 h-3" />
                            <span>{certCount} شهادة</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">لا يوجد</span>
                        )}
                      </td>

                      {/* Psychological scale stats */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md ${hasSelfEsteem ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                            تقدير الذات: {hasSelfEsteem ? `${trainee.progress.assessments['self-esteem'].score}/20` : 'معلّق'}
                          </span>
                          <span className={`block text-[9px] font-extrabold px-2 py-0.5 rounded-md ${hasConfidence ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-slate-100 text-slate-400'}`}>
                            الثقة بالذات: {hasConfidence ? `${trainee.progress.assessments['confidence'].score}/20` : 'معلّق'}
                          </span>
                        </div>
                      </td>

                      {/* Last active */}
                      <td className="p-4 text-[11px] font-bold text-slate-500">
                        {formatDate(trainee.lastActive)}
                      </td>

                      {/* Detail CTA */}
                      <td className="p-4 pl-6 text-left">
                        <button
                          onClick={() => setSelectedTrainee(trainee)}
                          className="p-1.5 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-emerald-700"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trainee Deep Inspection Modal */}
      <AnimatePresence>
        {selectedTrainee && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-150 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-900 font-extrabold text-sm flex items-center justify-center">
                    {selectedTrainee.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-black">{selectedTrainee.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{selectedTrainee.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right bg-slate-50/50">
                
                {/* 1. Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">النقاط الإجمالية</span>
                    <span className="text-base font-black text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      {selectedTrainee.progress?.points || 0} XP
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">دروس مكتملة</span>
                    <span className="text-base font-black text-slate-800 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {selectedTrainee.progress?.completedLessons?.length || 0} درساً
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">شهادات إنجاز</span>
                    <span className="text-base font-black text-slate-800 flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-500" />
                      {selectedTrainee.progress?.certificates?.length || 0} شهادة
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Psychological scales + Certificates */}
                  <div className="space-y-6">
                    {/* Psychological scales */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-3xs space-y-4">
                      <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-indigo-500" />
                        <span>نتائج المقاييس التشخيصية</span>
                      </h4>

                      <div className="space-y-3">
                        {/* Self esteem */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-850">مقياس تقدير الذات</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {selectedTrainee.progress?.assessments?.['self-esteem']?.date || 'لم يتم بعد'}
                            </span>
                          </div>
                          {selectedTrainee.progress?.assessments?.['self-esteem'] ? (
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-extrabold text-emerald-700">
                                النتيجة: {selectedTrainee.progress.assessments['self-esteem'].score}/20
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {selectedTrainee.progress.assessments['self-esteem'].level}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold">المتدرب لم يختبر هذا المقياس حتى الآن.</p>
                          )}
                        </div>

                        {/* Confidence */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-850">مقياس الثقة بالنفس</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {selectedTrainee.progress?.assessments?.['confidence']?.date || 'لم يتم بعد'}
                            </span>
                          </div>
                          {selectedTrainee.progress?.assessments?.['confidence'] ? (
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-extrabold text-emerald-700">
                                النتيجة: {selectedTrainee.progress.assessments['confidence'].score}/20
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {selectedTrainee.progress.assessments['confidence'].level}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold">المتدرب لم يختبر هذا المقياس حتى الآن.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gratitude Journal Entries */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-3xs space-y-4">
                      <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Smile className="w-4 h-4 text-amber-500" />
                        <span>مذكرات الامتنان والوعي ({selectedTrainee.progress?.gratitudeJournal?.length || 0})</span>
                      </h4>

                      {selectedTrainee.progress?.gratitudeJournal && selectedTrainee.progress.gratitudeJournal.length > 0 ? (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {selectedTrainee.progress.gratitudeJournal.map((entry, idx) => (
                            <div key={idx} className="bg-amber-50/30 border border-amber-100 rounded-xl p-3.5 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-amber-800">اليوم التدويني #{idx+1}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{entry.date}</span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs font-medium">
                                {entry.items.map((item, iIdx) => (
                                  <li key={iIdx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold">لم يسجل أي تدوينات في مفكرة الامتنان بعد.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Thought Reframings + Paragraph Completes */}
                  <div className="space-y-6">
                    {/* Cognitive Reframings */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-3xs space-y-4">
                      <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-emerald-500" />
                        <span>إعادة صياغة الأفكار وتعديل التشوهات ({selectedTrainee.progress?.thoughtReframings?.length || 0})</span>
                      </h4>

                      {selectedTrainee.progress?.thoughtReframings && selectedTrainee.progress.thoughtReframings.length > 0 ? (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {selectedTrainee.progress.thoughtReframings.map((thought) => (
                            <div key={thought.id} className="bg-emerald-50/20 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                                  تصنيف التشوه: {thought.category}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">{thought.date}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] text-red-700 font-bold">الفكرة المشوهة (التلقائية):</p>
                                <p className="text-xs text-slate-600 line-through bg-red-50/30 p-1.5 rounded border border-red-50/50 font-medium">
                                  {thought.original}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] text-emerald-700 font-black">الفكرة العقلانية البديلة:</p>
                                <p className="text-xs text-slate-800 bg-white p-1.5 rounded border border-emerald-100 font-semibold">
                                  {thought.reframed}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold">لم يقم بإعادة هيكلة وتفنيد الأفكار المشوهة بعد.</p>
                      )}
                    </div>

                    {/* Marked Paragraphs Toggles */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-3xs space-y-4">
                      <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>الفقرات التي أقر بقراءتها واستيعابها</span>
                      </h4>

                      {selectedTrainee.progress?.completedParagraphs && Object.keys(selectedTrainee.progress.completedParagraphs).filter(k => selectedTrainee.progress.completedParagraphs?.[k]).length > 0 ? (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          <p className="text-[10px] text-slate-400 font-bold mb-2">أبدى المتدرب استيعابه للفقرات التدريبية التالية:</p>
                          {Object.entries(selectedTrainee.progress.completedParagraphs)
                            .filter(([_, comp]) => comp)
                            .map(([key], pIdx) => {
                              // Key form: "courseId-lessonId-type-index"
                              const parts = key.split('-');
                              const courseId = parts[0] || 'دورة';
                              const lessonId = parts[1] || 'درس';
                              const blockType = parts[2] || 'فقرة';
                              const index = parts[3] || '';
                              
                              let typeName = 'فقرة نصية';
                              if (blockType === 'quote') typeName = 'مقولة/اقتباس';
                              if (blockType === 'num') typeName = 'عنصر في قائمة مرقمة';
                              if (blockType === 'bullet') typeName = 'عنصر في قائمة نقطية';
                              if (blockType === 'table') typeName = 'جدول توضيحي';

                              const course = COURSES_DATA.find(c => c.id === courseId);
                              const lesson = course?.lessons.find(l => l.id === lessonId);

                              return (
                                <div key={pIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                                  <div>
                                    <span className="text-emerald-700 font-black">[{typeName}]</span>
                                    <span className="mx-1 font-normal text-slate-400">في</span>
                                    <span className="text-slate-800">{lesson?.title || `درس ${lessonId}`}</span>
                                  </div>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                    مكتملة
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold">لم يقم بتأكيد قراءة واستيعاب أي فقرة بعد.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificates details */}
                <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-3xs space-y-4">
                  <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>الشهادات الصادرة عن المنصة ({selectedTrainee.progress?.certificates?.length || 0})</span>
                  </h4>

                  {selectedTrainee.progress?.certificates && selectedTrainee.progress.certificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTrainee.progress.certificates.map((cert) => (
                        <div key={cert.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4 items-center relative overflow-hidden">
                          <div className="w-1.5 h-full bg-amber-500 absolute right-0 top-0 bottom-0" />
                          <div className="w-10 h-10 bg-amber-100 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-center text-lg shrink-0">
                            🎓
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-black text-slate-850">{cert.courseTitle}</span>
                            <span className="block text-[10px] text-slate-400 font-bold mt-0.5">الرمز المرجعي للتحقق: {cert.verificationCode}</span>
                            <span className="block text-[10px] text-slate-500 font-bold mt-0.5">تاريخ الإصدار: {cert.issuedAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-bold">لم تنشر له أي شهادة تقديرية بالمنصة بعد.</p>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق نافذة المتابعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
