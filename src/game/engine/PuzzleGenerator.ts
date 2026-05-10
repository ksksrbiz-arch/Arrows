import { Direction } from '../Arrow';
import { LevelArrow, LevelDef } from '../LevelData';
import { SeededRandom } from './SeededRandom';

const DIRECTIONS = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT] as const;

export interface PuzzleGeneratorOptions {
    seed: string;
    id: number;
    title: string;
    gridSize: number;
    hearts: number;
    density: number;
    maxAttempts?: number;
}

interface CellCandidate {
    row: number;
    col: number;
    direction: Direction;
}

export class PuzzleGenerator {
    static generate(options: PuzzleGeneratorOptions): LevelDef {
        const maxAttempts = options.maxAttempts ?? 24;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const rng = new SeededRandom(`${options.seed}:${attempt}`);
            const level = this.generateCandidate(options, rng);
            if (this.isSolvable(level)) return level;
        }

        return this.generateFallback(options);
    }

    static isSolvable(level: LevelDef): boolean {
        const remaining = level.arrows.map((arrow) => ({ ...arrow }));
        let removedInPass = true;

        while (remaining.length > 0 && removedInPass) {
            removedInPass = false;

            for (let i = remaining.length - 1; i >= 0; i--) {
                if (this.isPathClear(remaining[i], remaining, level.gridSize)) {
                    remaining.splice(i, 1);
                    removedInPass = true;
                }
            }
        }

        return remaining.length === 0;
    }

    private static generateCandidate(options: PuzzleGeneratorOptions, rng: SeededRandom): LevelDef {
        const targetCount = Math.max(
            options.gridSize,
            Math.min(options.gridSize * options.gridSize - 1, Math.round(options.gridSize * options.gridSize * options.density)),
        );
        const arrows: LevelArrow[] = [];
        const occupied = new Set<string>();
        let guard = 0;

        while (arrows.length < targetCount && guard < targetCount * 80) {
            guard++;
            const candidate = this.pickCandidate(options.gridSize, rng);
            const key = `${candidate.row},${candidate.col}`;
            if (occupied.has(key)) continue;
            if (!this.isPathClear(candidate, arrows, options.gridSize)) continue;

            occupied.add(key);
            arrows.push(candidate);
        }

        return {
            id: options.id,
            title: options.title,
            gridSize: options.gridSize,
            hearts: options.hearts,
            arrows,
        };
    }

    private static generateFallback(options: PuzzleGeneratorOptions): LevelDef {
        const arrows: LevelArrow[] = [];
        const last = options.gridSize - 1;

        for (let i = 0; i < options.gridSize; i++) {
            arrows.push({ row: 0, col: i, direction: Direction.UP });
            arrows.push({ row: last, col: i, direction: Direction.DOWN });
        }

        return {
            id: options.id,
            title: options.title,
            gridSize: options.gridSize,
            hearts: options.hearts,
            arrows,
        };
    }

    private static pickCandidate(gridSize: number, rng: SeededRandom): CellCandidate {
        return {
            row: rng.int(0, gridSize - 1),
            col: rng.int(0, gridSize - 1),
            direction: rng.pick(DIRECTIONS),
        };
    }

    private static isPathClear(arrow: LevelArrow, arrows: LevelArrow[], gridSize: number): boolean {
        const { dr, dc } = this.getDelta(arrow.direction);
        let r = arrow.row + dr;
        let c = arrow.col + dc;

        while (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
            if (arrows.some((other) => other.row === r && other.col === c)) return false;
            r += dr;
            c += dc;
        }

        return true;
    }

    private static getDelta(direction: Direction): { dr: number; dc: number } {
        switch (direction) {
            case Direction.UP: return { dr: -1, dc: 0 };
            case Direction.DOWN: return { dr: 1, dc: 0 };
            case Direction.LEFT: return { dr: 0, dc: -1 };
            case Direction.RIGHT: return { dr: 0, dc: 1 };
        }
    }
}
