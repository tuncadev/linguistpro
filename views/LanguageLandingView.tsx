
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { CheckCircle2, Star, BookOpen, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import EditableText from '../components/i18n/EditableText';

const LANGUAGE_HEADER_IMAGES: Record<string, string> = {
  en: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
  es: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&q=80&w=800',
  fr: 'https://images.unsplash.com/photo-1431274172761-fca41d93e114?auto=format&fit=crop&q=80&w=800',
  jp: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
  ja: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
  de: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=800',
};

const LanguageLandingView: React.FC = () => {
  const { selectedLang, levels, setView, setSelectedCourse, courses } = useContext(AppContext);
  const t = useTranslations('public.languageLanding');

  if (!selectedLang) return null;

  const relevantCourses = courses.filter(c => c.languageId === selectedLang.id);
  const headerImage =
    LANGUAGE_HEADER_IMAGES[selectedLang.code.toLowerCase()] ||
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500">
      <header className="bg-white border-b border-slate-200 pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-3/5 space-y-6">
              <nav className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-4">
                <button onClick={() => setView('home')} className="hover:text-[#f47361]"><EditableText translationKey="public.languageLanding.breadcrumbHome" text={t('breadcrumbHome')} as="span" /></button>
                <span>/</span>
                <span className="text-[#2d3e50]">{selectedLang.name} <EditableText translationKey="public.languageLanding.department" text={t('department')} as="span" /></span>
              </nav>
              <h1 className="text-5xl md:text-6xl font-black text-[#2d3e50]">
                <EditableText translationKey="public.languageLanding.masterPrefix" text={t('masterPrefix')} as="span" /> {selectedLang.name} <br /> 
                <span className="text-[#f47361] underline decoration-[#f47361]/20 decoration-8 underline-offset-4"><EditableText translationKey="public.languageLanding.masterSuffix" text={t('masterSuffix')} as="span" /></span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                <EditableText translationKey="public.languageLanding.descriptionPrefix" text={t('descriptionPrefix')} as="span" /> {selectedLang.name} <EditableText translationKey="public.languageLanding.descriptionSuffix" text={t('descriptionSuffix')} as="span" />
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => setView('catalog')}
                  className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-sky-700 transition-all"
                >
                  <EditableText translationKey="public.languageLanding.viewCurriculum" text={t('viewCurriculum')} as="span" />
                </button>
                <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Star className="w-5 h-5 text-[#ffb821] fill-[#ffb821]" />
                  <span className="font-bold text-[#2d3e50]"><EditableText translationKey="public.languageLanding.topRatedDepartment" text={t('topRatedDepartment')} as="span" /></span>
                </div>
              </div>
            </div>
            <div className="md:w-2/5">
              <div className="relative">
                <div className="absolute inset-0 bg-[#f47361] rounded-[3rem] rotate-3 scale-105 opacity-10"></div>
                <img 
                  src={headerImage} 
                  className="relative z-10 rounded-[3rem] shadow-2xl object-cover aspect-square" 
                  alt={`${selectedLang.name} immersion`} 
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[#2d3e50] mb-4 uppercase tracking-wider"><EditableText translationKey="public.languageLanding.academicPathTitle" text={t('academicPathTitle')} as="span" /></h2>
            <p className="text-slate-500"><EditableText translationKey="public.languageLanding.academicPathSubtitle" text={t('academicPathSubtitle')} as="span" /></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {levels.map(level => (
              <div key={level.id} className="bg-white p-6 rounded-2xl border border-slate-200 text-center hover:border-[#f47361] transition-all group">
                <span className="block text-2xl font-black text-[#f47361] mb-2">{level.name}</span>
                <p className="text-sm font-bold text-[#2d3e50] mb-1">{level.description}</p>
                <div className="h-1 w-8 bg-slate-100 mx-auto rounded-full group-hover:w-16 group-hover:bg-[#f47361] transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-[#2d3e50]"><EditableText translationKey="public.languageLanding.availableCourses" text={t('availableCourses')} as="span" /></h2>
            <button onClick={() => setView('catalog')} className="text-[#f47361] font-bold flex items-center gap-1 hover:underline">
              <EditableText translationKey="public.languageLanding.browsePrograms" text={t('browsePrograms')} as="span" /> <BookOpen className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relevantCourses.length > 0 ? (
              relevantCourses.map(course => (
                <div 
                  key={course.id} 
                  onClick={() => { setSelectedCourse(course); setView('course-details'); window.scrollTo(0,0); }}
                  className="bg-white rounded-3xl border border-slate-200 p-2 group hover:shadow-2xl transition-all cursor-pointer"
                >
                  <img src={course.imageUrl} className="rounded-2xl w-full h-48 object-cover mb-4" alt={course.title} />
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-[#2d3e50] mb-2 group-hover:text-[#f47361] transition-colors">{course.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> <EditableText translationKey="public.languageLanding.diploma" text={t('diploma')} as="span" /></span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-[#f47361]" /> <EditableText translationKey="public.languageLanding.liveMentoring" text={t('liveMentoring')} as="span" /></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#2d3e50]">${course.price}</span>
                      <button className="bg-[#f47361] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#e06352] transition-colors"><EditableText translationKey="public.languageLanding.startTrial" text={t('startTrial')} as="span" /></button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium italic"><EditableText translationKey="public.languageLanding.curriculumRefreshingPrefix" text={t('curriculumRefreshingPrefix')} as="span" /> {selectedLang.name}. <br /> <EditableText translationKey="public.languageLanding.curriculumRefreshingSuffix" text={t('curriculumRefreshingSuffix')} as="span" /></p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LanguageLandingView;
