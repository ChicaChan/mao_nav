<template>
  <div class="line-chart">
    <canvas ref="chartCanvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 200
  }
})

const chartCanvas = ref(null)

const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 简单的折线图实现
  const data = props.data.datasets[0].data
  const labels = props.data.labels
  
  if (!data || data.length === 0) return
  
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const valueRange = maxValue - minValue || 1
  
  // 绘制网格线
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  
  // 水平网格线
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }
  
  // 垂直网格线
  for (let i = 0; i <= data.length - 1; i++) {
    const x = padding + (chartWidth / (data.length - 1)) * i
    ctx.beginPath()
    ctx.moveTo(x, padding)
    ctx.lineTo(x, height - padding)
    ctx.stroke()
  }
  
  // 绘制折线
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 3
  ctx.beginPath()
  
  data.forEach((value, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index
    const y = height - padding - ((value - minValue) / valueRange) * chartHeight
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // 绘制数据点
  ctx.fillStyle = '#3b82f6'
  data.forEach((value, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index
    const y = height - padding - ((value - minValue) / valueRange) * chartHeight
    
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
  
  // 绘制标签
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  
  labels.forEach((label, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index
    ctx.fillText(label, x, height - 10)
  })
}

onMounted(() => {
  drawChart()
})

watch(() => props.data, () => {
  drawChart()
}, { deep: true })
</script>

<style scoped>
.line-chart {
  width: 100%;
  height: 100%;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>