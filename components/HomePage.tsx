// components/HomePage.tsx
import React from 'react';
import type { PageType } from '../types';

interface HomePageProps {
  onNavigate: (page: PageType) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">בחר את התפקיד שלך</h2>
        <p className="text-gray-300 text-lg">איך תרצה להשתמש באפליקציה?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* קפטן - יוצר פעילות */}
        <div className="bg-white/10 rounded-2xl p-8 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">קפטן</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              יוצר פעילות חדשה או מנהל פעילות קיימת. 
              <br />
              מגדיר את החוקים והסגנון של הגלריה.
            </p>
            <ul className="text-sm text-gray-400 mb-8 space-y-2">
              <li>• יצירה וניהול גלריות</li>
              <li>• התאמת AI לקבוצה</li>
              <li>• מחיקת תמונות</li>
              <li>• התחברות עם Google</li>
            </ul>
            <button
              onClick={() => onNavigate('captain-select')}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              אני קפטן!
            </button>
          </div>
        </div>

        {/* שחקן קבוצתי */}
        <div className="bg-white/10 rounded-2xl p-8 border border-teal-500/30 hover:border-teal-500/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-teal-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-teal-300 mb-4">שחקן קבוצתי</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              מצטרף לפעילות קיימת עם קוד שיתוף.
              <br />
              חלק מקבוצה או מחלקה.
            </p>
            <ul className="text-sm text-gray-400 mb-8 space-y-2">
              <li>• הצטרפות עם קוד</li>
              <li>• העלאת תמונות לגלריה</li>
              <li>• צפייה בגלריה המשותפת</li>
              <li>• ללא צורך בהרשמה</li>
            </ul>
            <button
              onClick={() => onNavigate('gallery-active')}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              הצטרף לקבוצה
            </button>
          </div>
        </div>

        {/* שחקן אישי */}
        <div className="bg-white/10 rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-purple-300 mb-4">שחקן אישי</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              משחק לבד ללא גלריה.
              <br />
              קבל תיאור מצחיק על התמונה שלך.
            </p>
            <ul className="text-sm text-gray-400 mb-8 space-y-2">
              <li>• שימוש מיידי וחופשי</li>
              <li>• תיאורי AI מותאמים</li>
              <li>• הורדת התוצאות</li>
              <li>• פרטיות מלאה</li>
            </ul>
            <button
              onClick={() => onNavigate('solo-player')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              שחק לבד
            </button>
          </div>
        </div>
      </div>

      {/* הסבר כללי */}
      <div className="mt-16 text-center">
        <div className="bg-white/5 rounded-xl p-6 max-w-3xl mx-auto border border-white/10">
          <h4 className="text-xl font-semibold text-white mb-3">איך זה עובד?</h4>
          <p className="text-gray-300 leading-relaxed">
            העלה תמונה והבינה המלאכותית תיצור עליך תיאור מצחיק ויצירתי. 
            האפליקציה מתאימה לפעילויות קבוצתיות בבית הספר, במשרד או עם חברים, 
            או לשימוש אישי וחופשי. כל התיאורים נכתבים בטון הומוריסטי וקליל.
          </p>
           <img
          src="/lol/humorizeme_photo.png"
          alt="HumorizeMe Logo"
          className="w-24 sm:w-[400px] h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
