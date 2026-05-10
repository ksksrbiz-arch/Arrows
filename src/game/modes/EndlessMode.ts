import { PuzzleGenerator } from '../engine/PuzzleGenerator';
import { SeededRandom } from '../engine/SeededRandom';
import { CompletionResult, FailureOutcome, GameMode, GameSceneDataLike, MenuState, ModeLevel } from './types';
import { readNumber, storageKey, writeNumber } from './storage';

const HIGH_SCORE_KEY = storageKey('endless_high_score');
const MAX_RANDOM_SEED_COMPONENT = 0xFFFFFF;
let fallbackSeedCounter = 0;

function createRunSeed(): string {
    return globalThis.crypto?.randomUUID?.()
        ?? `${Date.now().toString(36)}-${fallbackSeedCounter++}-${getRandomSeedComponent().toString(36)}`;
}

function getRandomSeedComponent(): number {
    const values = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(values);
    return values[0] === 0 ? Math.floor(Math.random() * MAX_RANDOM_SEED_COMPONENT) : values[0];
}

function getDifficulty(level: number): { gridSize: number; density: number; tier: string } {
    if (level < 5) return { gridSize: 6, density: 0.30, tier: 'Easy' };
    if (level < 10) return { gridSize: 7, density: 0.34, tier: 'Medium' };
    if (level < 15) return { gridSize: 8, density: 0.38, tier: 'Hard' };
    return { gridSize: Math.min(10, 8 + Math.floor((level - 15) / 8)), density: 0.42, tier: 'Expert' };
}

function scoreFor(result: CompletionResult): { score: number; combo: number; gained: number; highScore: number } {
    const previousScore = result.level.context.score ?? 0;
    const previousCombo = result.level.context.combo ?? 0;
    const stars = result.engine.getStars();
    const combo = stars === 3 ? previousCombo + 1 : 0;
    const speedBonus = Math.max(0, 500 - Math.floor(result.elapsedMs / 100));
    const gained = result.engine.levelDef.arrows.length * 100 + stars * 250 + combo * 150 + speedBonus;
    const score = previousScore + gained;
    const highScore = Math.max(readNumber(HIGH_SCORE_KEY, 0), score);
    writeNumber(HIGH_SCORE_KEY, highScore);
    return { score, combo, gained, highScore };
}

export const EndlessMode: GameMode = {
    id: 'endless',
    kind: 'endless',
    label: 'Endless',
    shortLabel: 'Endless',
    description: 'Infinite solvable boards with scaling size, density, combos, and high score.',
    meta: 'infinite run • score',
    accent: '#48C9B0',
    accentColor: 0x48C9B0,
    heartsDelta: 0,
    allowUndo: false,
    infiniteHearts: false,

    createStartData(): GameSceneDataLike {
        return { modeId: this.id, seed: createRunSeed(), endlessLevel: 0, score: 0, combo: 0 };
    },

    getMenuState(): MenuState {
        const highScore = readNumber(HIGH_SCORE_KEY, 0);
        return {
            actionText: '▶ Start Endless',
            hintText: `High score: ${highScore}.\n${this.description}`,
            resetText: highScore > 0 ? 'Reset Endless high score' : '',
            resetVisible: highScore > 0,
        };
    },

    resetProgress(): void {
        writeNumber(HIGH_SCORE_KEY, 0);
    },

    resolveLevel(data: GameSceneDataLike): ModeLevel {
        const seed = data.seed ?? createRunSeed();
        const endlessLevel = data.endlessLevel ?? 0;
        const difficulty = getDifficulty(endlessLevel);
        const rng = new SeededRandom(`${seed}:hearts:${endlessLevel}`);
        const levelDef = PuzzleGenerator.generate({
            seed: `endless:${seed}:${endlessLevel}`,
            id: endlessLevel + 1,
            title: `${difficulty.tier} Run`,
            gridSize: difficulty.gridSize,
            hearts: rng.int(2, 4),
            density: difficulty.density,
        });
        return {
            levelDef,
            label: `Endless ${endlessLevel + 1} – ${difficulty.tier}`,
            context: {
                modeId: this.id,
                seed,
                endlessLevel,
                score: data.score ?? 0,
                combo: data.combo ?? 0,
            },
        };
    },

    getHudSubtitle(level: ModeLevel): string {
        return `Seed ${level.context.seed}`;
    },

    getExtraHud(level: ModeLevel, engine): string[] {
        return [
            `Score: ${level.context.score ?? 0}`,
            `Combo: ${level.context.combo ?? 0} • Left: ${engine.arrowsLeft}`,
        ];
    },

    getIdleStatus(): string {
        return 'Endless run: clear boards to build score and perfect-clear combos.';
    },

    onComplete(result: CompletionResult) {
        const stats = scoreFor(result);
        const endlessLevel = result.level.context.endlessLevel ?? 0;
        const seed = result.level.context.seed;
        return {
            stars: result.engine.getStars(),
            score: stats.score,
            highScore: stats.highScore,
            nextData: {
                modeId: this.id,
                seed,
                endlessLevel: endlessLevel + 1,
                score: stats.score,
                combo: stats.combo,
            },
            summary: `+${stats.gained} points • Score ${stats.score} • Best ${stats.highScore}`,
        };
    },

    onFail(level: ModeLevel): FailureOutcome {
        const score = level.context.score ?? 0;
        const highScore = Math.max(readNumber(HIGH_SCORE_KEY, 0), score);
        writeNumber(HIGH_SCORE_KEY, highScore);
        return { message: 'Run over — beat your record next time?', score, highScore };
    },
};
