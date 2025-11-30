// 数据分析工具类
import { useAnalyticsStore } from '../stores/analyticsStore.js'

// 统计计算工具
export class StatisticsCalculator {
  // 计算平均值
  static average(numbers) {
    if (!numbers || numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  // 计算中位数
  static median(numbers) {
    if (!numbers || numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid]
  }

  // 计算标准差
  static standardDeviation(numbers) {
    if (!numbers || numbers.length === 0) return 0
    const avg = this.average(numbers)
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2))
    return Math.sqrt(this.average(squaredDiffs))
  }

  // 计算百分位数
  static percentile(numbers, percentile) {
    if (!numbers || numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const index = (percentile / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1
    
    if (upper >= sorted.length) return sorted[sorted.length - 1]
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  // 计算增长率
  static growthRate(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return ((newValue - oldValue) / oldValue) * 100
  }

  // 计算移动平均
  static movingAverage(numbers, windowSize) {
    if (!numbers || numbers.length < windowSize) return []
    
    const result = []
    for (let i = windowSize - 1; i < numbers.length; i++) {
      const window = numbers.slice(i - windowSize + 1, i + 1)
      result.push(this.average(window))
    }
    return result
  }
}

// 时间序列分析
export class TimeSeriesAnalyzer {
  constructor(data) {
    this.data = data || []
  }

  // 检测趋势
  detectTrend() {
    if (this.data.length < 2) return 'insufficient_data'
    
    const values = this.data.map(item => item.value || 0)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = StatisticsCalculator.average(firstHalf)
    const secondAvg = StatisticsCalculator.average(secondHalf)
    
    const threshold = 0.05 // 5% 变化阈值
    const changeRate = Math.abs(secondAvg - firstAvg) / firstAvg
    
    if (changeRate < threshold) return 'stable'
    return secondAvg > firstAvg ? 'increasing' : 'decreasing'
  }

  // 检测季节性
  detectSeasonality(period = 7) {
    if (this.data.length < period * 2) return false
    
    const values = this.data.map(item => item.value || 0)
    const correlations = []
    
    for (let lag = 1; lag <= period; lag++) {
      const correlation = this.calculateCorrelation(values, lag)
      correlations.push({ lag, correlation })
    }
    
    // 寻找最高相关性
    const maxCorrelation = Math.max(...correlations.map(c => Math.abs(c.correlation)))
    return maxCorrelation > 0.5 // 相关性阈值
  }

  // 计算自相关性
  calculateCorrelation(values, lag) {
    if (values.length <= lag) return 0
    
    const n = values.length - lag
    const x = values.slice(0, n)
    const y = values.slice(lag)
    
    const meanX = StatisticsCalculator.average(x)
    const meanY = StatisticsCalculator.average(y)
    
    let numerator = 0
    let sumXSquared = 0
    let sumYSquared = 0
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX
      const deltaY = y[i] - meanY
      numerator += deltaX * deltaY
      sumXSquared += deltaX * deltaX
      sumYSquared += deltaY * deltaY
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared)
    return denominator === 0 ? 0 : numerator / denominator
  }

  // 异常值检测
  detectAnomalies(threshold = 2) {
    if (this.data.length < 3) return []
    
    const values = this.data.map(item => item.value || 0)
    const mean = StatisticsCalculator.average(values)
    const stdDev = StatisticsCalculator.standardDeviation(values)
    
    const anomalies = []
    this.data.forEach((item, index) => {
      const value = item.value || 0
      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > threshold) {
        anomalies.push({
          index,
          item,
          zScore,
          deviation: value - mean
        })
      }
    })
    
    return anomalies
  }

  // 预测下一个值（简单线性回归）
  predictNext() {
    if (this.data.length < 2) return null
    
    const n = this.data.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = this.data.map(item => item.value || 0)
    
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return slope * n + intercept
  }
}

// 用户行为分析器
export class UserBehaviorAnalyzer {
  constructor(analyticsStore) {
    this.store = analyticsStore || useAnalyticsStore()
  }

