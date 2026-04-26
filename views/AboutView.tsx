
import React from 'react';
import { Target, ShieldCheck, Heart, UserPlus } from 'lucide-react';

const TEAM_PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
];

const AboutView: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4">Our Mission</p>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-8">Language is the bridge <br /> to human connection.</h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Founded in 2024, LinguistPro was born out of a simple frustration: language learning felt lonely and disconnected from real-world application. We set out to build a platform that prioritizes human interaction while leveraging the power of AI to accelerate comprehension.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 pt-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-3xl flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Inclusion First</h3>
              <p className="text-sm text-slate-500">We believe everyone should have access to quality education regardless of their location.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Goal Oriented</h3>
              <p className="text-sm text-slate-500">We don't just teach words; we teach the ability to communicate with confidence and purpose.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Quality Assured</h3>
              <p className="text-sm text-slate-500">Every tutor on our platform undergoes a rigorous vetting process to ensure excellence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-black text-slate-900 mb-4">Meet Our Lead Educators</h2>
              <p className="text-slate-600">A global collective of linguists, polyglots, and technologists dedicated to your growth.</p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Join Our Faculty
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Dr. Sarah Miller', role: 'Head of English Pedagogy', bio: 'PhD in Applied Linguistics with 15 years experience in ESL.' },
              { name: 'Mateo Garcia', role: 'Spanish Curriculum Director', bio: 'Award-winning educator focused on conversational fluency.' },
              { name: 'Yuki Sato', role: 'Asian Languages Lead', bio: 'Expert in JLPT preparation and cultural immersion techniques.' },
              { name: 'Amelie Dubois', role: 'European Operations', bio: 'Polyglot fluent in 6 languages, specializing in French phonetics.' },
            ].map((member, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 group">
                <div className="relative mb-6 overflow-hidden rounded-2xl">
                  <img 
                    src={TEAM_PHOTOS[i]} 
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={`Professional profile headshot of ${member.name}, ${member.role}`} 
                  />
                </div>
                <h4 className="text-lg font-bold text-slate-900">{member.name}</h4>
                <p className="text-xs font-bold text-indigo-600 uppercase mb-3">{member.role}</p>
                <p className="text-sm text-slate-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutView;
