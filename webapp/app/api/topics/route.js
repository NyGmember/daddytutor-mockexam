import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { parseYaml } from '@/lib/yaml';

function ensureArray(val, key) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val[key] && Array.isArray(val[key])) return val[key];
  return [];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const levelId = searchParams.get('levelId');

  if (!subjectId || !levelId) {
    return NextResponse.json({ error: 'Missing subjectId or levelId' }, { status: 400 });
  }

  try {
    // 1. Read and parse configuration.md
    let configPath = path.join(process.cwd(), '..', 'configuration.md');
    if (!fs.existsSync(configPath)) {
      configPath = path.join(process.cwd(), 'configuration.md');
    }
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'configuration.md not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const match = fileContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) {
      return NextResponse.json({ error: 'YAML frontmatter not found' }, { status: 500 });
    }

    const configObj = parseYaml(match[1]);
    const rawSubjects = configObj?.system_config?.subjects || [];
    const subjects = ensureArray(rawSubjects, 'subjects');
    const subject = subjects.find(s => s.id === subjectId);
    
    let configTopics = [];
    if (subject) {
      const configLvlId = levelId.replace('math_', '').replace('sci_', '');
      const levels = ensureArray(subject.levels, 'levels');

      if (subjectId === 'mathematics') {
        const level = levels.find(l => l.id === configLvlId);
        configTopics = ensureArray(level?.topics, 'topics');
      } else { // science
        if (configLvlId === 'primary') {
          const level = levels.find(l => l.id === 'primary');
          const categories = ensureArray(level?.categories, 'categories');
          const category = categories.find(c => c.id === 'general_science');
          configTopics = ensureArray(category?.topics, 'topics');
        } else { // secondary -> lower_secondary or upper_secondary
          const level = levels.find(l => l.id === 'secondary');
          if (level) {
            const categories = ensureArray(level.categories, 'categories');
            if (configLvlId === 'lower_secondary') {
              const category = categories.find(c => c.id === 'general_science');
              configTopics = ensureArray(category?.topics, 'topics');
            } else if (configLvlId === 'upper_secondary') {
              const upperCategories = categories.filter(c => c.id !== 'general_science') || [];
              const allTopics = [];
              for (const cat of upperCategories) {
                const catTopics = ensureArray(cat.topics, 'topics');
                allTopics.push(...catTopics);
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

    // 2. Fetch all topics from database for this level
    const dbTopics = await prisma.topic.findMany({
      where: {
        levelId: levelId
      }
    });

    // 3. Merge configuration topics and database topics
    const mergedTopics = [...configTopics];
    const existingIds = new Set(configTopics.map(t => t.id));

    for (const dbT of dbTopics) {
      if (!existingIds.has(dbT.id)) {
        mergedTopics.push({
          id: dbT.id,
          name_th: dbT.nameTh,
          description: dbT.nameTh
        });
        existingIds.add(dbT.id);
      }
    }

    // 4. Map topics with counts
    const topicsWithCount = mergedTopics.map(topic => ({
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
