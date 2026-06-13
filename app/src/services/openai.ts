/**
 * AI API 服务 — 菜单图片识别 & 翻译
 *
 * 支持多个 AI 提供商：
 *   - Mistral AI    (Pixtral Large — EU 原生，推荐)
 *   - Azure OpenAI  (GPT-4V/4o)
 *   - Moonshot       (向后兼容)
 *
 * 流程：
 * 1. 读取用户在 Settings 页面配置的提供商和 API Key
 * 2. 开发环境通过 Vite 代理转发（避免 CORS）
 * 3. 生产环境通过 Vercel Serverless Function 代理
 */

import type { Menu, Section, Dish } from '@/types';
import { loadAISettings, hasRecognitionKey, hasTranslationKey } from '@/types/ai-settings';

// ---- PDF.js import (lazy-loaded for bundle size) ----
let pdfjsLib: typeof import('pdfjs-dist') | null = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist');
    mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`;
    pdfjsLib = mod;
  }
  return pdfjsLib;
}

// ---- 环境判断 ----
const isDev = import.meta.env.DEV;
const API_URL = isDev ? '/api/openai/v1/chat/completions' : '/api/menu-recognize';

// ---- 类型 ----
interface RecognizedDish {
  name: string;
  description: string;
  price: number;
  allergens?: string[];
}

interface RecognizedSection {
  name: string;
  dishes: RecognizedDish[];
}

type ImageContent = {
  type: 'image_url';
  image_url: {
    url: string;
    detail: 'auto' | 'high';
  };
};

// ---- System Prompt ----
const SYSTEM_PROMPT = `You are a professional menu digitization assistant. 
Your task is to analyze images of restaurant menus and extract all menu items into structured JSON.

Rules:
1. Group dishes under their section headings (e.g., "Appetizers", "Main Courses", "Desserts", "Drinks").
2. For each dish, extract: name, description (if visible, otherwise empty string), and price (as a number, without currency symbol).
3. If a price range is shown (e.g., "$12-$18"), use the lower price.
4. If no price is visible, set price to 0.
5. If the image is unclear or not a menu, return an empty sections array.
6. Keep dish names and descriptions in their original language.
7. Return ONLY valid JSON, no markdown, no explanations.

Output format:
{
  "sections": [
    {
      "name": "Appetizers",
      "dishes": [
        { "name": "Caesar Salad", "description": "Romaine lettuce, croutons, parmesan", "price": 12.99 },
        { "name": "Soup of the Day", "description": "Made fresh daily", "price": 8.50 }
      ]
    }
  ]
}`;

const ALLERGEN_NAMES = [
  'Gluten',
  'Crustaceans',
  'Eggs',
  'Fish',
  'Peanuts',
  'Soybeans',
  'Milk',
  'Nuts',
  'Celery',
  'Mustard',
  'Sesame',
  'Sulfites',
  'Lupin',
  'Molluscs',
] as const;

const ALLERGEN_DETECTION_INSTRUCTIONS = `Also identify likely EU allergens for each dish from its name and visible description.
Use ONLY these exact allergen labels: ${ALLERGEN_NAMES.join(', ')}.
Add an "allergens" array to every dish. If none are reasonably indicated, use [].
This is advisory only: infer likely allergens from explicit ingredients and common dish terms, but do not invent cross-contamination warnings.

