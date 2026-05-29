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
const PORT = Number(process.env.PORT) || 3000;

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

// Test endpoint for Gemini key checks
app.get("/api/gemini/test", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    success: true, 
    apiKeySet: hasKey, 
    message: hasKey ? "API Key has been configured properly on backend!" : "API Key missing." 
  });
});

// Standard normalization for duplicate card checking
function normalizeWord(w: string): string {
  if (!w) return "";
  // Keeps only Bangla alphanumeric characters and lowercase English, stripping spaces/punctuation
  return w.replace(/[\s\p{P}]/gu, "").replace(/[-_]/g, "").toLowerCase().trim();
}

// 2. Gemini Card Generator Route
app.post("/api/gemini/generate-cards", async (req, res): Promise<any> => {
  try {
    const { 
      category, 
      categoryNameBangla, 
      categoryNameEnglish, 
      customPrompt, 
      count = 60, // Request high volume base (50-80) as per requirements
      excludeWords = [], // List of already-seen card words from client
      sessionId = `sess_${Math.random().toString(36).substring(2, 9)}` // Dynamic seed to shift prompt weights
    } = req.body;

    console.log(`[Card Gen UI] Generating cards for category="${category}" count=${count} sessionId="${sessionId}"`);
    console.log(`[Card Gen UI] Received excludeWords: ${excludeWords.length} items`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Card Gen UI] GEMINI_API_KEY is missing on server/Render environment.");
      return res.status(400).json({
        error: "missing_api_key",
        message: "Gemini API key missing on server/Render environment."
      });
    }

    const ai = getAiClient();
    
    // Deep Taxonomy Enforcement guidance matrix
    const taxonomyGuidance = `
Divide your card generations creatively into these hyper-local Bangladeshi contemporary categories where applicable:
1. Food & Culinary Culture: (e.g., Kacchi Biryani, Tong er Cha, Fuchka Vendor, Shutki Chutney, Old Dhaka vs Dhanmondi cafes).
2. Celebrities, Creators & Icons: (e.g., Ayman Sadiq, Rafsan The Choto Bhai, Raba Khan, Tahsan, Chorki/Hoichoi stars, cricket icons).
3. Movies, Series & Media: (e.g., Toofan, Mohanagar, Kaiser, Bachelor Point, timeless Humayun Ahmed dramas).
4. Dhaka Gen-Z Memes & Slang: (e.g., "Hala Chura", "Vibe Check", "Parbe na parte hobe", "Kapaikata", viral Facebook/TikTok audio trends).
5. Local Fashion, Brands & Lifestyle: (e.g., Gorur Ghash knits, Panjabi on Eid, Jamdani, local streetwear, heavy volume hair pomades).
6. Campus & Geolocation Subcultures: (e.g., NSU vs. BRACU banter, TSC tea stalls, Jamuna Future Park, Cox's Bazar road trips).
`;

    // Define the core generation function
    const performGeneration = async (forbiddenList: string[]): Promise<any[]> => {
      const formattedForbidden = forbiddenList.map(w => `"${w}"`).join(", ");
      
      const systemPrompt = `You are an expert pop-culture researcher and card designer for a legendary Bangladeshi Gen-Z Charades/Taboo party game called "Gallery-Bondhus".
Your task is to generate highly authentic, fun, and humorous guessing words/cards in the category: "${categoryNameEnglish}" (${categoryNameBangla}).

TAXONOMY & QUALITY COMPLIANCE:
${taxonomyGuidance}

AVOID REPETITIONS & COMMONS:
- Strictly AVOID basic, boring, repetitively seen examples. Be extremely creative and contemporary!
- Do not generate duplicate words/phrases.
- STRICT NEGATIVE CONSTRAINT: Under no circumstances generate any of the following already-used words:
  [ ${formattedForbidden} ]

If the user provides an additional constraint / prompt, honor it heavily: "${customPrompt || 'None'}".
Each card object MUST have:
1. word: The primary guess word written strictly in clear Bangla script (e.g. 'আইমান সাদিক', 'কালা ভুনা', 'প্যারা নাই চিল').
2. englishTranslit: English transliteration of the word so non-native readers or phonetic speakers can read it easily.
3. tabooWords: Exactly 4 closely related words/clues (strictly in Bangla script) that the describer is FORBIDDEN to use (Taboo words) to describe the card.
4. funHint: A hilariously snappy hint in a mix of Bangla and English (Banglish) that describes this item with heavy Gen-Z energy.

Generate exactly ${count} highly creative cards with no repeats. Keep words culturally accurate.
Prompt entropy seed: "${sessionId}-${Date.now()}".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a rich list of ${count} unique party card objects for session: ${sessionId}`,
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
        throw new Error("Zero response characters fetched from Gemini API.");
      }
      return JSON.parse(textOutput);
    };

    // First attempt
    let rawCards = [];
    try {
      rawCards = await performGeneration(excludeWords);
    } catch (apiErr: any) {
      console.error("[Card Gen UI] Primary Gemini generation attempt failed:", apiErr);
      throw apiErr;
    }

    // Server-side Deduplication filtering
    const buildUniqueList = (cardsList: any[]): any[] => {
      const seen = new Set<string>();
      // Also add already excluded words to safeguard duplicates
      excludeWords.forEach((word: string) => {
        seen.add(normalizeWord(word));
      });

      const deduplicated: any[] = [];
      for (const card of cardsList) {
        if (!card || !card.word) continue;
        const norm = normalizeWord(card.word);
        if (!seen.has(norm)) {
          seen.add(norm);
          deduplicated.push(card);
        }
      }
      return deduplicated;
    };

    let filteredCards = buildUniqueList(rawCards);
    console.log(`[Card Gen UI] Generated ${rawCards.length} raw cards. Unique: ${filteredCards.length}`);

    // If fewer than 25 unique cards remain after filtering, call Gemini one more time with the duplicate words in the exclude list.
    if (filteredCards.length < 25) {
      console.log(`[Card Gen UI] Insufficient unique cards (${filteredCards.length} < 25). Initiating retry/supplement batch...`);
      try {
        const currentlyGeneratedWords = filteredCards.map(c => c.word);
        const unifiedExcludeList = [...excludeWords, ...currentlyGeneratedWords];
        
        const additionalRaw = await performGeneration(unifiedExcludeList);
        const unifiedRaw = [...rawCards, ...additionalRaw];
        filteredCards = buildUniqueList(unifiedRaw);
        console.log(`[Card Gen UI] Retry complete. Cumulative unique cards: ${filteredCards.length}`);
      } catch (retryErr) {
        console.error("[Card Gen UI] Supplement generation failed, staying with primary list:", retryErr);
      }
    }

    // Format cards with randomized IDs and categories
    const formattedCards = filteredCards.map((card: any, index: number) => ({
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
      countGenerated: formattedCards.length,
      source: "gemini"
    });

  } catch (error: any) {
    console.error("[Card Gen UI] Gemini Call Exhaustive Failure:", error);
    return res.status(500).json({
      error: "generation_failed",
      message: error.message || "Failed to contact Gemini engine. Check internet connections or server settings."
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
