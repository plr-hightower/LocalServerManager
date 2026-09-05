import { ref, computed, type ComputedRef, type InjectionKey } from 'vue';
import type { Theme, ThemeId } from '@/themes';
import type { ThemeStorage } from '@/services/themeStorage';

export interface ThemeService {
    themes: readonly Theme[];
    current: ComputedRef<ThemeId>;
    set(id: ThemeId): void;
}

export interface ThemeTarget {
    dataset: DOMStringMap;
}

export interface ThemeServiceOptions {
    themes: readonly Theme[];
    storage: ThemeStorage;
    root: ThemeTarget;
}

export const themeKey: InjectionKey<ThemeService> = Symbol('theme');

export function createThemeService({ themes, storage, root }: ThemeServiceOptions): ThemeService {
    const fallback = themes[0].id;
    const isKnown = (id: string | null): id is ThemeId => themes.some(t => t.id === id);

    const stored = storage.read();
    const active = ref<ThemeId>(isKnown(stored) ? stored : fallback);

    const set = (id: ThemeId) => {
        active.value = isKnown(id) ? id : fallback;
        root.dataset.theme = active.value;
        storage.write(active.value);
    };

    set(active.value);

    return { themes, current: computed(() => active.value), set };
}
