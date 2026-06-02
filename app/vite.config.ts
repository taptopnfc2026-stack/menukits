import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import http from "http"
import https from "https"

const PROXY_HOST = '127.0.0.1'
const PROXY_PORT = 7890

// 自定义 Vite 插件：通过本地 SOCKS5 代理转发 OpenAI 请求
function openaiProxy(): Plugin {
  return {
    name: 'openai-proxy',
    configureServer(server) {
      server.middlewares.use('/api/openai', (req, res) => {
        // 去掉 /api/openai 前缀
        const targetPath = req.url?.replace(/^\/api\/openai/, '') || '/'

        const options: http.RequestOptions = {
          hostname: 'api.moonshot.cn',
          port: 443,
          path: targetPath,
          method: req.method,
          headers: { ...req.headers },
        }

        // 删除无效的代理头
        delete options.headers?.['host']
        ;(options.headers as any)?.['origin'] && delete (options.headers as any)['origin']

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (err) => {
          console.error('[Moonshot Proxy] Error:', err.message)
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '代理连接失败: ' + err.message }))
          }
        })

        req.pipe(proxyReq)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), openaiProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
