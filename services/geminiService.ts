// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GallerySettings } from '../types';

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

// פרומפט ברירת מחדל לשחקן אישי
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

// פונקציה לבניית פרומפט דינמי מהגדרות גלריה
function buildCustomPrompt(settings: GallerySettings): string {
  const {
    ageRange,
    language,
    tone,
    genre,
    targetLength,
    familyFriendly,
    humorLevel,
    emojiUsage,
    perspective,
    energy,
    languageRichness,
    culturalReferences,
    customEnding,
    shtuyotLevel,
    focusWeights
  } = settings;

  // בניית הפרומפט הדינמי
  let prompt = "התבונן בתמונה וכתוב תיאור ";

  // אורך יעד
  prompt += `באורך ${targetLength - 20}–${targetLength + 20} מילים. `;

  // שפה ורמת פורמליות
  if (language === "hebrew_slang") {
    prompt += "השתמש בעברית עם סלנג קליל ונעים. ";
  } else if (language === "english_regular") {
    prompt += "Write in clear, engaging English. ";
  } else {
    prompt += "השתמש בעברית ברורה ונעימה. ";
  }

  // טון ואנרגיה
  if (tone === "encouraging") {
    prompt += "שמור על טון מעודד וחיובי. ";
  } else if (tone === "satirical") {
    prompt += "השתמש בסאטירה קלילה וחכמה. ";
  } else if (tone === "poetic") {
    prompt += "הוסף נגיעות פיוטיות ויופי לשוני. ";
  } else if (tone === "documentary") {
    prompt += "כתוב בסגנון דוקומנטרי קליל ומעניין. ";
  } else {
    prompt += "כתוב בטון של סטנד-אפ קומי. ";
  }

  // אנרגיה
  if (energy === "calm") {
    prompt += "שמור על אנרגיה רגועה ומתחשבת. ";
  } else if (energy === "energetic") {
    prompt += "הוסף אנרגיה גבוהה ותנועה לתיאור. ";
  } else {
    prompt += "שמור על אנרגיה בינונית ונעימה. ";
  }

  // ז'אנר
  if (genre === "fantasy") {
    prompt += "הוסף אלמנטים של פנטזיה ואגדה. ";
  } else if (genre === "scifi") {
    prompt += "שלב רכיבים של מדע בדיוני באופן הומוריסטי. ";
  } else if (genre === "noir") {
    prompt += "השתמש באווירה של סיפור בלשי עם נגיעות הומור. ";
  } else if (genre === "folklore") {
    prompt += "שלב אלמנטים מאגדות עם הומור מודרני. ";
  } else if (genre === "trailer") {
    prompt += "כתוב כמו טריילר קולנועי מצחיק ודרמטי. ";
  }

  // משקלי פוקוס
  let focusAreas = [];
  if (focusWeights.expression > 0.3) focusAreas.push("הבעת הפנים");
  if (focusWeights.pose > 0.3) focusAreas.push("התנוחה");
  if (focusWeights.clothing > 0.3) focusAreas.push("הלבוש");
  if (focusWeights.background > 0.3) focusAreas.push("הרקע");

  if (focusAreas.length > 0) {
    prompt += `תן דגש מיוחד ל: ${focusAreas.join(", ")}. `;
  }

  // פרספקטיבה
  if (perspective === "direct") {
    prompt += "פנה ישירות אל האדם בתמונה. ";
  } else {
    prompt += "כתוב בגוף שלישי על האדם בתמונה. ";
  }

  // רמת הומור וfamily-friendly
  if (humorLevel === "gentle") {
    prompt += "השתמש בהומור עדין וקליל. ";
  } else if (humorLevel === "mild_exaggeration") {
    prompt += "הגזם קלות באופן מצחיק. ";
  }

  if (familyFriendly === "high") {
    prompt += "שמור על תוכן מתאים למשפחות ולגילאים צעירים. ";
  }

  // רפרנסים תרבותיים
  if (culturalReferences === "light_israeli") {
    prompt += "הוסף רפרנסים קלים לתרבות הישראלית. ";
  } else if (culturalReferences === "light_international") {
    prompt += "הוסף רפרנסים קלים לתרבות הבינלאומית. ";
  }

  // עושר לשוני
  if (languageRichness === "simple") {
    prompt += "השתמש בשפה פשוטה וברורה. ";
  } else if (languageRichness === "rich") {
    prompt += "השתמש בעושר לשוני ובמילים יפות. ";
  }

  // רמת שטויניקיות
  if (shtuyotLevel === "high") {
    prompt += "הוסף הרבה אלמנטים מופרכים ומצחיקים. ";
  } else if (shtuyotLevel === "low") {
    prompt += "שמור על הגיון ועל אמינות יחסית. ";
  }

  // אימוג'י
  if (emojiUsage === "none") {
    prompt += "אל תשתמש באימוג'י כלל. ";
  } else if (emojiUsage === "moderate") {
    prompt += "הוסף כמה אימוג'י מתאימים. ";
  } else {
    prompt += "הוסף אימוג'י אחד בודד אם מתאים. ";
  }

  // התאמה לגיל
  if (ageRange === "8-12") {
    prompt += "התאם את התוכן לגילאי 8-12, עם שפה פשוטה והומור ילדותי. ";
  } else if (ageRange === "13-17") {
    prompt += "התאם לגילאי נוער עם הומור מעט יותר מתוחכם. ";
  }

  // סיומת מותאמת
  prompt += `בסיום הוסף את המשפט: "${customEnding}"`;

  return prompt;
}

// פונקציה ראשית מעודכנת
export async function generateFunnyDescription(
  imageFile: File,
  gallerySettings?: GallerySettings,
  customPrompt?: string
): Promise<string> {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    // בחירת הפרומפט המתאים
    let promptText: string;
    if (customPrompt) {
      promptText = customPrompt;
    } else if (gallerySettings) {
      promptText = buildCustomPrompt(gallerySettings);
    } else {
      promptText = defaultPrompt();
    }

    const textPart = { text: promptText };

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
