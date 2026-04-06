import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Blog = () => {
  const { t } = useTranslation();

  const posts = [
    {
      slug: "regras-do-evento",
      title: "Regras do Evento: O que você precisa saber",
      excerpt: "Entenda as modificações nas regras tradicionais que tornam o Legends único.",
      date: "MAR 20, 2026",
      category: "Regras",
      img: "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?q=80&w=2070&auto=format&fit=crop"
    },
    {
      slug: "filosofia-karate-legends",
      title: "A Filosofia por trás do Legends",
      excerpt: "Por que criamos este palco para os karatecas do mundo.",
      date: "MAR 15, 2026",
      category: "Filosofia",
      img: "https://images.unsplash.com/photo-1526671315163-1aa5e1267e8e?q=80&w=2070&auto=format&fit=crop"
    },
    {
      slug: "atleta-modelo",
      title: "O Atleta Modelo para o Legends",
      excerpt: "O que nossa equipe técnica busca em um competidor de elite.",
      date: "MAR 10, 2026",
      category: "Atletas",
      img: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop"
    }
  ];

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">BLOG</h1>
          <div className="h-1 w-24 gold-gradient"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((post, i) => (
            <article key={i} className="group">
              <Link to={`/blog/${post.slug}`}>
                <div className="aspect-[16/9] mb-6 overflow-hidden border border-white/10">
                  <img 
                    src={post.img} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                    alt={post.title}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">{post.category}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{post.date}</span>
                </div>
                <h3 className="text-2xl mb-4 group-hover:text-gold transition-colors leading-tight">{post.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{post.excerpt}</p>
                <span className="text-xs uppercase font-bold tracking-widest border-b border-gold/30 pb-1 group-hover:border-gold transition-colors">Read Article</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
