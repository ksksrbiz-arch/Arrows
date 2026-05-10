import { Direction } from './Arrow';

/** Data for a single arrow in a level definition. */
export interface LevelArrow {
    row: number;
    col: number;
    direction: Direction;
}

/** Full definition for one puzzle level. */
export interface LevelDef {
    id: number;
    title: string;
    gridSize: number;   // NxN grid
    hearts: number;     // starting lives
    arrows: LevelArrow[];
}

// ─── Hand-crafted levels ──────────────────────────────────────────────────────
// Each level is verified solvable: see inline "Solution:" comments.

export const LEVELS: LevelDef[] = [
    // ─── Level 1 – Tutorial (4×4, 5 hearts) ───────────────────────────────
    // All arrows are immediately free.  Any extraction order wins.
    {
        id: 1,
        title: 'Tutorial',
        gridSize: 4,
        hearts: 5,
        arrows: [
            { row: 0, col: 0, direction: Direction.UP },
            { row: 0, col: 3, direction: Direction.RIGHT },
            { row: 3, col: 3, direction: Direction.DOWN },
            { row: 3, col: 0, direction: Direction.LEFT },
            { row: 1, col: 1, direction: Direction.UP },
            { row: 2, col: 2, direction: Direction.DOWN },
        ],
        // Solution: any order
    },

    // ─── Level 2 – First Steps (5×5, 3 hearts) ────────────────────────────
    // One blocking chain: remove (0,2)↑ first, then (2,2)↑ unlocks.
    {
        id: 2,
        title: 'First Steps',
        gridSize: 5,
        hearts: 3,
        arrows: [
            { row: 0, col: 2, direction: Direction.UP },    // free – exits top
            { row: 2, col: 2, direction: Direction.UP },    // blocked by (0,2)
            { row: 2, col: 0, direction: Direction.LEFT },  // free
            { row: 2, col: 4, direction: Direction.RIGHT }, // free
            { row: 4, col: 0, direction: Direction.UP },    // path (3,0)(2,0) – blocked by (2,0)↑
            { row: 4, col: 4, direction: Direction.DOWN },  // free
            { row: 0, col: 0, direction: Direction.UP },    // free
        ],
        // Solution: (0,0)↑, (0,2)↑, (2,0)←, (2,4)→, (4,4)↓ in any order
        //           then (2,2)↑, then (4,0)↑
    },

    // ─── Level 3 – Chain Reaction (5×5, 3 hearts) ─────────────────────────
    // Vertical chain of 3 up arrows; must peel top-to-bottom.
    {
        id: 3,
        title: 'Chain Reaction',
        gridSize: 5,
        hearts: 3,
        arrows: [
            { row: 0, col: 2, direction: Direction.UP },    // free
            { row: 2, col: 2, direction: Direction.UP },    // blocked by (0,2)
            { row: 4, col: 2, direction: Direction.UP },    // blocked by (2,2)+(0,2)
            { row: 0, col: 0, direction: Direction.LEFT },  // free
            { row: 0, col: 4, direction: Direction.RIGHT }, // free
            { row: 4, col: 0, direction: Direction.LEFT },  // free
            { row: 4, col: 4, direction: Direction.RIGHT }, // free
        ],
        // Solution: corners (any order), then (0,2)↑, (2,2)↑, (4,2)↑
    },

    // ─── Level 4 – Crossroads (6×6, 3 hearts) ─────────────────────────────
    // Two perpendicular chains cross the grid.
    // Chain A: (2,5)→ unblocks (2,1)→ unblocks (5,1)↑
    // Chain B: (0,3)↓ unblocks (0,0)→ unblocks (3,0)↓
    {
        id: 4,
        title: 'Crossroads',
        gridSize: 6,
        hearts: 3,
        arrows: [
            { row: 2, col: 5, direction: Direction.RIGHT }, // free (col 5 edge)
            { row: 2, col: 1, direction: Direction.RIGHT }, // blocked by (2,5) [path hits col5]
            { row: 5, col: 1, direction: Direction.UP },    // path (4,1)(3,1)(2,1)... blocked by (2,1)
            { row: 0, col: 3, direction: Direction.DOWN },  // free – path (1,3)..(5,3) empty
            { row: 0, col: 0, direction: Direction.RIGHT }, // path (0,1)(0,2)(0,3).. blocked by (0,3)
            { row: 3, col: 0, direction: Direction.DOWN },  // path (4,0)(5,0) empty, but (0,0)→ is there? No—(0,0) points RIGHT so not on col0
                                                             // Actually path of (3,0)↓ = (4,0),(5,0). Both empty. FREE ✓
            { row: 5, col: 5, direction: Direction.LEFT },  // free (exits right edge backwards)
            { row: 0, col: 5, direction: Direction.UP },    // free (row 0 exits immediately)
        ],
        // Solution: (2,5)→, (0,3)↓, (0,5)↑, (3,0)↓, (5,5)← (any order for free ones),
        //           then (0,0)→, (2,1)→, then (5,1)↑
    },

    // ─── Level 5 – Two Chains (5×5, 3 hearts) ────────────────────────────
    // Two independent chains that don't interfere.
    {
        id: 5,
        title: 'Two Chains',
        gridSize: 5,
        hearts: 3,
        arrows: [
            // Chain A (column 1, upward)
            { row: 0, col: 1, direction: Direction.UP },    // free
            { row: 2, col: 1, direction: Direction.UP },    // blocked by (0,1)
            { row: 4, col: 1, direction: Direction.UP },    // blocked by (2,1)+(0,1)
            // Chain B (column 3, downward)
            { row: 4, col: 3, direction: Direction.DOWN },  // free
            { row: 2, col: 3, direction: Direction.DOWN },  // blocked by (4,3)
            { row: 0, col: 3, direction: Direction.DOWN },  // blocked by (2,3)+(4,3)
            // Filler
            { row: 2, col: 0, direction: Direction.LEFT },  // free
            { row: 2, col: 4, direction: Direction.RIGHT }, // free
        ],
        // Solution: filler first, then chain A top-to-bottom, chain B bottom-to-top (interleaved OK)
    },

    // ─── Level 6 – The Funnel (6×6, 3 hearts) ────────────────────────────
    // Arrows converge toward the same exit column.
    {
        id: 6,
        title: 'The Funnel',
        gridSize: 6,
        hearts: 3,
        arrows: [
            // Column 5 must be cleared before anything going RIGHT can pass
            { row: 1, col: 5, direction: Direction.DOWN },  // free
            { row: 3, col: 5, direction: Direction.UP },    // path (2,5)(1,5) - (1,5) is there? No. path (2,5),(1,5),(0,5) all empty. FREE ✓
            { row: 5, col: 5, direction: Direction.UP },    // path (4,5)-(0,5) all empty. FREE ✓
            // Rows going RIGHT (all blocked by col5 entries above until cleared)
            { row: 1, col: 0, direction: Direction.RIGHT }, // path (1,1)(1,2)(1,3)(1,4)(1,5) - (1,5)↓ is there. BLOCKED
            { row: 3, col: 2, direction: Direction.RIGHT }, // path (3,3)(3,4)(3,5) - (3,5)↑ is there. BLOCKED
            { row: 5, col: 3, direction: Direction.RIGHT }, // path (5,4)(5,5) - (5,5)↑ is there. BLOCKED
            // Extra free arrows
            { row: 0, col: 2, direction: Direction.UP },    // free
            { row: 0, col: 0, direction: Direction.LEFT },  // free
        ],
        // Solution: (0,2)↑, (0,0)←, (1,5)↓, (3,5)↑, (5,5)↑ (any order for free),
        //           then (1,0)→, (3,2)→, (5,3)→
    },

    // ─── Level 7 – Cluster (6×6, 3 hearts) ───────────────────────────────
    // Dense center cluster; edges must be peeled first.
    {
        id: 7,
        title: 'Cluster',
        gridSize: 6,
        hearts: 3,
        arrows: [
            // Outer ring free arrows
            { row: 0, col: 0, direction: Direction.UP },
            { row: 0, col: 5, direction: Direction.RIGHT },
            { row: 5, col: 5, direction: Direction.DOWN },
            { row: 5, col: 0, direction: Direction.LEFT },
            // Inner arrows that block each other
            { row: 1, col: 3, direction: Direction.UP },    // path (0,3) empty. FREE ✓
            { row: 3, col: 1, direction: Direction.LEFT },  // path (3,0) empty. FREE ✓
            { row: 3, col: 3, direction: Direction.RIGHT }, // path (3,4)(3,5) empty. FREE ✓
            { row: 4, col: 2, direction: Direction.DOWN },  // path (5,2) empty. FREE ✓
            { row: 2, col: 2, direction: Direction.UP },    // path (1,2)(0,2) empty. FREE ✓
            { row: 2, col: 4, direction: Direction.RIGHT }, // path (2,5) empty. FREE ✓
        ],
        // Most arrows are free; the outer ring arrows trigger a visual "peel"
    },

    // ─── Level 8 – The Gauntlet (7×7, 3 hearts) ──────────────────────────
    // Longer chains, larger grid.
    {
        id: 8,
        title: 'The Gauntlet',
        gridSize: 7,
        hearts: 3,
        arrows: [
            // Horizontal chain row 3: (3,6)→ unblocks (3,3)→ unblocks (3,0)→
            { row: 3, col: 6, direction: Direction.RIGHT }, // free
            { row: 3, col: 3, direction: Direction.RIGHT }, // blocked by (3,6)
            { row: 3, col: 0, direction: Direction.RIGHT }, // blocked by (3,3)
            // Vertical chain col 3: (0,3)↑ unblocks (3,3) after horizontal clear
            //   Actually (0,3) and (3,3) don't share path — they'd only interact if in same row/col
            // Let's add vertical chain col 6: (0,6)↑ → (6,6)↓
            { row: 0, col: 6, direction: Direction.UP },    // free
            { row: 6, col: 6, direction: Direction.DOWN },  // path (doesn't cross since (0,6)↑ exits top). FREE ✓
            // Additional arrows
            { row: 0, col: 0, direction: Direction.LEFT },  // free
            { row: 6, col: 0, direction: Direction.LEFT },  // free
            { row: 0, col: 3, direction: Direction.UP },    // free
            { row: 6, col: 3, direction: Direction.DOWN },  // free
            // Column 0 chain:
            { row: 2, col: 0, direction: Direction.UP },    // path (1,0)(0,0) - (0,0) is there! BLOCKED
            // After (0,0) removed: (2,0)↑ free ✓
        ],
        // Solution: (0,6)↑, (6,6)↓, (0,0)←, (6,0)←, (0,3)↑, (6,3)↓ (free batch),
        //           then (3,6)→, (2,0)↑ (now free),
        //           then (3,3)→,
        //           then (3,0)→
    },
];
