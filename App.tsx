import React, { useState, useCallback } from 'react';
import { Photo } from './types';
import * as supabaseService from './services/supabaseService';
import { generateFunnyDescription } from './services/geminiService';
import Spinner from './components/Spinner';
import PhotoCard from './components/PhotoCard';
import { UploadIcon, SparklesIcon, SaveIcon, SearchIcon, GalleryIcon } from './components/icons';

const App: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [description, setDescription] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [searchUsername, setSearchUsername] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
    const [searchedPhoto, setSearchedPhoto] = useState<Photo | null>(null);
    const [viewMode, setViewMode] = useState<'welcome' | 'search' | 'gallery'>('welcome');

    const [showDisclaimer, setShowDisclaimer] = useState(true);
    const [declined, setDeclined] = useState(false);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            setDescription('');
            setSelectedFile(file);
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);

            setIsGenerating(true);
            try {
                const desc = await generateFunnyDescription(file);
                setDescription(desc);
            } catch (err: any) {
                setError(err.message || 'שגיאה ביצירת התיאור.');
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleRegenerate = async () => {
        if (!selectedFile) return;
        setIsGenerating(true);
        try {
            const desc = await generateFunnyDescription(selectedFile);
            setDescription(desc);
        } catch (err: any) {
            setError(err.message || 'שגיאה ביצירת התיאור מחדש.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedFile || !username.trim() || !description) {
            setError('יש למלא שם כלשהו, להעלות תמונה ולהמתין ליצירת תיאור לפני השמירה.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await supabaseService.savePhoto(username.trim(), selectedFile, description);
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

    const handleSearch = async () => {
        if (!searchUsername.trim()) {
            setError('יש להזין שם משתמש לחיפוש.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGalleryPhotos([]);
        try {
            const photo = await supabaseService.getPhotoByUsername(searchUsername.trim());
            setSearchedPhoto(photo);
            setViewMode('search');
        } catch (err: any) {
            setError(err.message || 'שגיאה בחיפוש התמונה.');
            setSearchedPhoto(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (photo: Photo) => {
        if (window.confirm(`האם אתה בטוח שברצונך למחוק את התמונה של ${photo.username}?`)) {
            setIsDeleting(photo.id);
            setError(null);
            try {
                await supabaseService.deletePhoto(photo);
                setGalleryPhotos(prev => prev.filter(p => p.id !== photo.id));
                if (searchedPhoto?.id === photo.id) {
                    setSearchedPhoto(null);
                }
            } catch (err: any) {
                setError(err.message || 'שגיאה במחיקת התמונה.');
                if (viewMode === 'gallery') {
                    await handleShowAll();
                }
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleShowAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSearchedPhoto(null);
        try {
            const photos = await supabaseService.getAllPhotos();
            setGalleryPhotos(photos);
            setViewMode('gallery');
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת הגלריה.');
            setGalleryPhotos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (declined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <p className="text-center text-lg">אינך יכול להשתמש באפליקציה מבלי להסכים לתנאים 🙏</p>
            </div>
        );
    }

    if (showDisclaimer) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-xl max-w-md text-center shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">ברוכים הבאים</h2>
                    <p className="text-gray-300 mb-6">
                        האפליקציה נועדה לצורכי לימוד בלבד. <br />
                        אין להעלות תמונות פוגעניות או תמונות שאינן שלך.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setShowDisclaimer(false)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            אני מסכים
                        </button>
                        <button
                            onClick={() => setDeclined(true)}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            אני לא מסכים
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-purple-900/40 to-gray-900">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        HumorizeMe - גרסה 2
                    </h1>
                    <p className="text-gray-400 mt-2">תנו ל AI לספר לכם מי אתם `באמת`...</p>
                </header>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
                        <strong className="font-bold">שגיאה:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                        <h2 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">1. יצירה חדשה</h2>
                        <div className="space-y-4">
                            <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-white/5 transition-colors duration-300">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                                    <span className="text-purple-400 font-semibold">{selectedFile ? 'החלף תמונה' : 'בחר תמונה'}</span>
                                    <p className="text-xs text-gray-500 mt-1">{selectedFile ? selectedFile.name : 'PNG, JPG, WEBP'}</p>
                                </label>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </div>

                            {previewUrl && (
                                <div className="space-y-4">
                                    <img src={previewUrl} alt="תצוגה מקדימה" className="rounded-lg w-full h-auto max-h-64 object-contain" />
                                    <div className="bg-white/10 p-4 rounded-lg min-h-[100px] flex flex-col items-center justify-center space-y-3">
                                        {isGenerating ? (
                                            <Spinner />
                                        ) : (
                                            <>
                                                <p className="text-gray-300 italic text-center">{description || "התיאור שנוצר על ידי AI יופיע כאן..."}</p>
                                                {description && (
                                                    <button
                                                        onClick={handleRegenerate}
                                                        disabled={isGenerating}
                                                        className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                                                    >
                                                        לא מרוצים מהתוצאה? נסו שוב
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedFile && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">שמך</label>
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
                                        <span>שמור תמונה ותיאור בגלריה המשותפת</span>
                                    </button>
                                    <center>ניתן להסיר את התמונה והתיאור מהגלריה בכל שלב</center>
                                    
                                </div>
                            )}
                        </div>
                    </div>

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
                                <button onClick={handleSearch} disabled={isLoading} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                                    <SearchIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <button onClick={handleShowAll} disabled={isLoading} className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
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
                                    <p>חפש משתמש או הצג את כל התמונות.</p>
                                </div>
                            )}
                            {!isLoading && viewMode === 'search' && (
                                searchedPhoto ? (
                                    <PhotoCard photo={searchedPhoto} onDelete={handleDelete} isDeleting={isDeleting === searchedPhoto.id} />
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
            <footer className="mt-12 text-center text-gray-400 text-sm">
                נוצר ע"י ד"ר ניצן אליקים (2025) בעזרת סביבות Vibe Coding
            </footer>
        </div>
    );
};

export default App;
