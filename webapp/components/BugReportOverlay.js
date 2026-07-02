'use client';

import { useState, useEffect } from 'react';
import { Bug, X, Send, Loader2, CheckCircle2, Info } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function BugReportOverlay() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [patchVersion, setPatchVersion] = useState('กำลังโหลด...');
  const [errorDescription, setErrorDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Exam-specific metadata (read from sessionStorage)
  const [examMeta, setExamMeta] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState(null);

  // Load patch version and exam meta
  useEffect(() => {
    async function loadVersion() {
      try {
        const res = await fetch('/api/exam/latest-version');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPatchVersion(data.version);
          }
        }
      } catch (err) {
        console.error('Error fetching version:', err);
      }
    }
    loadVersion();
  }, []);

  // Update exam metadata when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Read general exam metadata
    const metaStr = sessionStorage.getItem('current_exam_meta');
    if (metaStr) {
      try {
        setExamMeta(JSON.parse(metaStr));
      } catch (e) {
        console.error(e);
      }
    } else {
      setExamMeta(null);
    }

    // Read current question ID if on exam page
    if (pathname === '/exam') {
      const qListStr = sessionStorage.getItem('current_exam');
      const idxStr = sessionStorage.getItem('current_exam_index');
      if (qListStr && idxStr !== null) {
        try {
          const qList = JSON.parse(qListStr);
          const idx = parseInt(idxStr);
          if (qList[idx]) {
            setCurrentQuestionId(qList[idx].id);
            setCurrentQuestionNum(idx + 1);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      setCurrentQuestionId(null);
      setCurrentQuestionNum(null);
    }
  }, [isOpen, pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!errorDescription.trim()) {
      setErrorMsg('กรุณากรอกรายละเอียดปัญหา');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        host: window.location.host,
        appVersion: '1.0.0', // Standard static app version
        patchVersion: patchVersion,
        userAgent: navigator.userAgent,
        currentPage: pathname,
        errorDescription: errorDescription,
        filterSettings: examMeta ? examMeta : null,
        currentExamName: examMeta?.selectedPaperName || (pathname === '/exam' ? 'ข้อสอบแบบกำหนดเอง' : null)
      };

      // Add active question ID to current exam info if applicable
      if (currentQuestionId) {
        payload.currentExamName = `${payload.currentExamName || 'ข้อสอบ'} - ข้อ ${currentQuestionNum} (ID: ${currentQuestionId})`;
      }

      const res = await fetch('/api/bugs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setErrorDescription('');
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 2000);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการส่งรายงาน');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Bug FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-[#D9534F] text-white p-3.5 rounded-full border-4 border-black hover:bg-[#c9302c] active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-1.5 font-black text-sm"
        title="รายงานปัญหาการใช้งาน"
      >
        <Bug size={20} />
        <span className="hidden md:inline">รายงานปัญหา</span>
      </button>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="cartoon-card max-w-lg w-full bg-white p-6 flex flex-col gap-4 border-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#D9534F] text-white p-1.5 rounded-lg border-2 border-black">
                  <Bug size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#2D2D2D]">รายงานข้อผิดพลาด</h3>
                  <p className="text-[10px] text-gray-500 font-bold">แจ้งปัญหาเพื่อปรับปรุงระบบให้ดียิ่งขึ้น</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="cartoon-btn p-1 bg-white hover:bg-gray-100 border-2"
              >
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <CheckCircle2 size={48} className="text-green-500 animate-bounce" />
                <h4 className="font-black text-lg text-green-700">ส่งรายงานเรียบร้อยแล้ว!</h4>
                <p className="text-sm font-bold text-gray-600">ขอบคุณสำหรับข้อมูล ทีมงานจะรีบนำไปปรับปรุงแก้ไขโดยเร็วที่สุด</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Meta details list */}
                <div className="bg-[#FAF7F0] p-3 rounded-lg border-2 border-dashed border-[#ccc] text-[11px] font-bold text-[#5E5E5E] flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="text-[#2D2D2D]">{window.location.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>หน้าปัจจุบัน:</span>
                    <span className="text-[#2D2D2D]">{pathname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เวอร์ชันระบบ / แพตช์:</span>
                    <span className="text-[#2D2D2D]">1.0.0 / {patchVersion}</span>
                  </div>
                  {examMeta && (
                    <div className="mt-1 pt-1 border-t border-dashed border-[#ccc] flex flex-col gap-0.5">
                      <div className="flex justify-between text-[#E27B58]">
                        <span>การตั้งค่าข้อสอบล่าสุด:</span>
                        <span>
                          {examMeta.examSet !== 'ทั้งหมด' ? examMeta.examSet : ''} {examMeta.subjectId === 'mathematics' ? 'คณิต' : 'วิทย์'} (ปี {examMeta.year})
                        </span>
                      </div>
                      {examMeta.selectedPaperName && (
                        <div className="flex justify-between text-[#E27B58]">
                          <span>ชื่อชุดข้อสอบ:</span>
                          <span>{examMeta.selectedPaperName}</span>
                        </div>
                      )}
                      {currentQuestionId && (
                        <div className="flex justify-between text-[#E27B58]">
                          <span>ข้อที่กำลังทำ:</span>
                          <span>ข้อ {currentQuestionNum} (ID: {currentQuestionId})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bug Description text area */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-black text-sm text-[#2D2D2D] flex items-center gap-1">
                    <Info size={16} className="text-[#E27B58]" />
                    อธิบายข้อผิดพลาดที่พบ
                  </label>
                  <textarea
                    rows={4}
                    placeholder="กรุณาพิมพ์รายละเอียดความผิดพลาด เช่น 'เฉลยข้อ 5 ไม่ถูกต้องคำตอบควรเป็น 3' หรือ 'รูปภาพข้อ 10 ไม่แสดง'..."
                    value={errorDescription}
                    onChange={(e) => setErrorDescription(e.target.value)}
                    disabled={submitting}
                    className="cartoon-input w-full bg-white text-sm"
                  />
                </div>

                {errorMsg && (
                  <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-3 font-bold text-xs text-center border-2">
                    {errorMsg}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t-2 border-[#eee] pt-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={submitting}
                    className="cartoon-btn px-4 py-2 text-sm font-bold bg-white"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cartoon-btn cartoon-btn-primary px-4 py-2 text-sm font-black flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        ส่งรายงาน
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
