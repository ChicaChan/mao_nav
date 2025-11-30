<template>
  <div class="simple-demo">
    <div class="demo-header">
      <h1>🎉 导航站新功能演示</h1>
      <p>以下是已实现的六大核心功能模块</p>
    </div>

    <div class="features-showcase">
      <!-- 搜索功能演示 -->
      <div class="feature-section">
        <h2>🔍 智能搜索系统</h2>
        <div class="feature-demo">
          <div class="search-demo">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="输入关键词体验智能搜索..."
              class="demo-search-input"
              @input="handleSearch"
            />
            <div v-if="searchResults.length > 0" class="search-results">
              <div v-for="result in searchResults" :key="result.id" class="search-result-item">
                {{ result.name }} - {{ result.description }}
              </div>
            </div>
          </div>
          <div class="feature-description">
            <h3>功能特点：</h3>
            <ul>
              <li>✅ 实时模糊搜索</li>
              <li>✅ 拼音匹配支持</li>
              <li>✅ 搜索历史记录</li>
              <li>✅ 热门推荐算法</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 分类管理演示 -->
      <div class="feature-section">
        <h2>📁 分类标签系统</h2>
        <div class="feature-demo">
          <div class="category-demo">
            <div class="category-tree-demo">
              <div class="category-item" v-for="category in demoCategories" :key="category.id">
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">({{ category.count }})</span>
              </div>
            </div>
          </div>
          <div class="feature-description">
            <h3>功能特点：</h3>
            <ul>
              <li>✅ 多级目录结构</li>
              <li>✅ 拖拽排序功能</li>
              <li>✅ 智能标签管理</li>
              <li>✅ 批量操作支持</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 收藏夹功能演示 -->
      <div class="feature-section">
        <h2>⭐ 用户收藏夹</h2>
        <div class="feature-demo">
          <div class="favorites-demo">
            <div class="favorite-item" v-for="fav in demoFavorites" :key="fav.id">
              <div class="fav-icon">{{ fav.icon }}</div>
              <div class="fav-info">
                <div class="fav-name">{{ fav.name }}</div>
                <div class="fav-url">{{ fav.url }}</div>
              </div>
              <div class="fav-actions">
                <button class="fav-btn">访问</button>
              </div>
            </div>
          </div>
          <div class="feature-description">
            <h3>功能特点：</h3>
            <ul>
              <li>✅ 个人收藏管理</li>
              <li>✅ 分组分类功能</li>
              <li>✅ 访问历史记录</li>
              <li>✅ 导入导出数据</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 数据统计演示 -->
      <div class="feature-section">
        <h2>📊 数据统计面板</h2>
        <div class="feature-demo">
          <div class="stats-demo">
            <div class="stat-card" v-for="stat in demoStats" :key="stat.label">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
          <div class="feature-description">
            <h3>功能特点：</h3>
            <ul>
              <li>✅ 实时访问统计</li>
              <li>✅ 热门链接分析</li>
              <li>✅ 用户行为追踪</li>
              <li>✅ 可视化图表</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- URL检测演示 -->
      <div class="feature-section">
        <h2>🔗 URL检测与图标抓取</h2>
        <div class="feature-demo">
          <div class="url-demo">
            <input 
              type="url" 
              v-model="testUrl"
              placeholder="输入网址测试自动检测功能..."
              class="demo-url-input"
            />
            <button @click="testUrlValidation" class="test-btn">检测网址</button>
            <div v-if="urlResult" class="url-result">
              <div class="result-item">
                <strong>状态:</strong> {{ urlResult.status }}
              </div>
              <div class="result-item">
                <strong>标题:</strong> {{ urlResult.title }}
              </div>
              <div class="result-item">
                <strong>图标:</strong> <img :src="urlResult.icon" alt="icon" class="result-icon" />
              </div>
            </div>
          </div>
          <div class="feature-description">
            <h3>功能特点：</h3>
            <ul>
              <li>✅ 自动URL验证</li>
              <li>✅ 网站信息抓取</li>
              <li>✅ 图标自动获取</li>
              <li>✅ 批量处理支持</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 响应式设计演示 -->
      <div class="feature-section">
        <h2>📱 响应式布局</h2>
        <div class="feature-demo">
          <div class="responsive-demo">
            <div class="device-preview desktop">
              <div class="device-label">桌面端</div>
              <div class="device-screen">完整功能界面</div>
            </div>
            <div class="device-preview tablet">
              <div class="device-label">平板端</div>
              <div class="device-screen">适配布局</div>
            </div>
            <div class="device-preview mobile">
              <div class="device-label">移动端</div>
              <div class="device-screen">触摸优化</div>
            </div>
          </div>
          <div class="feature-description">
            <h3>功能特点：</h3>
            <ul>
              <li>✅ 多设备适配</li>
              <li>✅ 触摸友好界面</li>
              <li>✅ PWA支持</li>
              <li>✅ 离线访问</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <div class="demo-footer">
      <router-link to="/" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="m12 19-7-7 7-7"/>
          <path d="m19 12H5"/>
        </svg>
        返回主页
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 搜索功能演示
const searchQuery = ref('')
const searchResults = ref([])

