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
    if (level && level !== 'ทั้งหมด') {
      let levelSuffix = '';
      if (level === 'ประถม') levelSuffix = '_primary';
      else if (level === 'มัธยมปลาย') levelSuffix = '_upper_secondary';
      else levelSuffix = '_lower_secondary';
      
      where.levelId = { endsWith: levelSuffix };
    }
    if (year && year !== 'ทั้งหมด') {
      where.year = parseInt(year);
    }

    // Fetch matching questions to group into papers/sets
    const questions = await prisma.question.findMany({
      where: where,
      select: {
        id: true,
        examSet: true,
        subjectId: true,
        year: true,
      }
    });

    const papersMap = new Map();

    for (const q of questions) {
      // Parse grade (e.g. G7 from _G7_ or G7 at the end of slice etc)
      const gradeMatch = q.id.match(/_G(\d+)_/);
      if (!gradeMatch) continue;
      const grade = `G${gradeMatch[1]}`;

      // Construct a unique key for the paper
      const paperKey = `${q.examSet}_${q.subjectId}_${q.year}_${grade}`;

      if (!papersMap.has(paperKey)) {
        // Map grade to Thai friendly label
        let gradeLabel = '';
        const gNum = parseInt(gradeMatch[1]);
        if (gNum >= 1 && gNum <= 6) {
          gradeLabel = `ป.${gNum}`;
        } else if (gNum >= 7 && gNum <= 9) {
          gradeLabel = `ม.${gNum - 6}`;
        } else if (gNum >= 10 && gNum <= 12) {
          gradeLabel = `ม.${gNum - 6}`;
        } else {
          gradeLabel = `ชั้นปี ${gNum}`;
        }

        // Map subjectId to Thai name
        let subjectLabel = '';
        if (q.subjectId === 'mathematics') subjectLabel = 'คณิตศาสตร์';
        else if (q.subjectId === 'science') subjectLabel = 'วิทยาศาสตร์';
        else subjectLabel = q.subjectId;

        // Friendly name: e.g. "TEDET คณิตศาสตร์ พ.ศ. 2558 ม.1"
        const friendlyName = `${q.examSet} ${subjectLabel} พ.ศ. ${q.year} ${gradeLabel}`;

        papersMap.set(paperKey, {
          paperId: paperKey,
          examSet: q.examSet,
          subjectId: q.subjectId,
          year: q.year,
          grade: grade,
          friendlyName: friendlyName,
          questionCount: 0
        });
      }

      papersMap.get(paperKey).questionCount += 1;
    }

    const papers = Array.from(papersMap.values());

    // Sort papers: newest year first, then by examSet, then by grade number
    papers.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.examSet !== b.examSet) return a.examSet.localeCompare(b.examSet);
      const gradeNumA = parseInt(a.grade.replace('G', '')) || 0;
      const gradeNumB = parseInt(b.grade.replace('G', '')) || 0;
      return gradeNumA - gradeNumB;
    });

    return NextResponse.json({
      success: true,
      papers: papers
    });
  } catch (error) {
    console.error('Error searching exam papers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
