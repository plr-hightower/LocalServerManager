/*
 * Hightower Servers , Local Server Manager
 * Copyright (C) 2026 Alexandre Dmitriev
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
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
