/**
 * URL验证和网站信息检测工具
 * 提供URL格式验证、可访问性检测、网站元信息抓取等功能
 */

import { debounce } from './common.js'

/**
 * URL验证器类
 */
export class URLValidator {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000 // 10秒超时
    this.retryCount = options.retryCount || 2
    this.cache = new Map()
    this.cacheExpiry = options.cacheExpiry || 5 * 60 * 1000 // 5分钟缓存
    
    // 预定义的URL模式
    this.patterns = {
      // 基本URL格式
      basic: /^https?:\/\/.+/i,
      // 完整URL格式（包含域名验证）
      full: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/i,
      // 域名格式
      domain: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/,
      // IP地址格式
      ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      // 本地地址
      localhost: /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?:\:[0-9]+)?/i
    }
    
    // 常见的危险域名后缀
    this.dangerousDomains = [
      '.tk', '.ml', '.ga', '.cf', // 免费域名
      '.bit', '.onion' // 特殊域名
    ]
    
    // 常见的安全域名
    this.trustedDomains = [
      'github.com', 'google.com', 'microsoft.com', 'apple.com',
      'mozilla.org', 'w3.org', 'stackoverflow.com', 'wikipedia.org'
    ]
  }

  /**
   * 验证URL格式
   * @param {string} url - 要验证的URL
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  validateFormat(url, options = {}) {
    const result = {
      isValid: false,
      url: url,
      normalizedUrl: '',
      protocol: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      // 基本格式检查
      if (!url || typeof url !== 'string') {
        result.errors.push('URL不能为空')
        return result
      }

      // 去除首尾空格
      url = url.trim()
      
      // 自动添加协议
      if (!url.match(/^https?:\/\//i)) {
        if (url.match(/^\/\//)) {
          url = 'https:' + url
          result.suggestions.push('自动添加了HTTPS协议')
        } else if (url.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
          url = 'https://' + url
          result.suggestions.push('自动添加了HTTPS协议')
        } else {
          result.errors.push('无效的URL格式')
          return result
        }
      }

      // 使用URL构造函数进行详细解析
      const urlObj = new URL(url)
      
      result.isValid = true
      result.normalizedUrl = urlObj.href
      result.protocol = urlObj.protocol
      result.hostname = urlObj.hostname
      result.port = urlObj.port
      result.pathname = urlObj.pathname
      result.search = urlObj.search
      result.hash = urlObj.hash

      // 协议检查
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        result.warnings.push(`不支持的协议: ${urlObj.protocol}`)
      }

      // HTTPS建议
      if (urlObj.protocol === 'http:' && !this.patterns.localhost.test(url)) {
        result.warnings.push('建议使用HTTPS协议以确保安全')
      }

      // 域名安全检查
      this.checkDomainSecurity(urlObj.hostname, result)

      // 端口检查
      if (urlObj.port) {
        const port = parseInt(urlObj.port)
        if (port < 1 || port > 65535) {
          result.warnings.push('端口号超出有效范围')
        } else if ([22, 23, 25, 53, 110, 143, 993, 995].includes(port)) {
          result.warnings.push('使用了非HTTP服务的常见端口')
        }
      }

      // 路径检查
      if (urlObj.pathname.length > 2000) {
        result.warnings.push('URL路径过长，可能导致兼容性问题')
      }

      // 查询参数检查
      if (urlObj.search.length > 2000) {
        result.warnings.push('查询参数过长，可能导致兼容性问题')
      }

    } catch (error) {
      result.errors.push(`URL解析失败: ${error.message}`)
    }

    return result
  }

  /**
   * 检查域名安全性
   * @param {string} hostname - 主机名
   * @param {Object} result - 结果对象
   */
  checkDomainSecurity(hostname, result) {
    // 检查是否为IP地址
    if (this.patterns.ip.test(hostname)) {
      result.warnings.push('使用IP地址而非域名，可能存在安全风险')
      return
    }

    // 检查危险域名后缀
    for (const suffix of this.dangerousDomains) {
      if (hostname.endsWith(suffix)) {
        result.warnings.push(`使用了可能不安全的域名后缀: ${suffix}`)
        break
      }
    }

    // 检查可信域名
    for (const trustedDomain of this.trustedDomains) {
      if (hostname === trustedDomain || hostname.endsWith('.' + trustedDomain)) {
        result.suggestions.push('这是一个可信的域名')
        break
      }
    }

    // 检查域名长度
    if (hostname.length > 253) {
      result.errors.push('域名长度超出限制')
    }

    // 检查子域名层级
    const parts = hostname.split('.')
    if (parts.length > 10) {
      result.warnings.push('子域名层级过深')
    }

    // 检查可疑字符
    if (/[^\w.-]/.test(hostname)) {
      result.warnings.push('域名包含可疑字符')
    }
  }

  /**
   * 检查URL可访问性
   * @param {string} url - 要检查的URL
   * @param {Object} options - 检查选项
   * @returns {Promise<Object>} 检查结果
   */
  async checkAccessibility(url, options = {}) {
    const cacheKey = `accessibility_${url}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }
    }

    const result = {
      url: url,
      isAccessible: false,
      statusCode: null,
      statusText: '',
      responseTime: 0,
      redirects: [],
      finalUrl: url,
      headers: {},
      errors: [],
      warnings: [],
      metadata: {}
    }

    const startTime = Date.now()

    try {
      // 使用fetch进行可访问性检查
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'HEAD', // 只获取头部信息，减少带宽消耗
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      clearTimeout(timeoutId)
      result.responseTime = Date.now() - startTime

      result.isAccessible = response.ok
      result.statusCode = response.status
      result.statusText = response.statusText
      result.finalUrl = response.url

      // 收集响应头信息
      response.headers.forEach((value, key) => {
        result.headers[key] = value
      })

      // 检查重定向
      if (response.url !== url) {
        result.redirects.push({
          from: url,
          to: response.url,
          status: response.status
        })
        
        if (response.status >= 300 && response.status < 400) {
          result.warnings.push(`发生了重定向: ${response.status}`)
        }
      }

      // 分析响应头
      this.analyzeResponseHeaders(result)

      // 如果HEAD请求失败，尝试GET请求
      if (!response.ok && options.fallbackToGet !== false) {
        const getResult = await this.checkWithGetRequest(url, options)
        if (getResult.isAccessible) {
          Object.assign(result, getResult)
          result.warnings.push('HEAD请求失败，使用GET请求成功')
        }
      }

    } catch (error) {
      result.responseTime = Date.now() - startTime
      
      if (error.name === 'AbortError') {
        result.errors.push('请求超时')
      } else if (error.name === 'TypeError') {
        result.errors.push('网络错误或CORS限制')
      } else {
        result.errors.push(`请求失败: ${error.message}`)
      }

      // 如果是网络错误，尝试重试
      if (options.retry !== false && this.retryCount > 0) {
        const retryResult = await this.retryRequest(url, options)
        if (retryResult.isAccessible) {
          Object.assign(result, retryResult)
          result.warnings.push('初次请求失败，重试成功')
        }
      }
    }

    // 缓存结果
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * 使用GET请求检查可访问性
   * @param {string} url - URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 结果
   */
  async checkWithGetRequest(url, options = {}) {
    const result = {
      isAccessible: false,
      statusCode: null,
      statusText: '',
      responseTime: 0,
      headers: {},
      metadata: {}
    }

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      clearTimeout(timeoutId)
      result.responseTime = Date.now() - startTime
      result.isAccessible = response.ok
      result.statusCode = response.status
      result.statusText = response.statusText

      // 收集响应头
      response.headers.forEach((value, key) => {
        result.headers[key] = value
      })

      // 如果是HTML响应，尝试解析基本元信息
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        const html = await response.text()
        result.metadata = this.parseBasicMetadata(html)
      }

    } catch (error) {
      result.responseTime = Date.now() - startTime
      // 错误已在主函数中处理
    }

    return result
  }

  /**
   * 重试请求
   * @param {string} url - URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 结果
   */
  async retryRequest(url, options = {}) {
    for (let i = 0; i < this.retryCount; i++) {
      // 等待递增的延迟时间
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000))
      
      try {
        const result = await this.checkAccessibility(url, { 
          ...options, 
          retry: false // 避免无限重试
        })
        
        if (result.isAccessible) {
          return result
        }
      } catch (error) {
        // 继续重试
      }
    }

    return { isAccessible: false, errors: ['所有重试均失败'] }
  }

  /**
   * 分析响应头信息
   * @param {Object} result - 结果对象
   */
  analyzeResponseHeaders(result) {
    const headers = result.headers

    // 检查安全头
    const securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection'
    ]

    const missingSecurityHeaders = securityHeaders.filter(header => !headers[header])
    if (missingSecurityHeaders.length > 0) {
      result.warnings.push(`缺少安全头: ${missingSecurityHeaders.join(', ')}`)
    }

    // 检查缓存头
    if (!headers['cache-control'] && !headers['expires']) {
      result.warnings.push('缺少缓存控制头')
    }

    // 检查内容类型
    if (!headers['content-type']) {
      result.warnings.push('缺少内容类型头')
    }

    // 检查服务器信息
    if (headers['server']) {
      result.metadata.server = headers['server']
    }

    // 检查响应时间
    if (result.responseTime > 5000) {
      result.warnings.push('响应时间较长，可能影响用户体验')
    } else if (result.responseTime > 10000) {
      result.errors.push('响应时间过长')
    }
  }

  /**
   * 解析基本HTML元信息
   * @param {string} html - HTML内容
   * @returns {Object} 元信息
   */
  parseBasicMetadata(html) {
    const metadata = {}

    try {
      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
      if (titleMatch) {
        metadata.title = titleMatch[1].trim()
      }

      // 提取描述
      const descMatch = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i)
      if (descMatch) {
        metadata.description = descMatch[1].trim()
      }

      // 提取关键词
      const keywordsMatch = html.match(/<meta[^>]*name=['"]keywords['"][^>]*content=['"]([^'"]*)['"]/i)
      if (keywordsMatch) {
        metadata.keywords = keywordsMatch[1].trim()
      }

      // 提取favicon
      const faviconMatch = html.match(/<link[^>]*rel=['"](?:icon|shortcut icon)['"][^>]*href=['"]([^'"]*)['"]/i)
      if (faviconMatch) {
        metadata.favicon = faviconMatch[1]
      }

      // 提取Open Graph信息
      const ogTitleMatch = html.match(/<meta[^>]*property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i)
      if (ogTitleMatch) {
        metadata.ogTitle = ogTitleMatch[1].trim()
      }

      const ogDescMatch = html.match(/<meta[^>]*property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i)
      if (ogDescMatch) {
        metadata.ogDescription = ogDescMatch[1].trim()
      }

      const ogImageMatch = html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]*)['"]/i)
      if (ogImageMatch) {
        metadata.ogImage = ogImageMatch[1]
      }

    } catch (error) {
      console.warn('解析HTML元信息失败:', error)
    }

    return metadata
  }

  /**
   * 批量验证URL
   * @param {Array<string>} urls - URL数组
   * @param {Object} options - 选项
   * @returns {Promise<Array<Object>>} 验证结果数组
   */
  async validateBatch(urls, options = {}) {
    const results = []
    const concurrency = options.concurrency || 5 // 并发数限制
    
    // 分批处理
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency)
      const batchPromises = batch.map(async (url) => {
        const formatResult = this.validateFormat(url)
        if (formatResult.isValid && options.checkAccessibility !== false) {
          const accessResult = await this.checkAccessibility(formatResult.normalizedUrl, options)
          return { ...formatResult, ...accessResult }
        }
        return formatResult
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { 
          isValid: false, 
          errors: ['批量验证失败'] 
        }
      ))
      
      // 避免过于频繁的请求
      if (i + concurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  /**
   * 清理缓存
   * @param {boolean} force - 是否强制清理所有缓存
   */
  clearCache(force = false) {
    if (force) {
      this.cache.clear()
    } else {
      // 只清理过期的缓存
      const now = Date.now()
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheExpiry) {
          this.cache.delete(key)
        }
      }
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    const now = Date.now()
    let validCount = 0
    let expiredCount = 0
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheExpiry) {
        validCount++
      } else {
        expiredCount++
      }
    }
    
    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      hitRate: this.cache.size > 0 ? (validCount / this.cache.size * 100).toFixed(2) + '%' : '0%'
    }
  }
}

/**
 * 网站信息检测器
 */
export class WebsiteInfoDetector {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000
    this.maxRedirects = options.maxRedirects || 5
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }

  /**
   * 检测网站完整信息
   * @param {string} url - 网站URL
   * @param {Object} options - 检测选项
   * @returns {Promise<Object>} 网站信息
   */
  async detectWebsiteInfo(url, options = {}) {
    const result = {
      url: url,
      title: '',
      description: '',
      keywords: '',
      favicon: '',
      screenshot: '',
      language: '',
      charset: 'UTF-8',
      category: '',
      tags: [],
      socialMedia: {},
      techStack: [],
      performance: {},
      seo: {},
      accessibility: {},
      security: {},
      errors: [],
      warnings: []
    }

    try {
      // 获取网页内容
      const response = await this.fetchWebpage(url, options)
      if (!response.success) {
        result.errors.push(...response.errors)
        return result
      }

      const { html, finalUrl, headers } = response.data

      // 更新最终URL
      result.url = finalUrl

      // 解析HTML内容
      await this.parseHTMLContent(html, result)

      // 分析技术栈
      this.analyzeTechStack(html, headers, result)

      // SEO分析
      this.analyzeSEO(html, result)

      // 性能分析
      this.analyzePerformance(headers, result)

      // 安全分析
      this.analyzeSecurity(headers, result)

      // 可访问性分析
      this.analyzeAccessibility(html, result)

      // 社交媒体信息
      this.extractSocialMedia(html, result)

      // 自动分类
      result.category = this.categorizeWebsite(result)

      // 生成标签
      result.tags = this.generateTags(result)

    } catch (error) {
      result.errors.push(`网站信息检测失败: ${error.message}`)
    }

    return result
  }

  /**
   * 获取网页内容
   * @param {string} url - URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 响应结果
   */
  async fetchWebpage(url, options = {}) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          success: false,
          errors: [`HTTP ${response.status}: ${response.statusText}`]
        }
      }

      const html = await response.text()
      const headers = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      return {
        success: true,
        data: {
          html,
          finalUrl: response.url,
          headers
        }
      }

    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      }
    }
  }

  /**
   * 解析HTML内容
   * @param {string} html - HTML内容
   * @param {Object} result - 结果对象
   */
  async parseHTMLContent(html, result) {
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch) {
      result.title = this.cleanText(titleMatch[1])
    }

    // 提取meta描述
    const descMatch = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i)
    if (descMatch) {
      result.description = this.cleanText(descMatch[1])
    }

    // 提取关键词
    const keywordsMatch = html.match(/<meta[^>]*name=['"]keywords['"][^>]*content=['"]([^'"]*)['"]/i)
    if (keywordsMatch) {
      result.keywords = this.cleanText(keywordsMatch[1])
    }

    // 提取字符编码
    const charsetMatch = html.match(/<meta[^>]*charset=['"]([^'"]*)['"]/i) ||
                        html.match(/<meta[^>]*content=['"][^'"]*charset=([^'";\s]*)['"]/i)
    if (charsetMatch) {
      result.charset = charsetMatch[1].toUpperCase()
    }

    // 提取语言
    const langMatch = html.match(/<html[^>]*lang=['"]([^'"]*)['"]/i) ||
                     html.match(/<meta[^>]*http-equiv=['"]content-language['"][^>]*content=['"]([^'"]*)['"]/i)
    if (langMatch) {
      result.language = langMatch[1]
    }

    // 提取favicon
    result.favicon = await this.extractFavicon(html, result.url)

    // 提取Open Graph信息
    this.extractOpenGraph(html, result)
  }

  /**
   * 提取favicon
   * @param {string} html - HTML内容
   * @param {string} baseUrl - 基础URL
   * @returns {Promise<string>} favicon URL
   */
  async extractFavicon(html, baseUrl) {
    const faviconPatterns = [
      /<link[^>]*rel=['"]icon['"][^>]*href=['"]([^'"]*)['"]/i,
      /<link[^>]*rel=['"]shortcut icon['"][^>]*href=['"]([^'"]*)['"]/i,
      /<link[^>]*rel=['"]apple-touch-icon['"][^>]*href=['"]([^'"]*)['"]/i,
      /<link[^>]*href=['"]([^'"]*)['"'][^>]*rel=['"]icon['"]/i
    ]

    for (const pattern of faviconPatterns) {
      const match = html.match(pattern)
      if (match) {
        let faviconUrl = match[1]
        
        // 处理相对URL
        if (faviconUrl.startsWith('//')) {
          faviconUrl = new URL(baseUrl).protocol + faviconUrl
        } else if (faviconUrl.startsWith('/')) {
          faviconUrl = new URL(baseUrl).origin + faviconUrl
        } else if (!faviconUrl.startsWith('http')) {
          faviconUrl = new URL(faviconUrl, baseUrl).href
        }
        
        return faviconUrl
      }
    }

    // 尝试默认favicon路径
    try {
      const defaultFavicon = new URL('/favicon.ico', baseUrl).href
      const response = await fetch(defaultFavicon, { method: 'HEAD' })
      if (response.ok) {
        return defaultFavicon
      }
    } catch (error) {
      // 忽略错误
    }

    return ''
  }

  /**
   * 提取Open Graph信息
   * @param {string} html - HTML内容
   * @param {Object} result - 结果对象
   */
  extractOpenGraph(html, result) {
    const ogPatterns = {
      title: /<meta[^>]*property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i,
      description: /<meta[^>]*property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i,
      image: /<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]*)['"]/i,
      url: /<meta[^>]*property=['"]og:url['"][^>]*content=['"]([^'"]*)['"]/i,
      type: /<meta[^>]*property=['"]og:type['"][^>]*content=['"]([^'"]*)['"]/i,
      siteName: /<meta[^>]*property=['"]og:site_name['"][^>]*content=['"]([^'"]*)['"]/i
    }

    for (const [key, pattern] of Object.entries(ogPatterns)) {
      const match = html.match(pattern)
      if (match) {
        if (!result.openGraph) result.openGraph = {}
        result.openGraph[key] = this.cleanText(match[1])
      }
    }

    // 如果没有标题或描述，使用OG信息
    if (!result.title && result.openGraph?.title) {
      result.title = result.openGraph.title
    }
    if (!result.description && result.openGraph?.description) {
      result.description = result.openGraph.description
    }
  }

  /**
   * 分析技术栈
   * @param {string} html - HTML内容
   * @param {Object} headers - 响应头
   * @param {Object} result - 结果对象
   */
  analyzeTechStack(html, headers, result) {
    const techStack = []

    // 服务器技术
    if (headers.server) {
      techStack.push({
        name: headers.server,
        category: 'server',
        confidence: 0.9
      })
    }

    // 前端框架检测
    const frameworks = [
      { name: 'React', pattern: /react/i, category: 'frontend' },
      { name: 'Vue.js', pattern: /vue\.js|vuejs/i, category: 'frontend' },
      { name: 'Angular', pattern: /angular/i, category: 'frontend' },
      { name: 'jQuery', pattern: /jquery/i, category: 'frontend' },
      { name: 'Bootstrap', pattern: /bootstrap/i, category: 'css' },
      { name: 'Tailwind CSS', pattern: /tailwind/i, category: 'css' }
    ]

    for (const framework of frameworks) {
      if (framework.pattern.test(html)) {
        techStack.push({
          name: framework.name,
          category: framework.category,
          confidence: 0.7
        })
      }
    }

    // CMS检测
    const cmsPatterns = [
      { name: 'WordPress', pattern: /wp-content|wordpress/i },
      { name: 'Drupal', pattern: /drupal/i },
      { name: 'Joomla', pattern: /joomla/i },
      { name: 'Shopify', pattern: /shopify/i }
    ]

    for (const cms of cmsPatterns) {
      if (cms.pattern.test(html)) {
        techStack.push({
          name: cms.name,
          category: 'cms',
          confidence: 0.8
        })
      }
    }

    result.techStack = techStack
  }

  /**
   * SEO分析
   * @param {string} html - HTML内容
   * @param {Object} result - 结果对象
   */
  analyzeSEO(html, result) {
    const seo = {
      score: 0,
      issues: [],
      recommendations: []
    }

    let score = 0

    // 标题检查
    if (result.title) {
      score += 20
      if (result.title.length >= 30 && result.title.length <= 60) {
        score += 10
      } else {
        seo.recommendations.push('标题长度建议在30-60个字符之间')
      }
    } else {
      seo.issues.push('缺少页面标题')
    }

    // 描述检查
    if (result.description) {
      score += 20
      if (result.description.length >= 120 && result.description.length <= 160) {
        score += 10
      } else {
        seo.recommendations.push('描述长度建议在120-160个字符之间')
      }
    } else {
      seo.issues.push('缺少页面描述')
    }

    // H1标签检查
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i)
    if (h1Match) {
      score += 15
    } else {
      seo.issues.push('缺少H1标签')
    }

    // 图片alt属性检查
    const imgTags = html.match(/<img[^>]*>/gi) || []
    const imgsWithAlt = html.match(/<img[^>]*alt=['"][^'"]*['"][^>]*>/gi) || []
    if (imgTags.length > 0) {
      const altRatio = imgsWithAlt.length / imgTags.length
      if (altRatio >= 0.8) {
        score += 10
      } else {
        seo.recommendations.push('建议为所有图片添加alt属性')
      }
    }

    // 内部链接检查
    const internalLinks = html.match(/<a[^>]*href=['"][^'"]*['"][^>]*>/gi) || []
    if (internalLinks.length > 0) {
      score += 10
    }

    // 结构化数据检查
    if (html.includes('application/ld+json') || html.includes('itemscope')) {
      score += 15
    } else {
      seo.recommendations.push('建议添加结构化数据')
    }

    seo.score = Math.min(score, 100)
    result.seo = seo
  }

  /**
   * 性能分析
   * @param {Object} headers - 响应头
   * @param {Object} result - 结果对象
   */
  analyzePerformance(headers, result) {
    const performance = {
      score: 0,
      issues: [],
      recommendations: []
    }

    let score = 100

    // 缓存检查
    if (!headers['cache-control'] && !headers['expires']) {
      score -= 20
      performance.issues.push('缺少缓存控制头')
    }

    // 压缩检查
    if (!headers['content-encoding']) {
      score -= 15
      performance.recommendations.push('建议启用Gzip压缩')
    }

    // HTTPS检查
    if (!result.url.startsWith('https://')) {
      score -= 25
      performance.issues.push('未使用HTTPS')
    }

    // CDN检查（简单判断）
    const cdnHeaders = ['cf-ray', 'x-cache', 'x-served-by']
    const hasCDN = cdnHeaders.some(header => headers[header])
    if (!hasCDN) {
      score -= 10
      performance.recommendations.push('建议使用CDN加速')
    }

    performance.score = Math.max(score, 0)
    result.performance = performance
  }

  /**
   * 安全分析
   * @param {Object} headers - 响应头
   * @param {Object} result - 结果对象
   */
  analyzeSecurity(headers, result) {
    const security = {
      score: 0,
      issues: [],
      recommendations: []
    }

    let score = 0

    // 安全头检查
    const securityHeaders = {
      'strict-transport-security': { score: 25, name: 'HSTS' },
      'content-security-policy': { score: 20, name: 'CSP' },
      'x-frame-options': { score: 15, name: 'X-Frame-Options' },
      'x-content-type-options': { score: 10, name: 'X-Content-Type-Options' },
      'x-xss-protection': { score: 10, name: 'X-XSS-Protection' },
      'referrer-policy': { score: 10, name: 'Referrer-Policy' }
    }

    for (const [header, config] of Object.entries(securityHeaders)) {
      if (headers[header]) {
        score += config.score
      } else {
        security.recommendations.push(`建议添加${config.name}安全头`)
      }
    }

    // HTTPS检查
    if (result.url.startsWith('https://')) {
      score += 10
    } else {
      security.issues.push('未使用HTTPS加密')
    }

    security.score = Math.min(score, 100)
    result.security = security
  }

  /**
   * 可访问性分析
   * @param {string} html - HTML内容
   * @param {Object} result - 结果对象
   */
  analyzeAccessibility(html, result) {
    const accessibility = {
      score: 0,
      issues: [],
      recommendations: []
    }

    let score = 100

    // 语言属性检查
    if (!html.match(/<html[^>]*lang=['"][^'"]*['"]/i)) {
      score -= 15
      accessibility.issues.push('HTML元素缺少lang属性')
    }

    // 图片alt属性检查
    const imgTags = html.match(/<img[^>]*>/gi) || []
    const imgsWithAlt = html.match(/<img[^>]*alt=['"][^'"]*['"][^>]*>/gi) || []
    if (imgTags.length > 0) {
      const altRatio = imgsWithAlt.length / imgTags.length
      if (altRatio < 0.8) {
        score -= 20
        accessibility.issues.push('部分图片缺少alt属性')
      }
    }

    // 表单标签检查
    const inputTags = html.match(/<input[^>]*>/gi) || []
    const labelsCount = (html.match(/<label[^>]*>/gi) || []).length
    if (inputTags.length > labelsCount) {
      score -= 15
      accessibility.recommendations.push('建议为所有表单元素添加标签')
    }

    // 标题层级检查
    const headings = html.match(/<h[1-6][^>]*>/gi) || []
    if (headings.length === 0) {
      score -= 10
      accessibility.issues.push('缺少标题标签')
    }

    // 颜色对比度（简单检查）
    if (!html.includes('color') && !html.includes('background')) {
      accessibility.recommendations.push('建议检查颜色对比度')
    }

    accessibility.score = Math.max(score, 0)
    result.accessibility = accessibility
  }

  /**
   * 提取社交媒体信息
   * @param {string} html - HTML内容
   * @param {Object} result - 结果对象
   */
  extractSocialMedia(html, result) {
    const socialMedia = {}

    const socialPatterns = {
      facebook: /facebook\.com\/([^\/\s"']+)/i,
      twitter: /twitter\.com\/([^\/\s"']+)/i,
      instagram: /instagram\.com\/([^\/\s"']+)/i,
      linkedin: /linkedin\.com\/(?:company|in)\/([^\/\s"']+)/i,
      youtube: /youtube\.com\/(?:channel|user|c)\/([^\/\s"']+)/i,
      github: /github\.com\/([^\/\s"']+)/i
    }

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const match = html.match(pattern)
      if (match) {
        socialMedia[platform] = match[1]
      }
    }

    result.socialMedia = socialMedia
  }

  /**
   * 网站分类
   * @param {Object} result - 网站信息
   * @returns {string} 分类
   */
  categorizeWebsite(result) {
    const { title, description, keywords, url } = result

    const text = `${title} ${description} ${keywords}`.toLowerCase()

    // 分类规则
    const categories = {
      '电商购物': ['shop', 'store', 'buy', 'sell', 'cart', 'product', '购物', '商城', '电商'],
      '新闻媒体': ['news', 'media', 'press', 'article', 'journal', '新闻', '媒体', '资讯'],
      '社交网络': ['social', 'community', 'forum', 'chat', 'friend', '社交', '社区', '论坛'],
      '教育学习': ['education', 'learn', 'course', 'school', 'university', '教育', '学习', '课程'],
      '技术开发': ['tech', 'developer', 'code', 'programming', 'api', '技术', '开发', '编程'],
      '娱乐游戏': ['game', 'entertainment', 'fun', 'play', 'movie', '游戏', '娱乐', '电影'],
      '金融理财': ['finance', 'bank', 'money', 'investment', 'trading', '金融', '银行', '投资'],
      '健康医疗': ['health', 'medical', 'doctor', 'hospital', 'medicine', '健康', '医疗', '医院'],
      '旅游出行': ['travel', 'tourism', 'hotel', 'flight', 'trip', '旅游', '酒店', '机票'],
      '工具软件': ['tool', 'software', 'app', 'utility', 'service', '工具', '软件', '应用']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category
      }
    }

    // 根据域名判断
    if (url.includes('github.com') || url.includes('gitlab.com')) {
      return '技术开发'
    }
    if (url.includes('wikipedia.org')) {
      return '教育学习'
    }
    if (url.includes('youtube.com') || url.includes('netflix.com')) {
      return '娱乐游戏'
    }

    return '其他'
  }

  /**
   * 生成标签
   * @param {Object} result - 网站信息
   * @returns {Array<string>} 标签数组
   */
  generateTags(result) {
    const tags = new Set()

    // 基于分类添加标签
    tags.add(result.category)

    // 基于技术栈添加标签
    result.techStack.forEach(tech => {
      tags.add(tech.name)
    })

    // 基于关键词添加标签
    if (result.keywords) {
      const keywordList = result.keywords.split(/[,，\s]+/).filter(k => k.length > 1)
      keywordList.slice(0, 5).forEach(keyword => tags.add(keyword))
    }

    // 基于URL添加标签
    const domain = new URL(result.url).hostname
    if (domain.includes('github')) tags.add('开源')
    if (domain.includes('google')) tags.add('谷歌')
    if (domain.includes('microsoft')) tags.add('微软')

    // 基于安全性添加标签
    if (result.security?.score > 80) tags.add('安全')
    if (result.url.startsWith('https://')) tags.add('HTTPS')

    // 基于性能添加标签
    if (result.performance?.score > 80) tags.add('高性能')

    return Array.from(tags).slice(0, 10) // 限制标签数量
  }

  /**
   * 清理文本
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[\r\n\t]/g, ' ') // 替换换行符和制表符
      .trim() // 去除首尾空格
  }
}

// 创建防抖的URL验证函数
export const debouncedValidateURL = debounce(async (url, validator, callback) => {
  try {
    const result = await validator.checkAccessibility(url)
    callback(null, result)
  } catch (error) {
    callback(error, null)
  }
}, 500)

// 导出默认实例
export const urlValidator = new URLValidator()
export const websiteInfoDetector = new WebsiteInfoDetector()

// 便捷函数
export const validateURL = (url, options = {}) => {
  return urlValidator.validateFormat(url, options)
}

export const checkURLAccessibility = (url, options = {}) => {
  return urlValidator.checkAccessibility(url, options)
}

export const detectWebsiteInfo = (url, options = {}) => {
  return websiteInfoDetector.detectWebsiteInfo(url, options)
}

export default {
  URLValidator,
  WebsiteInfoDetector,
  urlValidator,
  websiteInfoDetector,
  validateURL,
  checkURLAccessibility,
  detectWebsiteInfo,
  debouncedValidateURL
}