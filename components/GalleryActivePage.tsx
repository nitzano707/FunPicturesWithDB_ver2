// components/GalleryActivePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseService';
import { generateFunnyDescription } from '../services/geminiService';
import type { Gallery, Photo, User } from '../types';
import PhotoCard from './PhotoCard';
import Spinner from './Spinner';
import { UploadIcon, SaveIcon, SearchIcon, GalleryIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface GalleryActivePageProps {
  gallery?: Gallery;
  user: User | null;
  onGoHome: () => void;
}

const GalleryActivePage: React.FC<GalleryActivePageProps> = (props) => {
  // Destructure props safely
  const { gallery: propsGallery, user, onGoHome } = props;
  
  console.log('GalleryActivePage render with props:', { propsGallery, user });

  // State for gallery/context
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(propsGallery || null);
  const [joinCode, setJoinCode] = useState('');
  
  // Owner identifier - simplified
  const [ownerIdentifier] = useState(() => {
    try {
      const key = 'owner_identifier_v1';
      let existing = localStorage.getItem(key);
      if (!existing) {
        existing = uuidv4();
        localStorage.setItem(key, existing);
      }
      return existing;
    } catch (e) {
      console.error('LocalStorage error:', e);
      return uuidv4(); // fallback
    }
  });

  // Gallery state
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [searchedPhoto, setSearchedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'welcome' | 'search' | 'gallery'>('welcome');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [searchUsername, setSearchUsername] = useState<string>('');

  // Loading states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update gallery when props change
  useEffect(() => {
    console.log('Props gallery changed:', propsGallery);
    if (propsGallery) {
      setCurrentGallery(propsGallery);
      setViewMode('gallery');
    } else {
      setCurrentGallery(null);
      setViewMode('welcome');
    }
  }, [propsGallery]);

  // Check if user is admin
  const isAdmin = user && currentGallery && (
    currentGallery.creator_google_id === user.id || 
    currentGallery.creator_identifier === ownerIdentifier
  );

  // Permission check for deleting photos
  const canDeletePhoto = (photo: Photo): boolean => {
    if (isAdmin) return true;
    return photo.owner_identifier === ownerIdentifier;
  };

  // Load gallery photos when gallery changes
  useEffect(() => {
    if (currentGallery) {
      console.log('Loading photos for gallery:', currentGallery.id);
      loadGalleryPhotos();
    }
  }, [currentGallery]);

  // Join gallery by share code
  const handleJoinGallery = async () => {
    if (!joinCode.trim()) {
      setError('יש להזין קוד שיתוף.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('share_code', joinCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        setError('לא נמצאה גלריה עם הקוד שסופק.');
        return;
      }

      console.log('Joined gallery:', data);
      setCurrentGallery(data);
      setJoinCode('');
    } catch (err: any) {
      console.error('Join gallery error:', err);
      setError('שגיאה בהצטרפות לגלריה: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load gallery photos
  const loadGalleryPhotos = useCallback(async () => {
    if (!currentGallery) {
      console.log('No gallery to load photos for');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchedPhoto(null);

    try {
      console.log('Loading photos for gallery ID:', currentGallery.id);
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', currentGallery.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading photos:', error);
        throw error;
      }
      
      console.log('Loaded photos:', data);
      setGalleryPhotos(data || []);
      setViewMode('gallery');
    } catch (err: any) {
      console.error('Load gallery photos error:', err);
      setError('שגיאה בטעינת הגלריה: ' + err.message);
      setGalleryPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentGallery]);

  // Handle image upload
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setDescription('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    setIsGenerating(true);
    try {
      const desc = await generateFunnyDescription(file, currentGallery?.settings);
      setDescription(desc);
    } catch (err: any) {
      console.error('Generate description error:', err);
      setError('שגיאה ביצירת התיאור: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate description
  const handleRegenerate = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError(null);
    try {
      const desc = await generateFunnyDescription(selectedFile, currentGallery?.settings);
      setDescription(desc);
    } catch (err: any) {
      console.error('Regenerate description error:', err);
      setError('שגיאה ביצירת התיאור: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save photo to gallery
  const handleSave = async () => {
    if (!currentGallery) {
      setError('שגיאה: אין גלריה פעילה.');
      return;
    }
    if (!selectedFile || !username.trim() || !description) {
      setError('יש למלא שם, להעלות תמונה ולהמתין ליצירת תיאור לפני שמירה.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ext = selectedFile.name.split('.').pop() || 'png';
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `${currentGallery.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const { data, error: insertError } = await supabase
        .from('photos')
        .insert([{
          gallery_id: currentGallery.id,
          owner_identifier: ownerIdentifier,
          username: username.trim(),
          image_url: publicUrlData.publicUrl,
          description: description
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Photo saved successfully:', data);

      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setUsername('');

      await loadGalleryPhotos();

    } catch (err: any) {
      console.error('Save photo error:', err);
      setError('שגיאה בשמירת התמונה: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for photo by username
  const handleSearch = async () => {
    if (!currentGallery) return;
    if (!searchUsername.trim()) {
      setError('יש להזין שם משתמש לחיפוש.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGalleryPhotos([]);

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', currentGallery.id)
        .eq('username', searchUsername.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSearchedPhoto(data || null);
      setViewMode('search');
    } catch (err: any) {
      console.error('Search error:', err);
      setError('שגיאה בחיפוש התמונה: ' + err.message);
      setSearchedPhoto(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete photo
  const handleDelete = async (photo: Photo) => {
    if (!window.confirm(`למחוק את התמונה של ${photo.username}?`)) return;

    setIsDeleting(photo.id);
    setError(null);

    try {
      if (isAdmin) {
        const adminCode = currentGallery?.admin_code;
        if (!adminCode) {
          throw new Error('Could not verify admin permissions');
        }

        const { error: rpcError } = await supabase
          .rpc('delete_photo_with_admin_check', {
            photo_id: photo.id,
            owner_identifier: ownerIdentifier,
            is_admin: true,
            admin_code: adminCode
          });

        if (rpcError) {
          throw new Error(`Admin delete failed: ${rpcError.message}`);
        }
      } else {
        const { error: rpcError } = await supabase
          .rpc('delete_photo_with_admin_check', {
            photo_id: photo.id,
            owner_identifier: ownerIdentifier,
            is_admin: false,
            admin_code: null
          });

        if (rpcError) {
          throw new Error(`Delete failed: ${rpcError.message}`);
        }
      }

      const url = new URL(photo.image_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const storagePath = `${photo.gallery_id}/${fileName}`;

      await supabase.storage.from('photos').remove([storagePath]);

      setGalleryPhotos(prev => prev.filter(p => p.id !== photo.id));
      if (searchedPhoto?.id === photo.id) setSearchedPhoto(null);

    } catch (err: any) {
      console.error('Delete photo error:', err);
      setError('שגיאה במחיקת התמונה: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  console.log('Current render state:', { currentGallery, viewMode, galleryPhotos: galleryPhotos.length });

  // If no gallery, show join interface
  if (!currentGallery) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 rounded-2xl p-8 border border-teal-500/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-teal-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-teal-300 mb-4">הצטרפות לגלריה</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              הזן את קוד השיתוף שקיבלת מהקפטן כדי להצטרף לגלריה הקבוצתית
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="קוד שיתוף (Share-Code)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-teal-500 focus:border-teal-500 text-center text-lg font-mono"
              />

              {isLoading ? (
                <Spinner />
              ) : (
                <button
                  onClick={handleJoinGallery}
                  disabled={!joinCode.trim()}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הצטרף לגלריה
                </button>
              )}
            </div>

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

  // Main gallery interface
  return (
    <div className="max-w-7xl mx-auto">
      {/* Gallery info header */}
      <div className="mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-purple-300 mb-2">{currentGallery.name}</h2>
            {isAdmin && (
              <span className="px-2 py-0.5 bg-amber-500/30 rounded text-amber-200 text-sm mr-2">
                אדמין
              </span>
            )}
            <div className="text-sm text-gray-400 mt-1">
              קוד שיתוף: <code className="text-gray-200">{currentGallery.share_code}</code>
              {isAdmin && (
                <>
                  {' • קוד ניהול: '}
                  <code className="text-gray-200">{currentGallery.admin_code}</code>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={loadGalleryPhotos} 
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded"
            >
              רענן גלריה
            </button>
            <button 
              onClick={onGoHome} 
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
            >
              עזוב גלריה
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center">
          <strong className="font-bold">שגיאה:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left - Upload */}
        <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <h3 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">העלאת תמונה</h3>

          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-white/5 transition-colors duration-300">
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                <span className="text-purple-400 font-semibold">
                  {selectedFile ? 'החלף תמונה' : 'בחר תמונה'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFile ? selectedFile.name : 'PNG, JPG, WEBP'}
                </p>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {previewUrl && (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="תצוגה מקדימה"
                  className="rounded-lg w-full h-auto max-h-64 object-contain"
                />
                <div className="bg-white/10 p-4 rounded-lg min-h-[100px]">
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-3 text-gray-300">
                      <Spinner />
                      הבינה המלאכותית חושבת...
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 italic whitespace-pre-line">
                        {description || 'התיאור שנוצר על ידי AI יופיע כאן...'}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={handleRegenerate}
                          disabled={!selectedFile || isGenerating}
                          className="px-3 py-2 rounded bg-purple-700 hover:bg-purple-800 disabled:opacity-50"
                        >
                          נסה תיאור חדש
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                    שם משתמש
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="הכנס את שמך כאן..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={isLoading || isGenerating || !username || !description}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Spinner /> : <SaveIcon className="w-5 h-5" />}
                  <span>שמור לגלריה</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right - Gallery */}
        <div className="lg:col-span-3 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <h3 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">חיפוש וצפייה</h3>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-grow flex gap-2">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="חפש לפי שם משתמש..."
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                <SearchIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={loadGalleryPhotos}
              disabled={isLoading}
              className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <GalleryIcon className="w-5 h-5" />
              <span>הצג הכל</span>
            </button>
          </div>

          <div className="h-[500px] overflow-y-auto p-2 rounded-lg bg-black/20">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            )}

            {!isLoading && viewMode === 'search' && (
              searchedPhoto ? (
                <PhotoCard
                  photo={searchedPhoto}
                  onDelete={handleDelete}
                  isDeleting={isDeleting === searchedPhoto.id}
                  canDelete={canDeletePhoto(searchedPhoto)}
                />
              ) : (
                <p className="text-center text-gray-400 mt-8">לא נמצאה תמונה עבור המשתמש שהוזן.</p>
              )
            )}

            {!isLoading && viewMode === 'gallery' && (
              galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {galleryPhotos.map(photo => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={handleDelete}
                      isDeleting={isDeleting === photo.id}
                      canDelete={canDeletePhoto(photo)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 mt-8">הגלריה ריקה. הוסף את התמונה הראשונה!</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryActivePage;
