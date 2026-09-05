import './night-sky.css';
import './fall.css';
import './winter.css';
import './tokyo-night.css';
import './dark-night.css';
import './high-contrast.css';

export const THEMES = [
    { id: 'night-sky', label: 'Night Sky' },
    { id: 'fall', label: 'Fall' },
    { id: 'winter', label: 'Winter' },
    { id: 'tokyo-night', label: 'Tokyo Night' },
    { id: 'dark-night', label: 'Dark Night' },
    { id: 'high-contrast', label: 'High Contrast' },
] as const;

export type Theme = (typeof THEMES)[number];
export type ThemeId = Theme['id'];
