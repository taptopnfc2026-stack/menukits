#!/usr/bin/env node

/**
 * 🍽️  menukits - 一键启动脚本
 *
 * 用法:  node start.js
 * 粘贴你的 OpenAI API Key，自动配置并启动服务
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const APP_DIR = __dirname;
const ENV_FILE = path.join(APP_DIR, '.env');
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function print(text) { process.stdout.write(text); }
function println(text = '') { console.log(text); }

// ==================== 主流程 ====================

async function main() {
  console.clear();

  println(`${BLUE}${BOLD}`);
  println('╔══════════════════════════════════════════╗');
  println('║         🍽️  menukits Launcher          ║');
  println('║      AI 菜单识别 · OpenAI GPT-4o        ║');
  println('╚══════════════════════════════════════════╝');
  println(RESET);

  // ---- Step 1: 读取 API Key ----
  println();
  println(`${BOLD}📋 Step 1: 粘贴你的 OpenAI API Key${RESET}`);
  println(`${YELLOW}   （从 https://platform.openai.com/api-keys 获取）${RESET}`);
  println();

  const apiKey = await askInput(`${BOLD}   API Key: ${RESET}`);

  if (!apiKey || apiKey.trim().length < 10) {
    println(`${RED}   ❌ Key 无效，请重新运行${RESET}`);
    process.exit(1);
  }

  // ---- Step 2: 选择模型 ----
  println();
  println(`${BOLD}📋 Step 2: 选择模型${RESET}`);
  println(`   [1] gpt-4o-mini  (推荐，性价比高，每次约 $0.001-0.005)`);
  println(`   [2] gpt-4o       (精度更高，每次约 $0.01-0.03)`);
  println();

  const modelChoice = await askInput(`${BOLD}   选择 (1/2，回车默认 1): ${RESET}`);
  const model = modelChoice.trim() === '2' ? 'gpt-4o' : 'gpt-4o-mini';

  // ---- Step 3: 写入 .env ----
  println();
  println(`${BOLD}📋 Step 3: 写入配置...${RESET}`);

  const envContent = `# OpenAI API Key
VITE_OPENAI_API_KEY=${apiKey.trim()}

# OpenAI 模型选择
VITE_OPENAI_MODEL=${model}
`;

  fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
  println(`${GREEN}   ✅ 配置已保存到 .env${RESET}`);
  println(`   🧠 模型: ${model}`);

  // ---- Step 4: 检查依赖 ----
  println();
  println(`${BOLD}📋 Step 4: 检查依赖...${RESET}`);

  const nodeModules = path.join(APP_DIR, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    println(`   ⏳ 首次运行，正在安装依赖（约 30-60 秒）...`);
    try {
      execSync('npm install', { cwd: APP_DIR, stdio: 'inherit' });
    } catch {
      println(`${RED}   ❌ 依赖安装失败，请检查网络连接${RESET}`);
      process.exit(1);
    }
  } else {
    println(`${GREEN}   ✅ 依赖已就绪${RESET}`);
  }

  // ---- Step 5: 启动 ----
  println();
  println(`${GREEN}${BOLD}╔══════════════════════════════════════════╗${RESET}`);
  println(`${GREEN}${BOLD}║     🚀 正在启动开发服务器...            ║${RESET}`);
  println(`${GREEN}${BOLD}║     浏览器打开后访问 Menus 页面         ║${RESET}`);
  println(`${GREEN}${BOLD}║     Add menu → Upload my existing menu  ║${RESET}`);
  println(`${GREEN}${BOLD}╚══════════════════════════════════════════╝${RESET}`);
  println();

  const server = spawn('npx', ['vite', '--host'], {
    cwd: APP_DIR,
    stdio: 'inherit',
    shell: true,
  });

  server.on('error', (err) => {
    println(`${RED}❌ 启动失败: ${err.message}${RESET}`);
    process.exit(1);
  });

  // 优雅退出
  process.on('SIGINT', () => {
    println(`\n${YELLOW}👋 关闭中...${RESET}`);
    server.kill();
    process.exit(0);
  });
}

// ==================== 交互式输入 ====================

function askInput(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdin.once('data', (data) => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

// ==================== 运行 ====================

main().catch((err) => {
  println(`${RED}❌ 错误: ${err.message}${RESET}`);
  process.exit(1);
});
