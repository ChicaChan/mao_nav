<template>
  <div class="search-box-container">
    <!-- 主搜索框 -->
    <div class="search-box" :class="{ 'focused': isFocused, 'has-results': showResults }">
      <div class="search-input-wrapper">
        <div class="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        
        <input
          ref="searchInput"
          v-model="localQuery"
          type="text"
          class="search-input"
          :placeholder="placeholder"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          @input="handleInput"
        />
        
        <div class="search-actions">
          <!-- 清除按钮 -->
          <button
            v-if="localQuery"
            class="clear-btn"
            @click="clearSearch"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <!-- 搜索按钮 -->
          <button
            class="search-btn"
            @click="handleSearch"
            :disabled="!localQuery.trim()"
            type="button"
          >
            搜索
          </button>
        </div>
      </div>
      
      <!-- 搜索结果下拉框 -->
      <div
        v-if="showResults"
        class="search-results"
        @mousedown.prevent
      >
        <!-- 搜索建议 -->
        <div v-if="suggestions.length > 0" class="suggestions-section">
          <div class="section-title">搜索建议</div>
          <div
            v-for="(suggestion, index) in suggestions"
            :key="`suggestion-${index}`"
            class="suggestion-item"
            :class="{ 'highlighted': highlightedIndex === index }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="highlightedIndex = index"
          >
            <div class="suggestion-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <span class="suggestion-text">{{ suggestion }}</span>
          </div>
        </div>
        
        <!-- 搜索历史 -->
        <div v-if="showHistory && searchHistory.length > 0" class="history-section">
          <div class="section-title">
            <span>搜索历史</span>
            <button class="clear-history-btn" @click="clearHistory">清除</button>
          </div>
          <div
            v-for="(historyItem, index) in displayHistory"
            :key="`history-${index}`"
            class="history-item"
            :class="{ 'highlighted': highlightedIndex === suggestions.length + index }"
            @click="selectHistory(historyItem)"
            @mouseenter="highlightedIndex = suggestions.length + index"
          >
            <div class="history-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
              </svg>
            </div>
            <span class="history-text">{{ historyItem }}</span>
            <button
              class="remove-history-btn"
              @click.stop="removeHistory(historyItem)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 热门搜索 -->
        <div v-if="showHotSearches && hotSearches.length > 0" class="hot-searches-section">
          <div class="section-title">热门搜索</div>
          <div class="hot-searches-grid">
            <span
              v-for="(hotSearch, index) in hotSearches"
              :key="`hot-${index}`"
              class="hot-search-tag"
              @click="selectHotSearch(hotSearch)"
            >
              {{ hotSearch }}
            </span>
          </div>
        </div>
        
        <!-- 实时搜索结果 -->
        <div v-if="searchResults.length > 0" class="results-section">
          <div class="section-title">搜索结果</div>
          <div
            v-for="(result, index) in displayResults"
            :key="`result-${result.id}`"
            class="result-item"
            @click="selectResult(result)"
          >
            <div class="result-icon">
              <img :src="result.icon" :alt="result.name" @error="handleIconError" />
            </div>
            <div class="result-content">
              <div class="result-name" v-html="highlightText(result.name, localQuery)"></div>
              <div class="result-description" v-html="highlightText(result.description, localQuery)"></div>
              <div class="result-category">{{ result.categoryName }}</div>
            </div>
          </div>
        </div>
        
        <!-- 无结果提示 -->
        <div v-if="localQuery && !isSearching && searchResults.length === 0" class="no-results">
          <div class="no-results-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <div class="no-results-text">未找到相关结果</div>
          <div class="no-results-suggestion">试试其他关键词或检查拼写</div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="isSearching" class="loading-section">
          <div class="loading-spinner"></div>
          <span>搜索中...</span>
        </div>
      </div>
    </div>
    
    <!-- 搜索过滤器 -->
    <div v-if="showFilters" class="search-filters">
      <div class="filter-group">
        <label>分类:</label>
        <select v-model="selectedCategory" @change="updateFilters">
          <option value="">全部分类</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>标签:</label>
        <div class="tags-filter">
          <span
            v-for="tag in availableTags"
            :key="tag"
            class="tag-filter"
            :class="{ 'active': selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '../stores/searchStore.js'
import { searchSuggestions } from '../utils/searchEngine.js'

// Props
const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索网站、工具、资源...'
  },
  categories: {
    type: Array,
    default: () => []
  },
  showFilters: {
    type: Boolean,
    default: false
  },
  maxResults: {
    type: Number,
    default: 8
  },
  maxHistory: {
    type: Number,
    default: 5
  }
})

// Emits
const emit = defineEmits(['search', 'select', 'focus', 'blur'])

// Store
const searchStore = useSearchStore()

// Refs
const searchInput = ref(null)

// Local state
const localQuery = ref('')
const isFocused = ref(false)
const highlightedIndex = ref(-1)
const selectedCategory = ref('')
const selectedTags = ref([])

// Computed
const showResults = computed(() => {
  return isFocused.value && (
    localQuery.value.length > 0 ||
    searchHistory.value.length > 0 ||
    hotSearches.value.length > 0
  )
})

const showHistory = computed(() => {
  return localQuery.value.length === 0
})

const showHotSearches = computed(() => {
  return localQuery.value.length === 0
})

