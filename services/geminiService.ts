
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Difficulty, QuizQuestion } from "../types";
import { storageService } from "./storageService";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const QUESTION_COUNT = 5;

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The quiz question text in Traditional Chinese (Cantonese context)." },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "An array of 4 possible answers."
      },
      correctAnswerIndex: { type: Type.INTEGER, description: "The index (0-3) of the correct answer." },
      explanation: { type: Type.STRING, description: "A detailed explanation of the correct answer in Traditional Chinese." },
      roast: { type: Type.STRING, description: "A very mean, sarcastic, and funny Cantonese insult for getting this wrong. Relate it to goldfish memory or stupidity." },
      praise: { type: Type.STRING, description: "A highly complimentary, flowery Cantonese praise for getting this right." }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation", "roast", "praise"]
  }
};

export const generateQuizQuestions = async (difficulty: Difficulty): Promise<QuizQuestion[]> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing");
  }

  // Get recently asked questions to prevent duplicates
  const recentQuestions = storageService.getRecentQuestionTexts(30);
  const exclusionText = recentQuestions.length > 0 
    ? `IMPORTANT: Do NOT generate the following questions or very similar ones: ${JSON.stringify(recentQuestions)}.` 
    : '';

  const prompt = `
    Generate ${QUESTION_COUNT} multiple-choice quiz questions about Goldfish (金魚), Aquarium keeping, and fish biology.
    Difficulty Level: ${difficulty}.
    
    ${exclusionText}
    
    Context:
    - Language: Traditional Chinese (Hong Kong/Cantonese style).
    - Style: Fun, engaging.
    - Difficulty Guide:
      - ${Difficulty.EASY}: Common knowledge (e.g., what do they eat, basic colors).
      - ${Difficulty.MEDIUM}: Specific types (Ranchu, Oranda), basic diseases, tank setup.
      - ${Difficulty.HARD}: Scientific names, history (Ming/Qing dynasty origins), specific breeding techniques, rare diseases.

    Output MUST be a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a ruthless but knowledgeable Goldfish Quiz Master. You speak fluent Cantonese.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const rawData = JSON.parse(text);
    
    // Add IDs to the questions
    return rawData.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Error fetching questions:", error);
    // Fallback questions in case of API failure to prevent app crash
    return getFallbackQuestions(difficulty);
  }
};

const getFallbackQuestions = (difficulty: Difficulty): QuizQuestion[] => {
  return [
    {
      id: 'fb-1',
      question: "（離線模式）金魚嘅祖先係咩魚？",
      options: ["鯉魚", "鯽魚", "草魚", "多寶魚"],
      correctAnswerIndex: 1,
      explanation: "金魚係由野生鯽魚演化而黎，經過千百年嘅選育變成今日咁靚。",
      roast: "唔係掛？連祖宗都唔識認？你個腦裝屎架？",
      praise: "好野！果然係金魚達人，連族譜都背熟埋！"
    },
    {
      id: 'fb-2',
      question: "（離線模式）以下邊種金魚無背鰭？",
      options: ["琉金", "獅头", "蘭壽", "和金"],
      correctAnswerIndex: 2,
      explanation: "蘭壽（Ranchu）係蛋種金魚，特徵就係圓碌碌無背鰭。",
      roast: "有眼無珠！咁大條魚有無背鰭都睇唔到？",
      praise: "犀利！一眼就睇穿蘭壽嘅特徵！"
    }
  ];
}
