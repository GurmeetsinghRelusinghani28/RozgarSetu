import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Blocks, Hammer, Zap, Paintbrush, HandHelping, Wrench, Flame, Car, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
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
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState(1);
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Voice Assistant States
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiAssist, setShowAiAssist] = useState(false);

  const startListening = () => {
    setAiError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiError("Speech recognition is not supported in this browser. Please type or paste your details below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langLocales: Record<string, string> = {
        hi: 'hi-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        pa: 'pa-IN',
        en: 'en-IN',
      };

      recognition.lang = langLocales[language] || 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setAiError("Failed to capture speech. Please try again.");
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
      };

      recognition.start();
    } catch (err: any) {
      console.error(err);
      setAiError("Failed to initiate voice recognition.");
      setIsListening(false);
    }
  };

  const handleAiParse = async () => {
    if (!voiceText.trim()) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/user-type");
        return;
      }

      const res = await axios.post(
        "http://localhost:5001/api/ai/parse-profile-text",
        { text: voiceText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success && res.data.profile) {
        const profile = res.data.profile;
        if (profile.name) setName(profile.name);
        if (profile.skills) setSelectedSkills(profile.skills);
        if (profile.experience) setExperience(profile.experience);
        if (profile.city) setCity(profile.city);

        alert("AI successfully filled in your details! Please review and click Done to complete.");
        setShowAiAssist(false);
        setVoiceText("");
      } else {
        setAiError(res.data.message || "Failed to process speech input.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.response?.data?.message || "Failed to reach AI parsing service.");
    } finally {
      setAiLoading(false);
    }
  };

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
            {/* AI Assistant card */}
            <div className="mb-6 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                  <span className="font-bold text-indigo-900 text-lg">AI Voice Assistant</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiAssist(!showAiAssist)}
                  className="border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-100"
                >
                  {showAiAssist ? "Hide" : "Try Voice Setup"}
                </Button>
              </div>

              {showAiAssist && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    Tell us about yourself in your native language (e.g. <em>"मेरा नाम राम है, मैं मुंबई में ३ साल से कारपेंटर का काम करता हूँ"</em>). The AI will fill in all details!
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={isListening ? () => {} : startListening}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                      }`}
                      disabled={aiLoading}
                    >
                      {isListening ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <span className="text-sm font-semibold text-indigo-800">
                      {isListening ? "Listening... Speak now!" : "Click mic to speak"}
                    </span>
                  </div>

                  <textarea
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    placeholder="Your speech transcript will show here. You can also type or edit this text..."
                    className="w-full h-24 rounded-xl border border-indigo-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={aiLoading}
                  />

                  {aiError && <p className="text-sm font-medium text-destructive">{aiError}</p>}

                  <Button
                    onClick={handleAiParse}
                    disabled={!voiceText.trim() || aiLoading || isListening}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        AI is analyzing...
                      </>
                    ) : (
                      "Auto-fill Profile Details"
                    )}
                  </Button>
                </div>
              )}
            </div>

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
