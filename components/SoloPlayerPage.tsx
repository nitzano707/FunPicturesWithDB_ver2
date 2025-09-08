// components/SoloPlayerPage.tsx
import React, { useState } from 'react';
import { generateFunnyDescription } from '../services/geminiService';
import Spinner from './Spinner';
import { UploadIcon } from './icons';

interface SoloPlayerPageProps {
  onGoHome: () => void;
}

const SoloPlayerPage: React.FC<SoloPlayerPageProps> = ({ onGoHome }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setDescription('');
    setShowResult(false);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    setIsGenerating(true);
    try {
      // שימוש בהגדרות ברירת מחדל לשחקן אישי
      const desc = await generateFunnyDescription(file);
      setDescription(desc);
      setShowResult(true);
      new Audio('/lol/mixkit-cartoon-voice-laugh-343.wav').play();

    } catch (err: any) {
      setError('שגיאה ביצירת התיאור: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError(null);
    try {
      const desc = await generateFunnyDescription(selectedFile);
      setDescription(desc);
      new Audio('/lol/mixkit-cartoon-voice-laugh-343.wav').play();

    } catch (err: any) {
      setError('שגיאה ביצירת התיאור: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!selectedFile || !description || !username.trim()) return;

    // יצירת תוכן הקובץ
    const content = `שם: ${username}\n\nתיאור AI:\n${description}\n\nנוצר על ידי HumorizeMe - ${new Date().toLocaleDateString('he-IL')}`;
    
    // יצירת Blob והורדה
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${username.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_')}_תיאור_AI.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setUsername('');
    setShowResult(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-purple-300 mb-2">שחקן אישי</h2>
        <p className="text-gray-300">
          קבל תיאור מצחיק על התמונה שלך ללא שמירה - פרטיות מלאה
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
        {!showResult ? (
          // Upload interface
          <div className="space-y-6">
            <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-white/5 transition-colors duration-300">
              <label htmlFor="solo-file-upload" className="cursor-pointer">
                <UploadIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <span className="text-purple-400 font-semibold text-xl block mb-2">
                  {selectedFile ? 'החלף תמונה' : 'בחר תמונה'}
                </span>
                <p className="text-gray-500">
                  {selectedFile ? selectedFile.name : 'PNG, JPG, WEBP - העלה תמונה לתיאור מצחיק'}
                </p>
              </label>
              <input
                id="solo-file-upload"
                name="solo-file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {previewUrl && (
              <div className="text-center">
                <img
                  src={previewUrl}
                  alt="תצוגה מקדימה"
                  className="rounded-lg max-h-64 mx-auto object-contain"
                />
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-8">
                <Spinner />
                <p className="text-gray-300 mt-4">הבינה המלאכותית מנתחת את התמונה...</p>
              </div>
            )}
          </div>
        ) : (
          // Result interface
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <img
                  src={previewUrl!}
                  alt="התמונה שלך"
                  className="rounded-lg max-h-64 mx-auto object-contain"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    שם (לקובץ ההורדה)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="הכנס את שמך..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">התיאור שלך:</h4>
                  <p className="text-gray-300 italic whitespace-pre-line leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {isGenerating ? 'מחשב...' : 'נסה תיאור אחר'}
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    disabled={!username.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    הורד תמונה + תיאור
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    תמונה חדשה
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={onGoHome}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>

      {/* הסבר על פרטיות */}
      <div className="mt-8 bg-white/5 p-4 rounded-xl border border-white/10 text-center">
        <h4 className="text-lg font-semibold text-green-300 mb-2">פרטיות מלאה</h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          במצב שחקן אישי, התמונות והתיאורים לא נשמרים בשרת. 
          <br />
          כל הפעולות מתבצעות באופן זמני ומקומי בדפדפן שלך.
          <br />
          רק אתה יכול לראות ולהוריד את התוצאות.
        </p>
      </div>
    </div>
  );
};

export default SoloPlayerPage;
