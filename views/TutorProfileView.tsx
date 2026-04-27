
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Star, Users, Video, BookOpen, MapPin, Globe, CheckCircle } from 'lucide-react';

const TutorProfileView: React.FC = () => {
  const { selectedTutor, courses, setView, setSelectedCourse } = useContext(AppContext);

  if (!selectedTutor) return null;

  const tutorCourses = courses.filter(c => c.tutorId === selectedTutor.id);

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3 space-y-10">
          <div className="text-center lg:text-left">
            <img 
              src={selectedTutor.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'} 
              className="w-56 h-56 rounded-[4rem] border-8 border-white shadow-2xl mx-auto lg:mx-0 object-cover mb-8" 
              alt={selectedTutor.name}
            />
            <h1 className="text-4xl font-black text-[#2d3e50] mb-2 tracking-tight">{selectedTutor.name}</h1>
            <p className="text-[#f47361] font-black uppercase tracking-[0.2em] text-xs mb-6">Catalina Senior Fellow</p>
            <div className="flex flex-col gap-3 text-slate-500 mb-10 items-center lg:items-start">
              <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4 text-[#f47361]" /> Barcelona, Spain HQ</span>
              <span className="flex items-center gap-2 text-sm font-medium"><Globe className="w-4 h-4 text-[#ffb821]" /> Trilingual (ES, EN, FR)</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-black text-[#2d3e50]">{selectedTutor.studentCount?.toLocaleString()}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Graduates</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-black text-[#f47361]">{selectedTutor.rating ?? '-'}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-[#2d3e50] p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f47361]/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="text-xl font-black uppercase tracking-widest relative z-10">Faculty Profile</h3>
            <p className="text-slate-300 text-sm leading-relaxed relative z-10">{selectedTutor.bio || 'Profile details are being updated.'}</p>
            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
               {[
                 'Accredited by National Board',
                 'Linguistic Research Fellow',
                 'Catalina Impact Award 2023',
                 'Advanced Curriculum Designer'
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-white/80">
                   <CheckCircle className="w-4 h-4 text-[#f47361]" />
                   <span>{item}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 space-y-16">
          <section>
            <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-5">
              <h2 className="text-2xl font-black text-[#2d3e50] uppercase tracking-wide">Course Offerings</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tutorCourses.length} Curriculums</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tutorCourses.map(course => (
                <div 
                  key={course.id} 
                  onClick={() => { setSelectedCourse(course); setView('course-details'); window.scrollTo(0,0); }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group"
                >
                  <div className="h-44 relative">
                    <img src={course.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={course.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-8">
                    <h4 className="font-black text-[#2d3e50] text-lg mb-4 leading-tight group-hover:text-[#f47361] transition-colors">{course.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#ffb821] font-black text-xs uppercase">
                        <Star className="w-4 h-4 fill-current" /> {course.rating}
                      </div>
                      <span className="text-2xl font-black text-[#2d3e50]">${course.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-200 shadow-inner">
            <h2 className="text-2xl font-black text-[#2d3e50] mb-10 uppercase tracking-wide">Pedagogical Approach</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <div className="w-14 h-14 bg-white text-[#f47361] rounded-2xl flex items-center justify-center shadow-lg">
                    <Video className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-[#2d3e50] uppercase tracking-widest text-sm">Visual Integration</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Leveraging the latest in cognitive visual learning to create memory anchors that last a lifetime.</p>
               </div>
               <div className="space-y-4">
                  <div className="w-14 h-14 bg-white text-[#ffb821] rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-[#2d3e50] uppercase tracking-widest text-sm">Active Fluency</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Focusing on high-output conversation practice from day one, rather than passive absorption.</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileView;
