import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.events'), path: '/eventos' },
    { name: t('nav.athletes'), path: '/atletas' },
    { name: t('nav.blog'), path: '/blog' },
    { name: t('nav.ppv'), path: '/ppv' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "glass-morphism py-3" : "bg-transparent py-6"
    )}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center group">
          <img 
            src="/symbol.png" 
            alt="Karate Legends" 
            className="w-10 h-10 object-contain mr-3 group-hover:scale-110 transition-transform duration-300"
          />
          <span className="font-display text-xl tracking-tighter gold-text-gradient">KARATE LEGENDS</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "uppercase tracking-widest text-sm font-medium transition-colors hover:text-gold",
                location.pathname === link.path ? "text-gold" : "text-white-warm/80"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center space-x-2 ml-4 border-l border-white/20 pl-4" role="group" aria-label={t('nav.language')}>
            {['pt', 'en', 'es'].map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                aria-label={`${t('nav.language')}: ${lang.toUpperCase()}`}
                aria-pressed={i18n.language.startsWith(lang)}
                className={cn(
                  "text-xs uppercase font-bold px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black-deep",
                  i18n.language.startsWith(lang) ? "text-gold" : "text-white/40 hover:text-white"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden flex items-center space-x-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? t('nav.close_menu') : t('nav.open_menu')}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            className="text-gold p-2 -mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black-deep"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-nav" className="md:hidden absolute top-full left-0 right-0 glass-morphism border-t border-white/10">
          <div className="flex flex-col p-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "uppercase tracking-widest text-lg font-display",
                  location.pathname === link.path ? "text-gold" : "text-white-warm"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 flex space-x-4 border-t border-white/10">
              {['pt', 'en', 'es'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={cn(
                    "text-sm uppercase font-bold",
                    i18n.language.startsWith(lang) ? "text-gold" : "text-white/40"
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
