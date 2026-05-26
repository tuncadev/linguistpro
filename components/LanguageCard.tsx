
import React from 'react';
import { Language } from '../types';
import * as LucideIcons from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import EditableText from './i18n/EditableText';

interface LanguageCardProps {
  language: Language;
  onClick: () => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({ language, onClick }) => {
  const t = useTranslations('public.languageCard');
  const IconComponent = (LucideIcons as any)[language.name] || LucideIcons.Languages;

  return (
    <button 
      onClick={onClick}
      className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-[#f47361] hover:shadow-2xl hover:shadow-[#f47361]/10 transition-all text-center"
    >
      <div className="w-16 h-16 bg-slate-50 text-slate-400 group-hover:bg-[#f47361] group-hover:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
        <IconComponent className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-[#2d3e50] mb-2">{language.name}</h3>
      <p className="text-slate-500 text-sm mb-6">
        <EditableText translationKey="public.languageCard.description" text={t('description')} as="span" />
      </p>
      <div className="flex items-center gap-1 text-[#f47361] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <EditableText translationKey="public.languageCard.departmentDetails" text={t('departmentDetails')} as="span" /> <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
};

export default LanguageCard;
