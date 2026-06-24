const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding subjects and levels...');

  // 1. Seed Subjects
  const subjects = [
    { id: 'mathematics', nameTh: 'คณิตศาสตร์' },
    { id: 'science', nameTh: 'วิทยาศาสตร์' },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { id: s.id },
      update: { nameTh: s.nameTh },
      create: s,
    });
  }

  // 2. Seed Levels
  const levels = [
    // Mathematics Levels
    { id: 'math_primary', nameTh: 'ประถมศึกษา', subjectId: 'mathematics' },
    { id: 'math_lower_secondary', nameTh: 'มัธยมศึกษาตอนต้น', subjectId: 'mathematics' },
    { id: 'math_upper_secondary', nameTh: 'มัธยมศึกษาตอนปลาย', subjectId: 'mathematics' },
    // Science Levels
    { id: 'sci_primary', nameTh: 'ประถมศึกษา', subjectId: 'science' },
    { id: 'sci_lower_secondary', nameTh: 'มัธยมศึกษาตอนต้น', subjectId: 'science' },
    { id: 'sci_upper_secondary', nameTh: 'มัธยมศึกษาตอนปลาย', subjectId: 'science' },
  ];

  for (const l of levels) {
    await prisma.level.upsert({
      where: { id: l.id },
      update: { nameTh: l.nameTh, subjectId: l.subjectId },
      create: l,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
