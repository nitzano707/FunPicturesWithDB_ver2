// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// נשתמש במפתח מה־ENV (לוקחים את הראשון אם יש פסיקים)
const apiKeys = (import.meta.env.VITE_GEMINI_API_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (apiKeys.length === 0) {
  throw new Error("VITE_GEMINI_API_KEYS is not set. Please provide it in environment variables.");
}

const apiKey = apiKeys[0]; // בשלב זה נשתמש רק בראשון
const genAI = new GoogleGenerativeAI(apiKey);

// פונקציה שעושה המרה של קובץ לתבנית תואמת Gemini
async function fileToGenerativePart(file: File) {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]);
      }
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

// פרומפט ברירת מחדל – ניתן לשנות לפי הצורך
function defaultPrompt(): string {
  return (
    "התבונן בתמונה וכתוב תיאור מצחיק, יצירתי ומלא חיים באורך 120–140 מילים. " +
    "הטקסט צריך להציג את האדם כדמות בדיונית קומית, עם דימויים חכמים, " +
    "ניגודים משעשעים בין מה שהבעת הפנים והלבוש מנסים לומר לבין מה שהחיוך או הגוף באמת משדרים. " +
    "שלב תיאורים צבעוניים של ההבעה, התנוחה, הלבוש והאווירה הכללית, " +
    "והפוך אותם לחלק מאישיות מוגזמת ומצחיקה. המצא לו שם או כינוי קליל, " +
    "תן הערכה הומוריסטית לגבי גיל, מגדר ועיסוק אפשרי, והוסף אנקדוטה קטנה " +
    "שתגרום לקוראת להרגיש שהיא מגלה 'סוד מצחיק' עליו. " +
    "שמור על טון קליל, שנון, כיפי ולא פוגעני. " +
    "בסיום תמיד הוסף את המשפט: [לא לקחת ברצינות 😉]"
  );
}

// פונקציה ראשית לשימוש באפליקציה
export async function generateFunnyDescription(
  imageFile: File,
  customPrompt?: string
): Promise<string> {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: customPrompt || defaultPrompt() };

    const response = await genAI.getGenerativeModel({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash-lite",
    }).generateContent({
      contents: { parts: [imagePart, textPart] },
    });

    return response.response.text();
  } catch (error) {
    console.error("Error generating description from Gemini:", error);
    throw new Error("❌ לא הצלחנו ליצור תיאור. נסה שוב.");
  }
}
