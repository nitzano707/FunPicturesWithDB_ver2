// App.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import type { PageType, Gallery } from './types';

// Import של הקומפוננטים
import HomePage from './components/HomePage';
import CaptainSelectPage from './components/CaptainSelectPage';
import Spinner from './components/Spinner';

// קומפוננטים זמניים עד שניצור אותם
const GallerySetupPage = () => <div>Gallery Setup - בבנייה</div>;
const GalleryActivePage = () => <div>Gallery Active - בבנייה</div>;
const SoloPlayerPage = () => <div>Solo Player - בבנייה</div>;

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [declined, setDeclined] = useState(false);

  // פונקציות ניווט
  const navigateToPage = (page: PageType, gallery?: Gallery) => {
    setCurrentPage(page);
    if (gallery) {
      setSelectedGallery(gallery);
    }
  };

  const goHome = () => {
    setCurrentPage('home');
    setSelectedGallery(null);
  };

  // Disclaimer handling
  if (declined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-center text-lg">אינך יכול להשתמש באפליקציה מבלי להסכים לתנאים</p>
      </div>
    );
  }

  if (showDisclaimer) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-xl max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">ברוכים הבאים</h2>
          <p className="text-gray-300 mb-6">
            האפליקציה נועדה לצורכי לימוד והנאה בלבד. <br />
            אין להעלות תמונות פוגעניות או תמונות שאינן שלך.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowDisclaimer(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              אני מסכים
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              אני לא מסכים
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state during auth check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  // Main app container
  return (
    <div className="min-h-screen bg-gray-900 text-white bg-gradient-to-br from-gray-900 via-purple-900/40 to-gray-900">
      {/* Header */}
      <header className="text-center p-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          HumorizeMe - גרסה 2
        </h1>
        <p className="text-gray-400 mt-2">תנו ל-AI לספר לכם מי אתם "באמת"...</p>
        
        {/* Back to home button when not on home */}
        {currentPage !== 'home' && (
          <button
            onClick={goHome}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            חזרה לדף הבית
          </button>
        )}
      </header>

      {/* Main content - render different pages based on currentPage */}
      <main className="max-w-7xl mx-auto p-4">
        {currentPage === 'home' && (
          <HomePage onNavigate={navigateToPage} />
        )}
        
        {currentPage === 'captain-select' && (
          <CaptainSelectPage 
            user={user} 
            onNavigate={navigateToPage}
            onGoHome={goHome}
          />
        )}
        
        {currentPage === 'gallery-setup' && (
          <GallerySetupPage 
            user={user}
            onNavigate={navigateToPage}
            onGoHome={goHome}
          />
        )}
        
        {currentPage === 'gallery-active' && selectedGallery && (
          <GalleryActivePage 
            gallery={selectedGallery}
            user={user}
            onGoHome={goHome}
          />
        )}
        
        {currentPage === 'solo-player' && (
          <SoloPlayerPage onGoHome={goHome} />
        )}
      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm p-4">
        נוצר ע"י ד"ר ניצן אליקים (2025) בעזרת סביבות Vibe Coding
      </footer>
    </div>
  );
};

export default App;
