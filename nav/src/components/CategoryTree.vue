<template>
  <div class="category-tree">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="tree-toolbar">
      <div class="toolbar-left">
        <button
          class="toolbar-btn"
          @click="expandAll"
          title="展开全部"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
          展开全部
        </button>
        
        <button
          class="toolbar-btn"
          @click="collapseAll"
          title="折叠全部"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="18,15 12,9 6,15"></polyline>
          </svg>
          折叠全部
        </button>
      </div>
      
      <div class="toolbar-right">
        <button
          v-if="editable"
          class="toolbar-btn primary"
          @click="addRootCategory"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加分类
        </button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div v-if="searchable" class="tree-search">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索分类..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          @click="searchQuery = ''"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- 分类树 -->
    <div class="tree-container" :class="{ 'dragging': isDragging }">
      <div v-if="filteredCategories.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
          </svg>
        </div>
        <div class="empty-text">
          {{ searchQuery ? '未找到匹配的分类' : '暂无分类' }}
        </div>
        <button
          v-if="!searchQuery && editable"
          class="add-first-btn"
          @click="addRootCategory"
        >
          创建第一个分类
        </button>
      </div>

      <draggable
        v-else
        v-model="filteredCategories"
        :group="{ name: 'categories', pull: true, put: true }"
        :animation="200"
        :disabled="!draggable || !!searchQuery"
        item-key="id"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onDragChange"
      >
        <template #item="{ element: category }">
          <CategoryTreeNode
            :key="category.id"
            :category="category"
            :level="0"
            :expanded="expandedCategories.has(category.id)"
            :selected="selectedCategory?.id === category.id"
            :editable="editable"
            :draggable="draggable && !searchQuery"
            :show-sites="showSites"
            :show-stats="showStats"
            @toggle="toggleExpansion"
            @select="selectCategory"
            @edit="editCategory"
            @delete="deleteCategory"
            @add-child="addChildCategory"
            @add-site="addSiteToCategory"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
          />
        </template>
      </draggable>
    </div>

    <!-- 分类编辑对话框 -->
    <CategoryEditDialog
      v-if="showEditDialog"
      :category="editingCategory"
      :parent-options="parentOptions"
      @save="saveCategory"
      @cancel="cancelEdit"
    />

    <!-- 确认删除对话框 -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="删除分类"
      :message="`确定要删除分类"${deletingCategory?.name}"吗？此操作不可撤销。`"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCategoryStore } from '../stores/categoryStore.js'
import draggable from 'vuedraggable'
import CategoryTreeNode from './CategoryTreeNode.vue'
import CategoryEditDialog from './CategoryEditDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'

// Props
const props = defineProps({
  editable: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: true
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showSites: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: false
  },
  maxDepth: {
    type: Number,
    default: 5
  }
})

// Emits
const emit = defineEmits([
  'select',
  'edit',
  'delete',
  'add',
  'move',
  'expand',
  'collapse'
])

// Store
const categoryStore = useCategoryStore()

// Reactive data
const searchQuery = ref('')
const isDragging = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingCategory = ref(null)
const deletingCategory = ref(null)

// Computed
const { 
  categoriesTree, 
  expandedCategories, 
  selectedCategory 
} = categoryStore

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categoriesTree.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return filterCategoriesRecursive(categoriesTree.value, query)
})

const parentOptions = computed(() => {
  const options = [{ id: null, name: '根目录', level: 0 }]
  
  const addOptions = (categories, level = 0) => {
    categories.forEach(category => {
      if (!editingCategory.value || category.id !== editingCategory.value.id) {
        options.push({
          id: category.id,
          name: category.name,
          level: level + 1
        })
        
        if (category.children && level < props.maxDepth - 1) {
          addOptions(category.children, level + 1)
        }
      }
    })
  }
  
  addOptions(categoriesTree.value)
  return options
})

// Methods
const filterCategoriesRecursive = (categories, query) => {
  return categories.filter(category => {
    const matchesQuery = (
      category.name.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query) ||
      (category.tags && category.tags.some(tag => tag.toLowerCase().includes(query)))
    )
    
    const hasMatchingChildren = category.children && 
      filterCategoriesRecursive(category.children, query).length > 0
    
    if (matchesQuery || hasMatchingChildren) {
      // 如果匹配或有匹配的子项，展开该分类
      categoryStore.expandCategory(category.id)
      return true
    }
    
    return false
  }).map(category => ({
    ...category,
    children: category.children ? 
      filterCategoriesRecursive(category.children, query) : []
  }))
}

const toggleExpansion = (categoryId) => {
  categoryStore.toggleCategoryExpansion(categoryId)
  emit('expand', categoryId, expandedCategories.value.has(categoryId))
}

const expandAll = () => {
  categoryStore.expandAll()
  emit('expand', null, true)
}

const collapseAll = () => {
  categoryStore.collapseAll()
  emit('collapse', null, false)
}

const selectCategory = (category) => {
  categoryStore.selectedCategory = category
  emit('select', category)
}

const addRootCategory = () => {
  editingCategory.value = {
    name: '',
    icon: '📁',
    description: '',
    parentId: null,
    tags: []
  }
  showEditDialog.value = true
}

const addChildCategory = (parentCategory) => {
  editingCategory.value = {
    name: '',
    icon: '📁',
    description: '',
    parentId: parentCategory.id,
    tags: []
  }
  showEditDialog.value = true
}

const editCategory = (category) => {
  editingCategory.value = { ...category }
  showEditDialog.value = true
}

const saveCategory = (categoryData) => {
  try {
    let savedCategory
    
    if (categoryData.id) {
      // 更新现有分类
      savedCategory = categoryStore.updateCategory(categoryData.id, categoryData)
      emit('edit', savedCategory)
    } else {
      // 创建新分类
      savedCategory = categoryStore.addCategory(categoryData)
      emit('add', savedCategory)
    }
    
    showEditDialog.value = false
    editingCategory.value = null
    
    // 展开父分类
    if (savedCategory.parentId) {
      categoryStore.expandCategory(savedCategory.parentId)
    }
    
  } catch (error) {
    console.error('保存分类失败:', error)
    // 这里可以显示错误提示
  }
}

const cancelEdit = () => {
  showEditDialog.value = false
  editingCategory.value = null
}

const deleteCategory = (category) => {
  deletingCategory.value = category
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  try {
    const deleted = categoryStore.deleteCategory(deletingCategory.value.id)
    if (deleted) {
      emit('delete', deleted)
    }
  } catch (error) {
    console.error('删除分类失败:', error)
    // 这里可以显示错误提示
  } finally {
    showDeleteDialog.value = false
    deletingCategory.value = null
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  deletingCategory.value = null
}

const addSiteToCategory = (category) => {
  // 触发添加网站事件，由父组件处理
  emit('add-site', category)
}

const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = () => {
  isDragging.value = false
}

const onDragChange = (event) => {
  if (event.moved) {
    const { element, newIndex } = event.moved
    categoryStore.reorderCategories(
      filteredCategories.value.map(cat => cat.id)
    )
    emit('move', element, newIndex)
  }
}

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (newQuery.trim()) {
    // 搜索时展开所有匹配的分类
    filteredCategories.value.forEach(category => {
      categoryStore.expandCategory(category.id)
    })
  }
})
</script>

<style scoped>
.category-tree {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.toolbar-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.toolbar-btn.primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.tree-search {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.search-input-wrapper {
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
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.tree-container {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
}

.tree-container.dragging {
  user-select: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7280;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 16px;
}

.add-first-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-first-btn:hover {
  background: #2563eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tree-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .toolbar-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>