import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  const { filename } = params;
  const imagePath = path.join(process.cwd(), '..', 'images', filename);

  if (!fs.existsSync(imagePath)) {
    return new NextResponse('Image not found', { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Determine content type based on extension
    let contentType = 'image/png';
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lowerFilename.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (lowerFilename.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    } else if (lowerFilename.endsWith('.webp')) {
      contentType = 'image/webp';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}
