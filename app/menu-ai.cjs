#!/usr/bin/env node

/**
 * 🍽️  菜单识别 - 独立命令行工具
 *
 * 用法:
 *   node menu-ai.js --key sk-xxx --image menu1.jpg --image menu2.png
 * 或:
 *   node menu-ai.js -k sk-xxx -i menu.jpg
 *
 * 结果直接输出 JSON 到终端
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ==================== 参数解析 ====================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { key: '', images: [], model: 'gpt-4o-mini' };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--key' || args[i] === '-k') && args[i + 1]) {
      config.key = args[++i];
    } else if ((args[i] === '--image' || args[i] === '-i') && args[i + 1]) {
      config.images.push(args[++i]);
    } else if ((args[i] === '--model' || args[i] === '-m') && args[i + 1]) {
      config.model = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
${BOLD}🍽️  Menu AI - 菜单图片识别工具${RESET}

用法:
  node menu-ai.cjs -k <API_KEY> -i <图片路径> [-i <图片2> ...] [-m <模型>]

参数:
  -k, --key      OpenAI API Key (必填)
  -i, --image    菜单图片路径 (必填，支持多图)
  -m, --model    模型名称 (可选，默认 gpt-4o-mini)
  --json         同时输出原始 JSON
  -h, --help     显示帮助

示例:
  node menu-ai.cjs -k sk-xxxx -i ./menu.jpg
  node menu-ai.cjs -k sk-xxxx -i page1.jpg -i page2.png -m gpt-4o

输出: 结构化 JSON (分类 + 菜品 + 价格)

  {
    "sections": [
      {
        "name": "前菜",
        "dishes": [
          { "name": "凯撒沙拉", "description": "罗马生菜", "price": 12.99 }
        ]
      }
    ]
  }
`);
}

// ==================== 核心逻辑 ====================

function fileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
  const mime = mimeMap[ext] || 'image/png';
  return { base64: buffer.toString('base64'), mime };
}

async function recognizeMenu(apiKey, imagePaths, model) {
  console.log(`${YELLOW}📷 处理 ${imagePaths.length} 张图片...${RESET}`);

  const imageContents = imagePaths.map((fp) => {
    const { base64, mime } = fileToBase64(fp);
    console.log(`   ✅ ${path.basename(fp)} (${(fs.statSync(fp).size / 1024).toFixed(1)}KB)`);
    return {
      type: 'image_url',
      image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' },
    };
  });

  console.log(`\n${YELLOW}🤖 调用 ${model} API...${RESET}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional menu digitization assistant. Analyze the menu image and extract ALL dishes into JSON.
Rules:
- Group dishes under their section headings (Appetizers, Mains, etc.)
- For each dish: name, description (or ""), price (number, no symbol)
- Price range → use lower price. No price → 0.
- Keep original language. Only output valid JSON.`,
        },
        {
          role: 'user',
          content: [
            ...imageContents,
            { type: 'text', text: 'Extract all menu items from these images. Return ONLY valid JSON with sections array.' },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 错误 ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('API 返回为空');

  const parsed = JSON.parse(content);
  return parsed;
}

// ==================== 主流程 ====================

async function main() {
  const config = parseArgs();

  // 验证参数
  if (!config.key) {
    console.log(`${RED}❌ 缺少 API Key，请用 -k 参数传入${RESET}`);
    console.log('   示例: node menu-ai.js -k sk-xxx -i menu.jpg');
    console.log('   帮助: node menu-ai.js --help');
    process.exit(1);
  }

  if (config.images.length === 0) {
    console.log(`${RED}❌ 缺少图片路径，请用 -i 参数传入${RESET}`);
    console.log('   示例: node menu-ai.js -k sk-xxx -i ./menu.jpg');
    process.exit(1);
  }

  // 检查文件存在
  for (const fp of config.images) {
    if (!fs.existsSync(fp)) {
      console.log(`${RED}❌ 文件不存在: ${fp}${RESET}`);
      process.exit(1);
    }
  }

  try {
    const result = await recognizeMenu(config.key, config.images, config.model);

    const totalDishes = result.sections?.reduce((sum, s) => sum + (s.dishes?.length || 0), 0) || 0;

    console.log(`\n${GREEN}${BOLD}✅ 识别完成！${RESET}`);
    console.log(`   分类: ${result.sections?.length || 0} | 菜品: ${totalDishes}`);
    console.log(`   Token: ${result.usage ? `${result.usage.total_tokens} (提示${result.usage.prompt_tokens} + 输出${result.usage.completion_tokens})` : 'N/A'}`);

    // 输出识别结果
    console.log(`\n${BOLD}══════════════════════════════════${RESET}`);
    console.log(`${BOLD}📋 菜单识别结果${RESET}`);
    console.log(`${BOLD}══════════════════════════════════${RESET}\n`);

    for (const section of result.sections || []) {
      console.log(`${BOLD}▸ ${section.name}${RESET}`);
      for (const dish of section.dishes || []) {
        const price = dish.price ? `$${Number(dish.price).toFixed(2)}` : '-';
        console.log(`  • ${dish.name} — ${price}`);
        if (dish.description) {
          console.log(`    ${dish.description}`);
        }
      }
      console.log();
    }

    // 同时输出原始 JSON（可重定向到文件）
    if (process.argv.includes('--json')) {
      console.log(`${BOLD}═══ 原始 JSON ═══${RESET}`);
      console.log(JSON.stringify({ sections: result.sections }, null, 2));
    }

  } catch (err) {
    console.log(`\n${RED}❌ 识别失败: ${err.message}${RESET}`);
    process.exit(1);
  }
}

main();
