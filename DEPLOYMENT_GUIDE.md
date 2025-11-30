# 部署指南

本项目采用 Monorepo 架构，包含两个独立的应用：

- **导航站** (`nav/`) - Vue 3 + Vite 构建的导航网站
- **博客站** (`blog/`) - Astro 构建的博客网站

## 📦 项目结构

```
mao_nav/
├── nav/                    # 导航站项目
│   ├── src/
│   ├── dist/              # 构建输出目录
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json        # 导航站 Vercel 配置
├── blog/                   # 博客站项目
│   ├── src/
│   ├── dist/              # 构建输出目录
│   ├── package.json
│   ├── astro.config.mjs
│   └── vercel.json        # 博客站 Vercel 配置
└── package.json            # Monorepo 根配置
```

## 🚀 部署方式

### 方案 1：Vercel 独立部署（推荐）

#### 1. 部署导航站

1. 在 Vercel 创建新项目
2. 连接 GitHub 仓库
3. 配置项目设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `nav`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. 添加环境变量（如果需要）：
   ```
   VITE_GITHUB_TOKEN=your_token
   VITE_GITHUB_OWNER=your_username
   VITE_GITHUB_REPO=mao_nav
   VITE_GITHUB_BRANCH=master
   VITE_ADMIN_PASSWORD=your_password
   ```
5. 点击 Deploy

#### 2. 部署博客站

1. 在 Vercel 创建另一个新项目
2. 连接同一个 GitHub 仓库
3. 配置项目设置：
   - **Framework Preset**: Astro
   - **Root Directory**: `blog`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. 点击 Deploy

**注意**：博客管理后台（`/admin/`）仅在本地环境使用，不会部署到线上。详见 `blog/LOCAL_ADMIN_GUIDE.md`。

### 方案 2：Cloudflare Pages 独立部署

#### 1. 部署导航站

1. 在 Cloudflare Pages 创建新项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: `cd nav && npm install && npm run build`
   - **Build output directory**: `nav/dist`
4. 添加环境变量（同上）
5. 保存并部署

#### 2. 部署博客站

1. 在 Cloudflare Pages 创建另一个新项目
2. 连接同一个 GitHub 仓库
3. 配置构建设置：
   - **Framework preset**: Astro
   - **Build command**: `cd blog && npm install && npm run build`
   - **Build output directory**: `blog/dist`
4. 保存并部署

## 🌐 域名配置建议

### 选项 1：使用子域名（推荐）

- **博客站**：`https://example.com`（主域名）
- **导航站**：`https://nav.example.com`（子域名）

### 选项 2：使用不同的子域名

- **博客站**：`https://blog.example.com`
- **导航站**：`https://nav.example.com`

### 选项 3：使用路径

- **博客站**：`https://example.com`
- **导航站**：`https://example.com/nav`（需要额外配置重写规则）

## 🔧 本地开发

### 安装依赖

```bash
# 安装所有项目的依赖
npm run install:all

# 或者分别安装
npm install              # 根目录依赖
cd nav && npm install    # 导航站依赖
cd ../blog && npm install # 博客站依赖
```

### 开发模式

```bash
# 只运行导航站
npm run dev:nav

# 只运行博客站
npm run dev:blog

# 同时运行两个项目
npm run dev:all
```

### 构建

```bash
# 构建导航站
npm run build:nav

# 构建博客站
npm run build:blog

# 构建所有项目
npm run build
```

### 预览

```bash
# 预览导航站
npm run preview:nav

# 预览博客站
npm run preview:blog
```

## 📝 环境变量

### 导航站环境变量

创建 `nav/.env` 文件：

```env
VITE_GITHUB_TOKEN=ghp_xxxxx
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=mao_nav
VITE_GITHUB_BRANCH=master
VITE_ADMIN_PASSWORD=your_password
```

### 博客站环境变量

博客站目前不需要额外的环境变量。

## 🔄 自动部署

两个项目都配置了自动部署：

1. 推送到 `master` 分支会触发自动部署
2. Vercel/Cloudflare 会自动检测变更并重新构建
3. 部署完成后会自动更新线上版本

## ⚠️ 注意事项

1. **独立部署**：导航站和博客站是两个独立的部署，互不影响
2. **构建时间**：首次部署可能需要较长时间，后续部署会更快
3. **环境变量**：确保在部署平台正确配置环境变量
4. **域名配置**：建议使用子域名分别部署两个应用
5. **缓存清理**：如果更新后没有生效，尝试清除浏览器缓存

## 🐛 常见问题

### Q: 部署后页面显示 404

**A**: 检查以下几点：
- Root Directory 是否正确设置为 `nav` 或 `blog`
- Output Directory 是否正确设置为 `dist`
- Build Command 是否正确

### Q: 环境变量不生效

**A**:
- 确保环境变量名称以 `VITE_` 开头（导航站）
- 在部署平台重新部署项目以应用新的环境变量

### Q: 构建失败

**A**:
- 检查 Node.js 版本是否 >= 18.0.0
- 检查依赖是否正确安装
- 查看构建日志中的错误信息

## 📞 技术支持

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Astro 文档](https://docs.astro.build/)
- [Vite 文档](https://vitejs.dev/)
