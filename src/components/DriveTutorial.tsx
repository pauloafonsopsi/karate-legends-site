import { useTranslation } from 'react-i18next';
import { HelpCircle, Upload, Share2, Globe, Link, Copy } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const steps = [
  { icon: Globe, key: 'step1' },
  { icon: Upload, key: 'step2' },
  { icon: Share2, key: 'step3' },
  { icon: Link, key: 'step4' },
  { icon: Copy, key: 'step5' },
];

const DriveTutorial = () => {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="drive-tutorial" className="border-gold/20">
          <AccordionTrigger className="text-gold hover:no-underline gap-2 py-3">
            <span className="flex items-center gap-2 text-sm uppercase tracking-widest">
              <HelpCircle size={16} />
              {t('drive_tutorial.title')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <p className="text-white/50 text-xs mb-4">{t('drive_tutorial.intro')}</p>
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10">
                    <div className="flex-shrink-0 w-7 h-7 bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className="text-gold" />
                        <span className="text-sm text-white font-medium">{t(`drive_tutorial.${step.key}_title`)}</span>
                      </div>
                      <p className="text-white/40 text-xs">{t(`drive_tutorial.${step.key}_desc`)}</p>
                    </div>
                  </div>
                );
              })}
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold text-xs hover:underline mt-2"
              >
                <Globe size={12} />
                {t('drive_tutorial.open_drive')}
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default DriveTutorial;
