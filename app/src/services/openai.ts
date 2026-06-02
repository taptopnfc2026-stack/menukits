/**
 * OpenAI API 服务 - 菜单图片识别
 *
 * 流程：
 * 1. 将用户上传的图片转为 base64
 * 2. 调用 GPT-4o Vision API 分析菜单图片
 * 3. 将返回的 JSON 解析为 Menu 数据结构
 */

import type { Menu, Section, Dish } from '@/types';

// ---- 配置 ----
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
// 通过 Vite 代理转发，避免浏览器 CORS 限制
const API_URL = '/api/openai/v1/chat/completions';

// ---- 类型 ----
interface RecognizedDish {
  name: string;
  description: string;
  price: number;
}

interface RecognizedSection {
  name: string;
  dishes: RecognizedDish[];
}

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

// ---- 工具函数 ----

/**
 * 压缩图片：缩小尺寸并降低质量，大幅减少 base64 大小
 * 目标：宽度不超过 1024px，质量 0.8，可减少 60-80% 体积
 */
function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算缩放后的尺寸
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

      // 导出为 JPEG（比 PNG 小得多）
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉 data:image/xxx;base64, 前缀，只保留 base64 内容
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeType(file: File): string {
  if (file.type === 'application/pdf') return 'application/pdf';
  if (file.type && file.type.startsWith('image/')) return file.type;
  // 根据文件扩展名推断 MIME 类型
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    gif: 'image/gif',
  };
  return mimeMap[ext || ''] || 'image/png'; // 默认 fallback 为 png
}

// ---- 核心 API 调用 ----
export async function recognizeMenuFromImages(
  files: File[],
  onProgress?: (message: string) => void
): Promise<{ sections: RecognizedSection[] } | null> {
  if (!API_KEY || API_KEY.startsWith('填写你的')) {
    console.warn('API Key not configured. Please set VITE_OPENAI_API_KEY in .env');
    return null;
  }

  // 筛选出图片文件（PDF 暂时跳过，后续可扩展）
  const imageFiles = files.filter((f) => f.type && f.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    console.warn('No image files found for recognition');
    return null;
  }

  onProgress?.('正在上传图片...');

  // 将图片转为 base64（带压缩，减少 60-80% 体积）
  const imageContents = await Promise.all(
    imageFiles.map(async (file) => {
      const base64 = await compressImage(file);
      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:image/jpeg;base64,${base64}`,
          detail: 'auto' as const,
          // ⚡ key optimization: "auto" 让模型自动选择分辨率
          //    "high" = 固定最高分辨率 → 最慢（原值）
          //    "low" = 固定低分辨率 → 最快但可能丢细节
          //    "auto" = 智能选择 → 平衡速度与精度 ✅
        },
      };
    })
  );

  onProgress?.('AI 正在识别菜单...');

  // 设置请求超时（30秒）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              ...imageContents,
              { type: 'text', text: 'Please extract all menu items from these menu images and return structured JSON.' },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1, // 低温度保证输出一致性
        response_format: { type: 'json_object' }, // ⚡ 强制JSON格式输出，减少token浪费
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenAI API 错误 (${response.status}):`, errorBody);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('API 返回内容为空');
    }

    onProgress?.('正在解析菜单结构...');

    // 解析 JSON 响应
    const parsed = JSON.parse(content);

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('API 返回格式不正确，缺少 sections 字段');
    }

    onProgress?.(`识别完成！共 ${parsed.sections.length} 个分类`);

    clearTimeout(timeoutId);
    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('识别超时（30秒），请检查网络连接后重试');
    }
    console.error('菜单识别失败:', error);
    throw error;
  }
}

// ---- 将识别结果转换为 Menu 数据结构 ----
export function convertToMenu(
  recognized: { sections: RecognizedSection[] },
  files: File[],
  restaurantName?: string
): Menu {
  const now = new Date().toISOString();
  const menuTitle = restaurantName || `菜单 (${files.length} 个文件)`;

  return {
    id: Date.now().toString(),
    title: menuTitle,
    sections: recognized.sections.map((sec, secIdx) => ({
      id: `s-${Date.now()}-${secIdx}`,
      name: sec.name,
      dishes: sec.dishes.map(
        (d: RecognizedDish, dishIdx: number): Dish => ({
          id: `d-${Date.now()}-${secIdx}-${dishIdx}`,
          name: d.name,
          description: d.description || '',
          price: d.price || 0,
          isVisible: true,
          allergens: [],
          dietaryTags: [],
          isBestSeller: false,
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
  return API_KEY !== '' && !API_KEY.startsWith('填写你的');
}
