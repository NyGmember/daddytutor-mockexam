import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { remoteUrl } = body;
    const gitRoot = path.join(process.cwd(), '..');

    // 1. Check or initialize git
    const dotGitPath = path.join(gitRoot, '.git');
    const isGitInitialized = fs.existsSync(dotGitPath);
    
    if (!isGitInitialized) {
      console.log('Initializing git repository at:', gitRoot);
      execSync('git init', { cwd: gitRoot });
    }

    // 2. Ensure git config name & email are set (important for running git commit on clean environments)
    try {
      execSync('git config user.name', { cwd: gitRoot });
    } catch (e) {
      console.log('Setting default git user.name');
      execSync('git config user.name "DaddyTutor Editor"', { cwd: gitRoot });
    }
    
    try {
      execSync('git config user.email', { cwd: gitRoot });
    } catch (e) {
      console.log('Setting default git user.email');
      execSync('git config user.email "editor@daddytutor.com"', { cwd: gitRoot });
    }

    // 3. Set remote origin if provided
    if (remoteUrl) {
      const cleanUrl = remoteUrl.trim();
      let hasRemote = false;
      try {
        execSync('git remote get-url origin', { cwd: gitRoot });
        hasRemote = true;
      } catch (e) {
        // origin doesn't exist
      }

      if (hasRemote) {
        execSync(`git remote set-url origin "${cleanUrl}"`, { cwd: gitRoot });
      } else {
        execSync(`git remote add origin "${cleanUrl}"`, { cwd: gitRoot });
      }
    }

    // 4. Initial commit if there is no commit history or changes exist
    try {
      execSync('git add -A', { cwd: gitRoot });
      // Check if there are changes to commit
      const statusOut = execSync('git status --porcelain', { cwd: gitRoot, encoding: 'utf8' });
      if (statusOut.trim().length > 0) {
        execSync('git commit -m "Initial commit from Mock-Exam Local Editor"', { cwd: gitRoot });
      }
    } catch (commitErr) {
      console.warn('Initial commit check failed or already committed:', commitErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Git ได้ถูกตั้งค่าและบันทึกข้อมูลเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error in git-init API:', error);
    return NextResponse.json({ 
      success: false, 
      error: `ไม่สามารถตั้งค่า Git ได้: ${error.stderr || error.message}` 
    }, { status: 500 });
  }
}
