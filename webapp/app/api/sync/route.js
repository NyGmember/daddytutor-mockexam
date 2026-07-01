import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    // 1. Validate Password
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password !== expectedPassword) {
      return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // 2. Check configuration (make optional if local version.json exists for offline dev mode)
    const repoRawUrl = process.env.GITHUB_REPO_RAW_URL || '';
    const baseUrl = repoRawUrl ? (repoRawUrl.endsWith('/') ? repoRawUrl : `${repoRawUrl}/`) : '';

    const localVersionPath = path.join(process.cwd(), '..', 'version.json');
    if (!repoRawUrl && !fs.existsSync(localVersionPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'กรุณาตั้งค่า GITHUB_REPO_RAW_URL ในสภาพแวดล้อม (environment) ของระบบ หรือตรวจสอบว่าไฟล์ version.json ในโฟลเดอร์หลักมีอยู่จริง' 
      }, { status: 500 });
    }

    // 3. Load version.json (try local disk first for offline/dev convenience, fallback to GitHub)
    let versionCatalog;
    if (fs.existsSync(localVersionPath)) {
      try {
        versionCatalog = JSON.parse(fs.readFileSync(localVersionPath, 'utf8'));
      } catch (err) {
        console.warn('Failed parsing local version.json:', err);
      }
    }

    if (!versionCatalog && baseUrl) {
      try {
        const res = await fetch(`${baseUrl}version.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        versionCatalog = await res.json();
      } catch (err) {
        console.error('Error fetching version.json:', err);
        return NextResponse.json({ 
          success: false, 
          error: `ไม่สามารถโหลดไฟล์ version.json ได้ (${err.message})` 
        }, { status: 500 });
      }
    }

    if (!versionCatalog) {
      return NextResponse.json({ 
        success: false, 
        error: 'ไม่สามารถโหลดไฟล์ version.json ได้ (กรุณาตั้งค่า GITHUB_REPO_RAW_URL หรือตรวจสอบไฟล์ version.json บนพื้นที่เก็บข้อมูล)' 
      }, { status: 500 });
    }

    const releases = versionCatalog.releases || [];
    if (releases.length === 0) {
      return NextResponse.json({ success: true, message: 'ไม่มีข้อมูล Release เวอร์ชันใด ๆ บน GitHub', importedCount: 0 });
    }

    // 4. Fetch synced versions from DB
    const syncedVersions = await prisma.syncLog.findMany({
      select: { version: true }
    });
    const syncedSet = new Set(syncedVersions.map(v => v.version));

    // Filter pending versions (order preserved to avoid skipping)
    const pendingReleases = releases.filter(rel => !syncedSet.has(rel));

    if (pendingReleases.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'ฐานข้อมูลเป็นเวอร์ชันล่าสุดแล้ว ไม่มีความจำเป็นต้องอัปเดต', 
        importedCount: 0 
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
      const patchUrl = `${baseUrl}releases/patch_${version}.json`;
      console.log(`Syncing version ${version} from ${patchUrl}...`);
      
      let patchData;
      const localPatchPath = path.join(process.cwd(), '..', 'releases', `patch_${version}.json`);
      if (fs.existsSync(localPatchPath)) {
        try {
          patchData = JSON.parse(fs.readFileSync(localPatchPath, 'utf8'));
        } catch (err) {
          console.warn(`Failed parsing local patch_${version}.json:`, err);
        }
      }

      if (!patchData && baseUrl) {
        try {
          const patchRes = await fetch(patchUrl, { cache: 'no-store' });
          if (!patchRes.ok) throw new Error(`HTTP status ${patchRes.status}`);
          patchData = await patchRes.json();
        } catch (err) {
          console.error(`Error loading patch ${version}:`, err);
          return NextResponse.json({ 
            success: false, 
            error: `เกิดข้อผิดพลาดขณะโหลดไฟล์แพตช์เวอร์ชัน ${version} (${err.message})` 
          }, { status: 500 });
        }
      }

      if (!patchData) {
        return NextResponse.json({ 
          success: false, 
          error: `ไม่สามารถโหลดไฟล์แพตช์เวอร์ชัน ${version} ได้` 
        }, { status: 500 });
      }

      const questionsList = patchData.questions || [];

      // Import questions to DB
      for (const q of questionsList) {
        // A. Ensure Subject exists (seed handles math/science, but let's double check)
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

        // E. Download or copy associated images
        const imageFiles = q.images || [];
        for (const imgFilename of imageFiles) {
          const localImgPath = path.join(publicImagesDir, imgFilename);
          const workspaceImgPath = path.join(process.cwd(), '..', 'images', imgFilename);

          // If the image doesn't exist in Next.js public directory
          if (!fs.existsSync(localImgPath)) {
            // First try to copy locally from the workspace images folder
            if (fs.existsSync(workspaceImgPath)) {
              try {
                fs.copyFileSync(workspaceImgPath, localImgPath);
                console.log(`Successfully copied image locally: ${imgFilename}`);
                continue;
              } catch (err) {
                console.error(`Error copying image locally ${imgFilename}:`, err);
              }
            }

            // Fallback to downloading from GitHub
            if (baseUrl) {
              try {
                const imgUrl = `${baseUrl}images/${imgFilename}`;
                const imgRes = await fetch(imgUrl);
                if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  fs.writeFileSync(localImgPath, buffer);
                  console.log(`Successfully downloaded image: ${imgFilename}`);
                } else {
                  console.warn(`Failed to download image ${imgFilename}: HTTP status ${imgRes.status}`);
                }
              } catch (err) {
                console.error(`Error downloading image ${imgFilename}:`, err);
              }
            } else {
              console.warn(`Image ${imgFilename} not found locally, and GITHUB_REPO_RAW_URL is not set.`);
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
    }

    return NextResponse.json({
      success: true,
      message: `อัปเดตข้อมูลเสร็จสมบูรณ์! ซิงค์เวอร์ชัน: ${syncedSuccessfully.join(', ')}`,
      importedCount: totalImportedQuestions
    });

  } catch (error) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
