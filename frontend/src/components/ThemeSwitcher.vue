<template>
    <div ref="rootEl" class="theme-switcher">
        <button
            class="btn btn--sm"
            type="button"
            aria-haspopup="listbox"
            :aria-expanded="open"
            @click="open = !open"
        >
            {{ activeLabel }}
        </button>
        <ul v-if="open" class="theme-switcher__menu" role="listbox">
            <li v-for="t in theme.themes" :key="t.id">
                <button
                    class="theme-switcher__option"
                    type="button"
                    role="option"
                    :aria-selected="t.id === theme.current.value"
                    @click="select(t.id)"
                >
                    {{ t.label }}
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
import { useTheme } from '@/composables/useTheme';
import type { ThemeId } from '@/themes';

const theme = useTheme();
const open = ref(false);
const rootEl = useTemplateRef<HTMLElement>('rootEl');

const activeLabel = computed(() => theme.themes.find(t => t.id === theme.current.value)?.label);

function select(id: ThemeId) {
    theme.set(id);
    open.value = false;
}

function onPointerDown(event: PointerEvent) {
    if (!rootEl.value?.contains(event.target as Node)) open.value = false;
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open.value = false;
}

onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.theme-switcher {
    position: relative;
    margin-left: auto;
}

.theme-switcher__menu {
    position: absolute;
    right: 0;
    top: calc(100% + var(--gap-xs));
    z-index: 10;
    min-width: 9rem;
    margin: 0;
    padding: var(--gap-xs);
    list-style: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.theme-switcher__option {
    display: block;
    width: 100%;
    font: inherit;
    text-align: left;
    padding: var(--gap-xs) var(--gap-sm);
    border: none;
    border-radius: var(--radius);
    background: none;
    color: var(--color-muted);
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
}

.theme-switcher__option:hover {
    background: var(--color-hover);
    color: var(--color-text);
}

.theme-switcher__option[aria-selected='true'] {
    color: var(--color-text);
}
</style>
