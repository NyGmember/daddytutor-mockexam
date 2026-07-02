'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, Key } from 'lucide-react';

export default function AdminSecurityWrapper({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/verify');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
        }
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('กรุณากรอกรหัสผ่านเพื่อดำเนินการต่อ');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
      } else {
        setErrorMsg(data.error || 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F0] gap-4 p-4">
        <Loader2 className="animate-spin text-[#E27B58]" size={40} />
        <span className="font-black text-lg text-[#2D2D2D]">กำลังตรวจสอบสิทธิ์...</span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] p-4">
        <div className="cartoon-card p-6 md:p-8 max-w-md w-full bg-white flex flex-col gap-6 border-4">
          <div className="flex items-center gap-4 border-b-4 border-black pb-4">
            <div className="bg-[#E27B58] text-white p-3 rounded-full border-2 border-black">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black">ส่วนความปลอดภัย Admin</h1>
              <p className="text-xs text-muted">กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานหน้านี้</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm flex items-center gap-1.5 text-[#2D2D2D]">
                <Key size={16} className="text-[#E27B58]" />
                รหัสผ่านผู้ดูแลระบบ (Admin Password)
              </label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านแอดมิน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="cartoon-input text-base bg-white w-full"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-4 font-bold text-sm text-center border-2">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cartoon-btn cartoon-btn-primary py-3 text-base font-black justify-center gap-2 border-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  กำลังตรวจสอบรหัสผ่าน...
                </>
              ) : (
                'ยืนยันรหัสผ่านเพื่อเข้าใช้งาน'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
