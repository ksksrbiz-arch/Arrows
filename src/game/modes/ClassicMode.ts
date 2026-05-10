import { LEVELS } from '../LevelData';
import { CompletionResult, FailureOutcome, GameMode, GameSceneDataLike, MenuState, ModeLevel } from './types';
import { readNumber, removeKey, writeNumber } from './storage';

const LEGACY_PROGRESS_KEY = 'arrows_level_classic';

export function getModeProgressStorageKey(modeId: string): string {
    return `arrows_level_${modeId}`;
}

export function getSavedLevelForMode(modeId: string, totalLevels: number): number {
    const saved = readNumber(getModeProgressStorageKey(modeId), readNumber(LEGACY_PROGRESS_KEY, 0));
    return saved >= 0 && saved < totalLevels ? saved : 0;
}

export function saveLevelForMode(modeId: string, levelIndex: number): void {
    writeNumber(getModeProgressStorageKey(modeId), levelIndex);
}

export function clearSavedLevelForMode(modeId: string): void {
    removeKey(getModeProgressStorageKey(modeId));
}

export const ClassicMode: GameMode = {
    id: 'classic',
    kind: 'campaign',
    label: 'Classic',
    shortLabel: 'Classic',
    description: 'The original campaign with full hearts and undo support.',
    meta: 'standard hearts • undo on',
    accent: '#5DADE2',
    accentColor: 0x5DADE2,
    heartsDelta: 0,
    allowUndo: true,
    infiniteHearts: false,

    createStartData(): GameSceneDataLike {
        return { levelIndex: getSavedLevelForMode(this.id, LEVELS.length), modeId: this.id };
    },

    getMenuState(): MenuState {
        const savedLevel = getSavedLevelForMode(this.id, LEVELS.length);
        const hasProgress = savedLevel > 0;
        return {
            actionText: hasProgress ? '▶ Continue Classic' : '▶ Start Classic',
            hintText: hasProgress
                ? `Resume at Level ${savedLevel + 1}.\n${this.description}`
                : `Fresh run from Level 1.\n${this.description}`,
            resetText: hasProgress ? 'Reset Classic progress' : '',
            resetVisible: hasProgress,
        };
    },

    resetProgress(): void {
        clearSavedLevelForMode(this.id);
    },

    resolveLevel(data: GameSceneDataLike): ModeLevel {
        const levelIndex = data.levelIndex ?? 0;
        const levelDef = LEVELS[levelIndex] ?? LEVELS[0];
        return { levelDef, label: `Level ${levelDef.id} – ${levelDef.title}`, context: { levelIndex, modeId: this.id } };
    },

    getHudSubtitle(): string {
        return 'Undo available';
    },

    getExtraHud(): string[] {
        return [];
    },

    getIdleStatus(): string {
        return 'Choose a free arrow to slide it off the board.';
    },

    onComplete({ level, engine }: CompletionResult) {
        const levelIndex = level.context.levelIndex ?? 0;
        saveLevelForMode(this.id, Math.min(levelIndex + 1, LEVELS.length - 1));
        return {
            stars: engine.getStars(),
            nextData: levelIndex < LEVELS.length - 1 ? { levelIndex: levelIndex + 1, modeId: this.id } : undefined,
            summary: `Hearts performance: ${engine.getStars() === 3 ? '✓ Perfect!' : `${engine.getStars()}/3 stars`}`,
        };
    },

    onFail(): FailureOutcome {
        return { message: "Don't give up – study the order!" };
    },
};
