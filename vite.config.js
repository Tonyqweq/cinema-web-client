import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 当前端请求 /api 开头的地址时，转发到后端 http://localhost:8081
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        // 去掉前缀：/api/sessions -> /api/sessions（这里后端本身就是 /api 开头，所以不重写）
        // 如果后端路径不是 /api 开头，可以打开下面的 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
