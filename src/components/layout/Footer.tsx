import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram } from 'lucide-react';
import prestigeLogo from '@/assets/karate-legends-prestige-lockup.png';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center mb-6 group">
              <img
                src={prestigeLogo}
                alt="Karate Legends"
                className="h-11 w-auto max-w-[210px] object-contain transition-all duration-300 group-hover:brightness-110"
              />
            </Link>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex space-x-2 -ml-3">
              <a
                href="https://www.instagram.com/karatelegendsleague"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('nav.instagram')}
                className="inline-flex items-center justify-center w-11 h-11 border border-border rounded-sm text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black-card"
              >
                <Instagram size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-gold font-display text-lg mb-6 tracking-widest">Navegação</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.home')}</Link></li>
              {/* Eventos e Blog ocultos temporariamente */}
              <li><Link to="/membros" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.members')}</Link></li>
              <li><Link to="/ppv" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.ppv')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-display text-lg mb-6 tracking-widest">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link to="/reembolso" className="text-muted-foreground hover:text-foreground transition-colors">Política de Reembolso</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground tracking-widest uppercase">
          <p>© 2026 KARATE LEGENDS. ALL RIGHTS RESERVED.</p>
          <p className="mt-4 md:mt-0">DESIGNED FOR LEGENDS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
