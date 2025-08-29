import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAnalyticsStore = defineStore('analytics', () => {
  // 状态
  const visits = ref([])
  const siteVisits = ref({})
  const searchQueries = ref([])
  const sessionStart = ref(new Date().toISOString())

  // 计算属性
  const totalVisits = computed(() => visits.value.length)
  
  const todayVisits = computed(() => {
    const today = new Date().toDateString()
    return visits.value.filter(visit => 
      new Date(visit.timestamp).toDateString() === today
    ).length
  })

  const popularSites = computed(() => {
    const siteStats = Object.entries(siteVisits.value)
      .map(([siteId, data]) => ({
        siteId,
        name: data.name,
        url: data.url,
        count: data.visits.length,
        lastVisit: data.visits[data.visits.length - 1]?.timestamp
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return siteStats
  })

  const recentSearches = computed(() => 
    searchQueries.value
      .slice(-10)
      .reverse()
  )

  // 方法
  const recordPageVisit = (page = 'home') => {
    visits.value.push({
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    })
    
    saveToStorage()
  }

  const recordSiteVisit = (siteId, siteName, siteUrl) => {
    if (!siteVisits.value[siteId]) {
      siteVisits.value[siteId] = {
        name: siteName,
        url: siteUrl,
        visits: []
      }
    }
    
    siteVisits.value[siteId].visits.push({
      timestamp: new Date().toISOString(),
      referrer: window.location.href
    })
    
    // 同时记录到总访问记录
    recordPageVisit(`site:${siteId}`)
    
    saveToStorage()
  }

  const recordSearch = (query, engine = 'default') => {
    searchQueries.value.push({
      query,
      engine,
      timestamp: new Date().toISOString()
    })
    
    // 限制搜索记录数量
    if (searchQueries.value.length > 1000) {
      searchQueries.value = searchQueries.value.slice(-500)
    }
    
    saveToStorage()
  }

  const getVisitStats = (days = 7) => {
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    const recentVisits = visits.value.filter(visit => 
      new Date(visit.timestamp) >= startDate
    )
    
    const dailyStats = {}
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toDateString()
      dailyStats[dateStr] = recentVisits.filter(visit => 
        new Date(visit.timestamp).toDateString() === dateStr
      ).length
    }
    
    return dailyStats
  }

  const clearAnalytics = () => {
    visits.value = []
    siteVisits.value = {}
    searchQueries.value = []
    saveToStorage()
  }

  // 存储到本地
  const saveToStorage = () => {
    try {
      localStorage.setItem('nav_analytics_data', JSON.stringify({
        visits: visits.value,
        siteVisits: siteVisits.value,
        searchQueries: searchQueries.value,
        sessionStart: sessionStart.value
      }))
    } catch (error) {
      console.warn('保存分析数据失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('nav_analytics_data')
      if (stored) {
        const data = JSON.parse(stored)
        visits.value = data.visits || []
        siteVisits.value = data.siteVisits || {}
        searchQueries.value = data.searchQueries || []
        sessionStart.value = data.sessionStart || new Date().toISOString()
      }
    } catch (error) {
      console.warn('加载分析数据失败:', error)
    }
  }

  // 初始化时加载数据并记录页面访问
  loadFromStorage()
  recordPageVisit('home')

  return {
    // 状态
    visits,
    siteVisits,
    searchQueries,
    sessionStart,
    
    // 计算属性
    totalVisits,
    todayVisits,
    popularSites,
    recentSearches,
    
    // 方法
    recordPageVisit,
    recordSiteVisit,
    recordSearch,
    getVisitStats,
    clearAnalytics,
    loadFromStorage
  }
})