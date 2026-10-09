import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const parts = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { v: Math.floor(s / 86400), l: 'days' },
    { v: Math.floor((s % 86400) / 3600), l: 'hours' },
    { v: Math.floor((s % 3600) / 60), l: 'min' },
    { v: s % 60, l: 'sec' },
  ];
};

/** Countdown to a date; renders nothing when the date is missing or past. */
const Contagem = ({ data }: { data: string | null }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  if (!data) return null;
  const diff = new Date(data).getTime() - now;
  if (diff <= 0) return null;
  return (
    <div className="flex gap-4 md:gap-8 justify-center" role="timer" aria-label={t('legends.countdown')}>
      {parts(diff).map(p => (
        <div key={p.l} className="flex flex-col items-center min-w-[3.5rem]">
          <span className="font-display text-4xl md:text-6xl text-foreground leading-none tabular-nums">{String(p.v).padStart(2, '0')}</span>
          <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground mt-2">{t(`legends.${p.l}`)}</span>
        </div>
      ))}
    </div>
  );
};

export default Contagem;
