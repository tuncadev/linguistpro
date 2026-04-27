import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { Star, Clock, Users, ChevronDown, ChevronRight, CheckCircle, Award, Play } from 'lucide-react';
import { UserRole } from '../types';
import { enrollInCourse } from '../services/enrollmentApiService';
import { updateAdminCourse } from '../services/adminCourseCrudApiService';

type EditableLesson = {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading';
  content?: string;
};

type EditableSection = {
  id: string;
  title: string;
  lessons: EditableLesson[];
};

type CourseEditDraft = {
  title: string;
  description: string;
  price: string;
  tutorId: string;
  levelId: string;
  tuitionLabel: string;
  discountLabel: string;
  learningObjectives: string[];
  enrollmentIncludes: string[];
  syllabus: EditableSection[];
};

function createRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function ensureTextRows(items: string[]): string[] {
  return items.length > 0 ? items : [''];
}

function buildDraftFromCourse(course: NonNullable<React.ContextType<typeof AppContext>['selectedCourse']>): CourseEditDraft {
  return {
    title: course.title,
    description: course.description,
    price: String(course.price),
    tutorId: course.tutorId,
    levelId: course.levelId,
    tuitionLabel: course.tuitionLabel || 'Tuition Fee',
    discountLabel: course.discountLabel || '65% Off Enrollment',
    learningObjectives: ensureTextRows(course.learningObjectives ?? []),
    enrollmentIncludes: ensureTextRows(course.enrollmentIncludes ?? []),
    syllabus: (course.syllabus.length > 0
      ? course.syllabus
      : [{ id: createRowId('section'), title: 'Module 1', lessons: [{ id: createRowId('lesson'), title: 'Lesson 1', duration: '05:00', type: 'video' }] }]
    ).map((section) => ({
      id: section.id || createRowId('section'),
      title: section.title,
      lessons: (section.lessons.length > 0
        ? section.lessons
        : [{ id: createRowId('lesson'), title: 'Lesson 1', duration: '05:00', type: 'video' }]
      ).map((lesson) => ({
        id: lesson.id || createRowId('lesson'),
        title: lesson.title,
        duration: lesson.duration,
        type: lesson.type,
        content: lesson.content,
      })),
    })),
  };
}

