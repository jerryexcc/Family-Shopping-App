import { createApp } from 'vue'
import { createPinia } from 'pinia' // 如果你打算開始用 Pinia
import './style.css' // <--- 核心！一定要有這行來載入 CSS
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')