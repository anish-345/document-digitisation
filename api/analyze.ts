import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const config = {
  api: {
    bodyParser: true,
    responseLimit: "10mb",
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    const analysisPrompt = `You are a senior business analyst. Analyze this extracted tabular data.
    Provide:
    1. A concise professional executive summary (2-3 sentences).
    2. 3-4 key business metrics (label and value, and optional trend description).
    3. Up to 6 categorized data points for a chart (name and numeric value).
    Data: ${JSON.stringify(data)}`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: analysisPrompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  trend: { type: Type.STRING },
                },
                required: ["label", "value"],
              },
            },
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                },
                required: ["name", "value"],
              },
            },
          },
          required: ["summary", "metrics", "chartData"],
        },
      },
    });

    const outputText = response.text ?? "{}";
    res.json(JSON.parse(outputText));
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze data" });
  }
}
