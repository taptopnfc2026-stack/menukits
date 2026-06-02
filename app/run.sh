#!/bin/bash
# 🍽️ menukits — 一键启动脚本
# 运行后粘贴 OpenAI API Key，自动配置并启动

set -e
cd "$(dirname "$0")"

# ---- 颜色 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BLUE}${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║      🍽️  menukits — 一键启动           ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ---- 1. 输入 API Key ----
echo ""
echo -e "${BOLD}📋 请粘贴你的 OpenAI API Key:${NC}"
echo -e "${YELLOW}   (从 https://platform.openai.com/api-keys 获取)${NC}"
echo ""
read -r -p "   API Key: " API_KEY

if [ -z "$API_KEY" ] || [ ${#API_KEY} -lt 10 ]; then
    echo -e "${RED}❌ Key 无效，请重新运行${NC}"
    exit 1
fi

# ---- 2. 写入 .env ----
echo ""
echo -e "${BOLD}📋 写入配置...${NC}"

cat > .env << EOF
# OpenAI API Key
VITE_OPENAI_API_KEY=${API_KEY}

# OpenAI 模型选择
VITE_OPENAI_MODEL=gpt-4o-mini
EOF

echo -e "${GREEN}✅ 配置已保存${NC}"

# ---- 3. 安装依赖 ----
echo ""
if [ ! -d "node_modules" ]; then
    echo -e "${BOLD}📋 安装依赖中（首次运行约 30 秒）...${NC}"
    npm install
else
    echo -e "${GREEN}✅ 依赖已就绪${NC}"
fi

# ---- 4. 启动 ----
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║  🚀 启动开发服务器...                   ║"
echo "║  🌐 http://localhost:5173               ║"
echo "║                                         ║"
echo "║  Menus → Add menu →                     ║"
echo "║  Upload my existing menu                ║"
echo "║  上传菜单图片 → AI 自动识别             ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

npx vite --host
