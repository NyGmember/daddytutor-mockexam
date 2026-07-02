'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bug, Settings, Wrench, RefreshCw, Loader2, Trash2, CheckCircle2, AlertOctagon } from 'lucide-react';
import AdminSecurityWrapper from '@/components/AdminSecurityWrapper';

function BugReportDashboard() {
  const [bugs, setBugs] = useState([]);
  const [filterTag, setFilterTag] = useState('ทั้งหมด');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBugs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = `/api/bugs/list${filterTag !== 'ทั้งหมด' ? `?tag=${filterTag}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBugs(data.bugReports);
        }
      } else {
        setErrorMsg('ไม่สามารถดึงข้อมูลรายงานได้');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดขณะดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [filterTag]);

  const handleUpdateStatus = async (id, newTag) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/bugs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tag: newTag })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update locally
          setBugs(prev => prev.map(b => b.id === id ? { ...b, tag: newTag } : b));
        }
      } else {
        alert('อัปเดตสถานะล้มเหลว');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setUpdatingId(null);
    }
  };

  const getTagStyle = (tag) => {
    switch (tag) {
      case 'new issue':
        return 'bg-[#FFF4E5] text-amber-800 border-amber-500';
      case 'Dismiss':
        return 'bg-gray-100 text-gray-700 border-gray-400';
      case 'Resolve':
        return 'bg-green-50 text-green-800 border-green-500';
      default:
        return 'bg-white text-black border-black';
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-6xl mx-auto flex flex-col gap-6 bg-[#FAF7F0]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center">
        <Link href="/" className="cartoon-btn py-1 px-3 text-xs gap-1 bg-white">
          <ArrowLeft size={14} />
          กลับหน้าหลัก
        </Link>
        <div className="flex gap-2">
          <Link href="/admin-update" className="cartoon-btn py-1 px-3 text-xs gap-1.5 bg-[#E27B58] text-white">
            <RefreshCw size={14} />
            หน้าอัปเดตข้อสอบ
          </Link>
          {process.env.NODE_ENV !== 'production' && (
            <Link href="/local-editor" className="cartoon-btn py-1 px-3 text-xs gap-1.5 bg-blue-500 text-white">
              <Wrench size={14} />
              เครื่องมือเขียนโจทย์
            </Link>
          )}
        </div>
      </div>

      {/* Header Card */}
      <header className="cartoon-card p-6 bg-white flex items-center gap-4 border-4">
        <div className="bg-[#D9534F] text-white p-3.5 rounded-full border-2 border-black">
          <Bug size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-black">ระบบจัดการรายงานข้อผิดพลาด (Bug Reports)</h1>
          <p className="text-xs text-muted">ตรวจสอบ วิเคราะห์ และอัปเดตสถานะของปัญหาที่ได้รับแจ้งจากผู้เรียน</p>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border-4 border-black">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#2D2D2D]">ตัวกรองสถานะ:</span>
          <div className="flex flex-wrap gap-2">
            {['ทั้งหมด', 'new issue', 'Dismiss', 'Resolve'].map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`cartoon-btn py-1 px-3 text-xs font-black border-2 ${
                  filterTag === tag ? 'cartoon-btn-primary' : 'bg-white'
                }`}
              >
                {tag === 'new issue' ? '⚠️ new issue' : tag === 'Dismiss' ? '🔇 Dismiss' : tag === 'Resolve' ? '✅ Resolve' : tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchBugs}
          disabled={loading}
          className="cartoon-btn py-1.5 px-4 text-xs font-bold bg-[#F0EDE6] border-2 self-end md:self-auto"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : 'รีเฟรชข้อมูล'}
        </button>
      </div>

      {/* Bug Reports Container */}
      {errorMsg && (
        <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-6 text-center font-bold">
          {errorMsg}
        </div>
      )}

      {loading && bugs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 font-bold text-[#5E5E5E]">
          <Loader2 className="animate-spin text-[#E27B58]" size={36} />
          <span>กำลังดาวน์โหลดรายงาน...</span>
        </div>
      ) : bugs.length === 0 ? (
        <div className="cartoon-card bg-[#F9F9F9] p-12 text-center text-gray-500 font-bold border-4 border-dashed border-[#ccc]">
          <CheckCircle2 className="mx-auto text-green-500 mb-3" size={40} />
          <h3 className="text-lg font-black text-[#2D2D2D]">ยินดีด้วย! ไม่พบปัญหาที่ค้างอยู่</h3>
          <p className="text-xs text-muted mt-1">รายงานทั้งหมดเสร็จสิ้นหรือไม่มีการส่งข้อมูลในตัวกรองนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              className="cartoon-card p-5 md:p-6 bg-white border-4 flex flex-col gap-4 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all"
            >
              {/* Bug Item Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b-2 border-dashed border-[#eee] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-black border-2 rounded-lg ${getTagStyle(bug.tag)}`}>
                    {bug.tag === 'new issue' ? '⚠️ new issue' : bug.tag === 'Dismiss' ? '🔇 Dismiss' : '✅ Resolve'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-bold">
                    ID: {bug.id.substring(0, 8)}...
                  </span>
                  <span className="text-[11px] text-gray-500 font-bold">
                    {new Date(bug.createdAt).toLocaleString('th-TH')}
                  </span>
                </div>
                {/* Actions status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">เปลี่ยนสถานะ:</span>
                  <select
                    value={bug.tag}
                    onChange={(e) => handleUpdateStatus(bug.id, e.target.value)}
                    disabled={updatingId === bug.id}
                    className="cartoon-input py-1 px-2.5 text-xs font-bold bg-[#FAF7F0] border-2"
                  >
                    <option value="new issue">new issue</option>
                    <option value="Dismiss">Dismiss</option>
                    <option value="Resolve">Resolve</option>
                  </select>
                  {updatingId === bug.id && <Loader2 className="animate-spin text-[#E27B58]" size={14} />}
                </div>
              </div>

              {/* Bug Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#E27B58]">รายละเอียดความผิดพลาด:</span>
                <div className="text-sm md:text-base font-black text-[#2D2D2D] bg-[#FFF4F2] p-4 rounded-xl border-2 border-[#E27B58]/30 leading-relaxed whitespace-pre-wrap">
                  {bug.errorDescription}
                </div>
              </div>

              {/* Bug Metadata Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF7F0] p-4 rounded-xl border-2 border-dashed border-[#ccc] text-xs font-bold text-[#5E5E5E]">
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span>หน้าเว็บที่พบ: </span>
                    <strong className="text-[#2D2D2D]">{bug.currentPage}</strong>
                  </div>
                  <div>
                    <span>Host: </span>
                    <strong className="text-[#2D2D2D]">{bug.host}</strong>
                  </div>
                  <div>
                    <span>ชุดข้อสอบ / ข้อที่ทำ: </span>
                    <strong className="text-[#2D2D2D]">{bug.currentExamName || '-'}</strong>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span>เวอร์ชันระบบ / แพตช์: </span>
                    <strong className="text-[#2D2D2D]">1.0.0 / {bug.patchVersion}</strong>
                  </div>
                  <div className="truncate" title={bug.userAgent}>
                    <span>เบราว์เซอร์: </span>
                    <strong className="text-[#2D2D2D]">{bug.userAgent}</strong>
                  </div>
                </div>
              </div>

              {/* Filter Settings (if topic or set custom meta is saved) */}
              {bug.filterSettings && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-gray-500">การตั้งค่าตัวกรองตอนทำข้อสอบ (Filter Settings):</span>
                  <pre className="bg-black text-[#4AF626] p-3 rounded-lg text-[10px] font-mono overflow-x-auto border-2 border-black max-h-[100px]">
                    {JSON.stringify(JSON.parse(bug.filterSettings), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <AdminSecurityWrapper>
      <BugReportDashboard />
    </AdminSecurityWrapper>
  );
}
