# 猫猫技术博客 - UI 设计规范文档

> **设计理念**：极简主义，以内容为中心，黑白灰色调，优雅的排版和动效
> **参考风格**：Medium × Apple，强调可读性和沉浸式阅读体验

## 1. 设计系统 (Design System)

### 1.1 色彩规范 (Color Palette)

**主色调 - 黑白灰系列：**
```css
/* 纯黑 - 主要文字和重点内容 */
--primary-black: #000000
--text-primary: #1a1a1a
--text-secondary: #4a4a4a
--text-tertiary: #7a7a7a
--text-quaternary: #9a9a9a

/* 灰度 - 分隔线、边框、背景 */
--gray-50: #fafafa
--gray-100: #f5f5f5
--gray-200: #eeeeee
--gray-300: #e0e0e0
--gray-400: #bdbdbd
--gray-500: #9e9e9e
--gray-600: #757575
--gray-700: #616161
--gray-800: #424242
--gray-900: #212121

/* 纯白 - 背景色 */
--primary-white: #ffffff
--bg-primary: #ffffff
--bg-secondary: #fafafa
--bg-tertiary: #f5f5f5

/* 功能色彩 */
--accent-blue: #0066cc /* 超链接 */
--success-green: #2ecc71 /* 成功状态 */
--warning-yellow: #f39c12 /* 警告状态 */
--error-red: #e74c3c /* 错误状态 */

/* 代码高亮 */
--code-bg: #f8f9fa
--code-border: #e9ecef
--code-keyword: #d73a49
--code-string: #032f62
--code-comment: #6a737d
--code-function: #6f42c1
```

### 1.2 字体规范 (Typography)

**字体选择：**
```css
/* 主字体 - 中文 */
--font-zh: "Source Han Serif SC", "Noto Serif SC", "霞鹜文楷", "思源宋体", serif

/* 主字体 - 英文 */
--font-en: "Inter", "SF Pro Display", "Helvetica Neue", Arial, sans-serif

/* 等宽字体 - 代码 */
--font-mono: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace
```

**字体大小和行高：**
```css
/* 文章标题 */
--font-size-hero: 3rem;      /* 48px - 主标题 */
--font-size-h1: 2.5rem;      /* 40px */
--font-size-h2: 2rem;        /* 32px */
--font-size-h3: 1.5rem;      /* 24px */
--font-size-h4: 1.25rem;     /* 20px */

/* 文章内容 */
--font-size-body-xl: 1.25rem; /* 20px */
--font-size-body-lg: 1.125rem; /* 18px */
--font-size-body: 1rem;      /* 16px - 正文主要 */
--font-size-body-sm: 0.875rem; /* 14px */
--font-size-body-xs: 0.75rem;  /* 12px */

/* UI 组件 */
--font-size-ui: 0.875rem;    /* 14px - 按钮、标签等 */

/* 行高 */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* 字重 */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 1.3 间距系统 (Spacing)

**8px 基础间距系统：**
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### 1.4 圆角和阴影 (Border Radius & Shadows)

**圆角：**
```css
--radius-sm: 0.25rem;  /* 4px - 小元素 */
--radius: 0.5rem;      /* 8px - 标准 */
--radius-lg: 0.75rem;  /* 12px - 大元素 */
--radius-xl: 1rem;     /* 16px - 卡片 */
--radius-full: 9999px; /* 完全圆角 */
```

**阴影：**
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## 2. 页面布局设计 (Page Layouts)

### 2.1 整体布局结构

```
┌─────────────────────────────────────────────────────────┐
│                    Navigation Bar                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                     Page Content                        │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                       Footer                            │
└─────────────────────────────────────────────────────────┘
```

**布局特点：**
- **最大宽度：** 1200px（大屏居中显示）
- **左右边距：** 24px（移动端自适应）
- **内容区域：** 65-75字符每行（最佳阅读体验）
- **响应式断点：** 768px（平板），1024px（桌面）

### 2.2 博客首页布局 (/blog)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] 猫猫技术博客     [导航] [关于] [搜索] [🌙]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                Hero Section                             │
│           ┌─────────────────────────┐                   │
│           │    "Hi, I'm 幽浮喵"     │                   │
│           │    全栈开发工程师       │                   │
│           │    分享技术思考与实践   │                   │
│           │    [CTA Button]         │                   │
│           └─────────────────────────┘                   │
│                                                         │
│                Latest Articles                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Article    │  │  Article    │  │  Article    │      │
│  │    Card     │  │    Card     │  │    Card     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Hero Section 设计：**
- **高度：** 60vh（最小 400px，最大 600px）
- **背景：** 纯白或极浅灰色渐变
- **标题：** 大号字体，居中显示
- **副标题：** 中等字号，较浅颜色
- **CTA 按钮：** 黑色背景，白色文字，hover 时透明度变化

### 2.3 文章详情页布局 (/blog/[slug])

```
┌─────────────────────────────────────────────────────────┐
│              ← Back to Blog           [阅读时间] [🌙]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                 Article Header                          │
│           ┌─────────────────────────────────────┐       │
│           │           文章标题                   │       │
│           │           作者信息                   │       │
│           │           发布日期                   │       │
│           │           标签列表                   │       │
│           └─────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────┐            ┌─────────────────────┐ │
│  │                 │            │   Table of Contents │ │
│  │   Article       │            │   (Desktop Only)    │ │
│  │    Content      │            │   - Introduction    │ │
│  │                 │            │   - Section 1        │ │
│  │                 │            │   - Section 2        │ │
│  │                 │            │   - Conclusion       │ │
│  └─────────────────┘            └─────────────────────┘ │
│                                                         │
│              Related Articles Section                    │
│      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│      │  Article    │  │  Article    │  │  Article    │   │
│      │    Card     │  │    Card     │  │    Card     │   │
│      └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**文章详情页特点：**
- **布局：** 两栏（桌面端）或单栏（移动端）
- **左侧：** 文章内容，最大宽度 700px
- **右侧：** 目录导航（固定定位），宽度 250px
- **阅读进度条：** 页面顶部细线指示器
- **返回按钮：** 左上角简洁设计

