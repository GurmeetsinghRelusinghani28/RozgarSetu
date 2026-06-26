import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, IndianRupee, Clock, Search, Bookmark, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

const skillFilters = ['allSkills', 'mason', 'carpenter', 'electrician', 'painter', 'helper', 'plumber'];


interface JobListingItem {
  _id: string;
  projectTitle: string;
  location: string;
  wage: number;
  startDate?: string;
  contractorId?: {
    _id: string;
    name: string;
    location?: string;
  };
  skillType?: string;
  subSkill?: string;
  facilities?: {
    food?: boolean;
    accommodation?: boolean;
    insurance?: boolean;
  };
  images?: string[];
}

const JobListing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('allSkills');
  const [jobs, setJobs] = useState<JobListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (selectedSkill !== 'allSkills') params.skill = selectedSkill;
      if (searchText.trim()) params.search = searchText.trim();

      const res = await axios.get('https://rozgarsetu-niht.onrender.com/api/projects', { params });

      if (res.data?.success) {
        setJobs(res.data.projects || []);
      } else {
        setError(res.data?.message || 'Failed to load jobs');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('https://rozgarsetu-niht.onrender.com/api/worker/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAppliedIds((res.data.appliedJobs || []).map((j: any) => j._id || j.id));
        setSavedIds((res.data.savedJobs || []).map((j: any) => j._id || j.id));
      }
    } catch {
      // ignore
    }
  };

  const applyToJob = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/worker-login');
        return;
      }

      const res = await axios.post(
        `https://rozgarsetu-niht.onrender.com/api/worker/dashboard/apply/${projectId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setAppliedIds((prev) => [...new Set([...prev, projectId])]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply for job');
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchWorkerDashboard();
  }, [selectedSkill, searchText]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-6 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="mb-4 text-2xl font-bold text-primary-foreground">{t('jobListings')}</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t('search')}
            className="h-12 rounded-xl bg-background pl-12 text-base"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-6 py-4">
        {skillFilters.map((skill) => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(skill)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              selectedSkill === skill ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {t(skill)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-6">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <span className="text-lg font-semibold">{t('loading')}...</span>
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
            <p className="text-center text-sm text-destructive">{error}</p>
            <Button onClick={fetchJobs}>{t('retry')}</Button>
          </div>
        ) : jobs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{t('noJobsFound')}</p>
        ) : (
          jobs.map((job) => {
            const jobId = job._id;
            const contractorName = job.contractorId?.name || '';
            const jobLocation = job.location || job.contractorId?.location || '';
            const facilities = job.facilities || {};

            return (
              <Card key={jobId} className="rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {job.images && job.images.length > 0 && (
                    <img src={job.images[0]} alt={job.projectTitle} className="aspect-video w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{job.projectTitle}</h3>
                        <p className="mt-1 text-base text-muted-foreground">{contractorName}</p>
                      </div>
                      <button onClick={() => toggleSave(jobId)} className="p-1">
                        <Bookmark className={`h-6 w-6 ${savedIds.includes(jobId) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {jobLocation}</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-primary"><IndianRupee className="h-4 w-4" /> ₹{job.wage}{t('perDay')}</span>
                      {job.startDate && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {new Date(job.startDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      {facilities.food && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">🍽️ {t('food')}</span>}
                      {facilities.accommodation && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">🏠 {t('accommodation')}</span>}
                      {facilities.insurance && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">🛡️ {t('insurance')}</span>}
                    </div>
                    <Button
                      onClick={() => applyToJob(jobId)}
                      className="mt-4 w-full rounded-xl text-base font-semibold"
                      size="lg"
                      disabled={appliedIds.includes(jobId)}
                    >
                      {appliedIds.includes(jobId) ? t('applied') : t('apply')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <BottomNav type="worker" active="jobs" />
    </div>
  );
};

export default JobListing;
