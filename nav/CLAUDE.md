# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

猫猫导航 (Mao Nav) 是一个基于 Vue 3 + Vite 构建的个人导航网站，支持分类管理、网站收藏、拖拽排序和可视化管理后台。

**核心技术栈:**
- Vue 3.5.17 (Composition API + `<script setup>` 语法)
- Vite 5.4.10 (构建工具)
- Vue Router 4.5.1 (客户端路由)
- Pinia 3.0.3 (状态管理，替代 Vuex)
- VueDraggable 4.1.0 (拖拽排序功能)
- ESLint 9.29.0 (代码规范)

**部署平台:** Cloudflare Pages / Vercel (静态站点托管)

## 开发命令

```bash
# 开发模式 (启动本地开发服务器,默认端口 5173)
npm run dev

# 构建生产版本 (输出到 dist/ 目录)
npm run build

# 预览生产版本
npm run preview

# 代码检查和自动修复
npm run lint
```

## 核心架构

### 数据流架构 (关键设计)

**单一数据源原则:**
```
src/mock/mock_data.js (唯一真实数据源)
         ↓
   Pinia Stores (运行时状态)
         ↓
   Vue Components (UI 渲染)
```

**GitHub 集成工作流:**
```
1. 用户在管理后台编辑数据
2. categoryStore 更新本地状态
3. useGitHubAPI.saveCategoriesToGitHub() 提交到 GitHub
4. GitHub API 更新 src/mock/mock_data.js
5. Cloudflare/Vercel 检测到 Git 推送，自动重新部署
6. 2-3 分钟后新数据生效
```

**重要技术细节:**
- `mock_data.js` 是 JavaScript 模块 (不是 JSON)，使用 `export const mockData = {...}`
- GitHub API 需要处理中文编码: `btoa(unescape(encodeURIComponent(content)))`
- 解码时: `decodeURIComponent(escape(atob(data.content)))`
- 每次更新需要提供文件的 SHA (用于并发控制)

### 状态管理架构 (Pinia Stores)

**categoryStore.js** - 核心业务逻辑
- 管理分类树结构 (支持父子关系和排序)
- 网站 CRUD 操作
- 标签管理
- 拖拽排序支持
- 数据导入/导出功能

**关键方法:**
- `addCategory()` / `updateCategory()` / `deleteCategory()` - 分类管理
- `addSiteToCategory()` / `updateSite()` / `deleteSite()` - 网站管理
- `moveSite()` - 跨分类移动网站
- `importCategories()` - 从 GitHub 加载数据
- `exportCategories()` - 导出数据到 GitHub

**其他 Stores:**
- `searchStore` - 搜索功能 (跨分类搜索)
- `analyticsStore` - 访问统计 (LocalStorage 持久化)
- `iconStore` - 图标缓存管理

### 路由架构

**路由配置 (src/router/index.js):**
- `/` - 首页 (NavHomeView，立即加载)
- `/demo` - 演示页面 (懒加载)
- `/admin` - 管理后台 (懒加载，需要密钥认证)
- `/test` - 环境变量测试页面

**路由守卫:**
- `beforeEach` 钩子设置页面标题
- 管理后台认证在组件内部实现 (不在路由守卫)

### 组件架构

**管理后台组件 (src/components/admin/):**
- `CategoryManager.vue` - 分类管理 (增删改查)
- `SiteManager.vue` - 网站管理 (增删改查)
- `SystemSettings.vue` - 系统设置 (GitHub 配置)
- `CustomDialog.vue` - 通用对话框组件

**功能组件:**
- `EnhancedSearchBox.vue` - 搜索框 (支持实时搜索)
- `FavoriteManager.vue` - 收藏管理 (LocalStorage)
- `CategoryTree.vue` - 分类树展示
- `AnalyticsDashboard.vue` - 数据统计面板

### 图标管理系统

**工作流程 (已优化):**
1. 用户添加网站时，系统自动尝试获取 `https://域名/favicon.ico`
2. 用户可手动上传图标（支持 .png, .jpg, .webp, .ico 等格式）
3. 上传后浏览器自动下载图片到本地
4. 用户手动将下载的文件放到 `public/sitelogo/` 目录
5. 图标路径格式: `/sitelogo/域名.扩展名` (自动匹配实际扩展名)

**实现细节:**
- 使用 `iconFetcher.js` 工具函数获取 favicon
- **上传逻辑已优化**: 自动提取文件扩展名并更新路径
- 使用 Base64 编码进行预览显示
- 刷新页面后从 `public/sitelogo/` 目录加载图片
- 图标缓存在 `iconStore` 中管理加载状态

**关键代码位置:**
- SiteManager.vue: `src/components/admin/SiteManager.vue:654-739`
- BlogPostManager.vue: `src/components/admin/BlogPostManager.vue:122-197`

## 关键实现细节

### 数据格式规范

