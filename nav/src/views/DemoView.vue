<template>
  <div class="demo-container">
    <h1>🎉 导航站新功能演示</h1>
    
    <!-- 功能展示区域 -->
    <div class="features-grid">
      <!-- 搜索功能 -->
      <div class="feature-card">
        <h2>🔍 智能搜索</h2>
        <SearchBox />
        <p>支持模糊搜索、拼音匹配、搜索历史和热门推荐</p>
      </div>

      <!-- 分类管理 -->
      <div class="feature-card">
        <h2>📁 分类管理</h2>
        <CategoryTree />
        <p>多级目录、拖拽排序、智能标签系统</p>
      </div>

      <!-- 收藏夹 -->
      <div class="feature-card">
        <h2>⭐ 收藏夹</h2>
        <FavoriteManager />
        <p>个人收藏、分组管理、访问历史</p>
      </div>

      <!-- 数据统计 -->
      <div class="feature-card">
        <h2>📊 数据统计</h2>
        <AnalyticsDashboard />
        <p>实时监控、访问统计、热门链接分析</p>
      </div>

      <!-- 标签管理 -->
      <div class="feature-card">
        <h2>🏷️ 标签系统</h2>
        <TagManager />
        <p>智能标签、使用统计、全局标签库</p>
      </div>
    </div>

    <!-- 返回主页按钮 -->
    <div class="back-home">
      <router-link to="/" class="back-btn">返回主页</router-link>
    </div>
  </div>
</template>

<script setup>
import SearchBox from '@/components/SearchBox.vue'
import CategoryTree from '@/components/CategoryTree.vue'
import FavoriteManager from '@/components/FavoriteManager.vue'
import AnalyticsDashboard from '@/components/AnalyticsDashboard.vue'
import TagManager from '@/components/TagManager.vue'
</script>

<style scoped>
.demo-container {
  padding: 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.demo-container h1 {
  text-align: center;
  color: white;
  font-size: 2.5rem;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.feature-card p {
  color: #7f8c8d;
  margin-top: 15px;
  line-height: 1.6;
}

.back-home {
  text-align: center;
}

.back-btn {
  display: inline-block;
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

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .feature-card {
    padding: 20px;
  }
  
  .demo-container h1 {
    font-size: 2rem;
  }
}
</style>