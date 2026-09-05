import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { THEMES } from './themes'
import { createThemeService, themeKey } from './services/theme'
import { createLocalThemeStorage } from './services/themeStorage'
import './assets/main.css'

const app = createApp(App)

app.provide(themeKey, createThemeService({
    themes: THEMES,
    storage: createLocalThemeStorage(),
    root: document.documentElement,
}))
app.use(createPinia())
app.use(router)
app.mount('#app')
