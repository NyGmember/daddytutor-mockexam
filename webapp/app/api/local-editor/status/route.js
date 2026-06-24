import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

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
    let allQuestionIds = [];
    if (fs.existsSync(questionsDir)) {
      allQuestionIds = fs.readdirSync(questionsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''))
        .sort();
    }

    if (!gitInitialized) {
      return NextResponse.json({
        success: true,
        gitInitialized: false,
        gitRoot,
        latestVersion,
        allQuestionIds,
        remoteUrl: '',
        changedFiles: {
          questions: [],
          answers: [],
          images: []
        }
      });
    }

    // Git is initialized, retrieve remote URL and file status
    let remoteUrl = '';
    try {
      remoteUrl = execSync('git remote get-url origin', { cwd: gitRoot, encoding: 'utf8' }).trim();
    } catch (e) {
      // remote origin may not be set yet
    }

    let gitStatusOut = '';
    try {
      gitStatusOut = execSync('git status --porcelain', { cwd: gitRoot, encoding: 'utf8' });
    } catch (e) {
      console.error('git status --porcelain failed:', e);
    }

    const lines = gitStatusOut.split('\n').filter(Boolean);
    const changedFiles = lines.map(line => {
      const status = line.substring(0, 2).trim();
      const filepath = line.substring(3).trim();
      return { status, filepath };
    });

    const questions = changedFiles.filter(f => f.filepath.includes('questions/'));
    const answers = changedFiles.filter(f => f.filepath.includes('answers/'));
    const images = changedFiles.filter(f => f.filepath.includes('images/'));

    return NextResponse.json({
      success: true,
      gitInitialized: true,
      gitRoot,
      latestVersion,
      remoteUrl,
      allQuestionIds,
      changedFiles: {
        questions,
        answers,
        images
      }
    });

  } catch (error) {
    console.error('Error in local editor status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