**mock_data.js 结构:**
```javascript
export const mockData = {
  categories: [
    {
      id: "unique-id",           // 必须唯一
      name: "分类名称",
      icon: "🔍",                 // 使用 emoji
      order: 0,                   // 排序权重
      parentId: null,             // 可选，父分类 ID
      sites: [
        {
          id: "site-id",          // 必须唯一
          name: "网站名称",
          url: "https://example.com",
          description: "网站描述",
          icon: "/sitelogo/example.com.ico",
          order: 0                // 站点排序
        }
      ]
    }
  ],
  title: "猫猫导航站"            // 网站标题
}
```

**ID 生成规则:**
- 使用 `utils/common.js` 中的 `generateId()` 函数
- 格式: 时间戳 + 随机数，确保唯一性

### GitHub API 集成细节

**useGitHubAPI.js 核心方法:**

1. **getFileContent(path, isBinaryFile)** - 读取文件
   - 使用 GitHub Contents API
   - 自动处理中文编码
   - 支持二进制文件 (图标)

2. **updateFileContent(path, content, message, sha)** - 更新文件
   - 需要提供文件的 SHA (并发控制)
   - 中文编码: `btoa(unescape(encodeURIComponent(content)))`
   - 自动生成提交信息

3. **uploadBinaryFile(path, binaryData, message)** - 上传二进制文件
   - 用于上传网站图标
   - ArrayBuffer → base64 转换
   - 自动检查文件是否存在

**环境变量要求:**
```bash
VITE_GITHUB_TOKEN=ghp_xxxxx        # Fine-grained token
VITE_GITHUB_OWNER=username         # 仓库所有者
VITE_GITHUB_REPO=mao_nav          # 仓库名称
VITE_GITHUB_BRANCH=master         # 分支名称
VITE_ADMIN_PASSWORD=your_password # 管理员密码
```

**权限要求:**
- GitHub Token 需要 `Contents: Read and write` 权限
- 建议使用 Fine-grained token 限制到单个仓库

### Vite 配置要点

**vite.config.js 关键配置:**
```javascript
{
  resolve: {
    alias: {
      '@': './src'  // 路径别名
    }
  },
  server: {
    historyApiFallback: true  // SPA 路由支持
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],  // Vue 核心库分离
          'admin': ['./src/views/AdminView.vue'] // 管理后台懒加载
        }
      }
    }
  }
}
```

**性能优化:**
- 管理后台组件懒加载 (减少首屏加载)
- Vue 核心库单独打包 (利用浏览器缓存)
- 图标本地缓存 (减少网络请求)

## 开发注意事项

### 代码风格规范

**必须遵循:**
- 使用 Vue 3 Composition API (`<script setup>` 语法)
- 遵循 ESLint 配置 (运行 `npm run lint` 自动修复)
- 组件使用 PascalCase 命名 (如 `CategoryManager.vue`)
- 工具函数使用 camelCase 命名
- 常量使用 UPPER_SNAKE_CASE 命名

**组件编写规范:**
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'

// 1. 导入依赖
// 2. 定义 props 和 emits
// 3. 定义响应式状态
// 4. 定义计算属性
// 5. 定义方法
// 6. 生命周期钩子
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 组件样式 */
</style>
```

### 修改导航数据的两种方式

**方式 1: 直接编辑文件 (推荐用于批量修改)**
1. 编辑 `src/mock/mock_data.js`
2. 提交到 Git
3. 等待自动部署 (2-3 分钟)

**方式 2: 使用管理后台 (推荐用于日常维护)**
1. 配置环境变量 (见上文)
2. 访问 `/admin` 路由
3. 输入管理员密码
4. 可视化编辑后点击"保存到 GitHub"

### 添加新功能的标准流程

**1. 创建组件**
```bash
# 在 src/components/ 创建新组件
src/components/MyNewFeature.vue
```

**2. 添加状态管理 (如需要)**
```bash
# 在 src/stores/ 创建新 store
src/stores/myFeatureStore.js
```

**3. 添加路由 (如需要)**
```javascript
// src/router/index.js
{
  path: '/my-feature',
  name: 'myFeature',
  component: () => import('../views/MyFeatureView.vue'),
  meta: { title: '新功能 - 猫猫导航' }
}
```

**4. 添加工具函数 (如需要)**
```bash
# 在 src/utils/ 创建工具函数
src/utils/myFeatureHelper.js
```

### 调试技巧

**调试 GitHub API:**
1. 访问 `/test` 路由查看环境变量配置
2. 打开浏览器开发者工具 → Network 标签
3. 查看 GitHub API 请求和响应
4. 检查 Console 中的错误日志

**常见问题排查:**
- **401/403 错误**: GitHub Token 权限不足或已过期
- **404 错误**: 文件路径错误或仓库配置错误
- **中文乱码**: 检查编码/解码逻辑
- **CORS 错误**: GitHub API 不应该有 CORS 问题，检查网络连接

**本地开发调试:**
```bash
# 启动开发服务器 (默认端口 5173)
npm run dev

