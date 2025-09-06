import { GoogleGenAI } from "@google/genai";

//const API_KEY = process.env.API_KEY;
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("VITE_API_KEY is not set. Please provide it in environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

// Helper function to convert File to a Gemini-compatible format
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        }
    };
    reader.readAsDataURL(file);
  });
  const base64EncodedData = await base64EncodedDataPromise;
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const generateFunnyDescription = async (imageFile: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = {
      //text: "תאר את התמונה הזו בצורה מצחיקה ושנונה במיוחד. תהיה יצירתי!",
     
      text: "התבונן בתמונה וכתוב תיאור מצחיק, יצירתי ומלא חיים באורך 120–140 מילים. הטקסט צריך להציג את האדם כדמות בדיונית קומית, עם דימויים חכמים, ניגודים משעשעים בין מה שהבעת הפנים והלבוש מנסים לומר לבין מה שהחיוך או הגוף באמת משדרים. שלב תיאורים צבעוניים של ההבעה, התנוחה, הלבוש והאווירה הכללית, והפוך אותם לחלק מאישיות מוגזמת ומצחיקה. המצא לו שם או כינוי קליל, תן הערכה הומוריסטית לגבי גיל, מגדר ועיסוק אפשרי, והוסף אנקדוטה קטנה שתגרום לקוראת להרגיש שהיא מגלה ``סוד מצחיק`` עליו. שמור על טון קליל, שנון, כיפי ולא פוגעני. בסיום תמיד הוסף את המשפט: ``[לא לקחת ברצינות 😉]``",

    };
    
    const response = await ai.models.generateContent({
      //model: 'gemini-2.5-flash',
      model: 'gemini-2.5-flash-lite',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating description from Gemini:", error);
    throw new Error("לא הצלחנו ליצור תיאור. נסה שוב.");
  }
};
