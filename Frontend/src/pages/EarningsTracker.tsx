import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, IndianRupee, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const EarningsTracker = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const earnings = [
    { label: t('thisMonth'), amount: 18400 },
    { label: t('lastMonth'), amount: 22000 },
  ];

  const recentPayments = [
    { job: 'Building Construction', amount: 4800, days: 6, date: '2026-02-10' },
    { job: 'House Painting', amount: 4200, days: 7, date: '2026-02-03' },
    { job: 'Electrical Wiring', amount: 9000, days: 10, date: '2026-01-20' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-6 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t('earningsTracker')}</h1>
      </div>

      <div className="px-6 -mt-4">
        <div className="grid grid-cols-2 gap-4">
          {earnings.map(({ label, amount }) => (
            <Card key={label} className="rounded-2xl">
              <CardContent className="flex flex-col items-center p-5">
                <IndianRupee className="mb-2 h-7 w-7 text-accent" />
                <span className="text-2xl font-bold text-foreground">₹{amount.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mb-4 mt-8 text-xl font-bold text-foreground">{t('recentJobs')}</h2>
        <div className="flex flex-col gap-3">
          {recentPayments.map((p, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{p.job}</h3>
                  <p className="text-sm text-muted-foreground">{p.days} {t('days')} • {p.date}</p>
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-accent">
                  <TrendingUp className="h-5 w-5" />
                  ₹{p.amount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav type="worker" active="home" />
    </div>
  );
};

export default EarningsTracker;
