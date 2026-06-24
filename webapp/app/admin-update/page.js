'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ShieldAlert, Loader2, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminUpdatePage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSync = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('กรุณากรอกรหัสผ่านผู้ดูแลระบบ');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'การเชื่อมต่อขัดข้อง หรือ รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Error syncing:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-xl mx-auto flex flex-col gap-6">
      {/* Back Button */}
      <div>
        <Link href="/" className="cartoon-btn py-1 px-3 text-xs gap-1">
          <ArrowLeft size={14} />
          กลับหน้าหลัก
        </Link>
      </div>

      {/* Header card */}
      <header className="cartoon-card p-6 bg-white flex items-center gap-4">
        <div className="bg-[#E27B58] text-white p-3 rounded-full border-2 border-black">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black">จัดการและอัปเดตข้อสอบ</h1>
          <p className="text-xs text-muted">ดึงเวอร์ชันแพตช์ล่าสุดจาก GitHub และดาวน์โหลดรูปภาพเข้ามาในฐานข้อมูล</p>
        </div>
      </header>

      {/* Sync Form */}
      <div className="cartoon-card p-6 bg-white flex flex-col gap-4">
        <form onSubmit={handleSync} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm flex items-center gap-1">
              <ShieldAlert size={16} />
              รหัสผ่านแอดมิน (ตั้งค่าผ่าน ADMIN_PASSWORD)
            </label>
            <input
              type="password"
              placeholder="กรอกรหัสผ่านเพื่อดำเนินการ..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="cartoon-input text-base"
            />
          </div>

          {errorMsg && (
            <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-4 font-bold text-sm text-center">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="cartoon-card bg-green-50 border-green-500 text-green-950 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-green-700">
                <CheckCircle size={18} />
                <span>สำเร็จ!</span>
              </div>
              <p className="text-sm">{result.message}</p>
              {result.importedCount > 0 && (
                <p className="text-xs font-bold text-muted">
                  นำเข้าข้อสอบเข้าสู่ฐานข้อมูลได้ทั้งหมด {result.importedCount} ข้อ
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cartoon-btn cartoon-btn-primary py-2 text-base font-bold justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                กำลังประสานงานและดึงข้อมูลจาก GitHub...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                เริ่มดาวน์โหลดอัปเดตข้อสอบ
              </>
            )}
          </button>
        </form>
      </div>

      {/* Safety Notice */}
      <footer className="text-center text-xs text-[#8E8E8E] leading-relaxed">
        ระบบจะทำการตรวจสอบรายการเวอร์ชันในไฟล์ <code>version.json</code> บนคลัง GitHub 
        และอัปเดตข้ามเฉพาะตัวที่ยังไม่เคยติดตั้ง เพื่อให้ฐานข้อมูลเป็นระเบียบและไม่เกิดการเขียนข้อมูลซ้ำซ้อน
      </footer>
    </main>
  );
}
