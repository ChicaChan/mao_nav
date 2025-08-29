<template>
  <div class="enhanced-search-box">
    <div class="search-container">
      <div class="search-mode-toggle">
        <button 
          @click="searchMode = 'external'" 
          :class="{ active: searchMode === 'external' }"
          class="mode-btn"
        >
          站外搜索
        </button>
        <button 
          @click="searchMode = 'internal'" 
          :class="{ active: searchMode === 'internal' }"
          class="mode-btn"
        >
          站内搜索
        </button>
      </div>
      
      <div class="search-input-container">
        <div v-if="searchMode === 'external'" class="search-engine-selector">
          <select v-model="selectedEngine" class="engine-select">
            <option value="google">Google</option>
            <option value="baidu">百度</option>
            <option value="bing">Bing</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>
        </div>
        
        <div class="search-input-wrapper">
          <input 
            v-model="searchQuery" 
            @input="handleSearch" 
            :placeholder="searchPlaceholder" 
            class="search-input"
            @keyup.enter="executeSearch"
          />
          <button @click="executeSearch" class="search-icon-btn" title="搜索">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  allSites: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['external-search', 'internal-filter'])

const searchMode = ref('external')
const searchQuery = ref('')
const selectedEngine = ref('google')

const searchPlaceholder = computed(() => {
  return searchMode.value === 'external' 
    ? '输入关键词进行搜索...' 
    : '搜索站内网站...'
})

const handleSearch = () => {
  if (searchMode.value === 'internal') {
    const filteredSites = props.allSites.filter(site => 
      site.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (site.description && site.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
    emit('internal-filter', filteredSites)
  }
}

const executeSearch = () => {
  if (!searchQuery.value.trim()) return
  
  if (searchMode.value === 'external') {
    emit('external-search', searchQuery.value, selectedEngine.value)
  } else {
    handleSearch()
  }
}
</script>

<style scoped>
.enhanced-search-box {
  width: 100%;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-mode-toggle {
  display: flex;
  gap: 5px;
}

.mode-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.mode-btn:hover {
  background: #f5f5f5;
}

.mode-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.search-input-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-engine-selector {
  min-width: 100px;
}

.engine-select {
  padding: 10px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  margin: 0;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 10px 45px 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  margin: 0;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.search-icon-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 3px;
  color: #6c757d;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon-btn:hover {
  background: #f8f9fa;
  color: #007bff;
}

.search-icon-btn:active {
  background: #e9ecef;
}



@media (max-width: 768px) {
  .search-input-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-engine-selector {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>