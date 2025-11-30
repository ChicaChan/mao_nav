/**
 * 网站图标抓取工具
 * 提供favicon获取、图标缓存、多源图标服务等功能
 */

import { debounce } from './common.js'

/**
 * 图标抓取器类
 */
export class IconFetcher {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000
    this.cache = new Map()
    this.cacheExpiry = options.cacheExpiry || 24 * 60 * 60 * 1000 // 24小时缓存
    this.maxCacheSize = options.maxCacheSize || 1000
    this.retryCount = options.retryCount || 2
    this.quality = options.quality || 'high' // low, medium, high
    
    // 图标服务提供商
    this.iconServices = [
      {
        name: 'Google Favicon Service',
        url: (domain, size = 32) => `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
        sizes: [16, 32, 64, 128],
        reliability: 0.95
      },
      {
        name: 'Favicon Kit',
        url: (domain, size = 32) => `https://api.faviconkit.com/${domain}/${size}`,
        sizes: [16, 32, 64, 128, 256],
        reliability: 0.85
      },
      {
        name: 'Icons8',
        url: (domain, size = 32) => `https://img.icons8.com/color/${size}/000000/domain.png`,
        sizes: [16, 32, 48, 64, 96, 128],
        reliability: 0.7
      },
      {
        name: 'Clearbit Logo API',
        url: (domain, size = 32) => `https://logo.clearbit.com/${domain}?size=${size}`,
        sizes: [32, 64, 128, 256],
        reliability: 0.8
      }
    ]
    
    // 图标格式优先级
    this.formatPriority = ['svg', 'png', 'ico', 'jpg', 'jpeg', 'gif', 'webp']
    
