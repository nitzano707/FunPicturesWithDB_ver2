// components/GallerySetupPage.tsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import type { PageType, Gallery, User, GallerySettings } from '../types';
import { getDefaultGallerySettings } from '../utils/defaultSettings';
import Spinner from './Spinner';
import { v4 as uuidv4 } from 'uuid';

interface GallerySetupPageProps {
  user: User | null;
  onNavigate: (page: PageType, gallery?: Gallery) => void;
  onGoHome: () => void;
}

const GallerySetupPage: React.FC<GallerySetupPageProps> = ({ user, onNavigate, onGoHome }) => {
  const [galleryName, setGalleryName] = useState('');
  const [settings, setSettings] = useState<GallerySettings>(getDefaultGallerySettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Owner identifier for backup
  const [ownerIdentifier] = useState(() => {
    const k = 'owner_identifier_v1';
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const fresh = uuidv4();
    localStorage.setItem(k, fresh);
    return fresh;
  });

  const updateSettings = (key: keyof GallerySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateFocusWeight = (key: keyof GallerySettings['focusWeights'], value: number) => {
    setSettings(prev => ({
      ...prev,
      focusWeights: { ...prev.focusWeights, [key]: value }
    }));
  };

  const handleCreateGallery = async () => {
    if (!user) {
      setError('נדרשת התחברות ליצירת גלריה');
      return;
    }

    if (!galleryName.trim()) {
      setError('נדרש להזין שם גלריה');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // יצירת קודים ייחודיים
      const shareCode = generateCode(6);
      const adminCode = generateCode(8);

      // יצירת הגלריה
      const { data: gallery, error: insertError } = await supabase
        .from('galleries')
        .insert([{
          name: galleryName.trim(),
          share_code: shareCode,
          admin_code: adminCode,
          creator_google_id: user.id,
          creator_email: user.email,
          creator_identifier: ownerIdentifier,
          settings: settings
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // שמור את הגלריה ב-localStorage לפני המעבר (למקרה של רענון דף)
      localStorage.setItem('pending_gallery', JSON.stringify(gallery));

      // מעבר לגלריה החדשה
      setTimeout(() => {
        onNavigate('gallery-active', gallery);
      }, 100);

    } catch (err: any) {
      console.error('Create gallery error:', err);
      setError('שגיאה ביצירת הגלריה: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = (length: number): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  };

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-red-300">נדרשת התחברות ליצירת גלריה</p>
        <button onClick={onGoHome} className="mt-4 bg-gray-600 px-4 py-2 rounded">
          חזור לדף הבית
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-300 mb-2">יצירת גלריה חדשה</h2>
        <p className="text-gray-300">התאם הגדרות לקבוצה שלך</p>
        <p className="text-sm text-gray-400 mt-2">מחובר כ: {user.name || user.email}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* פרטי בסיס */}
        <section className="bg-white/10 p-6 rounded-xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-purple-500 pb-2">פרטי גלריה</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">שם הגלריה *</label>
              <input
                type="text"
                value={galleryName}
                onChange={(e) => setGalleryName(e.target.value)}
                placeholder="למשל: הכיתה של יעל"
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </section>

        {/* Basic Settings */}
        <section className="bg-white/10 p-6 rounded-xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-purple-500 pb-2">הגדרות בסיסיות</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">טווח גילאים</label>
              <select
                value={settings.ageRange}
                onChange={(e) => updateSettings('ageRange', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="8-12">8-12</option>
                <option value="13-17">13-17</option>
                <option value="18+">18+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">שפה</label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings('language', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="hebrew_regular">עברית רגילה</option>
                <option value="hebrew_slang">עברית סלנג</option>
                <option value="english_regular">אנגלית</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">אורך תיאור</label>
              <input
                type="number"
                min="60"
                max="200"
                value={settings.targetLength}
                onChange={(e) => updateSettings('targetLength', parseInt(e.target.value))}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Family Friendly</label>
              <select
                value={settings.familyFriendly}
                onChange={(e) => updateSettings('familyFriendly', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="high">גבוה</option>
                <option value="regular">רגיל</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">רמת הומור</label>
              <select
                value={settings.humorLevel}
                onChange={(e) => updateSettings('humorLevel', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="gentle">עדין</option>
                <option value="witty">שנון</option>
                <option value="mild_exaggeration">מוגזם קלות</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">אימוג'י</label>
              <select
                value={settings.emojiUsage}
                onChange={(e) => updateSettings('emojiUsage', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="none">ללא</option>
                <option value="minimal">מעט</option>
                <option value="moderate">בינוני</option>
              </select>
            </div>
          </div>
        </section>

        {/* Advanced Settings */}
        <section className="bg-white/10 p-6 rounded-xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-purple-500 pb-2">הגדרות מתקדמות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">טון</label>
              <select
                value={settings.tone}
                onChange={(e) => updateSettings('tone', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="encouraging">מעודד</option>
                <option value="standup">סטנד-אפ</option>
                <option value="satirical">סאטירי</option>
                <option value="poetic">פיוטי</option>
                <option value="documentary">דוקומנטרי</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ז'אנר</label>
              <select
                value={settings.genre}
                onChange={(e) => updateSettings('genre', e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="contemporary">עכשווי</option>
                <option value="fantasy">פנטזיה</option>
                <option value="scifi">מד"ב</option>
                <option value="noir">נואר</option>
                <option value="folklore">אגדה</option>
                <option value="trailer">טריילר</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">סיומת מותאמת</label>
            <input
              type="text"
              value={settings.customEnding}
              onChange={(e) => updateSettings('customEnding', e.target.value)}
              placeholder="לא לקחת ברצינות 😉"
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* משקלי פוקוס */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">משקלי פוקוס</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">הבעה</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.focusWeights.expression}
                  onChange={(e) => updateFocusWeight('expression', parseFloat(e.target.value))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">תנוחה</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.focusWeights.pose}
                  onChange={(e) => updateFocusWeight('pose', parseFloat(e.target.value))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">לבוש</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.focusWeights.clothing}
                  onChange={(e) => updateFocusWeight('clothing', parseFloat(e.target.value))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">רקע</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.focusWeights.background}
                  onChange={(e) => updateFocusWeight('background', parseFloat(e.target.value))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="bg-white/10 p-6 rounded-xl border border-white/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreateGallery}
              disabled={loading || !galleryName.trim()}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? <Spinner /> : '🚀'}
              {loading ? 'יוצר גלריה...' : 'צור גלריה'}
            </button>
            <button
              onClick={onGoHome}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
            >
              ביטול
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GallerySetupPage;
