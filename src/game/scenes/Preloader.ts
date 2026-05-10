import { Scene } from 'phaser';
import { Direction } from '../Arrow';

/**
 * Preloader – generates all programmatic textures used by the game.
 * No external image assets are required; everything is drawn via Phaser's
 * Graphics / RenderTexture APIs so the game is fully self-contained.
 */
export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ── Simple loading screen ────────────────────────────────────────────
        this.cameras.main.setBackgroundColor('#1a1a2e');

        this.add.text(W / 2, H / 2 - 20, 'ARROWS', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '48px',
            color: '#E8F4FD',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 36, 'Puzzle Escape', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#85C1E9',
            fontStyle: 'italic',
        }).setOrigin(0.5);

        // ── Generate arrow textures for each direction ───────────────────────
        const CELL = 80; // texture dimensions in pixels
        const COLORS: Record<Direction, number> = {
            [Direction.UP]:    0x5DADE2,  // sky-blue
            [Direction.DOWN]:  0xEC7063,  // coral
            [Direction.LEFT]:  0x58D68D,  // mint-green
            [Direction.RIGHT]: 0xF0B27A,  // peach-orange
        };

        for (const dir of Object.values(Direction)) {
            this.makeArrowTexture(`arrow_${dir}`, dir as Direction, CELL, COLORS[dir as Direction]);
        }

        // Brief pause so the title is visible, then go to menu
        this.time.delayedCall(600, () => {
            this.scene.start('MainMenu');
        });
    }

    /**
     * Creates a named RenderTexture containing a filled arrow graphic.
     */
    private makeArrowTexture(key: string, dir: Direction, size: number, color: number): void {
        const rt = this.add.renderTexture(0, 0, size, size).setVisible(false);
        const gfx = this.add.graphics();
        drawArrowShape(gfx, dir, size, color, 1);
        // Stamp the graphics centered on the render texture
        rt.draw(gfx, size / 2, size / 2);
        rt.saveTexture(key);
        gfx.destroy();
        rt.destroy();
    }
}

// ─── Shared arrow-drawing helper ─────────────────────────────────────────────

/**
 * Draws a filled arrow shape into `gfx` centred at (0, 0).
 * Works for all four cardinal directions.
 */
export function drawArrowShape(
    gfx: Phaser.GameObjects.Graphics,
    dir: Direction,
    size: number,
    color: number,
    alpha: number,
): void {
    const half      = size * 0.42;   // half-extent of the bounding box
    const shaft     = size * 0.15;   // half-thickness of the shaft
    const headLen   = size * 0.30;   // length of the arrowhead along the axis
    const headWidth = size * 0.38;   // half-width of the arrowhead base

    gfx.clear();
    gfx.fillStyle(color, alpha);

    switch (dir) {
        case Direction.RIGHT:
            // Shaft (rectangle)
            gfx.fillRect(-half, -shaft, half * 2 - headLen, shaft * 2);
            // Arrowhead (triangle pointing right)
            gfx.fillTriangle(
                half - headLen, -headWidth,
                half,            0,
                half - headLen,  headWidth,
            );
            break;

        case Direction.LEFT:
            // Shaft
            gfx.fillRect(-half + headLen, -shaft, half * 2 - headLen, shaft * 2);
            // Arrowhead (triangle pointing left)
            gfx.fillTriangle(
                -half + headLen, -headWidth,
                -half,            0,
                -half + headLen,  headWidth,
            );
            break;

        case Direction.UP:
            // Shaft
            gfx.fillRect(-shaft, -half + headLen, shaft * 2, half * 2 - headLen);
            // Arrowhead (triangle pointing up)
            gfx.fillTriangle(
                -headWidth, -half + headLen,
                 0,          -half,
                 headWidth,  -half + headLen,
            );
            break;

        case Direction.DOWN:
            // Shaft
            gfx.fillRect(-shaft, -half, shaft * 2, half * 2 - headLen);
            // Arrowhead (triangle pointing down)
            gfx.fillTriangle(
                -headWidth,  half - headLen,
                 0,           half,
                 headWidth,   half - headLen,
            );
            break;
    }
}
