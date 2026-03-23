import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useCoverStore } from './stores/cover'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化设置
const store = useCoverStore(pinia)
store.loadSettingsFromStorage()

// 应用暗色模式
if (store.darkMode) {
  document.documentElement.classList.add('dark')
}

app.mount('#app')