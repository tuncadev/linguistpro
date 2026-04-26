
import { UserRole, Language, Level, Course, User, SyllabusSection } from './types';

export const LANGUAGES: Language[] = [
  { id: 'l1', name: 'English', code: 'EN' },
  { id: 'l2', name: 'Spanish', code: 'ES' },
  { id: 'l3', name: 'French', code: 'FR' },
  { id: 'l4', name: 'Japanese', code: 'JP' },
  { id: 'l5', name: 'German', code: 'DE' },
];

export const LEVELS: Level[] = [
  { id: 'v1', name: 'A1', description: 'Beginner' },
  { id: 'v2', name: 'A2', description: 'Elementary' },
  { id: 'v3', name: 'B1', description: 'Intermediate' },
  { id: 'v4', name: 'B2', description: 'Upper Intermediate' },
  { id: 'v5', name: 'C1', description: 'Advanced' },
  { id: 'v6', name: 'C2', description: 'Proficient' },
];

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Alex Admin', 
    email: 'admin@catalina.edu', 
    role: UserRole.ADMIN, 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' 
  },
  { 
    id: 'u2', 
    name: 'Prof. Elena Rodriguez', 
    email: 'elena@catalina.edu', 
    role: UserRole.TUTOR, 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    bio: 'Dedicated linguist with over 12 years of experience in Spanish immersion and corporate communication training at Catalina Academy.',
    rating: 4.9,
    studentCount: 15400,
    coursesAuthored: 8
  },
  { 
    id: 'u3', 
    name: 'John Smith', 
    email: 'john@gmail.com', 
    role: UserRole.STUDENT, 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' 
  },
];

const SPANISH_SYLLABUS: SyllabusSection[] = [
  {
    id: 's1',
    title: 'Foundations & Greetings',
    lessons: [
      { id: 'ls1', title: 'The Spanish Alphabet & Phonetics', duration: '12:45', type: 'video' },
      { id: 'ls2', title: 'Essential Greetings & Introductions', duration: '08:20', type: 'video' },
      { id: 'ls3', title: 'Quiz: Basic Greetings', duration: '5:00', type: 'quiz' },
    ]
  },
  {
    id: 's2',
    title: 'Daily Life Vocabulary',
    lessons: [
      { id: 'ls4', title: 'At the Restaurant: Ordering Food', duration: '15:10', type: 'video' },
      { id: 'ls5', title: 'Numbers, Time and Dates', duration: '10:30', type: 'video' },
      { id: 'ls6', title: 'Reading: A Day in Madrid', duration: '10:00', type: 'reading' },
    ]
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Mastering Conversational Spanish',
    description: 'A deep dive into everyday Spanish dialogues and essential grammar for travelers. Learn how to navigate real-world scenarios with confidence and cultural nuance.',
    price: 49.99,
    imageUrl: 'https://cdn.leonardo.ai/users/75e0bb81-fe53-49f4-94db-184d4cbb75cb/generations/1f10523c-f37c-6950-8f3c-fae34707a6ae/lucid-origin_In_the_heart_of_Madrid_a_breathtakingly_beautiful_photograph_of_a_historic_stree-0.jpg',
    tutorId: 'u2',
    languageId: 'l2',
    levelId: 'v2',
    studentCount: 154,
    rating: 4.8,
    reviews: 1240,
    syllabus: SPANISH_SYLLABUS
  },
  {
    id: 'c2',
    title: 'Business English for Professionals',
    description: 'Enhance your corporate communication, presentation skills, and professional writing. Perfect for non-native speakers in global environments.',
    price: 89.00,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    tutorId: 'u2',
    languageId: 'l1',
    levelId: 'v4',
    studentCount: 89,
    rating: 4.9,
    reviews: 850,
    syllabus: SPANISH_SYLLABUS
  },
  {
    id: 'c3',
    title: 'French Gastronomy & Language',
    description: 'Learn French through the lens of culinary arts and wine culture. Master cooking vocabulary while mastering the language.',
    price: 55.00,
    imageUrl: 'https://cdn.leonardo.ai/users/75e0bb81-fe53-49f4-94db-184d4cbb75cb/generations/1f105236-0c5b-6540-b837-d338c152e6b3/lucid-origin_In_the_heart_of_Paris_a_breathtakingly_dramatic_painting_captures_the_essence_of-0.jpg',
    tutorId: 'u2',
    languageId: 'l3',
    levelId: 'v1',
    studentCount: 42,
    rating: 4.7,
    reviews: 320,
    syllabus: SPANISH_SYLLABUS
  }
];
