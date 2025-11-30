<template>
  <div class="tag-manager">
    <!-- 标签输入区域 -->
    <div class="tag-input-section">
      <div class="input-wrapper">
        <input
          ref="tagInput"
          v-model="newTagName"
          type="text"
          placeholder="输入标签名称..."
          class="tag-input"
          @keydown="handleKeydown"
          @input="handleInput"
        />
        <button
          class="add-tag-btn"
          :disabled="!canAddTag"
          @click="addNewTag"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加
        </button>
      </div>
      
      <!-- 标签建议 -->
      <div v-if="suggestions.length > 0" class="tag-suggestions">
        <div class="suggestions-title">建议标签:</div>
        <div class="suggestions-list">
          <span
            v-for="suggestion in suggestions"
            :key="suggestion"
            class="suggestion-tag"
            @click="selectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </span>
        </div>
      </div>
    </div>

    <!-- 当前标签列表 -->
    <div class="current-tags-section">
      <div class="section-header">
        <h3 class="section-title">
          当前标签 
          <span class="tag-count">({{ currentTags.length }})</span>
        </h3>
        <div class="section-actions">
          <button
            v-if="currentTags.length > 0"
            class="clear-all-btn"
            @click="clearAllTags"
          >
            清空全部
          </button>
        </div>
      </div>
      
      <div v-if="currentTags.length === 0" class="empty-tags">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </div>
        <div class="empty-text">暂无标签</div>
      </div>
      
      <draggable
        v-else
        v-model="currentTags"
        :group="{ name: 'tags' }"
        :animation="200"
        :disabled="!draggable"
        item-key="id"
        class="tags-grid"
        @change="handleTagsReorder"
      >
        <template #item="{ element: tag, index }">
          <div
            class="tag-item"
            :class="{ 
              'selected': selectedTags.includes(tag),
              'editing': editingTag === tag
            }"
            @click="toggleTagSelection(tag)"
          >
            <!-- 标签内容 -->
            <div v-if="editingTag !== tag" class="tag-content">
              <span class="tag-name">{{ tag }}</span>
              <span class="tag-usage">{{ getTagUsage(tag) }}</span>
            </div>
            
            <!-- 编辑模式 -->
            <div v-else class="tag-edit">
              <input
                ref="editInput"
                v-model="editingTagName"
                type="text"
                class="tag-edit-input"
                @keydown="handleEditKeydown"
                @blur="cancelEdit"
              />
            </div>
            
            <!-- 操作按钮 -->
            <div class="tag-actions">
              <button
                v-if="editable && editingTag !== tag"
                class="tag-action-btn edit-btn"
                @click.stop="startEdit(tag)"
                title="编辑标签"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              
              <button
                v-if="removable && editingTag !== tag"
                class="tag-action-btn remove-btn"
                @click.stop="removeTag(tag)"
                title="删除标签"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 全局标签库 -->
    <div v-if="showGlobalTags" class="global-tags-section">
      <div class="section-header">
        <h3 class="section-title">标签库</h3>
        <div class="section-actions">
          <input
            v-model="globalTagsFilter"
            type="text"
            placeholder="搜索标签..."
            class="filter-input"
          />
        </div>
      </div>
      
      <div class="global-tags-grid">
        <div
          v-for="tag in filteredGlobalTags"
          :key="tag"
          class="global-tag-item"
          :class="{ 'in-use': currentTags.includes(tag) }"
          @click="addGlobalTag(tag)"
        >
          <span class="tag-name">{{ tag }}</span>
          <span class="tag-usage">{{ getTagUsage(tag) }}</span>
        </div>
      </div>
    </div>

    <!-- 标签统计 -->
    <div v-if="showStats" class="tag-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ currentTags.length }}</div>
          <div class="stat-label">当前标签</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ allTags.length }}</div>
          <div class="stat-label">全部标签</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ mostUsedTag?.count || 0 }}</div>
          <div class="stat-label">最高使用</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useCategoryStore } from '../stores/categoryStore.js'
