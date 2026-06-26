import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Parser from "rss-parser";
import * as dotenv from "dotenv";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

dotenv.config();

const app = express();
const PORT = 3000;
const parser = new Parser();

// AI Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODEL_CANDIDATES = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
];

// Helper to call Gemini with retries and model fallbacks
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
  apiKey?: string;
}) {
  let lastError: any = null;
  const key = params.apiKey || process.env.GEMINI_API_KEY || "";
  if (!key) {
    throw new Error("No Gemini API key provided. Please configure it in Settings.");
  }

  const customAi = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  
  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Calling Gemini API (model: ${model}, attempt: ${attempt})`);
        const response = await customAi.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        
        if (response && response.text) {
          console.log(`Success with model ${model}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt} for model ${model} failed:`, err.message || err);
        // Wait briefly before retrying
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }
  
  throw lastError || new Error("All model fallback attempts failed.");
}

// Helper to call OpenAI-compatible endpoints directly via standard fetch
async function callOpenAiCompatible(params: {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  systemInstruction?: string;
  userPrompt: string;
}): Promise<string> {
  const baseUrl = (params.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = params.model || "gpt-4o-mini";
  const url = `${baseUrl}/chat/completions`;

  console.log(`Calling OpenAI API: ${url} (model: ${model})`);

  const messages = [];
  if (params.systemInstruction) {
    messages.push({ role: "system", content: params.systemInstruction });
  }
  messages.push({ role: "user", content: params.userPrompt });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${params.apiKey}`
  };

  // Add custom headers if using OpenRouter
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://ai.studio/build";
    headers["X-Title"] = "Next Reader";
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No content returned from OpenAI compatible API.");
  }

  console.log(`Success with OpenAI model ${model}`);
  return text;
}

// Helper to call Anthropic API directly via standard fetch
async function callAnthropicAPI(params: {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  systemInstruction?: string;
  userPrompt: string;
}): Promise<string> {
  const baseUrl = (params.baseUrl || "https://api.anthropic.com").replace(/\/+$/, "");
  const model = params.model || "claude-3-5-sonnet-latest";
  const url = `${baseUrl}/v1/messages`;

  console.log(`Calling Anthropic API: ${url} (model: ${model})`);

  const body: any = {
    model,
    max_tokens: 4000,
    messages: [
      { role: "user", content: params.userPrompt }
    ]
  };

  if (params.systemInstruction) {
    body.system = params.systemInstruction;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error("No content returned from Anthropic API.");
  }

  console.log(`Success with Anthropic model ${model}`);
  return text;
}

function hasApiKey(req: any): boolean {
  const isAiEnabled = req.headers["x-enable-ai"] === "true";
  if (!isAiEnabled) return false;

  const aiProvider = req.headers["x-ai-provider"] as string | undefined;
  if (!aiProvider) return false;

  switch (aiProvider) {
    case "gemini":
      return !!req.headers["x-gemini-api-key"] || !!process.env.GEMINI_API_KEY;
    case "openai":
      return !!req.headers["x-openai-api-key"];
    case "anthropic":
      return !!req.headers["x-anthropic-api-key"];
    case "openrouter":
      return !!req.headers["x-openrouter-api-key"];
    case "zenmux":
      return !!req.headers["x-zenmux-api-key"];
    case "custom":
      return !!req.headers["x-custom-api-key"];
    default:
      return false;
  }
}

