import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const session = cookieStore.get('admin_session');
    if (!session || session.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, tag } = body;

    if (!id || !tag) {
      return NextResponse.json({ success: false, error: 'Missing bug ID or tag' }, { status: 400 });
    }

    if (!['new issue', 'Dismiss', 'Resolve'].includes(tag)) {
      return NextResponse.json({ success: false, error: 'Invalid tag value' }, { status: 400 });
    }

    const updatedBug = await prisma.bugReport.update({
      where: { id: id },
      data: { tag: tag }
    });

    return NextResponse.json({ success: true, bug: updatedBug });
  } catch (error) {
    console.error('Error updating bug status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
