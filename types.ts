
export enum UserRole {
  STUDENT = 'STUDENT',
  TUTOR = 'TUTOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  rating?: number;
  studentCount?: number;
  coursesAuthored?: number;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface Level {
  id: string;
  name: string; 
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading';
  content?: string;
}

export interface SyllabusSection {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  tutorId: string;
  languageId: string;
  levelId: string;
  studentCount: number;
  rating: number;
  reviews: number;
  learningObjectives?: string[];
  enrollmentIncludes?: string[];
  tuitionLabel?: string;
  discountLabel?: string;
  courseDirectorLabel?: string;
  syllabus: SyllabusSection[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
}
