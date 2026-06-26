import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Star, MapPin, IndianRupee, Briefcase, Blocks, Hammer, Zap, Paintbrush } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

interface Review {
  _id?: string;
  contractorId?: {
    _id: string;
    name: string;
    company?: string;
  };
  rating: number;
  comment?: string;
  createdAt?: string;
}

interface WorkerProfileData {
  name: string;
  skills: string[];
  experience: number;
  expectedWage?: number;
  city: string;
  reviews?: Review[];
}

const WorkerProfileView = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<WorkerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/user-type');
        return;
      }

      const res = await axios.get('https://rozgarsetu-niht.onrender.com/api/worker/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setProfile(res.data.profile);
      } else {
        setError(res.data.message || 'Failed to load profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const reviews = profile?.reviews || [];

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const totalReviews = reviews.length;

  const skillIcons: Record<string, typeof Blocks> = {
    mason: Blocks,
    carpenter: Hammer,
    electrician: Zap,
    painter: Paintbrush,
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-5 w-5 ${s <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-xl font-semibold">{t('loading')}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="mb-4 text-lg font-semibold text-destructive">{t('error')}</p>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchProfile}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-lg font-semibold text-muted-foreground">{t('noData')}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-8 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t('workerProfile')}</h1>
      </div>

      <div className="px-6 -mt-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={averageRating} />
                  <span className="text-sm font-semibold text-muted-foreground">({averageRating})</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="text-base"><span className="font-semibold">{t('experience')}:</span> {profile.experience} {t('years')}</span>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-accent" />
                <span className="text-base"><span className="font-semibold">{t('expectedWage')}:</span> ₹{profile.expectedWage ?? 0}{t('perDay')}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="text-base"><span className="font-semibold">{t('city')}:</span> {profile.city}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-bold">{t('skillsLabel')}</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => {
                  const Icon = skillIcons[s] || Blocks;
                  return (
                    <span key={s} className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                      <Icon className="h-4 w-4" /> {t(s)}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-4 mt-8 text-xl font-bold text-foreground">{t('reviews')} ({totalReviews})</h2>
        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('noRatingsYet')}</p>
          ) : (
            reviews.map((r) => (
              <Card key={r._id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">
                      {r.contractorId?.name || t('contractor')}
                    </h3>
                    <StarRating rating={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                  {r.createdAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <BottomNav type="worker" active="profile" />
    </div>
  );
};

export default WorkerProfileView;
