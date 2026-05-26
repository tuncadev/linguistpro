
import React from 'react';
import { Target, ShieldCheck, Heart, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import EditableText from '../components/i18n/EditableText';

const TEAM_PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
];

const AboutView: React.FC = () => {
  const t = useTranslations('public.about');
  const members = [
    { name: t('team.members.member1.name'), role: t('team.members.member1.role'), bio: t('team.members.member1.bio') },
    { name: t('team.members.member2.name'), role: t('team.members.member2.role'), bio: t('team.members.member2.bio') },
    { name: t('team.members.member3.name'), role: t('team.members.member3.role'), bio: t('team.members.member3.bio') },
    { name: t('team.members.member4.name'), role: t('team.members.member4.role'), bio: t('team.members.member4.bio') },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4"><EditableText translationKey="public.about.missionLabel" text={t('missionLabel')} as="span" /></p>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-8"><EditableText translationKey="public.about.titleLine1" text={t('titleLine1')} as="span" /> <br /> <EditableText translationKey="public.about.titleLine2" text={t('titleLine2')} as="span" /></h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              <EditableText translationKey="public.about.intro" text={t('intro')} as="span" />
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 pt-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-3xl flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold"><EditableText translationKey="public.about.values.inclusion.title" text={t('values.inclusion.title')} as="span" /></h3>
              <p className="text-sm text-slate-500"><EditableText translationKey="public.about.values.inclusion.desc" text={t('values.inclusion.desc')} as="span" /></p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold"><EditableText translationKey="public.about.values.goal.title" text={t('values.goal.title')} as="span" /></h3>
              <p className="text-sm text-slate-500"><EditableText translationKey="public.about.values.goal.desc" text={t('values.goal.desc')} as="span" /></p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold"><EditableText translationKey="public.about.values.quality.title" text={t('values.quality.title')} as="span" /></h3>
              <p className="text-sm text-slate-500"><EditableText translationKey="public.about.values.quality.desc" text={t('values.quality.desc')} as="span" /></p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-black text-slate-900 mb-4"><EditableText translationKey="public.about.team.title" text={t('team.title')} as="span" /></h2>
              <p className="text-slate-600"><EditableText translationKey="public.about.team.subtitle" text={t('team.subtitle')} as="span" /></p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> <EditableText translationKey="public.about.team.joinFaculty" text={t('team.joinFaculty')} as="span" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {members.map((member, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 group">
                <div className="relative mb-6 overflow-hidden rounded-2xl">
                  <img 
                    src={TEAM_PHOTOS[i]} 
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={`Professional profile headshot of ${member.name}, ${member.role}`} 
                  />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  <EditableText translationKey={`public.about.team.members.member${i + 1}.name`} text={member.name} as="span" />
                </h4>
                <p className="text-xs font-bold text-indigo-600 uppercase mb-3">
                  <EditableText translationKey={`public.about.team.members.member${i + 1}.role`} text={member.role} as="span" />
                </p>
                <p className="text-sm text-slate-500">
                  <EditableText translationKey={`public.about.team.members.member${i + 1}.bio`} text={member.bio} as="span" />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutView;
