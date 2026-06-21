import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { initAnalytics } from './lib/analytics';
import ErrorBoundary from './ErrorBoundary';
import StarBackground from './StarBackground';
import ChatBot from './components/ChatBot';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArtPage from './pages/ArtPage';
import Projects from './Projects';
import HighlightDetail from './HighlightDetail';
import Resume from './Resume';
import FamilyStory from './FamilyStory';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    scrollToTop();
    const t = setTimeout(scrollToTop, 100);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}

function AnalyticsTracker() {
  useEffect(() => {
    const cleanup = initAnalytics();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}

function AppInner() {
  const location = useLocation();
  const isFamily = location.pathname === '/family';

  return (
    <>
      <ScrollToTop />
      <AnalyticsTracker />
      <StarBackground />
      <div className="bg-overlay" />
      <ChatBot />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/art" element={<ArtPage />} />
          <Route path="/highlights" element={<Projects />} />
          <Route path="/highlights/:id" element={<HighlightDetail />} />
          <Route path="/Highlights/:uuid" element={<HighlightDetail />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/family" element={<FamilyStory />} />
        </Routes>
      </ErrorBoundary>
      {!isFamily && <Footer />}
    </>
  );
}

function App() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
