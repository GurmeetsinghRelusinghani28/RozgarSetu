import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Blocks, Hammer, Zap, Paintbrush, HandHelping, Wrench, Flame, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const skills = [
  { key: 'mason', icon: Blocks },
  { key: 'carpenter', icon: Hammer },
  { key: 'electrician', icon: Zap },
  { key: 'painter', icon: Paintbrush },
  { key: 'helper', icon: HandHelping },
  { key: 'plumber', icon: Wrench },
  { key: 'welder', icon: Flame },
  { key: 'driver', icon: Car },
];

const API = "http://localhost:5001/api/worker";

const WorkerProfile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState(1);
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [t('yourName'), t('selectSkills'), t('experience'), t('city')];
  const progress = ((step + 1) / steps.length) * 100;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/user-type");
        return;
      }

      const res = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.profile) {
        const profile = res.data.profile;
        setName(profile.name || "");
        setSelectedSkills(profile.skills || []);
        setExperience(profile.experience ?? 1);
        setCity(profile.city || "");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/user-type");
        return;
      }

      const res = await axios.post(
        `${API}/profile`,
        {
          name,
          skills: selectedSkills,
          experience,
          city,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        navigate("/worker-dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else saveProfile();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSkill = (key: string) => {
    setSelectedSkills((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return selectedSkills.length > 0;
    if (step === 2) return true;
    if (step === 3) return city.trim().length > 0;
    return false;
  };


  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <button onClick={handleBack} className="mb-4 flex items-center gap-2 text-lg text-primary">
        <ArrowLeft className="h-6 w-6" /> {t('back')}
      </button>

      <h1 className="mb-2 text-2xl font-bold text-foreground">{t('createProfile')}</h1>
      <Progress value={progress} className="mb-8 h-3" />

      <div className="flex flex-1 flex-col">
        {step === 0 && (
          <div>
            <label className="mb-3 block text-xl font-medium">{t('yourName')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enterName')} className="h-14 rounded-xl text-lg" />
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="mb-4 block text-xl font-medium">{t('selectSkills')}</label>
            <div className="grid grid-cols-2 gap-4">
              {skills.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => toggleSkill(key)}
                  className={`flex min-h-[90px] flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all active:scale-95 ${
                    selectedSkills.includes(key) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-card-foreground'
                  }`}
                >
                  <Icon className="mb-2 h-8 w-8" />
                  <span className="text-base font-semibold">{t(key)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="mb-4 block text-xl font-medium">{t('experience')}</label>
            <div className="flex items-center justify-center gap-6 py-8">
              <button onClick={() => setExperience(Math.max(1, experience - 1))} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-2xl font-bold text-primary">-</button>
              <span className="text-5xl font-bold text-foreground">{experience}</span>
              <button onClick={() => setExperience(Math.min(30, experience + 1))} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-2xl font-bold text-primary">+</button>
            </div>
            <p className="text-center text-xl text-muted-foreground">{t('years')}</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="mb-3 block text-xl font-medium">{t('city')}</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('enterCity')} className="h-14 rounded-xl text-lg" />
          </div>
        )}
      </div>

      <Button onClick={handleNext} disabled={!canNext()} className="mt-8 h-14 w-full rounded-2xl text-xl font-bold" size="lg">
        {step < steps.length - 1 ? t('next') : t('done')}
      </Button>
    </div>
  );
};

export default WorkerProfile;
