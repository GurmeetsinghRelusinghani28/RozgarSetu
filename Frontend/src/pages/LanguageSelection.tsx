import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages, Language } from '@/i18n/translations';
import { Globe, ArrowLeft } from 'lucide-react';

const LanguageSelection = () => {
  const navigate = useNavigate();
  const { setLanguage, t } = useLanguage();

  const handleSelect = (code: Language) => {
    setLanguage(code);
    navigate('/user-type');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-lg text-primary">
        <ArrowLeft className="h-6 w-6" /> {t('back')}
      </button>
      <div className="mb-8 mt-4 flex flex-col items-center">
        <Globe className="mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t('selectLanguage')}</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-4 text-card-foreground shadow-sm transition-all active:scale-95 hover:border-primary hover:shadow-md"
          >
            <span className="text-xl font-bold">{lang.nativeName}</span>
            <span className="mt-1 text-sm text-muted-foreground">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelection;
