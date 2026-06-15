import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload limits for document base64 loading
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Lazy initializer for Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing in Secrets configuration.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// REST API Endpoints

// 1. Health & Dependency check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    environment: process.env.NODE_ENV || "development"
  });
});

// 2. Multi-modal plaintext extractor
app.post("/api/extract-text", async (req, res) => {
  try {
    const { base64Data, mimeType, fileName } = req.body;
    if (!base64Data || !mimeType) {
      res.status(400).json({ error: "Missing base64Data or mimeType" });
      return;
    }

    const ai = getGemini();

    const filePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    };

    const textPart = {
      text: `Extract the exact raw text from this document ("${fileName || 'document'}"). Preserve paragraphs and headers. Extract only the text, do not describe the document or append conversational intro/outro text. If the document is an image, perform OCR perfectly. Please keep text exactly as structured.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [filePart, textPart] }
    });

    const parsedText = response.text || "";
    res.json({ text: parsedText });
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract text from file." });
  }
});

// 3. Word Contextual analyzer
app.post("/api/analyze-word", async (req, res) => {
  try {
    const { word, sentence, fullText } = req.body;
    if (!word) {
      res.status(400).json({ error: "Missing required word parameter." });
      return;
    }

    const ai = getGemini();
    
    const prompt = `You are a professional linguistic editor and thesaurus engine.
Analyze the target word "${word.trim()}" in the context of this sentence: "${sentence ? sentence.trim() : ''}"
The entire text (for overall theme and frequency contextualization) is:
"${fullText ? fullText.trim() : ''}"

Provide detailed grammar analysis, part of speech, root dictionary form (lemma), tenses/variations, and highly customized context-aware suggestions where the replacement word can replace "${word}" directly in the phrase without losing the syntax or meaning.
Only provide synonyms that fit perfectly as a drop-in replacement.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pos: { 
              type: Type.STRING, 
              description: "The syntactic category / Part of Speech of the word (e.g. Noun, Verb, Adjective, Adverb, Conjunction)" 
            },
            tense: { 
              type: Type.STRING, 
              description: "Specific grammatical subcategory, voice, aspect or tense classification (e.g. Past Continuous Verb, Countable Plural Noun, Present Participle)" 
            },
            baseForm: { 
              type: Type.STRING, 
              description: "The absolute dictionary base form or lemma of the word (e.g., base of 'went' is 'go'; base of 'better' is 'good')" 
            },
            synonyms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "High-quality, vocabulary-enriching synonyms (exactly 5 to 8) that are immediate drop-in replacements in this context"
            },
            nuanceExplanation: { 
              type: Type.STRING, 
              description: "A short, sleek paragraph explaining the word's precise shade of meaning here, or specifying key styling differences between suggestions" 
            },
            usageFrequencyAdvice: {
              type: Type.STRING,
              description: "A witty, practical editorial insight regarding this word's frequency and alternate usage"
            }
          },
          required: ["pos", "tense", "baseForm", "synonyms", "nuanceExplanation", "usageFrequencyAdvice"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Word analysis error:", error);
    res.status(500).json({ error: error.message || "Failure in Gemini contextual search compilation." });
  }
});

// Configure Vite integration inside main routing pipeline
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite developer middleware for live HMR routing (Port 3000)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log(`Serving static production build from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ThesaurUs Node express server listening at http://localhost:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Dynamic express booster fails on initialization:", err);
});
