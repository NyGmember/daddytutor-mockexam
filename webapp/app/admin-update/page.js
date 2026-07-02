'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ShieldAlert, Loader2, ArrowLeft, RefreshCw, CheckCircle, Terminal } from 'lucide-react';
import Link from 'next/link';
import AdminSecurityWrapper from '@/components/AdminSecurityWrapper';

function AdminUpdateContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSync = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setLogs(['กำลังเริ่มต้นกระบวนการซิงค์...']);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // session cookie validates on backend
      });

      const data = await res.json();
      if (data.processLogs) {
        setLogs(data.processLogs);
      }

      if (res.ok && data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดขณะดำเนินการซิงค์');
      }
    } catch (err) {
      console.error('Error syncing:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setLogs(prev => [...prev, 'ข้อผิดพลาด: การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-2xl mx-auto flex flex-col gap-6 bg-[#FAF7F0]">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <Link href="/" className="cartoon-btn py-1 px-3 text-xs gap-1 bg-white">
          <ArrowLeft size={14} />
          กลับหน้าหลัก
        </Link>
        <Link href="/admin" className="cartoon-btn py-1 px-3 text-xs gap-1 bg-[#FAF7F0] border-2">
          หน้าแดชบอร์ดแอดมิน
        </Link>
      </div>

      {/* Header card */}
      <header className="cartoon-card p-6 bg-white flex items-center gap-4 border-4">
        <div className="bg-[#E27B58] text-white p-3 rounded-full border-2 border-black">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black">จัดการและอัปเดตข้อสอบ</h1>
          <p className="text-xs text-muted">ดึงเวอร์ชันแพตช์ล่าสุดจาก GitHub และดาวน์โหลดรูปภาพเข้ามาในฐานข้อมูล</p>
        </div>
      </header>

      {/* Sync Action Area */}
      <div className="cartoon-card p-6 bg-white flex flex-col gap-4 border-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-black text-base text-[#2D2D2D]">อัปเดตฐานข้อมูลผ่าน GitHub / local</h3>
          <p className="text-xs text-gray-500 font-bold">
            ระบบจะตรวจสอบรุ่นแพตช์จาก <code>version.json</code> และดาวน์โหลดแพตช์ที่ยังไม่เคยนำเข้าโดยอัตโนมัติ
          </p>
        </div>

        {errorMsg && (
          <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-4 font-bold text-sm text-center border-2">
            {errorMsg}
          </div>
        )}

        {result && (
          <div className="cartoon-card bg-green-50 border-green-500 text-green-950 p-4 flex flex-col gap-2 border-2">
            <div className="flex items-center gap-2 font-bold text-green-700">
              <CheckCircle size={18} />
              <span>อัปเดตสำเร็จ!</span>
            </div>
            <p className="text-sm">{result.message}</p>
            {result.importedCount > 0 && (
              <p className="text-xs font-black text-green-700">
                นำเข้าข้อสอบเข้าสู่ฐานข้อมูลได้ทั้งหมด {result.importedCount} ข้อ
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={loading}
          className="cartoon-btn cartoon-btn-primary py-3 text-base font-black justify-center gap-2 border-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              กำลังดำเนินการอัปเดต...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              เริ่มดาวน์โหลดและอัปเดตข้อสอบ
            </>
          )}
        </button>
      </div>

      {/* Terminal logs block */}
      {(logs.length > 0 || loading) && (
        <div className="cartoon-card p-4 bg-black text-[#4AF626] font-mono text-xs flex flex-col gap-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 border-b border-[#333] pb-2 font-bold text-gray-400">
            <Terminal size={14} />
            <span>TERMINAL PROCESS LOGS</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-gray-800 pr-1">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log.startsWith('ความล้มเหลว:') || log.startsWith('ข้อผิดพลาด:') ? (
                  <span className="text-red-500">{log}</span>
                ) : log.startsWith('คำเตือน:') ? (
                  <span className="text-yellow-500">{log}</span>
                ) : log.startsWith('Successfully') || log.startsWith('สำเร็จ') || log.startsWith('นำเข้าคำถามสำเร็จ:') ? (
                  <span className="text-green-400">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-gray-400 animate-pulse">
                <span>&gt; กำลังประมวลผลขั้นตอนต่อไป...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <footer className="text-center text-xs text-[#8E8E8E] leading-relaxed">
        ระบบจะทำการตรวจสอบรายการเวอร์ชันในไฟล์ <code>version.json</code> บนคลัง GitHub 
        และอัปเดตข้ามเฉพาะตัวที่ยังไม่เคยติดตั้ง เพื่อให้ฐานข้อมูลเป็นระเบียบและไม่เกิดการเขียนข้อมูลซ้ำซ้อน
      </footer>
    </main>
  );
}

export default function AdminUpdatePage() {
  return (
    <AdminSecurityWrapper>
      <AdminUpdateContent />
    </AdminSecurityWrapper>
  );
}
