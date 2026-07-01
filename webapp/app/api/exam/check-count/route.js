import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { examSet, subjectId, level, year } = body;

    const where = {};
    if (examSet && examSet !== 'ทั้งหมด') {
      where.examSet = examSet;
    }
    if (subjectId && subjectId !== 'ทั้งหมด') {
      where.subjectId = subjectId;
    }
    if (level) {
      let levelSuffix = '';
      if (level === 'ประถม') levelSuffix = '_primary';
      else if (level === 'มัธยมปลาย') levelSuffix = '_upper_secondary';
      else levelSuffix = '_lower_secondary';
      
      where.levelId = { endsWith: levelSuffix };
    }
    if (year && year !== 'ทั้งหมด') {
      where.year = parseInt(year);
    }

    const count = await prisma.question.count({ where });

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error checking questions count:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