const suggestions = computed(() => {
  if (!localQuery.value) return []
  return searchSuggestions.getSuggestions(localQuery.value, 5)
})

const searchHistory = computed(() => searchStore.searchHistory)
const hotSearches = computed(() => searchStore.hotSearches)
const searchResults = computed(() => searchStore.filteredResults)
const isSearching = computed(() => searchStore.isSearching)

const displayHistory = computed(() => {
  return searchHistory.value.slice(0, props.maxHistory)
})

const displayResults = computed(() => {
  return searchResults.value.slice(0, props.maxResults)
})

const availableTags = computed(() => {
  const tags = new Set()
  props.categories.forEach(category => {
    category.sites.forEach(site => {
      if (site.tags) {
        site.tags.forEach(tag => tags.add(tag))
      }
    })
  })
  return Array.from(tags).slice(0, 20) // 限制标签数量
})

// Methods
const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  // 延迟隐藏，允许点击结果
  setTimeout(() => {
    isFocused.value = false
    highlightedIndex.value = -1
    emit('blur')
  }, 200)
}

const handleInput = () => {
  highlightedIndex.value = -1
  if (localQuery.value.trim()) {
    searchStore.performSearch(localQuery.value, props.categories)
  } else {
    searchStore.clearResults()
  }
}

const handleKeydown = (event) => {
  const totalItems = suggestions.value.length + displayHistory.value.length
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, totalItems - 1)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
      
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        if (highlightedIndex.value < suggestions.value.length) {
          selectSuggestion(suggestions.value[highlightedIndex.value])
        } else {
          const historyIndex = highlightedIndex.value - suggestions.value.length
          selectHistory(displayHistory.value[historyIndex])
        }
      } else {
        handleSearch()
      }
      break
      
    case 'Escape':
      searchInput.value.blur()
      break
  }
}

const handleSearch = () => {
  if (!localQuery.value.trim()) return
  
  searchStore.performSearch(localQuery.value, props.categories)
  emit('search', localQuery.value)
  searchInput.value.blur()
}

const clearSearch = () => {
  localQuery.value = ''
  searchStore.clearResults()
  searchInput.value.focus()
}

const selectSuggestion = (suggestion) => {
  localQuery.value = suggestion
  handleSearch()
}

const selectHistory = (historyItem) => {
  localQuery.value = historyItem
  handleSearch()
}

const selectHotSearch = (hotSearch) => {
  localQuery.value = hotSearch
  handleSearch()
}

const selectResult = (result) => {
  emit('select', result)
  searchInput.value.blur()
}

const clearHistory = () => {
  searchStore.clearHistory()
}

const removeHistory = (item) => {
  searchStore.removeFromHistory(item)
}

const updateFilters = () => {
  searchStore.updateFilters({
    category: selectedCategory.value,
    tags: selectedTags.value
  })
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  updateFilters()
}

const highlightText = (text, query) => {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const handleIconError = (event) => {
  event.target.style.display = 'none'
}

// Watch
watch(() => props.categories, () => {
  if (localQuery.value.trim()) {
    searchStore.performSearch(localQuery.value, props.categories)
  }
})

// Lifecycle
onMounted(() => {
  searchStore.init()
})
</script>

<style scoped>
.search-box-container {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-box {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.search-box.focused {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.search-box.has-results {
  border-radius: 12px 12px 0 0;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;
  min-height: 48px;
}

.search-icon {
  color: #9ca3af;
  margin-right: 12px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #374151;
  background: transparent;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.search-btn {
  padding: 6px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-btn:hover:not(:disabled) {
  background: #2563eb;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f3f4f6;
}

.clear-history-btn {
  font-size: 12px;
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.clear-history-btn:hover {
  background: #fef2f2;
}

.suggestion-item,
.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.suggestion-item:hover,
.history-item:hover,
.suggestion-item.highlighted,
.history-item.highlighted {
  background: #f8fafc;
}

.suggestion-icon,
.history-icon {
  color: #9ca3af;
  margin-right: 12px;
  flex-shrink: 0;
}

.suggestion-text,
.history-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.remove-history-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s ease;
}

.history-item:hover .remove-history-btn {
  opacity: 1;
}

.remove-history-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.hot-searches-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 16px;
}

.hot-search-tag {
  padding: 4px 12px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hot-search-tag:hover {
  background: #e2e8f0;
  color: #334155;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f8fafc;
}

.result-item:hover {
  background: #f8fafc;
}

.result-item:last-child {
  border-bottom: none;
}

.result-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 2px;
}

.result-description {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-category {
  font-size: 11px;
  color: #9ca3af;
}

.result-name :deep(mark),
.result-description :deep(mark) {
  background: #fef3c7;
  color: #92400e;
  padding: 1px 2px;
  border-radius: 2px;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: #6b7280;
}

.no-results-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-results-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.no-results-suggestion {
  font-size: 14px;
  opacity: 0.8;
}

.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #6b7280;
  gap: 12px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-filters {
  margin-top: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.tags-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-filter {
  padding: 4px 10px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-filter:hover {
  border-color: #3b82f6;
}

.tag-filter.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-input-wrapper {
    padding: 0 12px;
    min-height: 44px;
  }
  
  .search-input {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .search-filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .tags-filter {
    width: 100%;
  }
}
</style>