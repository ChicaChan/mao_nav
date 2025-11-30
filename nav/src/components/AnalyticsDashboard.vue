<template>
  <div class="analytics-dashboard">
    <!-- 仪表板头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">数据统计面板</h1>
        <div class="last-updated">
          最后更新: {{ formatDate(lastUpdated) }}
        </div>
      </div>
      
      <div class="header-right">
        <div class="time-range-selector">
          <select v-model="selectedTimeRange" @change="updateTimeRange">
            <option value="today">今天</option>
            <option value="yesterday">昨天</option>
            <option value="7days">最近7天</option>
            <option value="30days">最近30天</option>
            <option value="90days">最近90天</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        <button
          class="refresh-btn"
          @click="refreshData"
          :disabled="loading"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23,4 23,10 17,10"></polyline>
            <polyline points="1,20 1,14 7,14"></polyline>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4a9 9 0 01-14.85 8.36L23 14"></path>
          </svg>
          刷新
        </button>
        
        <button
          class="export-btn"
          @click="exportReport"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="12" y1="11" x2="12" y2="21"></line>
            <polyline points="16,15 12,19 8,15"></polyline>
          </svg>
          导出
        </button>
      </div>
    </div>

    <!-- 自定义时间范围选择器 -->
    <div v-if="selectedTimeRange === 'custom'" class="custom-date-range">
      <div class="date-inputs">
        <input
          v-model="customStartDate"
          type="date"
          class="date-input"
        />
        <span class="date-separator">至</span>
        <input
          v-model="customEndDate"
          type="date"
          class="date-input"
        />
        <button
          class="apply-btn"
          @click="applyCustomRange"
        >
          应用
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载数据...</div>
    </div>

    <!-- 主要指标卡片 -->
    <div class="metrics-grid">
      <MetricCard
        title="页面访问量"
        :value="metrics.pageViews"
        :change="metrics.pageViewsChange"
        icon="eye"
        color="blue"
      />
      <MetricCard
        title="点击次数"
        :value="metrics.clicks"
        :change="metrics.clicksChange"
        icon="mouse-pointer"
        color="green"
      />
      <MetricCard
        title="搜索次数"
        :value="metrics.searches"
        :change="metrics.searchesChange"
        icon="search"
        color="purple"
      />
      <MetricCard
        title="独立访客"
        :value="metrics.uniqueVisitors"
        :change="metrics.uniqueVisitorsChange"
        icon="users"
        color="orange"
      />
      <MetricCard
        title="平均会话时长"
        :value="formatDuration(metrics.averageSessionDuration)"
        :change="metrics.sessionDurationChange"
        icon="clock"
        color="teal"
        :is-duration="true"
      />
      <MetricCard
        title="跳出率"
        :value="metrics.bounceRate + '%'"
        :change="metrics.bounceRateChange"
        icon="trending-down"
        color="red"
        :is-percentage="true"
        :invert-change="true"
      />
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="charts-grid">
        <!-- 访问趋势图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">访问趋势</h3>
            <div class="chart-controls">
              <div class="chart-type-selector">
                <button
                  v-for="type in ['pageViews', 'clicks', 'searches']"
                  :key="type"
                  class="chart-type-btn"
                  :class="{ active: trendChartType === type }"
                  @click="trendChartType = type"
                >
                  {{ getChartTypeLabel(type) }}
                </button>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <LineChart
              :data="trendChartData"
              :options="trendChartOptions"
              height="300"
            />
          </div>
        </div>

        <!-- 热门内容 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">热门内容</h3>
          </div>
          <div class="chart-content">
            <div class="top-content-list">
              <div
                v-for="(item, index) in topContent"
                :key="item.url"
                class="content-item"
              >
                <div class="content-rank">{{ index + 1 }}</div>
                <div class="content-info">
                  <div class="content-name">{{ item.name }}</div>
                  <div class="content-url">{{ item.url }}</div>
                  <div class="content-category">{{ item.category }}</div>
                </div>
                <div class="content-stats">
                  <div class="stat-value">{{ item.clicks }}</div>
                  <div class="stat-label">点击</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分类统计 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">分类统计</h3>
          </div>
          <div class="chart-content">
            <DoughnutChart
              :data="categoryChartData"
              :options="categoryChartOptions"
              height="300"
            />
          </div>
        </div>

        <!-- 搜索词云 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">热门搜索</h3>
          </div>
          <div class="chart-content">
            <div class="search-terms-list">
              <div
                v-for="(term, index) in topSearchTerms"
                :key="term.query"
                class="search-term-item"
              >
                <div class="term-rank">{{ index + 1 }}</div>
                <div class="term-query">{{ term.query }}</div>
                <div class="term-count">{{ term.count }}次</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细统计表格 -->
    <div class="detailed-stats">
      <div class="stats-tabs">
        <button
          v-for="tab in statsTabs"
          :key="tab.key"
          class="stats-tab"
          :class="{ active: activeStatsTab === tab.key }"
          @click="activeStatsTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="stats-content">
        <!-- 实时活动 -->
        <div v-if="activeStatsTab === 'realtime'" class="realtime-stats">
          <div class="realtime-header">
            <h4>实时活动</h4>
            <div class="realtime-indicator">
              <div class="indicator-dot"></div>
              <span>{{ realtimeUsers }} 在线用户</span>
            </div>
          </div>
          <div class="realtime-events">
            <div
              v-for="event in recentEvents"
              :key="event.id"
              class="event-item"
            >
              <div class="event-time">{{ formatTime(event.timestamp) }}</div>
              <div class="event-type">{{ getEventTypeLabel(event.type) }}</div>
              <div class="event-details">{{ getEventDetails(event) }}</div>
            </div>
          </div>
        </div>

        <!-- 用户行为 -->
        <div v-if="activeStatsTab === 'behavior'" class="behavior-stats">
          <div class="behavior-metrics">
            <div class="behavior-metric">
              <div class="metric-label">平均页面停留时间</div>
              <div class="metric-value">{{ formatDuration(behaviorMetrics.averageTimeOnPage) }}</div>
            </div>
            <div class="behavior-metric">
              <div class="metric-label">页面深度</div>
              <div class="metric-value">{{ behaviorMetrics.averagePageDepth }}</div>
            </div>
            <div class="behavior-metric">
              <div class="metric-label">参与度分数</div>
              <div class="metric-value">{{ behaviorMetrics.engagementScore }}/100</div>
            </div>
          </div>
          
          <div class="user-paths">
            <h5>用户路径分析</h5>
            <div class="path-list">
              <div
                v-for="path in userPaths"
                :key="path.path"
                class="path-item"
              >
                <div class="path-flow">{{ path.path }}</div>
                <div class="path-count">{{ path.count }}次</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 设备统计 -->
        <div v-if="activeStatsTab === 'devices'" class="device-stats">
          <div class="device-charts">
            <div class="device-chart">
              <h5>设备类型</h5>
              <BarChart
                :data="deviceTypeChartData"
                :options="deviceChartOptions"
                height="200"
              />
            </div>
            <div class="device-chart">
              <h5>浏览器分布</h5>
              <BarChart
                :data="browserChartData"
                :options="deviceChartOptions"
                height="200"
              />
            </div>
          </div>
        </div>

        <!-- 性能监控 -->
        <div v-if="activeStatsTab === 'performance'" class="performance-stats">
          <div class="performance-metrics">
            <div class="perf-metric">
              <div class="metric-label">页面加载时间</div>
              <div class="metric-value">{{ performanceMetrics.loadTime }}ms</div>
              <div class="metric-status" :class="getPerformanceStatus(performanceMetrics.loadTime, 3000)">
                {{ getPerformanceLabel(performanceMetrics.loadTime, 3000) }}
              </div>
            </div>
            <div class="perf-metric">
              <div class="metric-label">首次内容绘制</div>
              <div class="metric-value">{{ performanceMetrics.firstContentfulPaint }}ms</div>
              <div class="metric-status" :class="getPerformanceStatus(performanceMetrics.firstContentfulPaint, 1500)">
                {{ getPerformanceLabel(performanceMetrics.firstContentfulPaint, 1500) }}
              </div>
            </div>
            <div class="perf-metric">
              <div class="metric-label">最大内容绘制</div>
              <div class="metric-value">{{ performanceMetrics.largestContentfulPaint }}ms</div>
              <div class="metric-status" :class="getPerformanceStatus(performanceMetrics.largestContentfulPaint, 2500)">
                {{ getPerformanceLabel(performanceMetrics.largestContentfulPaint, 2500) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog
      v-if="showExportDialog"
      :data="exportData"
      @export="handleExport"
      @cancel="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAnalyticsStore } from '../stores/analyticsStore.js'
import { 
  UserBehaviorAnalyzer, 
  ContentAnalyzer, 
  ReportGenerator,
  PerformanceAnalyzer 
} from '../utils/analytics.js'
import { formatDate, formatDuration } from '../utils/common.js'
import MetricCard from './MetricCard.vue'
import LineChart from './charts/LineChart.vue'
import DoughnutChart from './charts/DoughnutChart.vue'
import BarChart from './charts/BarChart.vue'
import ExportDialog from './ExportDialog.vue'

// Store
const analyticsStore = useAnalyticsStore()

// Analyzers
const userBehaviorAnalyzer = new UserBehaviorAnalyzer(analyticsStore)
const contentAnalyzer = new ContentAnalyzer(analyticsStore)
const reportGenerator = new ReportGenerator(analyticsStore)
const performanceAnalyzer = new PerformanceAnalyzer()

// Reactive data
const loading = ref(false)
const lastUpdated = ref(new Date())
const selectedTimeRange = ref('7days')
const customStartDate = ref('')
const customEndDate = ref('')
const trendChartType = ref('pageViews')
const activeStatsTab = ref('realtime')
const showExportDialog = ref(false)
const exportData = ref(null)

// Auto refresh
const refreshInterval = ref(null)
const realtimeUsers = ref(0)

// Computed properties
const metrics = computed(() => {
  const dailyStats = analyticsStore.dailyStats
  const today = dailyStats[dailyStats.length - 1] || {}
  const yesterday = dailyStats[dailyStats.length - 2] || {}
  
  return {
    pageViews: today.pageViews || 0,
    pageViewsChange: calculateChange(yesterday.pageViews, today.pageViews),
    clicks: today.clicks || 0,
    clicksChange: calculateChange(yesterday.clicks, today.clicks),
    searches: today.searches || 0,
    searchesChange: calculateChange(yesterday.searches, today.searches),
    uniqueVisitors: analyticsStore.uniqueVisitors,
    uniqueVisitorsChange: 0, // 需要历史数据计算
    averageSessionDuration: analyticsStore.averageSessionDuration,
    sessionDurationChange: 0, // 需要历史数据计算
    bounceRate: analyticsStore.bounceRate,
    bounceRateChange: 0 // 需要历史数据计算
  }
})

const trendChartData = computed(() => {
  const dailyStats = analyticsStore.dailyStats
  const labels = dailyStats.map(stat => formatDate(stat.date, 'MM/DD'))
  const data = dailyStats.map(stat => stat[trendChartType.value] || 0)
  
  return {
    labels,
    datasets: [{
      label: getChartTypeLabel(trendChartType.value),
      data,
      borderColor: getChartColor(trendChartType.value),
      backgroundColor: getChartColor(trendChartType.value, 0.1),
      tension: 0.4,
      fill: true
    }]
  }
})

const trendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}))

