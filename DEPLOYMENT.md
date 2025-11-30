# 部署指南

本文档提供了猫猫导航 & 技术博客的完整部署指南。

## 📋 部署前检查清单

### 1. 环境变量配置

在部署前，需要配置以下环境变量：

```bash
# GitHub API 配置（用于管理后台）
VITE_GITHUB_TOKEN=ghp_xxxxx        # GitHub Personal Access Token
VITE_GITHUB_OWNER=your_username    # GitHub 用户名
VITE_GITHUB_REPO=mao_nav          # 仓库名称
VITE_GITHUB_BRANCH=master         # 分支名称

# 管理员密码
VITE_ADMIN_PASSWORD=your_password # 管理后台登录密码
```

### 2. 更新配置文件

#### 更新 `index.html` 中的域名

将 `index.html` 中的 `https://your-domain.com/` 替换为实际域名：

```html
<!-- Open Graph / Facebook -->
<meta property="og:url" content="https://your-actual-domain.com/">
<meta property="og:image" content="https://your-actual-domain.com/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:url" content="https://your-actual-domain.com/">
<meta property="twitter:image" content="https://your-actual-domain.com/og-image.jpg">
```

#### 更新 `robots.txt` 中的域名

将 `public/robots.txt` 中的域名替换为实际域名：

```txt
Sitemap: https://your-actual-domain.com/sitemap.xml
```

#### 更新 `sitemap.xml` 中的域名

将 `public/sitemap.xml` 中的所有 `https://your-domain.com/` 替换为实际域名。

### 3. 准备 OG 图片

创建一张 1200x630 像素的 Open Graph 图片，放置在 `public/og-image.jpg`。

## 🚀 部署到 Cloudflare Pages

### 步骤 1: 推送代码到 GitHub

```bash
git add .
git commit -m "feat: 完成博客系统开发"
git push origin master
```

### 步骤 2: 连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 页面
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权并选择你的 GitHub 仓库

### 步骤 3: 配置构建设置

**构建配置：**
- **Framework preset**: Vue
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`
- **Node version**: 18 或更高

### 步骤 4: 配置环境变量

在 Cloudflare Pages 项目设置中，添加以下环境变量：

```
VITE_GITHUB_TOKEN=ghp_xxxxx
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=mao_nav
VITE_GITHUB_BRANCH=master
VITE_ADMIN_PASSWORD=your_password
```

### 步骤 5: 部署

点击 **Save and Deploy**，Cloudflare Pages 会自动构建和部署你的网站。

### 步骤 6: 配置自定义域名（可选）

1. 在 Cloudflare Pages 项目设置中，进入 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名并按照提示配置 DNS

## 🚀 部署到 Vercel

### 步骤 1: 推送代码到 GitHub

```bash
git add .
git commit -m "feat: 完成博客系统开发"
git push origin master
```

### 步骤 2: 导入项目到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **New Project**
3. 导入你的 GitHub 仓库

### 步骤 3: 配置构建设置

**构建配置：**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 步骤 4: 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

```
VITE_GITHUB_TOKEN=ghp_xxxxx
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=mao_nav
VITE_GITHUB_BRANCH=master
VITE_ADMIN_PASSWORD=your_password
```

### 步骤 5: 部署

点击 **Deploy**，Vercel 会自动构建和部署你的网站。

### 步骤 6: 配置自定义域名（可选）

1. 在 Vercel 项目设置中，进入 **Domains**
2. 添加你的自定义域名
3. 按照提示配置 DNS

## 🔧 本地测试

在部署前，建议先在本地测试生产构建：

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

访问 `http://localhost:4173` 查看生产版本。

## 📝 部署后检查清单

### 1. 功能测试

- [ ] 导航站首页正常显示
- [ ] 博客首页正常显示
- [ ] 文章列表页正常显示
- [ ] 文章详情页正常显示
- [ ] 搜索功能正常工作
- [ ] 分类筛选正常工作
- [ ] 标签过滤正常工作
- [ ] 深色模式切换正常工作
- [ ] 管理后台可以登录
- [ ] 管理后台可以创建/编辑/删除文章
- [ ] 代码复制功能正常工作
- [ ] 图片缩放功能正常工作

### 2. SEO 检查

- [ ] 页面标题正确显示
- [ ] Meta 描述正确显示
- [ ] Open Graph 标签正确
- [ ] Twitter Card 标签正确
- [ ] robots.txt 可访问
- [ ] sitemap.xml 可访问

### 3. 性能检查

使用 [PageSpeed Insights](https://pagespeed.web.dev/) 测试性能：

- [ ] 首屏加载时间 < 3 秒
- [ ] 性能评分 > 90
- [ ] 可访问性评分 > 90
- [ ] 最佳实践评分 > 90
- [ ] SEO 评分 > 90

### 4. 移动端测试

- [ ] 移动端布局正常
- [ ] 触摸交互正常
- [ ] 导航菜单正常工作
- [ ] 图片正常加载

## 🔄 持续部署

### 自动部署

Cloudflare Pages 和 Vercel 都支持自动部署：

- 推送到 `master` 分支会自动触发生产部署
- 推送到其他分支会创建预览部署

### 手动部署

如果需要手动部署，可以使用以下命令：

```bash
# Cloudflare Pages
npx wrangler pages publish dist

# Vercel
npx vercel --prod
```

## 🐛 常见问题

### 1. 路由 404 错误

**问题**: 刷新页面时出现 404 错误

**解决方案**:
- Cloudflare Pages: 自动支持 SPA 路由
- Vercel: 自动支持 SPA 路由
- 其他平台: 需要配置重定向规则，将所有请求重定向到 `index.html`

### 2. 环境变量不生效

**问题**: 环境变量在生产环境中不生效

**解决方案**:
- 确保环境变量以 `VITE_` 开头
- 重新部署项目
- 检查环境变量是否正确配置

### 3. GitHub API 403 错误

**问题**: 管理后台无法保存数据

**解决方案**:
- 检查 GitHub Token 是否有效
- 确保 Token 有 `Contents: Read and write` 权限
- 检查仓库名称和分支名称是否正确

### 4. 图片加载失败

**问题**: 图片无法显示

**解决方案**:
- 检查图片路径是否正确
- 确保图片文件存在于 `public/` 目录
- 检查图片 URL 是否可访问

## 📊 监控和分析

### Google Analytics（可选）

在 `index.html` 中添加 Google Analytics 代码：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Cloudflare Analytics

Cloudflare Pages 自动提供免费的 Web Analytics，无需额外配置。

## 🔐 安全建议

1. **保护管理后台**:
   - 使用强密码
   - 定期更换密码
   - 不要在公开场合分享管理员密码

2. **保护 GitHub Token**:
   - 使用 Fine-grained token
   - 限制 token 权限到最小范围
   - 定期轮换 token

3. **HTTPS**:
   - Cloudflare Pages 和 Vercel 自动提供 HTTPS
   - 确保所有资源都通过 HTTPS 加载

## 📚 更多资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Vue Router 部署指南](https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations)

---

祝主人部署顺利喵～ φ(≧ω≦*)♪
