import { Arrow } from '../Arrow';
import { LevelDef } from '../LevelData';

export interface PuzzleEngineOptions {
    heartsDelta: number;
    allowUndo: boolean;
    infiniteHearts: boolean;
}

export type ExtractResult =
    | { type: 'empty' }
    | { type: 'extract'; arrow: Arrow; moves: number; arrowsLeft: number }
    | { type: 'collision'; arrow: Arrow; hearts: number; gameOver: boolean; lostHeart: boolean };

export class BasePuzzleEngine {
    readonly levelDef: LevelDef;
    readonly gridSize: number;
    readonly grid: (Arrow | null)[][];
    readonly startingHearts: number;
    readonly allowUndo: boolean;
    readonly infiniteHearts: boolean;

    hearts: number;
    moveCount = 0;
    arrowsLeft: number;

    private lastArrow: Arrow | null = null;

    constructor(levelDef: LevelDef, options: PuzzleEngineOptions) {
        this.levelDef = levelDef;
        this.gridSize = levelDef.gridSize;
        this.allowUndo = options.allowUndo;
        this.infiniteHearts = options.infiniteHearts;
        this.startingHearts = options.infiniteHearts
            ? levelDef.hearts
            : Math.max(1, levelDef.hearts + options.heartsDelta);
        this.hearts = this.startingHearts;
        this.arrowsLeft = levelDef.arrows.length;

        this.grid = Array.from({ length: this.gridSize }, () => new Array<Arrow | null>(this.gridSize).fill(null));
        for (const def of levelDef.arrows) {
            this.grid[def.row][def.col] = new Arrow(def.row, def.col, def.direction);
        }
    }

    getArrow(row: number, col: number): Arrow | null {
        return this.grid[row]?.[col] ?? null;
    }

    isPathClear(arrow: Arrow): boolean {
        const { dr, dc } = arrow.getDelta();
        let r = arrow.row + dr;
        let c = arrow.col + dc;

        while (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
            if (this.grid[r][c] !== null) return false;
            r += dr;
            c += dc;
        }

        return true;
    }

    tryExtract(row: number, col: number): ExtractResult {
        const arrow = this.getArrow(row, col);
        if (!arrow) return { type: 'empty' };

        if (!this.isPathClear(arrow)) {
            if (this.infiniteHearts) {
                return { type: 'collision', arrow, hearts: this.hearts, gameOver: false, lostHeart: false };
            }

            this.hearts--;
            return { type: 'collision', arrow, hearts: this.hearts, gameOver: this.hearts <= 0, lostHeart: true };
        }

        this.lastArrow = new Arrow(arrow.row, arrow.col, arrow.direction);
        this.grid[arrow.row][arrow.col] = null;
        this.arrowsLeft--;
        this.moveCount++;

        return { type: 'extract', arrow, moves: this.moveCount, arrowsLeft: this.arrowsLeft };
    }

    canUndo(): boolean {
        return this.allowUndo && this.lastArrow !== null;
    }

    undo(): Arrow | null {
        if (!this.canUndo() || !this.lastArrow) return null;

        const arrow = this.lastArrow;
        this.lastArrow = null;
        this.grid[arrow.row][arrow.col] = arrow;
        this.arrowsLeft++;
        this.moveCount = Math.max(0, this.moveCount - 1);

        return arrow;
    }

    getStars(): number {
        if (this.infiniteHearts) return 3;
        if (this.hearts >= this.startingHearts) return 3;
        if (this.hearts > 0) return 2;
        return 1;
    }
}
