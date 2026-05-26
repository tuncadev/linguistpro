
import React, { useContext } from 'react';
import { AppContext } from '../App';
import Hero from '../components/Hero';
import LanguageCard from '../components/LanguageCard';
import { Search, Users, Trophy, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { localizePath } from '@/i18n/locale-path';
import { normalizeLocale } from '@/i18n/routing';
import EditableText from '../components/i18n/EditableText';

function slugifyLanguage(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const HomeView: React.FC = () => {
  const { setView, setSelectedLang, languages } = useContext(AppContext);
  const router = useRouter();
  const locale = normalizeLocale(useLocale());
  const t = useTranslations('public.home');
  const tPages = useTranslations('pages');

  const steps = [
    { icon: Search, title: t('steps.step1.title'), desc: t('steps.step1.desc'), titleKey: 'public.home.steps.step1.title', descKey: 'public.home.steps.step1.desc' },
    { icon: Sparkles, title: t('steps.step2.title'), desc: t('steps.step2.desc'), titleKey: 'public.home.steps.step2.title', descKey: 'public.home.steps.step2.desc' },
    { icon: Users, title: t('steps.step3.title'), desc: t('steps.step3.desc'), titleKey: 'public.home.steps.step3.title', descKey: 'public.home.steps.step3.desc' },
    { icon: Trophy, title: t('steps.step4.title'), desc: t('steps.step4.desc'), titleKey: 'public.home.steps.step4.title', descKey: 'public.home.steps.step4.desc' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <Hero />

      {/* Language Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-[#2d3e50] mb-4 tracking-tight">
              <EditableText translationKey="public.home.languageFacultiesTitle" text={t('languageFacultiesTitle')} as="span" />
            </h2>
            <p className="text-slate-600">
              <EditableText translationKey="public.home.languageFacultiesSubtitle" text={t('languageFacultiesSubtitle')} as="span" />
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {languages.map(lang => (
              <LanguageCard 
                key={lang.id} 
                language={lang} 
                onClick={() => {
                  setSelectedLang(lang);
                  setView('language-landing');
                  router.push(localizePath(`/courses/${slugifyLanguage(lang.name)}`, locale));
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
                alt={t('studyImageAlt')} 
              />
            </div>
            <div className="lg:w-1/2 space-y-12">
              <div>
                <h2 className="text-4xl font-black text-[#2d3e50] mb-6 leading-tight">
                  <EditableText translationKey="public.home.culturalTitleLine1" text={t('culturalTitleLine1')} as="span" /> <br />
                  <span className="text-[#f47361]"><EditableText translationKey="public.home.culturalTitleLine2" text={t('culturalTitleLine2')} as="span" /></span>
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  <EditableText translationKey="public.home.culturalDescription" text={t('culturalDescription')} as="span" />
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                {steps.map((step, i) => (
                  <div key={i} className="space-y-3 group">
                    <div className="w-12 h-12 bg-[#f47361]/10 text-[#f47361] rounded-xl flex items-center justify-center group-hover:bg-[#f47361] group-hover:text-white transition-colors">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-[#2d3e50]">
                      <EditableText translationKey={step.titleKey} text={step.title} as="span" />
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      <EditableText translationKey={step.descKey} text={step.desc} as="span" />
                    </p>
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
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
            <EditableText translationKey="public.home.readyTitle" text={t('readyTitle')} as="span" />
          </h2>
          <button 
            onClick={() => {
              setView('catalog');
              router.push(localizePath('/courses', locale));
            }}
            className="bg-[#f47361] text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-[#e06352] transition-all shadow-2xl shadow-black/20"
          >
            <EditableText translationKey="public.home.enrollToday" text={t('enrollToday')} as="span" />
          </button>
          <p className="mt-8 text-slate-400 font-medium text-sm">
            <EditableText translationKey="public.home.certificationIncluded" text={t('certificationIncluded')} as="span" />
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wide text-slate-300">
            <a href="/terms" className="hover:text-white transition-colors">{tPages('terms.title')}</a>
            <a href="/privacy" className="hover:text-white transition-colors">{tPages('privacy.title')}</a>
            <a href="/refund-policy" className="hover:text-white transition-colors">{tPages('refundPolicy.title')}</a>
            <a href="/support" className="hover:text-white transition-colors">{tPages('support.title')}</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
