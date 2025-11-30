import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { generateId, deepClone } from '../utils/common.js'

export const useCategoryStore = defineStore('category', () => {
  // 状态定义
  const categories = ref([])
  const tags = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedCategory = ref(null)
  const expandedCategories = ref(new Set())

  // 计算属性
  const categoriesTree = computed(() => {
    return buildCategoryTree(categories.value)
  })

  const allTags = computed(() => {
    const tagSet = new Set()
    categories.value.forEach(category => {
      if (category.tags) {
        category.tags.forEach(tag => tagSet.add(tag))
      }
      if (category.sites) {
        category.sites.forEach(site => {
          if (site.tags) {
            site.tags.forEach(tag => tagSet.add(tag))
          }
        })
      }
    })
    return Array.from(tagSet).sort()
  })

  const categoryStats = computed(() => {
    return categories.value.map(category => ({
      id: category.id,
      name: category.name,
      siteCount: category.sites ? category.sites.length : 0,
      tagCount: category.tags ? category.tags.length : 0,
      hasChildren: category.children && category.children.length > 0
    }))
  })

  // 构建分类树
  const buildCategoryTree = (flatCategories) => {
    const categoryMap = new Map()
    const rootCategories = []

    // 创建分类映射
    flatCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // 构建树结构
    flatCategories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId).children.push(categoryNode)
      } else {
        rootCategories.push(categoryNode)
      }
    })

    return rootCategories.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // 获取分类路径
  const getCategoryPath = (categoryId) => {
    const path = []
    let currentCategory = categories.value.find(cat => cat.id === categoryId)
    
    while (currentCategory) {
      path.unshift(currentCategory)
      if (currentCategory.parentId) {
        currentCategory = categories.value.find(cat => cat.id === currentCategory.parentId)
      } else {
        break
      }
    }
    
    return path
  }

  // 获取子分类
  const getChildCategories = (parentId) => {
    return categories.value.filter(cat => cat.parentId === parentId)
  }

  // 获取所有后代分类
  const getDescendantCategories = (parentId) => {
    const descendants = []
    const children = getChildCategories(parentId)
    
    children.forEach(child => {
      descendants.push(child)
      descendants.push(...getDescendantCategories(child.id))
    })
    
    return descendants
  }

  // 添加分类
  const addCategory = (categoryData) => {
    const newCategory = {
      id: generateId(),
      name: categoryData.name || '新分类',
      icon: categoryData.icon || '📁',
      description: categoryData.description || '',
      parentId: categoryData.parentId || null,
      order: categoryData.order || categories.value.length,
      tags: categoryData.tags || [],
      sites: categoryData.sites || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    categories.value.push(newCategory)
    return newCategory
  }

  // 更新分类
  const updateCategory = (categoryId, updates) => {
    const index = categories.value.findIndex(cat => cat.id === categoryId)
    if (index !== -1) {
      categories.value[index] = {
        ...categories.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      return categories.value[index]
    }
    return null
  }

  // 删除分类
  const deleteCategory = (categoryId) => {
    // 检查是否有子分类
    const hasChildren = categories.value.some(cat => cat.parentId === categoryId)
    if (hasChildren) {
      throw new Error('无法删除包含子分类的分类，请先删除或移动子分类')
    }

    const index = categories.value.findIndex(cat => cat.id === categoryId)
    if (index !== -1) {
      const deletedCategory = categories.value.splice(index, 1)[0]
      return deletedCategory
    }
    return null
  }

  // 移动分类
  const moveCategory = (categoryId, newParentId, newOrder) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    if (!category) return false

    // 检查是否会造成循环引用
    if (newParentId && isDescendant(newParentId, categoryId)) {
      throw new Error('无法将分类移动到其子分类下')
    }

    updateCategory(categoryId, {
      parentId: newParentId,
      order: newOrder !== undefined ? newOrder : category.order
    })

    return true
  }

  // 检查是否为后代分类
  const isDescendant = (ancestorId, descendantId) => {
    const descendants = getDescendantCategories(ancestorId)
    return descendants.some(cat => cat.id === descendantId)
  }

  // 重新排序分类
  const reorderCategories = (categoryIds) => {
    categoryIds.forEach((categoryId, index) => {
      updateCategory(categoryId, { order: index })
    })
  }

  // 添加网站到分类
  const addSiteToCategory = (categoryId, siteData) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    if (!category) return null

    const newSite = {
      id: generateId(),
      name: siteData.name || '新网站',
      url: siteData.url || '',
      description: siteData.description || '',
      icon: siteData.icon || '/favicon.ico',
      tags: siteData.tags || [],
      order: category.sites ? category.sites.length : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (!category.sites) {
      category.sites = []
    }
    category.sites.push(newSite)

    updateCategory(categoryId, { sites: category.sites })
    return newSite
  }

  // 更新网站
  const updateSite = (categoryId, siteId, updates) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    if (!category || !category.sites) return null

    const siteIndex = category.sites.findIndex(site => site.id === siteId)
    if (siteIndex !== -1) {
      category.sites[siteIndex] = {
        ...category.sites[siteIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      updateCategory(categoryId, { sites: category.sites })
      return category.sites[siteIndex]
    }
    return null
  }

  // 删除网站
  const deleteSite = (categoryId, siteId) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    if (!category || !category.sites) return null

    const siteIndex = category.sites.findIndex(site => site.id === siteId)
    if (siteIndex !== -1) {
      const deletedSite = category.sites.splice(siteIndex, 1)[0]
      updateCategory(categoryId, { sites: category.sites })
      return deletedSite
    }
    return null
  }

  // 移动网站
  const moveSite = (fromCategoryId, toCategoryId, siteId, newOrder) => {
    const fromCategory = categories.value.find(cat => cat.id === fromCategoryId)
    const toCategory = categories.value.find(cat => cat.id === toCategoryId)
    
    if (!fromCategory || !toCategory || !fromCategory.sites) return false

    const siteIndex = fromCategory.sites.findIndex(site => site.id === siteId)
    if (siteIndex === -1) return false

    const site = fromCategory.sites.splice(siteIndex, 1)[0]
    
    if (!toCategory.sites) {
      toCategory.sites = []
    }
    
    if (newOrder !== undefined && newOrder < toCategory.sites.length) {
      toCategory.sites.splice(newOrder, 0, site)
    } else {
      toCategory.sites.push(site)
    }

    updateCategory(fromCategoryId, { sites: fromCategory.sites })
    updateCategory(toCategoryId, { sites: toCategory.sites })
    
    return true
  }

  // 标签管理
  const addTag = (tagName) => {
    if (!tags.value.includes(tagName)) {
      tags.value.push(tagName)
      tags.value.sort()
    }
  }

  const removeTag = (tagName) => {
    const index = tags.value.indexOf(tagName)
    if (index !== -1) {
      tags.value.splice(index, 1)
      
      // 从所有分类和网站中移除该标签
      categories.value.forEach(category => {
        if (category.tags) {
          category.tags = category.tags.filter(tag => tag !== tagName)
        }
        if (category.sites) {
          category.sites.forEach(site => {
            if (site.tags) {
              site.tags = site.tags.filter(tag => tag !== tagName)
            }
          })
        }
      })
    }
  }

  const renameTag = (oldName, newName) => {
    const index = tags.value.indexOf(oldName)
    if (index !== -1) {
      tags.value[index] = newName
      tags.value.sort()
      
      // 更新所有分类和网站中的标签
      categories.value.forEach(category => {
        if (category.tags) {
          const tagIndex = category.tags.indexOf(oldName)
          if (tagIndex !== -1) {
            category.tags[tagIndex] = newName
          }
        }
        if (category.sites) {
          category.sites.forEach(site => {
            if (site.tags) {
              const siteTagIndex = site.tags.indexOf(oldName)
              if (siteTagIndex !== -1) {
                site.tags[siteTagIndex] = newName
              }
            }
          })
        }
      })
    }
  }

  // 展开/折叠分类
  const toggleCategoryExpansion = (categoryId) => {
    if (expandedCategories.value.has(categoryId)) {
      expandedCategories.value.delete(categoryId)
    } else {
      expandedCategories.value.add(categoryId)
    }
  }

  const expandCategory = (categoryId) => {
    expandedCategories.value.add(categoryId)
  }

  const collapseCategory = (categoryId) => {
    expandedCategories.value.delete(categoryId)
  }

  const expandAll = () => {
    categories.value.forEach(category => {
      expandedCategories.value.add(category.id)
    })
  }

  const collapseAll = () => {
    expandedCategories.value.clear()
  }

  // 搜索分类
  const searchCategories = (query) => {
    if (!query.trim()) return categories.value

    const searchTerm = query.toLowerCase()
    return categories.value.filter(category => {
      return (
        category.name.toLowerCase().includes(searchTerm) ||
        category.description.toLowerCase().includes(searchTerm) ||
        (category.tags && category.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
    })
  }

  // 按标签过滤分类
  const filterByTags = (selectedTags) => {
    if (!selectedTags || selectedTags.length === 0) return categories.value

    return categories.value.filter(category => {
      return selectedTags.some(tag => 
        category.tags && category.tags.includes(tag)
      )
    })
  }

  // 导入分类数据
  const importCategories = (data) => {
    try {
      loading.value = true
      error.value = null

      if (Array.isArray(data)) {
        categories.value = data.map(category => ({
          ...category,
          id: category.id || generateId(),
          createdAt: category.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      } else if (data.categories) {
        categories.value = data.categories
      }

      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // 导出分类数据
  const exportCategories = () => {
    return {
      categories: deepClone(categories.value),
      tags: [...tags.value],
      exportedAt: new Date().toISOString()
    }
  }

  // 重置状态
  const reset = () => {
    categories.value = []
    tags.value = []
    selectedCategory.value = null
    expandedCategories.value.clear()
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    categories,
    tags,
    loading,
    error,
    selectedCategory,
    expandedCategories,

    // 计算属性
    categoriesTree,
    allTags,
    categoryStats,

    // 分类管理方法
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    reorderCategories,
    getCategoryPath,
    getChildCategories,
    getDescendantCategories,

    // 网站管理方法
    addSiteToCategory,
    updateSite,
    deleteSite,
    moveSite,

    // 标签管理方法
    addTag,
    removeTag,
    renameTag,

    // 展开/折叠方法
    toggleCategoryExpansion,
    expandCategory,
    collapseCategory,
    expandAll,
    collapseAll,

    // 搜索和过滤方法
    searchCategories,
    filterByTags,

    // 数据导入导出
    importCategories,
    exportCategories,

    // 工具方法
    reset
  }
})