### 2.4 文章列表页布局 (/blog/archive)

```
┌─────────────────────────────────────────────────────────┐
│              Blog Archive                    [搜索框]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [全部 ▼] [Vue.js ▼] [前端 ▼] [后端 ▼] [随笔 ▼] [+]     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           2024 年 1 月                           │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  📅 文章标题           🏷️ Vue.js   5 分钟阅读   │   │
│  │     文章摘要，简短描述...                        │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  📅 另一篇文章         🏷️ 前端   8 分钟阅读    │   │
│  │     文章摘要，简短描述...                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           2023 年 12 月                          │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  📅 更多文章...                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**文章列表页特点：**
- **筛选器：** 顶部分类标签，支持多选
- **搜索框：** 右上角实时搜索
- **时间分组：** 按月份倒序排列
- **文章条目：** 标题 + 摘要 + 元信息

### 2.5 导航首页布局 (/nav)

```
┌─────────────────────────────────────────────────────────┐
│      [切换到博客]      我的导航站          [设置] [🌙]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                搜索框 ──────────────────────── [🔍]     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   开发工具   │  │   学习资源   │  │   娱乐休闲   │      │
│  │             │  │             │  │             │      │
│  │  🔨 VS Code │  │  📚 MDN     │  │  🎵 Bilibili│  │
│  │  🔧 Figma   │  │  📖 掘金    │  │  🎬 YouTube │  │
│  │  ⚙️ Chrome  │  │  🎓 Coursera│  │  🎮 Steam   │  │
│  │             │  │             │  │             │      │
│  │  [编辑分类]  │  │  [编辑分类]  │  │  [编辑分类]  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 3. 组件设计规范 (Component Design)

### 3.1 导航栏 (Navigation Bar)

```css
.navbar {
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  position: fixed;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.navbar.scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-sm);
}

.navbar-brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
}

.navbar-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.navbar-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.navbar-link:hover {
  color: var(--text-primary);
  border-bottom-color: var(--text-primary);
}
```

### 3.2 文章卡片 (Article Card)

```css
.article-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--gray-300);
}

.article-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: var(--gray-100);
}

.article-card-content {
  padding: 1.5rem;
}

.article-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card-excerpt {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: var(--line-height-normal);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.article-card-date {
  font-weight: 500;
}

.article-card-tags {
  display: flex;
  gap: 0.5rem;
}

.article-tag {
  background: var(--gray-100);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}
```

### 3.3 代码块 (Code Block)

```css
.code-block {
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  border-radius: var(--radius);
  margin: 1.5rem 0;
  overflow: hidden;
  position: relative;
}

.code-block-header {
  background: var(--gray-100);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--code-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.code-block-language {
  color: var(--text-secondary);
  font-weight: 500;
}

.code-block-copy {
  background: var(--text-primary);
  color: var(--bg-primary);
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.code-block-copy:hover {
  opacity: 0.8;
}

.code-block-content {
  padding: 1rem;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: var(--line-height-relaxed);
}

.code-block-content pre {
  margin: 0;
  background: none;
  border: none;
  padding: 0;
}

/* 语法高亮颜色 */
.token.keyword { color: var(--code-keyword); font-weight: 600; }
.token.string { color: var(--code-string); }
.token.comment { color: var(--code-comment); font-style: italic; }
.token.function { color: var(--code-function); }
.token.number { color: var(--accent-blue); }
.token.operator { color: var(--text-primary); }
```

