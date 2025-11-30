import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 导入响应式样式
import './assets/responsive.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
