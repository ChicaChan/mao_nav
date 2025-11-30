import { ref } from 'vue'
import { mockData } from '../mock/mock_data.js'
import { useAnalyticsStore } from '../stores/simpleAnalyticsStore.js'

export function useNavigation() {
  const categories = ref([])
  const title = ref('')
  const loading = ref(false)
  const error = ref(null)

  const fetchCategories = async () => {
    loading.value = true
    error.value = null

    try {
      // 开发环境模拟网络延迟
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 获取分析数据存储
      const analyticsStore = useAnalyticsStore()
      
      // 获取最常访问的网站
      const mostVisitedSites = analyticsStore.getMostVisitedSites(8)
      
      // 创建"我的常用"分类
      const myFavoritesCategory = {
        id: 'my-favorites',
        name: '我的常用',
        icon: '⭐',
        order: -1, // 确保排在最前面
        sites: mostVisitedSites.length > 0 ? mostVisitedSites : [
          // 如果没有访问记录，显示默认推荐
          {
            id: 'default-google',
            name: 'Google',
            url: 'https://www.google.com',
            description: '全球最大的搜索引擎',
            icon: '/sitelogo/www.google.com.ico'
          },
          {
            id: 'default-github',
            name: 'GitHub',
            url: 'https://github.com',
            description: '代码托管平台',
            icon: '/sitelogo/github.com.ico'
          },
          {
            id: 'default-chatgpt',
            name: 'ChatGPT',
            url: 'https://chat.openai.com',
            description: 'OpenAI对话AI',
            icon: '/sitelogo/chat.openai.com.ico'
          }
        ]
      }

      // 合并"我的常用"和其他分类
      const allCategories = [myFavoritesCategory, ...mockData.categories]
      
      // 按order排序
      categories.value = allCategories.sort((a, b) => (a.order || 0) - (b.order || 0))
      title.value = mockData.title

      // 动态设置页面标题
      document.title = title.value

    } catch (err) {
      error.value = err.message
      console.error('Error fetching categories:', err)
      // 兜底：始终返回 mock 数据
      categories.value = mockData.categories
      title.value = mockData.title
      document.title = title.value
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    title,
    loading,
    error,
    fetchCategories
  }
}
