/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Download, Printer, Palette, Sparkles, Check, Share2, Award, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lesson } from '../types';

interface LessonExporterProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  courseTitle: string;
}

type FrameStyle = 'classic-gold' | 'royal-emerald' | 'sunset-aurora' | 'minimalist-gold';

export default function LessonExporter({ isOpen, onClose, lesson, courseTitle }: LessonExporterProps) {
  const [activeStyle, setActiveStyle] = useState<FrameStyle>('classic-gold');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Custom styling presets
  const stylesConfig = {
    'classic-gold': {
      name: 'الزخرفة الذهبية الكلاسيكية',
      containerClass: 'bg-[#faf6eb] text-[#3c2a13] border-[16px] border-[#d4af37] selection:bg-[#d4af37]/20',
      headerClass: 'text-[#8b6508] font-black',
      footerClass: 'text-[#8b6508] border-[#d4af37]/30',
      accentColor: '#d4af37',
      bgPattern: 'radial-gradient(circle, #fcfaf2 20%, transparent 20%), radial-gradient(circle, #fcfaf2 20%, transparent 20%)',
      decorator: '✦ ═══════ ⚜ ═══════ ✦',
      cornerDecor: '★',
      badgeClass: 'bg-[#d4af37]/10 text-[#8b6508] border-[#d4af37]/30',
      taglineColor: 'text-[#aa8226]',
    },
    'royal-emerald': {
      name: 'التموجات الزمردية الملكية',
      containerClass: 'bg-[#f0f7f4] text-[#113f2a] border-[16px] border-[#0f5132] selection:bg-[#0f5132]/20',
      headerClass: 'text-[#198754] font-black',
      footerClass: 'text-[#198754] border-[#0f5132]/30',
      accentColor: '#0f5132',
      bgPattern: 'radial-gradient(circle, #e6f1ec 20%, transparent 20%)',
      decorator: '❈ ═══════ 𐃢 ═══════ ❈',
      cornerDecor: '◈',
      badgeClass: 'bg-[#0f5132]/10 text-[#0f5132] border-[#0f5132]/30',
      taglineColor: 'text-[#1b7348]',
    },
    'sunset-aurora': {
      name: 'الشفق البنفسجي الفاخر',
      containerClass: 'bg-[#fcf8ff] text-[#34114d] border-[16px] border-[#4b0082] selection:bg-[#4b0082]/20',
      headerClass: 'text-[#6a0dad] font-black',
      footerClass: 'text-[#6a0dad] border-[#4b0082]/30',
      accentColor: '#4b0082',
      bgPattern: 'radial-gradient(circle, #f5ebff 20%, transparent 20%)',
      decorator: '✨ ═══════ 🔮 ═══════ ✨',
      cornerDecor: '✦',
      badgeClass: 'bg-[#4b0082]/10 text-[#6a0dad] border-[#4b0082]/30',
      taglineColor: 'text-[#7e25b8]',
    },
    'minimalist-gold': {
      name: 'الرخام الأبيض الفخم',
      containerClass: 'bg-white text-slate-850 border-[16px] border-slate-900 selection:bg-slate-900/10',
      headerClass: 'text-slate-900 font-black',
      footerClass: 'text-slate-900 border-slate-200',
      accentColor: '#1e293b',
      bgPattern: 'none',
      decorator: '✦ ─────────────── ✦',
      cornerDecor: '✦',
      badgeClass: 'bg-slate-50 text-slate-900 border-slate-200',
      taglineColor: 'text-slate-600',
    }
  };

  const currentConfig = stylesConfig[activeStyle];

  // Render text for print / export representation
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks
      .replace(/####\s*/g, '')
      .replace(/###\s*/g, '')
      .replace(/>\s*/g, '');
  };

  // HTML5 Canvas generation to save high-res image
  const handleSaveAsImage = () => {
    setExporting(true);
    setExportSuccess(false);

    try {
      const canvas = document.createElement('canvas');
      // High-res canvas dimensions
      const width = 1200;
      const height = 1500;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context');

      // 1. Background Fill with beautiful tint
      let bgGrad;
      if (activeStyle === 'classic-gold') {
        bgGrad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
        bgGrad.addColorStop(0, '#fefbf5');
        bgGrad.addColorStop(1, '#f3ebd4');
      } else if (activeStyle === 'royal-emerald') {
        bgGrad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
        bgGrad.addColorStop(0, '#f5faf7');
        bgGrad.addColorStop(1, '#d8eade');
      } else if (activeStyle === 'sunset-aurora') {
        bgGrad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
        bgGrad.addColorStop(0, '#fdf7ff');
        bgGrad.addColorStop(1, '#eedbff');
      } else {
        bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(1, '#f1f5f9');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Main Luxury Border Frame (The Decorated Border)
      const borderWidth = 35;
      const borderPadding = 15;
      
      // Outer primary color border
      ctx.lineWidth = borderWidth;
      if (activeStyle === 'classic-gold') ctx.strokeStyle = '#d4af37';
      else if (activeStyle === 'royal-emerald') ctx.strokeStyle = '#0f5132';
      else if (activeStyle === 'sunset-aurora') ctx.strokeStyle = '#4b0082';
      else ctx.strokeStyle = '#111827';
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

      // Inner thin border (double-frame style)
      ctx.lineWidth = 4;
      ctx.strokeStyle = activeStyle === 'classic-gold' ? '#8b6508' : activeStyle === 'royal-emerald' ? '#143f25' : activeStyle === 'sunset-aurora' ? '#310057' : '#475569';
      ctx.strokeRect(borderWidth + borderPadding, borderWidth + borderPadding, width - (borderWidth + borderPadding) * 2, height - (borderWidth + borderPadding) * 2);

      // Corner Stars / Decor
      const drawCornerDecor = (x: number, y: number) => {
        ctx.fillStyle = activeStyle === 'classic-gold' ? '#8b6508' : activeStyle === 'royal-emerald' ? '#198754' : activeStyle === 'sunset-aurora' ? '#6a0dad' : '#111827';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentConfig.cornerDecor, x, y);
      };

      const cornerOffset = borderWidth + borderPadding;
      drawCornerDecor(cornerOffset, cornerOffset);
      drawCornerDecor(width - cornerOffset, cornerOffset);
      drawCornerDecor(cornerOffset, height - cornerOffset);
      drawCornerDecor(width - cornerOffset, height - cornerOffset);

      // 3. Render Text & Calligraphy
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Course Title (Top)
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#aa8226' : activeStyle === 'royal-emerald' ? '#1b7348' : activeStyle === 'sunset-aurora' ? '#7e25b8' : '#64748b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(courseTitle, width / 2, 140);

      // Arabic Calligraphy Header / Separator
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#8b6508' : activeStyle === 'royal-emerald' ? '#0f5132' : activeStyle === 'sunset-aurora' ? '#4b0082' : '#0f172a';
      ctx.font = 'bold 45px serif';
      ctx.fillText('كِـتَـابُ الـدَّرْسِ الـسُّـلُـوكِـيّ', width / 2, 210);

      // Elegant Separator Line
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#d4af37' : activeStyle === 'royal-emerald' ? '#0f5132' : activeStyle === 'sunset-aurora' ? '#4b0082' : '#cbd5e1';
      ctx.fillText(currentConfig.decorator, width / 2, 275);

      // Lesson Title
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#3c2a13' : activeStyle === 'royal-emerald' ? '#113f2a' : activeStyle === 'sunset-aurora' ? '#34114d' : '#0f172a';
      ctx.font = 'black 38px sans-serif';
      ctx.fillText(lesson.title, width / 2, 350);

      // Lesson Duration Box
      const durationText = `⏱️ مسار التدريب: ${lesson.duration}`;
      ctx.font = 'bold 18px sans-serif';
      const textWidth = ctx.measureText(durationText).width;
      ctx.fillStyle = activeStyle === 'classic-gold' ? 'rgba(212, 175, 55, 0.15)' : activeStyle === 'royal-emerald' ? 'rgba(15, 81, 50, 0.1)' : activeStyle === 'sunset-aurora' ? 'rgba(75, 0, 130, 0.1)' : '#f8fafc';
      ctx.fillRect(width/2 - textWidth/2 - 20, 400, textWidth + 40, 42);
      ctx.strokeStyle = activeStyle === 'classic-gold' ? 'rgba(212, 175, 55, 0.3)' : activeStyle === 'royal-emerald' ? 'rgba(15, 81, 50, 0.2)' : 'rgba(75, 0, 130, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width/2 - textWidth/2 - 20, 400, textWidth + 40, 42);
      
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#8b6508' : activeStyle === 'royal-emerald' ? '#0f5132' : activeStyle === 'sunset-aurora' ? '#4b0082' : '#334155';
      ctx.fillText(durationText, width / 2, 421);

      // 4. Wrap & Draw Core Content
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const paragraphs = text.split('\n').filter(p => p.trim());
        let currentY = y;

        paragraphs.forEach(paragraph => {
          const words = paragraph.split(' ');
          let line = '';

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              context.fillText(line, x, currentY);
              line = words[n] + ' ';
              currentY += lineHeight;
            } else {
              line = testLine;
            }
          }
          context.fillText(line, x, currentY);
          currentY += lineHeight * 1.5; // Gap between paragraphs
        });
        
        return currentY;
      };

      // Wrap Lesson Content
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'right'; // RTL support
      const contentX = width - 120; // 120px padding from right
      const contentWidth = width - 240; // symmetrically spaced
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#5a4224' : activeStyle === 'royal-emerald' ? '#1a4e35' : activeStyle === 'sunset-aurora' ? '#471d66' : '#334155';
      
      // Preprocess text
      const cleanBodyText = cleanMarkdown(lesson.content).slice(0, 1000) + '...'; // Limit to avoid spill
      const endOfTextY = wrapText(ctx, cleanBodyText, contentX, 490, contentWidth, 38);

      // CBT Exercise Highlight Box (The Workbook Task)
      const exBoxY = Math.min(endOfTextY + 30, height - 370);
      const exBoxHeight = 180;
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#fdfcf7' : activeStyle === 'royal-emerald' ? '#f5faf8' : activeStyle === 'sunset-aurora' ? '#fbf8ff' : '#fafafa';
      ctx.fillRect(100, exBoxY, width - 200, exBoxHeight);
      ctx.strokeStyle = activeStyle === 'classic-gold' ? '#ebd79e' : activeStyle === 'royal-emerald' ? '#a2cfb6' : activeStyle === 'sunset-aurora' ? '#dab8fc' : '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, exBoxY, width - 200, exBoxHeight);

      // Ribbon inside box
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#aa8226' : activeStyle === 'royal-emerald' ? '#1b7348' : activeStyle === 'sunset-aurora' ? '#7e25b8' : '#0f172a';
      ctx.fillRect(width - 320, exBoxY + 1, 218, 36);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('✍️ كراسة التدريب النفسي', width - 211, exBoxY + 20);

      // Question text inside exercise
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'right';
      const cleanQuestion = lesson.exercise.question.slice(0, 100);
      wrapText(ctx, cleanQuestion, width - 130, exBoxY + 65, width - 260, 32);

      // Tip text
      ctx.font = 'italic 15px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`💡 إضاءة سلوكية: ${lesson.exercise.tip.slice(0, 95)}`, width - 130, exBoxY + 140);

      // 5. OFFICIAL ACADEMY FOOTER
      const footerY = height - 110;
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#aa8226' : activeStyle === 'royal-emerald' ? '#1b7348' : activeStyle === 'sunset-aurora' ? '#7e25b8' : '#64748b';
      ctx.fillText('✦ ══════════════ ✦ ══════════════ ✦', width / 2, footerY - 45);

      ctx.font = 'black 25px sans-serif';
      ctx.fillStyle = activeStyle === 'classic-gold' ? '#8b6508' : activeStyle === 'royal-emerald' ? '#0f5132' : activeStyle === 'sunset-aurora' ? '#4b0082' : '#0f172a';
      ctx.fillText('إحدى مبادرات أكاديمية باسم آل خليل الرقمية', width / 2, footerY);

      ctx.font = 'medium 14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('أكاديمية تعليمية متخصصة في العلوم السلوكية والعلاج النفسي الإدراكي الرقمي', width / 2, footerY + 38);

      // Convert Canvas to Image URL and Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `درس_${lesson.title.replace(/\s+/g, '_')}_باسم_آل_خليل.png`;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
    } catch (error) {
      console.error('Error generating image export:', error);
    } finally {
      setExporting(false);
    }
  };

  // Print Full-Content styled formatted lesson beautifully (Using standard browser printing)
  const handlePrint = () => {
    // Create an iframe to print the fully rendered content without dirtying the parent DOM
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) return;

    // Get active configurations
    const bgPatternCss = activeStyle === 'classic-gold' 
      ? `radial-gradient(circle, #fcfaf2 20%, transparent 20%)` 
      : activeStyle === 'royal-emerald' 
      ? `radial-gradient(circle, #e6f1ec 20%, transparent 20%)` 
      : activeStyle === 'sunset-aurora' 
      ? `radial-gradient(circle, #f5ebff 20%, transparent 20%)` 
      : 'none';

    const frameColor = currentConfig.accentColor;

    // Build the gorgeous printing document complete with decorators and footer
    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>تصدير درس: ${lesson.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
          
          body {
            font-family: 'Cairo', 'Amiri', serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .page-border {
            border: 24px solid ${frameColor};
            box-sizing: border-box;
            min-height: 98vh;
            margin: 1vh;
            padding: 40px;
            background-color: ${activeStyle === 'classic-gold' ? '#faf6eb' : activeStyle === 'royal-emerald' ? '#f0f7f4' : activeStyle === 'sunset-aurora' ? '#fcf8ff' : '#ffffff'};
            background-image: ${bgPatternCss};
            background-size: 24px 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }

          .corner-marker {
            position: absolute;
            width: 32px;
            height: 32px;
            background-color: ${frameColor};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            border-radius: 50%;
          }
          .top-right { top: -12px; right: -12px; }
          .top-left { top: -12px; left: -12px; }
          .bottom-right { bottom: -12px; right: -12px; }
          .bottom-left { bottom: -12px; left: -12px; }

          .header {
            text-align: center;
            margin-bottom: 30px;
          }

          .course-category {
            font-size: 14px;
            font-weight: bold;
            color: ${frameColor};
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }

          .main-title {
            font-family: 'Amiri', serif;
            font-size: 34px;
            font-weight: bold;
            color: ${frameColor};
            margin: 10px 0;
          }

          .decorator {
            font-size: 18px;
            color: ${frameColor};
            margin-bottom: 15px;
          }

          .lesson-title {
            font-size: 26px;
            font-weight: 900;
            color: #1e293b;
            margin: 5px 0 20px 0;
          }

          .duration-badge {
            display: inline-block;
            background-color: #ffffff;
            border: 1px solid ${frameColor}40;
            color: ${frameColor};
            font-size: 12px;
            font-weight: bold;
            padding: 8px 18px;
            border-radius: 12px;
            margin-bottom: 30px;
          }

          .content-area {
            font-size: 16px;
            line-height: 1.8;
            color: #334155;
            text-align: justify;
            margin-bottom: 40px;
            padding: 0 10px;
          }

          .content-area p {
            margin-bottom: 18px;
            text-indent: 15px;
          }

          .content-area strong {
            color: #000000;
            background-color: ${frameColor}10;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .exercise-card {
            background-color: #ffffff;
            border: 2px solid ${frameColor}30;
            border-radius: 20px;
            padding: 25px;
            margin-top: 30px;
            page-break-inside: avoid;
          }

          .exercise-badge {
            display: inline-block;
            background-color: ${frameColor};
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            padding: 5px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
          }

          .exercise-question {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 15px;
            line-height: 1.6;
          }

          .exercise-tip {
            font-size: 12px;
            color: #64748b;
            font-style: italic;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
          }

          .footer {
            text-align: center;
            border-top: 2px solid ${frameColor}20;
            padding-top: 25px;
            margin-top: 50px;
            page-break-inside: avoid;
          }

          .footer-divider {
            color: ${frameColor};
            font-size: 14px;
            margin-bottom: 12px;
          }

          .academy-brand {
            font-size: 20px;
            font-weight: 900;
            color: ${frameColor === '#1e293b' ? '#0f172a' : frameColor};
            margin-bottom: 5px;
          }

          .academy-sub {
            font-size: 11px;
            color: #94a3b8;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-border {
              min-height: 94vh;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-border">
          <!-- Corner decorations -->
          <div class="corner-marker top-right">${currentConfig.cornerDecor}</div>
          <div class="corner-marker top-left">${currentConfig.cornerDecor}</div>
          <div class="corner-marker bottom-right">${currentConfig.cornerDecor}</div>
          <div class="corner-marker bottom-left">${currentConfig.cornerDecor}</div>

          <div>
            <div class="header">
              <div class="course-category">${courseTitle}</div>
              <div class="main-title">مَنَاهِـجُ الأَكَـادِيـمِيَّـة السُّـلُـوكِـيَّـة</div>
              <div class="decorator">${currentConfig.decorator}</div>
              <div class="lesson-title">${lesson.title}</div>
              <div class="duration-badge">⏱️ مدة الجلسة التدريبية: ${lesson.duration}</div>
            </div>

            <div class="content-area">
              ${cleanMarkdown(lesson.content).split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}
            </div>

            <div class="exercise-card">
              <span class="exercise-badge">✍️ مادة التطبيق النفسي والكتابي</span>
              <div class="exercise-question">${lesson.exercise.question}</div>
              <div class="exercise-tip">💡 توجيه سلوكي وإدراك معتاد: ${lesson.exercise.tip}</div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-divider">✦ ══════════════ ✦ ══════════════ ✦</div>
            <div class="academy-brand">إحدى مبادرات أكاديمية باسم آل خليل الرقمية</div>
            <div class="academy-sub">الرائدة في تقديم البرمجيات السلوكية وحلول العلاج المعرفي الإدراكي التفاعلي المتقدم</div>
          </div>
        </div>
      </body>
      </html>
    `;

    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();

    // Trigger printing once loaded
    printFrame.contentWindow?.focus();
    setTimeout(() => {
      printFrame.contentWindow?.print();
      // Clean up after print window opens
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl" id="lesson-exporter-modal">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window Container */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col md:flex-row h-[90vh] md:h-[80vh]"
          >
            
            {/* Left/Main Workspace Area: Interactive Design Live Preview */}
            <div className="flex-1 p-6 bg-slate-50 flex flex-col overflow-y-auto border-l border-slate-100">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  معاينة مباشرة للإطار المختار وزخرفته
                </span>
                
                {/* Mobile close button */}
                <button 
                  onClick={onClose}
                  className="md:hidden p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Preview Card */}
              <div 
                ref={previewRef}
                className={`flex-1 rounded-2xl p-6 md:p-8 transition-all duration-500 overflow-y-auto shadow-inner relative flex flex-col justify-between ${currentConfig.containerClass}`}
                style={{ backgroundImage: currentConfig.bgPattern, backgroundSize: '16px 16px' }}
                id="live-export-preview"
              >
                {/* Corner Markers */}
                <div className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center font-bold text-[10px] text-white rounded-full bg-[${currentConfig.accentColor}]`}>
                  {currentConfig.cornerDecor}
                </div>
                <div className={`absolute top-1 left-1 w-5 h-5 flex items-center justify-center font-bold text-[10px] text-white rounded-full bg-[${currentConfig.accentColor}]`}>
                  {currentConfig.cornerDecor}
                </div>
                <div className={`absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center font-bold text-[10px] text-white rounded-full bg-[${currentConfig.accentColor}]`}>
                  {currentConfig.cornerDecor}
                </div>
                <div className={`absolute bottom-1 left-1 w-5 h-5 flex items-center justify-center font-bold text-[10px] text-white rounded-full bg-[${currentConfig.accentColor}]`}>
                  {currentConfig.cornerDecor}
                </div>

                <div>
                  {/* Top Category Label */}
                  <div className="text-center mb-4">
                    <span className="text-[10px] font-bold tracking-widest opacity-80 uppercase block">
                      {courseTitle}
                    </span>
                    <h4 className="font-extrabold text-[15px] mt-1 tracking-wider opacity-90">
                      مَنَاهِجُ الأَكَادِيمِيَّة السُّلوكيَّة
                    </h4>
                    <span className="text-[10px] block mt-1 opacity-75">{currentConfig.decorator}</span>
                  </div>

                  {/* Title & Badge */}
                  <div className="border-b border-dashed pb-4 mb-4 border-slate-300/40 text-center">
                    <h2 className={`text-xl md:text-2xl font-black ${currentConfig.headerClass}`}>
                      {lesson.title}
                    </h2>
                    <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full border mt-2.5 ${currentConfig.badgeClass}`}>
                      ⏱️ مدة الجلسة: {lesson.duration}
                    </span>
                  </div>

                  {/* Body Content Preview */}
                  <div className="text-xs md:text-sm leading-relaxed text-justify space-y-3 opacity-90 max-h-[160px] overflow-y-auto pr-1">
                    {cleanMarkdown(lesson.content).split('\n').filter(p => p.trim()).map((p, idx) => (
                      <p key={idx} className="indent-4">{p}</p>
                    ))}
                  </div>

                  {/* Exercise Preview Panel */}
                  <div className="mt-5 bg-white/70 border border-slate-200/50 p-4 rounded-xl space-y-2">
                    <span className="text-[9.5px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      ✍️ مادة التطبيق النفسي والكتابي
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 leading-relaxed">
                      {lesson.exercise.question}
                    </p>
                    <p className="text-[9.5px] text-slate-500 italic border-t border-slate-100 pt-1.5">
                      💡 توجيه: {lesson.exercise.tip}
                    </p>
                  </div>
                </div>

                {/* Bottom Academy Footer (Matches the requested exact text) */}
                <div className={`mt-6 pt-4 border-t text-center ${currentConfig.footerClass}`}>
                  <span className="text-[9px] block opacity-50 mb-1.5">✦ ══════════════ ✦</span>
                  <h3 className="text-sm font-black tracking-tight flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>إحدى مبادرات أكاديمية باسم آل خليل الرقمية</span>
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-1">
                    أكاديمية سلوكية رقمية رائدة في تدشين برمجيات العلاج المعرفي الإدراكي والتمكين الشخصي
                  </p>
                </div>

              </div>
            </div>

            {/* Right Panel: Settings, Theme Selector & Actions */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between shrink-0 bg-white">
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                      <span>تصدير الدرس الأنيق</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      صمّم درسك السلوكي وزيّنه بإطارات فاخرة من أجل الحفظ أو الطباعة المعتمدة.
                    </p>
                  </div>
                  
                  {/* Desktop close button */}
                  <button 
                    onClick={onClose}
                    className="hidden md:block p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Decorative Frame Preset Pickers */}
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    اختر نمط الإطار والزخرفة الملونة:
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {(Object.keys(stylesConfig) as FrameStyle[]).map((styleKey) => {
                      const style = stylesConfig[styleKey];
                      const isSelected = activeStyle === styleKey;
                      
                      return (
                        <button
                          key={styleKey}
                          onClick={() => {
                            setActiveStyle(styleKey);
                            setExportSuccess(false);
                          }}
                          className={`w-full text-right p-3 rounded-2xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-slate-800 bg-slate-900 text-white font-black shadow-md' 
                              : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-5 h-5 rounded-full border border-white/20"
                              style={{ 
                                backgroundColor: style.accentColor,
                                boxShadow: isSelected ? '0 0 0 2px rgba(0,0,0,0.1)' : 'none'
                              }}
                            />
                            <span>{style.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="bg-emerald-50/75 border border-emerald-100 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-950">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>دليل المبادرة المعتمدة:</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-semibold leading-relaxed">
                    يتم تصدير الدروس متذيلةً باسم <strong className="font-extrabold">أكاديمية باسم آل خليل الرقمية</strong> كجهة إصدار وتأهيل علمي معتمد لمسارات التدريب السلوكي.
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-slate-100 mt-6 shrink-0">
                
                {/* Download Image Button */}
                <button
                  onClick={handleSaveAsImage}
                  disabled={exporting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'جاري تجميع وحفظ الصورة...' : 'حفظ كبطاقة صورة عالية الدقة'}</span>
                </button>

                {/* Print PDF Button */}
                <button
                  onClick={handlePrint}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200/50 active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة أو حفظ كامل الدرس كـ PDF</span>
                </button>

                {/* Success Feedback banner */}
                <AnimatePresence>
                  {exportSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-emerald-500 text-white p-3 rounded-xl text-[10.5px] text-center font-black"
                    >
                      🎉 تم تصدير الدرس وتحميل الصورة بنجاح!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
