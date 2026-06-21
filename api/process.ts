import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Use JSON body parser with increased size limit — no multer needed
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

interface FilePayload {
  data: string;     // base64 encoded file content
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

      const prompt = `You are a world-class Document Data Extraction Engine. Analyze the attached document(s), which may be formal PDFs, images, receipts, or messy handwritten notes.
      
      TASK:
      1. EXACT TABULAR EXTRACTION: If a table exists, extract all rows, columns, and line items with 100% precision.
      2. UNSTRUCTURED TO STRUCTURED: If the document is unstructured or handwritten (e.g., a letter, medical notes, or invoice), identify the core entities (Names, Dates, Values, Subjects, Diagnoses, Totals, etc.) and FORCE them into a clean tabular structure (e.g., "Property" and "Value" columns).
      3. MULTI-PAGE SYNTHESIS: Seamlessly merge data across multiple pages into one unified dataset.
      4. HANDWRITING: Use expert-level OCR to decipher cursive and poor handwriting.
      5. FALLBACK: Never throw an error. If the document is nearly blank, output columns like "Field" and "Content" with whatever data you can find.
      
      Output JSON strictly following the requested schema.`;

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
      
      // List of every possible model string to try until one succeeds
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
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    columns: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                    },
                    rows: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                      },
                    },
                  },
                  required: ["columns", "rows"],
                }
              }
            })
          });

          const json = await response.json();
          
          if (response.ok) {
            responseData = json;
            break; // Success! Break out of the loop.
          } else {
            // Save the error but try the next model
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

      let outputText = responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"columns":[], "rows":[]}';
      
      // Strip markdown code blocks if the model wrapped the JSON
      outputText = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const extraction = JSON.parse(outputText);
      
      // Sanity check to prevent blank rows
      if (extraction.rows && Array.isArray(extraction.rows)) {
         extraction.rows = extraction.rows.filter((row: any) => Object.keys(row).length > 0);
      }

      res.json(extraction);
    } catch (error: any) {
    console.error("Extraction error:", error);
    const status = error?.status || error?.code || 500;
    let message = error.message || "Failed to process document";
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
