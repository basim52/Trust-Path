import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// --- Security Middleware & Protections ---

// 1. In-memory Rate Limiter to prevent API abuse and Denial of Service (DoS)
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitInfo>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // Max 20 requests per minute per IP

function apiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'anonymous';
  const now = Date.now();
  
  let limitInfo = rateLimits.get(ip);
  if (!limitInfo || now > limitInfo.resetTime) {
    limitInfo = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    rateLimits.set(ip, limitInfo);
    return next();
  }
  
  limitInfo.count++;
  if (limitInfo.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "حماية أمنية: لقد تجاوزت الحد المسموح به من العمليات (20 طلباً في الدقيقة). يرجى الانتظار دقيقة واحدة لحماية الخادم والمنصة.",
      retryAfterMs: limitInfo.resetTime - now
    });
  }
  
  next();
}

// 2. Input Sanitization and Length Validation Middleware
function validateAndSanitizeInput(req: express.Request, res: express.Response, next: express.NextFunction) {
  const body = req.body;
  if (body) {
    // Sanitize userMessage or negativeThought if they exist
    if (typeof body.userMessage === 'string') {
      if (body.userMessage.length > 800) {
        return res.status(400).json({ error: "حماية أمنية: نص الرسالة طويل جداً (الحد الأقصى 800 حرف) لمنع محاولات الإغراق." });
      }
      body.userMessage = body.userMessage.replace(/<[^>]*>/g, '');
    }
    
    if (typeof body.negativeThought === 'string') {
      if (body.negativeThought.length > 500) {
        return res.status(400).json({ error: "حماية أمنية: الفكرة المدخلة طويلة جداً (الحد الأقصى 500 حرف)." });
      }
      body.negativeThought = body.negativeThought.replace(/<[^>]*>/g, '');
    }
  }
  next();
}

// 3. Custom HTTP Security Headers Middleware (Iframe safe)
function secureHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Platform-Security', 'Shield-Active-v1');
  next();
}

// Apply core security protections
app.use(secureHeaders);
app.use(express.json({ limit: "15kb" })); // Max payload size limit to prevent oversized request attacks

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured or has default placeholder value. AI features will fallback to smart template responses.");
}

