/**
 * Vercel Serverless Function — 菜单识别 API 代理
 *
 * GDPR 合规方案：
 * - API Key 仅存 Vercel 环境变量（服务端），不暴露给浏览器
 * - 部署在 EU 边缘节点（法兰克福）
 * - 前端只发送加密过的图片数据，不携带认证信息
 *
 * 端点：POST /api/menu-recognize
 */
export const config = {
  runtime: 'nodejs22.x',
  maxDuration: 60, // 最大 60 秒
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

  if (!MOONSHOT_API_KEY) {
    console.error('[Menu Recognize] MOONSHOT_API_KEY not configured');
    return res.status(500).json({ error: 'Server API key not configured. Please contact the administrator.' });
  }

  try {
    const body = req.body;
    console.log(`[Menu Recognize] Forwarding to Moonshot (model: ${body.model || 'auto'})`);

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MOONSHOT_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Menu Recognize] Moonshot error (${response.status}):`, errorText.substring(0, 300));
      return res.status(response.status).json({
        error: `AI service error: ${response.status}`,
        detail: errorText.substring(0, 500),
      });
    }

    const data = await response.json();
    console.log(`[Menu Recognize] OK — tokens: ${data.usage?.total_tokens || 'N/A'}`);
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Menu Recognize] Proxy error:', error.message);
    return res.status(502).json({
      error: 'Failed to connect to AI service',
      detail: error.message,
    });
  }
}
