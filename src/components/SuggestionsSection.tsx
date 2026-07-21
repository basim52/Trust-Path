/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lightbulb, CheckCircle2, ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

export default function SuggestionsSection() {
  const suggestions = [
    {
      title: "1. الدمج بين التقييم الذاتي والذكاء الاصطناعي",
      icon: <Sparkles className="w-6 h-6 text-emerald-600" id="sug-icon-ai" />,
      desc: "توفير اختبارات علمية دورية لقياس الثقة وتقدير الذات، مع ربطها مباشرة بمحرك الذكاء الاصطناعي (Gemini) لتحليل الإجابات وتقديم خطة نمو يومية مخصصة وعملية تتناسب مع التحديات الفردية للمتدرب."
    },
    {
      title: "2. مفكرة الامتنان وتطوير الحديث الإيجابي اليومي",
      icon: <Heart className="w-6 h-6 text-red-500" id="sug-icon-heart" />,
      desc: "حث المتدربين على كتابة 3 أمور ممتنين لها يومياً وتدوينها في دفتر 'الامتنان والتقدير'. يساهم تدوين المنجزات البسيطة في إعادة برمجة الدماغ الباطن لرؤية الإيجابيات وتقوية الشعور بالاستحقاق الذاتي."
    },
    {
      title: "3. مختبر إعادة صياغة الأفكار السلبية (CBT Laboratory)",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" id="sug-icon-shield" />,
      desc: "توفير أداة تفاعلية تمكن المشترك من كتابة أفكاره السلبية وجلد الذات (مثال: 'أنا لا أنفع لشيء') ليقوم المستشار الذكي فوراً بإظهار نوع التشوه الفكري وتقديم صياغة بديلة موضوعية وعملية تعزز عقلية النمو."
    },
    {
      title: "4. التلعيب (Gamification) ونظام تتبع العادات اليومية",
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" id="sug-icon-check" />,
      desc: "تحويل المبادئ النفسية الجافة إلى مهام وعادات يومية ملموسة (مثل: ممارسة وقفة القوة لدقيقتين، قراءة دقيقة لتطوير الذات، قول لا بحزم)، مع منح المشتركين نقاطاً ومستويات لترسيخ الالتزام والتحفيز الذاتي."
    },
    {
      title: "5. شهادات إتمام فورية وموثقة بصرياً",
      icon: <BookOpen className="w-6 h-6 text-blue-600" id="sug-icon-book" />,
      desc: "تقديم وثيقة إتمام رقمية مصممة بأناقة وفخامة بمجرد اجتياز الدروس والاختبارات بمعدل نجاح يفوق 70%، مما يحفز التقدير المهني والاعتراف بالإنجاز الشخصي للمتدرب لتشجيعه على مواصلة التعلم."
    }
  ];

  return (
    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 max-w-4xl mx-auto my-8 shadow-sm" id="suggestions-container">
      <div className="flex items-center gap-3 mb-6" id="suggestions-header">
        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800" id="suggestions-badge">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans" id="suggestions-title">💡 توصيات ومقترحات لتعظيم الفائدة النفسية</h2>
          <p className="text-sm text-slate-500 mt-1" id="suggestions-subtitle">
            قائمة بالحلول العلمية والتفاعلية المبتكرة التي تم تضمينها وتفعيلها في هذه المنصة لمساعدة المتدربين على تحقيق تحول حقيقي ومستدام.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="suggestions-grid">
        {suggestions.map((s, index) => (
          <div key={index} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow duration-300" id={`sug-card-${index}`}>
            <div className="flex items-center gap-3 mb-3" id={`sug-header-${index}`}>
              <div className="p-2 bg-slate-50 rounded-lg" id={`sug-icon-wrap-${index}`}>
                {s.icon}
              </div>
              <h3 className="font-semibold text-slate-800 text-base" id={`sug-title-${index}`}>{s.title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed" id={`sug-desc-${index}`}>{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-emerald-100 text-center" id="suggestions-footer">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/50 px-3 py-1.5 rounded-full" id="sug-pill">
          ✨ تم دمج جميع المقترحات أعلاه وتفعيلها بالكامل في التطبيق الحالي!
        </span>
      </div>
    </div>
  );
}
