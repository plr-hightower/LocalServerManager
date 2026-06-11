import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../components/pages/DashboardPage.vue';
import ServerListPage from '../components/pages/ServerListPage.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/dashboard',
            name: 'Dashboard',
            component: DashboardPage,
        },
        {
            path: '/serverList',
            name: 'ServerList',
            component: ServerListPage,
        },
    ]
});

export default router;