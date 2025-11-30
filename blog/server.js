/**
 * 博客文章管理后端服务
 * 提供本地文件系统操作 API，避免频繁 Git 提交
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// 文章目录路径
const POSTS_DIR = path.join(__dirname, 'src', 'content', 'posts')

// 中间件
app.use(cors({
  origin: [
    'http://localhost:5173', // 允许导航站前端访问
    'http://localhost:4321', // 允许博客开发服务器访问
    'http://localhost:4322', // 允许博客开发服务器访问（备用端口）
    'http://localhost:4323', // 允许博客开发服务器访问（备用端口）
    'http://localhost:4324'  // 允许博客开发服务器访问（备用端口）
  ],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// 简单的认证中间件（可选）
const authenticate = (req, res, next) => {
  const password = req.headers['x-admin-password']
  const expectedPassword = process.env.VITE_ADMIN_PASSWORD

  if (expectedPassword && password !== expectedPassword) {
    return res.status(401).json({ error: '未授权访问' })
  }

  next()
}

// 验证文件名安全性
const isValidFilename = (filename) => {
  // 只允许 .md 文件，且不包含路径遍历字符
  return filename.endsWith('.md') &&
         !filename.includes('..') &&
         !filename.includes('/') &&
         !filename.includes('\\')
}

// ========== API 端点 ==========

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '博客后端服务运行中',
    postsDir: POSTS_DIR
  })
})

// 列出所有文章
app.get('/api/posts', authenticate, async (req, res) => {
  try {
    const files = await fs.readdir(POSTS_DIR)

    // 过滤出 .md 文件，排除目录
    const posts = []

    for (const file of files) {
      if (!file.endsWith('.md')) continue

      const filePath = path.join(POSTS_DIR, file)
      const stats = await fs.stat(filePath)

      if (stats.isFile()) {
        posts.push({
          name: file,
          path: `src/content/posts/${file}`,
          size: stats.size,
          mtime: stats.mtime,
          ctime: stats.ctime
        })
      }
    }

    // 按修改时间倒序排序
    posts.sort((a, b) => b.mtime - a.mtime)

    res.json({ posts })
  } catch (error) {
    console.error('列出文章失败:', error)
    res.status(500).json({ error: '列出文章失败', message: error.message })
  }
})

// 获取单篇文章
app.get('/api/posts/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: '无效的文件名' })
    }

    const filePath = path.join(POSTS_DIR, filename)
    const content = await fs.readFile(filePath, 'utf-8')

    res.json({
      filename,
      content
    })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: '文章不存在' })
    }
    console.error('获取文章失败:', error)
    res.status(500).json({ error: '获取文章失败', message: error.message })
  }
})

// 创建新文章
app.post('/api/posts', authenticate, async (req, res) => {
  try {
    const { filename, content } = req.body

    if (!filename || !content) {
      return res.status(400).json({ error: '缺少必要参数：filename 和 content' })
    }

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: '无效的文件名' })
    }

    const filePath = path.join(POSTS_DIR, filename)

    // 检查文件是否已存在
    try {
      await fs.access(filePath)
      return res.status(409).json({ error: '文章已存在' })
    } catch {
      // 文件不存在，可以创建
    }

    // 写入文件
    await fs.writeFile(filePath, content, 'utf-8')

    console.log(`✅ 创建文章成功: ${filename}`)
    res.json({
      success: true,
      message: '文章创建成功',
      filename
    })
  } catch (error) {
    console.error('创建文章失败:', error)
    res.status(500).json({ error: '创建文章失败', message: error.message })
  }
})

// 更新文章
app.put('/api/posts/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: '缺少必要参数：content' })
    }

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: '无效的文件名' })
    }

    const filePath = path.join(POSTS_DIR, filename)

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: '文章不存在' })
    }

    // 更新文件
    await fs.writeFile(filePath, content, 'utf-8')

    console.log(`✅ 更新文章成功: ${filename}`)
    res.json({
      success: true,
      message: '文章更新成功',
      filename
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    res.status(500).json({ error: '更新文章失败', message: error.message })
  }
})

// 删除文章
app.delete('/api/posts/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: '无效的文件名' })
    }

    const filePath = path.join(POSTS_DIR, filename)

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: '文章不存在' })
    }

    // 删除文件
    await fs.unlink(filePath)

    console.log(`✅ 删除文章成功: ${filename}`)
    res.json({
      success: true,
      message: '文章删除成功',
      filename
    })
  } catch (error) {
    console.error('删除文章失败:', error)
    res.status(500).json({ error: '删除文章失败', message: error.message })
  }
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   博客后端服务已启动 🚀                ║
║   端口: ${PORT}                          ║
║   文章目录: ${POSTS_DIR}
║   允许来源: http://localhost:5173      ║
╚════════════════════════════════════════╝
  `)
})
