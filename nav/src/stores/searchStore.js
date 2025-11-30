import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { debounce } from '../utils/common.js'
import dayjs from 'dayjs'

// 辅助函数
const getCategoryById = (categoryId) => {
  // 这里需要从 postStore 获取数据
  // 为了避免循环依赖，我们在 store 初始化时注入这个函数
  return null
}

const getTagById = (tagId) => {
  // 这里需要从 postStore 获取数据
  // 为了避免循环依赖，我们在 store 初始化时注入这个函数
  return null
}

export const useSearchStore = defineStore('search', () => {
  // 状态定义 - 导航搜索
  const navSearchQuery = ref('')
  const navSearchResults = ref([])
  const navSearchHistory = ref([])
  const navHotSearches = ref([])
  const isNavSearching = ref(false)

  // 状态定义 - 博客搜索
  const blogSearchQuery = ref('')
  const blogSearchResults = ref([])
  const blogSearchHistory = ref([])
  const blogSearchSuggestions = ref([])
  const isBlogSearching = ref(false)
  const searchModalOpen = ref(false)

  // 通用状态
  const searchMode = ref('nav') // 'nav' | 'blog'
  const isSearching = ref(false)
  const searchError = ref(null)

  // 搜索过滤器
  const searchFilters = ref({
    category: '',
    tags: [],
    dateRange: { from: null, to: null },
    author: '',
    sortBy: 'relevance' // 'relevance' | 'date' | 'views' | 'likes'
  })

  // 计算属性 - 导航搜索
  const navHasResults = computed(() => navSearchResults.value.length > 0)
  const navHasHistory = computed(() => navSearchHistory.value.length > 0)

  // 计算属性 - 博客搜索
  const blogHasResults = computed(() => blogSearchResults.value.length > 0)
  const blogHasHistory = computed(() => blogSearchHistory.value.length > 0)
  const blogHasSuggestions = computed(() => blogSearchSuggestions.value.length > 0)

  // 计算属性 - 当前模式
  const searchQuery = computed(() =>
    searchMode.value === 'nav' ? navSearchQuery.value : blogSearchQuery.value
  )
  const searchResults = computed(() =>
    searchMode.value === 'nav' ? navSearchResults.value : blogSearchResults.value
  )
  const searchHistory = computed(() =>
    searchMode.value === 'nav' ? navSearchHistory.value : blogSearchHistory.value
  )
  const hasResults = computed(() =>
    searchMode.value === 'nav' ? navHasResults.value : blogHasResults.value
  )
  const hasHistory = computed(() =>
    searchMode.value === 'nav' ? navHasHistory.value : blogHasHistory.value
  )

  // 过滤结果 - 主要用于博客搜索
  const filteredResults = computed(() => {
    let results = searchMode.value === 'nav' ? navSearchResults.value : blogSearchResults.value

    if (searchMode.value === 'blog') {
      // 按分类过滤
      if (searchFilters.value.category) {
        results = results.filter(post =>
          post.categoryId === searchFilters.value.category
        )
      }

      // 按标签过滤
      if (searchFilters.value.tags.length > 0) {
        results = results.filter(post =>
          searchFilters.value.tags.some(tag =>
            post.tags && post.tags.includes(tag)
          )
        )
      }

      // 日期范围过滤
      if (searchFilters.value.dateRange.from) {
        const fromDate = new Date(searchFilters.value.dateRange.from)
        results = results.filter(post => new Date(post.publishedAt) >= fromDate)
      }

      if (searchFilters.value.dateRange.to) {
        const toDate = new Date(searchFilters.value.dateRange.to)
        results = results.filter(post => new Date(post.publishedAt) <= toDate)
      }

      // 作者过滤
      if (searchFilters.value.author) {
        const authorQuery = searchFilters.value.author.toLowerCase()
        results = results.filter(post =>
          post.author.toLowerCase().includes(authorQuery)
        )
      }

      // 排序
      switch (searchFilters.value.sortBy) {
        case 'date':
          results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          break
        case 'views':
          results.sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
          break
        case 'likes':
          results.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
          break
        // 'relevance' 默认已排序
      }
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