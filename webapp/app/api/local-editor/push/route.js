import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { parseYaml } from '@/lib/yaml';

export async function POST(request) {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { selectedIds = [], version, commitMessage } = body;

    if (!version) {
      return NextResponse.json({ error: 'Missing release version' }, { status: 400 });
    }

    if (selectedIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one question to push' }, { status: 400 });
    }

    const gitRoot = path.join(process.cwd(), '..');
    const questionsDir = path.join(gitRoot, 'questions');
    const answersDir = path.join(gitRoot, 'answers');
    const releasesDir = path.join(gitRoot, 'releases');

    // 1. Process questions and build patch data
    const questionsList = [];
    const imageFilesToStage = new Set();

    for (const id of selectedIds) {
      const qPath = path.join(questionsDir, `${id}.md`);
      const aPath = path.join(answersDir, `${id}.md`);

      if (!fs.existsSync(qPath) || !fs.existsSync(aPath)) {
        return NextResponse.json({ 
          error: `Files for question ID ${id} not found on disk.` 
        }, { status: 404 });
      }

      const questionText = fs.readFileSync(qPath, 'utf8');
      const answerContent = fs.readFileSync(aPath, 'utf8');

      // Parse YAML frontmatter in answer
      const parts = answerContent.split('---');
      if (parts.length < 3) {
        return NextResponse.json({ 
          error: `Invalid answer file format for ${id}` 
        }, { status: 500 });
      }

      const yamlText = parts[1];
      const answerText = parts.slice(2).join('---').trim();
      const metadata = parseYaml(yamlText);

      // Extract image filenames from markdown
      const images = [];
      const imgRegex = /!\[.*?\]\(\.\.\/images\/([^\)]+)\)/g;
      let match;
      while ((match = imgRegex.exec(questionText)) !== null) {
        images.push(match[1]);
        imageFilesToStage.add(match[1]);
      }

      // Map Thai metadata to DB IDs
      const subject = metadata.subject || 'คณิตศาสตร์';
      const levelStr = metadata.level || '';
      
      let subjectId = 'mathematics';
      if (subject === 'วิทยาศาสตร์' || subject.toLowerCase() === 'science') {
        subjectId = 'science';
      }

      let levelId = '';
      if (subjectId === 'mathematics') {
        if (levelStr.includes('ประถม')) levelId = 'math_primary';
        else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'math_upper_secondary';
        else levelId = 'math_lower_secondary';
      } else {
        if (levelStr.includes('ประถม')) levelId = 'sci_primary';
        else if (levelStr.includes('มัยธมปลาย') || levelStr.includes('G10')) levelId = 'sci_upper_secondary';
        else levelId = 'sci_lower_secondary';
      }

      questionsList.push({
        id,
        subjectId,
        levelId,
        topicId: metadata.topic_id || '',
        topicNameTh: metadata.topic_name || '',
        year: parseInt(metadata.year) || 2557,
        difficulty: parseInt(metadata.difficulty) || 3,
        questionText,
        answerText, // CLEAN explanation body for DB storage (stripped of frontmatter)
        correctAnswer: (metadata.answer || '').toString(),
        images
      });
    }

    // 2. Ensure releases folder exists
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir, { recursive: true });
    }

    // 3. Write releases/patch_${version}.json
    const patchFilename = `patch_${version}.json`;
    const patchPath = path.join(releasesDir, patchFilename);
    const patchData = { questions: questionsList };
    fs.writeFileSync(patchPath, JSON.stringify(patchData, null, 2), 'utf8');

    // 4. Update version.json
    const versionPath = path.join(gitRoot, 'version.json');
    let versionCatalog = { releases: [] };
    
    if (fs.existsSync(versionPath)) {
      try {
        versionCatalog = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      } catch (err) {
        console.warn('Failed parsing version.json, creating a new one:', err);
      }
    }

    if (!Array.isArray(versionCatalog.releases)) {
      versionCatalog.releases = [];
    }

    if (!versionCatalog.releases.includes(version)) {
      versionCatalog.releases.push(version);
    }

    fs.writeFileSync(versionPath, JSON.stringify(versionCatalog, null, 2), 'utf8');

    // 5. Git Commit and Push
    let gitLog = '';
    let gitPushSuccess = true;
    let gitPushError = '';

    try {
      // Stage files: version.json, patch file, modified questions/answers, and associated images
      execSync('git add version.json', { cwd: gitRoot });
      execSync(`git add releases/${patchFilename}`, { cwd: gitRoot });
      
      for (const id of selectedIds) {
        execSync(`git add questions/${id}.md`, { cwd: gitRoot });
        execSync(`git add answers/${id}.md`, { cwd: gitRoot });
      }

      for (const imgFilename of imageFilesToStage) {
        const imgPath = path.join(gitRoot, 'images', imgFilename);
        if (fs.existsSync(imgPath)) {
          execSync(`git add images/${imgFilename}`, { cwd: gitRoot });
        }
      }

      // Commit changes
      const msg = commitMessage || `Release version ${version}`;
      const escapedMsg = msg.replace(/"/g, '\\"');
      const commitOut = execSync(`git commit -m "${escapedMsg}"`, { cwd: gitRoot, encoding: 'utf8' });
      gitLog += `Commit Output:\n${commitOut}\n`;

      // Detect active branch name to set upstream push destination
      let currentBranch = 'master';
      try {
        currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: gitRoot, encoding: 'utf8' }).trim();
      } catch (branchErr) {
        console.warn('Failed to detect branch name, defaulting to master:', branchErr.message);
      }

      // Push changes using upstream tracking config
      try {
        const pushOut = execSync(`git push -u origin ${currentBranch}`, { cwd: gitRoot, encoding: 'utf8' });
        gitLog += `Push Output:\n${pushOut}\n`;
      } catch (pushErr) {
        gitPushSuccess = false;
        gitPushError = pushErr.stderr || pushErr.message;
        gitLog += `Push Failed:\n${gitPushError}\n`;
      }

    } catch (gitErr) {
      console.error('Git execution failed:', gitErr);
      return NextResponse.json({
        success: false,
        error: `Git command failed: ${gitErr.message}`,
        details: gitErr.stderr || gitErr.stdout || ''
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: gitPushSuccess 
        ? `สร้าง Release แพตช์เวอร์ชัน ${version} และ Push ขึ้น GitHub เรียบร้อยแล้ว!` 
        : `สร้าง Release แพตช์เวอร์ชัน ${version} สำเร็จในเครื่อง แต่ไม่สามารถ Push ขึ้น GitHub ได้`,
      patchPath: `/releases/${patchFilename}`,
      gitPushSuccess,
      gitPushError,
      gitLog
    });

  } catch (error) {
    console.error('Error in push API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
