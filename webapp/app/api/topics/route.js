import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { parseYaml } from '@/lib/yaml';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const levelId = searchParams.get('levelId');

  if (!subjectId || !levelId) {
    return NextResponse.json({ error: 'Missing subjectId or levelId' }, { status: 400 });
  }

  try {
    // 1. Read and parse configuration.md
    const configPath = path.join(process.cwd(), '..', 'configuration.md');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'configuration.md not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const match = fileContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) {
      return NextResponse.json({ error: 'YAML frontmatter not found' }, { status: 500 });
    }

    const configObj = parseYaml(match[1]);
    const subjects = configObj?.system_config?.subjects || [];
    const subject = subjects.find(s => s.id === subjectId);
    
    let configTopics = [];
    if (subject) {
      const configLvlId = levelId.replace('math_', '').replace('sci_', '');
      if (subjectId === 'mathematics') {
        const level = subject.levels?.find(l => l.id === configLvlId);
        configTopics = level?.topics || [];
      } else { // science
        if (configLvlId === 'primary') {
          const level = subject.levels?.find(l => l.id === 'primary');
          const category = level?.categories?.find(c => c.id === 'general_science');
          configTopics = category?.topics || [];
        } else { // secondary -> lower_secondary or upper_secondary
          const level = subject.levels?.find(l => l.id === 'secondary');
          if (level) {
            if (configLvlId === 'lower_secondary') {
              const category = level.categories?.find(c => c.id === 'general_science');
              configTopics = category?.topics || [];
            } else if (configLvlId === 'upper_secondary') {
              const upperCategories = level.categories?.filter(c => c.id !== 'general_science') || [];
              const allTopics = [];
              for (const cat of upperCategories) {
                if (Array.isArray(cat.topics)) {
                  allTopics.push(...cat.topics);
                }
              }
              configTopics = allTopics;
            }
          }
        }
      }
    }

    // 2. Fetch counts from database for this subject + level
    const questionCounts = await prisma.question.groupBy({
      by: ['topicId'],
      where: {
        subjectId: subjectId,
        levelId: levelId
      },
      _count: {
        id: true
      }
    });

    const countsMap = new Map(questionCounts.map(item => [item.topicId, item._count.id]));

    // 3. Map topics with counts
    const topicsWithCount = configTopics.map(topic => ({
      id: topic.id,
      nameTh: topic.name_th || topic.nameTh || '',
      count: countsMap.get(topic.id) || 0
    }));

    return NextResponse.json(topicsWithCount);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
