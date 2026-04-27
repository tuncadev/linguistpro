
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { LayoutGrid, Info, Menu } from 'lucide-react';
import { loginUser, logoutUser, registerUser } from '../services/authApiService';

const Navbar: React.FC = () => {
  const { user, setUser, setView, view, demoUsers } = useContext(AppContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const resetAuthForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAuthError(null);
    setAuthNotice(null);
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    resetAuthForm();
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    resetAuthForm();
  };

  const onSubmitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (password !== confirmPassword) {
          setAuthError('Password confirmation does not match.');
          return;
        }
        const registered = await registerUser(name.trim(), email.trim(), password);
        if (registered.verificationRequired) {
          const devTokenHint = registered.verificationToken ? ` Verification token: ${registered.verificationToken}` : '';
          setAuthNotice(
            `${registered.message ?? 'Registration successful. Verify email before login.'}${devTokenHint}`
          );
          setAuthMode('login');
          setPassword('');
          setConfirmPassword('');
          return;
        }

        if (registered.user) {
          setUser(registered.user);
          setView('dashboard');
          closeAuthModal();
        }
      } else {
        const loggedInUser = await loginUser(email.trim(), password);
        setUser(loggedInUser);
        setView('dashboard');
        closeAuthModal();
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const onGuestClick = async () => {
    await logoutUser();
    setUser(null);
    setView('home');
  };

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setView('home'); window.scrollTo(0,0); }}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M70,30 C70,15 55,5 35,5 C15,5 0,15 0,30 C0,40 8,50 20,55 L15,75 L40,60 L40,60 C55,60 70,50 70,35" fill="#2d3e50" />
                <text x="14" y="42" className="text-[32px] font-black fill-white select-none" style={{ fontFamily: 'Inter, sans-serif' }}>C</text>
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
              onClick={onGuestClick}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!user ? 'bg-white text-[#f47361] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Guest
            </button>
            {demoUsers.map((u) => (
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
                src={user.avatar ?? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'} 
                className="w-11 h-11 rounded-full border-2 border-[#f47361] object-cover shadow-lg" 
                alt="User avatar" 
              />
              <button
                onClick={onGuestClick}
                className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#2d3e50] hover:border-slate-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="text-slate-600 font-bold text-sm px-4 py-2 hover:text-[#2d3e50] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="bg-[#2d3e50] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#1a2530] transition-all shadow-xl shadow-slate-200"
              >
                Start Free Trial
              </button>
            </div>
          )}
          
          <button className="lg:hidden p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {showAuthModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <button
            aria-label="Close authentication modal"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeAuthModal}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-[#2d3e50]">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <button
                onClick={closeAuthModal}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl mb-5">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  authMode === 'login' ? 'bg-white text-[#f47361] shadow-sm' : 'text-slate-500'
                }`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
              >
                Log In
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  authMode === 'register' ? 'bg-white text-[#f47361] shadow-sm' : 'text-slate-500'
                }`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
              >
                Register
              </button>
            </div>

            <form className="space-y-3" onSubmit={onSubmitAuth}>
              {authMode === 'register' ? (
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#f47361]"
                />
              ) : null}
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Email address"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Password"
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              {authMode === 'register' ? (
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  placeholder="Confirm password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#f47361]"
                />
              ) : null}

              {authError ? (
                <p className="text-sm font-bold text-red-600">{authError}</p>
              ) : null}
              {authNotice ? (
                <p className="text-xs font-bold text-emerald-700 break-all">{authNotice}</p>
              ) : null}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#2d3e50] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#1a2530] transition-all shadow-xl shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authLoading
                  ? (authMode === 'login' ? 'Signing in...' : 'Creating account...')
                  : (authMode === 'login' ? 'Log In' : 'Create Account')}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
