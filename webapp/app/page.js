import prisma from '@/lib/prisma';
import CustomExamForm from '@/components/CustomExamForm';
import Link from 'next/link';
import { AlertTriangle, Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch subjects with their nested levels directly on the server
  const subjects = await prisma.subject.findMany({
    include: {
      levels: true,
    },
  });

  const questionCount = await prisma.question.count();

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Cartoon Style Header */}
      <header className="text-center flex flex-col items-center gap-2">
        <div className="sketch-border bg-[#E27B58] text-white py-2 px-8 inline-block transform -rotate-1 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ margin: 0 }}>
            DaddyTutor Mock-Exam
          </h1>
        </div>
        <p className="text-[#5E5E5E] font-medium text-sm md:text-base mt-2">
          ระบบจำลองการฝึกทำข้อสอบหน้าต่อหน้าสไตล์หน้ากระดาษลายเส้นการ์ตูน
        </p>
      </header>

      {/* Database Empty Warning */}
      {questionCount === 0 && (
        <div className="cartoon-card bg-[#FFF4E5] border-yellow-500 text-yellow-950 p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="bg-yellow-500 text-white p-3 rounded-full">
            <AlertTriangle size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-bold text-lg">ยังไม่มีข้อมูลข้อสอบในระบบคลังข้อสอบ</h3>
            <p className="text-sm mt-1">
              กรุณาเข้าสู่ระบบอัปเดตเพื่อดึงข้อมูลข้อสอบจาก GitHub มาบันทึกไว้ในฐานข้อมูล SQLite
            </p>
          </div>
          <Link href="/admin-update" className="cartoon-btn cartoon-btn-primary gap-2 mt-3 md:mt-0">
            <Settings size={18} />
            ไปหน้าอัปเดตข้อสอบ
          </Link>
        </div>
      )}

      {/* Main Filter Form */}
      {subjects.length > 0 ? (
        <CustomExamForm subjects={subjects} />
      ) : (
        <div className="cartoon-card p-8 text-center text-red-500 font-bold">
          ไม่พบข้อมูลวิชาในระบบ กรุณาตรวจสอบข้อมูลการ Seed ฐานข้อมูล
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-[#8E8E8E] mt-6 flex justify-between items-center px-4">
        <span>คลังข้อสอบทั้งหมดในระบบ: <strong>{questionCount} ข้อ</strong></span>
        <Link href="/admin-update" className="hover:text-[#E27B58] underline flex items-center gap-1 font-bold">
          <Settings size={12} />
          จัดการข้อสอบ (Admin Update)
        </Link>
      </footer>
    </main>
  );
}
