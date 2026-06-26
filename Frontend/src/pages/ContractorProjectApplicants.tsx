import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, MapPin, Sparkles, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Applicant {
  _id: string;
  workerId: string;
  appliedAt: string;
  status: string;
  user: {
    _id: string;
    name: string;
    phone?: string;
    location?: string;
  };
  workerProfile?: {
    skills?: string[];
    experience?: number;
    city?: string;
    reviews?: Array<{ rating: number; comment?: string }>;
  };
  suitabilityScore?: number;
  distanceKm?: number | null;
  averageRating?: number;
  aiSummary?: string[];
}

const getScoreTone = (score = 0) => {
  if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const formatDistance = (distanceKm?: number | null) => {
  if (distanceKm === null || distanceKm === undefined) return 'Distance unavailable';
  if (distanceKm <= 3) return `Within ${distanceKm}km`;
  return `${distanceKm}km away`;
};

const ContractorProjectApplicants = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projectId } = useParams<{ projectId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [ratingState, setRatingState] = useState<Record<string, { rating: number; comment: string }>>({});

  const fetchApplicants = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user-type');
        return;
      }

      const res = await axios.get(`https://rozgarsetu-niht.onrender.com/api/projects/${projectId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setApplicants(res.data.applicants || []);
      } else {
        setError(res.data.message || 'Failed to load applicants');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (workerId: string) => {
    const { rating, comment } = ratingState[workerId] || { rating: 0, comment: '' };
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user-type');
        return;
      }

      await axios.post(
        `https://rozgarsetu-niht.onrender.com/api/ratings`,
        {
          toUserId: workerId,
          jobId: projectId,
          rating,
          review: comment
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh list so rating changes reflect (if profile includes reviews)
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const updateWorkerStatus = async (workerId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://rozgarsetu-niht.onrender.com/api/projects/${projectId}/applicants/${workerId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} worker`);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [projectId]);

  const handleRatingChange = (workerId: string, value: number) => {
    setRatingState((prev) => ({
      ...prev,
      [workerId]: {
        rating: value,
        comment: prev[workerId]?.comment || '',
      },
    }));
  };

  const handleCommentChange = (workerId: string, value: string) => {
    setRatingState((prev) => ({
      ...prev,
      [workerId]: {
        rating: prev[workerId]?.rating || 0,
        comment: value,
      },
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-8 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t('applicants')}</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('viewApplications')}</p>
      </div>

      <div className="px-6 -mt-4">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <span className="text-lg font-semibold">{t('loading')}...</span>
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
            <p className="text-center text-sm text-destructive">{error}</p>
            <Button onClick={fetchApplicants}>{t('retry')}</Button>
          </div>
        ) : applicants.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            {t('noWorkersFound')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applicants.map((applicant, index) => {
              const reviews = applicant.workerProfile?.reviews || [];
              const rating = reviews.length
                ? reviews.reduce((sum: number, r: { rating?: number }) => sum + (r.rating || 0), 0) / reviews.length
                : applicant.averageRating || 0;
              const suitabilityScore = applicant.suitabilityScore || 0;
              const isTopCandidate = index === 0 && suitabilityScore >= 60;

              const currentRating = ratingState[applicant._id]?.rating || 0;
              const currentComment = ratingState[applicant._id]?.comment || '';

              return (
                <Card
                  key={applicant._id}
                  className={`rounded-2xl transition-shadow ${
                    isTopCandidate
                      ? 'border-green-300 bg-green-50/60 shadow-md'
                      : 'border-border bg-card'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-foreground">{applicant.user?.name || '—'}</h2>
                          {isTopCandidate && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                              <Trophy className="h-3.5 w-3.5" /> Top Match
                            </span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {applicant.workerProfile?.city || applicant.user?.location || '—'} • {formatDistance(applicant.distanceKm)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>
                            <span className="font-semibold text-foreground">{t('experience')}:</span> {applicant.workerProfile?.experience || 0} {t('years')}
                          </span>
                          <span>
                            <span className="font-semibold text-foreground">{t('skillsLabel')}:</span> {applicant.workerProfile?.skills?.join(', ') || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-3 py-1 text-sm font-bold ${getScoreTone(suitabilityScore)}`}>
                          {suitabilityScore}% Match
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 text-yellow-500" /> {rating.toFixed(1)}
                        </div>
                        <div className="text-sm font-semibold capitalize text-primary">
                          Status: {applicant.status}
                        </div>
                      </div>
                    </div>

                    {applicant.aiSummary && applicant.aiSummary.length > 0 && (
                      <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                          <Sparkles className="h-4 w-4 text-accent" />
                          AI Fit Summary
                        </div>
                        <ul className="space-y-1 pl-5 text-sm text-muted-foreground">
                          {applicant.aiSummary.map((summary, summaryIndex) => (
                            <li key={`${applicant._id}-summary-${summaryIndex}`} className="list-disc">
                              {summary}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {applicant.status === 'PENDING' ? (
                      <div className="mt-4 flex gap-2">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white" 
                          onClick={() => updateWorkerStatus(applicant.workerId, 'ACCEPTED')}
                        >
                          Accept Worker
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => updateWorkerStatus(applicant.workerId, 'REJECTED')}
                        >
                          Reject Worker
                        </Button>
                      </div>
                    ) : applicant.status === 'ACCEPTED' ? (
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-foreground">{t('rateWorker')}:</label>
                          <select
                            value={currentRating}
                            onChange={(e) => handleRatingChange(applicant._id, Number(e.target.value))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            <option value={0}>—</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          value={currentComment}
                          onChange={(e) => handleCommentChange(applicant._id, e.target.value)}
                          placeholder={t('commentPlaceholder')}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                        />

                        <div className="flex gap-2">
                          <Button onClick={() => submitRating(applicant.workerId)} className="w-full">
                            {t('submitReview')}
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => navigate(`/chat/${projectId}/${applicant.workerId}`)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                          >
                            Open Chat
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav type="contractor" active="projects" />
    </div>
  );
};

export default ContractorProjectApplicants;
