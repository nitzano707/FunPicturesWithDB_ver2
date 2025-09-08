// components/GallerySetupPage.tsx - גרסה זמנית
import React from 'react';
import type { PageType, User } from '../types';

interface GallerySetupPageProps {
  user: User | null;
  onNavigate: (page: PageType) => void;
  onGoHome: () => void;
}

const GallerySetupPage: React.FC<GallerySetupPageProps> = ({ user, onNavigate, onGoHome }) => {
  console.log('GALLERY SETUP PAGE LOADED');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white/10 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">יצירת גלריה - גרסה זמנית</h2>
        
        <div className="space-y-4">
          <p>זה עמוד בדיקה זמני</p>
          
          <div className="bg-blue-500/20 p-4 rounded">
            <p>User: {user ? user.email : 'לא מחובר'}</p>
          </div>
          
          <button
            onClick={onGoHome}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mr-4"
          >
            חזרה לדף הבית
          </button>
          
          <button
            onClick={() => {
              console.log('TEST: Creating mock gallery...');
              const mockGallery = {
                id: 'test-123',
                name: 'גלריה לבדיקה',
                share_code: 'TEST12',
                admin_code: 'ADMIN123',
                creator_google_id: user?.id,
                creator_email: user?.email,
                creator_identifier: 'test-owner',
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              localStorage.setItem('pending_gallery', JSON.stringify(mockGallery));
              onNavigate('gallery-active');
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            בדיקה - צור גלריה מדומה
          </button>
        </div>
      </div>
    </div>
  );
};

export default GallerySetupPage;
