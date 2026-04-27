
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { generateCourseDetails } from '../services/geminiService';
import { Course } from '../types';

const TutorDashboard: React.FC = () => {
  const { user, courses, languages, levels, setCourses } = useContext(AppContext);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const myCourses = courses.filter(c => c.tutorId === user?.id);

  useEffect(() => {
    if (!selectedLang && languages.length > 0) {
      setSelectedLang(languages[0].id);
    }
  }, [languages, selectedLang]);

  useEffect(() => {
    if (!selectedLevel && levels.length > 0) {
      setSelectedLevel(levels[0].id);
    }
  }, [levels, selectedLevel]);

  const handleGenerate = async () => {
    if (!topic || !selectedLang || !selectedLevel) return;
    setIsGenerating(true);
    const langObj = languages.find(l => l.id === selectedLang);
    const levelObj = levels.find(v => v.id === selectedLevel);
    
    const result = await generateCourseDetails(topic, langObj?.name || 'English', levelObj?.name || 'A1');
    
    if (result) {
      // FIX: Added missing properties 'rating', 'reviews', and 'syllabus' to comply with the Course interface.
      const newCourse: Course = {
        id: `c${Date.now()}`,
        title: result.title,
        description: result.description,
        price: result.price || 49.99,
        imageUrl: `https://picsum.photos/seed/${topic}/600/400`,
        tutorId: user!.id,
        languageId: selectedLang,
        levelId: selectedLevel,
        studentCount: 0,
        rating: 5.0,
        reviews: 0,
        syllabus: (result.syllabus || []).map((s: string, i: number) => ({
          id: `s-${Date.now()}-${i}`,
          title: s,
          lessons: []
        }))
      };
      setCourses(prev => [newCourse, ...prev]);
    } else {
      alert("AI draft generation is unavailable. Ensure the server API endpoint is running and configured.");
    }
    setIsGenerating(false);
    setTopic('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Tutor Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name}. Manage your courses and students.</p>
        </div>
        <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="text-right">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Revenue</p>
            <p className="text-2xl font-black text-slate-900">$12,450</p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Course Architect
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Language</label>
            <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Level</label>
            <select 
              value={selectedLevel} 
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {levels.map(l => <option key={l.id} value={l.id}>{l.name} - {l.description}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic or Theme</label>
            <input 
              type="text" 
              placeholder="e.g. Cooking for Beginners" 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic || !selectedLang || !selectedLevel}
          className="mt-6 w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Generate Draft Course
            </>
          )}
        </button>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">My Published Courses</h2>
        <div className="grid grid-cols-1 gap-4">
          {myCourses.map(course => (
            <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
              <img src={course.imageUrl} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{course.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{course.studentCount} Students</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-500">${course.price}</span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TutorDashboard;
