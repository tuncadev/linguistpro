
import React, { useContext } from 'react';
import { AppContext } from '../App';
import Hero from '../components/Hero';
import LanguageCard from '../components/LanguageCard';
import { Search, Users, Trophy, Sparkles } from 'lucide-react';

const HomeView: React.FC = () => {
  const { setView, setSelectedLang, languages } = useContext(AppContext);

  const steps = [
    { icon: Search, title: 'Tailored Programs', desc: 'Find specialized courses for travel, business, or academic certification.' },
    { icon: Sparkles, title: 'Immersive Learning', desc: 'Practice with native speakers in real-world scenarios through our virtual campus.' },
    { icon: Users, title: 'Expert Faculty', desc: 'Every Catalina tutor is a certified professional with years of teaching experience.' },
    { icon: Trophy, title: 'Global Certification', desc: 'Earn recognized diplomas that open doors to international opportunities.' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <Hero />

      {/* Language Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-[#2d3e50] mb-4 tracking-tight">Our Language Faculties</h2>
            <p className="text-slate-600">Explore our comprehensive departments and find your native-level fluency.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {languages.map(lang => (
              <LanguageCard 
                key={lang.id} 
                language={lang} 
                onClick={() => {
                  setSelectedLang(lang);
                  setView('language-landing');
                  window.scrollTo(0,0);
                }} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800" 
                className="rounded-[2.5rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" 
                alt="Dedicated studying at Catalina Academy" 
              />
            </div>
            <div className="lg:w-1/2 space-y-12">
              <div>
                <h2 className="text-4xl font-black text-[#2d3e50] mb-6 leading-tight">Beyond Just Words: <br /><span className="text-[#f47361]">Cultural Fluency.</span></h2>
                <p className="text-slate-600 text-lg leading-relaxed">At Catalina Academy, we don't just teach grammar. we prepare you for the nuances of cultural communication in a globalized world.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                {steps.map((step, i) => (
                  <div key={i} className="space-y-3 group">
                    <div className="w-12 h-12 bg-[#f47361]/10 text-[#f47361] rounded-xl flex items-center justify-center group-hover:bg-[#f47361] group-hover:text-white transition-colors">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-[#2d3e50]">{step.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 bg-[#2d3e50] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f47361]/5 skew-x-12 transform translate-x-1/2"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Ready to join our next intake?</h2>
          <button 
            onClick={() => setView('catalog')}
            className="bg-[#f47361] text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-[#e06352] transition-all shadow-2xl shadow-black/20"
          >
            Enroll in a Course Today
          </button>
          <p className="mt-8 text-slate-400 font-medium text-sm">
            Official Catalina Academy Certification Included
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wide text-slate-300">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</a>
            <a href="/support" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
