// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * ENV:
 *  VITE_GEMINI_API_KEYS  - מחרוזת של מפתחות מופרדת בפסיקים
 *  VITE_GEMINI_MODEL     - שם דגם, ברירת מחדל: "gemini-1.5-flash"
 */
const RAW_KEYS = (import.meta.env.VITE_GEMINI_API_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

const BAD_KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24 שעות
const LS_BAD_KEYS = "gemini_bad_keys_v1";   // { [key]: untilEpochMs }
const LS_KEY_INDEX = "gemini_key_index_v1"; // אינדקס מפתח אחרון שנוסה (round-robin)

/** קורא bad-keys מ־localStorage */
function loadBadKeys(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_BAD_KEYS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** כותב bad-keys */
function saveBadKeys(map: Record<string, number>) {
  try {
    localStorage.setItem(LS_BAD_KEYS, JSON.stringify(map));
  } catch {
    // אם localStorage לא זמין (למשל SSR), מתעלמים
  }
}

/** מסמן מפתח כבעייתי ל־24 שעות */
function markKeyBad(key: string) {
  const map = loadBadKeys();
  map[key] = Date.now() + BAD_KEY_TTL_MS;
  saveBadKeys(map);
}

/** בוחר מפתח זמין (לא ב־bad ועם round-robin) */
function getUsableKey(): string | null {
  if (RAW_KEYS.length === 0) return null;

  const bad = loadBadKeys();
  const now = Date.now();

  // מנקים פג תוקף
  for (const k of Object.keys(bad)) {
    if (bad[k] <= now) delete bad[k];
  }
  saveBadKeys(bad);

  let idx = Number(localStorage.getItem(LS_KEY_INDEX) || "0");

  for (let tries = 0; tries < RAW_KEYS.length; tries++) {
    const key = RAW_KEYS[idx % RAW_KEYS.length];
    idx = (idx + 1) % RAW_KEYS.length;

    if (!bad[key]) {
      localStorage.setItem(LS_KEY_INDEX, String(idx));
      return key;
    }
  }
  return null;
}

/** בקשת תיאור מהמודל תוך סבב מפתחות */
async function callModelWithRotation(
  prompt: string,
  image?: File
): Promise<string> {
  const tried: string[] = [];

  while (true) {
    const key = getUsableKey();
    if (!key) {
      throw new Error(
        "אין כרגע מפתח Gemini זמין. נסה מאוחר יותר או הוסף מפתחות (VITE_GEMINI_API_KEYS)."
      );
    }
    tried.push(key);

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: MODEL });

      const parts: any[] = [{ text: prompt }];

      if (image) {
        const bytes = await image.arrayBuffer();
        parts.push({
          inlineData: {
            data: btoa(
              String.fromCharCode(...new Uint8Array(bytes))
            ),
            mimeType: image.type || "image/png",
          },
        });
      }

      const result = await model.generateContent(parts);
      const text = result.response.text();

      if (!text) {
        throw new Error("המודל החזיר תשובה ריקה.");
      }

      return text;
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();

      // rate-limit / quota / forbidden → נעבור למפתח הבא
      if (
        msg.includes("rate") ||
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("forbidden") ||
        msg.includes("403")
      ) {
        markKeyBad(key);

        if (tried.length >= RAW_KEYS.length) {
          throw new Error(
            "כל המפתחות חסומים זמנית (Rate limit). נסה שוב מאוחר יותר."
          );
        }
        continue; // ננסה מפתח אחר
      }

      // במקרה של שגיאה לוגית (כמו recursion / stack overflow)
      if (msg.includes("call stack")) {
        throw new Error(
          "שגיאת מערכת פנימית: Maximum call stack size exceeded. נסה לרענן את הדף."
        );
      }

      throw err;
    }
  }
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

/** API חיצוני לשימוש באפליקציה */
export async function generateFunnyDescription(
  file: File,
  customPrompt?: string
): Promise<string> {
  const prompt = customPrompt || defaultPrompt();
  return await callModelWithRotation(prompt, file);
}
