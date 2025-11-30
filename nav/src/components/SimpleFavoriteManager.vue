<template>
  <div class="simple-favorite-manager">
    <div v-if="userStore.favorites.length === 0" class="empty-state">
      <div class="empty-icon">⭐</div>
      <h3>还没有收藏</h3>
      <p>点击网站卡片上的星星按钮来添加收藏</p>
    </div>
    
    <div v-else class="favorites-list">
      <div 
        v-for="favorite in userStore.favorites" 
        :key="favorite.id"
        class="favorite-item"
      >
        <div class="favorite-icon">
          <img :src="favorite.icon" :alt="favorite.name" @error="handleImageError" />
        </div>
        <div class="favorite-info">
          <h4 class="favorite-name">{{ favorite.name }}</h4>
          <p class="favorite-description">{{ favorite.description }}</p>
          <span class="favorite-time">{{ formatTime(favorite.addedTime) }}</span>
        </div>
        <div class="favorite-actions">
          <a 
            :href="favorite.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="visit-btn"
            title="访问网站"
          >
            🔗
          </a>
          <button 
            @click="removeFavorite(favorite.id)"
            class="remove-btn"
            title="移除收藏"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/simpleUserStore.js'

const userStore = useUserStore()

const removeFavorite = (siteId) => {
  userStore.removeFavorite(siteId)
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
</script>

<style scoped>
.simple-favorite-manager {
  height: 100%;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #495057;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.favorite-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.favorite-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.favorite-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.favorite-info {
  flex: 1;
  min-width: 0;
}

.favorite-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-description {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-time {
  font-size: 11px;
  color: #adb5bd;
}

.favorite-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.visit-btn,
.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.visit-btn {
  background: #d1ecf1;
  color: #0c5460;
}

.visit-btn:hover {
  background: #74b9ff;
  color: white;
}

.remove-btn {
  background: #f8d7da;
  color: #721c24;
}

.remove-btn:hover {
  background: #f5c6cb;
  transform: scale(1.1);
}
</style>