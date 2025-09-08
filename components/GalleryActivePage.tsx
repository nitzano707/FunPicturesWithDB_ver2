// components/GalleryActivePage.tsx - גרסת בדיקה
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import type { Gallery, Photo, User } from '../types';
import Spinner from './Spinner';

interface GalleryActivePageProps {
  gallery?: Gallery;
  user: User | null;
  onGoHome: () => void;
}

// Simple icons as SVG components
const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const GalleryActivePage: React.FC<GalleryActivePageProps> = ({ gallery, user, onGoHome }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('GalleryActivePage rendered with:', { gallery, user });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">מסך גלריה - גרסת בדיקה</h2>
        
        <div className="space-y-4 text-white">
          <p>Props שהתקבלו:</p>
          <ul className="list-disc list-inside">
            <li>Gallery: {gallery ? `${gallery.name} (${gallery.id})` : 'לא נמצא'}</li>
            <li>User: {user ? `${user.name || user.email}` : 'לא מחובר'}</li>
          </ul>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              שגיאה: {error}
            </div>
          )}
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={onGoHome}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              חזרה לדף הבית
            </button>
            
            <button
              onClick={() => setError('בדיקת שגיאה')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              בדוק שגיאה
            </button>
          </div>
          
          {gallery ? (
            <div className="mt-6 p-4 bg-green-500/20 rounded">
              <h3 className="font-bold">פרטי הגלריה:</h3>
              <p>שם: {gallery.name}</p>
              <p>קוד שיתוף: {gallery.share_code}</p>
              <p>קוד אדמין: {gallery.admin_code}</p>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-blue-500/20 rounded">
              <h3 className="font-bold">אין גלריה</h3>
              <p>זה המסך להצטרפות לגלריה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryActivePage;
