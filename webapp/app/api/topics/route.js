import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const levelId = searchParams.get('levelId');

  if (!subjectId || !levelId) {
    return NextResponse.json({ error: 'Missing subjectId or levelId' }, { status: 400 });
  }

  try {
    const topics = await prisma.topic.findMany({
      where: {
        levelId: levelId,
        level: {
          subjectId: subjectId,
        },
      },
      select: {
        id: true,
        nameTh: true,
      },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
