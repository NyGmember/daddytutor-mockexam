import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Clean filename to make it safe
    const originalName = file.name;
    const safeFilename = originalName.replace(/[^a-zA-Z0-9_\.-]/g, '_');

    const gitImagesDir = path.join(process.cwd(), '..', 'images');
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');

    // Ensure directories exist
    if (!fs.existsSync(gitImagesDir)) {
      fs.mkdirSync(gitImagesDir, { recursive: true });
    }
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    // Save to both locations
    fs.writeFileSync(path.join(gitImagesDir, safeFilename), buffer);
    fs.writeFileSync(path.join(publicImagesDir, safeFilename), buffer);

    console.log(`Saved uploaded image to git/images and public/images: ${safeFilename}`);

    return NextResponse.json({
      success: true,
      filename: safeFilename
    });

  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
