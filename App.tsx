// App.tsx
import React, { useCallback, useEffect, useState } from 'react';
import type { ClientContext, Gallery, Photo } from './types';
import * as supa from './services/supabaseService';
import { generateFunnyDescription } from './services/geminiService';
import Spinner from './components/Spinner';
import PhotoCard from './components/PhotoCard';
import { UploadIcon, SaveIcon, SearchIcon, GalleryIcon } from './components/icons';
import { v4 as uuidv4 } from 'uuid';

/* ---------- ownerIdentifier (נשמר ב-localStorage) ---------- */
function useOwnerIdentifier(): string {
  const [id] = useState(() => {
    const k = 'owner_identifier_v1';
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const fresh = uuidv4();
    localStorage.setItem(k, fresh);
    return fresh;
  });
  return id;
}

/* ---------- שמירת קונטקסט הגלריה ב-localStorage ---------- */
const LS_GALLERY = 'active_gallery_v1';
function saveGalleryCtx(gallery: Gallery, isAdmin: boolean) {
  localStorage.setItem(LS_GALLERY, JSON.stringify({ gallery, isAdmin }));
}
function loadGalleryCtx(): { gallery: Gallery | null; isAdmin: boolean } {
  try {
    const raw = localStorage.getItem(LS_GALLERY);
    if (!raw) return { gallery: null, isAdmin: false };
    const o = JSON.parse(raw);
    return { gallery: o.gallery ?? null, isAdmin: !!o.isAdmin };
  } catch {
    return { gallery: null, isAdmin: false };
  }
}
function clearGalleryCtx() {
  localStorage.removeItem(LS_GALLERY);
}

/* ========================================================== */

