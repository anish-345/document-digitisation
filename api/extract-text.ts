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

    const prompt = `You are an elite AI Document Digitization Engine. Your task is to transcribe the attached document(s) into an incredibly clean, perfectly structured Markdown format. 

CRITICAL EXTRACTION RULES:
1. PRESERVE INTENT: Read the document (whether it's a messy handwritten letter, a formal contract, or a receipt) and understand its structure.
2. FLAWLESS FORMATTING: Use Markdown extensively.
   - Use # headers for main titles and ## for sections.
   - Use **bold text** for important keys, names, or totals (e.g., **Total Amount:** $500).
   - Use bulleted lists (-) for items, tasks, or distinct points.
   - Separate distinct ideas into clean, readable paragraphs.
3. CONVERT CHAOS TO CLARITY: If the document is a mess of handwritten notes or scattered text, intelligently group related information together so it reads like a professionally typed summary.
4. ABSOLUTE ACCURACY: Do not hallucinate words. If a handwritten word is completely illegible, write [illegible]. Preserve all numbers, dates, and names exactly as written.
5. NO FLUFF: Output ONLY the requested markdown text. Do not start with "Here is the transcription..." or "Sure, I can help."

Provide the beautifully digitized text below:`;

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
      "gemini-2.0-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-3-pro-preview"
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

    const candidate = responseData.candidates?.[0];
    if (!candidate || !candidate.content) {
      console.error("Gemini API returned no content:", JSON.stringify(responseData, null, 2));
      throw new Error(
        responseData.promptFeedback?.blockReason 
          ? `Blocked by safety filters: ${responseData.promptFeedback.blockReason}`
          : "The AI model returned an empty response. Please try again."
      );
    }

    const outputText = candidate.content.parts?.[0]?.text ?? '';
    
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