  // 分析用户参与度
  analyzeEngagement() {
    const sessions = this.store.userSessions
    if (sessions.length === 0) return null
    
    const durations = sessions.map(s => s.duration || 0)
    const pageViews = sessions.map(s => s.pageViews || 0)
    const clicks = sessions.map(s => s.clicks || 0)
    
    return {
      averageSessionDuration: StatisticsCalculator.average(durations),
      medianSessionDuration: StatisticsCalculator.median(durations),
      averagePageViews: StatisticsCalculator.average(pageViews),
      averageClicks: StatisticsCalculator.average(clicks),
      engagementScore: this.calculateEngagementScore(sessions)
    }
  }

  // 计算参与度分数
  calculateEngagementScore(sessions) {
    if (sessions.length === 0) return 0
    
    let totalScore = 0
    sessions.forEach(session => {
      let score = 0
      
      // 会话时长权重 (40%)
      const duration = (session.duration || 0) / 1000 / 60 // 转换为分钟
      score += Math.min(duration / 10, 1) * 40 // 10分钟为满分
      
      // 页面浏览数权重 (30%)
      const pageViews = session.pageViews || 0
      score += Math.min(pageViews / 5, 1) * 30 // 5个页面为满分
      
      // 点击数权重 (20%)
      const clicks = session.clicks || 0
      score += Math.min(clicks / 10, 1) * 20 // 10次点击为满分
      
      // 搜索数权重 (10%)
      const searches = session.searches || 0
      score += Math.min(searches / 3, 1) * 10 // 3次搜索为满分
      
      totalScore += score
    })
    
    return totalScore / sessions.length
  }

  // 分析用户路径
  analyzeUserPaths() {
    const pageViews = this.store.pageViews
    const paths = new Map()
    
    // 按会话分组页面访问
    const sessionPages = new Map()
    pageViews.forEach(view => {
      const sessionId = view.sessionId
      if (!sessionPages.has(sessionId)) {
        sessionPages.set(sessionId, [])
      }
      sessionPages.get(sessionId).push(view.page)
    })
    
    // 分析路径模式
    sessionPages.forEach(pages => {
      for (let i = 0; i < pages.length - 1; i++) {
        const from = pages[i]
        const to = pages[i + 1]
        const pathKey = `${from} -> ${to}`
        
        paths.set(pathKey, (paths.get(pathKey) || 0) + 1)
      }
    })
    
    // 转换为数组并排序
    return Array.from(paths.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // 返回前20个路径
  }

  // 分析跳出率
  analyzeBounceRate() {
    const sessions = this.store.userSessions
    if (sessions.length === 0) return 0
    
    const bouncedSessions = sessions.filter(session => 
      (session.pageViews || 0) <= 1
    ).length
    
    return (bouncedSessions / sessions.length) * 100
  }

  // 分析用户留存
  analyzeRetention(days = 7) {
    const sessions = this.store.userSessions
    const visitorSessions = new Map()
    
    // 按访客分组会话
    sessions.forEach(session => {
      const visitorId = session.visitorId
      if (!visitorSessions.has(visitorId)) {
        visitorSessions.set(visitorId, [])
      }
      visitorSessions.get(visitorId).push(new Date(session.startTime))
    })
    
    const retention = []
    const now = new Date()
    
    for (let day = 1; day <= days; day++) {
      const targetDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)
      let activeVisitors = 0
      let returningVisitors = 0
      
      visitorSessions.forEach(dates => {
        const hasActivityOnDay = dates.some(date => 
          date.toDateString() === targetDate.toDateString()
        )
        
        if (hasActivityOnDay) {
          activeVisitors++
          
          // 检查是否有后续访问
          const hasLaterActivity = dates.some(date => date > targetDate)
          if (hasLaterActivity) {
            returningVisitors++
          }
        }
      })
      
      retention.push({
        day,
        date: targetDate.toISOString().split('T')[0],
        activeVisitors,
        returningVisitors,
        retentionRate: activeVisitors > 0 ? (returningVisitors / activeVisitors) * 100 : 0
      })
    }
    
    return retention.reverse()
  }
}

// 内容分析器
export class ContentAnalyzer {
  constructor(analyticsStore) {
    this.store = analyticsStore || useAnalyticsStore()
  }

