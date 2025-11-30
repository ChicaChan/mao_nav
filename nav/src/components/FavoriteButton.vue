<template>
  <button 
    @click="toggleFavorite" 
    :class="['favorite-btn', { 'is-favorited': isFavorited }]"
    :title="isFavorited ? '点击取消收藏' : '点击添加收藏'"
    :aria-label="isFavorited ? '取消收藏' : '添加收藏'"
  >
    <!-- 未收藏状态：空心爱心 -->
    <svg 
      v-if="!isFavorited" 
      class="favorite-icon unfavorited"
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      />
    </svg>
    
    <!-- 已收藏状态：实心爱心 -->
    <svg 
      v-else 
      class="favorite-icon favorited"
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isFavorited: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['toggle'])

const toggleFavorite = () => {
  emit('toggle')
}
</script>

<style scoped>
.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  outline: none;
}

/* 未收藏状态样式 */
.favorite-btn .unfavorited {
  color: #9ca3af; /* 灰色 */
  transition: all 0.3s ease;
}

/* 已收藏状态样式 */
.favorite-btn .favorited {
  color: #ef4444; /* 红色 */
  transition: all 0.3s ease;
  animation: heartBeat 0.6s ease-in-out;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.3));
}

/* 悬停效果 */
.favorite-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.favorite-btn:hover .unfavorited {
  color: #6b7280; /* 深一点的灰色 */
}

.favorite-btn:hover .favorited {
  color: #dc2626; /* 深一点的红色 */
  filter: drop-shadow(0 0 6px rgba(220, 38, 38, 0.4));
}

/* 状态切换动画 */
.favorite-btn .favorite-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.favorite-btn:active .favorite-icon {
  transform: scale(0.85);
}

/* 点击效果 */
.favorite-btn:active {
  transform: scale(0.95);
}

/* 收藏成功的心跳动画 */
@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.2);
  }
  70% {
    transform: scale(1);
  }
}

/* 不同尺寸支持 */
.favorite-btn.size-small {
  padding: 4px;
}

.favorite-btn.size-small .favorite-icon {
  width: 16px;
  height: 16px;
}

.favorite-btn.size-medium {
  padding: 8px;
}

.favorite-btn.size-medium .favorite-icon {
  width: 20px;
  height: 20px;
}

.favorite-btn.size-large {
  padding: 12px;
}

.favorite-btn.size-large .favorite-icon {
  width: 24px;
  height: 24px;
}

/* 焦点状态 */
.favorite-btn:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .favorite-btn {
    padding: 6px;
    min-width: 32px;
    min-height: 32px;
  }
  
  .favorite-btn .favorite-icon {
    width: 18px;
    height: 18px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .favorite-btn .unfavorited {
    color: #374151;
  }
  
  .favorite-btn .favorited {
    color: #dc2626;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .favorite-btn,
  .favorite-icon {
    transition: none;
  }
  
  .favorited {
    animation: none;
  }
  
  .favorite-btn:hover {
    transform: none;
  }
}
</style>