import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";

export interface AnalysisResult {
  summary: string;
  insights: { title: string; body: string }[];
  keyTerms: string[];
  studyPlan: string[];
}

const PROMPT = `Bu belgeyi analiz et ve YALNIZCA aşağıdaki JSON formatında yanıt ver (markdown kod bloğu veya başka hiçbir şey ekleme):
{
  "summary": "Belgenin 3-4 cümlelik Türkçe genel özeti",
  "insights": [
    {"title": "Kısa başlık", "body": "Kısa açıklama, 1-2 cümle"},
    {"title": "Kısa başlık", "body": "Kısa açıklama, 1-2 cümle"},
    {"title": "Kısa başlık", "body": "Kısa açıklama, 1-2 cümle"}
  ],
  "keyTerms": ["terim1", "terim2", "terim3", "terim4", "terim5"],
  "studyPlan": ["Gün 1: kısa görev", "Gün 2: kısa görev", "Gün 3: kısa görev"]
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
  };
}
