<template>
  <div class="metric-card" :class="{ 'trend-up': trend === 'up', 'trend-down': trend === 'down' }">
    <div class="metric-header">
      <div class="metric-icon">
        <component :is="iconComponent" />
      </div>
      <div class="metric-trend" v-if="trend">
        <svg v-if="trend === 'up'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
        <span>{{ trendValue }}</span>
      </div>
    </div>
    
    <div class="metric-content">
      <div class="metric-value">{{ formattedValue }}</div>
      <div class="metric-label">{{ label }}</div>
      <div class="metric-description" v-if="description">{{ description }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: String,
  icon: String,
  trend: {
    type: String,
    validator: value => ['up', 'down'].includes(value)
  },
  trendValue: String,
  format: {
    type: String,
    default: 'number'
  }
})

const iconComponent = computed(() => {
  // 简单的图标组件映射
  const icons = {
    users: () => '👥',
    views: () => '👁️',
    clicks: () => '👆',
    time: () => '⏱️'
  }
  return icons[props.icon] || (() => '📊')
})

const formattedValue = computed(() => {
  if (props.format === 'percentage') {
    return `${props.value}%`
  } else if (props.format === 'duration') {
    return formatDuration(props.value)
  } else if (props.format === 'number') {
    return formatNumber(props.value)
  }
  return props.value
})

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
</script>

<style scoped>
.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #e2e8f0;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.metric-card.trend-up {
  border-left-color: #10b981;
}

.metric-card.trend-down {
  border-left-color: #ef4444;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-icon {
  width: 40px;
  height: 40px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.trend-up .metric-trend {
  color: #10b981;
}

.trend-down .metric-trend {
  color: #ef4444;
}

.metric-content {
  text-align: left;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.metric-description {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .metric-card {
    padding: 16px;
  }
  
  .metric-value {
    font-size: 24px;
  }
}
</style>