import draggable from 'vuedraggable'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: true
  },
  removable: {
    type: Boolean,
    default: true
  },
  draggable: {
    type: Boolean,
    default: true
  },
  showGlobalTags: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: false
  },
  maxTags: {
    type: Number,
    default: 20
  },
  suggestionsLimit: {
    type: Number,
    default: 5
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'add', 'remove', 'edit', 'reorder'])

// Store
const categoryStore = useCategoryStore()

// Refs
const tagInput = ref(null)
const editInput = ref(null)

// Reactive data
const newTagName = ref('')
const editingTag = ref(null)
const editingTagName = ref('')
const selectedTags = ref([])
const globalTagsFilter = ref('')

// Computed
const currentTags = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

const allTags = computed(() => categoryStore.allTags)

const canAddTag = computed(() => {
  const trimmed = newTagName.value.trim()
  return (
    trimmed.length > 0 &&
    !currentTags.value.includes(trimmed) &&
    currentTags.value.length < props.maxTags
  )
})

const suggestions = computed(() => {
  if (!newTagName.value.trim()) return []
  
  const query = newTagName.value.toLowerCase()
  return allTags.value
    .filter(tag => 
      tag.toLowerCase().includes(query) &&
      !currentTags.value.includes(tag)
    )
    .slice(0, props.suggestionsLimit)
})

const filteredGlobalTags = computed(() => {
  if (!globalTagsFilter.value.trim()) {
    return allTags.value.filter(tag => !currentTags.value.includes(tag))
  }
  
  const query = globalTagsFilter.value.toLowerCase()
  return allTags.value.filter(tag =>
    tag.toLowerCase().includes(query) &&
    !currentTags.value.includes(tag)
  )
})

const tagUsageMap = computed(() => {
  const usage = new Map()
  
  categoryStore.categories.forEach(category => {
    // 统计分类标签
    if (category.tags) {
      category.tags.forEach(tag => {
        usage.set(tag, (usage.get(tag) || 0) + 1)
      })
    }
    
    // 统计网站标签
    if (category.sites) {
      category.sites.forEach(site => {
        if (site.tags) {
          site.tags.forEach(tag => {
            usage.set(tag, (usage.get(tag) || 0) + 1)
          })
        }
      })
    }
  })
  
  return usage
})

const mostUsedTag = computed(() => {
  let maxCount = 0
  let mostUsed = null
  
  tagUsageMap.value.forEach((count, tag) => {
    if (count > maxCount) {
      maxCount = count
      mostUsed = { tag, count }
    }
  })
  
  return mostUsed
})

// Methods
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      if (canAddTag.value) {
        addNewTag()
      }
      break
      
    case 'Escape':
      newTagName.value = ''
      tagInput.value.blur()
      break
      
    case ',':
    case ';':
      event.preventDefault()
      if (canAddTag.value) {
        addNewTag()
      }
      break
  }
}

const handleInput = () => {
  // 自动去除特殊字符
  newTagName.value = newTagName.value.replace(/[,;]/g, '')
}

const addNewTag = () => {
  const tagName = newTagName.value.trim()
  if (!tagName || currentTags.value.includes(tagName)) return
  
  if (currentTags.value.length >= props.maxTags) {
    console.warn(`最多只能添加 ${props.maxTags} 个标签`)
    return
  }
  
  const newTags = [...currentTags.value, tagName]
  emit('update:modelValue', newTags)
  emit('add', tagName)
  
  // 添加到全局标签库
  categoryStore.addTag(tagName)
  
  newTagName.value = ''
  tagInput.value.focus()
}

const selectSuggestion = (suggestion) => {
  newTagName.value = suggestion
  addNewTag()
}

