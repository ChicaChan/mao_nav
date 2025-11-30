// 本地存储工具类
import Dexie from 'dexie'

// IndexedDB 数据库配置
class NavDatabase extends Dexie {
  constructor() {
    super('MaoNavDatabase')
    
    this.version(1).stores({
      categories: '++id, name, parentId, order, createdAt, updatedAt',
      sites: '++id, categoryId, name, url, order, createdAt, updatedAt',
      favorites: '++id, url, name, category, addedAt, updatedAt',
      visitHistory: '++id, url, visitedAt',
      searchHistory: '++id, query, searchedAt',
      settings: '++id, key, value, updatedAt',
      cache: '++id, key, value, expiresAt, createdAt'
    })
  }
}

const db = new NavDatabase()

// 存储键名常量
export const STORAGE_KEYS = {
  USER_SETTINGS: 'user_settings',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_SYNC: 'last_sync',
  CACHE_VERSION: 'cache_version'
}

// 本地存储管理类
export class StorageManager {
  constructor() {
    this.db = db
    this.localStorage = window.localStorage
    this.sessionStorage = window.sessionStorage
  }

  // ==================== IndexedDB 操作 ====================

  // 分类数据操作
  async saveCategories(categories) {
    try {
      await this.db.categories.clear()
      await this.db.categories.bulkAdd(categories)
      return true
    } catch (error) {
      console.error('保存分类数据失败:', error)
      return false
    }
  }

  async loadCategories() {
    try {
      return await this.db.categories.orderBy('order').toArray()
    } catch (error) {
      console.error('加载分类数据失败:', error)
      return []
    }
  }

  async addCategory(category) {
    try {
      const id = await this.db.categories.add(category)
      return { ...category, id }
    } catch (error) {
      console.error('添加分类失败:', error)
      return null
    }
  }

  async updateCategory(id, updates) {
    try {
      await this.db.categories.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return await this.db.categories.get(id)
    } catch (error) {
      console.error('更新分类失败:', error)
      return null
    }
  }

  async deleteCategory(id) {
    try {
      await this.db.categories.delete(id)
      return true
    } catch (error) {
      console.error('删除分类失败:', error)
      return false
    }
  }

  // 网站数据操作
  async saveSites(sites) {
    try {
      await this.db.sites.clear()
      await this.db.sites.bulkAdd(sites)
      return true
    } catch (error) {
      console.error('保存网站数据失败:', error)
      return false
    }
  }

  async loadSites() {
    try {
      return await this.db.sites.orderBy('order').toArray()
    } catch (error) {
      console.error('加载网站数据失败:', error)
      return []
    }
  }

  async getSitesByCategory(categoryId) {
    try {
      return await this.db.sites.where('categoryId').equals(categoryId).toArray()
    } catch (error) {
      console.error('获取分类网站失败:', error)
      return []
    }
  }

  // 收藏夹操作
  async saveFavorites(favorites) {
    try {
      await this.db.favorites.clear()
      await this.db.favorites.bulkAdd(favorites)
      return true
    } catch (error) {
      console.error('保存收藏夹失败:', error)
      return false
    }
  }

  async loadFavorites() {
    try {
      return await this.db.favorites.orderBy('addedAt').reverse().toArray()
    } catch (error) {
      console.error('加载收藏夹失败:', error)
      return []
    }
  }

  async addFavorite(favorite) {
    try {
      const id = await this.db.favorites.add(favorite)
      return { ...favorite, id }
    } catch (error) {
      console.error('添加收藏失败:', error)
      return null
    }
  }

  async removeFavorite(id) {
    try {
      await this.db.favorites.delete(id)
      return true
    } catch (error) {
      console.error('删除收藏失败:', error)
      return false
    }
  }

  // 访问历史操作
  async saveVisitHistory(history) {
    try {
      // 批量保存，但限制数量
      const limitedHistory = history.slice(0, 1000)
      await this.db.visitHistory.clear()
      await this.db.visitHistory.bulkAdd(limitedHistory)
      return true
    } catch (error) {
      console.error('保存访问历史失败:', error)
      return false
    }
  }

  async loadVisitHistory(limit = 100) {
    try {
      return await this.db.visitHistory
        .orderBy('visitedAt')
        .reverse()
        .limit(limit)
        .toArray()
    } catch (error) {
      console.error('加载访问历史失败:', error)
      return []
    }
  }

