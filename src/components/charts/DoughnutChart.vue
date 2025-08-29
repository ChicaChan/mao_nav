<template>
  <div class="doughnut-chart">
    <canvas ref="chartCanvas" :width="width" :height="height"></canvas>
    <div class="chart-legend">
      <div 
        v-for="(item, index) in legendItems" 
        :key="index"
        class="legend-item"
      >
        <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 300
  }
})

const chartCanvas = ref(null)

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const legendItems = computed(() => {
  if (!props.data.datasets || !props.data.datasets[0]) return []
  
  const dataset = props.data.datasets[0]
  return props.data.labels.map((label, index) => ({
    label,
    value: dataset.data[index],
    color: colors[index % colors.length]
  }))
})

const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  const data = props.data.datasets[0].data
  if (!data || data.length === 0) return
  
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 20
  const innerRadius = radius * 0.6
  
  const total = data.reduce((sum, value) => sum + value, 0)
  let currentAngle = -Math.PI / 2
  
  // 绘制扇形
  data.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI
    const color = colors[index % colors.length]
    
    // 外圆弧
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    currentAngle += sliceAngle
  })
  
  // 中心文字
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('总计', centerX, centerY - 10)
  ctx.font = 'bold 20px sans-serif'
  ctx.fillText(total.toString(), centerX, centerY + 10)
}

onMounted(() => {
  drawChart()
})

watch(() => props.data, () => {
  drawChart()
}, { deep: true })
</script>

<style scoped>
.doughnut-chart {
  display: flex;
  align-items: center;
  gap: 20px;
}

canvas {
  flex-shrink: 0;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  flex: 1;
  color: #374151;
}

.legend-value {
  font-weight: 600;
  color: #1f2937;
}

@media (max-width: 768px) {
  .doughnut-chart {
    flex-direction: column;
    align-items: center;
  }
}
</style>