import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { Star, Video, BookOpen, MapPin, Globe, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { TutorPedagogicalModule, TutorStatModule, UserRole } from '../types';
import { updateAdminTutor } from '../services/adminTutorCrudApiService';
import { useTranslations } from 'next-intl';
import {
  DEFAULT_TUTOR_LANGUAGES,
  DEFAULT_TUTOR_LOCATION,
  DEFAULT_TUTOR_PEDAGOGICAL_MODULES,
  DEFAULT_TUTOR_PROFILE_HIGHLIGHTS,
  DEFAULT_TUTOR_PROFILE_STATS,
} from '../lib/tutors/profile-defaults';

type TutorEditDraft = {
  name: string;
  email: string;
  avatarUrl: string;
  password: string;
  location: string;
  languagesSpoken: string;
  bio: string;
  profileHighlights: string[];
  profileStats: TutorStatModule[];
  pedagogicalModules: TutorPedagogicalModule[];
};

function createRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function ensureHighlights(rows: string[]): string[] {
  return rows.length > 0 ? rows : [''];
}

function ensureStats(rows: TutorStatModule[]): TutorStatModule[] {
  return rows.length > 0
    ? rows
    : DEFAULT_TUTOR_PROFILE_STATS.map((item) => ({ ...item, id: createRowId('stat') }));
}

function ensurePedagogicalModules(rows: TutorPedagogicalModule[]): TutorPedagogicalModule[] {
  return rows.length > 0
    ? rows
    : DEFAULT_TUTOR_PEDAGOGICAL_MODULES.map((item) => ({ ...item, id: createRowId('pedagogy') }));
}

function buildDraft(tutor: NonNullable<React.ContextType<typeof AppContext>['selectedTutor']>): TutorEditDraft {
  return {
    name: tutor.name,
    email: tutor.email,
    avatarUrl: tutor.avatar || '',
    password: '',
    location: tutor.location || DEFAULT_TUTOR_LOCATION,
    languagesSpoken: tutor.languagesSpoken || DEFAULT_TUTOR_LANGUAGES,
    bio: tutor.bio || '',
    profileHighlights: ensureHighlights(
      (tutor.profileHighlights && tutor.profileHighlights.length > 0
        ? tutor.profileHighlights
        : DEFAULT_TUTOR_PROFILE_HIGHLIGHTS
      ).map((item) => item || '')
    ),
    profileStats: ensureStats(
      (tutor.profileStats && tutor.profileStats.length > 0
        ? tutor.profileStats
        : DEFAULT_TUTOR_PROFILE_STATS
      ).map((item, index) => ({
        id: item.id || `stat-${index + 1}`,
        label: item.label,
        value: item.value,
      }))
    ),
    pedagogicalModules: ensurePedagogicalModules(
      (tutor.pedagogicalModules && tutor.pedagogicalModules.length > 0
        ? tutor.pedagogicalModules
        : DEFAULT_TUTOR_PEDAGOGICAL_MODULES
      ).map((item, index) => ({
        id: item.id || `pedagogy-${index + 1}`,
        title: item.title,
        description: item.description,
      }))
    ),
  };
}

function parseNumericValue(raw: string): number | null {
  const normalized = raw.replace(/[^0-9.-]/g, '').trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveStudentCount(modules: TutorStatModule[]): number | undefined {
  const candidate = modules.find((module) =>
    /graduate|student/i.test(module.label)
  );
  if (!candidate) {
    return undefined;
  }

  const parsed = parseNumericValue(candidate.value);
  if (parsed === null || parsed < 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

function deriveRating(modules: TutorStatModule[]): number | undefined {
  const candidate = modules.find((module) => /rating/i.test(module.label));
  if (!candidate) {
    return undefined;
  }

  const parsed = parseNumericValue(candidate.value);
  if (parsed === null || parsed < 0) {
    return undefined;
  }
  return Math.min(parsed, 5);
}

const TutorProfileView: React.FC = () => {
  const t = useTranslations('views.tutorProfile');
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const { selectedTutor, courses, setView, setSelectedCourse, user, setTutors, setSelectedTutor } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState<TutorEditDraft | null>(null);

  useEffect(() => {
    if (!selectedTutor) {
      setDraft(null);
      return;
    }

    setDraft(buildDraft(selectedTutor));
    setIsEditing(false);
    setEditError(null);
  }, [selectedTutor?.id]);

  if (!selectedTutor || !draft) return null;
  const canInlineEdit = false;

  const tutorCourses = courses.filter(c => c.tutorId === selectedTutor.id);
  const avatarPreview =
    draft.avatarUrl.trim() || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200';

  const handleSave = async () => {
    if (!canInlineEdit) {
      return;
    }

    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    const password = draft.password.trim();

    if (!name || !email) {
      setEditError(tx('errors.nameEmailRequired', 'Name and email are required.'));
      return;
    }

    if (password && password.length < 8) {
      setEditError(tx('errors.passwordLength', 'New password must be at least 8 characters.'));
      return;
    }

    const profileHighlights = draft.profileHighlights.map((item) => item.trim()).filter(Boolean);
    const profileStats = draft.profileStats
      .map((module) => ({
        id: module.id || createRowId('stat'),
        label: module.label.trim(),
        value: module.value.trim(),
      }))
      .filter((module) => module.label && module.value);
    const pedagogicalModules = draft.pedagogicalModules
      .map((module) => ({
        id: module.id || createRowId('pedagogy'),
        title: module.title.trim(),
        description: module.description.trim(),
      }))
      .filter((module) => module.title && module.description);

    if (profileStats.length === 0) {
      setEditError(tx('errors.addStatsModule', 'Add at least one stats module.'));
      return;
    }

    if (pedagogicalModules.length === 0) {
      setEditError(tx('errors.addPedagogicalModule', 'Add at least one pedagogical module.'));
      return;
    }

    setIsSaving(true);
    setEditError(null);

    const updated = await updateAdminTutor(selectedTutor.id, {
      name,
      email,
      avatarUrl: draft.avatarUrl.trim() || null,
      bio: draft.bio.trim() || null,
      password: password || undefined,
      location: draft.location.trim() || null,
      languagesSpoken: draft.languagesSpoken.trim() || null,
      profileHighlights,
      profileStats,
      pedagogicalModules,
      studentCount: deriveStudentCount(profileStats),
      rating: deriveRating(profileStats),
    }).catch((error: unknown) => {
      console.error('updateAdminTutor failed', error);
      return null;
    });

    setIsSaving(false);

    if (!updated) {
      setEditError(tx('errors.saveFailed', 'Save failed. Check admin session and tutor values.'));
      return;
    }

    setTutors((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    setSelectedTutor(updated);
    setDraft(buildDraft(updated));
    setIsEditing(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3 space-y-10">
          <div className="text-center lg:text-left">
            <img
              src={isEditing ? avatarPreview : selectedTutor.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'}
              className="w-56 h-56 rounded-[4rem] border-8 border-white shadow-2xl mx-auto lg:mx-0 object-cover mb-8"
              alt={selectedTutor.name}
            />
            {isEditing ? (
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, name: event.target.value } : current))
                }
                className="mb-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-2xl font-black tracking-tight text-[#2d3e50] outline-none focus:border-[#f47361]"
              />
            ) : (
              <h1 className="text-4xl font-black text-[#2d3e50] mb-2 tracking-tight">{selectedTutor.name}</h1>
            )}
            <p className="text-[#f47361] font-black uppercase tracking-[0.2em] text-xs mb-6">
              {tx('seniorFellow', 'Catalina Senior Fellow')}
            </p>
            {canInlineEdit ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setDraft(buildDraft(selectedTutor));
                      setIsEditing(true);
                      setEditError(null);
                    }}
                    className="rounded-xl border border-sky-300 px-4 py-2 text-xs font-black uppercase tracking-widest text-sky-700 transition-colors hover:bg-sky-600 hover:text-white"
                  >
                    {tx('actions.editTutor', 'Edit Tutor')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        void handleSave();
                      }}
                      disabled={isSaving}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-sky-700 disabled:opacity-70"
                    >
                      {isSaving ? tx('actions.saving', 'Saving...') : tx('actions.saveChanges', 'Save Changes')}
                    </button>
                    <button
                      onClick={() => {
                        setDraft(buildDraft(selectedTutor));
                        setIsEditing(false);
                        setEditError(null);
                      }}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      {tx('actions.cancel', 'Cancel')}
                    </button>
                  </>
                )}
              </div>
            ) : null}
            {isEditing ? (
              <div className="mb-6 space-y-2">
                <input
                  value={draft.email}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, email: event.target.value } : current))
                  }
                  placeholder={tx('form.tutorEmail', 'Tutor email')}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#f47361]"
                />
                <input
                  value={draft.avatarUrl}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, avatarUrl: event.target.value } : current))
                  }
                  placeholder={tx('form.avatarUrl', 'Avatar URL')}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#f47361]"
                />
                <input
                  value={draft.password}
                  type="password"
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, password: event.target.value } : current))
                  }
                  placeholder={tx('form.newPasswordOptional', 'New password (optional)')}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#f47361]"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-3 text-slate-500 mb-10 items-center lg:items-start">
              <span className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-[#f47361]" />
                {isEditing ? (
                  <input
                    value={draft.location}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, location: event.target.value } : current))
                    }
                    className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-600 outline-none focus:border-[#f47361]"
                  />
                ) : (
                  <span>{selectedTutor.location || DEFAULT_TUTOR_LOCATION}</span>
                )}
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4 text-[#ffb821]" />
                {isEditing ? (
                  <input
                    value={draft.languagesSpoken}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, languagesSpoken: event.target.value } : current))
                    }
                    className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-600 outline-none focus:border-[#f47361]"
                  />
                ) : (
                  <span>{selectedTutor.languagesSpoken || DEFAULT_TUTOR_LANGUAGES}</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {draft.profileStats.map((module, index) => (
                <div key={module.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={module.value}
                        onChange={(event) =>
                          setDraft((current) => {
                            if (!current) return current;
                            const profileStats = [...current.profileStats];
                            profileStats[index] = { ...profileStats[index], value: event.target.value };
                            return { ...current, profileStats };
                          })
                        }
                        className="w-full bg-transparent text-center text-3xl font-black text-[#2d3e50] outline-none"
                      />
                      <input
                        value={module.label}
                        onChange={(event) =>
                          setDraft((current) => {
                            if (!current) return current;
                            const profileStats = [...current.profileStats];
                            profileStats[index] = { ...profileStats[index], label: event.target.value };
                            return { ...current, profileStats };
                          })
                        }
                        className="w-full bg-transparent text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 outline-none"
                      />
                      <button
                        onClick={() =>
                          setDraft((current) => {
                            if (!current || current.profileStats.length <= 1) return current;
                            return {
                              ...current,
                              profileStats: current.profileStats.filter((candidate) => candidate.id !== module.id),
                            };
                          })
                        }
                        className="mx-auto inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                        {tx('actions.remove', 'Remove')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-black text-[#2d3e50]">{module.value}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{module.label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
            {isEditing ? (
              <button
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          profileStats: [
                            ...current.profileStats,
                            { id: createRowId('stat'), label: tx('defaults.newStatLabel', 'New Stat'), value: tx('defaults.newStatValue', '0') },
                          ],
                        }
                      : current
                  )
                }
                className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#f47361]"
              >
                <Plus className="w-3 h-3" />
                {tx('actions.addStatModule', 'Add Stat Module')}
              </button>
            ) : null}
          </div>

          <div className="bg-[#2d3e50] p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f47361]/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="text-xl font-black uppercase tracking-widest relative z-10">
              {tx('tutorProfile', 'Tutor Profile')}
            </h3>
            {isEditing ? (
              <textarea
                value={draft.bio}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, bio: event.target.value } : current))
                }
                rows={5}
                className="relative z-10 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm leading-relaxed text-slate-200 outline-none focus:border-[#f47361]"
                placeholder={tx('form.briefDescription', 'Brief tutor description')}
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed relative z-10">{selectedTutor.bio || tx('bioFallback', 'Tutor profile details are being updated.')}</p>
            )}
            <ul className="space-y-4 pt-6 border-t border-white/5 relative z-10">
              {draft.profileHighlights.map((item, index) => (
                <li key={`highlight-${index}`} className="flex items-start gap-4 text-[11px] font-bold uppercase tracking-wider text-white/80">
                  <CheckCircle className="w-4 h-4 text-[#f47361] mt-0.5" />
                  {isEditing ? (
                    <div className="w-full space-y-2">
                      <input
                        value={item}
                        onChange={(event) =>
                          setDraft((current) => {
                            if (!current) return current;
                            const profileHighlights = [...current.profileHighlights];
                            profileHighlights[index] = event.target.value;
                            return { ...current, profileHighlights };
                          })
                        }
                        className="w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white outline-none focus:border-[#f47361]"
                      />
                      <button
                        onClick={() =>
                          setDraft((current) => {
                            if (!current || current.profileHighlights.length <= 1) return current;
                            return {
                              ...current,
                              profileHighlights: current.profileHighlights.filter((_, candidateIndex) => candidateIndex !== index),
                            };
                          })
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-300"
                      >
                        <Trash2 className="w-3 h-3" />
                        {tx('actions.remove', 'Remove')}
                      </button>
                    </div>
                  ) : (
                    <span>{item}</span>
                  )}
                </li>
              ))}
            </ul>
            {isEditing ? (
              <button
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? { ...current, profileHighlights: [...current.profileHighlights, ''] }
                      : current
                  )
                }
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#f47361]"
              >
                <Plus className="w-3 h-3" />
                {tx('actions.addProfileItem', 'Add Profile Item')}
              </button>
            ) : null}
          </div>
          {editError ? (
            <p className="text-sm font-bold text-rose-600">{editError}</p>
          ) : null}
        </div>

        <div className="lg:w-2/3 space-y-16">
          <section>
            <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-5">
              <h2 className="text-2xl font-black text-[#2d3e50] uppercase tracking-wide">
                {tx('courseOfferings', 'Course Offerings')}
              </h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tutorCourses.length} {tx('curriculums', 'Curriculums')}</span>
            </div>
            {tutorCourses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                {tx('emptyCourses', 'This tutor does not have assigned courses yet.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tutorCourses.map(course => (
                  <div
                    key={course.id}
                    onClick={() => { setSelectedCourse(course); setView('course-details'); window.scrollTo(0, 0); }}
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
            )}
          </section>

          <section className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-200 shadow-inner">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#2d3e50] uppercase tracking-wide">
                {tx('pedagogicalApproach', 'Pedagogical Approach')}
              </h2>
              {isEditing ? (
                <button
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            pedagogicalModules: [
                              ...current.pedagogicalModules,
                              {
                                id: createRowId('pedagogy'),
                                title: tx('defaults.newModuleTitle', 'New Module'),
                                description: tx('defaults.newModuleDescription', 'Describe this pedagogical module.'),
                              },
                            ],
                          }
                        : current
                    )
                  }
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#f47361]"
                >
                  <Plus className="w-3 h-3" />
                  {tx('actions.addModule', 'Add Module')}
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {draft.pedagogicalModules.map((module, index) => {
                const Icon = index % 2 === 0 ? Video : BookOpen;
                const iconColor = index % 2 === 0 ? 'text-[#f47361]' : 'text-[#ffb821]';

                return (
                  <div key={module.id} className="space-y-4">
                    <div className={`w-14 h-14 bg-white ${iconColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={module.title}
                          onChange={(event) =>
                            setDraft((current) => {
                              if (!current) return current;
                              const pedagogicalModules = [...current.pedagogicalModules];
                              pedagogicalModules[index] = { ...pedagogicalModules[index], title: event.target.value };
                              return { ...current, pedagogicalModules };
                            })
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-black uppercase tracking-widest text-[#2d3e50] outline-none focus:border-[#f47361]"
                        />
                        <textarea
                          value={module.description}
                          onChange={(event) =>
                            setDraft((current) => {
                              if (!current) return current;
                              const pedagogicalModules = [...current.pedagogicalModules];
                              pedagogicalModules[index] = { ...pedagogicalModules[index], description: event.target.value };
                              return { ...current, pedagogicalModules };
                            })
                          }
                          rows={3}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-500 outline-none focus:border-[#f47361]"
                        />
                        <button
                          onClick={() =>
                            setDraft((current) => {
                              if (!current || current.pedagogicalModules.length <= 1) return current;
                              return {
                                ...current,
                                pedagogicalModules: current.pedagogicalModules.filter((candidate) => candidate.id !== module.id),
                              };
                            })
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                          {tx('actions.remove', 'Remove')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-black text-[#2d3e50] uppercase tracking-widest text-sm">{module.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{module.description}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileView;
