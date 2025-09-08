// components/GalleryActivePage.tsx - גרסה מינימלית
import React from 'react';
import type { Gallery, User } from '../types';

interface GalleryActivePageProps {
  gallery?: Gallery;
  user: User | null;
  onGoHome: () => void;
}

const GalleryActivePage: React.FC<GalleryActivePageProps> = ({ gallery, user, onGoHome }) => {
  
  // Debug info
  console.log('GalleryActivePage rendered with:', { gallery, user });
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Gallery Active Page - Debug</h1>
      
      <div className="bg-white/10 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <p>Gallery: {gallery ? gallery.name : 'None'}</p>
        <p>User: {user ? user.email : 'None'}</p>
      </div>
      
      <button 
        onClick={onGoHome}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        חזרה לדף הבית
      </button>
      
      {gallery ? (
        <div className="mt-4 bg-green-500/20 p-4 rounded-lg">
          <h3 className="text-green-300 font-bold">גלריה נטענה בהצלחה!</h3>
          <p>שם: {gallery.name}</p>
          <p>קוד שיתוף: {gallery.share_code}</p>
        </div>
      ) : (
        <div className="mt-4 bg-yellow-500/20 p-4 rounded-lg">
          <h3 className="text-yellow-300 font-bold">אין גלריה - מסך הצטרפות</h3>
          <p>כאן אמור להיות מסך הזנת קוד</p>
        </div>
      )}
    </div>
  );
};

export default GalleryActivePage;
