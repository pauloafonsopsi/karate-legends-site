import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Upload, Share2, Globe, Link, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const steps = [
  { icon: Globe, key: 'step1' },
  { icon: Upload, key: 'step2' },
  { icon: Share2, key: 'step3' },
  { icon: Link, key: 'step4' },
  { icon: Copy, key: 'step5' },
];

const DriveTutorial = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gold/10 border-2 border-gold/40 hover:border-gold hover:bg-gold/20 text-gold font-bold uppercase tracking-widest text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black-card"
      >
        <HelpCircle size={20} aria-hidden="true" />
        {t('drive_tutorial.title')}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black-deep/95 border border-gold/30 text-white-warm max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold uppercase tracking-widest text-lg flex items-center gap-2">
              <HelpCircle size={20} aria-hidden="true" />
              {t('drive_tutorial.title')}
            </DialogTitle>
          </DialogHeader>

          <ol className="space-y-3 pt-2 list-none">
            <li>
              <p className="text-white/70 text-sm mb-4">{t('drive_tutorial.intro')}</p>
            </li>
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.key} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-7 h-7 bg-gold/20 flex items-center justify-center text-gold text-xs font-bold" aria-hidden="true">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className="text-gold" aria-hidden="true" />
                      <span className="text-sm text-white-warm font-medium">{t(`drive_tutorial.${step.key}_title`)}</span>
                    </div>
                    <p className="text-white/60 text-xs">{t(`drive_tutorial.${step.key}_desc`)}</p>
                  </div>
                </li>
              );
            })}
            <li>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold text-sm hover:underline mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black-deep"
              >
                <Globe size={12} aria-hidden="true" />
                {t('drive_tutorial.open_drive')}
              </a>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DriveTutorial;
