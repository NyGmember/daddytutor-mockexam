import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

    const questionPath = path.join(process.cwd(), '..', 'questions', `${id}.md`);
    const answerPath = path.join(process.cwd(), '..', 'answers', `${id}.md`);

    if (!fs.existsSync(questionPath) || !fs.existsSync(answerPath)) {
      return NextResponse.json({ error: 'Question or Answer file not found' }, { status: 404 });
    }

    const questionText = fs.readFileSync(questionPath, 'utf8');
    const answerContent = fs.readFileSync(answerPath, 'utf8');

    // Parse YAML frontmatter in answer
    const parts = answerContent.split('---');
    if (parts.length < 3) {
      return NextResponse.json({ error: 'Invalid answer file format (missing frontmatter)' }, { status: 500 });
    }

    const yamlText = parts[1];
    const answerText = parts.slice(2).join('---').trim();
    const metadata = parseYaml(yamlText);

    // Map Thai values to database IDs
    const subject = metadata.subject || 'คณิตศาสตร์';
    const levelStr = metadata.level || '';
    
    let subjectId = 'mathematics';
    if (subject === 'วิทยาศาสตร์' || subject.toLowerCase() === 'science') {
      subjectId = 'science';
    }

    let levelId = '';
    if (subjectId === 'mathematics') {
      if (levelStr.includes('ประถม')) levelId = 'math_primary';
      else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'math_upper_secondary';
      else levelId = 'math_lower_secondary';
    } else {
      if (levelStr.includes('ประถม')) levelId = 'sci_primary';
      else if (levelStr.includes('มัธยมปลาย') || levelStr.includes('G10')) levelId = 'sci_upper_secondary';
      else levelId = 'sci_lower_secondary';
    }

    const questionData = {
      id,
      subjectId,
      levelId,
      topicId: metadata.topic_id || '',
      topicNameTh: metadata.topic_name || '',
      year: parseInt(metadata.year) || 2557,
      difficulty: parseInt(metadata.difficulty) || 3,
      grade: metadata.grade || 'G7',
      correctAnswer: metadata.answer || '',
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