const topContent = computed(() => {
  return contentAnalyzer.analyzePopularContent().slice(0, 10)
})

const categoryChartData = computed(() => {
  const categories = contentAnalyzer.analyzeCategoryPerformance()
  const labels = categories.map(cat => cat.category)
  const data = categories.map(cat => cat.clicks)
  const colors = generateColors(labels.length)
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 0
    }]
  }
})

const categoryChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right'
    }
  }
}))

const topSearchTerms = computed(() => {
  const searchAnalysis = contentAnalyzer.analyzeSearchBehavior()
  return searchAnalysis?.topQueries || []
})

const recentEvents = computed(() => {
  return analyticsStore.events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
})

const behaviorMetrics = computed(() => {
  const engagement = userBehaviorAnalyzer.analyzeEngagement()
  return {
    averageTimeOnPage: engagement?.averageSessionDuration || 0,
    averagePageDepth: engagement?.averagePageViews || 0,
    engagementScore: Math.round(engagement?.engagementScore || 0)
  }
})

const userPaths = computed(() => {
  return userBehaviorAnalyzer.analyzeUserPaths().slice(0, 10)
})

const deviceTypeChartData = computed(() => {
  const devices = analyticsStore.deviceStats
  return {
    labels: devices.map(d => d.device),
    datasets: [{
      data: devices.map(d => d.count),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }]
  }
})

