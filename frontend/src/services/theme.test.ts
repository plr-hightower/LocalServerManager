import { describe, it, expect } from 'vitest';
import { createThemeService } from '@/services/theme';
import type { ThemeTarget } from '@/services/theme';
import type { ThemeStorage } from '@/services/themeStorage';
import { THEMES } from '@/themes';

function memoryStorage(initial: string | null = null): ThemeStorage {
    let value = initial;
    return { read: () => value, write: id => { value = id; } };
}

function setup(stored: string | null = null) {
    const storage = memoryStorage(stored);
    const root: ThemeTarget = { dataset: {} };
    return { storage, root, service: createThemeService({ themes: THEMES, storage, root }) };
}

describe('createThemeService', () => {
    it('falls back to the first theme when nothing is stored', () => {
        const { service, root } = setup();
        expect(service.current.value).toBe('night-sky');
        expect(root.dataset.theme).toBe('night-sky');
    });

    it('restores a stored theme', () => {
        const { service, root } = setup('fall');
        expect(service.current.value).toBe('fall');
        expect(root.dataset.theme).toBe('fall');
    });

    it('falls back when the stored theme is unknown', () => {
        const { service } = setup('summer');
        expect(service.current.value).toBe('night-sky');
    });

    it('persists and applies a selected theme', () => {
        const { service, storage, root } = setup();
        service.set('tokyo-night');
        expect(service.current.value).toBe('tokyo-night');
        expect(root.dataset.theme).toBe('tokyo-night');
        expect(storage.read()).toBe('tokyo-night');
    });
});
