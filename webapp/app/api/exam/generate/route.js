import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode = 'topic', subjectId, levelId, topicIds, difficulties, examSet, level, year, grade, count = 10 } = body;

    // 1. Build query filters based on mode
    const where = {};

    if (mode === 'set') {
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
      if (grade) {
        where.id = { contains: `_${grade}_` };
      }
    } else {
      // Topic Mode
      if (!subjectId || !levelId) {
        return NextResponse.json({ error: 'Missing subjectId or levelId' }, { status: 400 });
      }
      where.subjectId = subjectId;
      where.levelId = levelId;
      
      if (topicIds && topicIds.length > 0) {
        where.topicId = { in: topicIds };
      }
      if (difficulties && difficulties.length > 0) {
        where.difficulty = { in: difficulties.map(Number) };
      }
    }

    // 2. Fetch all matching question IDs first to allow flexible selection/shuffling
    const matchingQuestions = await prisma.question.findMany({
      where: where,
      select: {
        id: true,
      },
    });

    const totalAvailable = matchingQuestions.length;
    if (totalAvailable === 0) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบข้อสอบที่ตรงตามเงื่อนไขที่กำหนด',
      });
    }

    const isSetMode = mode === 'set';
    const isAll = count === 'all' || count === 'ทั้งหมด' || isSetMode;
    const shouldSortInOrder = isAll;

    let selectedIds = [];
    if (shouldSortInOrder) {
      // Sort all matching IDs numerically by their question number first
      const sortedIds = matchingQuestions.map(q => q.id).sort((a, b) => {
        // Sort by grade (e.g. G7, G8, G9) first if present
        const gradeA = a.match(/_G(\d+)_/)?.[1] || '';
        const gradeB = b.match(/_G(\d+)_/)?.[1] || '';
        if (gradeA !== gradeB) {
          return gradeA.localeCompare(gradeB);
        }
        const matchA = a.match(/(\d+)$/);
        const matchB = b.match(/(\d+)$/);
        const numA = matchA ? parseInt(matchA[1]) : 0;
        const numB = matchB ? parseInt(matchB[1]) : 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      });
      
      const takeLimit = isAll ? sortedIds.length : parseInt(count) || sortedIds.length;
      selectedIds = sortedIds.slice(0, takeLimit);
    } else {
      // Shuffle first, then slice count
      const shuffledIds = matchingQuestions.map(q => q.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }
      const takeLimit = parseInt(count) || 10;
      selectedIds = shuffledIds.slice(0, takeLimit);
    }

    // 3. Fetch full question data for selected IDs
    const questions = await prisma.question.findMany({
      where: {
        id: { in: selectedIds },
      },
      select: {
        id: true,
        year: true,
        difficulty: true,
        questionText: true,
        answerText: true,
        correctAnswer: true,
        images: true,
        topic: {
          select: {
            nameTh: true,
          },
        },
      },
    });

    // 4. Order questions back to match selectedIds order
    const orderedQuestions = selectedIds.map(id => questions.find(q => q.id === id)).filter(Boolean);

    const requestedCount = isAll ? orderedQuestions.length : parseInt(count) || 10;

    return NextResponse.json({
      success: true,
      questions: orderedQuestions,
      requestedCount: requestedCount,
      actualCount: orderedQuestions.length,
      warning: orderedQuestions.length < requestedCount ? `พบข้อสอบเพียง ${orderedQuestions.length} ข้อ ซึ่งน้อยกว่าจำนวนที่ขอ` : null,
    });
  } catch (error) {
    console.error('Error generating exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