async function dispatchAI(req: any, systemInstruction: string, userPrompt: string): Promise<string> {
  const aiProvider = req.headers["x-ai-provider"] as string | undefined;

  const userGeminiApiKey = req.headers["x-gemini-api-key"] as string | undefined;

  const userOpenAiApiKey = req.headers["x-openai-api-key"] as string | undefined;
  const userOpenAiBaseUrl = req.headers["x-openai-base-url"] as string | undefined;
  const userOpenAiModel = req.headers["x-openai-model"] as string | undefined;

  const userAnthropicApiKey = req.headers["x-anthropic-api-key"] as string | undefined;
  const userAnthropicBaseUrl = req.headers["x-anthropic-base-url"] as string | undefined;
  const userAnthropicModel = req.headers["x-anthropic-model"] as string | undefined;

  const userOpenrouterApiKey = req.headers["x-openrouter-api-key"] as string | undefined;
  const userOpenrouterBaseUrl = req.headers["x-openrouter-base-url"] as string | undefined;
  const userOpenrouterModel = req.headers["x-openrouter-model"] as string | undefined;

  const userZenmuxApiKey = req.headers["x-zenmux-api-key"] as string | undefined;
  const userZenmuxBaseUrl = req.headers["x-zenmux-base-url"] as string | undefined;
  const userZenmuxModel = req.headers["x-zenmux-model"] as string | undefined;

  const userCustomApiKey = req.headers["x-custom-api-key"] as string | undefined;
  const userCustomBaseUrl = req.headers["x-custom-base-url"] as string | undefined;
  const userCustomModel = req.headers["x-custom-model"] as string | undefined;

  if (aiProvider === "openai") {
    if (!userOpenAiApiKey) throw new Error("Missing OpenAI API Key");
    return callOpenAiCompatible({
      apiKey: userOpenAiApiKey,
      baseUrl: userOpenAiBaseUrl,
      model: userOpenAiModel,
      systemInstruction,
      userPrompt
    });
  } else if (aiProvider === "anthropic") {
    if (!userAnthropicApiKey) throw new Error("Missing Anthropic API Key");
    return callAnthropicAPI({
      apiKey: userAnthropicApiKey,
      baseUrl: userAnthropicBaseUrl,
      model: userAnthropicModel,
      systemInstruction,
      userPrompt
    });
  } else if (aiProvider === "openrouter") {
    if (!userOpenrouterApiKey) throw new Error("Missing OpenRouter API Key");
    return callOpenAiCompatible({
      apiKey: userOpenrouterApiKey,
      baseUrl: userOpenrouterBaseUrl || "https://openrouter.ai/api/v1",
      model: userOpenrouterModel || "google/gemini-2.5-flash",
      systemInstruction,
      userPrompt
    });
  } else if (aiProvider === "zenmux") {
    if (!userZenmuxApiKey) throw new Error("Missing Zenmux API Key");
    return callOpenAiCompatible({
      apiKey: userZenmuxApiKey,
      baseUrl: userZenmuxBaseUrl || "https://zenmux.ai/api/v1",
      model: userZenmuxModel || "deepseek-chat",
      systemInstruction,
      userPrompt
    });
  } else if (aiProvider === "custom") {
    if (!userCustomApiKey) throw new Error("Missing Custom API Key");
    return callOpenAiCompatible({
      apiKey: userCustomApiKey,
      baseUrl: userCustomBaseUrl || "https://api.openai.com/v1",
      model: userCustomModel || "gpt-4o-mini",
      systemInstruction,
      userPrompt
    });
  } else {
    // Default to Gemini
    const response = await callGeminiWithFallback({
      apiKey: userGeminiApiKey,
      contents: userPrompt,
      config: {
        systemInstruction,
      }
    });
    return response.text || "";
  }
}

