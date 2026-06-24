const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Simple YAML frontmatter parser for Node
function parseYaml(yamlText) {
  const lines = yamlText.split('\n');
  const root = {};
  const pathStack = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    const colonIdx = trimmed.indexOf(':');
    let key, val;
    if (colonIdx > -1) {
      key = trimmed.substring(0, colonIdx).trim();
      val = trimmed.substring(colonIdx + 1).trim();
    } else {
      key = trimmed;
      val = '';
    }
    
    const isListItem = key.startsWith('-');
    if (isListItem) {
      key = key.substring(1).trim();
    }
    
    if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
    if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        val = JSON.parse(val);
      } catch (e) {
        val = val.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, ''));
      }
    }
    
    while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent) {
      pathStack.pop();
    }
    
    const parentContainer = pathStack.length > 0 ? pathStack[pathStack.length - 1].container : root;
    
    if (isListItem) {
      let currentItem;
      if (colonIdx > -1) {
        currentItem = {};
        currentItem[key] = val;
      } else {
        currentItem = key;
      }
      
      if (Array.isArray(parentContainer)) {
        parentContainer.push(currentItem);
        if (typeof currentItem === 'object') {
          pathStack.push({ indent, key: null, container: currentItem });
        }
      } else {
        const lastPath = pathStack[pathStack.length - 1];
        if (lastPath && lastPath.key) {
          if (!Array.isArray(parentContainer[lastPath.key])) {
            parentContainer[lastPath.key] = [];
          }
          parentContainer[lastPath.key].push(currentItem);
          if (typeof currentItem === 'object') {
            pathStack.push({ indent, key: null, container: currentItem });
          }
        }
      }
    } else {
      if (val === '') {
        const newContainer = {};
        parentContainer[key] = newContainer;
        pathStack.push({ indent, key, container: newContainer });
      } else {
        parentContainer[key] = val;
        pathStack.push({ indent, key, container: parentContainer });
      }
    }
  }
  return root;
}

function ensureArray(val, key) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val[key] && Array.isArray(val[key])) return val[key];
  return [];
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const configPath = path.join(__dirname, '..', '..', 'configuration.md');
    if (!fs.existsSync(configPath)) {
      throw new Error(`configuration.md not found at ${configPath}`);
    }
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const match = fileContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) {
      throw new Error('YAML frontmatter not found in configuration.md');
    }
    
    const configObj = parseYaml(match[1]);
    const rawSubjects = configObj?.system_config?.subjects || [];
    const subjects = ensureArray(rawSubjects, 'subjects');

    console.log(`Seeding database with ${subjects.length} subjects from configuration.md...`);

    for (const sub of subjects) {
      const subjectId = sub.id;
      const subjectNameTh = sub.name_th || sub.nameTh;
      
      // Upsert Subject
      await prisma.subject.upsert({
        where: { id: subjectId },
        update: { nameTh: subjectNameTh },
        create: { id: subjectId, nameTh: subjectNameTh }
      });
      console.log(`Upserted Subject: ${subjectId} (${subjectNameTh})`);

      const levels = ensureArray(sub.levels, 'levels');
      for (const lvl of levels) {
        const lvlId = lvl.id;
        
        // Map to DB Level ID
        let dbLevelId = '';
        if (subjectId === 'mathematics') {
          dbLevelId = `math_${lvlId}`;
        } else {
          dbLevelId = `sci_${lvlId}`;
        }

        const dbLevelIds = [];
        if (subjectId === 'science' && lvlId === 'secondary') {
          dbLevelIds.push('sci_lower_secondary', 'sci_upper_secondary');
        } else {
          dbLevelIds.push(dbLevelId);
        }

        for (const dlId of dbLevelIds) {
          const dlNameTh = dlId.includes('primary') ? 'ประถมศึกษา' : dlId.includes('lower') ? 'มัธยมศึกษาตอนต้น' : 'มัธยมศึกษาตอนปลาย';
          await prisma.level.upsert({
            where: { id: dlId },
            update: { nameTh: dlNameTh, subjectId },
            create: { id: dlId, nameTh: dlNameTh, subjectId }
          });
          console.log(`  Upserted Level: ${dlId} (${dlNameTh})`);
        }

        // Get topics
        let topicsToUpsert = [];
        if (subjectId === 'mathematics') {
          topicsToUpsert = ensureArray(lvl.topics, 'topics');
        } else { // science
          if (lvlId === 'primary') {
            const categories = ensureArray(lvl.categories, 'categories');
            const category = categories.find(c => c.id === 'general_science');
            topicsToUpsert = ensureArray(category?.topics, 'topics').map(t => ({ ...t, dbLevelId: 'sci_primary' }));
          } else if (lvlId === 'secondary') {
            const categories = ensureArray(lvl.categories, 'categories');
            // general_science is for lower secondary
            const genScienceCat = categories.find(c => c.id === 'general_science');
            const genScienceTopics = ensureArray(genScienceCat?.topics, 'topics').map(t => ({ ...t, dbLevelId: 'sci_lower_secondary' }));
            
            // others are for upper secondary
            const upperCats = categories.filter(c => c.id !== 'general_science') || [];
            const upperTopics = [];
            for (const c of upperCats) {
              const catTopics = ensureArray(c.topics, 'topics');
              upperTopics.push(...catTopics.map(t => ({ ...t, dbLevelId: 'sci_upper_secondary' })));
            }
            topicsToUpsert = [...genScienceTopics, ...upperTopics];
          }
        }

        // Upsert Topics
        for (const topic of topicsToUpsert) {
          const tId = topic.id;
          const tNameTh = topic.name_th || topic.nameTh;
          let targetLevelId = topic.dbLevelId || dbLevelId;
          
          await prisma.topic.upsert({
            where: { id: tId },
            update: { nameTh: tNameTh, levelId: targetLevelId },
            create: { id: tId, nameTh: tNameTh, levelId: targetLevelId }
          });
          console.log(`    Upserted Topic: ${tId} (${tNameTh}) associated with level ${targetLevelId}`);
        }
      }
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
