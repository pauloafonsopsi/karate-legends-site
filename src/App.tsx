import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Athletes from './pages/Athletes';
import Blog from './pages/Blog';
import PPV from './pages/PPV';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import TermosAtleta from './pages/TermosAtleta';
import PoliticaDados from './pages/PoliticaDados';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

const App = () => (
  <I18nextProvider i18n={i18n}>
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/eventos/:slug" element={<EventDetail />} />
            <Route path="/atletas" element={<Athletes />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/ppv" element={<PPV />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/reembolso" element={<Refund />} />
            <Route path="/termos-atleta" element={<TermosAtleta />} />
            <Route path="/politica-dados" element={<PoliticaDados />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  </I18nextProvider>
);

export default App;
