/**
 * Direction enum – the four cardinal directions an arrow can point.
 */
export enum Direction {
    UP = 'UP',
    DOWN = 'DOWN',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
}

/**
 * Arrow – represents one arrow piece on the grid.
 * Tracks its logical grid position, direction, and its Phaser graphics handle.
 */
export class Arrow {
    row: number;
    col: number;
    direction: Direction;
    /** Reference to the Phaser Graphics object that renders this arrow. */
    gfx: Phaser.GameObjects.Graphics | null = null;

    constructor(row: number, col: number, direction: Direction) {
        this.row = row;
        this.col = col;
        this.direction = direction;
    }

    /**
     * Returns the row/column delta for one step in this arrow's direction.
     */
    getDelta(): { dr: number; dc: number } {
        switch (this.direction) {
            case Direction.UP:    return { dr: -1, dc:  0 };
            case Direction.DOWN:  return { dr:  1, dc:  0 };
            case Direction.LEFT:  return { dr:  0, dc: -1 };
            case Direction.RIGHT: return { dr:  0, dc:  1 };
        }
    }
}
