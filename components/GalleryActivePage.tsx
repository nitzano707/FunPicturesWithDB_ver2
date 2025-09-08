// components/GalleryActivePage.tsx - גרסה מינימלית
import React from 'react';
import type { Gallery, User } from '../types';

interface GalleryActivePageProps {
  gallery?: Gallery;
  user: User | null;
  onGoHome: () => void;
}

const GalleryActivePage: React.FC<GalleryActivePageProps> = ({ gallery, user, onGoHome }) => {
  console.log('MINIMAL GALLERY PAGE LOADED');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white/10 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">גלריה - גרסה מינימלית</h2>
        
        <div className="space-y-4">
          <p>זה עמוד בדיקה מינימלי</p>
          
          <div className="bg-blue-500/20 p-4 rounded">
            <p>Gallery: {gallery ? gallery.name : 'אין גלריה'}</p>
            <p>User: {user ? user.email : 'לא מחובר'}</p>
          </div>
          
          {gallery && (
            <div className="bg-green-500/20 p-4 rounded">
              <h3 className="font-bold">פרטי גלריה:</h3>
              <p>שם: {gallery.name}</p>
              <p>קוד שיתוף: {gallery.share_code}</p>
              <p>קוד אדמין: {gallery.admin_code}</p>
            </div>
          )}
          
          <button
            onClick={onGoHome}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryActivePage;
