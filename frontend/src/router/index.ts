import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../components/pages/DashboardPage.vue';
import ServerListPage from '../components/pages/ServerListPage.vue';
import ServerDetailPage from '../components/pages/ServerDetailPage.vue';
import CreateServerPage from '../components/pages/CreateServerPage.vue';

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
        {
            path: '/serverDetail',
            name: 'ServerDetail',
            component: ServerDetailPage,
        },
        {
            path: '/createServer',
            name: 'CreateServer',
            component: CreateServerPage,

        }
    ]
});

export default router;