const App: React.FC = () => {
  // בסיס קונטקסט
  const ownerIdentifier = useOwnerIdentifier();
  const [ctx, setCtx] = useState<ClientContext>(() => ({
    ownerIdentifier,
    ...loadGalleryCtx(),
  }));

  // UI state
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [declined, setDeclined] = useState(false);

  // גלריה/תמונות/חיפוש
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [searchedPhoto, setSearchedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'welcome' | 'search' | 'gallery'>('welcome');

  // העלאה + AI
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [searchUsername, setSearchUsername] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------- הרשאות מחיקה ---------- */
  const canDeletePhoto = (photo: Photo): boolean => {
    // אדמין יכול למחוק הכל
    if (ctx.isAdmin) return true;
    
    // משתמש רגיל יכול למחוק רק תמונות שהוא העלה
    return photo.owner_identifier === ctx.ownerIdentifier;
  };

  /* ---------- טעינת גלריה פעילה (אם נשמרה) ---------- */
  useEffect(() => {
    if (ctx.gallery) {
      setViewMode('gallery');
      void handleShowAll();
    } else {
      setViewMode('welcome');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.gallery?.id]);

  /* ---------- יצירת גלריה ---------- */
  const [newGalleryName, setNewGalleryName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');

  async function handleCreateGallery() {
    if (!newGalleryName.trim()) return;
    try {
      setError(null);
      const g = await supa.createGallery(newGalleryName.trim(), ownerIdentifier);
      const isAdmin = true; // היוצר הוא אדמין
      setCtx({ ownerIdentifier, gallery: g, isAdmin });
      saveGalleryCtx(g, isAdmin);
      setNewGalleryName('');
      setViewMode('gallery');
    } catch (err: any) {
      setError(err.message || 'Failed to create gallery');
    }
  }

  async function handleJoinGallery() {
    if (!joinCode.trim()) return;
    try {
      setError(null);
      const g = await supa.joinGalleryByShareCode(joinCode.trim().toUpperCase());
      if (!g) {
        setError('לא נמצאה גלריה עם הקוד שסופק.');
        return;
      }
      let isAdmin = false;
      if (adminCodeInput.trim()) {
        isAdmin = await supa.isAdminForGallery(g.id, adminCodeInput.trim().toUpperCase());
      }
      setCtx({ ownerIdentifier, gallery: g, isAdmin });
      saveGalleryCtx(g, isAdmin);
      setJoinCode('');
      setAdminCodeInput('');
      setViewMode('gallery');
    } catch (err: any) {
      setError(err.message || 'Join gallery failed');
    }
  }

  function handleLeaveGallery() {
    clearGalleryCtx();
    setCtx({ ownerIdentifier, gallery: null, isAdmin: false });
    setGalleryPhotos([]);
    setSearchedPhoto(null);
    setViewMode('welcome');
  }

  /* ---------- העלאת קובץ + תיאור ---------- */
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setDescription('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    setIsGenerating(true);
    try {
      const desc = await generateFunnyDescription(file);
      setDescription(desc);
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת התיאור.');
    } finally {
      setIsGenerating(false);
    }
  };

  async function handleRegenerate() {
    if (!selectedFile) return;
    setIsGenerating(true);
    setError(null);
    try {
      const desc = await generateFunnyDescription(selectedFile);
      setDescription(desc);
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת התיאור.');
    } finally {
      setIsGenerating(false);
    }
  }

  /* ---------- שמירה ---------- */
  const handleSave = async () => {
    if (!ctx.gallery) {
      setError('אנא צרו/הצטרפו לגלריה לפני שמירה.');
      return;
    }
    if (!selectedFile || !username.trim() || !description) {
      setError('יש למלא שם, להעלות תמונה ולהמתין ליצירת תיאור לפני שמירה.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await supa.savePhoto(
        ctx.gallery.id,
        ctx.ownerIdentifier,
        username.trim(),
        selectedFile,
        description
      );
      // reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setUsername('');
      await handleShowAll();
    } catch (err: any) {
      setError(err.message || 'שגיאה בשמירת התמונה.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- חיפוש ---------- */
  const handleSearch = async () => {
    if (!ctx.gallery) return;
    if (!searchUsername.trim()) {
      setError('יש להזין שם משתמש לחיפוש.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGalleryPhotos([]);
    try {
      const photo = await supa.getPhotoByUsernameInGallery(ctx.gallery.id, searchUsername.trim());
      setSearchedPhoto(photo);
      setViewMode('search');
    } catch (err: any) {
      setError(err.message || 'שגיאה בחיפוש התמונה.');
      setSearchedPhoto(null);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- מחיקה ---------- */
  const handleDelete = async (photo: Photo) => {
    if (!window.confirm(`למחוק את התמונה של ${photo.username}?`)) return;
    setIsDeleting(photo.id);
    setError(null);
    try {
      await supa.deletePhoto(photo, ctx.ownerIdentifier, ctx.isAdmin);
      // עדכון אופטימי ב־UI
      setGalleryPhotos(prev => prev.filter(p => p.id !== photo.id));
      if (searchedPhoto?.id === photo.id) setSearchedPhoto(null);
    } catch (err: any) {
      setError(err.message || 'שגיאה במחיקת התמונה.');
      if (viewMode === 'gallery') await handleShowAll();
    } finally {
      setIsDeleting(null);
    }
  };

  /* ---------- טעינת כל הגלריה ---------- */
  const handleShowAll = useCallback(async () => {
    if (!ctx.gallery) return;
    setIsLoading(true);
    setError(null);
    setSearchedPhoto(null);
    try {
      const photos = await supa.getPhotosByGallery(ctx.gallery.id);
      setGalleryPhotos(photos);
      setViewMode('gallery');
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת הגלריה.');
      setGalleryPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, [ctx.gallery]);

  /* ---------- Disclaimer ---------- */
  if (declined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-center text-lg">אינך יכול להשתמש באפליקציה מבלי להסכים לתנאים 🙏</p>
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
              onClick={() => setShowDisclaimer(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              אני מסכים
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              אני לא מסכים
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ======================== UI ======================== */

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-purple-900/40 to-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            HumorizeMe - גרסה 2
          </h1>
          <p className="text-gray-400 mt-2">תנו ל-AI לספר לכם מי אתם "באמת"...</p>
        </header>

        {/* Gallery chooser / status bar */}
        <section className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
          {!ctx.gallery ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create */}
              <div className="p-4 bg-black/20 rounded-lg">
                <h3 className="font-semibold mb-2">יצירת גלריה</h3>
                <input
                  type="text"
                  placeholder="שם הגלריה"
                  value={newGalleryName}
                  onChange={e => setNewGalleryName(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                />
                <button
                  onClick={handleCreateGallery}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg"
                >
                  צור גלריה
                </button>
              </div>

              {/* Join */}
              <div className="p-4 bg-black/20 rounded-lg">
                <h3 className="font-semibold mb-2">הצטרפות לגלריה קיימת</h3>
                <input
                  type="text"
                  placeholder="קוד שיתוף (Share-Code)"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500 mb-2"
                />
                <input
                  type="text"
                  placeholder="קוד ניהול (אופציונלי)"
                  value={adminCodeInput}
                  onChange={e => setAdminCodeInput(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500 mb-2"
                />
                <button
                  onClick={handleJoinGallery}
                  className="w-full bg-teal-600 hover:bg-teal-700 py-2 rounded-lg"
                >
                  הצטרף
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <p className="text-lg">
                  גלריה פעילה: <span className="font-bold text-purple-300">{ctx.gallery.name}</span>
                  {ctx.isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-500/30 rounded text-amber-200 text-sm">
                      Admin
                    </span>
                  )}
                </p>
                <div className="text-sm text-gray-400 mt-1">
                  קוד שיתוף: <code className="text-gray-200">{ctx.gallery.share_code}</code> • קוד ניהול:{' '}
                  <code className="text-gray-200">{ctx.gallery.admin_code}</code>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleShowAll} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded">
                  טען/רענן גלריה
                </button>
                <button onClick={handleLeaveGallery} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded">
                  עזוב גלריה
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Errors */}
        {error && (
          <div
            className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center"
            role="alert"
          >
            <strong className="font-bold">שגיאה:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left – Create */}
          <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">1. יצירה חדשה</h2>

            {!ctx.gallery && (
              <p className="text-yellow-300 mb-4">🔔 תחילה צור או הצטרף לגלריה כדי לשמור אליה.</p>
            )}

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
                            לא מרוצים? נסו תיאור חדש שוב
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
                    disabled={!ctx.gallery || isLoading || isGenerating || !username || !description}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Spinner /> : <SaveIcon className="w-5 h-5" />}
                    <span>שמור תמונה ותיאור</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right – View/Search */}
          <div className="lg:col-span-3 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">2. חיפוש וצפייה</h2>

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
                  disabled={isLoading || !ctx.gallery}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleShowAll}
                disabled={isLoading || !ctx.gallery}
                className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <GalleryIcon className="w-5 h-5" />
                <span>הצג את כל הגלריה</span>
              </button>
            </div>

            <div className="h-[500px] overflow-y-auto p-2 rounded-lg bg-black/20">
              {isLoading && viewMode !== 'welcome' && (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              )}

              {!isLoading && viewMode === 'welcome' && (
                <div className="flex flex-col justify-center items-center h-full text-center text-gray-500">
                  <GalleryIcon className="w-16 h-16 mb-4" />
                  <p>הגלריה שלך תופיע כאן.</p>
                  <p>צור/הצטרף לגלריה, חפש משתמש או הצג את כל התמונות.</p>
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

        <footer className="mt-12 text-center text-gray-400 text-sm">
          נוצר ע"י ד"ר ניצן אליקים (2025) בעזרת סביבות Vibe Coding
        </footer>
      </div>
    </div>
  );
};

export default App;
