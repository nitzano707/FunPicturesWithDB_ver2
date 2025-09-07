import React from 'react';
import { Photo } from '../types';
import { TrashIcon } from './icons';

interface PhotoCardProps {
  photo: Photo;
  onDelete?: (photo: Photo) => void;
  isDeleting?: boolean;
  canDelete?: boolean; // ניהול הרשאות מחיקה
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onDelete, isDeleting, canDelete }) => {
  return (
    <div className="bg-white/10 rounded-xl overflow-hidden shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl duration-300 backdrop-blur-sm border border-white/20">
      {/* קונטיינר קבוע לגובה אחיד */}
      <div className="w-full h-64 flex items-center justify-center bg-black">
        <img
          className="object-contain max-h-full max-w-full"
          src={photo.image_url}
          alt={`By ${photo.username}`}
        />
      </div>
      
      {/* תוכן הטקסט והכפתורים */}
      <div className="p-4 relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-xl mb-1 text-white">{photo.username}</p>
            <p className="text-gray-300 text-base">{photo.description}</p>
          </div>
          {canDelete && onDelete && ( // מוצג רק אם יש הרשאה
            <button
              onClick={() => onDelete(photo)}
              disabled={isDeleting}
              className="p-2 rounded-full bg-red-500/50 hover:bg-red-500 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="מחק תמונה"
            >
              {isDeleting ? '...' : <TrashIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;
