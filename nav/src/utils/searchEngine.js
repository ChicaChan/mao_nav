/**
 * 搜索引擎工具函数
 * 支持模糊搜索、拼音搜索、权重排序
 */

// 简单的拼音匹配实现（基础版本）
const pinyinMap = {
  'a': ['啊', '阿', '呵', '嗄'],
  'ai': ['爱', '哀', '埃', '挨', '哎', '唉', '艾', '碍', '癌'],
  'an': ['安', '按', '暗', '岸', '胺', '案', '鞍', '氨', '庵'],
  'ang': ['昂', '盎'],
  'ao': ['奥', '澳', '懊', '敖', '熬', '翱', '袄', '傲', '嗷'],
  'ba': ['吧', '把', '坝', '霸', '罢', '爸', '白', '柏', '百', '摆', '佰', '败', '拜', '稗'],
  'bai': ['白', '柏', '百', '摆', '佰', '败', '拜', '稗'],
  'ban': ['办', '半', '判', '板', '版', '扮', '拌', '伴', '瓣', '绊', '斑', '班', '搬', '扳', '般', '颁', '板'],
  'bang': ['帮', '梆', '榜', '膀', '绑', '棒', '磅', '蚌', '镑', '傍', '谤', '苞', '胞', '包', '褒', '剥'],
  // 这里只是示例，实际项目中建议使用专门的拼音库
}

// 创建搜索索引
export class SearchIndex {
  constructor() {
    this.index = new Map()
    this.documents = []
  }

  // 添加文档到索引
  addDocument(doc) {
    const id = doc.id || this.documents.length
    this.documents[id] = doc
    
    // 提取关键词
    const keywords = this.extractKeywords(doc)
    
    // 建立倒排索引
    keywords.forEach(keyword => {
      if (!this.index.has(keyword)) {
        this.index.set(keyword, new Set())
      }
      this.index.get(keyword).add(id)
    })
    
    return id
  }

  // 提取文档关键词
  extractKeywords(doc) {
    const keywords = new Set()
    
    // 处理名称
    if (doc.name) {
      this.tokenize(doc.name).forEach(token => keywords.add(token))
    }
    
    // 处理描述
    if (doc.description) {
      this.tokenize(doc.description).forEach(token => keywords.add(token))
    }
    
    // 处理URL
    if (doc.url) {
      this.tokenize(doc.url).forEach(token => keywords.add(token))
    }
    
    // 处理标签
    if (doc.tags && Array.isArray(doc.tags)) {
      doc.tags.forEach(tag => {
        this.tokenize(tag).forEach(token => keywords.add(token))
      })
    }
    
    return Array.from(keywords)
  }

