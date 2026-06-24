import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, levelId, topicIds, difficulties, count = 10 } = body;

    if (!subjectId || !levelId) {
      return NextResponse.json({ error: 'Missing subjectId or levelId' }, { status: 400 });
    }

    // 1. Build query filters
    const where = {
      subjectId: subjectId,
      levelId: levelId,
    };

    if (topicIds && topicIds.length > 0) {
      where.topicId = { in: topicIds };
    }

    if (difficulties && difficulties.length > 0) {
      where.difficulty = { in: difficulties.map(Number) };
    }

    // 2. Fetch all matching question IDs first to allow clean JS random selection
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

    // 3. Shuffle IDs using Fisher-Yates shuffle
    const shuffledIds = matchingQuestions.map(q => q.id);
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }

    // 4. Take the requested count
    const selectedIds = shuffledIds.slice(0, count);

    // 5. Fetch full question data for selected IDs
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

    // Sort questions back to match the shuffled IDs order
    const orderedQuestions = selectedIds.map(id => questions.find(q => q.id === id)).filter(Boolean);

    return NextResponse.json({
      success: true,
      questions: orderedQuestions,
      requestedCount: count,
      actualCount: orderedQuestions.length,
      warning: orderedQuestions.length < count ? `พบข้อสอบเพียง ${orderedQuestions.length} ข้อ ซึ่งน้อยกว่าจำนวนที่ขอ` : null,
    });
  } catch (error) {
    console.error('Error generating exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
