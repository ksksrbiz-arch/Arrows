import { LEVELS } from '../LevelData';
import { ClassicMode, getSavedLevelForMode, saveLevelForMode, clearSavedLevelForMode } from './ClassicMode';
import { CompletionResult, FailureOutcome, GameMode, GameSceneDataLike, MenuState, ModeLevel } from './types';

export const ChallengeMode: GameMode = {
    ...ClassicMode,
    id: 'challenge',
    label: 'Challenge',
    shortLabel: 'Challenge',
    description: 'Reduced hearts (never below 1) and no undo for a sharper run.',
    meta: 'reduced hearts • undo off',
    accent: '#F5B041',
    accentColor: 0xF5B041,
    heartsDelta: -1,
    allowUndo: false,

    createStartData(): GameSceneDataLike {
        return { levelIndex: getSavedLevelForMode(this.id, LEVELS.length), modeId: this.id };
    },

    getMenuState(): MenuState {
        const savedLevel = getSavedLevelForMode(this.id, LEVELS.length);
        const hasProgress = savedLevel > 0;
        return {
            actionText: hasProgress ? '▶ Continue Challenge' : '▶ Start Challenge',
            hintText: hasProgress ? `Resume at Level ${savedLevel + 1}.\n${this.description}` : `Fresh run from Level 1.\n${this.description}`,
            resetText: hasProgress ? 'Reset Challenge progress' : '',
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
        return 'No undo in this mode';
    },

    onComplete({ level, engine }: CompletionResult) {
        const levelIndex = level.context.levelIndex ?? 0;
        saveLevelForMode(this.id, Math.min(levelIndex + 1, LEVELS.length - 1));
        return {
            stars: engine.getStars(),
            nextData: levelIndex < LEVELS.length - 1 ? { levelIndex: levelIndex + 1, modeId: this.id } : undefined,
            summary: 'Challenge clear: completed without undo.',
        };
    },

    onFail(): FailureOutcome {
        return { message: 'Challenge mode bites back — try a cleaner route.' };
    },
};
