
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { MOCK_USERS } from '../constants';
import { UserRole } from '../types';
import { LayoutGrid, Info, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, setUser, setView, view } = useContext(AppContext);

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => { setView('home'); window.scrollTo(0,0); }}
        >
          {/* Logo Recreation based on Image 2 */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* The "C" Speech Bubble */}
              <path d="M70,30 C70,15 55,5 35,5 C15,5 0,15 0,30 C0,40 8,50 20,55 L15,75 L40,60 L40,60 C55,60 70,50 70,35" fill="#2d3e50" />
              <text x="14" y="42" className="text-[32px] font-black fill-white select-none" style={{ fontFamily: 'Inter, sans-serif' }}>C</text>
              {/* The "A" Icon */}
              <path d="M50,45 L75,45 L100,95 L75,95 L68,80 L57,80 L50,95 L25,95 Z" fill="#f47361" />
              <text x="62" y="75" className="text-[24px] font-bold fill-white select-none" style={{ fontFamily: 'Inter, sans-serif' }}>A</text>
            </svg>
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-black text-[#2d3e50] tracking-tighter uppercase">Catalina</span>
            <span className="text-[10px] font-bold text-[#f47361] tracking-[0.2em] uppercase">Academy</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <button 
            onClick={() => setView('catalog')}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${view === 'catalog' ? 'text-[#f47361]' : 'text-slate-600 hover:text-[#2d3e50]'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Courses
          </button>
          <button 
            onClick={() => setView('about')}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${view === 'about' ? 'text-[#f47361]' : 'text-slate-600 hover:text-[#2d3e50]'}`}
          >
            <Info className="w-4 h-4" /> About Us
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 bg-slate-100 p-1.5 rounded-full border border-slate-200">
          <button
            onClick={() => { setUser(null); setView('home'); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!user ? 'bg-white text-[#f47361] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Guest
          </button>
          {MOCK_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setUser(u);
                setView('catalog');
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                user?.id === u.id 
                  ? 'bg-white text-[#f47361] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {u.role}
            </button>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <button onClick={() => setView('dashboard')} className="hidden sm:block text-right group">
              <p className="text-sm font-black text-slate-800 group-hover:text-[#f47361] transition-colors">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{user.role}</p>
            </button>
            <img 
              src={user.avatar} 
              className="w-11 h-11 rounded-full border-2 border-[#f47361] object-cover shadow-lg" 
              alt="User avatar" 
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button className="text-slate-600 font-bold text-sm px-4 py-2 hover:text-[#2d3e50] transition-colors">Log In</button>
            <button className="bg-[#2d3e50] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#1a2530] transition-all shadow-xl shadow-slate-200">Start Free Trial</button>
          </div>
        )}
        
        <button className="lg:hidden p-2 text-slate-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
