import type { ThemeId } from '@/themes';

export interface ThemeStorage {
    read(): string | null;
    write(id: ThemeId): void;
}

export function createLocalThemeStorage(key = 'ht-theme'): ThemeStorage {
    return {
        read: () => localStorage.getItem(key),
        write: id => localStorage.setItem(key, id),
    };
}