### 3.4 目录导航 (Table of Contents)

```css
.toc {
  position: sticky;
  top: 100px;
  width: 250px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}

.toc-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 0.5rem;
}

.toc-link {
  display: block;
  padding: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
}

.toc-link:hover {
  color: var(--text-primary);
  background: var(--gray-50);
}

.toc-link.active {
  color: var(--accent-blue);
  background: rgba(0, 102, 204, 0.1);
  border-left-color: var(--accent-blue);
  font-weight: 500;
}

.toc-link.level-2 { padding-left: 1.5rem; }
.toc-link.level-3 { padding-left: 2rem; }
.toc-link.level-4 { padding-left: 2.5rem; }
```

### 3.5 搜索框 (Search Box)

```css
.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  background: var(--bg-primary);
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-top: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  display: none;
}

.search-results.active {
  display: block;
}

.search-result-item {
  padding: 1rem;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-result-item:hover {
  background: var(--gray-50);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.search-result-excerpt {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}
```

## 4. 交互和动效设计 (Interactions & Animations)

### 4.1 页面转场动画

```css
/* 页面切换淡入效果 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* 页面元素滑动动画 */
.slide-up-enter-active {
  transition: all 0.6s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
```

### 4.2 微交互动效

```css
/* 按钮悬停效果 */
.btn {
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* 卡片悬停效果 */
.hover-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
}

::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-500);
}
```

### 4.3 加载状态

```css
/* 骨架屏动画 */
.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 加载旋转动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-300);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## 5. 响应式设计 (Responsive Design)

### 5.1 断点系统

```css
/* 移动端 */
@media (max-width: 767px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .article-card {
    margin-bottom: 1.5rem;
  }

  .toc {
    display: none;
  }

  .navbar {
    height: 56px;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .article-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding-left: 3rem;
    padding-right: 3rem;
  }

  .article-card-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .article-content-wrapper {
    display: grid;
    grid-template-columns: 1fr 250px;
    gap: 3rem;
  }
}
```

### 5.2 移动端适配

```css
/* 触摸友好的点击区域 */
.mobile-touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* 移动端导航 */
.mobile-nav-toggle {
  display: none;
}

@media (max-width: 767px) {
  .mobile-nav-toggle {
    display: block;
  }

  .navbar-nav {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    background: var(--bg-primary);
    flex-direction: column;
    padding: 1rem;
    border-top: 1px solid var(--gray-200);
    transform: translateY(-100%);
    opacity: 0;
    transition: all 0.3s ease;
  }

  .navbar-nav.open {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## 6. 无障碍设计 (Accessibility)

### 6.1 焦点状态

```css
/* 键盘焦点可见 */
.focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

/* 跳转到主内容 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--text-primary);
  color: var(--bg-primary);
  padding: 8px;
  text-decoration: none;
  border-radius: var(--radius-sm);
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}
```

### 6.2 屏幕阅读器支持

```css
/* 仅对屏幕阅读器可见 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 替代文本 */
img {
  max-width: 100%;
  height: auto;
}

/* 链接和按钮的明确性 */
.btn:not([aria-label]):not(:has(text)) {
  display: none;
}
```

## 7. 深色模式扩展 (Dark Mode Extension)

虽然要求极简黑白风格，但为了用户眼部舒适度，可以在夜间自动切换到深色模式：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #e0e0e0;
    --text-tertiary: #b0b0b0;
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --bg-tertiary: #333333;
    --gray-50: #2a2a2a;
    --gray-100: #333333;
    --gray-200: #404040;
    --code-bg: #2d2d2d;
    --code-border: #404040;
  }

  .navbar {
    background: rgba(26, 26, 26, 0.95);
    border-bottom-color: var(--gray-200);
  }

  .article-card {
    background: var(--bg-primary);
    border-color: var(--gray-200);
  }
}
```

## 8. 特殊组件设计

### 8.1 阅读进度条

```css
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gray-200);
  z-index: 1001;
}

.reading-progress-bar {
  height: 100%;
  background: var(--text-primary);
  transition: width 0.2s ease;
}
```

### 8.2 文章元信息

```css
.article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-bottom: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--gray-200);
  border-bottom: 1px solid var(--gray-200);
}

.article-meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.article-meta-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}
```

---

## 总结

这个设计规范文档定义了猫猫技术博客的完整视觉语言，遵循极简主义设计理念，以黑白灰为基调，强调内容可读性和用户体验。设计灵感来自 Medium 和 Apple，注重细节和微交互，确保在不同设备上都能提供一致的优质体验。

所有设计元素都服务于一个核心目标：**让读者专注于内容阅读，减少视觉干扰，提供沉浸式的技术文章阅读体验。** (o(*￣︶￣*)o