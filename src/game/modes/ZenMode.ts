import { LEVELS } from '../LevelData';
import { ClassicMode, getSavedLevelForMode, saveLevelForMode, clearSavedLevelForMode } from './ClassicMode';
import { CompletionResult, FailureOutcome, GameMode, GameSceneDataLike, MenuState, ModeLevel } from './types';

export const ZenMode: GameMode = {
    ...ClassicMode,
    id: 'zen',
    label: 'Zen',
    shortLabel: 'Zen',
    description: 'A no-pressure run with unlimited mistakes for relaxed play.',
    meta: '∞ hearts • undo on',
    accent: '#58D68D',
    accentColor: 0x58D68D,
    infiniteHearts: true,

    createStartData(): GameSceneDataLike {
        return { levelIndex: getSavedLevelForMode(this.id, LEVELS.length), modeId: this.id };
    },

    getMenuState(): MenuState {
        const savedLevel = getSavedLevelForMode(this.id, LEVELS.length);
        const hasProgress = savedLevel > 0;
        return {
            actionText: hasProgress ? '▶ Continue Zen' : '▶ Start Zen',
            hintText: hasProgress ? `Resume at Level ${savedLevel + 1}.\n${this.description}` : `Fresh run from Level 1.\n${this.description}`,
            resetText: hasProgress ? 'Reset Zen progress' : '',
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
        return 'Relaxed play';
    },

    getIdleStatus(): string {
        return 'Zen mode: explore freely without losing hearts.';
    },

    onComplete({ level, engine }: CompletionResult) {
        const levelIndex = level.context.levelIndex ?? 0;
        saveLevelForMode(this.id, Math.min(levelIndex + 1, LEVELS.length - 1));
        return {
            stars: engine.getStars(),
            nextData: levelIndex < LEVELS.length - 1 ? { levelIndex: levelIndex + 1, modeId: this.id } : undefined,
            summary: 'Zen clear: no hearts were consumed.',
        };
    },

    onFail(): FailureOutcome {
        return { message: 'Zen mode keeps the run alive.' };
    },
};