const browserChartData = computed(() => {
  const browsers = analyticsStore.browserStats
  return {
    labels: browsers.map(b => b.browser),
    datasets: [{
      data: browsers.map(b => b.count),
      backgroundColor: ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
    }]
  }
})

const deviceChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}))

const performanceMetrics = computed(() => {
  const perf = performanceAnalyzer.analyzePageLoadPerformance()
  return {
    loadTime: perf?.loadComplete || 0,
    firstContentfulPaint: perf?.domProcessing || 0,
    largestContentfulPaint: perf?.response || 0
  }
})

const statsTabs = [
  { key: 'realtime', label: '实时' },
  { key: 'behavior', label: '用户行为' },
  { key: 'devices', label: '设备' },
  { key: 'performance', label: '性能' }
]

// Methods
const calculateChange = (oldValue, newValue) => {
  if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0
  return Math.round(((newValue - oldValue) / oldValue) * 100)
}

const getChartTypeLabel = (type) => {
  const labels = {
    pageViews: '页面访问',
    clicks: '点击次数',
    searches: '搜索次数'
  }
  return labels[type] || type
}

const getChartColor = (type, alpha = 1) => {
  const colors = {
    pageViews: `rgba(59, 130, 246, ${alpha})`,
    clicks: `rgba(16, 185, 129, ${alpha})`,
    searches: `rgba(139, 92, 246, ${alpha})`
  }
  return colors[type] || `rgba(107, 114, 128, ${alpha})`
}

