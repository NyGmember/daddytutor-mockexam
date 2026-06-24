import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { stringifyYaml } from '@/lib/yaml';

export async function POST(request) {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      id,
      subjectId,
      levelId,
      topicId,
      topicNameTh,
      year,
      difficulty,
      grade,
      correctAnswer,
      questionText,
      answerText, // explanation body only
      images = []
    } = body;

    if (!id || !subjectId || !levelId || !topicId || !topicNameTh) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Map to Thai metadata values for disk frontmatter
    const subject = subjectId === 'mathematics' ? 'คณิตศาสตร์' : 'วิทยาศาสตร์';
    
    let level = 'มัธยมต้น (G7-G9)';
    if (levelId.includes('primary')) {
      level = 'ประถม (G1-G6)';
    } else if (levelId.includes('upper_secondary')) {
      level = 'มัธยมปลาย (G10-G12)';
    }

    // 2. Prepare YAML metadata
    const frontmatter = {
      exam_name: 'TEDET',
      subject,
      level,
      grade: grade || 'G7',
      year: parseInt(year) || 2557,
      difficulty: parseInt(difficulty) || 3,
      topic_id: topicId,
      topic_name: topicNameTh,
      answer: correctAnswer.toString()
    };

    const fullAnswerContent = `---\n${stringifyYaml(frontmatter)}---\n\n${answerText}`;

    // 3. Write files to local workspace folders
    const questionsDir = path.join(process.cwd(), '..', 'questions');
    const answersDir = path.join(process.cwd(), '..', 'answers');

    if (!fs.existsSync(questionsDir)) fs.mkdirSync(questionsDir, { recursive: true });
    if (!fs.existsSync(answersDir)) fs.mkdirSync(answersDir, { recursive: true });

    const questionPath = path.join(questionsDir, `${id}.md`);
    const answerPath = path.join(answersDir, `${id}.md`);

    fs.writeFileSync(questionPath, questionText, 'utf8');
    fs.writeFileSync(answerPath, fullAnswerContent, 'utf8');

    // 4. Save/Update inside local SQLite database using Prisma
    // A. Ensure Subject exists
    await prisma.subject.upsert({
      where: { id: subjectId },
      update: { nameTh: subject },
      create: { id: subjectId, nameTh: subject }
    });

    // B. Ensure Level exists
    await prisma.level.upsert({
      where: { id: levelId },
      update: {},
      create: {
        id: levelId,
        nameTh: levelId.includes('primary') ? 'ประถมศึกษา' : levelId.includes('lower') ? 'มัธยมศึกษาตอนต้น' : 'มัธยมศึกษาตอนปลาย',
        subjectId
      }
    });

    // C. Ensure Topic exists
    await prisma.topic.upsert({
      where: { id: topicId },
      update: { nameTh: topicNameTh, levelId },
      create: { id: topicId, nameTh: topicNameTh, levelId }
    });

    // D. Save Question details
    await prisma.question.upsert({
      where: { id: id },
      update: {
        subjectId,
        levelId,
        topicId,
        year: parseInt(year) || 2557,
        difficulty: parseInt(difficulty) || 3,
        questionText,
        answerText, // only store explanation markdown body in database
        correctAnswer: correctAnswer.toString(),
        images: JSON.stringify(images)
      },
      create: {
        id,
        subjectId,
        levelId,
        topicId,
        year: parseInt(year) || 2557,
        difficulty: parseInt(difficulty) || 3,
        questionText,
        answerText,
        correctAnswer: correctAnswer.toString(),
        images: JSON.stringify(images)
      }
    });

    console.log(`Saved question ${id} successfully to disk and SQLite database.`);

    return NextResponse.json({
      success: true,
      message: `บันทึกข้อสอบ ${id} เรียบร้อยแล้ว`
    });

  } catch (error) {
    console.error('Error in save API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