// Extract main article body using Mozilla Readability & JSDOM
function extractFullTextFallback(html: string, url?: string): string {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.content) {
      return article.content;
    }
  } catch (error) {
    console.error("Readability parsing failed, using simple regex fallback:", error);
  }

  let clean = html;
  
  // Strip non-content blocks
  clean = clean.replace(/<head[\s\S]*?<\/head>/gi, "");
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  clean = clean.replace(/<header[\s\S]*?<\/header>/gi, "");
  clean = clean.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  clean = clean.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  clean = clean.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  clean = clean.replace(/<form[\s\S]*?<\/form>/gi, "");
  clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  clean = clean.replace(/<!--[\s\S]*?-->/g, "");

  // Match all standard textual content blocks
  const regex = /<(p|h1|h2|h3|h4|h5|h6|li|pre|code)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  const blocks: string[] = [];

  while ((match = regex.exec(clean)) !== null) {
    const tagName = match[1].toLowerCase();
    let content = match[2].trim();
    
    // Strip nested tags except styling tags
    content = content.replace(/<(?!(\/?(strong|em|a|code|span|br|b|i)\b))[^>]+>/gi, "");
    
    if (content.length > 10) {
      blocks.push(`<${tagName} class="my-4 leading-relaxed text-foreground">${content}</${tagName}>`);
    }
  }

  if (blocks.length > 5) {
    return blocks.join("\n");
  }

  // If match failed, fallback to generic paragraph extraction
  let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : html;
  
  bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "");
  bodyContent = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, "");
  bodyContent = bodyContent.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  bodyContent = bodyContent.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  bodyContent = bodyContent.replace(/<[^>]+>/g, "\n");
  
  const paragraphs = bodyContent
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 25);
    
  if (paragraphs.length > 0) {
    return paragraphs.map(p => `<p class="my-4 leading-relaxed text-foreground">${p}</p>`).join("\n");
  }

  return "<p>Failed to extract full text. Please visit the source link directly using the button above.</p>";
}

// Fallback summary generator
function generateSummaryFallback(content: string, title: string): string {
  const cleanText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = cleanText.split(/[.!?。！？]\s*/).filter(s => s.length > 12);
  
  if (sentences.length === 0) {
    return `Summary for "${title}":\n• Full content is loaded below. Please read the original article text.`;
  }
  
  const keyPoints = sentences.slice(0, Math.min(4, sentences.length));
  return `**Summary for "${title}"** (Alternative Content-based Summary):\n\n` + 
    keyPoints.map(pt => `• ${pt}.`).join("\n") + 
    "\n\n*(Note: High demand on AI service; showing a structural content fallback summary.)*";
}

app.use(express.json());

// API Routes
app.get("/api/rss", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    console.log(`Fetching RSS feed via robust fetch: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/rss+xml,application/atom+xml",
        "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP fetch failed with status ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    res.json(feed);
  } catch (error: any) {
    console.warn("Robust RSS fetch/parse failed, trying fallback standard parseURL:", error);
    try {
      const feed = await parser.parseURL(url);
      res.json(feed);
    } catch (fallbackError: any) {
      console.error("All RSS parsing attempts failed:", fallbackError);
      res.status(500).json({ 
        error: `Failed to fetch and parse RSS feed. Ensure the URL is a valid RSS XML link. (${fallbackError.message || fallbackError})` 
      });
    }
  }
});

app.get("/api/rss/full-content", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  const isAiEnabled = req.headers["x-enable-ai"] === "true";

  let html = "";
  try {
    console.log(`Fetching full content for URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    html = await response.text();
  } catch (fetchError: any) {
    console.error("Fetch Page Error:", fetchError);
    return res.status(500).json({ error: `Failed to fetch page: ${fetchError.message}` });
  }

  // Bypass AI entirely if not enabled or no appropriate API key is provided
  if (!isAiEnabled || !hasApiKey(req)) {
    console.log("AI is disabled or API Key is missing. Directly performing local readability extraction...");
    const cleanHtml = extractFullTextFallback(html, url);
    return res.json({ content: cleanHtml, fallback: true });
  }

  try {
    // Trim to first 80k characters to prevent token overflow while keeping full body
    const trimmedHtml = html.slice(0, 80000);
    
    const systemInstruction = "You are an expert readability parser. Your goal is to extract the main, original, clean article content from raw HTML, preserving the complete text of the article in neat, well-formed HTML tags.";
    const userPrompt = `Please extract the main article content (paragraphs, headings, lists, code blocks, images if applicable) from this raw HTML of a web page.
Strip out all ads, cookie banners, header navigation links, footers, social media sharing widgets, sidebars, and other noise.
Provide ONLY the clean HTML article body (use standard tags like <p>, <h2>, <h3>, <ul>, <ol>, <li>, <pre>, <code>, <strong>, <em>, <img src="...">).
Do not include outer <html>, <head>, or <body> tags, only the main semantic article container.
IMPORTANT: Return ONLY the clean HTML. Do not wrap it in markdown code blocks like \`\`\`html.

HTML:
${trimmedHtml}`;

    let cleanHtml = await dispatchAI(req, systemInstruction, userPrompt);

    // Clean markdown wrapping if present
    if (cleanHtml.startsWith("```html")) {
      cleanHtml = cleanHtml.substring(7);
    } else if (cleanHtml.startsWith("```")) {
      cleanHtml = cleanHtml.substring(3);
    }
    if (cleanHtml.endsWith("```")) {
      cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
    }
    cleanHtml = cleanHtml.trim();

    res.json({ content: cleanHtml });
  } catch (error: any) {
    console.error("Full Content AI Extraction Error, falling back to local extractor:", error);
    // Use high-quality local parser fallback if AI fails!
    const cleanHtml = extractFullTextFallback(html, url);
    res.json({ content: cleanHtml, fallback: true });
  }
});

