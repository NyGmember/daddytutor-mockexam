'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import { 
  ArrowLeft, ArrowRight, Home, Eye, EyeOff, Play, Pause, RotateCcw, 
  Clock, Timer, Minimize2, Maximize2, AlertCircle 
} from 'lucide-react';

export default function ExamPage() {
  const router = useRouter();
  
  // Exam state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  
  // Timer state
  const [showTimer, setShowTimer] = useState(true);
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' or 'countdown'
  const [timerActive, setTimerActive] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [countdownMinutes, setCountdownMinutes] = useState(10); // default countdown minutes
  
  // Refs
  const intervalRef = useRef(null);

  // Load questions from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('current_exam');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQuestions(parsed);
      } catch (err) {
        console.error('Error parsing stored exam:', err);
      }
    }
  }, []);

  // Timer interval control
  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (timerMode === 'countdown') {
            if (prev <= 1) {
              setTimerActive(false);
              // Sound alert (using Web Audio API so no audio assets needed!)
              playBeepAlert();
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, timerMode]);

  // Audio alert using native Web Audio API
  const playBeepAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      
      oscillator.start();
      
      // Stop beep after 0.5s
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 500);
    } catch (e) {
      console.warn('Audio play blocked or unsupported:', e);
    }
  };

  // Switch timer mode
  const handleSwitchMode = (mode) => {
    setTimerActive(false);
    setTimerMode(mode);
    if (mode === 'countdown') {
      setTime(countdownMinutes * 60);
    } else {
      setTime(0);
    }
  };

  // Reset timer
  const handleResetTimer = () => {
    setTimerActive(false);
    if (timerMode === 'countdown') {
      setTime(countdownMinutes * 60);
    } else {
      setTime(0);
    }
  };

  // Apply new countdown minutes
  const handleApplyCountdown = (mins) => {
    const validated = Math.max(1, parseInt(mins) || 1);
    setCountdownMinutes(validated);
    if (timerMode === 'countdown') {
      setTimerActive(false);
      setTime(validated * 60);
    }
  };

  // Format time display (HH:MM:SS)
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="cartoon-card p-8 max-w-md w-full text-center flex flex-col gap-4 bg-white">
          <AlertCircle size={48} className="mx-auto text-[#E27B58]" />
          <h2 className="text-xl font-bold">ไม่พบชุดข้อสอบ</h2>
          <p className="text-muted text-sm">
            กรุณาไปที่หน้าหลักเพื่อเลือกวิชาและสร้างชุดข้อสอบจำลอง
          </p>
          <button onClick={() => router.push('/')} className="cartoon-btn cartoon-btn-primary gap-2 justify-center">
            <Home size={16} />
            กลับหน้าหลัก
          </button>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const renderedQuestionHtml = renderMarkdown(currentQuestion.questionText);
  const renderedAnswerHtml = renderMarkdown(currentQuestion.answerText);

  return (
    <main className="min-h-screen py-6 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-6 relative pb-48">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center bg-[#FAF7F0] p-2 border-b-2 border-dashed border-[#ccc]">
        <button onClick={() => router.push('/')} className="cartoon-btn py-1 px-3 text-xs gap-1">
          <Home size={14} />
          หน้าหลัก
        </button>
        <span className="font-bold text-sm bg-white border-2 border-black rounded px-3 py-1">
          ข้อที่ {currentIndex + 1} / {questions.length} (ปี {currentQuestion.year})
        </span>
        <span className="text-xs font-bold text-[#E27B58] bg-[#FFF4E5] border-2 border-[#E27B58] rounded px-3 py-1">
          {currentQuestion.topic?.nameTh || 'ไม่ระบุหัวข้อ'} • ความยาก: {'⭐'.repeat(currentQuestion.difficulty)}
        </span>
      </nav>

      {/* Main Question Sheet */}
      <article className="cartoon-card p-6 md:p-8 bg-white min-h-[350px] relative overflow-hidden flex flex-col justify-between">
        {/* Decorative Grid Lines to look like paper notebook */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(#000_1px,transparent_1px)] bg-[size:100%_2rem]" />
        
        {/* Question Text */}
        <div 
          className="question-body text-base md:text-lg prose max-w-none z-10"
          dangerouslySetInnerHTML={{ __html: renderedQuestionHtml }}
        />
        
        {/* Action button inside card */}
        <div className="flex justify-end mt-8 border-t-2 border-dashed border-[#eee] pt-4">
          <button 
            type="button"
            onClick={() => setShowSolution(!showSolution)}
            className={`cartoon-btn gap-2 ${showSolution ? '' : 'cartoon-btn-primary'}`}
          >
            {showSolution ? <EyeOff size={18} /> : <Eye size={18} />}
            {showSolution ? 'ซ่อนเฉลยวิธีทำ' : 'ดูเฉลยวิธีทำ'}
          </button>
        </div>
      </article>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1);
              setShowSolution(false);
            }
          }}
          disabled={currentIndex === 0}
          className="cartoon-btn gap-2 flex-1 justify-center py-3 text-base"
        >
          <ArrowLeft size={18} />
          ข้อก่อนหน้า
        </button>
        
        <button
          onClick={() => {
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setShowSolution(false);
            }
          }}
          disabled={currentIndex === questions.length - 1}
          className="cartoon-btn gap-2 flex-1 justify-center py-3 text-base"
        >
          ข้อถัดไป
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Floating Timer Widget */}
      {showTimer ? (
        <div className="fixed bottom-4 right-4 z-50 cartoon-card p-4 bg-white max-w-xs shadow-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center border-b-2 border-dashed pb-2">
            <span className="font-bold text-sm flex items-center gap-1">
              <Clock size={16} />
              จับเวลาการสอบ
            </span>
            <button 
              onClick={() => setShowTimer(false)}
              className="bg-transparent border-0 cursor-pointer text-muted hover:text-red-500"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSwitchMode('stopwatch')}
              className={`cartoon-btn py-1 px-2 text-xs justify-center ${timerMode === 'stopwatch' ? 'cartoon-btn-primary' : ''}`}
            >
              เดินหน้า
            </button>
            <button
              onClick={() => handleSwitchMode('countdown')}
              className={`cartoon-btn py-1 px-2 text-xs justify-center ${timerMode === 'countdown' ? 'cartoon-btn-primary' : ''}`}
            >
              นับถอยหลัง
            </button>
          </div>

          {/* Timer Display */}
          <div className={`text-center font-mono text-3xl font-black py-2 tracking-wider ${timerMode === 'countdown' && time < 60 && time > 0 ? 'text-red-500 animate-pulse' : ''}`}>
            {formatTime(time)}
          </div>

          {/* Countdown customization config */}
          {timerMode === 'countdown' && (
            <div className="flex items-center gap-1 text-xs justify-center">
              <span>ตั้งเวลา:</span>
              <input
                type="number"
                min={1}
                max={180}
                value={countdownMinutes}
                onChange={(e) => handleApplyCountdown(e.target.value)}
                disabled={timerActive}
                className="w-12 text-center border-2 border-black rounded font-bold"
              />
              <span>นาที</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimerActive(!timerActive)}
              className="cartoon-btn py-1 flex-1 justify-center gap-1 text-xs cartoon-btn-primary"
            >
              {timerActive ? <Pause size={14} /> : <Play size={14} />}
              {timerActive ? 'หยุด' : 'เริ่ม'}
            </button>
            <button
              onClick={handleResetTimer}
              className="cartoon-btn py-1 justify-center text-xs"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowTimer(true)}
          className="fixed bottom-4 right-4 z-50 cartoon-btn cartoon-btn-primary p-3 rounded-full shadow-2xl"
        >
          <Timer size={24} />
        </button>
      )}

      {/* Solution Slide-up Drawer */}
      {showSolution && (
        <section className="fixed inset-x-0 bottom-0 z-40 bg-white border-t-4 border-[#2D2D2D] max-h-[70vh] overflow-y-auto p-6 shadow-inner animate-slide-up">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#ccc] pb-2">
              <h2 className="text-xl font-black text-[#E27B58] flex items-center gap-2">
                <Eye size={22} />
                คำอธิบายและเฉลยวิธีทำ
              </h2>
              <button 
                onClick={() => setShowSolution(false)}
                className="cartoon-btn py-1 px-3 text-xs"
              >
                ปิดเฉลย
              </button>
            </div>
            
            {/* Correct Option Display */}
            {currentQuestion.correctAnswer && (
              <div className="cartoon-card border-green-600 bg-green-50 text-green-950 p-4 font-bold text-lg inline-flex items-center gap-2 max-w-sm">
                <span>🎯 คำตอบที่ถูกต้องคือ:</span>
                <span className="bg-[#E27B58] text-white px-3 py-1 rounded-full text-xl border-2 border-black shadow">
                  ตัวเลือก {currentQuestion.correctAnswer}
                </span>
              </div>
            )}

            {/* Detailed Explanation rendering */}
            <div 
              className="prose max-w-none text-base md:text-lg z-10 font-sans"
              dangerouslySetInnerHTML={{ __html: renderedAnswerHtml }}
            />
          </div>
        </section>
      )}

      {/* Simple Custom CSS for Drawer animation */}
      <style jsx global>{`
        .math-block {
          overflow-x: auto;
          margin: 1.5rem 0;
          padding: 1rem;
          background-color: #f7f6f0;
          border-left: 4px solid var(--accent-color);
          border-radius: 4px;
        }
        .image-wrapper {
          text-align: center;
          margin: 1.5rem 0;
        }
        .cartoon-img {
          max-width: 100%;
          height: auto;
          border: 3px solid #2D2D2D;
          border-radius: 8px;
          box-shadow: 4px 4px 0px #2D2D2D;
        }
        .cartoon-hr {
          border: none;
          border-top: 3px dashed #2D2D2D;
          margin: 1.5rem 0;
        }
        .cartoon-list, .cartoon-list-ordered {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .cartoon-list li, .cartoon-list-ordered li {
          margin-bottom: 0.5rem;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        p {
          margin-bottom: 0.8rem;
        }
      `}</style>
    </main>
  );
}
