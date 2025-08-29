<template>
  <div class="favorite-manager">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="view-switcher">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            title="网格视图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="列表视图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="sort-selector">
          <select v-model="sortBy" class="sort-select">
            <option value="addedAt">添加时间</option>
            <option value="name">名称</option>
            <option value="visitCount">访问次数</option>
            <option value="lastVisited">最近访问</option>
            <option value="category">分类</option>
          </select>
          <button
            class="sort-order-btn"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            :title="sortOrder === 'asc' ? '升序' : '降序'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path v-if="sortOrder === 'asc'" d="M3 16l4 4 4-4M7 20V4"></path>
              <path v-else d="M3 8l4-4 4 4M7 4v16"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索收藏..."
            class="search-input"
          />
        </div>

        <div class="action-buttons">
          <button
            class="action-btn"
            @click="showImportDialog = true"
            title="导入收藏"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="12" y1="17" x2="12" y2="9"></line>
            </svg>
          </button>
          
          <button
            class="action-btn"
            @click="exportFavorites"
            title="导出收藏"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="12" y1="11" x2="12" y2="21"></line>
              <polyline points="16,15 12,19 8,15"></polyline>
            </svg>
          </button>

          <button
            v-if="selectedFavorites.length > 0"
            class="action-btn danger"
            @click="showBatchDeleteDialog = true"
            :title="`删除选中的 ${selectedFavorites.length} 项`"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分类过滤器 -->
    <div v-if="categories.length > 0" class="category-filter">
      <div class="filter-title">分类筛选:</div>
      <div class="category-tags">
        <button
          class="category-tag"
          :class="{ active: selectedCategory === null }"
          @click="selectedCategory = null"
        >
          全部 ({{ favorites.length }})
        </button>
        <button
          v-for="category in categories"
          :key="category"
          class="category-tag"
          :class="{ active: selectedCategory === category }"
          @click="selectedCategory = category"
        >
          {{ category }} ({{ getCategoryCount(category) }})
        </button>
      </div>
    </div>

    <!-- 收藏列表 -->
    <div class="favorites-container">
      <div v-if="filteredFavorites.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>
        </div>
        <div class="empty-text">
          {{ searchQuery ? '未找到匹配的收藏' : '暂无收藏' }}
        </div>
        <div class="empty-hint">
          {{ searchQuery ? '尝试使用其他关键词搜索' : '浏览网站时点击收藏按钮添加到收藏夹' }}
        </div>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="favorites-grid">
        <div
          v-for="favorite in paginatedFavorites"
          :key="favorite.id"
          class="favorite-card"
          :class="{ selected: selectedFavorites.includes(favorite.id) }"
          @click="visitFavorite(favorite)"
          @contextmenu.prevent="showContextMenu($event, favorite)"
        >
          <div class="card-header">
            <div class="site-icon">
              <img
                :src="favorite.icon"
                :alt="favorite.name"
                @error="handleIconError"
                loading="lazy"
              />
            </div>
            <div class="card-actions">
              <input
                type="checkbox"
                :checked="selectedFavorites.includes(favorite.id)"
                @click.stop
                @change="toggleSelection(favorite.id)"
                class="selection-checkbox"
              />
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="site-name" :title="favorite.name">{{ favorite.name }}</h3>
            <p class="site-description" :title="favorite.description">
              {{ favorite.description || '暂无描述' }}
            </p>
            <div class="site-url" :title="favorite.url">{{ favorite.url }}</div>
          </div>
          
          <div class="card-footer">
            <div class="site-meta">
              <span class="category-badge">{{ favorite.category || '未分类' }}</span>
              <span class="visit-count">{{ favorite.visitCount || 0 }}次访问</span>
            </div>
            <div class="site-tags">
              <span
                v-for="tag in (favorite.tags || []).slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="favorites-list">
        <div class="list-header">
          <div class="header-cell selection">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isPartiallySelected"
              @change="toggleSelectAll"
            />
          </div>
          <div class="header-cell icon"></div>
          <div class="header-cell name">名称</div>
          <div class="header-cell category">分类</div>
          <div class="header-cell visits">访问次数</div>
          <div class="header-cell date">添加时间</div>
          <div class="header-cell actions">操作</div>
        </div>
        
        <div
          v-for="favorite in paginatedFavorites"
          :key="favorite.id"
          class="list-item"
          :class="{ selected: selectedFavorites.includes(favorite.id) }"
          @click="visitFavorite(favorite)"
          @contextmenu.prevent="showContextMenu($event, favorite)"
        >
          <div class="list-cell selection">
            <input
              type="checkbox"
              :checked="selectedFavorites.includes(favorite.id)"
              @click.stop
              @change="toggleSelection(favorite.id)"
            />
          </div>
          <div class="list-cell icon">
            <img
              :src="favorite.icon"
              :alt="favorite.name"
              @error="handleIconError"
              loading="lazy"
            />
          </div>
          <div class="list-cell name">
            <div class="site-name">{{ favorite.name }}</div>
            <div class="site-url">{{ favorite.url }}</div>
          </div>
          <div class="list-cell category">
            <span class="category-badge">{{ favorite.category || '未分类' }}</span>
          </div>
          <div class="list-cell visits">
            {{ favorite.visitCount || 0 }}
          </div>
          <div class="list-cell date">
            {{ formatDate(favorite.addedAt) }}
          </div>
          <div class="list-cell actions">
            <button
              class="action-btn small"
              @click.stop="editFavorite(favorite)"
              title="编辑"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              class="action-btn small danger"
              @click.stop="deleteFavorite(favorite)"
              title="删除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        >
          首页
        </button>
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          下一页
        </button>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        >
          末页
        </button>
        
        <div class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页，{{ filteredFavorites.length }} 项
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      :items="contextMenuItems"
      @select="handleContextMenuSelect"
      @close="showContextMenu = false"
    />

    <!-- 编辑对话框 -->
    <FavoriteEditDialog
      v-if="showEditDialog"
      :favorite="editingFavorite"
      :categories="categories"
      @save="saveFavorite"
      @cancel="cancelEdit"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      v-if="showImportDialog"
      @import="importFavorites"
      @cancel="showImportDialog = false"
    />

    <!-- 批量删除确认对话框 -->
    <ConfirmDialog
      v-if="showBatchDeleteDialog"
      title="批量删除收藏"
      :message="`确定要删除选中的 ${selectedFavorites.length} 个收藏吗？此操作不可撤销。`"
      @confirm="batchDelete"
      @cancel="showBatchDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/userStore.js'
