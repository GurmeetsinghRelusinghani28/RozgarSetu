import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer } from 'lucide-react';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/language'), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-8">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-accent">
        <Hammer className="h-14 w-14 text-accent-foreground" />
      </div>
      <h1 className="mb-2 text-4xl font-bold text-primary-foreground">RozgarSetu</h1>
      <p className="text-xl text-primary-foreground/80">रोज़गारसेतु</p>
      <p className="mt-4 text-lg text-primary-foreground/60">Connecting Workers & Contractors</p>
      <div className="mt-12 h-1 w-32 animate-pulse rounded-full bg-primary-foreground/30" />
    </div>
  );
};

export default SplashScreen;
