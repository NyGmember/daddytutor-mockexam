import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      host, 
      appVersion, 
      patchVersion, 
      userAgent, 
      currentPage, 
      filterSettings, 
      currentExamName, 
      errorDescription 
    } = body;

    if (!errorDescription) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อผิดพลาดที่พบ' }, { status: 400 });
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        host: host || 'unknown',
        appVersion: appVersion || '1.0.0',
        patchVersion: patchVersion || 'none',
        userAgent: userAgent || '',
        currentPage: currentPage || '',
        filterSettings: filterSettings ? JSON.stringify(filterSettings) : null,
        currentExamName: currentExamName || null,
        errorDescription: errorDescription
      }
    });

    return NextResponse.json({ success: true, bugId: bugReport.id });
  } catch (error) {
    console.error('Error creating bug report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
