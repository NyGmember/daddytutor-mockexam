import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 1. Fetch unique examSets
    const dbSets = await prisma.question.findMany({
      select: { examSet: true },
      distinct: ['examSet']
    });
    
    let examSets = dbSets.map(s => s.examSet).filter(Boolean);
    
    // Ensure defaults exist if DB is empty or lacks them
    if (!examSets.includes('TEDET')) examSets.push('TEDET');
    if (!examSets.includes('O-NET')) examSets.push('O-NET');

    // 2. Fetch unique years sorted descending
    const dbYears = await prisma.question.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    });
    const years = dbYears.map(y => y.year).filter(Boolean);

    return NextResponse.json({
      success: true,
      examSets,
      years
    });
  } catch (error) {
    console.error('Error fetching sets metadata:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
