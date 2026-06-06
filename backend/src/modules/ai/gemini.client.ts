import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";

export interface AnalysisResult {
  summary: string;
  insights: { title: string; body: string }[];
  keyTerms: string[];
  studyPlan: string[];
  quizQuestions: { question: string; options: string[]; correctIndex: number }[];
  flashcards: { term: string; definition: string }[];
}

export type QuizQuestion = { question: string; options: string[]; correctIndex: number };

const PROMPT = `Bu belgeyi analiz et ve YALNIZCA aşağıdaki JSON formatında yanıt ver (markdown kod bloğu veya başka hiçbir şey ekleme):
{
  "summary": "Belgenin 3-4 cümlelik Türkçe genel özeti",
  "insights": [
    {"title": "Kısa başlık", "body": "Kısa açıklama, 1-2 cümle"},
    {"title": "Kısa başlık", "body": "Kısa açıklama, 1-2 cümle"},
    {"title": "Kısa başlık", "body": "Kısa açıklama, 1-2 cümle"}
  ],
  "keyTerms": ["terim1", "terim2", "terim3", "terim4", "terim5"],
  "studyPlan": ["Gün 1: kısa görev", "Gün 2: kısa görev", "Gün 3: kısa görev"],
  "quizQuestions": [
    {
      "question": "Belgeyle ilgili soru?",
      "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"],
      "correctIndex": 0
    },
    {
      "question": "Belgeyle ilgili soru?",
      "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"],
      "correctIndex": 2
    },
    {
      "question": "Belgeyle ilgili soru?",
      "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"],
      "correctIndex": 1
    },
    {
      "question": "Belgeyle ilgili soru?",
      "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"],
      "correctIndex": 3
    },
    {
      "question": "Belgeyle ilgili soru?",
      "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"],
      "correctIndex": 0
    }
  ],
  "flashcards": [
    {"term": "Terim 1", "definition": "Bu terimin kısa ve anlaşılır Türkçe tanımı"},
    {"term": "Terim 2", "definition": "Bu terimin kısa ve anlaşılır Türkçe tanımı"},
    {"term": "Terim 3", "definition": "Bu terimin kısa ve anlaşılır Türkçe tanımı"},
    {"term": "Terim 4", "definition": "Bu terimin kısa ve anlaşılır Türkçe tanımı"},
    {"term": "Terim 5", "definition": "Bu terimin kısa ve anlaşılır Türkçe tanımı"},
    {"term": "Terim 6", "definition": "Bu terimin kısa ve anlaşılır Türkçe tanımı"}
  ]
}`;

export async function analyzeFileWithGemini(
  filePath: string,
  mimeType: string,
  apiKey: string,
  modelName = "gemini-2.5-flash"
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const fileBytes = await fs.promises.readFile(filePath);
  const base64 = fileBytes.toString("base64");

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: base64,
      },
    },
    { text: PROMPT },
  ]);

  const text = result.response.text().trim();

  // Bazen Gemini JSON'ı markdown kod bloğuna sarar; temizle
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini geçerli bir JSON yanıtı döndürmedi.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<AnalysisResult>;

  return {
    summary: parsed.summary ?? "Özet oluşturulamadı.",
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
    studyPlan: Array.isArray(parsed.studyPlan) ? parsed.studyPlan : [],
    quizQuestions: Array.isArray(parsed.quizQuestions) ? parsed.quizQuestions : [],
    flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
  };
}

export async function generateTargetedQuiz(
  wrongQuestions: { question: string; correctAnswer: string }[],
  contextSummary: string,
  contextTerms: string[],
  apiKey: string,
  modelName = "gemini-2.5-flash"
): Promise<QuizQuestion[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const wrongList = wrongQuestions
    .map((q, i) => `${i + 1}. Soru: "${q.question}"\n   Doğru Cevap: "${q.correctAnswer}"`)
    .join("\n");

  const prompt = `Konu özeti: ${contextSummary}
Anahtar terimler: ${contextTerms.join(", ")}

Öğrenci aşağıdaki sorularda hata yaptı:
${wrongList}

Bu konulardaki eksiklikleri gidermek için 5 yeni çoktan seçmeli soru üret.
Sorular orijinal sorulardan farklı olsun ama aynı konuları farklı açılardan test etsin.
YALNIZCA aşağıdaki JSON array formatında yanıt ver (başka hiçbir şey yazma):
[
  {"question": "Soru metni?", "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"], "correctIndex": 0}
]`;

  const result = await model.generateContent([{ text: prompt }]);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini hedefli quiz için geçerli JSON döndürmedi.");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) throw new Error("Beklenen array formatı değil.");

  return parsed as QuizQuestion[];
}