const addGlobalTag = (tag) => {
  if (currentTags.value.includes(tag)) return
  
  if (currentTags.value.length >= props.maxTags) {
    console.warn(`最多只能添加 ${props.maxTags} 个标签`)
    return
  }
  
  const newTags = [...currentTags.value, tag]
  emit('update:modelValue', newTags)
  emit('add', tag)
}

const removeTag = (tag) => {
  const newTags = currentTags.value.filter(t => t !== tag)
  emit('update:modelValue', newTags)
  emit('remove', tag)
  
  // 从选中列表中移除
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

const clearAllTags = () => {
  emit('update:modelValue', [])
  selectedTags.value = []
}

const toggleTagSelection = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const startEdit = async (tag) => {
  editingTag.value = tag
  editingTagName.value = tag
  
  await nextTick()
  if (editInput.value) {
    editInput.value.focus()
    editInput.value.select()
  }
}

const handleEditKeydown = (event) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      saveEdit()
      break
      
    case 'Escape':
      event.preventDefault()
      cancelEdit()
      break
  }
}

const saveEdit = () => {
  const oldName = editingTag.value
  const newName = editingTagName.value.trim()
  
  if (!newName || newName === oldName) {
    cancelEdit()
    return
  }
  
  if (currentTags.value.includes(newName) && newName !== oldName) {
    console.warn('标签名称已存在')
    cancelEdit()
    return
  }
  
  // 更新当前标签列表
  const newTags = currentTags.value.map(tag => tag === oldName ? newName : tag)
  emit('update:modelValue', newTags)
  emit('edit', { oldName, newName })
  
  // 更新全局标签库
  categoryStore.renameTag(oldName, newName)
  
  cancelEdit()
}

const cancelEdit = () => {
  editingTag.value = null
  editingTagName.value = ''
}

const getTagUsage = (tag) => {
  const count = tagUsageMap.value.get(tag) || 0
  return count > 0 ? `${count}次使用` : '未使用'
}

const handleTagsReorder = (event) => {
  if (event.moved) {
    emit('reorder', currentTags.value)
  }
}

// Watch for editing tag changes
watch(editingTag, (newTag) => {
  if (newTag) {
    nextTick(() => {
      if (editInput.value) {
        editInput.value.focus()
        editInput.value.select()
      }
    })
  }
})
</script>

<style scoped>
.tag-manager {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.tag-input-section {
  margin-bottom: 24px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.tag-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.add-tag-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.add-tag-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-tag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-suggestions {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.suggestions-title {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggestion-tag {
  padding: 4px 8px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-tag:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.current-tags-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.tag-count {
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.clear-all-btn {
  padding: 6px 12px;
  background: none;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: #ef4444;
  color: white;
}

.filter-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  width: 120px;
}

.empty-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  color: #6b7280;
  text-align: center;
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tag-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.tag-item.selected {
  background: #dbeafe;
  border-color: #3b82f6;
}

.tag-item.editing {
  background: white;
  border-color: #3b82f6;
}

.tag-content {
  flex: 1;
  min-width: 0;
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  display: block;
}

.tag-usage {
  font-size: 11px;
  color: #6b7280;
}

.tag-edit {
  flex: 1;
}

.tag-edit-input {
  width: 100%;
  padding: 4px 6px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.tag-edit-input:focus {
  outline: none;
}

.tag-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tag-item:hover .tag-actions {
  opacity: 1;
}

.tag-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  color: #6b7280;
}

.edit-btn:hover {
  color: #3b82f6;
  background: #dbeafe;
}

.remove-btn {
  color: #6b7280;
}

.remove-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.global-tags-section {
  margin-bottom: 24px;
}

.global-tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.global-tag-item {
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.global-tag-item:hover {
  background: #e2e8f0;
}

.global-tag-item.in-use {
  background: #e0e7ff;
  border-color: #c7d2fe;
  opacity: 0.6;
  cursor: not-allowed;
}

.tag-stats {
  padding: 16px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #374151;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .input-wrapper {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .tags-grid {
    grid-template-columns: 1fr;
  }
  
  .global-tags-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>