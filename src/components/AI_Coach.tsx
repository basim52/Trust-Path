/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, HelpCircle, ShieldAlert, Check, RefreshCw, MessageSquareCode, Compass } from 'lucide-react';
import { ReframedThought } from '../types';

interface Message {
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

interface AICoachProps {
  points: number;
  addPoints: (p: number) => void;
  thoughtReframings: ReframedThought[];
  addReframedThought: (original: string, reframed: string, category: string) => void;
}

export default function AICoach({ points, addPoints, thoughtReframings, addReframedThought }: AICoachProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'coach',
      text: 'مرحباً بك يا صديقي في عيادتك النفسية والتطويرية الخاصة! 🌸\nأنا مستشارك الشخصي المدعوم بالذكاء الاصطناعي لمساعدتك على تقوية تقديرك لذاتك وبناء ثقتك بنفسك وتطوير مهاراتك الفردية.\n\nتفضل بمشاركتي بأي شعور يراودك، أو موقف اجتماعي أقلقك، أو استفسار حول كيفية الارتقاء بمهاراتك وسأبذل قصارى جهدي لإرشادك بخطوات ملموسة وعلمية.',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reframe workbench state
  const [negativeThoughtInput, setNegativeThoughtInput] = useState('');
  const [isReframing, setIsReframing] = useState(false);
  const [reframeResult, setReframeResult] = useState<{
    reframed: string;
    distortion: string;
    advice: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Preset Questions
  const PRESET_TOPICS = [
    "كيف أتكلم بثقة أمام الجمهور دون ارتباك؟",
    "أشعر بجلد الذات الشديد عند ارتكاب أي خطأ بسيط، ماذا أفعل؟",
    "كيف أضع حدوداً واضحة للآخرين دون الشعور بالذنب؟",
    "أقارن نفسي بزملاء العمل الناجحين وأشعر بالإحباط، كيف أتوقف؟"
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    setError(null);
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Package message history
      const historyPayload = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: textToSend,
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error('فشل الخادم في الرد');
      }

      const data = await response.json();
      
      const coachMsg: Message = {
        sender: 'coach',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, coachMsg]);
      addPoints(10); // Reward for interacting with the AI coach
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالخادم الذكي. يرجى التأكد من تشغيل الخادم بشكل صحيح.');
      
      // Local fallback reply
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'coach',
          text: 'أعتذر منك يا صديقي، يبدو أن هناك ضغطاً مؤقتاً على خادم الذكاء الاصطناعي. تذكر دائماً أن تتحدث مع نفسك بلطف وتتقبل نقاط قوتك وعيوبك بالتساوي. أنا هنا لمساندتك دائماً!',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    } finally {
      setIsSending(false);
    }
  };

  // Reframe tool trigger
  const handleReframeThought = async () => {
    if (!negativeThoughtInput.trim() || isReframing) return;

    setIsReframing(true);
    setReframeResult(null);

    try {
      const response = await fetch('/api/reframe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ negativeThought: negativeThoughtInput })
      });

      if (!response.ok) {
        throw new Error('فشل إعادة الصياغة المعرفية');
      }

      const data = await response.json();
      setReframeResult(data);
      
      // Save to thought history
      addReframedThought(negativeThoughtInput, data.reframed, data.distortion);
      addPoints(15); // Higher reward for doing CBT cognitive reframing!
    } catch (err) {
      console.error(err);
      // Fallback
      setReframeResult({
        reframed: `أنا أمر بموقف صعب حالياً، لكن هذا لا يحدد قيمتي الإنسانية. سأتعلم مما حدث وأمضي قدماً خطوة بخطوة وبكل لطف.`,
        distortion: "التعميم وجلد الذات الكلي",
        advice: "حاول عدم استخدام الكلمات المطلقة كـ 'أبداً' أو 'دائماً'، واستبدلها بنبرة صديق ناصح ومتفهم."
      });
    } finally {
      setIsReframing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="ai-coach-module">
      {/* Module Title Banner */}
      <div className="text-center mb-8" id="ai-coach-banner">
        <span className="bg-emerald-100 text-emerald-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider" id="ai-coach-badge">
          المرشد النفسي وتعديل الأفكار
        </span>
        <h1 className="text-3xl font-extrabold text-slate-800 mt-2" id="ai-coach-title">🧠 المستشار والمدرب الشخصي بالذكاء الاصطناعي</h1>
        <p className="text-slate-500 max-w-2xl mx-auto mt-2 text-sm leading-relaxed" id="ai-coach-subtitle">
          تفاعل بشكل حي مع خبير علم النفس الإيجابي لصياغة عقلية نمو واثقة، واستخدم مختبر العلاج المعرفي السلوكي (CBT) لإعادة هيكلة معتقداتك السلبية فوراً.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ai-coach-grid">
        {/* Left Column: AI Chat Box (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[600px]" id="chat-container">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl" id="chat-header">
            <div className="flex items-center gap-3" id="chat-identity">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" id="chat-avatar">
                💡
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm" id="chat-name">المستشار الذكي (مسار الثقة)</h2>
                <p className="text-emerald-600 text-xs flex items-center gap-1 font-semibold" id="chat-status">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> متصل ومستعد لمساعدتك الآن
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium" id="chat-points-earned">
              جائزة المشاركة: +10 نقاط تطوير
            </div>
          </div>

          {/* Messages Display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20" id="chat-messages-scroll">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                id={`msg-wrapper-${idx}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 shadow-xs rounded-bl-none whitespace-pre-line'
                  }`}
                  id={`msg-bubble-${idx}`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1" id={`msg-time-${idx}`}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-white border border-slate-100 px-3 py-2 rounded-xl shadow-xs ml-auto w-max" id="chat-typing">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>المستشار الذكي يقوم بالتفكير وصياغة النصائح المخصصة لك...</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-xs flex items-center gap-2 max-w-[90%] ml-auto" id="chat-error-box">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Topics Suggestions */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2" id="preset-topics">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 w-full mb-1">
              <Compass className="w-3.5 h-3.5 text-slate-500" /> اقتراحات لبدء الحوار:
            </span>
            {PRESET_TOPICS.map((topic, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(topic)}
                disabled={isSending}
                className="text-xs bg-white text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-right"
                id={`preset-btn-${i}`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="p-3 border-t border-slate-100 flex gap-2"
            id="chat-input-form"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب هنا ما تشعر به أو سؤالك للتطوير الشخصي وبناء الثقة..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 text-right font-sans"
              dir="rtl"
              disabled={isSending}
              id="chat-text-input"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600 cursor-pointer"
              id="chat-submit-btn"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </form>
        </div>

        {/* Right Column: CBT Reframe Laboratory (5 Cols) */}
        <div className="lg:col-span-5 space-y-6" id="right-col-coach">
          {/* Reframe Workbench Panel */}
          <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-100/60 shadow-xs" id="reframe-panel">
            <div className="flex items-center gap-3 mb-4" id="reframe-heading">
              <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl" id="reframe-icon-wrap">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base" id="reframe-title">🧪 مختبر إعادة الهيكلة المعرفية</h2>
                <p className="text-xs text-slate-500 font-medium" id="reframe-subtitle">تعديل أحكام الناقد الداخلي وجلد الذات فورا</p>
              </div>
            </div>

            <div className="space-y-4" id="reframe-form">
              <div id="reframe-input-group">
                <label className="block text-xs font-bold text-slate-600 mb-2" id="reframe-label-input">
                  الفكرة السلبية أو النقد الداخلي المزعج:
                </label>
                <textarea
                  value={negativeThoughtInput}
                  onChange={(e) => setNegativeThoughtInput(e.target.value)}
                  placeholder="مثال: 'أنا دائماً أفشل في التواصل مع الآخرين والجميع يجاملني فقط ولا يحترمني'"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 text-right min-h-[80px]"
                  dir="rtl"
                  disabled={isReframing}
                  id="reframe-textarea"
                />
              </div>

              <button
                type="button"
                onClick={handleReframeThought}
                disabled={!negativeThoughtInput.trim() || isReframing}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                id="reframe-submit-btn"
              >
                {isReframing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>جاري ترويض الفكرة وفحص التشوهات...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>تطبيق إعادة صياغة علمية (+15 نقطة)</span>
                  </>
                )}
              </button>
            </div>

            {/* Reframe Result Container */}
            {reframeResult && (
              <div className="mt-5 p-4 bg-white border border-emerald-200/60 rounded-xl space-y-3 animate-fade-in" id="reframe-result-box">
                <div className="flex items-center justify-between text-xs" id="reframe-result-meta">
                  <span className="font-bold text-slate-800" id="reframe-res-tag-title">التحليل المعرفي النفسي</span>
                  <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded font-bold text-[10px]" id="reframe-distortion-tag">
                    🚫 تشوه: {reframeResult.distortion}
                  </span>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100" id="reframe-box-clean">
                  <div className="text-[10px] font-bold text-emerald-800 mb-1 flex items-center gap-1" id="reframe-clean-header">
                    <Check className="w-3.5 h-3.5" /> الفكرة البديلة والواقعية للنمو:
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed" id="reframe-clean-text">
                    {reframeResult.reframed}
                  </p>
                </div>

                <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-100" id="reframe-box-advice">
                  <div className="text-[10px] font-bold text-blue-800 mb-1 flex items-center gap-1" id="reframe-advice-header">
                    <MessageSquareCode className="w-3.5 h-3.5" /> نصيحة لتطوير الوعي الذاتي:
                  </div>
                  <p className="text-slate-600 text-xs italic" id="reframe-advice-text">
                    {reframeResult.advice}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* History of reframings */}
          {thoughtReframings.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3" id="reframe-history-box">
              <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5" id="ref-hist-title">
                📓 أرشيف إعادة الهيكلة الخاص بك ({thoughtReframings.length})
              </h3>
              <div className="max-h-[180px] overflow-y-auto space-y-3 pr-1" id="reframe-history-scroll">
                {thoughtReframings.slice().reverse().map((thought) => (
                  <div key={thought.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100" id={`ref-hist-item-${thought.id}`}>
                    <div className="flex justify-between items-center text-[10px]" id={`ref-hist-meta-${thought.id}`}>
                      <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-semibold" id={`ref-hist-dist-${thought.id}`}>{thought.category}</span>
                      <span className="text-slate-400 font-medium" id={`ref-hist-date-${thought.id}`}>{thought.date}</span>
                    </div>
                    <div className="text-slate-400 line-through text-[11px]" id={`ref-hist-orig-${thought.id}`}>
                      {thought.original}
                    </div>
                    <div className="text-slate-700 font-medium bg-white p-2 rounded border border-slate-200/50" id={`ref-hist-new-${thought.id}`}>
                      ✨ {thought.reframed}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
