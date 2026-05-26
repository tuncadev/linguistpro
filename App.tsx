"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, UserRole, Course, Language, Lesson, Level } from './types';
import { LANGUAGES, LEVELS, MOCK_USERS } from './constants';
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

type AppProps = {
  initialView?: string;
};

const App: React.FC<AppProps> = ({ initialView = 'home' }) => {
  const tLoader = useTranslations('loaders.appBoot');
  const txLoader = (key: string, fallback: string) => (tLoader.has(key) ? tLoader(key) : fallback);
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [tutors, setTutors] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [view, setView] = useState<string>(initialView);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<User | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogData = async () => {
      try {
        const [fetchedCourses, fetchedTaxonomies, fetchedTutors, fetchedDemoUsers] = await Promise.all([
          fetchPublishedCourses(),
          fetchTaxonomies(),
          fetchTutors(),
          fetchDemoUsers(),
        ]);

        if (!isMounted) return;

        if (fetchedCourses !== null) {
          setCourses(fetchedCourses);
        } else {
          setCourses([]);
        }

        if (fetchedTaxonomies !== null) {
          setLanguages(fetchedTaxonomies.languages);
          setLevels(fetchedTaxonomies.levels);
        } else {
          setLanguages(LANGUAGES);
          setLevels(LEVELS);
        }

        if (fetchedTutors !== null) {
          setTutors(fetchedTutors);
        } else {
          setTutors(MOCK_USERS.filter((candidate) => candidate.role === UserRole.TUTOR));
        }

        if (fetchedDemoUsers !== null) {
          setDemoUsers(fetchedDemoUsers);
        } else {
          setDemoUsers(MOCK_USERS);
        }
      } catch {
        if (!isMounted) return;
        setCourses([]);
        setLanguages(LANGUAGES);
        setLevels(LEVELS);
        setTutors(MOCK_USERS.filter((candidate) => candidate.role === UserRole.TUTOR));
        setDemoUsers(MOCK_USERS);
      } finally {
        if (isMounted) {
          setCatalogLoaded(true);
        }
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
      try {
        const sessionUser = await fetchSessionUser();
        if (!isMounted) return;
        if (sessionUser) {
          setUser(sessionUser);
        }
      } finally {
        if (isMounted) {
          setSessionResolved(true);
        }
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

  const showBootLoader = !catalogLoaded || !sessionResolved;

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
      {showBootLoader ? (
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <div className="app-loader-pulse h-11 w-11 rounded-2xl bg-[#2d3e50]" />
                <div className="leading-tight">
                  <p className="text-xl font-black uppercase tracking-tight text-[#2d3e50]">{txLoader('brandPrimary', 'Catalina')}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47361]">{txLoader('brandSecondary', 'Academy')}</p>
                </div>
              </div>
              <div className="mb-5">
                <p className="text-sm font-bold text-slate-700">{txLoader('title', 'Loading your learning workspace...')}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{txLoader('subtitle', 'Preparing courses, tutors, and dashboard data')}</p>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-5/6 rounded-full bg-slate-100" />
                <div className="h-3 w-4/6 rounded-full bg-slate-100" />
                <div className="h-10 w-full rounded-xl bg-slate-100" />
                <div className="h-10 w-full rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen bg-white">
          <main className="flex-1 overflow-y-auto bg-slate-50">
            {renderView()}
          </main>
        </div>
      )}
    </AppContext.Provider>
  );
};

export default App;