  // 分析热门内容
  analyzePopularContent() {
    const clickEvents = this.store.clickEvents
    const contentStats = new Map()
    
    clickEvents.forEach(click => {
      if (click.siteUrl) {
        const key = click.siteUrl
        if (!contentStats.has(key)) {
          contentStats.set(key, {
            url: click.siteUrl,
            name: click.siteName || 'Unknown',
            category: click.category || 'Uncategorized',
            clicks: 0,
            uniqueSessions: new Set()
          })
        }
        
        const stats = contentStats.get(key)
        stats.clicks++
        if (click.sessionId) {
          stats.uniqueSessions.add(click.sessionId)
        }
      }
    })
    
    // 转换为数组并计算指标
    return Array.from(contentStats.values())
      .map(stats => ({
        ...stats,
        uniqueSessions: stats.uniqueSessions.size,
        clickThroughRate: stats.uniqueSessions.size > 0 
          ? (stats.clicks / stats.uniqueSessions.size).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.clicks - a.clicks)
  }

  // 分析分类表现
  analyzeCategoryPerformance() {
    const clickEvents = this.store.clickEvents
    const categoryStats = new Map()
    
    clickEvents.forEach(click => {
      if (click.category) {
        const category = click.category
        if (!categoryStats.has(category)) {
          categoryStats.set(category, {
            category,
            clicks: 0,
            uniqueSites: new Set(),
            uniqueSessions: new Set()
          })
        }
        
        const stats = categoryStats.get(category)
        stats.clicks++
        if (click.siteUrl) {
          stats.uniqueSites.add(click.siteUrl)
        }
        if (click.sessionId) {
          stats.uniqueSessions.add(click.sessionId)
        }
      }
    })
    
    return Array.from(categoryStats.values())
      .map(stats => ({
        ...stats,
        uniqueSites: stats.uniqueSites.size,
        uniqueSessions: stats.uniqueSessions.size,
        averageClicksPerSite: stats.uniqueSites.size > 0 
          ? (stats.clicks / stats.uniqueSites.size).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.clicks - a.clicks)
  }

  // 分析搜索行为
  analyzeSearchBehavior() {
    const searchEvents = this.store.searchEvents
    if (searchEvents.length === 0) return null
    
    const queryStats = new Map()
    const resultCounts = []
    
    searchEvents.forEach(search => {
      const query = search.query.toLowerCase()
      if (!queryStats.has(query)) {
        queryStats.set(query, {
          query: search.query,
          count: 0,
          totalResults: 0,
          sessions: new Set()
        })
      }
      
      const stats = queryStats.get(query)
      stats.count++
      stats.totalResults += search.resultsCount || 0
      if (search.sessionId) {
        stats.sessions.add(search.sessionId)
      }
      
      resultCounts.push(search.resultsCount || 0)
    })
    
    const topQueries = Array.from(queryStats.values())
      .map(stats => ({
        ...stats,
        uniqueSessions: stats.sessions.size,
        averageResults: stats.count > 0 ? (stats.totalResults / stats.count).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      totalSearches: searchEvents.length,
      uniqueQueries: queryStats.size,
      averageResultsPerSearch: StatisticsCalculator.average(resultCounts),
      topQueries,
      noResultsRate: (searchEvents.filter(s => (s.resultsCount || 0) === 0).length / searchEvents.length) * 100
    }
  }
}

// 性能分析器
export class PerformanceAnalyzer {
  constructor() {
    this.metrics = new Map()
  }

  // 记录性能指标
  recordMetric(name, value, timestamp = new Date()) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name).push({
      value,
      timestamp: timestamp.toISOString()
    })
    
    // 限制数据点数量
    const data = this.metrics.get(name)
    if (data.length > 1000) {
      this.metrics.set(name, data.slice(-1000))
    }
  }

  // 分析页面加载性能
  analyzePageLoadPerformance() {
    if (!window.performance || !window.performance.timing) {
      return null
    }
    
    const timing = window.performance.timing
    const navigation = window.performance.navigation
    
    return {
      navigationStart: timing.navigationStart,
      domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
      connect: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      domProcessing: timing.domComplete - timing.domLoading,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount
    }
  }

  // 获取性能统计
  getMetricStats(name) {
    const data = this.metrics.get(name)
    if (!data || data.length === 0) return null
    
    const values = data.map(item => item.value)
    
    return {
      count: values.length,
      average: StatisticsCalculator.average(values),
      median: StatisticsCalculator.median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      standardDeviation: StatisticsCalculator.standardDeviation(values),
      percentile95: StatisticsCalculator.percentile(values, 95)
    }
  }

  // 清理旧数据
  cleanup(retentionHours = 24) {
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000)
    
    this.metrics.forEach((data, name) => {
      const filteredData = data.filter(item => 
        new Date(item.timestamp) >= cutoffTime
      )
      this.metrics.set(name, filteredData)
    })
  }
}

// 报告生成器
export class ReportGenerator {
  constructor(analyticsStore) {
    this.store = analyticsStore || useAnalyticsStore()
    this.userBehaviorAnalyzer = new UserBehaviorAnalyzer(this.store)
    this.contentAnalyzer = new ContentAnalyzer(this.store)
  }

  // 生成综合报告
  generateComprehensiveReport(startDate, endDate) {
    const events = this.store.getEventsByDateRange(startDate, endDate)
    const sessions = this.store.getSessionsByDateRange(startDate, endDate)
    
    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      overview: {
        totalEvents: events.length,
        totalSessions: sessions.length,
        uniqueVisitors: new Set(sessions.map(s => s.visitorId)).size,
        pageViews: events.filter(e => e.type === 'page_view').length,
        clicks: events.filter(e => e.type === 'click').length,
        searches: events.filter(e => e.type === 'search').length
      },
      engagement: this.userBehaviorAnalyzer.analyzeEngagement(),
      content: this.contentAnalyzer.analyzePopularContent().slice(0, 10),
      categories: this.contentAnalyzer.analyzeCategoryPerformance().slice(0, 10),
      search: this.contentAnalyzer.analyzeSearchBehavior(),
      userPaths: this.userBehaviorAnalyzer.analyzeUserPaths().slice(0, 10),
      retention: this.userBehaviorAnalyzer.analyzeRetention(7),
      generatedAt: new Date().toISOString()
    }
  }

  // 生成实时报告
  generateRealTimeReport() {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    return this.generateComprehensiveReport(oneDayAgo, now)
  }

  // 导出报告为JSON
  exportReportAsJSON(report) {
    return JSON.stringify(report, null, 2)
  }

  // 导出报告为CSV
  exportReportAsCSV(report) {
    const lines = []
    
    // 添加概览数据
    lines.push('Metric,Value')
    Object.entries(report.overview).forEach(([key, value]) => {
      lines.push(`${key},${value}`)
    })
    
    lines.push('') // 空行
    
    // 添加热门内容
    if (report.content && report.content.length > 0) {
      lines.push('Popular Content')
      lines.push('Name,URL,Category,Clicks,Unique Sessions')
      report.content.forEach(item => {
        lines.push(`"${item.name}","${item.url}","${item.category}",${item.clicks},${item.uniqueSessions}`)
      })
    }
    
    return lines.join('\n')
  }
}

// 导出所有分析工具
export {
  StatisticsCalculator,
  TimeSeriesAnalyzer,
  UserBehaviorAnalyzer,
  ContentAnalyzer,
  PerformanceAnalyzer,
  ReportGenerator
}

// 便捷函数
export const createAnalyzer = (type, ...args) => {
  switch (type) {
    case 'statistics':
      return StatisticsCalculator
    case 'timeSeries':
      return new TimeSeriesAnalyzer(...args)
    case 'userBehavior':
      return new UserBehaviorAnalyzer(...args)
    case 'content':
      return new ContentAnalyzer(...args)
    case 'performance':
      return new PerformanceAnalyzer(...args)
    case 'report':
      return new ReportGenerator(...args)
    default:
      throw new Error(`Unknown analyzer type: ${type}`)
  }
}