import { PuzzleGenerator } from '../engine/PuzzleGenerator';
import { CompletionResult, FailureOutcome, GameMode, GameSceneDataLike, MenuState, ModeLevel } from './types';
import { readJson, storageKey, writeJson } from './storage';

interface DailyState {
    completed: string[];
    streak: number;
    lastPerfectDate: string;
}

const DAILY_STATE_KEY = storageKey('daily_state');
const EMPTY_DAILY_STATE: DailyState = { completed: [], streak: 0, lastPerfectDate: '' };
const MAX_COMPLETED_HISTORY = 400;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayKey(date = new Date()): string {
    return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, days: number): string {
    const date = parseDateKey(dateKey) ?? new Date(`${getTodayKey()}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return getTodayKey(date);
}

function readDailyState(): DailyState {
    const state = readJson<DailyState>(DAILY_STATE_KEY, EMPTY_DAILY_STATE);
    const completed = Array.isArray(state.completed) ? state.completed.slice(-MAX_COMPLETED_HISTORY) : [];
    return { ...state, completed };
}

function writeDailyState(state: DailyState): void {
    writeJson(DAILY_STATE_KEY, { ...state, completed: state.completed.slice(-MAX_COMPLETED_HISTORY) });
}

function getDateId(dateKey: string): number {
    const date = parseDateKey(dateKey) ?? new Date(`${getTodayKey()}T00:00:00.000Z`);
    return Math.floor(date.getTime() / 86_400_000);
}

function parseDateKey(dateKey: string): Date | null {
    if (!DATE_KEY_PATTERN.test(dateKey)) return null;

    const date = new Date(`${dateKey}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || getTodayKey(date) !== dateKey ? null : date;
}

export const DailyMode: GameMode = {
    id: 'daily',
    kind: 'daily',
    label: 'Daily Puzzle',
    shortLabel: 'Daily',
    description: 'One deterministic UTC puzzle each day with a local perfect streak.',
    meta: 'daily seed • streak',
    accent: '#AF7AC5',
    accentColor: 0xAF7AC5,
    heartsDelta: 0,
    allowUndo: true,
    infiniteHearts: false,

    createStartData(): GameSceneDataLike {
        return { modeId: this.id, dateKey: getTodayKey() };
    },

    getMenuState(): MenuState {
        const state = readDailyState();
        const today = getTodayKey();
        const completedToday = state.completed.includes(today);
        return {
            actionText: completedToday ? '▶ Replay Today' : '▶ Play Daily',
            hintText: `Today: ${today}. Perfect streak: ${state.streak}.\n${this.description}`,
            resetText: '',
            resetVisible: false,
        };
    },

    resetProgress(): void {
        writeDailyState(EMPTY_DAILY_STATE);
    },

    resolveLevel(data: GameSceneDataLike): ModeLevel {
        const dateKey = parseDateKey(data.dateKey ?? '') ? data.dateKey as string : getTodayKey();
        const levelDef = PuzzleGenerator.generate({
            seed: `daily:${dateKey}`,
            id: getDateId(dateKey),
            title: `Daily ${dateKey}`,
            gridSize: 6,
            hearts: 3,
            density: 0.34,
        });
        return { levelDef, label: `Daily – ${dateKey}`, context: { modeId: this.id, dateKey } };
    },

    getHudSubtitle(level: ModeLevel): string {
        return `Seed ${level.context.dateKey}`;
    },

    getExtraHud(level: ModeLevel): string[] {
        return [`Share: ?mode=daily&date=${level.context.dateKey}`];
    },

    getIdleStatus(): string {
        return 'Daily puzzle: clear today’s board perfectly to extend your streak.';
    },

    onComplete({ level, engine }: CompletionResult) {
        const dateKey = level.context.dateKey ?? getTodayKey();
        const stars = engine.getStars();
        const state = readDailyState();
        const isToday = dateKey === getTodayKey();

        if (!state.completed.includes(dateKey)) {
            state.completed.push(dateKey);
        }

        if (isToday && stars === 3 && state.lastPerfectDate !== dateKey) {
            state.streak = state.lastPerfectDate === addDays(dateKey, -1) ? state.streak + 1 : 1;
            state.lastPerfectDate = dateKey;
        }

        writeDailyState(state);

        return {
            stars,
            nextData: { modeId: this.id, dateKey: addDays(dateKey, -1) },
            summary: `Daily ${dateKey} complete • Perfect streak: ${state.streak}`,
        };
    },

    onFail(): FailureOutcome {
        return { message: 'Daily attempt failed — replay anytime for practice.' };
    },
};
