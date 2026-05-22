import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Briefcase, User, HelpCircle, FolderOpen, Users, Bot } from 'lucide-react';

interface BottomNavProps {
  type: 'worker' | 'contractor';
  active: string;
}

const BottomNav = ({ type, active }: BottomNavProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const workerTabs = [
    { key: 'home', icon: Home, label: t('home'), path: '/worker-dashboard' },
    { key: 'jobs', icon: Briefcase, label: t('jobs'), path: '/jobs' },
    { key: 'mitra', icon: Bot, label: 'Mitra', path: '/rozgar-mitra' },
    { key: 'profile', icon: User, label: t('profile'), path: '/worker-profile-view' },
    { key: 'help', icon: HelpCircle, label: t('help'), path: '/help-center' },
  ];

  const contractorTabs = [
    { key: 'home', icon: Home, label: t('home'), path: '/contractor-dashboard' },
    { key: 'projects', icon: FolderOpen, label: t('projects'), path: '/contractor-projects' },
    { key: 'workers', icon: Users, label: t('workers'), path: '/contractor-workers' },
    { key: 'profile', icon: User, label: t('profile'), path: '/contractor-profile' },
  ];

  const tabs = type === 'worker' ? workerTabs : contractorTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="flex justify-around py-2">
        {tabs.map(({ key, icon: Icon, label, path }) => (
          <button
            key={key}
            onClick={() => navigate(path)}
            className={`flex min-w-[64px] flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
              active === key ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-6 w-6" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
