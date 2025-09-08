// types.ts
export interface GallerySettings {
  ageRange: string;          // "8-12", "13-17", "18+"
  language: string;          // "hebrew_regular", "hebrew_slang", "english_regular"
  tone: string;              // "encouraging", "standup", "satirical", "poetic", "documentary"
  genre: string;             // "contemporary", "fantasy", "scifi", "noir", "folklore", "trailer"
  targetLength: number;      // 60-200 words
  familyFriendly: string;    // "high", "regular"
  humorLevel: string;        // "gentle", "witty", "mild_exaggeration"
  emojiUsage: string;        // "none", "minimal", "moderate"
  perspective: string;       // "third_person", "direct"
  energy: string;            // "calm", "moderate", "energetic"
  languageRichness: string;  // "simple", "regular", "rich"
  culturalReferences: string; // "none", "light_israeli", "light_international"
  customEnding: string;      // custom ending phrase
  shtuyotLevel: string;      // "low", "moderate", "high"
  focusWeights: {
    expression: number;      // 0-1
    pose: number;           // 0-1
    clothing: number;       // 0-1
    background: number;     // 0-1
  };
}

export interface Gallery {
  id: string;                // uuid
  name: string;              // שם הגלריה
  share_code: string;        // קוד שיתוף לצפייה/הצטרפות
  admin_code: string;        // קוד לניהול (מחיקה של כולם וכו')
  creator_identifier: string; // מזהה יוצר (בדפדפן של היוצר) - גיבוי
  creator_google_id?: string; // Google Auth ID - עיקרי
  creator_email?: string;    // Google email
  settings?: GallerySettings; // הגדרות הגלריה
  created_at: string;
}

export interface Photo {
  id: string;                // uuid
  gallery_id: string;        // uuid (FK -> galleries.id)
  username: string;          // שם מוצג
  image_url: string;         // URL ציבורי לתמונה
  description: string;       // טקסט משעשע
  owner_identifier: string;  // מזהה מקומי של המעלה (למחיקה עצמית)
  created_at: string;
}

export interface User {
  id: string;                // Google Auth user ID
  email: string;             // Google email
  name?: string;             // Google display name
}

/** הקשר ריצה בצד לקוח (לא נשמר בטבלה) */
export interface ClientContext {
  ownerIdentifier: string;   // מזהה מקומי (localStorage)
  gallery: Gallery | null;   // הגלריה הפעילה
  isAdmin: boolean;          // האם הגולש הזין admin_code תקין עבור הגלריה
  user?: User | null;        // משתמש מחובר (Google Auth)
}

// Page types for navigation without router
export type PageType = 'home' | 'captain-select' | 'gallery-setup' | 'gallery-active' | 'solo-player';

export interface NavigationState {
  currentPage: PageType;
  selectedGallery?: Gallery;
}
