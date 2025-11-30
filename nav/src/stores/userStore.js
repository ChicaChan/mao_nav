import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const favorites = ref([])
  const visitHistory = ref([])
  const userSearchHistory = ref([])
  const settings = ref({
    theme: 'light',
    language: 'zh-CN',
    searchEngine: 'bing'
  })

  // 计算属性
  const favoriteCount = computed(() => favorites.value.length)
  const recentVisits = computed(() => 
    visitHistory.value.slice(0, 10).sort((a, b) => 
      new Date(b.visitTime) - new Date(a.visitTime)
    )
  )

  // 方法
  const addFavorite = (site) => {
    const exists = favorites.value.find(fav => fav.id === site.id)
    if (!exists) {
      favorites.value.push({
        ...site,
        addedTime: new Date().toISOString()
      })
      saveToStorage()
    }
  }

  const removeFavorite = (siteId) => {
    const index = favorites.value.findIndex(fav => fav.id === siteId)
    if (index > -1) {
      favorites.value.splice(index, 1)
      saveToStorage()
    }
  }

  const addToHistory = (site) => {
    const existingIndex = visitHistory.value.findIndex(item => item.id === site.id)
    if (existingIndex > -1) {
      visitHistory.value.splice(existingIndex, 1)
    }
    
    visitHistory.value.unshift({
      ...site,
      visitTime: new Date().toISOString()
    })

    // 限制历史记录数量
    if (visitHistory.value.length > 100) {
      visitHistory.value = visitHistory.value.slice(0, 100)
    }
    
    saveToStorage()
  }

  const addSearchHistory = (query) => {
    if (!query.trim()) return
    
    const existingIndex = searchHistory.value.findIndex(item => item.query === query)
    if (existingIndex > -1) {
      searchHistory.value.splice(existingIndex, 1)
    }
    
    searchHistory.value.unshift({
      query,
      timestamp: new Date().toISOString()
    })

    // 限制搜索历史数量
    if (searchHistory.value.length > 50) {
      searchHistory.value = searchHistory.value.slice(0, 50)
    }
    
    saveToStorage()
  }

  const clearHistory = () => {
    visitHistory.value = []
    saveToStorage()
  }

  const clearSearchHistory = () => {
    searchHistory.value = []
    saveToStorage()
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToStorage()
  }

  // 存储到本地
  const saveToStorage = () => {
    try {
      localStorage.setItem('nav_user_data', JSON.stringify({
        favorites: favorites.value,
        visitHistory: visitHistory.value,
        searchHistory: searchHistory.value,
        settings: settings.value
      }))
    } catch (error) {
      console.warn('保存用户数据失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('nav_user_data')
      if (stored) {
        const data = JSON.parse(stored)
        favorites.value = data.favorites || []
        visitHistory.value = data.visitHistory || []
        searchHistory.value = data.searchHistory || []
        settings.value = { ...settings.value, ...data.settings }
      }
    } catch (error) {
      console.warn('加载用户数据失败:', error)
    }
  }

  // 初始化时加载数据
  loadFromStorage()

  return {
    // 状态
    favorites,
    visitHistory,
    searchHistory,
    settings,
    
    // 计算属性
    favoriteCount,
    recentVisits,
    
    // 方法
    addFavorite,
    removeFavorite,
    addToHistory,
    addSearchHistory,
    clearHistory,
    clearSearchHistory,
    updateSettings,
    loadFromStorage
  }
})