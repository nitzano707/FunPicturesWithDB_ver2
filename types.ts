// types.ts

export interface Gallery {
  id: string;                // מזהה ייחודי (UUID)
  name: string;              // שם הגלריה
  share_code: string;        // קוד לשיתוף
  admin_code: string;        // קוד ניהול
  creator_identifier: string; // מזהה של היוצר (יכול להיות טוקן/UUID אקראי)
  created_at: string;        // תאריך יצירה
}

export interface Photo {
  id: number;                // מזהה ייחודי לתמונה
  gallery_id: string;        // לאיזו גלריה התמונה שייכת
  username: string;          // שם המשתמש שהעלה
  image_url: string;         // קישור ציבורי לתמונה
  description: string;       // התיאור שה־AI יצר
  owner_identifier: string;  // מזהה של מעלה התמונה
  created_at: string;        // תאריך יצירה
}
