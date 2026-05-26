ALTER TABLE "Course"
ADD COLUMN "learningObjectives" JSONB,
ADD COLUMN "enrollmentIncludes" JSONB,
ADD COLUMN "tuitionLabel" TEXT DEFAULT 'Tuition Fee',
ADD COLUMN "discountLabel" TEXT DEFAULT '65% Off Enrollment',
ADD COLUMN "courseDirectorLabel" TEXT DEFAULT 'Course Director';
