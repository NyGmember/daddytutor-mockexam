-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameTh" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameTh" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "Level_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameTh" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    CONSTRAINT "Topic_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    CONSTRAINT "Question_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "version" TEXT NOT NULL PRIMARY KEY,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
