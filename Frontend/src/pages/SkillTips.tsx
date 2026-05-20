import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Lightbulb, ShieldCheck, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const SkillTips = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const tips = [
    { icon: Lightbulb, title: t('tipTitle1'), desc: t('tipDesc1'), color: 'text-accent' },
    { icon: ShieldCheck, title: t('tipTitle2'), desc: t('tipDesc2'), color: 'text-primary' },
    { icon: PiggyBank, title: t('tipTitle3'), desc: t('tipDesc3'), color: 'text-destructive' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-6 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t('skillTips')}</h1>
      </div>

      <div className="flex flex-col gap-4 px-6 pt-4">
        {tips.map(({ icon: Icon, title, desc, color }) => (
          <Card key={title} className="rounded-2xl">
            <CardContent className="flex gap-4 p-5">
              <Icon className={`h-10 w-10 shrink-0 ${color}`} />
              <div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-base text-muted-foreground">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav type="worker" active="home" />
    </div>
  );
};

export default SkillTips;
