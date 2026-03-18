const getOpenAIConfig = () => {
  const baseUrl = localStorage.getItem('openai_api_base_url') || 'https://api.openai.com/v1';
  const apiKey = localStorage.getItem('openai_api_key') || '';
  const model = localStorage.getItem('openai_model') || 'gpt-4o-mini';
  
  if (!apiKey) {
    throw new Error("API key is not configured. Please set it in Settings.");
  }
  
  return { baseUrl, apiKey, model };
};

async function callOpenAI(systemPrompt: string, userPrompt: string, expectJson: boolean = false) {
  const { baseUrl, apiKey, model } = getOpenAIConfig();
  
  const endpoint = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
  
  const body: any = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  if (expectJson) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function extractConcepts(text: string) {
  try {
    const systemPrompt = `You are a helpful reading assistant. Output JSON only. Format: { "concepts": [{ "term": "string", "definition": "string" }] }`;
    const userPrompt = `Extract up to 5 key concepts or terms from the following text. For each concept, provide a brief definition.\nText: ${text.substring(0, 5000)}`;
    const content = await callOpenAI(systemPrompt, userPrompt, true);
    const parsed = JSON.parse(content);
    return parsed.concepts || [];
  } catch (e) {
    console.error("Failed to extract concepts", e);
    return [];
  }
}

export async function expandConcept(term: string, context: string) {
  try {
    const systemPrompt = `You are a helpful reading assistant. Output JSON only. Format: { "related": [{ "relatedTerm": "string", "relationExplanation": "string" }] }`;
    const userPrompt = `Given the concept "${term}" in the context of "${context}", provide 3-5 related concepts that help build a complete knowledge system around it. Provide a brief explanation for how each relates.`;
    const content = await callOpenAI(systemPrompt, userPrompt, true);
    const parsed = JSON.parse(content);
    return parsed.related || [];
  } catch (e) {
    console.error("Failed to expand concept", e);
    return [];
  }
}

export async function generateKnowledgeMap(text: string) {
  try {
    const systemPrompt = `You are a helpful reading assistant. Output JSON only. Format: { "nodes": [{ "id": "string", "label": "string" }], "links": [{ "source": "string", "target": "string", "label": "string" }] }`;
    const userPrompt = `Create a knowledge map (nodes and links) representing the core concepts and their relationships in the following text.\nText: ${text.substring(0, 8000)}`;
    const content = await callOpenAI(systemPrompt, userPrompt, true);
    const parsed = JSON.parse(content);
    return parsed || { nodes: [], links: [] };
  } catch (e) {
    console.error("Failed to generate knowledge map", e);
    return { nodes: [], links: [] };
  }
}

export async function chatWithAI(query: string, context: string, history: any[]) {
  try {
    const systemPrompt = "You are an AI reading assistant. Help the user understand the book they are reading. Use the provided context to ground your answers.";
    const userPrompt = `Context from book: "${context}"\n\nUser query: ${query}`;
    return await callOpenAI(systemPrompt, userPrompt, false);
  } catch (e) {
    console.error("Chat failed", e);
    return "Sorry, I encountered an error while processing your request.";
  }
}

export async function generateNote(text: string, context: string) {
  try {
    const systemPrompt = "You are an AI reading assistant.";
    const userPrompt = `Analyze the following highlighted text within its context and generate a concise, insightful reading note or summary.\nHighlighted Text: "${text}"\nContext: "${context.substring(0, 3000)}"`;
    return await callOpenAI(systemPrompt, userPrompt, false);
  } catch (e) {
    console.error("Failed to generate note", e);
    return "";
  }
}
