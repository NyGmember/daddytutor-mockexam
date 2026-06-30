const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database sync from local release patches...");

    const localVersionPath = path.join(process.cwd(), '..', 'version.json');
    if (!fs.existsSync(localVersionPath)) {
        console.error("Error: version.json not found in root directory.");
        process.exit(1);
    }

    const versionCatalog = JSON.parse(fs.readFileSync(localVersionPath, 'utf8'));
    const releases = versionCatalog.releases || [];
    if (releases.length === 0) {
        console.log("No releases found in version.json.");
        return;
    }

    // Fetch synced versions from DB
    const syncedVersions = await prisma.syncLog.findMany({
      select: { version: true }
    });
    const syncedSet = new Set(syncedVersions.map(v => v.version));

    // Filter pending versions
    const pendingReleases = releases.filter(rel => !syncedSet.has(rel));
    if (pendingReleases.length === 0) {
      console.log("Database is already up to date! No updates needed.");
      return;
    }

    console.log(`Pending releases to sync: ${pendingReleases.join(', ')}`);

    // Ensure public/images directory exists
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    let totalImportedQuestions = 0;

    for (const version of pendingReleases) {
      const localPatchPath = path.join(process.cwd(), '..', 'releases', `patch_${version}.json`);
      if (!fs.existsSync(localPatchPath)) {
        console.warn(`Warning: Patch file not found at ${localPatchPath}, skipping version ${version}.`);
        continue;
      }

      console.log(`Processing version ${version} from ${localPatchPath}...`);
      const patchData = JSON.parse(fs.readFileSync(localPatchPath, 'utf8'));
      const questionsList = patchData.questions || [];

      for (const q of questionsList) {
        const subjectId = q.subjectId;
        const subjectName = subjectId === 'mathematics' ? 'คณิตศาสตร์' : 'วิทยาศาสตร์';
        
        // A. Ensure Subject
        await prisma.subject.upsert({
          where: { id: subjectId },
          update: { nameTh: subjectName },
          create: { id: subjectId, nameTh: subjectName }
        });

        // B. Ensure Level
        await prisma.level.upsert({
          where: { id: q.levelId },
          update: {},
          create: { 
            id: q.levelId, 
            nameTh: q.levelId.includes('primary') ? 'ประถมศึกษา' : q.levelId.includes('lower') ? 'มัธยมศึกษาตอนต้น' : 'มัธยมศึกษาตอนปลาย',
            subjectId: subjectId
          }
        });

        // C. Ensure Topic
        await prisma.topic.upsert({
          where: { id: q.topicId },
          update: { nameTh: q.topicNameTh, levelId: q.levelId },
          create: { id: q.topicId, nameTh: q.topicNameTh, levelId: q.levelId }
        });

        // D. Save Question
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
            images: JSON.stringify(q.images || [])
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
            images: JSON.stringify(q.images || [])
          }
        });

        // E. Copy images
        const imageFiles = q.images || [];
        for (const imgFilename of imageFiles) {
          const localImgPath = path.join(publicImagesDir, imgFilename);
          const workspaceImgPath = path.join(process.cwd(), '..', 'images', imgFilename);

          if (!fs.existsSync(localImgPath)) {
            if (fs.existsSync(workspaceImgPath)) {
              try {
                fs.copyFileSync(workspaceImgPath, localImgPath);
                console.log(`  Copied image: ${imgFilename}`);
              } catch (err) {
                console.error(`  Error copying image ${imgFilename}:`, err);
              }
            } else {
              console.warn(`  Warning: Image ${imgFilename} not found at ${workspaceImgPath}`);
            }
          }
        }

        totalImportedQuestions++;
      }

      // Mark this version as synced successfully
      await prisma.syncLog.create({
        data: { version }
      });
      console.log(`Successfully synced version ${version}!`);
    }

    console.log(`Sync completed successfully! Imported/Updated ${totalImportedQuestions} questions.`);

  } catch (error) {
    console.error("Error during sync:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