    // 图标大小优先级
    this.sizePriority = [32, 64, 16, 128, 48, 96, 256, 512]
  }

  /**
   * 获取网站图标
   * @param {string} url - 网站URL
   * @param {Object} options - 获取选项
   * @returns {Promise<Object>} 图标信息
   */
  async fetchIcon(url, options = {}) {
    try {
      const domain = this.extractDomain(url)
      const cacheKey = `icon_${domain}_${options.size || 32}`
      
      // 检查缓存
      const cached = this.getFromCache(cacheKey)
      if (cached && !options.forceRefresh) {
        return cached
      }

      const result = {
        domain,
        url: url,
        icon: '',
        iconUrl: '',
        iconData: null,
        size: options.size || 32,
        format: '',
        source: '',
        quality: 0,
        cached: false,
        errors: [],
        alternatives: []
      }

      // 尝试多种方法获取图标
      const methods = [
        () => this.fetchFromWebsite(url, options),
        () => this.fetchFromServices(domain, options),
        () => this.generateFallbackIcon(domain, options)
      ]

      for (const method of methods) {
        try {
          const iconResult = await method()
          if (iconResult.success) {
            Object.assign(result, iconResult.data)
            break
          } else {
            result.errors.push(...iconResult.errors)
          }
        } catch (error) {
          result.errors.push(`获取图标失败: ${error.message}`)
        }
      }

      // 缓存结果
      if (result.iconUrl) {
        this.setCache(cacheKey, result)
      }

      return result

    } catch (error) {
      return {
        domain: this.extractDomain(url),
        url: url,
        icon: '',
        iconUrl: '',
        errors: [`图标获取失败: ${error.message}`]
      }
    }
  }

  /**
   * 从网站直接获取图标
   * @param {string} url - 网站URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 获取结果
   */
  async fetchFromWebsite(url, options = {}) {
    try {
      const domain = this.extractDomain(url)
      const baseUrl = `${new URL(url).protocol}//${domain}`
      
      // 获取网页HTML
      const html = await this.fetchHTML(url)
      if (!html) {
        return { success: false, errors: ['无法获取网页内容'] }
      }

      // 解析HTML中的图标链接
      const iconLinks = this.parseIconLinks(html, baseUrl)
      
      if (iconLinks.length === 0) {
        return { success: false, errors: ['网页中未找到图标链接'] }
      }

      // 按优先级排序图标
      const sortedIcons = this.sortIconsByPriority(iconLinks)
      
      // 尝试获取最佳图标
      for (const iconLink of sortedIcons) {
        try {
          const iconData = await this.downloadIcon(iconLink.href, options)
          if (iconData.success) {
            return {
              success: true,
              data: {
                iconUrl: iconLink.href,
                iconData: iconData.data,
                format: iconLink.format,
                size: iconLink.size,
                source: 'website',
                quality: this.calculateQuality(iconLink),
                alternatives: sortedIcons.slice(1, 5).map(link => ({
                  url: link.href,
                  size: link.size,
                  format: link.format
                }))
              }
            }
          }
        } catch (error) {
          continue // 尝试下一个图标
        }
      }

      return { success: false, errors: ['所有图标链接都无法访问'] }

    } catch (error) {
      return { success: false, errors: [`从网站获取图标失败: ${error.message}`] }
    }
  }

  /**
   * 从图标服务获取图标
   * @param {string} domain - 域名
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 获取结果
   */
  async fetchFromServices(domain, options = {}) {
    const size = options.size || 32
    const preferredService = options.service
    
    // 按可靠性排序服务
    let services = [...this.iconServices].sort((a, b) => b.reliability - a.reliability)
    
    // 如果指定了服务，优先使用
    if (preferredService) {
      const service = services.find(s => s.name === preferredService)
      if (service) {
        services = [service, ...services.filter(s => s.name !== preferredService)]
      }
    }

    for (const service of services) {
      try {
        // 检查服务是否支持请求的尺寸
        const supportedSize = this.findBestSize(size, service.sizes)
        const iconUrl = service.url(domain, supportedSize)
        
        const iconData = await this.downloadIcon(iconUrl, {
          ...options,
          timeout: this.timeout / 2 // 服务超时时间较短
        })
        
        if (iconData.success) {
          return {
            success: true,
            data: {
              iconUrl: iconUrl,
              iconData: iconData.data,
              format: this.detectFormat(iconUrl, iconData.data),
              size: supportedSize,
              source: service.name,
              quality: service.reliability * 0.8, // 服务图标质量稍低
              alternatives: []
            }
          }
        }
      } catch (error) {
        continue // 尝试下一个服务
      }
    }

    return { success: false, errors: ['所有图标服务都无法提供图标'] }
  }

  /**
   * 生成备用图标
   * @param {string} domain - 域名
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateFallbackIcon(domain, options = {}) {
    try {
      const size = options.size || 32
      const letter = domain.charAt(0).toUpperCase()
      const color = this.generateColorFromDomain(domain)
      
      // 生成SVG图标
      const svg = this.generateSVGIcon(letter, color, size)
      const iconData = this.svgToDataURL(svg)
      
      return {
        success: true,
        data: {
          iconUrl: iconData,
          iconData: iconData,
          format: 'svg',
          size: size,
          source: 'generated',
          quality: 0.3, // 生成图标质量较低
          alternatives: []
        }
      }
    } catch (error) {
      return { success: false, errors: [`生成备用图标失败: ${error.message}`] }
    }
  }

  /**
   * 获取网页HTML内容
   * @param {string} url - URL
   * @returns {Promise<string>} HTML内容
   */
  async fetchHTML(url) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        throw new Error('响应不是HTML内容')
      }

      return await response.text()
    } catch (error) {
      throw new Error(`获取HTML失败: ${error.message}`)
    }
  }

  /**
   * 解析HTML中的图标链接
   * @param {string} html - HTML内容
   * @param {string} baseUrl - 基础URL
   * @returns {Array} 图标链接数组
   */
  parseIconLinks(html, baseUrl) {
    const iconLinks = []
    
    // 图标链接的正则表达式
    const linkPatterns = [
      // 标准favicon
      /<link[^>]*rel=['"](?:icon|shortcut icon)['"][^>]*href=['"]([^'"]*)['"]/gi,
      // Apple touch icon
      /<link[^>]*rel=['"]apple-touch-icon[^'"]*['"][^>]*href=['"]([^'"]*)['"]/gi,
      // 其他图标格式
      /<link[^>]*href=['"]([^'"]*)['"'][^>]*rel=['"](?:icon|shortcut icon)['"]/gi
    ]

    for (const pattern of linkPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const href = this.resolveURL(match[1], baseUrl)
        const linkTag = match[0]
        
        // 提取尺寸信息
        const sizeMatch = linkTag.match(/sizes=['"]([^'"]*)['"]/i)
        const sizes = sizeMatch ? this.parseSizes(sizeMatch[1]) : [16]
        
        // 提取类型信息
        const typeMatch = linkTag.match(/type=['"]([^'"]*)['"]/i)
        const mimeType = typeMatch ? typeMatch[1] : ''
        
        for (const size of sizes) {
          iconLinks.push({
            href: href,
            size: size,
            format: this.getFormatFromMimeType(mimeType) || this.getFormatFromURL(href),
            type: this.getIconType(linkTag),
            mimeType: mimeType
          })
        }
      }
    }

    // 如果没有找到图标链接，尝试默认路径
    if (iconLinks.length === 0) {
      const defaultPaths = [
        '/favicon.ico',
        '/favicon.png',
        '/apple-touch-icon.png',
        '/apple-touch-icon-precomposed.png'
      ]
      
      for (const path of defaultPaths) {
        iconLinks.push({
          href: baseUrl + path,
          size: 32,
          format: this.getFormatFromURL(path),
          type: 'default'
        })
      }
    }

    return iconLinks
  }

  /**
   * 按优先级排序图标
   * @param {Array} iconLinks - 图标链接数组
   * @returns {Array} 排序后的图标数组
   */
  sortIconsByPriority(iconLinks) {
    return iconLinks.sort((a, b) => {
      // 格式优先级
      const formatScoreA = this.formatPriority.indexOf(a.format)
      const formatScoreB = this.formatPriority.indexOf(b.format)
      
      if (formatScoreA !== formatScoreB) {
        return (formatScoreA === -1 ? 999 : formatScoreA) - (formatScoreB === -1 ? 999 : formatScoreB)
      }
      
      // 尺寸优先级
      const sizeScoreA = this.sizePriority.indexOf(a.size)
      const sizeScoreB = this.sizePriority.indexOf(b.size)
      
      if (sizeScoreA !== sizeScoreB) {
        return (sizeScoreA === -1 ? 999 : sizeScoreA) - (sizeScoreB === -1 ? 999 : sizeScoreB)
      }
      
      // 类型优先级
      const typeScore = {
        'apple-touch-icon': 1,
        'icon': 2,
        'shortcut icon': 3,
        'default': 4
      }
      
      return (typeScore[a.type] || 5) - (typeScore[b.type] || 5)
    })
  }

  /**
   * 下载图标
   * @param {string} iconUrl - 图标URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 下载结果
   */
  async downloadIcon(iconUrl, options = {}) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout)

      const response = await fetch(iconUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      const contentLength = parseInt(response.headers.get('content-length') || '0')
      
      // 检查文件大小（避免下载过大的文件）
      if (contentLength > 1024 * 1024) { // 1MB限制
        throw new Error('图标文件过大')
      }

      // 检查内容类型
      if (!this.isValidImageType(contentType)) {
        throw new Error(`无效的图片类型: ${contentType}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const base64 = this.arrayBufferToBase64(arrayBuffer)
      const dataURL = `data:${contentType};base64,${base64}`

      return {
        success: true,
        data: dataURL,
        contentType: contentType,
        size: arrayBuffer.byteLength
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 批量获取图标
   * @param {Array<string>} urls - URL数组
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 图标结果数组
   */
  async fetchIconsBatch(urls, options = {}) {
    const concurrency = options.concurrency || 5
    const results = []
    
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency)
      const batchPromises = batch.map(url => this.fetchIcon(url, options))
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : {
          url: '',
          icon: '',
          errors: ['批量获取失败']
        }
      ))
      
      // 避免过于频繁的请求
      if (i + concurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    return results
  }

  /**
   * 预加载图标
   * @param {Array<string>} urls - URL数组
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async preloadIcons(urls, options = {}) {
    const results = await this.fetchIconsBatch(urls, {
      ...options,
      concurrency: 3 // 预加载使用较低的并发数
    })
    
    // 统计预加载结果
    const stats = {
      total: urls.length,
      success: results.filter(r => r.iconUrl).length,
      failed: results.filter(r => r.errors?.length > 0).length,
      cached: results.filter(r => r.cached).length
    }
    
    console.log('图标预加载完成:', stats)
    return stats
  }

  /**
   * 工具方法
   */

  extractDomain(url) {
    try {
      return new URL(url).hostname
    } catch (error) {
      return url.replace(/^https?:\/\//, '').split('/')[0]
    }
  }

  resolveURL(href, baseUrl) {
    try {
      if (href.startsWith('//')) {
        return new URL(baseUrl).protocol + href
      } else if (href.startsWith('/')) {
        return new URL(baseUrl).origin + href
      } else if (href.startsWith('http')) {
        return href
      } else {
        return new URL(href, baseUrl).href
      }
    } catch (error) {
      return href
    }
  }

  parseSizes(sizesStr) {
    if (!sizesStr || sizesStr === 'any') {
      return [32]
    }
    
    return sizesStr.split(/\s+/).map(size => {
      const match = size.match(/(\d+)x?\d*/)
      return match ? parseInt(match[1]) : 32
    }).filter(size => size > 0)
  }

  getFormatFromMimeType(mimeType) {
    const mimeMap = {
      'image/x-icon': 'ico',
      'image/vnd.microsoft.icon': 'ico',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/webp': 'webp'
    }
    return mimeMap[mimeType] || ''
  }

  getFormatFromURL(url) {
    const match = url.match(/\.([a-z]+)(?:\?|$)/i)
    return match ? match[1].toLowerCase() : 'ico'
  }

  getIconType(linkTag) {
    if (linkTag.includes('apple-touch-icon')) return 'apple-touch-icon'
    if (linkTag.includes('shortcut icon')) return 'shortcut icon'
    if (linkTag.includes('icon')) return 'icon'
    return 'unknown'
  }

  findBestSize(requestedSize, availableSizes) {
    // 找到最接近请求尺寸的可用尺寸
    let bestSize = availableSizes[0]
    let minDiff = Math.abs(availableSizes[0] - requestedSize)
    
    for (const size of availableSizes) {
      const diff = Math.abs(size - requestedSize)
      if (diff < minDiff) {
        minDiff = diff
        bestSize = size
      }
    }
    
    return bestSize
  }

  calculateQuality(iconLink) {
    let quality = 0.5
    
    // 格式质量
    const formatQuality = {
      'svg': 1.0,
      'png': 0.9,
      'ico': 0.7,
      'jpg': 0.6,
      'gif': 0.5,
      'webp': 0.8
    }
    quality += (formatQuality[iconLink.format] || 0.3) * 0.4
    
    // 尺寸质量
    if (iconLink.size >= 64) quality += 0.3
    else if (iconLink.size >= 32) quality += 0.2
    else quality += 0.1
    
    // 类型质量
    if (iconLink.type === 'apple-touch-icon') quality += 0.2
    else if (iconLink.type === 'icon') quality += 0.1
    
    return Math.min(quality, 1.0)
  }

  detectFormat(url, data) {
    // 从URL检测
    const urlFormat = this.getFormatFromURL(url)
    if (urlFormat !== 'ico') return urlFormat
    
    // 从数据检测
    if (data.startsWith('data:image/')) {
      const match = data.match(/data:image\/([^;]+)/)
      return match ? match[1] : 'png'
    }
    
    return 'ico'
  }

  generateColorFromDomain(domain) {
    // 基于域名生成颜色
    let hash = 0
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  generateSVGIcon(letter, color, size) {
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}" rx="4"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
              fill="white" font-family="Arial, sans-serif" 
              font-size="${size * 0.6}" font-weight="bold">
          ${letter}
        </text>
      </svg>
    `.trim()
  }

  svgToDataURL(svg) {
    const encoded = encodeURIComponent(svg)
    return `data:image/svg+xml,${encoded}`
  }

  isValidImageType(contentType) {
    const validTypes = [
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/svg+xml',
      'image/webp'
    ]
    return validTypes.includes(contentType)
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * 缓存管理
   */

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return { ...cached.data, cached: true }
    }
    return null
  }

  setCache(key, data) {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxCacheSize) {
      // 删除最旧的缓存项
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    this.cache.set(key, {
      data: { ...data, cached: false },
      timestamp: Date.now()
    })
  }

  clearCache(force = false) {
    if (force) {
      this.cache.clear()
    } else {
      const now = Date.now()
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheExpiry) {
          this.cache.delete(key)
        }
      }
    }
  }

  getCacheStats() {
    const now = Date.now()
    let validCount = 0
    let expiredCount = 0
    let totalSize = 0
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheExpiry) {
        validCount++
      } else {
        expiredCount++
      }
      
      // 估算缓存大小
      if (value.data.iconData) {
        totalSize += value.data.iconData.length
      }
    }
    
    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      size: `${(totalSize / 1024).toFixed(2)} KB`,
      hitRate: this.cache.size > 0 ? (validCount / this.cache.size * 100).toFixed(2) + '%' : '0%'
    }
  }
}

