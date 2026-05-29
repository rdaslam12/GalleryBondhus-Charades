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
  return w
    .toLowerCase()
    .trim()
    .replace(/[\s\p{P}\-_()[\]（）]/gu, "")
    .replace(/[।?!.,৳—–]/g, "");
}

// 2. Gemini Card Generator Route
app.post("/api/gemini/generate-cards", async (req, res): Promise<any> => {
  try {
    const { 
      selectedCategories = ["movies_series", "celebrities_creators", "dhaka_memes_slang", "food_culture"], 
      categoryNames, 
      customPrompt, 
      count = 80, // Default to 80 cards
      excludeWords = [], // List of already-seen card words from client
      sessionSeed = `sess_${Math.random()}`, // Dynamic seed to shift prompt weights
      desiredMix = { banglaSouthAsian: 40, international: 45, wildcard: 15 }
    } = req.body;

    console.log(`[Card Gen UI] Generating cards for categories=${JSON.stringify(selectedCategories)} count=${count} sessionSeed="${sessionSeed}"`);
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
    
    // Set up allowed categories string
    const allowedCatsStr = selectedCategories.join(", ");

    // Define the core generation function
    const performGeneration = async (forbiddenList: string[], targetCount: number): Promise<any[]> => {
      const formattedForbidden = forbiddenList.slice(0, 200).map(w => `"${w}"`).join(", ");
      
      const systemPrompt = `You are an expert pop-culture researcher and card designer for a legendary mixed Bangladeshi + global Gen-Z Charades/Taboo party game called "Gallery-Bondhus".
Your task is to generate fresh, highly recognizable, non-repetitive guessing cards. 

Balanced Cultural Mix Requirement:
- 40% Bangladeshi / South Asian: (e.g. Kacchi Biryani, Dhaka TSC, Lalbagh Fort, Cox's Bazar, Ayman Sadiq, Shakib Khan, localized Gen-Z memes, popular Dhallywood actors/films, local street anatomy, lifestyle trends).
- 45% international pop culture: (e.g. Hollywood movies/stars, Bollywood movies/stars, popular K-dramas, anime and cartoons, world sports stars like Ronaldo or Messi, global musicians like Taylor Swift or BTS, gaming characters, famous fictional characters, apps/brands/tech).
- 15% wildcard / funny / unexpected contemporary viral topics.

RULES FOR INPUT FIELDS:
1. "word": The main guess word. For international cards, use the commonly known English name (e.g., “Taylor Swift”, “Spider-Man”, “Harry Potter”, “Naruto”, “Cristiano Ronaldo”, "YouTube"). Do NOT force international terms into Bangla script! Write them in clear English script. For Bangladeshi culture, use Bangla script.
2. "englishTranslit": English transliteration of the word to provide pronunciation/reading support.
3. "tabooWords": Exactly 4 closely related words/clues that are forbidden to say during descriptions. Write them in the same script/language as the guess "word".
4. "category": Choose one of the allowed categories: [ ${allowedCatsStr} ] that best fits the item. Ensure cards are divided nicely among these categories.
5. "funHint": A hilariously snappy hint in a mix of Bangla and English (Banglish) that describes this item with heavy, friendly Gen-Z energy.

STRICT NEGATIVE CONSTRAINT:
- Absolutely NO duplicate or near-duplicate words!
- Under no circumstances generate any of the following already-used words/phrases: [ ${formattedForbidden} ]
- Do not generate obscure or boring terms. Keep cards easy and highly engaging for party gameplay.

If an additional constraint / prompt is specified, honor it: "${customPrompt || 'None'}".
Generate exactly ${targetCount} unique party card objects that strictly match the JSON schema.
Prompt entropy seed: "${sessionSeed}-${Date.now()}".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a list of ${targetCount} unique party card objects for categories [${allowedCatsStr}] matching the schema.`,
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
                  description: "The primary guess word/phrase (English for global, Bangla for local culture)."
                },
                englishTranslit: {
                  type: Type.STRING,
                  description: "Phonetic reading guidance or English meaning helper."
                },
                tabooWords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 4 prohibited words/taboo terms in corresponding language/script."
                },
                category: {
                  type: Type.STRING,
                  description: "The category tag corresponding to one of the selected categories."
                },
                funHint: {
                  type: Type.STRING,
                  description: "A funny, snappy hint in mixed Banglish/English."
                }
              },
              required: ["word", "englishTranslit", "tabooWords", "category", "funHint"]
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
    let rawCards: any[] = [];
    try {
      rawCards = await performGeneration(excludeWords, count);
    } catch (apiErr: any) {
      console.error("[Card Gen UI] Primary Gemini generation attempt failed:", apiErr);
      throw apiErr;
    }

    // Server-side validation & Deduplication
    const buildUniqueList = (cardsList: any[]): any[] => {
      const seen = new Set<string>();
      // Also add already excluded words to safeguard duplicates
      excludeWords.forEach((word: string) => {
        seen.add(normalizeWord(word));
      });

      const deduplicated: any[] = [];
      for (const card of cardsList) {
        if (!card) continue;
        if (!card.word || !card.englishTranslit || !card.category || !card.funHint || !Array.isArray(card.tabooWords)) {
          // Skip invalid cards missing required attributes
          continue;
        }

        const normWord = normalizeWord(card.word);
        const normTrans = normalizeWord(card.englishTranslit);

        // Check if normalized word or translit matches anything seen
        if (!seen.has(normWord)) {
          seen.add(normWord);
          if (normTrans && normTrans.length > 2) {
            seen.add(normTrans);
          }
          
          // Ensure category is one of the allowed categories
          if (!selectedCategories.includes(card.category)) {
            card.category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
          }

          deduplicated.push(card);
        }
      }
      return deduplicated;
    };

    let filteredCards = buildUniqueList(rawCards);
    const duplicatesRemovedCount = rawCards.length - filteredCards.length;
    console.log(`[Card Gen UI] Primary Batch: Generated=${rawCards.length}. Cleaned/Unique=${filteredCards.length}. Duplicates/Excludes removed=${duplicatesRemovedCount}`);

    // If fewer than 50 unique cards remain, make a second request for replacement/supplement cards
    if (filteredCards.length < 50) {
      console.log(`[Card Gen UI] Remaining cards too low (${filteredCards.length} < 50). Initiating a second supplement request...`);
      try {
        const generatedSoFar = filteredCards.map(c => c.word);
        const unifiedExclusions = [...excludeWords, ...generatedSoFar];
        const missingCount = count - filteredCards.length;

        const additionalRaw = await performGeneration(unifiedExclusions, Math.max(missingCount, 40));
        const cumulativeRaw = [...rawCards, ...additionalRaw];
        filteredCards = buildUniqueList(cumulativeRaw);
        console.log(`[Card Gen UI] Supplement complete. Total unique cards now: ${filteredCards.length}`);
      } catch (retryErr) {
        console.error("[Card Gen UI] Supplement generation failed, continuing with current pool:", retryErr);
      }
    }

    // Format cards with final unique IDs and guarantee exact structure
    const formattedCards = filteredCards.map((card: any, index: number) => ({
      id: `ai-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
      word: card.word.trim(),
      englishTranslit: card.englishTranslit.trim(),
      tabooWords: card.tabooWords.slice(0, 4),
      category: card.category,
      funHint: card.funHint.trim()
    }));

    return res.json({
      success: true,
      source: "gemini",
      requestedCount: count,
      generatedCount: rawCards.length,
      uniqueCount: formattedCards.length,
      cards: formattedCards,
      duplicatesRemoved: duplicatesRemovedCount
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
