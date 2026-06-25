import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { parseYaml } from '@/lib/yaml';

export async function GET(request) {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing question ID' }, { status: 400 });
    }

    let questionText = '';
    let answerText = '';
    let subjectId = '';
    let levelId = '';
    let topicId = '';
    let topicNameTh = '';
    let year = 2557;
    let difficulty = 3;
    let grade = 'G7';
    let correctAnswer = '';

    const questionPath = path.join(process.cwd(), '..', 'questions', `${id}.md`);
    const answerPath = path.join(process.cwd(), '..', 'answers', `${id}.md`);
    
    const archiveQuestionPath = path.join(process.cwd(), '..', 'archive', 'questions', `${id}.md`);
    const archiveAnswerPath = path.join(process.cwd(), '..', 'archive', 'answers', `${id}.md`);

    if (fs.existsSync(questionPath) && fs.existsSync(answerPath)) {
      // 1. Load active edits from questions/answers directories
      questionText = fs.readFileSync(questionPath, 'utf8');
      const answerContent = fs.readFileSync(answerPath, 'utf8');
      
      const parts = answerContent.split('---');
      if (parts.length < 3) {
        return NextResponse.json({ error: 'Invalid answer file format (missing frontmatter)' }, { status: 500 });
      }

      const yamlText = parts[1];
      answerText = parts.slice(2).join('---').trim();
      const metadata = parseYaml(yamlText);

      // Parse metadata fields
      const subject = metadata.subject || 'คณิตศาสตร์';
      const levelStr = metadata.level || '';
      
      subjectId = (subject === 'วิทยาศาสตร์' || subject.toLowerCase() === 'science') ? 'science' : 'mathematics';

      if (subjectId === 'mathematics') {
        if (levelStr.includes('ประถม')) levelId = 'math_primary';
        else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'math_upper_secondary';
        else levelId = 'math_lower_secondary';
      } else {
        if (levelStr.includes('ประถม')) levelId = 'sci_primary';
        else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'sci_upper_secondary';
        else levelId = 'sci_lower_secondary';
      }

      topicId = metadata.topic_id || '';
      topicNameTh = metadata.topic_name || '';
      year = parseInt(metadata.year) || 2557;
      difficulty = parseInt(metadata.difficulty) || 3;
      grade = metadata.grade || 'G7';
      correctAnswer = metadata.answer || '';
    } else {
      // 2. Try loading from SQLite database (for archived/published questions)
      let dbQ = null;
      try {
        dbQ = await prisma.question.findUnique({
          where: { id },
          include: { topic: true }
        });
      } catch (dbErr) {
        console.warn('Prisma load query failed:', dbErr.message);
      }

      if (dbQ) {
        questionText = dbQ.questionText;
        answerText = dbQ.answerText;
        subjectId = dbQ.subjectId;
        levelId = dbQ.levelId;
        topicId = dbQ.topicId;
        topicNameTh = dbQ.topic?.nameTh || '';
        year = dbQ.year;
        difficulty = dbQ.difficulty;
        correctAnswer = dbQ.correctAnswer;
        
        // Parse grade from ID if possible (e.g. TEDET_Math_2557_G8_1)
        const gradeMatch = id.match(/_(G\d+)_/i);
        grade = gradeMatch ? gradeMatch[1].toUpperCase() : 'G7';
      } else if (fs.existsSync(archiveQuestionPath) && fs.existsSync(archiveAnswerPath)) {
        // 3. Fallback to archive folder on disk
        questionText = fs.readFileSync(archiveQuestionPath, 'utf8');
        const answerContent = fs.readFileSync(archiveAnswerPath, 'utf8');
        
        const parts = answerContent.split('---');
        if (parts.length < 3) {
          return NextResponse.json({ error: 'Invalid archived answer file format' }, { status: 500 });
        }

        const yamlText = parts[1];
        answerText = parts.slice(2).join('---').trim();
        const metadata = parseYaml(yamlText);

        const subject = metadata.subject || 'คณิตศาสตร์';
        const levelStr = metadata.level || '';
        
        subjectId = (subject === 'วิทยาศาสตร์' || subject.toLowerCase() === 'science') ? 'science' : 'mathematics';

        if (subjectId === 'mathematics') {
          if (levelStr.includes('ประถม')) levelId = 'math_primary';
          else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'math_upper_secondary';
          else levelId = 'math_lower_secondary';
        } else {
          if (levelStr.includes('ประถม')) levelId = 'sci_primary';
          else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'sci_upper_secondary';
          else levelId = 'sci_lower_secondary';
        }

        topicId = metadata.topic_id || '';
        topicNameTh = metadata.topic_name || '';
        year = parseInt(metadata.year) || 2557;
        difficulty = parseInt(metadata.difficulty) || 3;
        grade = metadata.grade || 'G7';
        correctAnswer = metadata.answer || '';
      } else {
        return NextResponse.json({ error: 'Question not found on disk, database, or archive' }, { status: 404 });
      }
    }

    const questionData = {
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
      answerText
    };

    return NextResponse.json({
      success: true,
      question: questionData
    });

  } catch (error) {
    console.error('Error in load API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
