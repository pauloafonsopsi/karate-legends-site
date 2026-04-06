import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-black-accent border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center mb-6 group">
              <img 
                src="/logo.png" 
                alt="Karate Legends Logo" 
                className="w-10 h-10 object-contain mr-3 grayscale group-hover:grayscale-0 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <span className="font-display text-3xl tracking-tighter gold-text-gradient">KARATE LEGENDS</span>
            </Link>
            <p className="text-white/60 max-w-md mb-8">
              {t('hero.subtitle')}
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-white/40 hover:text-gold transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-white/40 hover:text-gold transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-white/40 hover:text-gold transition-colors"><Youtube size={20} /></a>
              <a href="#" className="text-white/40 hover:text-gold transition-colors"><Twitter size={20} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-gold font-display text-lg mb-6 tracking-widest">Navigation</h4>
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
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Refund Policy</a></li>
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
