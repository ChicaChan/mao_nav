/**
 * Markdown Frontmatter 解析工具
 * 用于解析和生成博客文章的 Markdown 文件
 */

/**
 * 解析 Markdown 文件的 frontmatter 和内容
 * @param {string} markdown - 完整的 Markdown 文件内容
 * @returns {Object} { frontmatter: Object, content: string }
 */
export function parseFrontmatter(markdown) {
  // 匹配 frontmatter 格式: ---\n...\n---\n
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = markdown.match(frontmatterRegex)

  if (!match) {
    return {
      frontmatter: {},
      content: markdown
    }
  }

  const frontmatterText = match[1]
  const content = match[2].trim()

  // 解析 frontmatter YAML
  const frontmatter = {}
  const lines = frontmatterText.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    // 处理键值对
    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmedLine.substring(0, colonIndex).trim()
    let value = trimmedLine.substring(colonIndex + 1).trim()

    // 处理不同类型的值
    if (value.startsWith('[') && value.endsWith(']')) {
      // 数组类型: [tag1, tag2, tag3]
      value = value
        .slice(1, -1)
        .split(',')
        .map(item => item.trim())
        .filter(item => item)
    } else if (value === 'true') {
      value = true
    } else if (value === 'false') {
      value = false
    } else if (!isNaN(value) && value !== '') {
      // 数字类型
      value = Number(value)
    }

    frontmatter[key] = value
  }

  return {
    frontmatter,
    content
  }
}

/**
 * 生成 Markdown 文件内容
 * @param {Object} frontmatter - Frontmatter 对象
 * @param {string} content - 文章内容
 * @returns {string} 完整的 Markdown 文件内容
 */
export function generateMarkdown(frontmatter, content) {
  const lines = ['---']

  // 生成 frontmatter
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      // 数组类型
      lines.push(`${key}: [${value.join(', ')}]`)
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${value}`)
    } else {
      lines.push(`${key}: ${value}`)
    }
  }

  lines.push('---')
  lines.push('')
  lines.push(content.trim())

  return lines.join('\n')
}

/**
 * 从文章标题生成 slug（URL 友好的文件名）
 * @param {string} title - 文章标题
 * @returns {string} slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .trim()
}

/**
 * 验证 frontmatter 必填字段
 * @param {Object} frontmatter - Frontmatter 对象
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateFrontmatter(frontmatter) {
  const errors = []
  const requiredFields = ['title', 'published', 'description', 'category']

  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      errors.push(`缺少必填字段: ${field}`)
    }
  }

  // 验证日期格式 (YYYY-MM-DD)
  if (frontmatter.published) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(frontmatter.published)) {
      errors.push('发布日期格式错误，应为 YYYY-MM-DD')
    }
  }

  // 验证标签是否为数组
  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    errors.push('标签必须是数组格式')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