const mockData = [
  { id: 1, name: 'GitHub', description: '代码托管平台' },
  { id: 2, name: 'Google', description: '搜索引擎' },
  { id: 3, name: 'Vue.js', description: '前端框架' },
  { id: 4, name: 'MDN', description: 'Web开发文档' }
]

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    searchResults.value = mockData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.includes(searchQuery.value)
    )
  } else {
    searchResults.value = []
  }
}

// 分类演示数据
const demoCategories = ref([
  { id: 1, name: '开发工具', icon: '🛠️', count: 12 },
  { id: 2, name: '设计资源', icon: '🎨', count: 8 },
  { id: 3, name: '学习资料', icon: '📚', count: 15 },
  { id: 4, name: '娱乐休闲', icon: '🎮', count: 6 }
])

// 收藏夹演示数据
const demoFavorites = ref([
  { id: 1, name: 'Vue.js官网', url: 'https://vuejs.org', icon: '🟢' },
  { id: 2, name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { id: 3, name: 'MDN文档', url: 'https://developer.mozilla.org', icon: '📖' }
])

// 统计数据演示
const demoStats = ref([
  { label: '总访问量', value: '12,345' },
  { label: '今日访问', value: '234' },
  { label: '收藏网站', value: '89' },
  { label: '活跃用户', value: '156' }
])

// URL检测演示
const testUrl = ref('')
const urlResult = ref(null)

const testUrlValidation = () => {
  if (testUrl.value) {
    // 模拟URL检测结果
    urlResult.value = {
      status: '✅ 可访问',
      title: '示例网站标题',
      icon: '/favicon.ico'
    }
  }
}
</script>

<style scoped>
.simple-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.demo-header {
  text-align: center;
  color: white;
  margin-bottom: 50px;
}

.demo-header h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.demo-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.features-showcase {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.feature-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.feature-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.feature-demo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}

.feature-description h3 {
  color: #34495e;
  margin-bottom: 15px;
}

.feature-description ul {
  list-style: none;
  padding: 0;
}

.feature-description li {
  padding: 5px 0;
  color: #7f8c8d;
}

/* 搜索演示样式 */
.demo-search-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 15px;
}

.search-results {
  background: #f8f9fa;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.search-result-item {
  padding: 10px 15px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
}

.search-result-item:hover {
  background: #e9ecef;
}

/* 分类演示样式 */
.category-tree-demo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 10px;
}

.category-icon {
  font-size: 20px;
}

.category-name {
  flex: 1;
  font-weight: 500;
}

.category-count {
  color: #6c757d;
  font-size: 14px;
}

/* 收藏夹演示样式 */
.favorites-demo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  gap: 15px;
}

.fav-icon {
  font-size: 24px;
}

.fav-info {
  flex: 1;
}

.fav-name {
  font-weight: 600;
  color: #2c3e50;
}

.fav-url {
  font-size: 14px;
  color: #6c757d;
}

.fav-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 统计演示样式 */
.stats-demo {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-label {
  color: #6c757d;
  margin-top: 5px;
}

/* URL检测演示样式 */
.url-demo {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.demo-url-input {
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
}

.test-btn {
  padding: 12px 24px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.url-result {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.result-item {
  margin-bottom: 8px;
}

.result-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

/* 响应式演示样式 */
.responsive-demo {
  display: flex;
  gap: 15px;
  justify-content: space-between;
}

.device-preview {
  flex: 1;
  text-align: center;
}

.device-label {
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}

.device-screen {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  font-size: 14px;
  color: #6c757d;
}

.desktop .device-screen {
  height: 80px;
}

.tablet .device-screen {
  height: 70px;
}

.mobile .device-screen {
  height: 60px;
}

/* 底部按钮 */
.demo-footer {
  text-align: center;
  margin-top: 50px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 30px;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .feature-demo {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .stats-demo {
    grid-template-columns: 1fr;
  }
  
  .responsive-demo {
    flex-direction: column;
  }
  
  .simple-demo {
    padding: 20px 15px;
  }
  
  .feature-section {
    padding: 20px;
  }
}
</style>