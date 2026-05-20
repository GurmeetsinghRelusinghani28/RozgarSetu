import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Check, X, MapPin, IndianRupee, Star, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'APPROVED';

interface Application {
  id: string;
  workerId: string;
  projectId: string;
  workerName: string;
  skill: string;
  experience: number;
  expectedWage: number;
  rating: number;
  location: string;
  jobTitle: string;
  status: ApplicationStatus;
}

const WorkerApplications = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/projects/contractor-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load applications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (appId: string, projectId: string, workerId: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5001/api/projects/${projectId}/applicants/${workerId}/status`,
        { status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setApplications(prev => prev.map(app =>
          app.id === appId ? { ...app, status: action } : app
        ));
        toast({ title: action === 'ACCEPTED' ? t('applicationAccepted') : t('applicationRejected') });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to action worker' });
    }
  };

  const statusColor = (s: ApplicationStatus) => {
    if (s === 'ACCEPTED') return 'bg-primary/10 text-primary';
    if (s === 'REJECTED') return 'bg-destructive/10 text-destructive';
    if (s === 'APPROVED') return 'bg-green-100 text-green-700';
    return 'bg-accent/10 text-accent';
  };

  const statusLabel = (s: ApplicationStatus) => {
    if (s === 'ACCEPTED') return t('applicationAccepted');
    if (s === 'REJECTED') return t('applicationRejected');
    return t('applicationPending');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-accent px-6 pb-6 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-accent-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-accent-foreground">{t('workerApplications')}</h1>
      </div>

      <div className="flex flex-col gap-4 px-6 pt-4">
        {loading ? (
          <div className="flex justify-center p-8 text-muted-foreground">Loading Applications...</div>
        ) : applications.length === 0 ? (
          <div className="flex justify-center p-8 text-muted-foreground">{t('noApplicationsFound') || 'No applications found.'}</div>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{app.workerName}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{t(app.skill)} • {app.experience} {t('years')}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(app.status)}`}>
                    {statusLabel(app.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {app.location}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <IndianRupee className="h-4 w-4" /> ₹{app.expectedWage}{t('perDay')}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-accent">
                    <Star className="h-4 w-4 fill-accent" /> {app.rating.toFixed(1)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {t('appliedFor')}: <span className="font-semibold text-foreground">{app.jobTitle}</span>
                </p>

                {app.status === 'PENDING' && (
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={() => handleAction(app.id, app.projectId, app.workerId, 'ACCEPTED')}
                      className="flex-1 rounded-xl text-base font-semibold"
                      size="lg"
                    >
                      <Check className="mr-1 h-5 w-5" /> {t('acceptWorker')}
                    </Button>
                    <Button
                      onClick={() => handleAction(app.id, app.projectId, app.workerId, 'REJECTED')}
                      variant="destructive"
                      className="flex-1 rounded-xl text-base font-semibold"
                      size="lg"
                    >
                      <X className="mr-1 h-5 w-5" /> {t('rejectWorker')}
                    </Button>
                  </div>
                )}

                {app.status === 'ACCEPTED' && (
                  <div className="mt-4 flex gap-3 border-t border-border pt-4">
                    <Button
                      onClick={() => navigate(`/worker-profile/${app.workerId}`)}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={() => navigate(`/chat/${app.projectId}/${app.workerId}`)}
                      className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkerApplications;
