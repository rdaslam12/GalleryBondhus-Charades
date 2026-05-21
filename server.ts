/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize GoogleGenAI to prevent crashing on boot if the API key is temporarily missing.
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Healthcheck Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Gemini Card Generator Route
app.post("/api/gemini/generate-cards", async (req, res): Promise<any> => {
  try {
    const { category, categoryNameBangla, categoryNameEnglish, customPrompt, count = 10 } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "missing_api_key",
        message: "Gemini API Key is not configured. Please add GEMINI_API_KEY in the Secrets / Settings menu."
      });
    }

    const ai = getAiClient();
    const systemPrompt = `You are an expert pop-culture researcher and card designer for a legendary Bangladeshi Gen-Z Charades/Taboo party game called "Gallery-Bondhus".
Your task is to generate highly authentic, fun, and humorous guessing words/cards in the category: "${categoryNameEnglish}" (${categoryNameBangla}).
Use Gen-Z slangs, local memes, nostalgic items, traditional foods, media stars, movies, and internet drama that young Bangladeshis from Dhaka/Chittagong immediately know and laugh about.

If the user provides an additional constraint / prompt, honor it heavily: "${customPrompt || 'None'}".

Each card object MUST have:
1. word: The primary guess word written strictly in clear Bangla script (e.g. 'আইমান সাদিক', 'কালা ভুনা', 'প্যারা নাই চিল').
2. englishTranslit: English transliteration of the word so non-native readers or phonetic speakers can read it easily.
3. tabooWords: 4 closely related words/clues (strictly in Bangla script) that the describer is FORBIDDEN to use (Taboo words) to describe the card.
4. funHint: A hilariously snappy hint in a mix of Bangla and English (Banglish) that describes this item with heavy Gen-Z energy.

Generate exactly ${count} highly creative cards with no repeats. Keep words culturally accurate.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate card items for our party game deck.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: {
                type: Type.STRING,
                description: "The primary Bangladeshi word or phrase in Bangla script."
              },
              englishTranslit: {
                type: Type.STRING,
                description: "English phonetic guidance or pronunciation."
              },
              tabooWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 prohibited clues/taboo words in Bangla script."
              },
              funHint: {
                type: Type.STRING,
                description: "A snappy, funny context clue in mixed Banglish/English."
              }
            },
            required: ["word", "englishTranslit", "tabooWords", "funHint"]
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty response from Gemini.");
    }

    const cardsArray = JSON.parse(textOutput);
    // Format cards with randomized IDs and mount Category
    const formattedCards = cardsArray.map((card: any, index: number) => ({
      id: `ai-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
      word: card.word,
      englishTranslit: card.englishTranslit,
      tabooWords: Array.isArray(card.tabooWords) ? card.tabooWords.slice(0, 4) : ["সাংস্কৃতিক", "বাংলাদেশ", "শব্দ", "গেম"],
      category: category,
      funHint: card.funHint
    }));

    return res.json({
      success: true,
      cards: formattedCards,
      source: "gemini"
    });

  } catch (error: any) {
    console.error("Gemini Card Generation Error:", error);
    return res.status(500).json({
      error: "generation_failed",
      message: error.message || "Could not generate cards at this moment. Please check your prompt or API key."
    });
  }
});

// Vite Setup with SPA routing
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gallery-Bondhus Full-Stack Express Server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start Full-Stack server:", err);
});
