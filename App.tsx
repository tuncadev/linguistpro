"use client";

import React, { useEffect, useState } from 'react';
import { User, UserRole, Course, Language, Lesson, Level } from './types';
import { LANGUAGES, LEVELS, MOCK_COURSES, MOCK_USERS } from './constants';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StudentDashboard from './views/StudentDashboard';
import TutorDashboard from './views/TutorDashboard';
import AdminDashboard from './views/AdminDashboard';
import CourseCatalog from './views/CourseCatalog';
import HomeView from './views/HomeView';
import AboutView from './views/AboutView';
import LanguageLandingView from './views/LanguageLandingView';
import CourseDetailsView from './views/CourseDetailsView';
import TutorProfileView from './views/TutorProfileView';
import LessonView from './views/LessonView';
import { fetchPublishedCourses } from './services/courseApiService';
import { fetchSessionUser } from './services/authApiService';
import { fetchTaxonomies } from './services/taxonomyApiService';
import { fetchTutors } from './services/tutorApiService';
import { fetchDemoUsers } from './services/demoUserApiService';

export const AppContext = React.createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
  demoUsers: User[];
  setDemoUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tutors: User[];
  setTutors: React.Dispatch<React.SetStateAction<User[]>>;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  languages: Language[];
  setLanguages: React.Dispatch<React.SetStateAction<Language[]>>;
  levels: Level[];
  setLevels: React.Dispatch<React.SetStateAction<Level[]>>;
  view: string;
  setView: (v: string) => void;
  selectedLang: Language | null;
  setSelectedLang: (l: Language | null) => void;
  selectedCourse: Course | null;
  setSelectedCourse: (c: Course | null) => void;
  selectedTutor: User | null;
  setSelectedTutor: (t: User | null) => void;
  activeLesson: Lesson | null;
  setActiveLesson: (l: Lesson | null) => void;
}>({
  user: null,
  setUser: () => {},
  demoUsers: [],
  setDemoUsers: () => {},
  tutors: [],
  setTutors: () => {},
  courses: [],
  setCourses: () => {},
  languages: [],
  setLanguages: () => {},
  levels: [],
  setLevels: () => {},
  view: 'home',
  setView: () => {},
  selectedLang: null,
  setSelectedLang: () => {},
  selectedCourse: null,
  setSelectedCourse: () => {},
  selectedTutor: null,
  setSelectedTutor: () => {},
  activeLesson: null,
  setActiveLesson: () => {},
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [tutors, setTutors] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [view, setView] = useState<string>('home');
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<User | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogData = async () => {
      const [fetchedCourses, fetchedTaxonomies, fetchedTutors, fetchedDemoUsers] = await Promise.all([
        fetchPublishedCourses(),
        fetchTaxonomies(),
        fetchTutors(),
        fetchDemoUsers(),
      ]);

      if (!isMounted) return;

      if (fetchedCourses && fetchedCourses.length > 0) {
        setCourses(fetchedCourses);
      } else {
        setCourses(MOCK_COURSES);
      }

      if (fetchedTaxonomies && fetchedTaxonomies.languages.length > 0) {
        setLanguages(fetchedTaxonomies.languages);
      } else {
        setLanguages(LANGUAGES);
      }

      if (fetchedTaxonomies && fetchedTaxonomies.levels.length > 0) {
        setLevels(fetchedTaxonomies.levels);
      } else {
        setLevels(LEVELS);
      }

      if (fetchedTutors && fetchedTutors.length > 0) {
        setTutors(fetchedTutors);
      } else {
        setTutors(MOCK_USERS.filter((candidate) => candidate.role === UserRole.TUTOR));
      }

      if (fetchedDemoUsers && fetchedDemoUsers.length > 0) {
        setDemoUsers(fetchedDemoUsers);
      } else {
        setDemoUsers(MOCK_USERS);
      }
    };

    void loadCatalogData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const sessionUser = await fetchSessionUser();
      if (!isMounted) return;
      if (sessionUser) {
        setUser(sessionUser);
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView />;
      case 'about': return <AboutView />;
      case 'language-landing': return <LanguageLandingView />;
      case 'course-details': return <CourseDetailsView />;
      case 'tutor-profile': return <TutorProfileView />;
      case 'lesson-view': return <LessonView />;
      case 'dashboard':
        if (!user) return <HomeView />;
        if (user.role === UserRole.ADMIN) return <AdminDashboard />;
        if (user.role === UserRole.TUTOR) return <TutorDashboard />;
        return <StudentDashboard />;
      case 'catalog':
        return <CourseCatalog />;
      default:
        return <HomeView />;
    }
  };

  const showSidebar = user && !['lesson-view'].includes(view);

  return (
    <AppContext.Provider value={{ 
      user, setUser, 
      demoUsers, setDemoUsers,
      tutors, setTutors,
      courses, setCourses, 
      languages, setLanguages,
      levels, setLevels,
      view, setView,
      selectedLang, setSelectedLang,
      selectedCourse, setSelectedCourse,
      selectedTutor, setSelectedTutor,
      activeLesson, setActiveLesson
    }}>
      <div className="flex flex-col min-h-screen bg-white">
        {view !== 'lesson-view' && <Navbar />}
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && <Sidebar />}
          <main className="flex-1 overflow-y-auto bg-slate-50">
            {renderView()}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;
