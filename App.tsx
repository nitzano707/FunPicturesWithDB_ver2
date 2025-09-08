// App.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { authService } from './services/authService';
import type { PageType, Gallery } from './types';

// Import של הקומפוננטים
import HomePage from './components/HomePage';
import CaptainSelectPage from './components/CaptainSelectPage';
import GallerySetupPage from './components/GallerySetupPage';
import GalleryActivePage from './components/GalleryActivePage';
import SoloPlayerPage from './components/SoloPlayerPage';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  console.log('🚀 APP.TSX VERSION: 2025-01-09-LATEST - נטען!');
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [declined, setDeclined] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // פונקציות ניווט
  const navigateToPage = (page: PageType, gallery?: Gallery) => {
    console.log('🎯 navigateToPage called with:', { page, hasGallery: !!gallery, galleryName: gallery?.name });
    setCurrentPage(page);
    if (gallery) {
      setSelectedGallery(gallery);
    }
  };

  const goHome = () => {
    setCurrentPage('home');
    setSelectedGallery(null);
  };

  // פונקציית התנתקות
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authService.signOut();
      // חזרה לדף הבית לאחר התנתקות
      goHome();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // טיפול בהתחברות Google - כאשר משתמש מתחבר, העבר אותו לדף הקפטן
  useEffect(() => {
    if (user && currentPage === 'home') {
      setCurrentPage('captain-select');
    }
  }, [user]);

  // טיפול ב-Auth callback - נקה URL אחרי התחברות
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        console.log('🔄 Auth callback detected, cleaning URL...');
        // תן לSupabase לעבד את הSession
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log('✅ URL cleaned');
        }, 1000);
      }
    };
    
    handleAuthCallback();
  }, []);

  // בדיקה אם המשתמש כבר הסכים לתנאים
  useEffect(() => {
    const userAgreed = localStorage.getItem('user_agreed_to_terms');
    if (userAgreed === 'true') {
      setShowDisclaimer(false);
    }
  }, []);

  // אם משתמש מחובר - לא להציג דיסקליימר
  useEffect(() => {
    if (user && showDisclaimer) {
      setShowDisclaimer(false);
    }
  }, [user, showDisclaimer]);

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
              onClick={() => {
                localStorage.setItem('user_agreed_to_terms', 'true');
                setShowDisclaimer(false);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              אני מסכים
            </button>
            <button
              onClick={() => {
                localStorage.setItem('user_agreed_to_terms', 'false');
                setDeclined(true);
              }}
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
      {/* Header עם לחצן התנתקות */}
      <header className="text-center p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="w-32"></div> {/* spacer for balance */}
          
          <div className="flex-1 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              HumorizeMe - גרסה 2
            </h1>
            <p className="text-gray-400 mt-2">תנו ל-AI לספר לכם מי אתם "באמת"...</p>
          </div>

          {/* User info and sign out button */}
          <div className="w-32 text-left">
            {user && (
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-1 truncate" title={user.name || user.email}>
                  {user.name || user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningOut ? '...' : 'התנתק'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Back to home button when not on home */}
        {currentPage !== 'home' && (
          <button
            onClick={goHome}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
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
        
        {currentPage === 'gallery-active' && (
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