  async addVisitRecord(record) {
    try {
      const id = await this.db.visitHistory.add(record)
      
      // 清理旧记录，保持数量限制
      const count = await this.db.visitHistory.count()
      if (count > 1000) {
        const oldRecords = await this.db.visitHistory
          .orderBy('visitedAt')
          .limit(count - 1000)
          .toArray()
        
        const idsToDelete = oldRecords.map(record => record.id)
        await this.db.visitHistory.bulkDelete(idsToDelete)
      }
      
      return { ...record, id }
    } catch (error) {
      console.error('添加访问记录失败:', error)
      return null
    }
  }

  async clearVisitHistory(beforeDate = null) {
    try {
      if (beforeDate) {
        await this.db.visitHistory.where('visitedAt').below(beforeDate).delete()
      } else {
        await this.db.visitHistory.clear()
      }
      return true
    } catch (error) {
      console.error('清除访问历史失败:', error)
      return false
    }
  }

  // 搜索历史操作
  async saveSearchHistory(history) {
    try {
      const limitedHistory = history.slice(0, 100)
      await this.db.searchHistory.clear()
      await this.db.searchHistory.bulkAdd(limitedHistory)
      return true
    } catch (error) {
      console.error('保存搜索历史失败:', error)
      return false
    }
  }

  async loadSearchHistory(limit = 50) {
    try {
      return await this.db.searchHistory
        .orderBy('searchedAt')
        .reverse()
        .limit(limit)
        .toArray()
    } catch (error) {
      console.error('加载搜索历史失败:', error)
      return []
    }
  }

  async addSearchRecord(record) {
    try {
      const id = await this.db.searchHistory.add(record)
      
      // 清理旧记录
      const count = await this.db.searchHistory.count()
      if (count > 100) {
        const oldRecords = await this.db.searchHistory
          .orderBy('searchedAt')
          .limit(count - 100)
          .toArray()
        
        const idsToDelete = oldRecords.map(record => record.id)
        await this.db.searchHistory.bulkDelete(idsToDelete)
      }
      
      return { ...record, id }
    } catch (error) {
      console.error('添加搜索记录失败:', error)
      return null
    }
  }

