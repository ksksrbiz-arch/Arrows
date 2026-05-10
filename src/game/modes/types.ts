import { BasePuzzleEngine } from '../engine/BasePuzzleEngine';
import { LevelDef } from '../LevelData';

export type ModeKind = 'campaign' | 'daily' | 'endless';

export interface GameSceneDataLike {
    levelIndex?: number;
    modeId?: string;
    dateKey?: string;
    seed?: string;
    endlessLevel?: number;
    score?: number;
    combo?: number;
}

export interface ModeLevel {
    levelDef: LevelDef;
    label: string;
    context: GameSceneDataLike;
}

export interface MenuState {
    actionText: string;
    hintText: string;
    resetText: string;
    resetVisible: boolean;
}

export interface CompletionResult {
    level: ModeLevel;
    engine: BasePuzzleEngine;
    elapsedMs: number;
}

export interface CompletionOutcome {
    stars: number;
    nextData?: GameSceneDataLike;
    summary: string;
    score?: number;
    highScore?: number;
}

export interface FailureOutcome {
    message: string;
    score?: number;
    highScore?: number;
}

export interface GameMode {
    id: string;
    kind: ModeKind;
    label: string;
    shortLabel: string;
    description: string;
    meta: string;
    accent: string;
    accentColor: number;
    heartsDelta: number;
    allowUndo: boolean;
    infiniteHearts: boolean;

    createStartData(): GameSceneDataLike;
    getMenuState(): MenuState;
    resetProgress(): void;
    resolveLevel(data: GameSceneDataLike): ModeLevel;
    getHudSubtitle(level: ModeLevel): string;
    getExtraHud(level: ModeLevel, engine: BasePuzzleEngine, elapsedMs: number): string[];
    getIdleStatus(): string;
    onComplete(result: CompletionResult): CompletionOutcome;
    onFail(level: ModeLevel, engine: BasePuzzleEngine, elapsedMs: number): FailureOutcome;
}
