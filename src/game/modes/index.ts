import { ChallengeMode } from './ChallengeMode';
import { ClassicMode } from './ClassicMode';
import { DailyMode } from './DailyMode';
import { EndlessMode } from './EndlessMode';
import { ZenMode } from './ZenMode';
import { GameMode } from './types';

export type { CompletionOutcome, FailureOutcome, GameMode, GameSceneDataLike, MenuState, ModeLevel } from './types';
export { clearSavedLevelForMode, getModeProgressStorageKey, getSavedLevelForMode, saveLevelForMode } from './ClassicMode';

export const GAME_MODES: GameMode[] = [ClassicMode, ZenMode, ChallengeMode, DailyMode, EndlessMode];
export const DEFAULT_MODE_ID = GAME_MODES[0].id;

export function getGameMode(modeId?: string): GameMode {
    return GAME_MODES.find((mode) => mode.id === modeId) ?? GAME_MODES[0];
}
