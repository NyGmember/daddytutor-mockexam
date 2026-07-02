import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const session = cookieStore.get('admin_session');
    if (!session || session.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    const where = {};
    if (tag && tag !== 'ทั้งหมด') {
      where.tag = tag;
    }

    const bugReports = await prisma.bugReport.findMany({
      where: where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, bugReports });
  } catch (error) {
    console.error('Error listing bug reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
