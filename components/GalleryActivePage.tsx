// components/GalleryActivePage.tsx - גרסה בסיסית שעובדת
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
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white/10 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-teal-300 mb-4">הצטרפות לגלריה</h2>
          <p className="text-gray-300 mb-8">הזן את קוד השיתוף</p>
          
          <input
            type="text"
            placeholder="קוד שיתוף"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4"
          />
          
          <button className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-xl">
            הצטרף לגלריה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8 bg-white/5 p-4 rounded-xl">
        <h2 className="text-2xl font-bold text-purple-300 mb-2">{gallery.name}</h2>
        <p className="text-sm text-gray-400">
          קוד שיתוף: {gallery.share_code}
        </p>
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={onGoHome} 
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            עזוב גלריה
          </button>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-white text-xl">ברוך הבא לגלריה "{gallery.name}"</p>
        <p className="text-gray-400 mt-2">הגלריה עובדת!</p>
      </div>
    </div>
  );
};

export default GalleryActivePage;
