import type { Schematic } from '../types/schematic';

export const GAME_LIBRARY: Record<string, Schematic> = {
    minecraft: {
        gameId: 'minecraft',
        gameName: 'Minecraft',
        icon: '/assets/minecraft-icon.png',
        fields: [
            { key: 'memory', label: 'Allocated RAM (GB)', type: 'number', defaultValue: 4},
            { key: 'difficulty', label: 'Difficulty', type: 'select', defaultValue: 'normal', options: ['easy', 'normal', 'hard'] },
            { key: 'enablePvp', label: 'Enable PVP', type: 'boolean', defaultValue: true },
        ],
    },
    valheim: {
        gameId: 'valheim',
        gameName: 'Valheim',
        icon: '/assets/valheim-icon.png',
        fields: [
            { key: 'serverPassword', label: 'Server Password', type: 'string', defaultValue: '', placeholder: 'Min 5 chars' },
            { key: 'public', label: 'Publicly Visible', type: 'boolean', defaultValue: true },
        ],
    },

    // Add more games and their schematics here
};