import { formatDate } from '../utils/common.js'
import ContextMenu from './ContextMenu.vue'
import FavoriteEditDialog from './FavoriteEditDialog.vue'
import ImportDialog from './ImportDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'

// Props
const props = defineProps({
  itemsPerPage: {
    type: Number,
    default: 20
  }
})

// Emits
const emit = defineEmits(['visit', 'edit', 'delete', 'import', 'export'])

// Store
const userStore = useUserStore()

// Reactive data
const viewMode = ref('grid')
const sortBy = ref('addedAt')
const sortOrder = ref('desc')
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedFavorites = ref([])
const currentPage = ref(1)

// Dialog states
const showEditDialog = ref(false)
const showImportDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const editingFavorite = ref(null)

// Context menu
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTarget = ref(null)

// Computed
const { favorites } = userStore

const categories = computed(() => {
  const categorySet = new Set()
  favorites.value.forEach(fav => {
    if (fav.category) {
      categorySet.add(fav.category)
    }
  })
  return Array.from(categorySet).sort()
})

const filteredFavorites = computed(() => {
  let result = favorites.value

  // 分类过滤
  if (selectedCategory.value) {
    result = result.filter(fav => fav.category === selectedCategory.value)
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(fav =>
      fav.name.toLowerCase().includes(query) ||
      fav.description?.toLowerCase().includes(query) ||
      fav.url.toLowerCase().includes(query) ||
      (fav.tags && fav.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  // 排序
  result.sort((a, b) => {
    let aValue = a[sortBy.value]
    let bValue = b[sortBy.value]

    // 处理特殊字段
    if (sortBy.value === 'addedAt' || sortBy.value === 'lastVisited') {
      aValue = new Date(aValue || 0)
      bValue = new Date(bValue || 0)
    } else if (sortBy.value === 'visitCount') {
      aValue = aValue || 0
      bValue = bValue || 0
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }

    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredFavorites.value.length / props.itemsPerPage)
})

const paginatedFavorites = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredFavorites.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const isAllSelected = computed(() => {
  return paginatedFavorites.value.length > 0 &&
    paginatedFavorites.value.every(fav => selectedFavorites.value.includes(fav.id))
})

const isPartiallySelected = computed(() => {
  return selectedFavorites.value.length > 0 && !isAllSelected.value
})

const contextMenuItems = computed(() => [
  { id: 'open', label: '打开', icon: 'external-link' },
  { id: 'open-new', label: '新标签页打开', icon: 'external-link' },
  { type: 'divider' },
  { id: 'edit', label: '编辑', icon: 'edit' },
  { id: 'copy-url', label: '复制链接', icon: 'copy' },
  { type: 'divider' },
  { id: 'delete', label: '删除', icon: 'trash', danger: true }
])

// Methods
const getCategoryCount = (category) => {
  return favorites.value.filter(fav => fav.category === category).length
}

const toggleSelection = (favoriteId) => {
  const index = selectedFavorites.value.indexOf(favoriteId)
  if (index > -1) {
    selectedFavorites.value.splice(index, 1)
  } else {
    selectedFavorites.value.push(favoriteId)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消选择当前页的所有项
    paginatedFavorites.value.forEach(fav => {
      const index = selectedFavorites.value.indexOf(fav.id)
      if (index > -1) {
        selectedFavorites.value.splice(index, 1)
      }
    })
  } else {
    // 选择当前页的所有项
    paginatedFavorites.value.forEach(fav => {
      if (!selectedFavorites.value.includes(fav.id)) {
        selectedFavorites.value.push(fav.id)
      }
    })
  }
}

const visitFavorite = (favorite) => {
  // 记录访问
  userStore.addToHistory({
    name: favorite.name,
    url: favorite.url,
    icon: favorite.icon
  })

  // 更新访问次数
  userStore.updateFavorite(favorite.id, {
    visitCount: (favorite.visitCount || 0) + 1,
    lastVisited: new Date().toISOString()
  })

  emit('visit', favorite)
  
  // 打开链接
  window.open(favorite.url, '_blank')
}

const editFavorite = (favorite) => {
  editingFavorite.value = { ...favorite }
  showEditDialog.value = true
}

const saveFavorite = (favoriteData) => {
  userStore.updateFavorite(favoriteData.id, favoriteData)
  showEditDialog.value = false
  editingFavorite.value = null
  emit('edit', favoriteData)
}

const cancelEdit = () => {
  showEditDialog.value = false
  editingFavorite.value = null
}

const deleteFavorite = (favorite) => {
  if (confirm(`确定要删除收藏"${favorite.name}"吗？`)) {
    userStore.removeFromFavorites(favorite.id)
    
    // 从选中列表中移除
    const index = selectedFavorites.value.indexOf(favorite.id)
    if (index > -1) {
      selectedFavorites.value.splice(index, 1)
    }
    
    emit('delete', favorite)
  }
}

const batchDelete = () => {
  selectedFavorites.value.forEach(favoriteId => {
    userStore.removeFromFavorites(favoriteId)
  })
  
  selectedFavorites.value = []
  showBatchDeleteDialog.value = false
  
  emit('delete', { count: selectedFavorites.value.length })
}

const exportFavorites = () => {
  const data = userStore.exportUserData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `favorites_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  emit('export', data)
}

const importFavorites = (data) => {
  userStore.importUserData(data)
  showImportDialog.value = false
  emit('import', data)
}

const handleIconError = (event) => {
  event.target.src = '/favicon.ico'
}

const showContextMenu = (event, favorite) => {
  contextMenuTarget.value = favorite
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

const handleContextMenuSelect = (itemId) => {
  const favorite = contextMenuTarget.value
  
  switch (itemId) {
    case 'open':
      visitFavorite(favorite)
      break
    case 'open-new':
      window.open(favorite.url, '_blank')
      break
    case 'edit':
      editFavorite(favorite)
      break
    case 'copy-url':
      navigator.clipboard.writeText(favorite.url)
      break
    case 'delete':
      deleteFavorite(favorite)
      break
  }
  
  showContextMenu.value = false
}

// Watch for search and filter changes to reset pagination
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
  selectedFavorites.value = []
})

// Keyboard shortcuts
const handleKeydown = (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'a':
        event.preventDefault()
        toggleSelectAll()
        break
      case 'f':
        event.preventDefault()
        document.querySelector('.search-input')?.focus()
        break
    }
  }
  
  if (event.key === 'Delete' && selectedFavorites.value.length > 0) {
    showBatchDeleteDialog.value = true
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.favorite-manager {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-switcher {
  display: flex;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  overflow: hidden;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #f3f4f6;
}

.view-btn.active {
  background: #3b82f6;
  color: white;
}

.sort-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.sort-order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-order-btn:hover {
  background: #f3f4f6;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 240px;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.danger {
  color: #ef4444;
  border-color: #ef4444;
}

.action-btn.danger:hover {
  background: #fef2f2;
}

.action-btn.small {
  width: 28px;
  height: 28px;
}

.category-filter {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  padding: 6px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-tag:hover {
  background: #f3f4f6;
}

.category-tag.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.favorites-container {
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
}

/* 网格视图样式 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.favorite-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.favorite-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.favorite-card.selected {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.site-icon img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

.selection-checkbox {
  width: 16px;
  height: 16px;
}

.card-content {
  margin-bottom: 12px;
}

.site-name {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.site-url {
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.site-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.visit-count {
  font-size: 11px;
  color: #6b7280;
}

.site-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 8px;
  font-size: 10px;
}

/* 列表视图样式 */
.favorites-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 40px 40px 1fr 120px 80px 120px 80px;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.list-item {
  display: grid;
  grid-template-columns: 40px 40px 1fr 120px 80px 120px 80px;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s ease;
}

.list-item:hover {
  background: #f8fafc;
}

.list-item.selected {
  background: #f0f9ff;
}

.list-cell {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.list-cell.icon img {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

.list-cell.name {
  flex-direction: column;
  align-items: flex-start;
}

.list-cell .site-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.list-cell .site-url {
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.list-cell.actions {
  gap: 4px;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
  margin-left: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-input {
    width: 200px;
  }
  
  .favorites-grid {
    grid-template-columns: 1fr;
  }
  
  .list-header,
  .list-item {
    grid-template-columns: 40px 1fr 80px;
  }
  
  .list-cell.icon,
  .list-cell.category,
  .list-cell.visits,
  .list-cell.date {
    display: none;
  }
  
  .category-tags {
    justify-content: center;
  }
}
</style>