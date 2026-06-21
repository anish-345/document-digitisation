// No import needed for native fetch

export default async function handler(req: any, res: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "No API key found in environment" });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    // Extract only the models that support generateContent
    const generateModels = data.models?.filter((m: any) => 
      m.supportedGenerationMethods?.includes('generateContent')
    ).map((m: any) => m.name);

    res.json({
      all_models_raw: data,
      generate_content_models: generateModels || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
