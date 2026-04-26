
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { LANGUAGES, LEVELS } from '../constants';

const CourseCatalog: React.FC = () => {
  const { courses, setView, setSelectedCourse } = useContext(AppContext);
  const [filterLang, setFilterLang] = useState<string>('all');

  const filteredCourses = filterLang === 'all' 
    ? courses 
    : courses.filter(c => c.languageId === filterLang);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Explore Courses</h1>
        <p className="text-slate-500">Master new languages with top tutors from around the world.</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => setFilterLang('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterLang === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          All Languages
        </button>
        {LANGUAGES.map(lang => (
          <button 
            key={lang.id}
            onClick={() => setFilterLang(lang.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterLang === lang.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {lang.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map(course => {
          const lang = LANGUAGES.find(l => l.id === course.languageId);
          const level = LEVELS.find(v => v.id === course.levelId);
          
          return (
            <div 
              key={course.id} 
              onClick={() => {
                setSelectedCourse(course);
                setView('course-details');
              }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="relative h-48">
                <img src={course.imageUrl} className="w-full h-full object-cover" alt={course.title} />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight text-slate-900 shadow-sm">{lang?.name}</span>
                  <span className="bg-indigo-600/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight text-white shadow-sm">{level?.name}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 line-clamp-1 text-slate-900 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{course.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900">${course.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.reviews} Reviews</span>
                  </div>
                  <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all">View Details</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCatalog;
