-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TUTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'QUIZ', 'READING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "rating" DOUBLE PRECISION,
    "studentCount" INTEGER,
    "coursesAuthored" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "tutorId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyllabusSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "SyllabusSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "type" "LessonType" NOT NULL,
    "content" TEXT,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Level_name_key" ON "Level"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Level_slug_key" ON "Level"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_courseId_studentId_key" ON "Enrollment"("courseId", "studentId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusSection" ADD CONSTRAINT "SyllabusSection_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "SyllabusSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

