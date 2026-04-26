
import React, { useContext } from 'react';
import { AppContext } from '../App';

const StudentDashboard: React.FC = () => {
  const { user, courses, setSelectedCourse, setActiveLesson, setView } = useContext(AppContext);

  const inProgressCourses = courses.slice(0, 2);

  const handleStartLearning = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      const firstLesson = course.syllabus[0]?.lessons[0];
      if (!firstLesson) return;
      setActiveLesson(firstLesson);
      setView('lesson-view');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">My Learning</h1>
        <p className="text-slate-500">Pick up where you left off, {user?.name}.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6">In Progress</h2>
            <div className="space-y-6">
              {inProgressCourses.length > 0 ? inProgressCourses.map((course, idx) => (
                <div 
                  key={course.id} 
                  onClick={() => handleStartLearning(course.id)}
                  className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-3 rounded-2xl transition-colors"
                >
                  <img src={course.imageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                    <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`bg-indigo-600 h-full ${idx === 0 ? 'w-[65%]' : 'w-[20%]'}`}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{idx === 0 ? '65%' : '20%'} Complete</p>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500">No courses in progress yet.</div>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2">7 Day Streak! 🔥</h2>
              <p className="text-indigo-100 mb-8 max-w-sm text-lg">You are on fire! Practice today to keep your streak going and earn a 10% discount on your next course.</p>
              <button className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20">Resume Last Lesson</button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Achievements</h2>
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                  <div className={`w-10 h-10 rounded-full ${i < 4 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400 opacity-30'} flex items-center justify-center`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Upcoming Class</h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Today @ 4:00 PM</p>
              <h4 className="font-bold text-slate-900 leading-tight mb-4">Advanced English Phrasal Verbs</h4>
              <div className="flex items-center gap-3">
                <img src="https://picsum.photos/seed/tutor/50" className="w-8 h-8 rounded-full shadow-sm" />
                <span className="text-sm font-medium text-slate-600">Sarah Collins</span>
              </div>
              <button className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all">Join Zoom Class</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
