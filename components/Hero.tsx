
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { ArrowRight, Globe, PlayCircle } from 'lucide-react';

const Hero: React.FC = () => {
  const { setView } = useContext(AppContext);

  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24 lg:pt-32 lg:pb-40">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#f47361]/10 text-[#f47361] px-4 py-2 rounded-full text-sm font-semibold border border-[#f47361]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f47361] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f47361]"></span>
              </span>
              Official Catalina Academy Language School
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-[#2d3e50] leading-[1.1] tracking-tight">
              Unlock Your <br />
              <span className="text-[#f47361] italic">Global Potential.</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-xl leading-relaxed">
              Experience language learning redefined. From conversational fluency to professional certification, master the world with our expert tutors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setView('catalog')}
                className="bg-[#f47361] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#e06352] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#f47361]/20"
              >
                Browse Our Courses <ArrowRight className="w-5 h-5" />
              </button>
              <button className="bg-white text-[#2d3e50] border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <PlayCircle className="w-5 h-5" /> Meet Our Faculty
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
                ].map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    className="w-12 h-12 rounded-full border-4 border-white object-cover" 
                    alt={`Student ${i}`} 
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-500">
                Join <span className="text-[#2d3e50] font-bold">12,000+</span> graduates worldwide
              </p>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#f47361] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#ffb821] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            
            <div className="relative glass p-4 rounded-3xl border border-white/50 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" 
                className="rounded-2xl w-full object-cover shadow-inner aspect-[4/3]" 
                alt="Catalina Academy interactive classroom environment" 
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 max-w-[240px]">
                <div className="bg-[#ffb821]/10 p-2 rounded-xl text-[#ffb821]">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accredited</p>
                  <p className="text-sm font-bold text-[#2d3e50]">Global Language Standards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
