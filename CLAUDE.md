# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

猫猫导航 (Mao Nav) 是一个基于 Vue 3 + Vite 构建的个人导航网站，支持分类管理、网站收藏、拖拽排序和可视化管理后台。

**技术栈:**
- Vue 3.5.17 + Composition API
- Vite 5.4.10
- Vue Router 4.5.1
- Pinia 3.0.3 (状态管理)
- VueDraggable 4.1.0 (拖拽排序)
- ESLint 9.29.0

**部署目标:** Cloudflare Pages / Vercel

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

## 项目架构

### 目录结构

```
src/
├── apis/              # API 接口层
│   ├── useGitHubAPI.js       # GitHub API (读写 mock_data.js,上传 logo)
│   └── useNavigation.js      # 导航数据管理 API
├── assets/            # 静态资源 (CSS,图片)
├── components/        # Vue 组件
│   ├── admin/         # 管理后台组件
│   │   ├── CategoryManager.vue    # 分类管理
│   │   ├── SiteManager.vue        # 网站管理
│   │   ├── SystemSettings.vue     # 系统设置
│   │   └── CustomDialog.vue       # 自定义对话框
│   ├── charts/        # 图表组件
│   ├── AnalyticsDashboard.vue     # 分析面板
│   ├── CategoryTree.vue           # 分类树
│   ├── EnhancedSearchBox.vue      # 搜索框
│   ├── FavoriteButton.vue         # 收藏按钮
│   └── FavoriteManager.vue        # 收藏管理器
├── mock/              # 模拟数据
│   └── mock_data.js   # 导航数据源 (分类和网站列表)
├── router/            # 路由配置
│   └── index.js       # Vue Router 配置
├── stores/            # Pinia 状态管理
│   ├── analyticsStore.js   # 分析统计
│   ├── categoryStore.js    # 分类状态
│   ├── iconStore.js        # 图标管理
│   └── searchStore.js      # 搜索状态
├── utils/             # 工具函数
├── views/             # 页面组件
│   ├── NavHomeView.vue     # 首页
│   ├── AdminView.vue       # 管理后台
│   ├── SimpleDemoView.vue  # 演示页面
│   └── TestView.vue        # 测试页面
├── App.vue            # 根组件
└── main.js            # 应用入口
```

### 核心架构特点

**1. 数据流架构**
- 数据源: `src/mock/mock_data.js` (JavaScript 模块导出)
- 状态管理: Pinia stores 管理应用状态
- API 层: `useGitHubAPI.js` 负责与 GitHub API 交互,实现数据持久化
- GitHub 集成: 管理后台可通过 GitHub API 直接修改 `mock_data.js` 文件

**2. 管理后台架构**
- 路由: `/admin` (需要密钥认证)
- 环境变量配置 (可选):
  - `VITE_ADMIN_PASSWORD`: 管理员密钥
  - `VITE_GITHUB_TOKEN`: GitHub Personal Access Token (需要 Contents: Read/Write 权限)
  - `VITE_GITHUB_OWNER`: GitHub 仓库所有者
  - `VITE_GITHUB_REPO`: GitHub 仓库名称
  - `VITE_GITHUB_BRANCH`: GitHub 分支名称
- 功能: 可视化添加/编辑分类和网站,支持拖拽排序,自动同步到 GitHub

**3. 路由结构**
- `/` - 首页 (NavHomeView)
- `/demo` - 新功能演示 (SimpleDemoView)
- `/admin` - 管理后台 (AdminView,需要认证)
- `/test` - 环境变量测试 (TestView)

**4. 图标管理系统**
- 自动获取网站 favicon
- 图标缓存在 `public/sitelogo/` 目录
- 支持通过管理后台上传自定义图标到 GitHub

**5. 状态管理模式**
- `categoryStore`: 管理分类和网站数据,支持增删改查
- `searchStore`: 管理搜索状态和结果
- `analyticsStore`: 统计访问数据
- `iconStore`: 管理图标缓存和加载状态

## 关键实现细节

### 数据格式

`src/mock/mock_data.js` 的数据结构:

```javascript
export const mockData = {
  categories: [
    {
      id: "unique-id",
      name: "分类名称",
      icon: "🔍",
      order: 0,
      sites: [
        {
          id: "site-id",
          name: "网站名称",
          url: "https://example.com",
          description: "网站描述",
          icon: "/sitelogo/example.com.ico"
        }
      ]
    }
  ],
  title: "猫猫导航站"
}
```

### GitHub API 集成

- 使用 GitHub Contents API 读写 `src/mock/mock_data.js`
- 通过 base64 编码处理中文内容: `btoa(unescape(encodeURIComponent(content)))`
- 解码中文内容: `decodeURIComponent(escape(atob(data.content)))`
- 上传二进制文件 (图标) 使用 ArrayBuffer 转 base64

### Vite 配置要点

- 路径别名: `@` 映射到 `./src`
- SPA fallback: 配置 `historyApiFallback: true`
- 代码分割:
  - `vue-vendor`: Vue 核心库
  - `admin`: 管理后台组件 (按需加载)

## 开发注意事项

1. **修改导航数据**
   - 方式 1: 直接编辑 `src/mock/mock_data.js`
   - 方式 2: 使用管理后台 (需配置环境变量)

2. **添加新网站**
   - 在 `mock_data.js` 的 `categories[].sites` 数组中添加
   - 图标路径格式: `/sitelogo/域名.ico`

3. **添加新分类**
   - 在 `mock_data.js` 的 `categories` 数组中添加
   - 使用 emoji 作为分类图标
   - `order` 字段控制显示顺序

4. **环境变量配置**
   - 本地开发: 在根目录创建 `.env` 文件
   - Cloudflare/Vercel: 在平台的环境变量设置中配置
   - 环境变量以 `VITE_` 开头才能在前端访问

5. **代码风格**
   - 使用 Composition API
   - 遵循 ESLint 配置
   - 运行 `npm run lint` 自动修复格式问题

6. **图标处理**
   - 图标存储在 `public/sitelogo/` 目录
   - 文件名格式: `域名.ico` (如 `www.google.com.ico`)
   - 管理后台会自动尝试获取网站 favicon

7. **部署流程**
   - 提交代码到 GitHub
   - Cloudflare Pages/Vercel 自动检测 Git 推送
   - 自动执行 `npm run build`
   - 部署 `dist/` 目录内容

## 常见任务

### 添加新功能
1. 在 `src/components/` 创建组件
2. 在 `src/router/index.js` 添加路由 (如需要)
3. 在 `src/stores/` 添加状态管理 (如需要)
4. 更新相关视图组件

### 修改样式
- 全局样式: `src/assets/main.css` 和 `src/assets/base.css`
- 组件样式: 在各组件的 `<style scoped>` 中修改

### 调试 GitHub API
- 访问 `/test` 路由查看环境变量配置
- 检查浏览器控制台的 API 请求日志
- 确保 GitHub Token 有正确的权限 (Contents: Read/Write)

## 项目特色功能

1. **拖拽排序**: 使用 VueDraggable 实现网站和分类拖拽排序
2. **搜索功能**: 支持跨分类搜索网站名称和描述
3. **收藏功能**: 本地存储用户收藏的网站
4. **访问统计**: 记录和展示网站访问次数
5. **响应式设计**: 完美支持桌面端、平板和移动端
6. **管理后台**: 可视化管理界面,支持 GitHub 同步

## 性能优化建议

- 管理后台组件已配置懒加载
- 图标使用本地缓存减少网络请求
- 考虑为大量网站列表添加虚拟滚动
- 使用 Vite 的代码分割特性优化加载速度