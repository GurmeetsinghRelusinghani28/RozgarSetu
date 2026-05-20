import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Phone, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import BottomNav from '@/components/BottomNav';

const HelpCenter = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const faqs = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-6 pt-8">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-lg text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t('helpCenter')}</h1>
      </div>

      <div className="px-6 pt-4">
        <Button
          onClick={() => window.open('tel:+911800123456')}
          className="mb-6 h-14 w-full rounded-2xl text-xl font-bold"
          size="lg"
        >
          <Phone className="mr-2 h-6 w-6" /> {t('callSupport')}
        </Button>

        <h2 className="mb-4 text-xl font-bold text-foreground">{t('faq')}</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-2xl border border-border bg-card px-4">
              <AccordionTrigger className="text-base font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  {faq.q}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <BottomNav type="worker" active="help" />
    </div>
  );
};

export default HelpCenter;
