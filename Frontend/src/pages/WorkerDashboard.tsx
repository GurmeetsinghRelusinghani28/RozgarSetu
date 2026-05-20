import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, ClipboardList, Search, MapPin, IndianRupee, Clock, Lightbulb, TrendingUp, HelpCircle, Bell, UtensilsCrossed, Home as HomeIcon, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';

const API = "http://localhost:5001/api/worker";

interface Notification {
  id: number;
  jobTitle: string;
  location: string;
  wage: number;
  timeAgo: string;
  read: boolean;
}

const FacilityIcons = ({ food, accommodation, insurance }: { food: boolean; accommodation: boolean; insurance: boolean }) => (
  <div className="flex gap-2 mt-2">
    {food && <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent"><UtensilsCrossed className="h-3 w-3" /> 🍽️</span>}
    {accommodation && <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"><HomeIcon className="h-3 w-3" /> 🏠</span>}
    {insurance && <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive"><ShieldCheck className="h-3 w-3" /> 🛡️</span>}
  </div>
);

const JobCard = ({ job, t, navigate, onSave, onApply, isSaved, isApplied, applicationStatus }: { job: any; t: (key: string) => string; navigate: (path: string) => void; onSave?: (id: string) => void; onApply?: (id: string) => void; isSaved?: boolean; isApplied?: boolean; applicationStatus?: string }) => (
  <Card className="rounded-2xl overflow-hidden">
    <CardContent className="p-0">
      {job.image && (
        <img src={job.image} alt={job.title} className="aspect-video w-full object-cover" loading="lazy" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{job.projectTitle || job.title}</h3>
            <p className="mt-1 text-base text-muted-foreground">{job.contractorId?.name || job.contractor}</p>
          </div>
          {applicationStatus && (
            <Badge 
              variant={applicationStatus === 'accepted' ? 'default' : applicationStatus === 'rejected' ? 'destructive' : 'secondary'}
              className="ml-2"
            >
              {applicationStatus === 'accepted' ? t('applicationAccepted') : applicationStatus === 'rejected' ? t('applicationRejected') : t('applicationPending')}
            </Badge>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {job.location}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary"><IndianRupee className="h-4 w-4" /> ₹{job.wage}{t('perDay')}</span>
          {job.duration && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {job.duration} {t('days')}</span>
          )}
        </div>
        <FacilityIcons food={job.facilities?.food ?? job.food} accommodation={job.facilities?.accommodation ?? job.accommodation} insurance={job.facilities?.insurance ?? job.insurance} />
        <div className="mt-4 flex flex-col gap-2">
          {onApply && (
            <Button
              variant={isApplied ? "secondary" : "default"}
              className="w-full rounded-xl text-base font-semibold"
              onClick={() => onApply(job._id || job.id)}
              disabled={isApplied}
            >
              {isApplied ? t('applied') : t('apply')}
            </Button>
          )}
          {onSave && (
            <Button
              variant={isSaved ? "secondary" : "outline"}
              className="w-full rounded-xl text-base font-semibold"
              onClick={() => onSave(job._id || job.id)}
            >
              {isSaved ? t('saved') : t('save')}
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, jobTitle: 'Building Construction', location: 'Delhi', wage: 850, timeAgo: '5', read: false },
    { id: 2, jobTitle: 'Road Repair Work', location: 'Noida', wage: 700, timeAgo: '15', read: false },
    { id: 3, jobTitle: 'Plumbing - Mall Project', location: 'Gurgaon', wage: 900, timeAgo: '30', read: true },
  ]);

  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/user-type');
        return;
      }

      const res = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load dashboard');

      setRecommendedJobs(data.recommendedJobs || []);
      setMyJobs(data.appliedJobs || []);
      setSavedJobs(data.savedJobs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API}/dashboard/save/${projectId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const applyJob = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API}/dashboard/apply/${projectId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Simulate a new notification after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => [
        { id: Date.now(), jobTitle: 'New Painting Job', location: 'Delhi', wage: 750, timeAgo: '0', read: false },
        ...prev,
      ]);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const savedIds = new Set(savedJobs.map((j) => j._id || j.id));
  const appliedIds = new Set(myJobs.map((j) => j._id || j.id));

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
          <Button onClick={fetchDashboard}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-8 pt-8">
        <button onClick={() => navigate('/user-type')} className="mb-3 flex items-center gap-2 text-base text-primary-foreground/80">
          <ArrowLeft className="h-5 w-5" /> {t('back')}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-foreground">{t('hello')}, राजेश 👋</h1>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full bg-primary-foreground/20 p-2"
          >
            <Bell className="h-6 w-6 text-primary-foreground" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
                {unreadCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="mx-6 -mt-2 mb-4 rounded-2xl border border-border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground">{t('notifications')}</h3>
            <button onClick={markAllRead} className="text-sm font-medium text-primary">{t('markAllRead')}</button>
          </div>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${!n.read ? 'bg-primary/5' : 'bg-transparent'}`}
                onClick={() => {
                  setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                  navigate('/jobs');
                }}
              >
                <div className={`mt-1 h-2 w-2 rounded-full ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{n.jobTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="mr-1 inline h-3 w-3" />{n.location} • ₹{n.wage}{t('perDay')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {n.timeAgo === '0' ? t('justNow') : `${n.timeAgo} ${t('minutesAgo')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 -mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center p-5">
              <ClipboardList className="mb-2 h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-foreground">5</span>
              <span className="text-sm text-muted-foreground">{t('jobsApplied')}</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center p-5">
              <Briefcase className="mb-2 h-8 w-8 text-accent" />
              <span className="text-3xl font-bold text-foreground">2</span>
              <span className="text-sm text-muted-foreground">{t('activeJobs')}</span>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/skill-tips')} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
            <Lightbulb className="h-7 w-7 text-accent" />
            <span className="text-xs font-semibold text-foreground">{t('skillTips')}</span>
          </button>
          <button onClick={() => navigate('/earnings')} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
            <TrendingUp className="h-7 w-7 text-primary" />
            <span className="text-xs font-semibold text-foreground">{t('earningsTracker')}</span>
          </button>
          <button onClick={() => navigate('/help-center')} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
            <HelpCircle className="h-7 w-7 text-destructive" />
            <span className="text-xs font-semibold text-foreground">{t('helpCenter')}</span>
          </button>
        </div>

        <Button onClick={() => navigate('/jobs')} className="mt-6 h-14 w-full rounded-2xl text-xl font-bold" size="lg">
          <Search className="mr-2 h-6 w-6" /> {t('findJobs')}
        </Button>

        <Tabs defaultValue="recommended" className="mt-8">
          <TabsList className="w-full rounded-xl">
            <TabsTrigger value="recommended" className="flex-1 text-sm">{t('recommendedJobs')}</TabsTrigger>
            <TabsTrigger value="myJobs" className="flex-1 text-sm">{t('myJobs')}</TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 text-sm">{t('savedJobs')}</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="mt-4">
            <div className="flex flex-col gap-4">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  t={t}
                  navigate={navigate}
                  onSave={toggleSave}
                  onApply={applyJob}
                  isSaved={savedIds.has(job._id || job.id)}
                  isApplied={appliedIds.has(job._id || job.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="myJobs" className="mt-4">
            <div className="flex flex-col gap-4">
              {myJobs.length > 0 ? myJobs.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  t={t}
                  navigate={navigate}
                  onSave={toggleSave}
                  onApply={applyJob}
                  isSaved={savedIds.has(job._id || job.id)}
                  isApplied={true}
                  applicationStatus={job.applicationStatus}
                />
              )) : (
                <p className="py-8 text-center text-muted-foreground">{t('noJobsFound')}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="flex flex-col gap-4">
              {savedJobs.length > 0 ? savedJobs.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  t={t}
                  navigate={navigate}
                  onSave={toggleSave}
                  onApply={applyJob}
                  isSaved={true}
                  isApplied={appliedIds.has(job._id || job.id)}
                />
              )) : (
                <p className="py-8 text-center text-muted-foreground">{t('noJobsFound')}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav type="worker" active="home" />
    </div>
  );
};

export default WorkerDashboard;
