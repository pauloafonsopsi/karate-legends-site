import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-black-card border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center mb-6 group">
              <img
                src="/symbol.png"
                alt="Karate Legends"
                className="w-10 h-10 object-contain mr-3 grayscale group-hover:grayscale-0 transition-all duration-300"
              />
              <span className="font-display text-3xl tracking-tighter gold-text-gradient">KARATE LEGENDS</span>
            </Link>
            <p className="text-white/60 max-w-md mb-8">
              {t('hero.subtitle')}
            </p>
            <div className="flex space-x-2 -ml-3">
              <a
                href="https://www.instagram.com/karatelegendsleague"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('nav.instagram')}
                className="inline-flex items-center justify-center w-11 h-11 text-white/40 hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black-card"
              >
                <Instagram size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-gold font-display text-lg mb-6 tracking-widest">Navegação</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-white/60 hover:text-white transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/eventos" className="text-white/60 hover:text-white transition-colors">{t('nav.events')}</Link></li>
              <li><Link to="/atletas" className="text-white/60 hover:text-white transition-colors">{t('nav.athletes')}</Link></li>
              <li><Link to="/blog" className="text-white/60 hover:text-white transition-colors">{t('nav.blog')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-display text-lg mb-6 tracking-widest">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/privacidade" className="text-white/60 hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="text-white/60 hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link to="/reembolso" className="text-white/60 hover:text-white transition-colors">Política de Reembolso</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-white/30 tracking-widest uppercase">
          <p>© 2026 KARATE LEGENDS. ALL RIGHTS RESERVED.</p>
          <p className="mt-4 md:mt-0">DESIGNED FOR LEGENDS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
