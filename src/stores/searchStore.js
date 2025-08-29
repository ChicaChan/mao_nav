import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { debounce } from '../utils/common.js'

export const useSearchStore = defineStore('search', () => {
  // 状态定义
  const searchQuery = ref('')
  const searchResults = ref([])
  const searchHistory = ref([])
  const hotSearches = ref([])
  const isSearching = ref(false)
  const searchFilters = ref({
    category: '',
    tags: []
  })

  // 计算属性
  const hasResults = computed(() => searchResults.value.length > 0)
  const hasHistory = computed(() => searchHistory.value.length > 0)
  const filteredResults = computed(() => {
    let results = searchResults.value
    
    // 按分类过滤
    if (searchFilters.value.category) {
      results = results.filter(item => 
        item.categoryId === searchFilters.value.category
      )
    }
    
    // 按标签过滤
    if (searchFilters.value.tags.length > 0) {
      results = results.filter(item => 
        searchFilters.value.tags.some(tag => 
          item.tags && item.tags.includes(tag)
        )
      )
    }
    
    return results
  })

  // 搜索方法
  const performSearch = debounce(async (query, categories = []) => {
    if (!query.trim()) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    
    try {
      // 这里将集成搜索引擎逻辑
      const results = await searchInCategories(query, categories)
      searchResults.value = results
      
      // 添加到搜索历史
      addToHistory(query)
      
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)

  // 在分类中搜索
  const searchInCategories = async (query, categories) => {
    const results = []
    const searchTerm = query.toLowerCase()
    
    categories.forEach(category => {
      category.sites.forEach(site => {
        const score = calculateRelevanceScore(site, searchTerm)
        if (score > 0) {
          results.push({
            ...site,
            categoryId: category.id,
            categoryName: category.name,
            relevanceScore: score
          })
        }
      })
    })
    
    // 按相关性排序
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  // 计算相关性评分
  const calculateRelevanceScore = (site, searchTerm) => {
    let score = 0
    const name = site.name.toLowerCase()
    const description = site.description.toLowerCase()
    const url = site.url.toLowerCase()
    
    // 名称完全匹配
    if (name === searchTerm) score += 100
    // 名称包含搜索词
    else if (name.includes(searchTerm)) score += 50
    // 描述包含搜索词
    if (description.includes(searchTerm)) score += 30
    // URL包含搜索词
    if (url.includes(searchTerm)) score += 20
    
    // 标签匹配
    if (site.tags) {
      site.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTerm)) score += 40
      })
    }
    
    return score
  }

  // 添加到搜索历史
  const addToHistory = (query) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return
    
    // 移除重复项
    const index = searchHistory.value.indexOf(trimmedQuery)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
    }
    
    // 添加到开头
    searchHistory.value.unshift(trimmedQuery)
    
    // 限制历史记录数量
    if (searchHistory.value.length > 20) {
      searchHistory.value = searchHistory.value.slice(0, 20)
    }
    
    // 保存到本地存储
    saveSearchHistory()
  }

  // 清除搜索历史
  const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('nav_search_history')
  }

  // 删除单个历史记录
  const removeFromHistory = (query) => {
    const index = searchHistory.value.indexOf(query)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
      saveSearchHistory()
    }
  }

  // 保存搜索历史到本地存储
  const saveSearchHistory = () => {
    try {
      localStorage.setItem('nav_search_history', JSON.stringify(searchHistory.value))
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  // 加载搜索历史
  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('nav_search_history')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
      searchHistory.value = []
    }
  }

  // 设置热门搜索
  const setHotSearches = (searches) => {
    hotSearches.value = searches
  }

  // 更新搜索过滤器
  const updateFilters = (filters) => {
    searchFilters.value = { ...searchFilters.value, ...filters }
  }

  // 清除搜索结果
  const clearResults = () => {
    searchResults.value = []
    searchQuery.value = ''
  }

  // 初始化
  const init = () => {
    loadSearchHistory()
  }

  return {
    // 状态
    searchQuery,
    searchResults,
    searchHistory,
    hotSearches,
    isSearching,
    searchFilters,
    
    // 计算属性
    hasResults,
    hasHistory,
    filteredResults,
    
    // 方法
    performSearch,
    addToHistory,
    clearHistory,
    removeFromHistory,
    setHotSearches,
    updateFilters,
    clearResults,
    init
  }
})