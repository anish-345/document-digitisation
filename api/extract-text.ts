import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

interface FilePayload {
  data: string;
  mimeType: string;
  name: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const files = (req.body.files || []) as any[];

    if (files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const prompt = `You are a world-class Document Intelligence Expert. Analyze the following document(s), which may be typed formal documents, chaotic notes, or messy handwritten letters. Extract all the text into a clean, well-structured, and highly readable format.

CRITICAL INSTRUCTIONS:
1. PARAGRAPHS & POINTS: Organize the extracted information logically into clear paragraphs and bullet points. Do not output a giant wall of unreadable text.
2. HANDWRITING: Use advanced OCR to accurately transcribe cursive, messy, or faded handwriting. If a word is genuinely illegible, use context to deduce it.
3. STRUCTURE: If the document has headers, sections, or clear categories, use markdown headers (e.g., ## Header) to separate them beautifully.
4. INTEGRITY: Preserve all important names, numbers, dates, and context. Do not summarize or delete important details; just organize them cleanly.
5. NO HALLUCINATIONS: Do not add conversational intro/outro text (e.g. no "Here is your text").
6. If the document is blank, output nothing.
7. Output ONLY the beautifully structured markdown text.`;

    const parts = [
      { text: prompt },
      ...files.map((file) => ({
        inline_data: {
          data: file.data,
          mime_type: file.mimeType,
        },
      }))
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-001",
      "gemini-1.5-pro",
      "gemini-1.5-pro-002",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-pro"
    ];

    let lastError = null;
    let responseData = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
          })
        });

        const json = await response.json();
        
        if (response.ok) {
          responseData = json;
          break;
        } else {
          lastError = json.error || new Error(`Failed with model ${model}`);
          console.log(`Model ${model} failed, trying next...`);
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!responseData) {
      throw lastError || new Error("All fallback models failed.");
    }

    const outputText = responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    
    res.json({
      text: outputText.trim(),
      wordCount: outputText.split(/\s+/).filter((w: string) => w.length > 0).length,
      charCount: outputText.length
    });
  } catch (error: any) {
    console.error("Text extraction error:", error);
    const status = error?.status || error?.code || 500;
    let message = error.message || "Failed to extract text";
    if (status === 429 || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      message = `Gemini API quota exceeded. (Raw error: ${error.message})`;
    } else if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      message = `Invalid Gemini API key. (Raw error: ${error.message})`;
    } else {
      message = `${message} (Status: ${status})`;
    }
    res.status(typeof status === "number" ? status : 500).json({ error: message });
  }
}
