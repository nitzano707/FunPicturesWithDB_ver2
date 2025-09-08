// components/CaptainSelectPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseService';
import type { PageType, Gallery, User } from '../types';
import Spinner from './Spinner';

interface CaptainSelectPageProps {
  user: User | null;
  onNavigate: (page: PageType, gallery?: Gallery) => void;
  onGoHome: () => void;
}

const CaptainSelectPage: React.FC<CaptainSelectPageProps> = ({ user, onNavigate, onGoHome }) => {
  const { signInWithGoogle } = useAuth();
  const [myGalleries, setMyGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // טעינת גלריות של המשתמש המחובר
  useEffect(() => {
    if (user) {
      loadMyGalleries();
    }
  }, [user]);

  const loadMyGalleries = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('creator_google_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGalleries(data || []);
    } catch (err: any) {
      setError('שגיאה בטעינת הגלריות: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGallery = (gallery: Gallery) => {
    onNavigate('gallery-active', gallery);
  };

  const handleCreateNew = () => {
    onNavigate('gallery-setup');
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError('שגיאה בהתחברות: ' + err.message);
      setLoading(false);
    }
  };

  // אם המשתמש לא מחובר
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 rounded-2xl p-8 border border-amber-500/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-amber-300 mb-4">התחברות קפטן</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              כקפטן, תוכל ליצור ולנהל גלריות עם הגדרות מותאמות. 
              <br />
              התחבר עם חשבון Google כדי לשמור ולנהל את הפעילויות שלך.
            </p>

            {loading ? (
              <Spinner />
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-white text-gray-800 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                התחבר עם Google
              </button>
            )}

            {error && (
              <div className="mt-6 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // אם המשתמש מחובר
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-amber-300 mb-2">שלום קפטן {user.name || user.email}</h2>
        <p className="text-gray-300">בחר גלריה קיימת או צור חדשה</p>
      </div>

      {loading && (
        <div className="text-center mb-8">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* יצירת גלריה חדשה */}
        <div className="bg-white/10 rounded-2xl p-6 border border-green-500/30 hover:border-green-500/60 transition-all duration-300 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-300 mb-3">צור גלריה חדשה</h3>
            <p className="text-gray-300 mb-6">
              התאם הגדרות AI, קבע סגנון ותוכן, וקבל קודי שיתוף
            </p>
            <button
              onClick={handleCreateNew}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300"
            >
              צור גלריה חדשה
            </button>
          </div>
        </div>

        {/* הגלריות הקיימות */}
        <div className="bg-white/10 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-300 mb-3">הגלריות שלי</h3>
          </div>

          {myGalleries.length === 0 ? (
            <p className="text-gray-400 text-center">עדיין לא יצרת גלריות</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {myGalleries.map((gallery) => (
                <div
                  key={gallery.id}
                  onClick={() => handleSelectGallery(gallery)}
                  className="bg-black/20 p-4 rounded-lg border border-white/10 hover:border-blue-400/50 cursor-pointer transition-all duration-200 hover:bg-black/30"
                >
                  <h4 className="font-semibold text-white mb-1">{gallery.name}</h4>
                  <div className="text-sm text-gray-400">
                    <p>קוד שיתוף: <code className="text-blue-300">{gallery.share_code}</code></p>
                    <p className="text-xs mt-1">
                      נוצר: {new Date(gallery.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaptainSelectPage;