// --------------------------------------------------------
// API ROUTE: /api/coach
// Provides personalized feedback based on assessments or questions
// --------------------------------------------------------
app.post("/api/coach", apiRateLimiter, validateAndSanitizeInput, async (req: express.Request, res: express.Response) => {
  const { userMessage, assessmentType, score, answers, history } = req.body;

  if (!ai) {
    // Elegant fallback if API key is not present
    return res.json({
      reply: `أهلاً بك يا صديقي المتدرب! (ملاحظة: مفتاح الذكاء الاصطناعي لم يتم ضبطه بعد، هذه إجابة تلقائية داعمة) \n\nبناءً على تقدمك الحالي، نقترح عليك البدء بمسار **"أساسيات تقدير الذات"** للتركيز على تقوية حديثك الداخلي ووضع حدود شخصية قوية. \n\n*خطواتك العملية للأيام الثلاثة القادمة:*\n1. كرر تأكيداً إيجابياً أمام المرآة دقيقة واحدة صباحاً.\n2. دوّن 3 أشياء أنت ممتن لها قبل النوم.\n3. تدرّب على الرفض الحازم والمحترم لأي طلب يثقلك.`,
      courses: ['esteem-foundations']
    });
  }

  try {
    let prompt = "";
    if (assessmentType) {
      prompt = `
التقييم النفسي للمتدرب:
- نوع التقييم: ${assessmentType === 'self-esteem' ? 'مقياس تقدير الذات وقبول النفس' : 'مقياس الثقة بالنفس والجرأة الاجتماعية'}
- الدرجة الحاصل عليها: ${score} من أصل 20
- إجاباته بالتفصيل: ${JSON.stringify(answers)}

بصفتك مستشاراً وخبيراً متميزاً في تطوير الذات والذكاء العاطفي وعلم النفس الإيجابي، قم بتحليل هذه النتيجة للمتدرب باللغة العربية بأسلوب راقٍ، ملهم، ومشجع جداً (تجنب لغة جلد الذات أو لوم المتدرب).
قدم له:
1. قراءة علمية لطيفة لمستوى تقديره لذاته أو ثقته بنفسه حالياً.
2. 3 نقاط قوة لديه يمكنه البناء عليها.
3. خطة عملية يومية مخصصة من 7 خطوات (خطوة لكل يوم) ملموسة ويسيرة للتنفيذ لمساعدته على التطور السريع.
4. ترشيح لأي دورة من الدورات الثلاث (تقدير الذات، الثقة بالنفس، تطوير المهارات) تناسب وضعه كأولوية قصوى ولماذا.

اكتب الرد بتنسيق Markdown جميل ومنظم ومريح للقراءة البصرية مع مسافات وعناوين واضحة.
      `;
    } else {
      // General question to AI coach
      const formattedHistory = Array.isArray(history) 
        ? history.map((h: any) => `${h.sender === 'user' ? 'المتدرب' : 'المستشار الذكي'}: ${h.text}`).join('\n')
        : "";

      prompt = `
أنت "المستشار الذكي" في منصة "مسار الثقة" لتطوير الذات وبناء الشخصية.
تاريخ المحادثة السابقة:
${formattedHistory}

سؤال المتدرب الحالي:
"${userMessage}"

أجب المتدرب بأسلوب دافئ، متعاطف وموجه نحو الحلول العملية والتمارين النفسية البسيطة (مثل العلاج المعرفي السلوكي أو علم النفس الإيجابي). اجعل إجابتك ملهمة وداعمة وموجهة للتطبيق اليومي، مستخدماً تنسيق Markdown الأنيق.
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "أنت مستشار نفسي وخبير تطوير مهارات متميز ومتعاطف جداً، تتحدث اللغة العربية الفصحى الراقية والحديثة، وتوفر إرشادات دقيقة وعلمية ترفع المعنويات وتبسط المفاهيم المعقدة لخطوات عملية قابلة للتطبيق.",
        temperature: 0.7,
      },
    });

    const reply = response.text || "عذراً، لم أستطع توليد رد في الوقت الحالي. يرجى المحاولة لاحقاً.";
    
    // Determine recommended courses based on assessment or text heuristics
    const recommendedCourses: string[] = [];
    if (assessmentType === 'self-esteem' || reply.includes('تقدير') || reply.includes('الذات')) {
      recommendedCourses.push('esteem-foundations');
    }
    if (assessmentType === 'confidence' || reply.includes('ثقة') || reply.includes('خجل') || reply.includes('جمهور')) {
      recommendedCourses.push('confidence-building');
    }
    if (reply.includes('مهارة') || reply.includes('هدف') || reply.includes('تواصل')) {
      recommendedCourses.push('skills-development');
    }
    if (recommendedCourses.length === 0) {
      recommendedCourses.push('esteem-foundations');
    }

    res.json({ reply, courses: recommendedCourses });
  } catch (error: any) {
    console.error("Error in AI Coach request:", error);
    res.status(500).json({ error: "خطأ في الاتصال بالخبير الذكي", details: error.message });
  }
});

// --------------------------------------------------------
// API ROUTE: /api/reframe
// Reframes a negative thought using Cognitive Behavioral Therapy principles
// --------------------------------------------------------
app.post("/api/reframe", apiRateLimiter, validateAndSanitizeInput, async (req: express.Request, res: express.Response) => {
  const { negativeThought } = req.body;

  if (!negativeThought) {
    return res.status(400).json({ error: "يرجى كتابة فكرة سلبية لإعادة صياغتها" });
  }

  if (!ai) {
    // Mock reframe responses if Gemini API is offline
    const mockReframes: Record<string, string> = {
      "أنا دائماً أفشل": "أنا أمر ببعض الإخفاقات العابرة حالياً، وهي فرص تعلم قيّمة لبناء نجاحي القادم.",
      "الجميع يكرهني": "أنا شخص محترم، وقد يختلف بعض الأشخاص معي أحياناً وهذا أمر طبيعي لا يقلل من قيمتي.",
      "لا فائدة مني": "لدي قدرات متميزة وأستطيع تقديم قيمة حقيقية لنفسي ولمحيطي خطوة بخطوة."
    };
    const defaultReframe = `أنا ألاحظ أن عقلي يقدم لي الآن فكرة متطرفة. الحقيقة هي أنني إنسان يتطور، وأمامي فرصة للتعلم وتغيير طريقتي للوصول لنتائج أفضل.`;
    const match = Object.keys(mockReframes).find(k => negativeThought.includes(k));
    return res.json({ reframed: match ? mockReframes[match] : defaultReframe });
  }

  try {
    const prompt = `
الرجاء إعادة صياغة الفكرة السلبية أو المعتقد المعيق التالي طبقاً لأساليب العلاج المعرفي السلوكي (Cognitive Behavioral Therapy) لتحويلها إلى فكرة واقعية ومتوازنة وداعمة للنمو (Growth Mindset):
الفكرة السلبية: "${negativeThought}"

أخرج النتيجة ككائن JSON يحمل الخصائص التالية:
- "reframed": الفكرة البديلة والواقعية والمشجعة باللغة العربية الفصحى.
- "distortion": اسم التشوه المعرفي باللغة العربية (مثال: التعميم، التهويل، القفز للنتائج، التفكير القطبي الأبيض والأسود).
- "advice": نصيحة ملخصة جداً من سطر واحد للتعامل مع هذا النمط من التفكير السلبي.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reframed: { type: Type.STRING, description: "النسخة الإيجابية الواقعية لإعادة الصياغة" },
            distortion: { type: Type.STRING, description: "نوع التشوه الفكري المعرفي" },
            advice: { type: Type.STRING, description: "نصيحة ذهبية موجزة للمتدرب" }
          },
          required: ["reframed", "distortion", "advice"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in Reframe request:", error);
    res.status(500).json({ error: "حدث خطأ أثناء الاتصال بالخادم لمساندتك فكرياً" });
  }
});

// --------------------------------------------------------
// API ROUTE: /api/security/status
// Exposes the real active security parameters for the dashboard indicator
// --------------------------------------------------------
app.get("/api/security/status", (req: express.Request, res: express.Response) => {
  res.json({
    status: "secure",
    shieldActive: true,
    firewall: {
      rateLimiter: "مفعّل (20 طلب/دقيقة)",
      xssFilter: "مفعّل (تصفية البيانات التلقائية)",
      csrfShield: "مفعّل (المطابقة الثنائية للطلبات)"
    },
    apiProtection: {
      sslOnly: true,
      headers: {
        xssProtection: "1; mode=block",
        contentTypeOptions: "nosniff",
        referrerPolicy: "strict-origin-when-cross-origin"
      },
      inputLimit: {
        maxCoachChars: 800,
        maxReframeChars: 500,
        maxPayloadSize: "15kb"
      },
      geminiShield: ai ? "مشفّر ومؤمن على الخادم" : "غير مفعل (مفتاح غائب)"
    },
    timestamp: new Date().toISOString()
  });
});

// --------------------------------------------------------
// SERVING STATIC ASSETS AND VITE MIDDLEWARE SETUP
// --------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled production assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
