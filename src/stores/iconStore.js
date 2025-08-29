/**
 * 图标缓存管理 Store
 * 基于 Pinia 的图标状态管理，提供图标缓存、更新、统计等功能
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { iconManager, IconFetcher } from '../utils/iconFetcher.js'
import { debounce } from '../utils/common.js'

export const useIconStore = defineStore('icon', () => {
  // 状态定义
  const icons = ref(new Map()) // 图标缓存 Map<domain, iconData>
  const loading = ref(new Set()) // 正在加载的域名集合
  const failed = ref(new Set()) // 加载失败的域名集合
  const settings = ref({
    autoFetch: true, // 自动获取图标
    preferredSize: 32, // 首选图标尺寸
    quality: 'high', // 图标质量 low/medium/high
    fallbackEnabled: true, // 启用备用图标
    cacheExpiry: 24 * 60 * 60 * 1000, // 缓存过期时间（24小时）
    maxCacheSize: 1000, // 最大缓存数量
    batchSize: 5, // 批量处理大小
    retryCount: 2, // 重试次数
    services: [ // 启用的图标服务
      'Google Favicon Service',
      'Favicon Kit',
      'Clearbit Logo API'
    ]
  })
  const stats = ref({
    totalIcons: 0,
    cachedIcons: 0,
    failedIcons: 0,
    cacheHitRate: 0,
    lastCleanup: null,
    storageSize: '0 KB'
  })

  // 图标管理器实例
  const manager = iconManager

  // 计算属性
  const isLoading = computed(() => loading.value.size > 0)
  
  const loadingDomains = computed(() => Array.from(loading.value))
  
  const failedDomains = computed(() => Array.from(failed.value))
  
  const cachedDomains = computed(() => Array.from(icons.value.keys()))
  
  const cacheSize = computed(() => icons.value.size)
  
  const cacheStats = computed(() => {
    const total = icons.value.size
    const failed = Array.from(icons.value.values()).filter(icon => icon.errors?.length > 0).length
    const cached = Array.from(icons.value.values()).filter(icon => icon.cached).length
    
    return {
      total,
      cached,
      failed,
      success: total - failed,
      hitRate: total > 0 ? ((cached / total) * 100).toFixed(2) + '%' : '0%'
    }
  })

  // 方法定义

  /**
   * 获取图标
   * @param {string} url - 网站URL
   * @param {Object} options - 获取选项
   * @returns {Promise<Object>} 图标数据
   */
  const getIcon = async (url, options = {}) => {
    try {
      const domain = extractDomain(url)
      
      // 检查是否已在加载中
      if (loading.value.has(domain) && !options.forceRefresh) {
        return await waitForLoading(domain)
      }
      
      // 检查缓存
      if (icons.value.has(domain) && !options.forceRefresh) {
        const cached = icons.value.get(domain)
        // 检查缓存是否过期
        if (!isCacheExpired(cached)) {
          return cached
        }
      }
      
      // 开始加载
      loading.value.add(domain)
      failed.value.delete(domain)
      
      const fetchOptions = {
        size: options.size || settings.value.preferredSize,
        quality: options.quality || settings.value.quality,
        services: settings.value.services,
        retryCount: settings.value.retryCount,
        ...options
      }
      
      const result = await manager.getIcon(url, fetchOptions)
      
      // 更新缓存
      const iconData = {
        ...result,
        domain,
        timestamp: Date.now(),
        lastAccessed: Date.now()
      }
      
      icons.value.set(domain, iconData)
      
      // 更新状态
      if (result.errors?.length > 0) {
        failed.value.add(domain)
      }
      
      loading.value.delete(domain)
      
      // 更新统计
      updateStats()
      
      return iconData
      
    } catch (error) {
      const domain = extractDomain(url)
      loading.value.delete(domain)
      failed.value.add(domain)
      
      const errorData = {
        domain,
        url,
        iconUrl: '',
        errors: [error.message],
        timestamp: Date.now()
      }
      
      icons.value.set(domain, errorData)
      updateStats()
      
      return errorData
    }
  }

  /**
   * 批量获取图标
   * @param {Array<Object>} sites - 网站数组 [{url, name}]
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 图标结果数组
   */
  const getIconsBatch = async (sites, options = {}) => {
    const results = []
    const batchSize = options.batchSize || settings.value.batchSize
    const onProgress = options.onProgress
    
    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (site) => {
        try {
          const result = await getIcon(site.url, options)
          return {
            ...result,
            siteName: site.name,
            siteUrl: site.url
          }
        } catch (error) {
          return {
            domain: extractDomain(site.url),
            siteName: site.name,
            siteUrl: site.url,
            iconUrl: '',
            errors: [error.message]
          }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      const processedResults = batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : {
          siteName: '',
          siteUrl: '',
          iconUrl: '',
          errors: ['批量获取失败']
        }
      )
      
      results.push(...processedResults)
      
      // 进度回调
      if (onProgress) {
        onProgress(Math.min(i + batchSize, sites.length), sites.length)
      }
      
      // 避免过于频繁的请求
      if (i + batchSize < sites.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    return results
  }

  /**
   * 预加载图标
   * @param {Array<string>} urls - URL数组
   * @param {Object} options - 选项
   */
  const preloadIcons = async (urls, options = {}) => {
    const sites = urls.map(url => ({ url, name: extractDomain(url) }))
    
    const results = await getIconsBatch(sites, {
      ...options,
      batchSize: 3 // 预加载使用较小的批次
    })
    
    const stats = {
      total: urls.length,
      success: results.filter(r => r.iconUrl && !r.errors?.length).length,
      failed: results.filter(r => r.errors?.length > 0).length,
      cached: results.filter(r => r.cached).length
    }
    
    console.log('图标预加载完成:', stats)
    return stats
  }

  /**
   * 更新图标
   * @param {string} url - 网站URL
   * @param {Object} options - 选项
   */
  const updateIcon = async (url, options = {}) => {
    return getIcon(url, { ...options, forceRefresh: true })
  }

  /**
   * 删除图标缓存
   * @param {string} url - 网站URL或域名
   */
  const removeIcon = (url) => {
    const domain = extractDomain(url)
    icons.value.delete(domain)
    loading.value.delete(domain)
    failed.value.delete(domain)
    
    // 从持久化存储中删除
    manager.removeIcon(url)
    
    updateStats()
  }

  /**
   * 清理过期缓存
   * @param {boolean} force - 是否强制清理所有缓存
   */
  const cleanup = (force = false) => {
    const now = Date.now()
    const expiry = settings.value.cacheExpiry
    
    if (force) {
      icons.value.clear()
      loading.value.clear()
      failed.value.clear()
    } else {
      // 清理过期的图标
      for (const [domain, iconData] of icons.value.entries()) {
        if (now - iconData.timestamp > expiry) {
          icons.value.delete(domain)
          failed.value.delete(domain)
        }
      }
      
      // 清理长时间加载的域名
      for (const domain of loading.value) {
        const iconData = icons.value.get(domain)
        if (!iconData || now - iconData.timestamp > 60000) { // 1分钟超时
          loading.value.delete(domain)
        }
      }
    }
    
    // 清理持久化缓存
    manager.cleanup(force)
    
    stats.value.lastCleanup = new Date()
    updateStats()
  }

  /**
   * 获取图标URL（同步方法）
   * @param {string} url - 网站URL
   * @param {Object} options - 选项
   * @returns {string} 图标URL
   */
  const getIconUrl = (url, options = {}) => {
    const domain = extractDomain(url)
    const iconData = icons.value.get(domain)
    
    if (iconData && iconData.iconUrl && !isCacheExpired(iconData)) {
      // 更新最后访问时间
      iconData.lastAccessed = Date.now()
      return iconData.iconUrl
    }
    
    // 如果启用自动获取且未在加载中，则异步获取
    if (settings.value.autoFetch && !loading.value.has(domain)) {
      getIcon(url, options).catch(console.warn)
    }
    
    // 返回备用图标或空字符串
    if (settings.value.fallbackEnabled) {
      return generateFallbackIcon(domain, options.size || settings.value.preferredSize)
    }
    
    return ''
  }

  /**
   * 检查图标是否存在
   * @param {string} url - 网站URL
   * @returns {boolean} 是否存在
   */
  const hasIcon = (url) => {
    const domain = extractDomain(url)
    const iconData = icons.value.get(domain)
    return iconData && iconData.iconUrl && !isCacheExpired(iconData)
  }

  /**
   * 检查图标是否正在加载
   * @param {string} url - 网站URL
   * @returns {boolean} 是否正在加载
   */
  const isIconLoading = (url) => {
    const domain = extractDomain(url)
    return loading.value.has(domain)
  }

  /**
   * 检查图标是否加载失败
   * @param {string} url - 网站URL
   * @returns {boolean} 是否加载失败
   */
  const isIconFailed = (url) => {
    const domain = extractDomain(url)
    return failed.value.has(domain)
  }

  /**
   * 获取图标加载状态
   * @param {string} url - 网站URL
   * @returns {string} 状态：'loading' | 'success' | 'failed' | 'none'
   */
  const getIconStatus = (url) => {
    const domain = extractDomain(url)
    
    if (loading.value.has(domain)) return 'loading'
    if (failed.value.has(domain)) return 'failed'
    if (hasIcon(url)) return 'success'
    return 'none'
  }

  /**
   * 重试失败的图标
   * @param {string} url - 网站URL（可选，不传则重试所有失败的）
   */
  const retryFailed = async (url = null) => {
    const domainsToRetry = url ? [extractDomain(url)] : Array.from(failed.value)
    
    for (const domain of domainsToRetry) {
      const iconData = icons.value.get(domain)
      if (iconData) {
        await getIcon(iconData.url || `https://${domain}`, { forceRefresh: true })
      }
    }
  }

  /**
   * 导出图标数据
   * @param {string} format - 导出格式 'json' | 'csv'
   * @returns {string} 导出数据
   */
  const exportIcons = (format = 'json') => {
    const data = Array.from(icons.value.entries()).map(([domain, iconData]) => ({
      domain,
      url: iconData.url,
      iconUrl: iconData.iconUrl,
      size: iconData.size,
      format: iconData.format,
      source: iconData.source,
      quality: iconData.quality,
      cached: iconData.cached,
      timestamp: iconData.timestamp,
      lastAccessed: iconData.lastAccessed,
      errors: iconData.errors || []
    }))
    
    if (format === 'csv') {
      const headers = ['domain', 'url', 'iconUrl', 'size', 'format', 'source', 'quality', 'cached', 'timestamp', 'errors']
      const csvRows = [
        headers.join(','),
        ...data.map(item => headers.map(header => {
          const value = item[header]
          if (Array.isArray(value)) return `"${value.join('; ')}"`
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`
          return value || ''
        }).join(','))
      ]
      return csvRows.join('\n')
    }
    
    return JSON.stringify(data, null, 2)
  }

  /**
   * 导入图标数据
   * @param {string} data - 导入数据
   * @param {string} format - 数据格式 'json' | 'csv'
   */
  const importIcons = (data, format = 'json') => {
    try {
      let importData = []
      
      if (format === 'json') {
        importData = JSON.parse(data)
      } else if (format === 'csv') {
        const lines = data.split('\n')
        const headers = lines[0].split(',')
        importData = lines.slice(1).map(line => {
          const values = line.split(',')
          const item = {}
          headers.forEach((header, index) => {
            item[header] = values[index] || ''
          })
          return item
        })
      }
      
      // 导入数据到缓存
      for (const item of importData) {
        if (item.domain && item.iconUrl) {
          icons.value.set(item.domain, {
            ...item,
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            imported: true
          })
        }
      }
      
      updateStats()
      return { success: true, count: importData.length }
      
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 更新设置
   * @param {Object} newSettings - 新设置
   */
  const updateSettings = (newSettings) => {
    Object.assign(settings.value, newSettings)
    
    // 保存到本地存储
    try {
      localStorage.setItem('nav_icon_settings', JSON.stringify(settings.value))
    } catch (error) {
      console.warn('保存图标设置失败:', error)
    }
  }

  /**
   * 重置设置
   */
  const resetSettings = () => {
    settings.value = {
      autoFetch: true,
      preferredSize: 32,
      quality: 'high',
      fallbackEnabled: true,
      cacheExpiry: 24 * 60 * 60 * 1000,
      maxCacheSize: 1000,
      batchSize: 5,
      retryCount: 2,
      services: [
        'Google Favicon Service',
        'Favicon Kit',
        'Clearbit Logo API'
      ]
    }
    
    try {
      localStorage.removeItem('nav_icon_settings')
    } catch (error) {
      console.warn('删除图标设置失败:', error)
    }
  }

  // 工具函数

  /**
   * 提取域名
   * @param {string} url - URL
   * @returns {string} 域名
   */
  const extractDomain = (url) => {
    try {
      return new URL(url).hostname
    } catch (error) {
      return url.replace(/^https?:\/\//, '').split('/')[0]
    }
  }

  /**
   * 检查缓存是否过期
   * @param {Object} iconData - 图标数据
   * @returns {boolean} 是否过期
   */
  const isCacheExpired = (iconData) => {
    if (!iconData.timestamp) return true
    return Date.now() - iconData.timestamp > settings.value.cacheExpiry
  }

  /**
   * 等待加载完成
   * @param {string} domain - 域名
   * @returns {Promise<Object>} 图标数据
   */
  const waitForLoading = (domain) => {
    return new Promise((resolve) => {
      const checkLoading = () => {
        if (!loading.value.has(domain)) {
          resolve(icons.value.get(domain) || { domain, iconUrl: '', errors: ['加载超时'] })
        } else {
          setTimeout(checkLoading, 100)
        }
      }
      checkLoading()
    })
  }

  /**
   * 生成备用图标
   * @param {string} domain - 域名
   * @param {number} size - 尺寸
   * @returns {string} 图标URL
   */
  const generateFallbackIcon = (domain, size = 32) => {
    const letter = domain.charAt(0).toUpperCase()
    const color = generateColorFromDomain(domain)
    
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}" rx="4"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
              fill="white" font-family="Arial, sans-serif" 
              font-size="${size * 0.6}" font-weight="bold">
          ${letter}
        </text>
      </svg>
    `.trim()
    
    const encoded = encodeURIComponent(svg)
    return `data:image/svg+xml,${encoded}`
  }

  /**
   * 基于域名生成颜色
   * @param {string} domain - 域名
   * @returns {string} 颜色值
   */
  const generateColorFromDomain = (domain) => {
    let hash = 0
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  /**
   * 更新统计信息
   */
  const updateStats = debounce(() => {
    const managerStats = manager.getStats()
    
    stats.value = {
      totalIcons: icons.value.size,
      cachedIcons: Array.from(icons.value.values()).filter(icon => icon.cached).length,
      failedIcons: failed.value.size,
      cacheHitRate: cacheStats.value.hitRate,
      lastCleanup: stats.value.lastCleanup,
      storageSize: managerStats.storage?.size || '0 KB',
      memoryStats: managerStats.memory
    }
  }, 1000)

  // 初始化
  const init = () => {
    // 加载设置
    try {
      const savedSettings = localStorage.getItem('nav_icon_settings')
      if (savedSettings) {
        Object.assign(settings.value, JSON.parse(savedSettings))
      }
    } catch (error) {
      console.warn('加载图标设置失败:', error)
    }
    
    // 定期清理过期缓存
    setInterval(() => {
      cleanup()
    }, 60 * 60 * 1000) // 每小时清理一次
    
    // 更新统计
    updateStats()
  }

  // 监听设置变化
  watch(settings, (newSettings) => {
    try {
      localStorage.setItem('nav_icon_settings', JSON.stringify(newSettings))
    } catch (error) {
      console.warn('保存图标设置失败:', error)
    }
  }, { deep: true })

  // 初始化
  init()

  // 返回 store 接口
  return {
    // 状态
    icons: computed(() => icons.value),
    loading: computed(() => loading.value),
    failed: computed(() => failed.value),
    settings: computed(() => settings.value),
    stats: computed(() => stats.value),
    
    // 计算属性
    isLoading,
    loadingDomains,
    failedDomains,
    cachedDomains,
    cacheSize,
    cacheStats,
    
    // 方法
    getIcon,
    getIconsBatch,
    preloadIcons,
    updateIcon,
    removeIcon,
    cleanup,
    getIconUrl,
    hasIcon,
    isIconLoading,
    isIconFailed,
    getIconStatus,
    retryFailed,
    exportIcons,
    importIcons,
    updateSettings,
    resetSettings
  }
})

export default useIconStore