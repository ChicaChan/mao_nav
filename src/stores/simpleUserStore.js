import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('simpleUser', () => {
  // 状态
  const favorites = ref([])
  const visitHistory = ref([])
  const settings = ref({
    theme: 'light',
    language: 'zh-CN'
  })

  // 计算属性
  const favoriteCount = computed(() => favorites.value.length)

  // 方法
  const addFavorite = (site) => {
    const exists = favorites.value.find(fav => fav.id === site.id)
    if (!exists) {
      favorites.value.push({
        ...site,
        addedTime: new Date().toISOString()
      })
      saveToStorage()
      return true // 收藏成功
    }
    return false // 已经收藏过
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

  // 存储到本地
  const saveToStorage = () => {
    try {
      localStorage.setItem('nav_simple_user_data', JSON.stringify({
        favorites: favorites.value,
        visitHistory: visitHistory.value,
        settings: settings.value
      }))
    } catch (error) {
      console.warn('保存用户数据失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('nav_simple_user_data')
      if (stored) {
        const data = JSON.parse(stored)
        favorites.value = data.favorites || []
        visitHistory.value = data.visitHistory || []
        settings.value = { ...settings.value, ...data.settings }
      }
    } catch (error) {
      console.warn('加载用户数据失败:', error)
    }
  }

  // 初始化时加载数据
  loadFromStorage()

  // 检查是否已收藏
  const isFavorited = (siteId) => {
    return favorites.value.some(fav => fav.id === siteId)
  }

  return {
    // 状态
    favorites,
    visitHistory,
    settings,
    
    // 计算属性
    favoriteCount,
    
    // 方法
    addFavorite,
    removeFavorite,
    addToHistory,
    loadFromStorage,
    isFavorited
  }
})