# 在另一个终端运行 lint 检查
npm run lint

# 构建生产版本测试
npm run build && npm run preview
```

### 图标管理最佳实践

**添加网站图标:**
1. 系统会自动尝试获取 `https://域名/favicon.ico`
2. 如果自动获取失败，可以手动上传图标
3. 图标文件名格式: `域名.ico` (如 `www.google.com.ico`)
4. 存储位置: `public/sitelogo/`

**上传自定义图标 (已优化):**
1. 在管理后台编辑网站
2. 点击"📁 选择图片"按钮
3. 选择图标文件 (支持 .ico, .png, .jpg, .webp 等)
4. 浏览器自动下载图片（文件名自动匹配域名和扩展名）
5. 手动将下载的文件放到 `public/sitelogo/` 目录
6. 刷新页面后图片正常显示
7. **不需要手动修改 `mock_data.js`** (路径已自动更新)

### 环境变量配置

**本地开发 (.env 文件):**
```bash
# 在项目根目录创建 .env 文件
VITE_ADMIN_PASSWORD=your_password
VITE_GITHUB_TOKEN=ghp_xxxxx
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=mao_nav
VITE_GITHUB_BRANCH=master
```

**生产环境 (Cloudflare/Vercel):**
- 在平台的环境变量设置中配置
- 不要在代码中硬编码敏感信息
- 环境变量以 `VITE_` 开头才能在前端访问

### 部署流程

**自动部署 (推荐):**
1. 提交代码到 GitHub: `git push`
2. Cloudflare/Vercel 自动检测推送
3. 自动执行 `npm run build`
4. 部署 `dist/` 目录内容
5. 2-3 分钟后新版本生效

**手动部署 (不推荐):**
```bash
npm run build
# 手动上传 dist/ 目录到服务器
```

## 常见开发任务

### 修改全局样式
- 主样式文件: `src/assets/main.css`
- 基础样式: `src/assets/base.css`
- CSS 变量定义在 `:root` 中

### 添加新的 Pinia Store
```javascript
// src/stores/myStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMyStore = defineStore('myStore', () => {
  // 状态
  const data = ref([])

  // 计算属性
  const count = computed(() => data.value.length)

  // 方法
  const addData = (item) => {
    data.value.push(item)
  }

  return { data, count, addData }
})
```

### 添加新的工具函数
```javascript
// src/utils/myHelper.js
/**
 * 工具函数描述
 * @param {string} param - 参数描述
 * @returns {string} 返回值描述
 */
export function myHelper(param) {
  // 实现逻辑
  return result
}
```

## 项目特色功能

1. **拖拽排序** - 使用 VueDraggable 实现分类和网站拖拽排序
2. **实时搜索** - 支持跨分类搜索网站名称和描述
3. **收藏功能** - 基于 LocalStorage 的用户收藏系统
4. **访问统计** - 记录和展示网站访问次数
5. **响应式设计** - 完美支持桌面端、平板和移动端
6. **GitHub 同步** - 管理后台直接修改 GitHub 仓库文件
7. **自动图标获取** - 自动获取网站 favicon 并缓存
8. **主题切换** - 支持深色/浅色模式切换，主题持久化保存

## 技术债务和改进建议

**当前已知问题:**
- 大量网站时可能需要虚拟滚动优化性能
- 图标获取失败时缺少友好的错误提示
- 管理后台缺少数据备份/恢复功能

**未来改进方向:**
- 添加网站分组和标签过滤功能
- 支持导入/导出书签文件 (HTML 格式)
- 添加网站可用性检测
- 支持多语言国际化

## 主题切换功能

**实现位置:**
- 主题切换逻辑: `src/views/NavHomeView.vue:406-431`
- CSS 主题变量: `src/assets/base.css:136-157`
- 主题切换组件: `src/components/ThemeToggle.vue` (可选，未使用)

**工作原理:**
```javascript
// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-theme')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark-theme')
    localStorage.setItem('theme', 'light')
  }
}

// 初始化主题（页面加载时）
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark-theme')
  } else {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark-theme')
  }
}
```

**CSS 主题变量:**
```css
/* 浅色模式（默认） */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  /* ... 更多变量 */
}

/* 深色模式 */
.dark-theme {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #ffffff;
  --text-secondary: #cbd5e0;
  /* ... 更多变量 */
}
```

**使用方法:**
1. 点击导航栏右上角的主题按钮
2. 浅色模式显示 🌙 图标，深色模式显示 ☀️ 图标
3. 主题选择自动保存到 LocalStorage
4. 下次访问时自动恢复上次的主题

**特点:**
- ✅ 主题持久化（LocalStorage）
- ✅ 平滑过渡动画（0.5s）
- ✅ 完整的 CSS 变量支持
- ✅ 全站统一主题