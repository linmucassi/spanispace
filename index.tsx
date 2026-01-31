
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import JobBoard from './components/JobBoard';
import TrainingSection from './components/TrainingSection';
import AcademicPortal from './components/AcademicPortal';
import SuccessStories from './components/SuccessStories';

// Layout Component (simulating app/layout.tsx)
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      {/* Mobile Persistent CTA */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
        <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-2xl shadow-indigo-200 border-2 border-indigo-400">
          Enroll For Training Now
        </button>
      </div>
    </div>
  );
};

// Main App Component (orchestrating routes)
const App = () => {
  const [route, setRoute] = useState('home');

  // Simple client-side router simulation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setRoute(hash);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderContent = () => {
    switch (route) {
      case 'jobs':
        return <div className="pt-20"><JobBoard /></div>;
      case 'training':
        return <div className="pt-20"><TrainingSection /></div>;
      case 'academic':
        return <div className="pt-20"><AcademicPortal /></div>;
      case 'success-stories':
        return <div className="pt-20"><SuccessStories /></div>;
      default:
        return (
          <>
            <Hero />
            <div id="jobs"><JobBoard /></div>
            <TrainingSection />
            <AcademicPortal />
            <SuccessStories />
          </>
        );
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
