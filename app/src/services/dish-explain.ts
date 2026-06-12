/**
 * AI Dish Explanation Service — 按需调用，带缓存
 *
 * 用户点击 ? 按钮时才调用，返回菜品由来、文化故事。
 * 同一菜品名缓存结果，避免重复请求。
 * AI 回复语言跟随当前 UI 语言（uiLang）。
 */

const isDev = import.meta.env.DEV;
const API_URL = isDev
  ? '/api/openai/v1/chat/completions'
  : '/api/menu-recognize';

// In-memory cache (same session only)
const explanationCache = new Map<string, string>();

/** Map language codes to full language names for the AI prompt */
const LANG_NAME_MAP: Record<string, string> = {
  en: 'English',        es: 'Spanish',        fr: 'French',
  de: 'German',         it: 'Italian',        pt: 'Portuguese',
  nl: 'Dutch',          ru: 'Russian',        zh: 'Chinese (Simplified)',
  ja: 'Japanese',       ko: 'Korean',         ar: 'Arabic',
  tr: 'Turkish',        pl: 'Polish',         sv: 'Swedish',
  da: 'Danish',         no: 'Norwegian',      fi: 'Finnish',
  el: 'Greek',          cs: 'Czech',          ro: 'Romanian',
  hu: 'Hungarian',      th: 'Thai',           vi: 'Vietnamese',
};

function buildSystemPrompt(langCode: string): string {
  const langName = LANG_NAME_MAP[langCode] || 'English';
  return `You are a culinary historian and food culture expert.
When given a dish name (and optional description), provide a concise but fascinating explanation covering:
1. **Origin** — where and when this dish was invented (country/region, era)
2. **Cultural story** — interesting history, legends, or cultural significance
3. **Key ingredients** — what makes it authentic
4. **Fun fact** — one surprising or delightful tidbit

CRITICAL: You MUST write your ENTIRE response in **${langName}**. This is the user's chosen language. Do not write in English unless the user's language is English.
- Keep total response under 300 words
- Write in a warm, engaging tone — like a knowledgeable friend telling you over dinner
- If the dish name is generic (e.g., "Fried Rice"), focus on its most famous regional variation
- Return plain text, no markdown formatting`;
}

function buildUserMessage(dish: { name: string; description?: string }, langCode: string): string {
  const langName = LANG_NAME_MAP[langCode] || 'English';
  // User prompt: instruct the AI what dish to explain
  // Use a neutral English instruction — the system prompt already enforces the output language
  return `Explain this dish in ${langName}:\n\n**${dish.name}**\n${dish.description ? `\nDescription: ${dish.description}` : ''}`;
}

interface ExplainState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  text: string | null;
  error: string | null;
}

export function useDishExplain(uiLang: string) {
  const [state, setState] = useState<ExplainState>({
    status: 'idle',
    text: null,
    error: null,
  });
  const [activeDishId, setActiveDishId] = useState<string | null>(null);

  const explainDish = useCallback(async (dish: { id: string; name: string; description?: string }) => {
    // Check cache first (cache key includes language!)
    const lang = uiLang || 'en';
    const cacheKey = `${lang}|${dish.name}|${dish.description || ''}`;
    const cached = explanationCache.get(cacheKey);
    if (cached) {
      setState({ status: 'ready', text: cached, error: null });
      setActiveDishId(dish.id);
      return;
    }

    // Start loading
    setState({ status: 'loading', text: null, error: null });
    setActiveDishId(dish.id);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const bodyObj: Record<string, any> = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildSystemPrompt(lang) },
          {
            role: 'user',
            content: [
              { type: 'text', text: buildUserMessage(dish, lang) },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
        provider: 'openai',
        task: 'explain',
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyObj),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${errText.slice(0, 100)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error('Empty response from AI');

      // Cache result
      explanationCache.set(cacheKey, content);
      setState({ status: 'ready', text: content, error: null });
    } catch (err: any) {
      const msg = err.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : err.message || 'Failed to get explanation';
      setState({ status: 'error', text: null, error: msg });
    }
  }, [uiLang]);

  const dismiss = useCallback(() => {
    setState({ status: 'idle', text: null, error: null });
    setActiveDishId(null);
  }, []);

  return {
    /** Current explanation state */
    ...state,
    /** ID of the currently active/being-explained dish */
    activeDishId,
    /** Trigger explanation for a dish */
    explainDish,
    /** Close the explanation popup */
    dismiss,
  };
}

import { useState, useCallback } from 'react';
