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
    // 配置SPA fallback，所有路由都返回index.html
    historyApiFallback: true,
  },
  build: {
    // 构建时也需要考虑路由配置
    rollupOptions: {
      output: {
        // 代码分割优化
        manualChunks: {
          // Vue 核心库
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 管理后台（懒加载）
          'admin': ['./src/views/AdminView.vue']
        },
        // 资源文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true // 生产环境移除 debugger
      }
    },
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 source map（可选，生产环境建议关闭）
    sourcemap: false
  },
  // 性能优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia']
  }
})
