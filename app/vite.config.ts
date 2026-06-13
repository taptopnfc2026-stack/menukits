import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import http from "http"
import https from "https"

// 自定义 Vite 插件：多 AI 提供商代理
// 开发环境通过 Vite 中间件转发 API 请求，避免 CORS 问题
function aiProxy(): Plugin {
  return {
    name: 'ai-proxy',
    configureServer(server) {
      // ---- Moonshot API 代理（向后兼容） ----
      server.middlewares.use('/api/openai', (req, res) => {
        const targetPath = req.url?.replace(/^\/api\/openai/, '') || '/'

        // 如果请求中带有 provider 信息，根据 provider 路由到不同的 API
        const hostname = 'api.moonshot.cn';
        const proxyHeaders: http.OutgoingHttpHeaders = { ...req.headers };
        delete proxyHeaders.host;
        delete proxyHeaders.origin;

        const options: http.RequestOptions = {
          hostname,
          port: 443,
          path: targetPath,
          method: req.method,
          headers: proxyHeaders,
        }

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (err) => {
          console.error('[AI Proxy] Error:', err.message)
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Proxy connection failed: ' + err.message }))
          }
        })

        req.pipe(proxyReq)
      })

      // ---- AI Test 代理 ----
      server.middlewares.use('/api/ai-test', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          try {
            const { provider, apiKey, endpoint, deployment, type } = JSON.parse(body)

            res.setHeader('Content-Type', 'application/json')

            if (!apiKey) {
              res.writeHead(400)
              res.end(JSON.stringify({ ok: false, message: 'API key required' }))
              return
            }

            let testResult;

            try {
              if (provider === 'mistral') {
                const resp = await fetch('https://api.mistral.ai/v1/models', {
                  headers: { Authorization: `Bearer ${apiKey}` },
                  signal: AbortSignal.timeout(10000),
                })
                if (resp.ok) {
                  const data = await resp.json() as any;
                  testResult = { ok: true, message: `Connected! ${data.data?.length || '?'} models available` }
                } else {
                  const err = await resp.text()
                  testResult = { ok: false, message: `Mistral error (${resp.status}): ${err.substring(0, 200)}` }
                }
              } else if (provider === 'azure') {
                const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment || 'gpt-4o'}/chat/completions?api-version=2024-10-21`
                const resp = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
                  body: JSON.stringify({ messages: [{ role: 'user', content: 'Say ok' }], max_tokens: 5 }),
                  signal: AbortSignal.timeout(10000),
                })
                if (resp.ok) {
                  testResult = { ok: true, message: 'Azure OpenAI connected successfully' }
                } else {
                  const err = await resp.text()
                  testResult = { ok: false, message: `Azure error (${resp.status}): ${err.substring(0, 200)}` }
                }
              } else if (provider === 'deepl') {
                const baseUrl = type === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com'
                const resp = await fetch(`${baseUrl}/v2/usage`, {
                  headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
                  signal: AbortSignal.timeout(10000),
                })
                if (resp.ok) {
                  const data = await resp.json() as any;
                  testResult = { ok: true, message: `Connected! Characters used: ${data.character_count || '?'}/${data.character_limit || '?'}` }
                } else {
                  const err = await resp.text()
                  testResult = { ok: false, message: `DeepL error (${resp.status}): ${err.substring(0, 200)}` }
                }
              } else {
                testResult = { ok: false, message: `Unknown provider: ${provider}` }
              }
            } catch (err: any) {
              testResult = { ok: false, message: `Connection failed: ${err.message}` }
            }

            res.writeHead(testResult.ok ? 200 : 200)
            res.end(JSON.stringify(testResult))
          } catch (err: any) {
            res.writeHead(400)
            res.end(JSON.stringify({ ok: false, message: 'Invalid request: ' + err.message }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), aiProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
})
