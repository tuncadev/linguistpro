
import React, { useEffect, useState } from 'react';
import { User, UserRole, Course, Language, Lesson } from './types';
import { MOCK_COURSES } from './constants';
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

export const AppContext = React.createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
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
  courses: [],
  setCourses: () => {},
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [view, setView] = useState<string>('home');
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<User | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      const fetched = await fetchPublishedCourses();
      if (!isMounted) return;

      if (fetched && fetched.length > 0) {
        setCourses(fetched);
      } else {
        setCourses(MOCK_COURSES);
      }
    };

    void loadCourses();

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
      courses, setCourses, 
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