/**
 * 图标管理器
 * 提供图标的统一管理和优化
 */
export class IconManager {
  constructor(options = {}) {
    this.fetcher = new IconFetcher(options)
    this.storage = options.storage || localStorage
    this.storageKey = options.storageKey || 'nav_icons'
    this.autoCleanup = options.autoCleanup !== false
    this.cleanupInterval = options.cleanupInterval || 24 * 60 * 60 * 1000 // 24小时
    
    if (this.autoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 获取图标（带持久化缓存）
   * @param {string} url - 网站URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 图标信息
   */
  async getIcon(url, options = {}) {
    const domain = this.fetcher.extractDomain(url)
    const storageKey = `${this.storageKey}_${domain}`
    
    // 检查持久化缓存
    if (!options.forceRefresh) {
      const stored = this.getStoredIcon(storageKey)
      if (stored) {
        return { ...stored, cached: true }
      }
    }
    
    // 获取新图标
    const result = await this.fetcher.fetchIcon(url, options)
    
    // 存储到持久化缓存
    if (result.iconUrl) {
      this.storeIcon(storageKey, result)
    }
    
    return result
  }

  /**
   * 批量获取图标
   * @param {Array<Object>} sites - 网站数组 [{url, name}]
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 图标结果数组
   */
  async getIconsBatch(sites, options = {}) {
    const results = []
    const concurrency = options.concurrency || 3
    
    for (let i = 0; i < sites.length; i += concurrency) {
      const batch = sites.slice(i, i + concurrency)
      const batchPromises = batch.map(async (site) => {
        const result = await this.getIcon(site.url, options)
        return {
          ...result,
          siteName: site.name,
          siteUrl: site.url
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : {
          siteName: '',
          siteUrl: '',
          iconUrl: '',
          errors: ['获取失败']
        }
      ))
      
      // 进度回调
      if (options.onProgress) {
        options.onProgress(Math.min(i + concurrency, sites.length), sites.length)
      }
      
      // 避免过于频繁的请求
      if (i + concurrency < sites.length) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    
    return results
  }

  /**
   * 更新图标
   * @param {string} url - 网站URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 更新结果
   */
  async updateIcon(url, options = {}) {
    return this.getIcon(url, { ...options, forceRefresh: true })
  }

  /**
   * 删除图标缓存
   * @param {string} url - 网站URL
   */
  removeIcon(url) {
    const domain = this.fetcher.extractDomain(url)
    const storageKey = `${this.storageKey}_${domain}`
    
    try {
      this.storage.removeItem(storageKey)
    } catch (error) {
      console.warn('删除图标缓存失败:', error)
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    try {
      const keys = Object.keys(this.storage)
      const prefix = this.storageKey + '_'
      const now = Date.now()
      
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          try {
            const data = JSON.parse(this.storage.getItem(key))
            if (data.timestamp && now - data.timestamp > this.fetcher.cacheExpiry) {
              this.storage.removeItem(key)
            }
          } catch (error) {
            // 删除无效的缓存项
            this.storage.removeItem(key)
          }
        }
      }
      
      // 清理内存缓存
      this.fetcher.clearCache()
      
    } catch (error) {
      console.warn('清理图标缓存失败:', error)
    }
  }

  /**
   * 获取缓存统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const memoryStats = this.fetcher.getCacheStats()
    
    // 统计持久化缓存
    let storageCount = 0
    let storageSize = 0
    
    try {
      const keys = Object.keys(this.storage)
      const prefix = this.storageKey + '_'
      
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          storageCount++
          try {
            const data = this.storage.getItem(key)
            storageSize += data.length
          } catch (error) {
            // 忽略错误
          }
        }
      }
    } catch (error) {
      // 忽略错误
    }
    
    return {
      memory: memoryStats,
      storage: {
        count: storageCount,
        size: `${(storageSize / 1024).toFixed(2)} KB`
      }
    }
  }

  /**
   * 私有方法
   */

  getStoredIcon(key) {
    try {
      const data = JSON.parse(this.storage.getItem(key))
      if (data && data.timestamp) {
        const age = Date.now() - data.timestamp
        if (age < this.fetcher.cacheExpiry) {
          return data.icon
        }
      }
    } catch (error) {
      // 忽略错误
    }
    return null
  }

  storeIcon(key, iconData) {
    try {
      const data = {
        icon: iconData,
        timestamp: Date.now()
      }
      this.storage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('存储图标失败:', error)
    }
  }

  startAutoCleanup() {
    setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }
}

// 创建防抖的图标获取函数
export const debouncedFetchIcon = debounce(async (url, fetcher, callback) => {
  try {
    const result = await fetcher.fetchIcon(url)
    callback(null, result)
  } catch (error) {
    callback(error, null)
  }
}, 300)

// 导出默认实例
export const iconFetcher = new IconFetcher()
export const iconManager = new IconManager()

// 便捷函数
export const fetchIcon = (url, options = {}) => {
  return iconManager.getIcon(url, options)
}

export const fetchIconsBatch = (sites, options = {}) => {
  return iconManager.getIconsBatch(sites, options)
}

export default {
  IconFetcher,
  IconManager,
  iconFetcher,
  iconManager,
  fetchIcon,
  fetchIconsBatch,
  debouncedFetchIcon
}