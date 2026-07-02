import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const latestSync = await prisma.syncLog.findFirst({
      orderBy: { syncedAt: 'desc' }
    });
    return NextResponse.json({ 
      success: true, 
      version: latestSync ? latestSync.version : 'none' 
    });
  } catch (error) {
    console.error('Error fetching latest version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
