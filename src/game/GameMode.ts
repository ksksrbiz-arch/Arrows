export interface GameMode {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
    accent: string;
    accentColor: number;
    heartsDelta: number;
    allowUndo: boolean;
    infiniteHearts: boolean;
}

export const GAME_MODES: GameMode[] = [
    {
        id: 'classic',
        label: 'Classic',
        shortLabel: 'Classic',
        description: 'The original campaign with full hearts and undo support.',
        accent: '#5DADE2',
        accentColor: 0x5DADE2,
        heartsDelta: 0,
        allowUndo: true,
        infiniteHearts: false,
    },
    {
        id: 'zen',
        label: 'Zen',
        shortLabel: 'Zen',
        description: 'A no-pressure run with unlimited mistakes for relaxed play.',
        accent: '#58D68D',
        accentColor: 0x58D68D,
        heartsDelta: 0,
        allowUndo: true,
        infiniteHearts: true,
    },
    {
        id: 'challenge',
        label: 'Challenge',
        shortLabel: 'Challenge',
        description: 'Reduced hearts (never below 1) and no undo for a sharper run.',
        accent: '#F5B041',
        accentColor: 0xF5B041,
        heartsDelta: -1,
        allowUndo: false,
        infiniteHearts: false,
    },
];

export const DEFAULT_MODE_ID = GAME_MODES[0].id;

export function getGameMode(modeId?: string): GameMode {
    return GAME_MODES.find((mode) => mode.id === modeId) ?? GAME_MODES[0];
}

export function getModeProgressStorageKey(modeId: string): string {
    return `arrows_level_${modeId}`;
}

export function getSavedLevelForMode(modeId: string, totalLevels: number): number {
    try {
        const saved = localStorage.getItem(getModeProgressStorageKey(modeId));
        if (saved !== null) {
            const idx = parseInt(saved, 10);
            if (!Number.isNaN(idx) && idx >= 0 && idx < totalLevels) {
                return idx;
            }
        }
    } catch {
        // localStorage may not be available
    }

    return 0;
}

export function saveLevelForMode(modeId: string, levelIndex: number): void {
    try {
        localStorage.setItem(getModeProgressStorageKey(modeId), levelIndex.toString());
    } catch {
        // localStorage may not be available
    }
}

export function clearSavedLevelForMode(modeId: string): void {
    try {
        localStorage.removeItem(getModeProgressStorageKey(modeId));
    } catch {
        // localStorage may not be available
    }
}
