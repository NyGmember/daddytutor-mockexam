import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';

export async function GET() {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const gitRoot = path.join(process.cwd(), '..');
    const dotGitPath = path.join(gitRoot, '.git');
    const gitInitialized = fs.existsSync(dotGitPath);

    // Read version.json if it exists
    let latestVersion = '';
    const versionPath = path.join(gitRoot, 'version.json');
    if (fs.existsSync(versionPath)) {
      try {
        const versionCatalog = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        if (versionCatalog.releases && versionCatalog.releases.length > 0) {
          latestVersion = versionCatalog.releases[versionCatalog.releases.length - 1];
        }
      } catch (err) {
        console.warn('Failed parsing version.json:', err);
      }
    }

    // Get all existing questions in the questions/ folder
    const questionsDir = path.join(gitRoot, 'questions');
    let diskQuestionIds = [];
    if (fs.existsSync(questionsDir)) {
      diskQuestionIds = fs.readdirSync(questionsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''))
        .sort();
    }

    // Fetch all questions from the SQLite database to cross-reference metadata
    let dbQuestions = [];
    try {
      dbQuestions = await prisma.question.findMany({
        select: {
          id: true,
          subjectId: true,
          levelId: true,
          topicId: true
        }
      });
    } catch (dbErr) {
      console.warn('Prisma database read failed, defaulting to empty list:', dbErr.message);
    }

    // Determine changed files status from Git
    let changedFiles = { questions: [], answers: [], images: [] };
    let remoteUrl = '';

    if (gitInitialized) {
      // Retrieve remote URL
      try {
        remoteUrl = execSync('git remote get-url origin', { cwd: gitRoot, encoding: 'utf8' }).trim();
      } catch (e) {
        // remote origin may not be set yet
      }

      // Retrieve porcelain status
      let gitStatusOut = '';
      try {
        gitStatusOut = execSync('git status --porcelain', { cwd: gitRoot, encoding: 'utf8' });
      } catch (e) {
        console.error('git status --porcelain failed:', e);
      }

      const lines = gitStatusOut.split('\n').filter(Boolean);
      const parsedChangedFiles = lines.map(line => {
        const status = line.substring(0, 2).trim();
        const filepath = line.substring(3).trim();
        return { status, filepath };
      });

      changedFiles.questions = parsedChangedFiles.filter(f => f.filepath.includes('questions/'));
      changedFiles.answers = parsedChangedFiles.filter(f => f.filepath.includes('answers/'));
      changedFiles.images = parsedChangedFiles.filter(f => f.filepath.includes('images/'));
    }

    // Read all published question IDs from releases directory
    const releasesDir = path.join(gitRoot, 'releases');
    const publishedQuestionIds = new Set();
    if (fs.existsSync(releasesDir)) {
      try {
        const releaseFiles = fs.readdirSync(releasesDir);
        for (const file of releaseFiles) {
          if (file.endsWith('.json')) {
            const patchPath = path.join(releasesDir, file);
            const patchContent = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
            if (patchContent && Array.isArray(patchContent.questions)) {
              for (const q of patchContent.questions) {
                if (q.id) {
                  publishedQuestionIds.add(q.id);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed parsing release patches:', err.message);
      }
    }

    // Map function to deduce status for each file
    const getQuestionStatus = (qId) => {
      const isQChanged = changedFiles.questions.find(f => f.filepath.includes(qId));
      const isAChanged = changedFiles.answers.find(f => f.filepath.includes(qId));

      const fileStatus = isQChanged?.status || isAChanged?.status;
      
      if (publishedQuestionIds.has(qId)) {
        if (fileStatus && fileStatus !== '??') {
          return 'Mod';
        }
        return 'Pub';
      }
      return 'New';
    };

    // Combine database metadata with disk files list
    const dbMap = new Map(dbQuestions.map(q => [q.id, q]));
    const questionsList = diskQuestionIds.map(qId => {
      const dbQ = dbMap.get(qId);
      return {
        id: qId,
        subjectId: dbQ?.subjectId || '',
        levelId: dbQ?.levelId || '',
        topicId: dbQ?.topicId || '',
        status: getQuestionStatus(qId)
      };
    });

    return NextResponse.json({
      success: true,
      gitInitialized,
      gitRoot,
      latestVersion,
      remoteUrl,
      allQuestionIds: diskQuestionIds,
      questionsList,
      changedFiles
    });

  } catch (error) {
    console.error('Error in local editor status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
