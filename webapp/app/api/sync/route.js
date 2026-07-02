import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  const logs = [];
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    logs.push('กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...');
    
    // Validate Password or Session Cookie
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const cookieStore = cookies();
    const session = cookieStore.get('admin_session');
    const isSessionValid = session && session.value === 'authenticated';

    if (password !== expectedPassword && !isSessionValid) {
      logs.push('ความล้มเหลว: รหัสผ่านไม่ถูกต้อง หรือไม่ได้รับอนุญาต');
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาตให้เข้าใช้งาน', processLogs: logs }, { status: 401 });
    }
    logs.push('สิทธิ์ผู้ดูแลระบบได้รับการยืนยันเรียบร้อย');

    // 2. Check configuration (make optional if local version.json exists for offline dev mode)
    const repoRawUrl = process.env.GITHUB_REPO_RAW_URL || '';
    const baseUrl = repoRawUrl ? (repoRawUrl.endsWith('/') ? repoRawUrl : `${repoRawUrl}/`) : '';

    const localVersionPath = path.join(process.cwd(), '..', 'version.json');
    if (!repoRawUrl && !fs.existsSync(localVersionPath)) {
      logs.push('ความล้มเหลว: ไม่พบการตั้งค่า GITHUB_REPO_RAW_URL และไม่พบ local version.json');
      return NextResponse.json({ 
        success: false, 
        error: 'กรุณาตั้งค่า GITHUB_REPO_RAW_URL ในสภาพแวดล้อม (environment) ของระบบ หรือตรวจสอบว่าไฟล์ version.json ในโฟลเดอร์หลักมีอยู่จริง',
        processLogs: logs
      }, { status: 500 });
    }

    // 3. Load version.json (try local disk first for offline/dev convenience, fallback to GitHub)
    let versionCatalog;
    if (fs.existsSync(localVersionPath)) {
      logs.push('กำลังอ่านไฟล์ version.json จากพื้นที่เครื่องโฮสต์...');
      try {
        versionCatalog = JSON.parse(fs.readFileSync(localVersionPath, 'utf8'));
        logs.push('อ่านไฟล์ local version.json สำเร็จ');
      } catch (err) {
        logs.push(`คำเตือน: อ่านไฟล์ local version.json ล้มเหลว (${err.message})`);
        console.warn('Failed parsing local version.json:', err);
      }
    }

    if (!versionCatalog && baseUrl) {
      logs.push(`กำลังดาวน์โหลดไฟล์ version.json จาก GitHub Raw URL: ${baseUrl}version.json...`);
      try {
        const res = await fetch(`${baseUrl}version.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        versionCatalog = await res.json();
        logs.push('ดาวน์โหลดไฟล์ version.json จาก GitHub สำเร็จ');
      } catch (err) {
        logs.push(`ความล้มเหลว: ไม่สามารถดาวน์โหลด version.json (${err.message})`);
        console.error('Error fetching version.json:', err);
        return NextResponse.json({ 
          success: false, 
          error: `ไม่สามารถโหลดไฟล์ version.json ได้ (${err.message})`,
          processLogs: logs
        }, { status: 500 });
      }
    }

    if (!versionCatalog) {
      logs.push('ความล้มเหลว: ไม่พบข้อมูลแค็ตตาล็อกเวอร์ชัน');
      return NextResponse.json({ 
        success: false, 
        error: 'ไม่สามารถโหลดไฟล์ version.json ได้ (กรุณาตั้งค่า GITHUB_REPO_RAW_URL หรือตรวจสอบไฟล์ version.json บนพื้นที่เก็บข้อมูล)',
        processLogs: logs
      }, { status: 500 });
    }

    const releases = versionCatalog.releases || [];
    if (releases.length === 0) {
      logs.push('ไม่มีข้อมูลเวอร์ชันที่เผยแพร่ใดๆ ในระบบ');
      return NextResponse.json({ success: true, message: 'ไม่มีข้อมูล Release เวอร์ชันใด ๆ บน GitHub', importedCount: 0, processLogs: logs });
    }

    // 4. Fetch synced versions from DB
    logs.push('กำลังเชื่อมต่อฐานข้อมูลเพื่อดึงรายการเวอร์ชันที่เคยซิงค์แล้ว...');
    const syncedVersions = await prisma.syncLog.findMany({
      select: { version: true }
    });
    const syncedSet = new Set(syncedVersions.map(v => v.version));
    logs.push(`พบคลิปเวอร์ชันที่เคยติดตั้งแล้ว: ${Array.from(syncedSet).join(', ') || 'ไม่มี'}`);

    // Filter pending versions (order preserved to avoid skipping)
    const pendingReleases = releases.filter(rel => !syncedSet.has(rel));
    logs.push(`รายการเวอร์ชันรอนำเข้าอัปเดต: ${pendingReleases.join(', ') || 'ไม่มี (ฐานข้อมูลล่าสุดแล้ว)'}`);

    if (pendingReleases.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'ฐานข้อมูลเป็นเวอร์ชันล่าสุดแล้ว ไม่มีความจำเป็นต้องอัปเดต', 
        importedCount: 0,
        processLogs: logs
      });
    }

    // Ensure public/images directory exists on disk
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    let totalImportedQuestions = 0;
    const syncedSuccessfully = [];

    // 5. Process each pending patch sequentially
    for (const version of pendingReleases) {
      logs.push(`----------------------------------------`);
      logs.push(`เริ่มดำเนินการซิงค์แพตช์เวอร์ชัน ${version}...`);
      
      const patchUrl = `${baseUrl}releases/patch_${version}.json`;
      let patchData;
      const localPatchPath = path.join(process.cwd(), '..', 'releases', `patch_${version}.json`);
      
      if (fs.existsSync(localPatchPath)) {
        logs.push(`พบไฟล์แพตช์ในเครื่อง: patch_${version}.json, กำลังดำเนินการอ่าน...`);
        try {
          patchData = JSON.parse(fs.readFileSync(localPatchPath, 'utf8'));
          logs.push(`อ่านไฟล์แพตช์ patch_${version}.json จากพื้นที่เครื่องสำเร็จ`);
        } catch (err) {
          logs.push(`คำเตือน: อ่านไฟล์แพตช์ในเครื่องล้มเหลว (${err.message})`);
          console.warn(`Failed parsing local patch_${version}.json:`, err);
        }
      }

      if (!patchData && baseUrl) {
        logs.push(`ไม่พบไฟล์แพตช์ในเครื่อง กำลังดาวน์โหลดผ่านเน็ตจาก: ${patchUrl}...`);
        try {
          const patchRes = await fetch(patchUrl, { cache: 'no-store' });
          if (!patchRes.ok) throw new Error(`HTTP status ${patchRes.status}`);
          patchData = await patchRes.json();
          logs.push(`ดาวน์โหลดไฟล์แพตช์เวอร์ชัน ${version} สำเร็จ`);
        } catch (err) {
          logs.push(`ความล้มเหลว: เกิดข้อผิดพลาดขณะโหลดไฟล์แพตช์เวอร์ชัน ${version} (${err.message})`);
          console.error(`Error loading patch ${version}:`, err);
          return NextResponse.json({ 
            success: false, 
            error: `เกิดข้อผิดพลาดขณะโหลดไฟล์แพตช์เวอร์ชัน ${version} (${err.message})`,
            processLogs: logs
          }, { status: 500 });
        }
      }

      if (!patchData) {
        logs.push(`ความล้มเหลว: ไม่สามารถเข้าถึงข้อมูลแพตช์เวอร์ชัน ${version} ได้`);
        return NextResponse.json({ 
          success: false, 
          error: `ไม่สามารถโหลดไฟล์แพตช์เวอร์ชัน ${version} ได้`,
          processLogs: logs
        }, { status: 500 });
      }

      const questionsList = patchData.questions || [];
      logs.push(`พบคำถามในไฟล์แพตช์เวอร์ชัน ${version} ทั้งหมด: ${questionsList.length} ข้อ`);

      // Import questions to DB
      for (const q of questionsList) {
        // A. Ensure Subject exists
        const subjectId = q.subjectId;
        const subjectName = subjectId === 'mathematics' ? 'คณิตศาสตร์' : 'วิทยาศาสตร์';
        await prisma.subject.upsert({
          where: { id: subjectId },
          update: {},
          create: { id: subjectId, nameTh: subjectName }
        });

        // B. Ensure Level exists
        await prisma.level.upsert({
          where: { id: q.levelId },
          update: {},
          create: { 
            id: q.levelId, 
            nameTh: q.levelId.includes('primary') ? 'ประถมศึกษา' : q.levelId.includes('lower') ? 'มัธยมศึกษาตอนต้น' : 'มัธยมศึกษาตอนปลาย',
            subjectId: subjectId
          }
        });

        // C. Ensure Topic exists
        await prisma.topic.upsert({
          where: { id: q.topicId },
          update: { nameTh: q.topicNameTh, levelId: q.levelId },
          create: { id: q.topicId, nameTh: q.topicNameTh, levelId: q.levelId }
        });

        // D. Save Question
        const examSet = q.examSet || (() => {
          if (!q.id) return 'TEDET';
          const upper = q.id.toUpperCase();
          if (upper.startsWith('TEDET')) return 'TEDET';
          if (upper.startsWith('ONET') || upper.startsWith('O_NET') || upper.startsWith('O-NET')) return 'O-NET';
          const match = q.id.match(/^([A-Za-z]+)/);
          return match ? match[1].toUpperCase() : 'TEDET';
        })();

        await prisma.question.upsert({
          where: { id: q.id },
          update: {
            subjectId: q.subjectId,
            levelId: q.levelId,
            topicId: q.topicId,
            year: parseInt(q.year),
            difficulty: parseInt(q.difficulty),
            questionText: q.questionText,
            answerText: q.answerText,
            correctAnswer: q.correctAnswer,
            images: JSON.stringify(q.images || []),
            examSet: examSet
          },
          create: {
            id: q.id,
            subjectId: q.subjectId,
            levelId: q.levelId,
            topicId: q.topicId,
            year: parseInt(q.year),
            difficulty: parseInt(q.difficulty),
            questionText: q.questionText,
            answerText: q.answerText,
            correctAnswer: q.correctAnswer,
            images: JSON.stringify(q.images || []),
            examSet: examSet
          }
        });

        logs.push(`นำเข้าคำถามสำเร็จ: ID = ${q.id} (${subjectName}, ปี ${q.year})`);

        // E. Download or copy associated images
        const imageFiles = q.images || [];
        for (const imgFilename of imageFiles) {
          const localImgPath = path.join(publicImagesDir, imgFilename);
          const workspaceImgPath = path.join(process.cwd(), '..', 'images', imgFilename);

          if (!fs.existsSync(localImgPath)) {
            if (fs.existsSync(workspaceImgPath)) {
              try {
                fs.copyFileSync(workspaceImgPath, localImgPath);
                logs.push(`  - คัดลอกรูปภาพจากในเครื่องสำเร็จ: ${imgFilename}`);
                continue;
              } catch (err) {
                logs.push(`  - คำเตือน: คัดลอกรูปภาพในเครื่องล้มเหลว ${imgFilename} (${err.message})`);
              }
            }

            if (baseUrl) {
              try {
                const imgUrl = `${baseUrl}images/${imgFilename}`;
                const imgRes = await fetch(imgUrl);
                if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  fs.writeFileSync(localImgPath, buffer);
                  logs.push(`  - ดาวน์โหลดรูปภาพจากคลังสำเร็จ: ${imgFilename}`);
                } else {
                  logs.push(`  - คำเตือน: ดาวน์โหลดรูปภาพล้มเหลว ${imgFilename} (HTTP status ${imgRes.status})`);
                }
              } catch (err) {
                logs.push(`  - คำเตือน: ดาวน์โหลดรูปภาพผิดพลาด ${imgFilename} (${err.message})`);
              }
            } else {
              logs.push(`  - คำเตือน: ไม่พบรูปภาพ ${imgFilename} และระบบไม่ได้ตั้งค่า GITHUB_REPO_RAW_URL`);
            }
          }
        }

        totalImportedQuestions++;
      }

      // Mark this version as synced successfully
      await prisma.syncLog.create({
        data: { version }
      });
      syncedSuccessfully.push(version);
      logs.push(`ซิงค์แพตช์เวอร์ชัน ${version} เสร็จสมบูรณ์แล้ว`);
    }

    logs.push(`========================================`);
    logs.push(`กระบวนการซิงค์ข้อมูลสำเร็จทั้งหมด!`);
    logs.push(`จำนวนข้อสอบที่อัปเดตนำเข้าทั้งหมด: ${totalImportedQuestions} ข้อ`);

    return NextResponse.json({
      success: true,
      message: `อัปเดตข้อมูลเสร็จสมบูรณ์! ซิงค์เวอร์ชัน: ${syncedSuccessfully.join(', ')}`,
      importedCount: totalImportedQuestions,
      processLogs: logs
    });

  } catch (error) {
    console.error('Error in sync endpoint:', error);
    logs.push(`เกิดข้อผิดพลาดรุนแรงระดับระบบ: ${error.message}`);
    return NextResponse.json({ success: false, error: 'Internal server error', processLogs: logs }, { status: 500 });
  }
}
