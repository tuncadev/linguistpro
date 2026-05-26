
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { localizePath } from '@/i18n/locale-path';
import { normalizeLocale } from '@/i18n/routing';
import EditableText from '../components/i18n/EditableText';
import { Language, Level } from '../types';

function normalizeLevelKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const CourseCatalog: React.FC = () => {
  const { courses, languages, levels, setView, setSelectedCourse } = useContext(AppContext);
  const router = useRouter();
  const locale = normalizeLocale(useLocale());
  const t = useTranslations('public.catalog');
  const tCourseDetails = useTranslations('views.courseDetails');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const translateLanguageName = (language: Language): string => {
    const codeKey = language.code.trim().toLowerCase();
    const translationKey = `languages.${codeKey}`;
    return t.has(translationKey) ? t(translationKey) : language.name;
  };

  const translateLevelName = (level: Level): string => {
    const normalized = normalizeLevelKey(level.name);
    const translationKey = `levels.${normalized}`;
    return tCourseDetails.has(translationKey) ? tCourseDetails(translationKey) : level.name;
  };

  const languageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    courses.forEach((course) => {
      counts.set(course.languageId, (counts.get(course.languageId) ?? 0) + 1);
    });
    return counts;
  }, [courses]);

  const availableLanguages = useMemo(
    () => languages.filter((language) => (languageCounts.get(language.id) ?? 0) > 0),
    [languages, languageCounts]
  );

  useEffect(() => {
    if (filterLang === 'all') {
      return;
    }

    const activeLanguageStillVisible = availableLanguages.some((language) => language.id === filterLang);
    if (!activeLanguageStillVisible) {
      setFilterLang('all');
    }
  }, [availableLanguages, filterLang]);

  const languageFilteredCourses = useMemo(
    () => (filterLang === 'all' ? courses : courses.filter((course) => course.languageId === filterLang)),
    [courses, filterLang]
  );

  const levelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    languageFilteredCourses.forEach((course) => {
      counts.set(course.levelId, (counts.get(course.levelId) ?? 0) + 1);
    });
    return counts;
  }, [languageFilteredCourses]);

  const availableLevels = useMemo(
    () => levels.filter((level) => (levelCounts.get(level.id) ?? 0) > 0),
    [levels, levelCounts]
  );

  useEffect(() => {
    if (filterLevel === 'all') {
      return;
    }

    const activeLevelStillVisible = availableLevels.some((level) => level.id === filterLevel);
    if (!activeLevelStillVisible) {
      setFilterLevel('all');
    }
  }, [availableLevels, filterLevel]);

  const filteredCourses = useMemo(() => {
    if (filterLevel === 'all') {
      return languageFilteredCourses;
    }
    return languageFilteredCourses.filter((course) => course.levelId === filterLevel);
  }, [filterLevel, languageFilteredCourses]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          <EditableText translationKey="public.catalog.title" text={t('title')} as="span" />
        </h1>
        <p className="text-slate-500">
          <EditableText translationKey="public.catalog.subtitle" text={t('subtitle')} as="span" />
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilterLang('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterLang === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <EditableText translationKey="public.catalog.allLanguages" text={t('allLanguages')} as="span" />
          </button>
          {availableLanguages.map(lang => (
            <button 
              key={lang.id}
              onClick={() => setFilterLang(lang.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterLang === lang.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {translateLanguageName(lang)}
            </button>
          ))}
        </div>

        {availableLevels.length > 0 ? (
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterLevel === 'all' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              <EditableText translationKey="public.catalog.allLevels" text={t('allLevels')} as="span" />
            </button>
            {availableLevels.map((levelOption) => (
              <button
                key={levelOption.id}
                onClick={() => setFilterLevel(levelOption.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterLevel === levelOption.id ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {translateLevelName(levelOption)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map(course => {
          const lang = languages.find(l => l.id === course.languageId);
          const level = levels.find(v => v.id === course.levelId);
          
          return (
            <div 
              key={course.id} 
              onClick={() => {
                setSelectedCourse(course);
                setView('course-details');
                router.push(localizePath(`/courses/${course.id}`, locale));
              }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="relative h-48">
                <img src={course.imageUrl} className="w-full h-full object-cover" alt={course.title} />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight text-slate-900 shadow-sm">
                    {lang ? translateLanguageName(lang) : ''}
                  </span>
                  <span className="bg-indigo-600/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight text-white shadow-sm">
                    {level ? translateLevelName(level) : ''}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 line-clamp-1 text-slate-900 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{course.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900">${course.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.reviews} <EditableText translationKey="public.catalog.reviews" text={t('reviews')} as="span" /></span>
                  </div>
                  <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all">
                    <EditableText translationKey="public.catalog.viewDetails" text={t('viewDetails')} as="span" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCatalog;