app.post("/api/ai/summarize", async (req, res) => {
  const { content, title } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const isAiEnabled = req.headers["x-enable-ai"] === "true";

  // Bypass AI entirely if not enabled or no appropriate API key is provided
  if (!isAiEnabled || !hasApiKey(req)) {
    console.log("AI is disabled or API Key is missing for summarization. Returning content fallback summary...");
    const fallbackSummary = generateSummaryFallback(content, title || "Untitled");
    return res.json({ summary: fallbackSummary });
  }

  try {
    const systemInstruction = "You are a professional research assistant. Provide a concise, insightful summary of the article. Use bullet points for key takeaways. If the content is very short, just provide a one-sentence summary.";
    const userPrompt = `Please summarize the following article titled "${title || 'Untitled'}":\n\n${content}`;

    const summaryText = await dispatchAI(req, systemInstruction, userPrompt);

    res.json({ summary: summaryText });
  } catch (error) {
    console.error("AI Summarize Error, using fallback:", error);
    const fallbackSummary = generateSummaryFallback(content, title || "Untitled");
    res.json({ summary: fallbackSummary });
  }
});

app.post("/api/ai/translate", async (req, res) => {
  const { content, targetLang = "Simplified Chinese" } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const isAiEnabled = req.headers["x-enable-ai"] === "true";

  // If AI is not enabled or credentials are missing, we return a message indicating setup needed.
  if (!isAiEnabled || !hasApiKey(req)) {
    return res.status(400).json({ 
      error: "Translation requires AI to be enabled. Please check your AI configuration in Settings." 
    });
  }

  try {
    // We only send a slice of the text if it's exceptionally long to prevent token issues,
    // but usually, full-content is cleaned up. We can support up to 60,000 characters.
    const sliceContent = content.slice(0, 60000);

    const userPrompt = `Please translate the following HTML content text into professional, natural-sounding ${targetLang}.
Strictly preserve all HTML tags, structure, classes, and attributes exactly as they are. Only translate the human-readable text contents.
Do not wrap your output in markdown code blocks like \`\`\`html. Return ONLY the translated HTML content itself.

HTML to translate:
${sliceContent}`;

    const systemInstruction = `You are a professional, high-fidelity translator specializing in technical and literary translation.
Your task is to translate any text within HTML elements to the target language, while keeping the HTML tags, attributes, and hierarchy completely intact.
Never return markdown code blocks, backticks, or explanatory notes. Return only the translated HTML.`;

    let translatedHtml = await dispatchAI(req, systemInstruction, userPrompt);

    // Clean markdown code blocks if the model ignored instructions
    if (translatedHtml.startsWith("```html")) {
      translatedHtml = translatedHtml.substring(7);
    } else if (translatedHtml.startsWith("```")) {
      translatedHtml = translatedHtml.substring(3);
    }
    if (translatedHtml.endsWith("```")) {
      translatedHtml = translatedHtml.substring(0, translatedHtml.length - 3);
    }
    translatedHtml = translatedHtml.trim();

    res.json({ content: translatedHtml });
  } catch (error: any) {
    console.error("AI Translation Error:", error);
    res.status(500).json({ error: `Translation failed: ${error.message || error}` });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