Output format when allergen detection is requested:
{
  "sections": [
    {
      "name": "Appetizers",
      "dishes": [
        { "name": "Caesar Salad", "description": "Romaine lettuce, croutons, parmesan", "price": 12.99, "allergens": ["Gluten", "Milk"] }
      ]
    }
  ]
}`;

function normalizeAllergens(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Map(ALLERGEN_NAMES.map((name) => [name.toLowerCase(), name]));
  const normalized = input
    .map((item) => String(item || '').trim().toLowerCase())
    .map((name) => allowed.get(name))
    .filter((name): name is typeof ALLERGEN_NAMES[number] => Boolean(name));
  return Array.from(new Set(normalized));
}

// ---- 工具函数 ----

function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert a PDF file to an array of base64 JPEG images (one per page).
 * Renders each page at 1.5x scale for good OCR quality.
 */
async function convertPdfToImages(
  file: File,
  onProgress?: (message: string) => void
): Promise<string[]> {
  const pdfjs = await getPdfJs();
  onProgress?.(`Loading PDF (${file.name})...`);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  if (numPages === 0) throw new Error('PDF has no pages');

  // Limit to first 10 pages to avoid huge requests
  const pagesToRender = Math.min(numPages, 10);
  if (numPages > 10) {
    console.warn(`[pdf] PDF has ${numPages} pages, rendering first ${pagesToRender}`);
  }

  const images: string[] = [];
  for (let i = 1; i <= pagesToRender; i++) {
    onProgress?.(`Rendering page ${i}/${pagesToRender}...`);
    const page = await pdf.getPage(i);
    const scale = 1.5; // Good quality for AI recognition
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // White background (some PDFs render transparent)
    const jpegData = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    images.push(jpegData);
  }

  onProgress?.(`PDF 渲染完成：${images.length} 页`);
  URL.revokeObjectURL(URL.createObjectURL(file));
  return images;
}

/**
 * Attempt to repair truncated JSON from OpenAI (when response hits max_tokens limit).
 * Strategy: find the last complete object/array and close all open brackets.
 */
function tryRepairTruncatedJson(jsonStr: string): string {
  let s = jsonStr.trimEnd();

  // Remove trailing incomplete values (strings, numbers, etc.)
  // Try stripping back to last known good structure
  const patterns = [
    /,\s*"[^"]*"\s*:\s*[^}]*$/,    // trailing key-value pair
    /,\s*\{[^}]*$/,                  // trailing incomplete object in array
    /,\s*[^,}\]]*$/,                 // trailing incomplete value
  ];
  for (const p of patterns) {
    if (!isValidJson(s)) {
      s = s.replace(p, '');
    }
  }

  // Count brackets and close them
  let stack: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}') {
      if (stack[stack.length - 1] === '{') stack.pop();
    } else if (ch === ']') {
      if (stack[stack.length - 1] === '[') stack.pop();
    }
  }

  // Close remaining brackets
  while (stack.length > 0) {
    const open = stack.pop()!;
    s += open === '{' ? '}' : ']';
  }

  // Final validation
  try {
    JSON.parse(s);
    console.log('[openai] JSON repair succeeded');
    return s;
  } catch {
    throw new Error('AI response was truncated. The menu may be too large — try uploading fewer pages or a simpler menu.');
  }
}

function isValidJson(s: string): boolean {
  try { JSON.parse(s); return true; } catch { return false; }
}

// ---- 获取当前配置 ----
function getProviderConfig() {
  const settings = loadAISettings();

  // 旧的 Moonshot 兼容（.env 配置）
  const legacyApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const legacyModel = import.meta.env.VITE_OPENAI_MODEL || '';

  return {
    recognitionProvider: settings.recognitionProvider,
    translationProvider: settings.translationProvider,
    mistralApiKey: settings.mistral.apiKey || legacyApiKey,
    mistralRecognitionModel: settings.mistral.recognitionModel || 'pixtral-large-latest',
    mistralTranslationModel: settings.mistral.translationModel || 'mistral-large-latest',
    azureApiKey: settings.azure.apiKey,
    azureEndpoint: settings.azure.endpoint,
    azureRecognitionDeployment: settings.azure.recognitionDeployment || 'gpt-4o',
    azureTranslationDeployment: settings.azure.translationDeployment || 'gpt-4o',
    azureApiVersion: settings.azure.apiVersion || '2024-10-21',
    deeplApiKey: settings.deepl.apiKey,
    deeplType: settings.deepl.type || 'free',
    openaiApiKey: settings.openai.apiKey,
    openaiRecognitionModel: settings.openai.recognitionModel || 'gpt-4o',
    openaiTranslationModel: settings.openai.translationModel || 'gpt-4o-mini',
    // 向后兼容
    hasAnyKey: hasRecognitionKey(settings) || hasTranslationKey(settings) || Boolean(legacyApiKey && !legacyApiKey.startsWith('填写你的')),
  };
}

// ---- 核心 API 调用 ----
export async function recognizeMenuFromImages(
  files: File[],
  onProgress?: (message: string) => void,
  options: { detectAllergens?: boolean } = {}
): Promise<{ sections: RecognizedSection[] } | null> {
  const config = getProviderConfig();

  if (!config.hasAnyKey) {
    console.warn('No AI provider configured. Please set API keys in Settings.');
    return null;
  }

  const imageFiles = files.filter((f) => f.type && f.type.startsWith('image/'));
  const pdfFiles = files.filter((f) => f.type === 'application/pdf');

  if (imageFiles.length === 0 && pdfFiles.length === 0) {
    console.warn('No image or PDF files found for recognition');
    return null;
  }

  onProgress?.('Preparing images...');

  // Process regular images
  const imageContents: ImageContent[] = await Promise.all(
    imageFiles.map(async (file) => {
      const base64 = await compressImage(file);
      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:image/jpeg;base64,${base64}`,
          detail: 'auto',
        },
      };
    })
  );

  // Convert PDF pages to images
  if (pdfFiles.length > 0) {
    for (const pdf of pdfFiles) {
      onProgress?.(`Converting ${pdf.name}...`);
      try {
        const pdfImages = await convertPdfToImages(pdf, onProgress);
        for (const base64 of pdfImages) {
          imageContents.push({
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
              detail: 'high',
            },
          });
        }
      } catch (err) {
        console.error(`Failed to process PDF ${pdf.name}:`, err);
        throw new Error(`PDF processing failed for ${pdf.name}: ${(err as Error).message}`);
      }
    }
  }

  if (imageContents.length === 0) {
    throw new Error('No valid content extracted from uploaded files');
  }

  onProgress?.(options.detectAllergens ? 'AI recognizing menu and likely allergens...' : 'AI recognizing menu...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2min for PDF-heavy requests

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Dev mode: forward API key for Vite proxy
    if (isDev) {
      const settings = loadAISettings();
      if (settings.recognitionProvider === 'mistral' && settings.mistral.apiKey) {
        headers['Authorization'] = `Bearer ${settings.mistral.apiKey}`;
      } else if (settings.recognitionProvider === 'azure' && settings.azure.apiKey) {
        headers['api-key'] = settings.azure.apiKey;
      } else if (settings.recognitionProvider === 'openai' && settings.openai.apiKey) {
        headers['Authorization'] = `Bearer ${settings.openai.apiKey}`;
      } else {
        const legacyKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        if (legacyKey && !legacyKey.startsWith('填写你的')) {
          headers['Authorization'] = `Bearer ${legacyKey}`;
        }
      }
    }

    // Build request body
    const bodyObj: Record<string, any> = {
      model: getRecognitionModel(),
      messages: [
        { role: 'system', content: options.detectAllergens ? `${SYSTEM_PROMPT}\n\n${ALLERGEN_DETECTION_INSTRUCTIONS}` : SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: options.detectAllergens
                ? 'Please extract all menu items from these menu images and return structured JSON. Include likely allergens for each dish using only the allowed allergen labels.'
                : 'Please extract all menu items from these menu images and return structured JSON.',
            },
          ],
        },
      ],
      max_tokens: 16384, // Higher limit for multi-page PDFs / large menus
      temperature: 0.1,
    };

    // Add provider info for serverless function routing
    const settings = loadAISettings();
    if (!isDev) {
      bodyObj.provider = settings.recognitionProvider;
      bodyObj.task = 'recognize';
      // No apiKey needed — server reads from KV / env vars
    } else {
      // Dev mode: route to correct provider via vite proxy
      bodyObj.provider = settings.recognitionProvider;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[openai] API error (${response.status}):`, errorBody);
      try {
        const errJson = JSON.parse(errorBody);
        throw new Error(`[${errJson.provider || 'server'}] ${response.status}: ${errJson.detail || errJson.error || response.statusText}`);
      } catch {
        throw new Error(`API request failed: ${response.status} — ${errorBody.substring(0, 200)}`);
      }
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('API returned empty content');
    }

    onProgress?.('Parsing menu structure...');

    // Strip markdown code fences if present (e.g. ```json ... ```)
    let cleanedContent = content
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/, '')
      .trim();

    // Try normal parse first
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseErr) {
      // JSON is likely truncated (OpenAI hit max_tokens). Try to repair.
      console.warn('[openai] JSON parse failed, attempting repair...', (parseErr as Error).message);
      const repaired = tryRepairTruncatedJson(cleanedContent);
      parsed = JSON.parse(repaired);
    }

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('API response format invalid, missing sections');
    }

    onProgress?.(`Done! ${parsed.sections.length} sections found`);

    clearTimeout(timeoutId);
    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Recognition timed out. The file may be too large or complex. Try with a smaller file.');
    }
    console.error('Menu recognition failed:', error);
    throw error;
  }
}

// ---- 翻译 API ----
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const settings = loadAISettings();
  const config = getProviderConfig();

  if (!hasTranslationKey(settings)) {
    throw new Error('Translation provider not configured. Please set API keys in Settings.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const bodyObj: Record<string, any> = {
      task: 'translate',
      provider: settings.translationProvider,
      text,
      sourceLang,
      targetLang,
    };

    if (!isDev) {
      bodyObj.provider = settings.translationProvider;
      // No apiKey needed — server reads from KV / env vars
    }

    const response = await fetch(isDev ? '/api/openai/v1/chat/completions' : '/api/menu-recognize', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Translation failed: ${response.status} — ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    clearTimeout(timeoutId);
    return data.translation || data.choices?.[0]?.message?.content || text;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ---- 模型名称解析 ----
function getRecognitionModel(): string {
  const settings = loadAISettings();
  if (settings.recognitionProvider === 'mistral') {
    return settings.mistral.recognitionModel || 'pixtral-large-latest';
  }
  if (settings.recognitionProvider === 'azure') {
    return settings.azure.recognitionDeployment || 'gpt-4o';
  }
  if (settings.recognitionProvider === 'openai') {
    return settings.openai.recognitionModel || 'gpt-4o';
  }
  // 向后兼容
  return import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
}

// ---- 将识别结果转换为 Menu 数据结构 ----
export function convertToMenu(
  recognized: { sections: RecognizedSection[] },
  files: File[],
  restaurantName?: string
): Menu {
  const now = new Date().toISOString();
  const menuTitle = restaurantName || `Menu (${files.length} file${files.length > 1 ? 's' : ''})`;

  return {
    id: Date.now().toString(),
    title: menuTitle,
    sections: recognized.sections.map((sec, secIdx) => ({
      id: `s-${Date.now()}-${secIdx}`,
      name: sec.name,
      translations: {}, // AI translations will be populated by TranslationPage
      dishes: sec.dishes.map(
        (d: RecognizedDish, dishIdx: number): Dish => ({
          id: `d-${Date.now()}-${secIdx}-${dishIdx}`,
          name: d.name,
          description: d.description || '',
          price: d.price || 0,
          isVisible: true,
          allergens: normalizeAllergens(d.allergens),
          dietaryTags: [],
          isBestSeller: false,
          translations: {}, // AI translations will be populated by TranslationPage
        })
      ),
      isExpanded: true,
    })),
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  };
}

// ---- 检查 API Key 是否已配置 ----
export function isApiKeyConfigured(): boolean {
  const config = getProviderConfig();
  return config.hasAnyKey;
}
