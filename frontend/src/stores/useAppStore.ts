import { defineStore } from "pinia";
import { ref } from "vue";

export interface AppNotifs {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

export const useAppStore = defineStore("app", () => {
    const isSidebarCollapsed = ref(false);
    const notifications = ref<AppNotifs[]>([]);

    function setSideBarState(collapsed: boolean) {
        isSidebarCollapsed.value = collapsed;
    }

    function toggleSidebar() {
        isSidebarCollapsed.value = !isSidebarCollapsed.value;
    }

    function addNotification(message: string, type: AppNotifs['type'] = 'info') {
        const id = Math.random().toString(36);
        notifications.value.push({ id, message, type });
        setTimeout(() => removeNotification(id), 5000);
    }

    function removeNotification(id: string) {
        const originalLength = notifications.value.length;
        notifications.value = notifications.value.filter(n => n.id !== id);
        if (notifications.value.length === originalLength) {
            console.warn(`Notification with ID ${id} not found for removal.`);
        }
    }

    return {
        isSidebarCollapsed,
        notifications,
        setSideBarState,
        toggleSidebar,
        addNotification,
        removeNotification,
    };
});