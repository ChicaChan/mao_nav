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
  gap: var(--space-md);
  background: var(--glass-effect);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s var(--ease-out-expo);
}

.search-container:hover {
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

.search-mode-toggle {
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-muted);
  border-radius: var(--radius-full);
  padding: var(--space-xs);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mode-btn {
  flex: 1;
  padding: var(--space-sm) var(--space-lg);
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: all 0.3s var(--ease-out-expo);
  position: relative;
  overflow: hidden;
}

.mode-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--primary-gradient);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.mode-btn span {
  position: relative;
  z-index: 1;
}

.mode-btn:hover {
  background: var(--glass-effect);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.mode-btn.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.mode-btn.active::before {
  opacity: 1;
}

.search-input-container {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.search-engine-selector {
  min-width: 120px;
}

.engine-select {
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--glass-effect);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  outline: none;
  transition: all 0.3s var(--ease-out-expo);
  cursor: pointer;
}

.engine-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: var(--space-md) 50px var(--space-md) var(--space-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--glass-effect);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  outline: none;
  transition: all 0.3s var(--ease-out-expo);
  box-shadow: var(--shadow-sm);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

.search-icon-btn {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  background: var(--primary-gradient);
  border: none;
  cursor: pointer;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  color: white;
  transition: all 0.3s var(--ease-spring);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.search-icon-btn:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: var(--shadow-glow-accent);
}

.search-icon-btn:active {
  transform: translateY(-50%) scale(0.95);
}



@media (max-width: 768px) {
  .search-container {
    padding: var(--space-md);
    border-radius: var(--radius-xl);
    gap: var(--space-sm);
  }

  .search-mode-toggle {
    gap: var(--space-xs);
  }

  .mode-btn {
    padding: var(--space-sm);
    font-size: 0.8rem;
  }

  .search-input-container {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .search-engine-selector {
    width: 100%;
    min-width: unset;
  }

  .engine-select {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.875rem;
  }

  .search-input {
    width: 100%;
    padding: var(--space-sm) 45px var(--space-sm) var(--space-md);
    font-size: 0.875rem;
  }

  .search-icon-btn {
    right: var(--space-sm);
    padding: var(--space-sm);
  }

  .search-icon-btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>