import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wrench, HardHat, ArrowLeft } from 'lucide-react';

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <button onClick={() => navigate('/language')} className="mb-4 flex items-center gap-2 text-lg text-primary">
        <ArrowLeft className="h-6 w-6" /> {t('back')}
      </button>
      <div className="flex flex-1 flex-col items-center justify-center">
      <h1 className="mb-10 text-3xl font-bold text-foreground">{t('selectUserType')}</h1>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <button
          onClick={() => navigate('/worker-login')}
          className="flex min-h-[140px] flex-col items-center justify-center rounded-3xl border-2 border-primary bg-primary/5 p-8 shadow-sm transition-all active:scale-95 hover:shadow-lg"
        >
          <Wrench className="mb-3 h-14 w-14 text-primary" />
          <span className="text-2xl font-bold text-primary">{t('worker')}</span>
        </button>
        <button
          onClick={() => navigate('/contractor-login')}
          className="flex min-h-[140px] flex-col items-center justify-center rounded-3xl border-2 border-accent bg-accent/5 p-8 shadow-sm transition-all active:scale-95 hover:shadow-lg"
        >
          <HardHat className="mb-3 h-14 w-14 text-accent" />
          <span className="text-2xl font-bold text-accent">{t('contractor')}</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