const generateColors = (count) => {
  const baseColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]
  
  const colors = []
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }
  return colors
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getEventTypeLabel = (type) => {
  const labels = {
    page_view: '页面访问',
    click: '点击',
    search: '搜索'
  }
  return labels[type] || type
}

const getEventDetails = (event) => {
  switch (event.type) {
    case 'page_view':
      return event.page || '未知页面'
    case 'click':
      return event.siteName || event.siteUrl || '未知链接'
    case 'search':
      return `"${event.query}"`
    default:
      return JSON.stringify(event).substring(0, 50) + '...'
  }
}

const getPerformanceStatus = (value, threshold) => {
  if (value < threshold * 0.5) return 'excellent'
  if (value < threshold) return 'good'
  if (value < threshold * 1.5) return 'fair'
  return 'poor'
}

const getPerformanceLabel = (value, threshold) => {
  const status = getPerformanceStatus(value, threshold)
  const labels = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return labels[status]
}

const updateTimeRange = () => {
  if (selectedTimeRange.value !== 'custom') {
    refreshData()
  }
}

const applyCustomRange = () => {
  if (customStartDate.value && customEndDate.value) {
    refreshData()
  }
}

const refreshData = async () => {
  loading.value = true
  
  try {
    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastUpdated.value = new Date()
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  const report = reportGenerator.generateRealTimeReport()
  exportData.value = report
  showExportDialog.value = true
}

const handleExport = (format, data) => {
  let content, filename, mimeType
  
  switch (format) {
    case 'json':
      content = reportGenerator.exportReportAsJSON(data)
      filename = `analytics_report_${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
      break
    case 'csv':
      content = reportGenerator.exportReportAsCSV(data)
      filename = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
      break
    default:
      return
  }
  
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showExportDialog.value = false
}

const startRealtimeUpdates = () => {
  refreshInterval.value = setInterval(() => {
    // 更新实时用户数（模拟）
    realtimeUsers.value = Math.floor(Math.random() * 10) + 1
    
    // 更新最后更新时间
    lastUpdated.value = new Date()
  }, 30000) // 每30秒更新一次
}

const stopRealtimeUpdates = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
  startRealtimeUpdates()
})

onUnmounted(() => {
  stopRealtimeUpdates()
})

// Watch for tab changes
watch(activeStatsTab, (newTab) => {
  if (newTab === 'performance') {
    // 记录性能指标
    const perf = performanceAnalyzer.analyzePageLoadPerformance()
    if (perf) {
      performanceAnalyzer.recordMetric('loadTime', perf.loadComplete)
    }
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.last-updated {
  font-size: 14px;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-range-selector select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.refresh-btn,
.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-btn:hover,
.export-btn:hover {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-date-range {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.date-separator {
  color: #6b7280;
  font-size: 14px;
}

.apply-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #6b7280;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.charts-section {
  margin-bottom: 32px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-type-selector {
  display: flex;
  gap: 4px;
}

.chart-type-btn {
  padding: 4px 8px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-type-btn:hover {
  background: #f3f4f6;
}

.chart-type-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.chart-content {
  position: relative;
}

.top-content-list {
  max-height: 300px;
  overflow-y: auto;
}

.content-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.content-item:last-child {
  border-bottom: none;
}

.content-rank {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
}

.content-info {
  flex: 1;
  min-width: 0;
}

.content-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-url {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-category {
  font-size: 11px;
  color: #9ca3af;
}

.content-stats {
  text-align: right;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
}

.search-terms-list {
  max-height: 300px;
  overflow-y: auto;
}

.search-term-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.search-term-item:last-child {
  border-bottom: none;
}

.term-rank {
  width: 20px;
  font-size: 12px;
  color: #6b7280;
  margin-right: 12px;
}

.term-query {
  flex: 1;
  font-size: 14px;
  color: #1f2937;
}

.term-count {
  font-size: 12px;
  color: #6b7280;
}

.detailed-stats {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.stats-tab {
  padding: 16px 24px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.stats-tab:hover {
  color: #374151;
}

.stats-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.stats-content {
  padding: 24px;
}

.realtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.realtime-header h4 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #10b981;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.realtime-events {
  max-height: 400px;
  overflow-y: auto;
}

.event-item {
  display: grid;
  grid-template-columns: 80px 100px 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.event-item:last-child {
  border-bottom: none;
}

.event-time {
  color: #6b7280;
  font-size: 12px;
}

.event-type {
  color: #3b82f6;
  font-weight: 500;
}

.event-details {
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.behavior-metric {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.metric-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.user-paths h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1f2937;
}

.path-list {
  max-height: 300px;
  overflow-y: auto;
}

.path-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.path-item:last-child {
  border-bottom: none;
}

.path-flow {
  font-size: 14px;
  color: #1f2937;
  font-family: monospace;
}

.path-count {
  font-size: 12px;
  color: #6b7280;
}

.device-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.device-chart h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1f2937;
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.perf-metric {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.perf-metric .metric-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.perf-metric .metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.metric-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
}

.metric-status.excellent {
  background: #d1fae5;
  color: #065f46;
}

.metric-status.good {
  background: #dbeafe;
  color: #1e40af;
}

.metric-status.fair {
  background: #fef3c7;
  color: #92400e;
}

.metric-status.poor {
  background: #fee2e2;
  color: #991b1b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-tabs {
    overflow-x: auto;
  }
  
  .stats-tab {
    white-space: nowrap;
  }
  
  .behavior-metrics {
    grid-template-columns: 1fr;
  }
  
  .device-charts {
    grid-template-columns: 1fr;
  }
  
  .performance-metrics {
    grid-template-columns: 1fr;
  }
}
</style>