import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAnalyticsStore = defineStore('simpleAnalytics', () => {
  // 状态
  const visits = ref([])
  const siteVisits = ref({})

  // 计算属性
  const totalVisits = computed(() => visits.value.length)
  
  const todayVisits = computed(() => {
    const today = new Date().toDateString()
    return visits.value.filter(visit => 
      new Date(visit.timestamp).toDateString() === today
    ).length
  })

  // 方法
  const recordSiteVisit = (siteId, siteName, siteUrl, siteIcon, siteDescription) => {
    if (!siteVisits.value[siteId]) {
      siteVisits.value[siteId] = {
        id: siteId,
        name: siteName,
        url: siteUrl,
        icon: siteIcon,
        description: siteDescription,
        visits: []
      }
    }
    
    siteVisits.value[siteId].visits.push({
      timestamp: new Date().toISOString()
    })
    
    visits.value.push({
      siteId,
      siteName,
      timestamp: new Date().toISOString()
    })
    
    saveToStorage()
  }

  // 获取最常访问的网站
  const getMostVisitedSites = (limit = 8) => {
    const sitesWithCount = Object.values(siteVisits.value).map(site => ({
      ...site,
      visitCount: site.visits.length
    }))
    
    return sitesWithCount
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit)
  }

  // 存储到本地
  const saveToStorage = () => {
    try {
      localStorage.setItem('nav_simple_analytics_data', JSON.stringify({
        visits: visits.value,
        siteVisits: siteVisits.value
      }))
    } catch (error) {
      console.warn('保存分析数据失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('nav_simple_analytics_data')
      if (stored) {
        const data = JSON.parse(stored)
        visits.value = data.visits || []
        siteVisits.value = data.siteVisits || {}
      }
    } catch (error) {
      console.warn('加载分析数据失败:', error)
    }
  }

  // 初始化时加载数据
  loadFromStorage()

  return {
    // 状态
    visits,
    siteVisits,
    
    // 计算属性
    totalVisits,
    todayVisits,
    
    // 方法
    recordSiteVisit,
    getMostVisitedSites,
    loadFromStorage
  }
})