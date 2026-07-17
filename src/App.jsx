import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import WatchPage from './pages/WatchPage';
import CatalogPage from './pages/CatalogPage';
import AuthorPage from './pages/AuthorPage';
import SupportPage from './pages/SupportPage';
import NotFound from './pages/NotFound';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/search"      element={<SearchPage />} />
          <Route path="/catalog"     element={<CatalogPage />} />
          <Route path="/watch/:id"   element={<WatchPage />} />
          <Route path="/author"      element={<AuthorPage />} />
          <Route path="/support"     element={<SupportPage />} />
          <Route path="*"            element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
