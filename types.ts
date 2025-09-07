// types.ts

export interface Gallery {
  id: string;                // uuid
  name: string;              // שם הגלריה
  share_code: string;        // קוד שיתוף לצפייה/הצטרפות
  admin_code: string;        // קוד לניהול (מחיקה של כולם וכו')
  creator_identifier: string; // מזהה יוצר (בדפדפן של היוצר)
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

/** הקשר ריצה בצד לקוח (לא נשמר בטבלה) */
export interface ClientContext {
  ownerIdentifier: string;   // מזהה מקומי (localStorage)
  gallery: Gallery | null;   // הגלריה הפעילה
  isAdmin: boolean;          // האם הגולש הזין admin_code תקין עבור הגלריה
}
