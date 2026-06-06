import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface Goal {
  title: string;
  daysLeft: number;
}

const SYSTEM_PROMPT = `Sen Türkçe konuşan bir eğitim asistanısın. Adın "EduAI".
Öğrencilere kişiselleştirilmiş çalışma planları hazırlıyor, motivasyon sağlıyor ve hedeflerine ulaşmalarına yardım ediyorsun.
Kısa, net ve motive edici cevaplar ver. Madde madde plan isteniğinde liste formatında yaz.
Emoji kullanabilirsin ama abartma. Cevapların 3-6 cümle/madde civarında olsun.`;

function buildGoalContext(goals: Goal[]): string {
  if (!goals || goals.length === 0) return "";
  const list = goals
    .map((g) => `- ${g.title}: ${g.daysLeft} gün kaldı`)
    .join("\n");
  return `\nKullanıcının mevcut hedefleri:\n${list}\n`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chatWithAI(
  messages: ChatMessage[],
  goals: Goal[] = [],
  apiKey: string,
  modelName = "gemini-2.5-flash"
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT + buildGoalContext(goals),
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  // Gemini history 'user' mesajıyla başlamalı — baştaki 'model' mesajlarını çıkar
  while (history.length > 0 && history[0].role !== "user") {
    history.shift();
  }

  const lastMessage = messages[messages.length - 1];

  // 3 deneme, üstel bekleme: 1s, 2s, 4s
  const DELAYS = [1000, 2000, 4000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text().trim();
    } catch (err: any) {
      lastError = err;
      const is503 = err?.status === 503 || err?.message?.includes("503");
      const is429 = err?.status === 429 || err?.message?.includes("429");
      if ((is503 || is429) && attempt < DELAYS.length) {
        await sleep(DELAYS[attempt]);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