const CourseDetailsView: React.FC = () => {
  const {
    selectedCourse,
    tutors,
    languages,
    levels,
    setView,
    setSelectedTutor,
    setActiveLesson,
    user,
    setSelectedCourse,
    setCourses,
  } = useContext(AppContext);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CourseEditDraft | null>(null);

  useEffect(() => {
    if (!selectedCourse) {
      setDraft(null);
      return;
    }

    setDraft(buildDraftFromCourse(selectedCourse));
    setIsEditing(false);
    setEditError(null);
  }, [selectedCourse?.id]);

  useEffect(() => {
    if (!draft || tutors.length === 0) {
      return;
    }

    const hasAssignedTutor = tutors.some((candidate) => candidate.id === draft.tutorId);
    if (hasAssignedTutor) {
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            tutorId: tutors[0].id,
          }
        : current
    );
  }, [draft, tutors]);

  const firstLesson = useMemo(
    () => selectedCourse?.syllabus[0]?.lessons[0],
    [selectedCourse?.syllabus]
  );
  const availableTutors = useMemo(() => tutors, [tutors]);

  if (!selectedCourse || !draft) return null;

  const isAdmin = user?.role === UserRole.ADMIN;
  const tutor = tutors.find((candidate) => candidate.id === selectedCourse.tutorId);
  const language = languages.find((candidate) => candidate.id === selectedCourse.languageId);
  const level = levels.find((candidate) => candidate.id === selectedCourse.levelId);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const startCourse = () => {
    if (!firstLesson) {
      alert('This course has no lessons yet.');
      return;
    }

    setActiveLesson(firstLesson);
    setView('lesson-view');
  };

  const handleEnroll = async () => {
    if (!user) {
      alert('Admissions require a Student account.');
      return;
    }

    if (user.role !== UserRole.STUDENT) {
      alert('Please sign in with a Student account to enroll.');
      return;
    }

    setIsEnrolling(true);
    const result = await enrollInCourse(selectedCourse.id);
    setIsEnrolling(false);

    if (result.ok) {
      startCourse();
      return;
    }

    console.warn('enrollInCourse failed, using local fallback', result.errorMessage);
    alert(result.errorMessage || 'Enrollment service unavailable. Starting in preview mode.');
    startCourse();
  };

  const setObjective = (index: number, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      const learningObjectives = [...current.learningObjectives];
      learningObjectives[index] = value;
      return { ...current, learningObjectives };
    });
  };

  const setEnrollmentItem = (index: number, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      const enrollmentIncludes = [...current.enrollmentIncludes];
      enrollmentIncludes[index] = value;
      return { ...current, enrollmentIncludes };
    });
  };

  const updateSectionTitle = (sectionIndex: number, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      const syllabus = [...current.syllabus];
      syllabus[sectionIndex] = { ...syllabus[sectionIndex], title: value };
      return { ...current, syllabus };
    });
  };

  const updateLesson = (
    sectionIndex: number,
    lessonIndex: number,
    field: keyof EditableLesson,
    value: string
  ) => {
    setDraft((current) => {
      if (!current) return current;
      const syllabus = [...current.syllabus];
      const section = syllabus[sectionIndex];
      const lessons = [...section.lessons];
      lessons[lessonIndex] = {
        ...lessons[lessonIndex],
        [field]: value,
      };
      syllabus[sectionIndex] = { ...section, lessons };
      return { ...current, syllabus };
    });
  };

  const handleSave = async () => {
    if (!isAdmin) {
      return;
    }

    const title = draft.title.trim();
    const description = draft.description.trim();
    const price = Number(draft.price);

    if (!title || !description || !Number.isFinite(price) || price < 0) {
      setEditError('Please provide valid title, description, and price.');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    const updated = await updateAdminCourse(selectedCourse.id, {
      title,
      description,
      price,
      tutorId: draft.tutorId,
      levelId: draft.levelId,
      tuitionLabel: draft.tuitionLabel.trim() || undefined,
      discountLabel: draft.discountLabel.trim() || undefined,
      learningObjectives: draft.learningObjectives.map((item) => item.trim()).filter(Boolean),
      enrollmentIncludes: draft.enrollmentIncludes.map((item) => item.trim()).filter(Boolean),
      syllabusSections: draft.syllabus
        .map((section) => ({
          title: section.title.trim(),
          lessons: section.lessons.map((lesson) => ({
            title: lesson.title.trim(),
            duration: lesson.duration.trim() || undefined,
            type: lesson.type,
            content: lesson.content?.trim() || undefined,
          })),
        }))
        .filter((section) => Boolean(section.title)),
    });

    setIsSaving(false);

    if (!updated) {
      setEditError('Save failed. Check admin session and field values.');
      return;
    }

    setSelectedCourse(updated);
    setCourses((current) => current.map((course) => (course.id === updated.id ? updated : course)));
    setDraft(buildDraftFromCourse(updated));
    setIsEditing(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#2d3e50] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3 space-y-6">
              <nav className="flex items-center gap-2 text-[#f47361] text-sm font-bold mb-4 uppercase tracking-widest">
                <button onClick={() => setView('catalog')} className="hover:text-white">Courses</button>
                <ChevronRight className="w-4 h-4" />
                <span>{language?.name}</span>
              </nav>

              {isAdmin ? (
                <div className="flex flex-wrap gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setDraft(buildDraftFromCourse(selectedCourse));
                        setIsEditing(true);
                        setEditError(null);
                      }}
                      className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#2d3e50] hover:bg-slate-100"
                    >
                      Edit Course
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          void handleSave();
                        }}
                        disabled={isSaving}
                        className="rounded-xl bg-[#f47361] px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#e06352] disabled:opacity-70"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setDraft(buildDraftFromCourse(selectedCourse));
                          setIsEditing(false);
                          setEditError(null);
                        }}
                        className="rounded-xl border border-slate-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-200 hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              {isEditing ? (
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                  className="w-full bg-transparent text-4xl md:text-5xl font-black leading-tight tracking-tight outline-none border-b border-slate-500 pb-2"
                />
              ) : (
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">{selectedCourse.title}</h1>
              )}

              {isEditing ? (
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, description: event.target.value } : current))
                  }
                  rows={3}
                  className="w-full bg-transparent text-xl text-slate-300 max-w-2xl leading-relaxed outline-none border-b border-slate-500 pb-2 resize-none"
                />
              ) : (
                <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">{selectedCourse.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#ffb821] fill-[#ffb821]" />
                  <span className="font-bold">{selectedCourse.rating}</span>
                  <span className="text-slate-400">({selectedCourse.reviews} verified reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5 text-[#f47361]" />
                  <span>{selectedCourse.studentCount} currently learning</span>
                </div>
                {isEditing ? (
                  <select
                    value={draft.levelId}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, levelId: event.target.value } : current))
                    }
                    className="bg-[#f47361] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white outline-none"
                  >
                    {levels.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} Level
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-[#f47361] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                    {level?.name} Level
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <img
                  src={tutor?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'}
                  className="w-14 h-14 rounded-full border-2 border-[#f47361] cursor-pointer object-cover shadow-xl"
                  onClick={() => {
                    if (!tutor) return;
                    setSelectedTutor(tutor);
                    setView('tutor-profile');
                    window.scrollTo(0, 0);
                  }}
                  alt={tutor?.name || 'Tutor'}
                />
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Tutor</p>
                  {isEditing ? (
                    availableTutors.length > 0 ? (
                      <select
                        value={draft.tutorId}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, tutorId: event.target.value } : current))
                        }
                        className="mt-1 rounded border border-slate-500 bg-transparent px-2 py-1 text-sm font-bold text-white outline-none"
                      >
                        {availableTutors.map((candidate) => (
                          <option key={candidate.id} value={candidate.id} className="text-slate-900">
                            {candidate.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="mt-1 inline-block text-sm font-bold text-amber-300">
                        No tutors found. Add one in /admin/tutors.
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        if (!tutor) return;
                        setSelectedTutor(tutor);
                        setView('tutor-profile');
                        window.scrollTo(0, 0);
                      }}
                      className="text-lg font-bold hover:text-[#f47361] transition-colors"
                    >
                      {tutor?.name || 'Unassigned Tutor'}
                    </button>
                  )}
                </div>
              </div>

              {editError ? <p className="text-sm font-bold text-rose-300">{editError}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3 space-y-12">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black text-[#2d3e50] mb-8">Learning Objectives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {draft.learningObjectives.map((item, i) => (
                  <div key={`objective-${i}`} className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    {isEditing ? (
                      <input
                        value={item}
                        onChange={(event) => setObjective(i, event.target.value)}
                        className="w-full border-b border-slate-200 pb-1 text-slate-600 font-medium leading-relaxed outline-none"
                      />
                    ) : (
                      <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                    )}
                  </div>
                ))}
              </div>
              {isEditing ? (
                <button
                  onClick={() =>
                    setDraft((current) =>
                      current ? { ...current, learningObjectives: [...current.learningObjectives, ''] } : current
                    )
                  }
                  className="mt-6 text-xs font-black uppercase tracking-widest text-[#f47361]"
                >
                  + Add Objective
                </button>
              ) : null}
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#2d3e50] mb-6">Curriculum Breakdown</h2>
              <div className="space-y-4">
                {draft.syllabus.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    className="border border-slate-200 rounded-3xl overflow-hidden bg-white hover:border-[#f47361] transition-colors group"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-7 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-5 text-left flex-1">
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            openSection === section.id ? 'rotate-180 text-[#f47361]' : ''
                          }`}
                        />
                        {isEditing ? (
                          <input
                            value={section.title}
                            onChange={(event) => updateSectionTitle(sectionIndex, event.target.value)}
                            className="w-full border-b border-slate-200 bg-transparent py-1 font-black text-[#2d3e50] uppercase tracking-wide outline-none"
                          />
                        ) : (
                          <span className="font-black text-[#2d3e50] uppercase tracking-wide">{section.title}</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {section.lessons.length} Modules
                      </span>
                    </button>
                    {openSection === section.id && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50 bg-slate-50/50">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="p-5 pl-14 flex items-center justify-between gap-4 group">
                            <div className="flex items-center gap-4 flex-1">
                              <Play className="w-4 h-4 text-[#f47361]" />
                              {isEditing ? (
                                <input
                                  value={lesson.title}
                                  onChange={(event) =>
                                    updateLesson(sectionIndex, lessonIndex, 'title', event.target.value)
                                  }
                                  className="w-full border-b border-slate-200 bg-transparent py-1 text-sm font-bold text-slate-700 outline-none"
                                />
                              ) : (
                                <span className="text-sm font-bold text-slate-700">{lesson.title}</span>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={lesson.duration}
                                  onChange={(event) =>
                                    updateLesson(sectionIndex, lessonIndex, 'duration', event.target.value)
                                  }
                                  className="w-20 rounded border border-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-500"
                                />
                                <select
                                  value={lesson.type}
                                  onChange={(event) =>
                                    updateLesson(sectionIndex, lessonIndex, 'type', event.target.value)
                                  }
                                  className="rounded border border-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-500"
                                >
                                  <option value="video">VIDEO</option>
                                  <option value="quiz">QUIZ</option>
                                  <option value="reading">READ</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                {lesson.duration}
                              </span>
                            )}
                          </div>
                        ))}
                        {isEditing ? (
                          <button
                            onClick={() =>
                              setDraft((current) => {
                                if (!current) return current;
                                const syllabus = [...current.syllabus];
                                const target = syllabus[sectionIndex];
                                syllabus[sectionIndex] = {
                                  ...target,
                                  lessons: [
                                    ...target.lessons,
                                    {
                                      id: createRowId('lesson'),
                                      title: 'New Lesson',
                                      duration: '05:00',
                                      type: 'video',
                                    },
                                  ],
                                };
                                return { ...current, syllabus };
                              })
                            }
                            className="w-full py-3 text-xs font-black uppercase tracking-widest text-[#f47361]"
                          >
                            + Add Lesson
                          </button>
                        ) : null}
                      </div>
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
                            syllabus: [
                              ...current.syllabus,
                              {
                                id: createRowId('section'),
                                title: `Module ${current.syllabus.length + 1}`,
                                lessons: [
                                  {
                                    id: createRowId('lesson'),
                                    title: 'New Lesson',
                                    duration: '05:00',
                                    type: 'video',
                                  },
                                ],
                              },
                            ],
                          }
                        : current
                    )
                  }
                  className="mt-4 text-xs font-black uppercase tracking-widest text-[#f47361]"
                >
                  + Add Module
                </button>
              ) : null}
            </section>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden sticky top-24">
              <div className="relative aspect-video">
                <img src={selectedCourse.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-[#2d3e50]/40 flex items-center justify-center group-hover:bg-[#2d3e50]/20 transition-all">
                  <button className="bg-[#f47361] p-5 rounded-full text-white shadow-2xl scale-100 hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-current" />
                  </button>
                </div>
              </div>
              <div className="p-10 space-y-8">
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        value={draft.tuitionLabel}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, tuitionLabel: event.target.value } : current))
                        }
                        className="mb-1 w-full text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none border-b border-slate-200"
                      />
                    ) : (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {selectedCourse.tuitionLabel || 'Tuition Fee'}
                      </p>
                    )}

                    {isEditing ? (
                      <input
                        value={draft.price}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, price: event.target.value } : current))
                        }
                        className="w-full text-5xl font-black text-[#2d3e50] outline-none border-b border-slate-200"
                      />
                    ) : (
                      <span className="text-5xl font-black text-[#2d3e50]">${selectedCourse.price}</span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      value={draft.discountLabel}
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, discountLabel: event.target.value } : current))
                      }
                      className="w-36 text-right text-sm font-black uppercase text-[#f47361] outline-none border-b border-slate-200"
                    />
                  ) : (
                    <span className="text-[#f47361] font-black text-sm uppercase">
                      {selectedCourse.discountLabel || '65% Off Enrollment'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    void handleEnroll();
                  }}
                  disabled={isEnrolling || isEditing}
                  className="w-full bg-[#f47361] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#e06352] transition-all shadow-xl shadow-[#f47361]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isEnrolling ? 'Enrolling...' : isEditing ? 'Finish Editing to Enroll' : 'Enroll Today'}
                </button>

                <div className="space-y-5 pt-8 border-t border-slate-100">
                  <p className="text-xs font-black text-[#2d3e50] uppercase tracking-widest">Enrollment Includes:</p>
                  {draft.enrollmentIncludes.map((label, i) => {
                    const Icon = i === 0 ? Clock : i === 1 ? Award : Users;
                    return (
                      <div key={`enrollment-${i}`} className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                        <Icon className="w-4 h-4 text-[#ffb821]" />
                        {isEditing ? (
                          <input
                            value={label}
                            onChange={(event) => setEnrollmentItem(i, event.target.value)}
                            className="w-full border-b border-slate-200 py-1 outline-none"
                          />
                        ) : (
                          <span>{label}</span>
                        )}
                      </div>
                    );
                  })}
                  {isEditing ? (
                    <button
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? { ...current, enrollmentIncludes: [...current.enrollmentIncludes, ''] }
                            : current
                        )
                      }
                      className="text-xs font-black uppercase tracking-widest text-[#f47361]"
                    >
                      + Add Item
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsView;