  // 设置数据操作
  async saveSetting(key, value) {
    try {
      const setting = {
        key,
        value: JSON.stringify(value),
        updatedAt: new Date().toISOString()
      }
      
      const existing = await this.db.settings.where('key').equals(key).first()
      if (existing) {
        await this.db.settings.update(existing.id, setting)
      } else {
        await this.db.settings.add(setting)
      }
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }

  async loadSetting(key, defaultValue = null) {
    try {
      const setting = await this.db.settings.where('key').equals(key).first()
      return setting ? JSON.parse(setting.value) : defaultValue
    } catch (error) {
      console.error('加载设置失败:', error)
      return defaultValue
    }
  }

  async loadAllSettings() {
    try {
      const settings = await this.db.settings.toArray()
      const result = {}
      settings.forEach(setting => {
        try {
          result[setting.key] = JSON.parse(setting.value)
        } catch (e) {
          result[setting.key] = setting.value
        }
      })
      return result
    } catch (error) {
      console.error('加载所有设置失败:', error)
      return {}
    }
  }

  // ==================== LocalStorage 操作 ====================

  setLocal(key, value) {
    try {
      this.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('LocalStorage 保存失败:', error)
      return false
    }
  }

  getLocal(key, defaultValue = null) {
    try {
      const item = this.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('LocalStorage 读取失败:', error)
      return defaultValue
    }
  }

  removeLocal(key) {
    try {
      this.localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('LocalStorage 删除失败:', error)
      return false
    }
  }

  clearLocal() {
    try {
      this.localStorage.clear()
      return true
    } catch (error) {
      console.error('LocalStorage 清空失败:', error)
      return false
    }
  }

  // ==================== SessionStorage 操作 ====================

  setSession(key, value) {
    try {
      this.sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('SessionStorage 保存失败:', error)
      return false
    }
  }

  getSession(key, defaultValue = null) {
    try {
      const item = this.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('SessionStorage 读取失败:', error)
      return defaultValue
    }
  }

  removeSession(key) {
    try {
      this.sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('SessionStorage 删除失败:', error)
      return false
    }
  }

  clearSession() {
    try {
      this.sessionStorage.clear()
      return true
    } catch (error) {
      console.error('SessionStorage 清空失败:', error)
      return false
    }
  }

  // ==================== 缓存管理 ====================

  async setCache(key, value, expirationMinutes = 60) {
    try {
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
      
      const cacheItem = {
        key,
        value: JSON.stringify(value),
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      }
      
      const existing = await this.db.cache.where('key').equals(key).first()
      if (existing) {
        await this.db.cache.update(existing.id, cacheItem)
      } else {
        await this.db.cache.add(cacheItem)
      }
      return true
    } catch (error) {
      console.error('设置缓存失败:', error)
      return false
    }
  }

  async getCache(key) {
    try {
      const cacheItem = await this.db.cache.where('key').equals(key).first()
      
      if (!cacheItem) {
        return null
      }
      
      // 检查是否过期
      if (new Date() > new Date(cacheItem.expiresAt)) {
        await this.db.cache.delete(cacheItem.id)
        return null
      }
      
      return JSON.parse(cacheItem.value)
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  }

  async clearExpiredCache() {
    try {
      const now = new Date().toISOString()
      await this.db.cache.where('expiresAt').below(now).delete()
      return true
    } catch (error) {
      console.error('清理过期缓存失败:', error)
      return false
    }
  }

  async clearAllCache() {
    try {
      await this.db.cache.clear()
      return true
    } catch (error) {
      console.error('清空缓存失败:', error)
      return false
    }
  }

  // ==================== 数据导入导出 ====================

  async exportAllData() {
    try {
      const [categories, sites, favorites, visitHistory, searchHistory, settings] = await Promise.all([
        this.loadCategories(),
        this.loadSites(),
        this.loadFavorites(),
        this.loadVisitHistory(1000),
        this.loadSearchHistory(100),
        this.loadAllSettings()
      ])

      return {
        categories,
        sites,
        favorites,
        visitHistory,
        searchHistory,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      return null
    }
  }

  async importAllData(data) {
    try {
      const promises = []

      if (data.categories) {
        promises.push(this.saveCategories(data.categories))
      }

      if (data.sites) {
        promises.push(this.saveSites(data.sites))
      }

      if (data.favorites) {
        promises.push(this.saveFavorites(data.favorites))
      }

      if (data.visitHistory) {
        promises.push(this.saveVisitHistory(data.visitHistory))
      }

      if (data.searchHistory) {
        promises.push(this.saveSearchHistory(data.searchHistory))
      }

      if (data.settings) {
        const settingPromises = Object.entries(data.settings).map(([key, value]) =>
          this.saveSetting(key, value)
        )
        promises.push(...settingPromises)
      }

      await Promise.all(promises)
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  // ==================== 数据库管理 ====================

  async clearAllData() {
    try {
      await Promise.all([
        this.db.categories.clear(),
        this.db.sites.clear(),
        this.db.favorites.clear(),
        this.db.visitHistory.clear(),
        this.db.searchHistory.clear(),
        this.db.settings.clear(),
        this.db.cache.clear()
      ])
      return true
    } catch (error) {
      console.error('清空所有数据失败:', error)
      return false
    }
  }

  async getDatabaseSize() {
    try {
      const [categories, sites, favorites, visitHistory, searchHistory, settings, cache] = await Promise.all([
        this.db.categories.count(),
        this.db.sites.count(),
        this.db.favorites.count(),
        this.db.visitHistory.count(),
        this.db.searchHistory.count(),
        this.db.settings.count(),
        this.db.cache.count()
      ])

      return {
        categories,
        sites,
        favorites,
        visitHistory,
        searchHistory,
        settings,
        cache,
        total: categories + sites + favorites + visitHistory + searchHistory + settings + cache
      }
    } catch (error) {
      console.error('获取数据库大小失败:', error)
      return null
    }
  }

  // ==================== 工具方法 ====================

  isStorageAvailable(type = 'localStorage') {
    try {
      const storage = window[type]
      const test = '__storage_test__'
      storage.setItem(test, test)
      storage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  async isIndexedDBAvailable() {
    try {
      await this.db.open()
      return true
    } catch (error) {
      return false
    }
  }

  getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate()
    }
    return Promise.resolve({ quota: 0, usage: 0 })
  }
}

// 创建单例实例
export const storage = new StorageManager()

// 导出数据库实例
export { db }

// 便捷方法
export const saveToLocal = (key, value) => storage.setLocal(key, value)
export const loadFromLocal = (key, defaultValue) => storage.getLocal(key, defaultValue)
export const saveToSession = (key, value) => storage.setSession(key, value)
export const loadFromSession = (key, defaultValue) => storage.getSession(key, defaultValue)