  // 分词处理
  tokenize(text) {
    if (!text) return []
    
    const tokens = new Set()
    const cleanText = text.toLowerCase().trim()
    
    // 按空格和标点分割
    const words = cleanText.split(/[\s\-_.,;:!?()[\]{}'"]+/).filter(Boolean)
    
    words.forEach(word => {
      // 添加完整词
      tokens.add(word)
      
      // 添加子串（用于模糊匹配）
      if (word.length > 2) {
        for (let i = 0; i < word.length - 1; i++) {
          for (let j = i + 2; j <= word.length; j++) {
            tokens.add(word.substring(i, j))
          }
        }
      }
    })
    
    return Array.from(tokens)
  }

  // 搜索
  search(query, options = {}) {
    const {
      limit = 50,
      threshold = 0.1,
      fuzzy = true,
      pinyin = true
    } = options

    if (!query || !query.trim()) return []

    const searchTerms = this.tokenize(query)
    const candidates = new Map() // docId -> score
    
    // 查找匹配的文档
    searchTerms.forEach(term => {
      // 精确匹配
      if (this.index.has(term)) {
        this.index.get(term).forEach(docId => {
          candidates.set(docId, (candidates.get(docId) || 0) + 1)
        })
      }
      
      // 模糊匹配
      if (fuzzy) {
        this.index.forEach((docIds, indexTerm) => {
          const similarity = this.calculateSimilarity(term, indexTerm)
          if (similarity > threshold) {
            docIds.forEach(docId => {
              candidates.set(docId, (candidates.get(docId) || 0) + similarity * 0.8)
            })
          }
        })
      }
    })

    // 计算最终得分并排序
    const results = Array.from(candidates.entries())
      .map(([docId, score]) => ({
        document: this.documents[docId],
        score: this.calculateFinalScore(this.documents[docId], query, score)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.document)

    return results
  }

  // 计算字符串相似度
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1
    if (!str1 || !str2) return 0
    
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  // 计算编辑距离
  levenshteinDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // 计算最终得分
  calculateFinalScore(doc, query, baseScore) {
    let score = baseScore
    const queryLower = query.toLowerCase()
    
    // 名称匹配加权
    if (doc.name && doc.name.toLowerCase().includes(queryLower)) {
      score += 10
      if (doc.name.toLowerCase() === queryLower) {
        score += 20 // 完全匹配
      }
    }
    
    // 描述匹配加权
    if (doc.description && doc.description.toLowerCase().includes(queryLower)) {
      score += 5
    }
    
    // URL匹配加权
    if (doc.url && doc.url.toLowerCase().includes(queryLower)) {
      score += 3
    }
    
    // 标签匹配加权
    if (doc.tags && Array.isArray(doc.tags)) {
      doc.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 8
        }
      })
    }
    
    return score
  }

  // 清空索引
  clear() {
    this.index.clear()
    this.documents = []
  }
}

// 创建全局搜索实例
export const globalSearchIndex = new SearchIndex()

// 搜索建议生成器
export class SearchSuggestions {
  constructor() {
    this.suggestions = new Set()
  }

  // 添加建议词
  addSuggestion(term) {
    if (term && term.trim()) {
      this.suggestions.add(term.trim().toLowerCase())
    }
  }

  // 获取搜索建议
  getSuggestions(query, limit = 10) {
    if (!query || !query.trim()) return []
    
    const queryLower = query.toLowerCase()
    const matches = []
    
    this.suggestions.forEach(suggestion => {
      if (suggestion.includes(queryLower)) {
        matches.push({
          text: suggestion,
          score: this.calculateSuggestionScore(suggestion, queryLower)
        })
      }
    })
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.text)
  }

  // 计算建议得分
  calculateSuggestionScore(suggestion, query) {
    let score = 0
    
    // 开头匹配
    if (suggestion.startsWith(query)) {
      score += 10
    }
    
    // 包含匹配
    if (suggestion.includes(query)) {
      score += 5
    }
    
    // 长度相似性
    const lengthDiff = Math.abs(suggestion.length - query.length)
    score += Math.max(0, 5 - lengthDiff)
    
    return score
  }
}

// 热门搜索管理器
export class HotSearchManager {
  constructor() {
    this.searchCounts = new Map()
    this.timeWindow = 7 * 24 * 60 * 60 * 1000 // 7天
  }

  // 记录搜索
  recordSearch(query) {
    if (!query || !query.trim()) return
    
    const normalizedQuery = query.trim().toLowerCase()
    const now = Date.now()
    
    if (!this.searchCounts.has(normalizedQuery)) {
      this.searchCounts.set(normalizedQuery, [])
    }
    
    this.searchCounts.get(normalizedQuery).push(now)
    this.cleanup()
  }

  // 获取热门搜索
  getHotSearches(limit = 10) {
    const now = Date.now()
    const hotSearches = []
    
    this.searchCounts.forEach((timestamps, query) => {
      const recentCount = timestamps.filter(time => now - time <= this.timeWindow).length
      if (recentCount > 0) {
        hotSearches.push({ query, count: recentCount })
      }
    })
    
    return hotSearches
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.query)
  }

  // 清理过期数据
  cleanup() {
    const now = Date.now()
    
    this.searchCounts.forEach((timestamps, query) => {
      const recentTimestamps = timestamps.filter(time => now - time <= this.timeWindow)
      if (recentTimestamps.length === 0) {
        this.searchCounts.delete(query)
      } else {
        this.searchCounts.set(query, recentTimestamps)
      }
    })
  }
}

// 导出实例
export const searchSuggestions = new SearchSuggestions()
export const hotSearchManager = new HotSearchManager()