import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../App';
import {
  AdminDashboardOverview,
  fetchAdminDashboardOverview,
} from '../services/adminDashboardApiService';

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / dayMs));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const AdminDashboard: React.FC = () => {
  const { courses } = useContext(AppContext);
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      const payload = await fetchAdminDashboardOverview();
      if (!isMounted) {
        return;
      }
      setOverview(payload);
    };

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedRevenue = useMemo(() => {
    const revenue = overview?.stats.totalRevenue;
    if (typeof revenue !== 'number') {
      return '$84,200';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(revenue);
  }, [overview]);

  const stats = [
    {
      label: 'Total Users',
      value: (overview?.stats.totalUsers ?? 1284).toString(),
      change: overview ? `${overview.stats.totalEnrollments} enrollments` : '+12%',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      label: 'Courses',
      value: (overview?.stats.totalCourses ?? courses.length).toString(),
      change: overview ? `${overview.recentSubmissions.length} recent` : '+2',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      label: 'Revenue',
      value: formattedRevenue,
      change: overview ? 'Live' : '+18.5%',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const recentSubmissions = overview?.recentSubmissions ?? [];
  const activity =
    overview?.activity ??
    [
      { id: 'fallback-1', message: 'New student enrollment in "Mastering Spanish"', createdAt: new Date().toISOString() },
      { id: 'fallback-2', message: 'Tutor "Prof. Elena" updated curriculum', createdAt: new Date(Date.now() - 15 * 60_000).toISOString() },
      { id: 'fallback-3', message: 'System backup completed successfully', createdAt: new Date(Date.now() - 60 * 60_000).toISOString() },
    ];

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Console</h1>
        <p className="text-slate-500">Global overview and system health.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Course Submissions</h2>
            <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-50">
            {(recentSubmissions.length > 0 ? recentSubmissions : courses.slice(0, 3).map((course) => ({
              id: course.id,
              title: course.title,
              tutorId: course.tutorId,
              tutorName: course.tutorId,
              status: 'PUBLISHED',
              createdAt: new Date().toISOString(),
            }))).map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                    <p className="text-xs text-slate-500">Submission by {c.tutorName} ({c.status})</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Reject">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold">System Logs</h2>
          </div>
          <div className="p-6 space-y-4">
            {activity.map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className="w-1 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{log.message}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{formatRelativeTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
