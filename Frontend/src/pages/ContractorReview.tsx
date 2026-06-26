import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

const ContractorReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const query = new URLSearchParams(location.search);
  const workerId = query.get('workerId');

  const handleSubmit = async () => {
    if (!workerId) {
      toast({ title: t('error'), description: 'Missing worker id' });
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user-type');
        return;
      }

      await axios.post(
        `https://rozgarsetu-niht.onrender.com/api/worker/reviews/${workerId}`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({ title: t('submitReview'), description: `⭐ ${rating}/5` });
      navigate('/contractor-dashboard');
    } catch (err: any) {
      toast({ title: t('error'), description: err.response?.data?.message || 'Failed to submit review' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-lg text-accent">
        <ArrowLeft className="h-6 w-6" /> {t('back')}
      </button>

      <h1 className="mb-8 text-2xl font-bold text-foreground">{t('rateWorker')}</h1>

      <div className="mb-2 text-center text-lg font-medium text-muted-foreground">राजेश कुमार</div>

      <div className="mb-8 flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setRating(s)} className="p-1">
            <Star className={`h-12 w-12 transition-all ${s <= rating ? 'fill-accent text-accent scale-110' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="mb-3 block text-xl font-medium">{t('addComment')}</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          className="min-h-[120px] rounded-xl text-lg"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="mt-auto h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90"
        size="lg"
      >
        {t('submitReview')}
      </Button>
    </div>
  );
};

export default ContractorReview;
