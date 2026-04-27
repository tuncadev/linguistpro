
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { UserRole } from '../types';

const Sidebar: React.FC = () => {
  const { user, view, setView } = useContext(AppContext);

  const menuItems = [
    { id: 'catalog', label: 'Course Catalog', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', roles: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN] },
    { id: 'dashboard', label: 'My Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN] },
  ];

  const adminItems = [
    { id: 'catalog', label: 'Courses Page', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', targetView: 'catalog' },
    { id: 'admin-tutors', label: 'Tutors Page', icon: 'M5.121 17.804A7.97 7.97 0 0112 14a7.97 7.97 0 016.879 3.804M15 11a3 3 0 11-6 0 3 3 0 016 0z', path: '/admin/tutors' },
    { id: 'admin-users', label: 'Manage Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: '/admin/users' },
    { id: 'admin-taxonomies', label: 'Taxonomies', icon: 'M7 7h10M7 12h10m-7 5h7M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z', path: '/admin/taxonomies' },
  ];

  const filteredMenu = menuItems.filter(item => !user || item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
      <div className="p-4 space-y-1">
        <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</p>
        {filteredMenu.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              view === item.id 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}

        {user?.role === UserRole.ADMIN && (
          <>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administration</p>
              {adminItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ('targetView' in item && item.targetView) {
                      setView(item.targetView);
                      return;
                    }
                    if ('path' in item && item.path) {
                      window.location.href = item.path;
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    'targetView' in item && item.targetView === view
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-auto p-4">
        <div className="bg-indigo-900 rounded-xl p-4 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="font-bold text-sm mb-1">Go Pro</h4>
            <p className="text-xs text-indigo-200 mb-3 leading-relaxed">Unlock advanced learning tools & certificates.</p>
            <button className="bg-white text-indigo-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">Upgrade Now</button>
          </div>
          <div className="absolute -right-4 -bottom-4 bg-indigo-800 w-20 h-20 rounded-full opacity-50 blur-xl"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
