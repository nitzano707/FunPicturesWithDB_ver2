// components/GalleryActivePage.tsx - גרסה נקייה
import React, { useState } from 'react';
import type { Gallery, User } from '../types';

interface GalleryActivePageProps {
  gallery?: Gallery;
  user: User | null;
  onGoHome: () => void;
}

const GalleryActivePage: React.FC<GalleryActivePageProps> = ({ gallery, user, onGoHome }) => {
  const [joinCode, setJoinCode] = useState('');

  if (!gallery) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 rounded-2xl p-8 border border-teal-500/30 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-teal-300 mb-4">הצטרפות לגלריה</h2>
            <p className="text-gray-300 mb-8">
              הזן את קוד השיתוף שקיבלת מהקפטן
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="קוד שיתוף"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-teal-500 focus:border-teal-500 text-center text-lg font-mono"
              />
              <button
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-3 px-6 rounded-xl"
              >
                הצטרף לגלריה
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // אם יש גלריה - הצג את הגלריה
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 bg-white/5 p-4 rounded-xl">
        <h2 className="text-2xl font-bold text-purple-300 mb-2">{gallery.name}</h2>
        <p className="text-sm text-gray-400">
          קוד שיתוף: <code className="text-gray-200">{gallery.share_code}</code>
        </p>
        <button 
          onClick={onGoHome} 
          className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          עזוב גלריה
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-white text-xl">גלריה "{gallery.name}" - עובד!</p>
        <p className="text-gray-400 mt-2">כאן יהיה התוכן של הגלריה</p>
      </div>
    </div>
  );
};

export default GalleryActivePage;
