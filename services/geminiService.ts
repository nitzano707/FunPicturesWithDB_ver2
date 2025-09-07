
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * ENV:
 *  VITE_GEMINI_API_KEYS  - מפתח יחיד או רשימת מפתחות מופרדת בפסיקים (בשלב זה נשתמש בראשון בלבד)
 *  VITE_GEMINI_MODEL     - שם דגם, ברירת מחדל: "gemini-1.5-flash"
 */
const RAW_KEYS = (import.meta.env.VITE_GEMINI_API_KEYS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

if (RAW_KEYS.length === 0) {
  throw new Error("❌ לא הוגדר מפתח Gemini בסביבה (VITE_GEMINI_API_KEYS)");
}

const ACTIVE_KEY = RAW_KEYS[0]; // נשתמש במפתח הראשון בלבד

/** בקשת תיאור מהמודל */
async function callModel(prompt: string, image?: File): Promise<string> {
  const genAI = new GoogleGenerativeAI(ACTIVE_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const parts: any[] = [{ text: prompt }];
  if (image) {
    const bytes = await image.arrayBuffer();
    parts.push({
      inlineData: {
        data: btoa(String.fromCharCode(...new Uint8Array(bytes))),
        mimeType: image.type || "image/png",
      },
    });
  }

  const result = await model.generateContent(parts);
  const text = result.response.text();
  if (!text) throw new Error("המודל החזיר תשובה ריקה.");
  return text;
}

/** פרומפט ברירת מחדל */
function defaultPrompt(): string {
  return [
    "אתה כותב קריאייטיבי לאפליקציה מהנה. נתח את האדם בתמונה כדמות בדיונית, קליל ומצחיק.",
    "התמקד בהבעה, תנוחה, לבוש ואווירה; המצא פרסונה עם נופך הומוריסטי.",
    "תן הערכה מצחיקה (אך מכבדת) לגיל ולעיסוק יומיומי אפשרי.",
    "120–140 מילים, קריא, עם משפט סיום: ״לא לקחת ברצינות 😉״",
  ].join(" ");
}

/** API לשימוש חיצוני */
export async function generateFunnyDescription(
  file: File,
  customPrompt?: string
): Promise<string> {
  const prompt = customPrompt || defaultPrompt();
  return await callModel(prompt, file);
}
