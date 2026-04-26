
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { ChevronLeft, CheckCircle, FileText, Settings, Play, Download, MessageSquare } from 'lucide-react';

const LessonView: React.FC = () => {
  const { selectedCourse, activeLesson, setActiveLesson, setView } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'resources' | 'notes' | 'discussion'>('resources');

  if (!selectedCourse || !activeLesson) return null;

  return (
    <div className="h-screen flex flex-col bg-[#1a2530] overflow-hidden">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#2d3e50]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('course-details')}
            className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex flex-col -space-y-0.5">
             <span className="text-[10px] font-black text-[#f47361] uppercase tracking-[0.2em]">Catalina Academy</span>
             <h1 className="text-xs font-bold text-white truncate max-w-xs">{selectedCourse.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <div className="bg-[#f47361] h-full w-[12%]"></div>
            </div>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">12% Completed</span>
          </div>
          <button className="bg-[#f47361] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#e06352] transition-colors shadow-lg shadow-black/20">
            Exam Ready
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-white/5 bg-[#2d3e50] flex flex-col shadow-2xl">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Syllabus Progress</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {selectedCourse.syllabus.map((section) => (
              <div key={section.id}>
                <div className="px-5 py-3.5 bg-white/5 border-y border-white/5">
                  <span className="text-[10px] font-black text-[#f47361] uppercase tracking-widest">{section.title}</span>
                </div>
                {section.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-center gap-4 px-5 py-5 text-left transition-all border-b border-white/5 ${
                      activeLesson.id === lesson.id ? 'bg-[#f47361]/20 border-l-4 border-l-[#f47361]' : 'text-white/70 hover:bg-white/5 border-l-4 border-l-transparent'
                    }`}
                  >
                    {activeLesson.id === lesson.id ? (
                      <Play className="w-4 h-4 text-[#f47361] fill-current" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-white/10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${activeLesson.id === lesson.id ? 'text-white' : ''}`}>{lesson.title}</p>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1 block">{lesson.duration} Video</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-[#1a2530] overflow-hidden">
          <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
             <div className="absolute inset-0 bg-[#2d3e50]/20 backdrop-blur-sm group-hover:backdrop-blur-0 transition-all"></div>
             <div className="relative z-10 text-center">
                <button className="bg-[#f47361] text-white p-7 rounded-full shadow-2xl hover:scale-110 transition-transform">
                  <Play className="w-12 h-12 fill-current" />
                </button>
                <div className="mt-6 space-y-1">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Module Active</p>
                  <p className="text-white font-black text-lg">{activeLesson.title}</p>
                </div>
             </div>
             
             <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center gap-6 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <Play className="w-5 h-5 cursor-pointer hover:text-[#f47361]" />
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-y-0 left-0 bg-[#f47361] w-[45%]"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black font-mono">04:30 / {activeLesson.duration}</span>
                  <Settings className="w-5 h-5 cursor-pointer hover:text-[#f47361]" />
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-5">
                <div className="flex gap-10">
                  {['resources', 'notes', 'discussion'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`pb-5 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === tab ? 'border-[#f47361] text-[#2d3e50]' : 'border-transparent text-slate-400'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-slate-800">
                {activeTab === 'resources' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Catalina Essential Vocab.pdf', size: '2.4 MB' },
                      { name: 'Conversation Cheat-Sheet.pdf', size: '1.1 MB' },
                    ].map((file, i) => (
                      <div key={i} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between hover:border-[#f47361] transition-all cursor-pointer group shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="bg-[#f47361]/10 p-2.5 rounded-xl text-[#f47361]">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#2d3e50]">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{file.size}</p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-slate-300 group-hover:text-[#f47361] transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <textarea 
                      className="w-full bg-white border border-slate-200 rounded-3xl p-8 text-slate-700 text-sm outline-none focus:ring-4 focus:ring-[#f47361]/10 focus:border-[#f47361] transition-all min-h-[250px] shadow-inner"
                      placeholder="Catalina Academy Smart-Notes: Type key takeaways here..."
                    />
                    <div className="flex justify-end">
                      <button className="bg-[#2d3e50] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#f47361] transition-all">Store Note</button>
                    </div>
                  </div>
                )}
                {activeTab === 'discussion' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-start gap-5 shadow-sm">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=50" className="w-12 h-12 rounded-full object-cover shadow-md" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#2d3e50] uppercase tracking-widest mb-1">Mark Thompson <span className="text-slate-400 ml-3 lowercase font-medium tracking-normal">2 days ago</span></p>
                        <p className="text-sm text-slate-600 leading-relaxed">The grammar breakdown in the second module was incredibly helpful. Does anyone have additional tips for this dialect?</p>
                        <button className="mt-4 text-[10px] text-[#f47361] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                          <MessageSquare className="w-3.5 h-3.5" /> Post Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
