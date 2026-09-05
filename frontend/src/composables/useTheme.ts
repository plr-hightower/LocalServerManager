import { inject } from 'vue';
import { themeKey, type ThemeService } from '@/services/theme';

export function useTheme(): ThemeService {
    const service = inject(themeKey);
    if (!service) throw new Error('useTheme() requires the theme service to be provided');
    return service;
}
