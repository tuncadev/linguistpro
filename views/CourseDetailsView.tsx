
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { MOCK_USERS, LANGUAGES, LEVELS } from '../constants';
import { Star, Clock, Users, ChevronDown, ChevronRight, CheckCircle, Award, Play } from 'lucide-react';

const CourseDetailsView: React.FC = () => {
  const { selectedCourse, setView, setSelectedTutor, setActiveLesson, user } = useContext(AppContext);
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!selectedCourse) return null;

  const tutor = MOCK_USERS.find(u => u.id === selectedCourse.tutorId);
  const language = LANGUAGES.find(l => l.id === selectedCourse.languageId);
  const level = LEVELS.find(v => v.id === selectedCourse.levelId);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#2d3e50] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3 space-y-6">
              <nav className="flex items-center gap-2 text-[#f47361] text-sm font-bold mb-4 uppercase tracking-widest">
                <button onClick={() => setView('catalog')} className="hover:text-white">Courses</button>
                <ChevronRight className="w-4 h-4" />
                <span>{language?.name}</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">{selectedCourse.title}</h1>
              <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">{selectedCourse.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#ffb821] fill-[#ffb821]" />
                  <span className="font-bold">{selectedCourse.rating}</span>
                  <span className="text-slate-400">({selectedCourse.reviews} verified reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5 text-[#f47361]" />
                  <span>{selectedCourse.studentCount} currently learning</span>
                </div>
                <span className="bg-[#f47361] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{level?.name} Level</span>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <img 
                  src={tutor?.avatar} 
                  className="w-14 h-14 rounded-full border-2 border-[#f47361] cursor-pointer object-cover shadow-xl" 
                  onClick={() => { setSelectedTutor(tutor!); setView('tutor-profile'); window.scrollTo(0,0); }}
                  alt={tutor?.name}
                />
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Director</p>
                  <button 
                    onClick={() => { setSelectedTutor(tutor!); setView('tutor-profile'); window.scrollTo(0,0); }}
                    className="text-lg font-bold hover:text-[#f47361] transition-colors"
                  >
                    {tutor?.name}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3 space-y-12">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black text-[#2d3e50] mb-8">Learning Objectives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  'Master essential conversational idioms',
                  'Professional and formal communication skills',
                  'Deep cultural immersion and history',
                  'Phonetic mastery and accent reduction',
                  'Practical vocabulary for daily life',
                  'Catalina Academy Official Certification'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#2d3e50] mb-6">Curriculum Breakdown</h2>
              <div className="space-y-4">
                {selectedCourse.syllabus.map((section) => (
                  <div key={section.id} className="border border-slate-200 rounded-3xl overflow-hidden bg-white hover:border-[#f47361] transition-colors group">
                    <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-7 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-5 text-left">
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSection === section.id ? 'rotate-180 text-[#f47361]' : ''}`} />
                        <span className="font-black text-[#2d3e50] uppercase tracking-wide">{section.title}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{section.lessons.length} Modules</span>
                    </button>
                    {openSection === section.id && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50 bg-slate-50/50">
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id} className="p-5 pl-14 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <Play className="w-4 h-4 text-[#f47361]" />
                              <span className="text-sm font-bold text-slate-700">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden sticky top-24">
              <div className="relative aspect-video">
                <img src={selectedCourse.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-[#2d3e50]/40 flex items-center justify-center group-hover:bg-[#2d3e50]/20 transition-all">
                  <button className="bg-[#f47361] p-5 rounded-full text-white shadow-2xl scale-100 hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-current" />
                  </button>
                </div>
              </div>
              <div className="p-10 space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tuition Fee</p>
                    <span className="text-5xl font-black text-[#2d3e50]">${selectedCourse.price}</span>
                  </div>
                  <span className="text-[#f47361] font-black text-sm uppercase">65% Off Enrollment</span>
                </div>
                
                <button 
                  onClick={() => { if (user) { setActiveLesson(selectedCourse.syllabus[0].lessons[0]); setView('lesson-view'); } else { alert("Admissions require a Student account."); } }}
                  className="w-full bg-[#f47361] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#e06352] transition-all shadow-xl shadow-[#f47361]/20"
                >
                  Enroll Today
                </button>
                
                <div className="space-y-5 pt-8 border-t border-slate-100">
                  <p className="text-xs font-black text-[#2d3e50] uppercase tracking-widest">Enrollment Includes:</p>
                  {[
                    { icon: Clock, label: 'Lifetime curriculum access' },
                    { icon: Award, label: 'Catalina Professional Certificate' },
                    { icon: Users, label: 'Private Discord community' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                      <item.icon className="w-4 h-4 text-[#ffb821]" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsView;
