import { Geom, Math as PhaserMath, Scene } from 'phaser';
import { Arrow, Direction } from '../Arrow';
import { LEVELS, LevelDef } from '../LevelData';
import { drawArrowShape } from './Preloader';

// ── Palette ───────────────────────────────────────────────────────────────────

const ARROW_COLORS: Record<Direction, number> = {
    [Direction.UP]:    0x5DADE2,
    [Direction.DOWN]:  0xEC7063,
    [Direction.LEFT]:  0x58D68D,
    [Direction.RIGHT]: 0xF0B27A,
};

const CELL_COLOR_A  = 0xFFFFFF;
const CELL_COLOR_B  = 0xF0F3F4;
const GRID_LINE     = 0xD5D8DC;
const GRID_SHADOW   = 0xBFC9CA;
const BG_COLOR      = '#EBF5FB';

// ── Scene data passed via scene.start ────────────────────────────────────────

interface GameSceneData {
    levelIndex?: number;
}

/**
 * GameScene – the core puzzle gameplay.
 *
 * Layout (800×600 canvas):
 *   - Top bar  (y 0‥59):   level title, hearts, move count
 *   - Grid area (y 60‥529): the NxN arrow grid, dynamically sized & centred
 *   - Bottom   (y 530‥599): Undo + Restart buttons
 */
export class GameScene extends Scene {
    // ── Game state ────────────────────────────────────────────────────────────
    private levelIndex!: number;
    private levelDef!: LevelDef;
    private grid!: (Arrow | null)[][];
    private hearts!: number;
    private moveCount!: number;
    private arrowsLeft!: number;
    private isAnimating!: boolean;

    // Undo state (single-step undo)
    private lastArrow: Arrow | null = null;

    // ── Layout constants (computed in create) ─────────────────────────────────
    private gridSize!: number;
    private cellSize!: number;
    private gridOffsetX!: number;
    private gridOffsetY!: number;

    // ── Graphics layers ───────────────────────────────────────────────────────
    private gridGfx!: Phaser.GameObjects.Graphics;
    private pathGfx!: Phaser.GameObjects.Graphics; // hover highlight

    // ── UI text objects ───────────────────────────────────────────────────────
    private heartTexts!: Phaser.GameObjects.Text[];
    private movesText!: Phaser.GameObjects.Text;
    private undoBtn!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    init(data: GameSceneData) {
        this.levelIndex  = data?.levelIndex ?? 0;
        this.levelDef    = LEVELS[this.levelIndex] ?? LEVELS[0];
        this.hearts      = this.levelDef.hearts;
        this.moveCount   = 0;
        this.isAnimating = false;
        this.lastArrow   = null;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.cameras.main.setBackgroundColor(BG_COLOR);

        // ── Compute grid layout ───────────────────────────────────────────────
        this.gridSize = this.levelDef.gridSize;

        const topBarH    = 60;
        const bottomBarH = 70;
        const availW     = W;
        const availH     = H - topBarH - bottomBarH;

        // Fit the grid into the available rectangle with a small margin
        const maxGridPx = Math.min(availW * 0.88, availH * 0.96);
        this.cellSize    = Math.floor(maxGridPx / this.gridSize);
        const gridPx     = this.cellSize * this.gridSize;

        this.gridOffsetX = Math.round((W - gridPx) / 2);
        this.gridOffsetY = topBarH + Math.round((availH - gridPx) / 2);

        // ── Create graphics layers (order matters for depth) ──────────────────
        this.gridGfx = this.add.graphics();
        this.pathGfx = this.add.graphics();

        // ── Build grid state and draw everything ──────────────────────────────
        this.initGrid();
        this.drawGrid();
        this.spawnArrows();
        this.arrowsLeft = this.levelDef.arrows.length;

        // ── UI ────────────────────────────────────────────────────────────────
        this.createUI();

        // ── Input ─────────────────────────────────────────────────────────────
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerout',  () => { this.pathGfx.clear(); }, this);

        // Keyboard: arrow-key highlighting (Enter/Space = click)
        this.input.keyboard?.on('keydown', this.onKeyDown, this);
    }

    // ── Grid initialisation ───────────────────────────────────────────────────

    private initGrid(): void {
        this.grid = [];
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = new Array(this.gridSize).fill(null) as null[];
        }
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    private drawGrid(): void {
        const gfx = this.gridGfx;
        gfx.clear();

        const gridPx = this.cellSize * this.gridSize;

        // Drop-shadow
        gfx.fillStyle(GRID_SHADOW, 0.6);
        gfx.fillRoundedRect(
            this.gridOffsetX - 3, this.gridOffsetY - 3,
            gridPx + 6, gridPx + 6,
            6,
        );

        // Cells
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const x = this.gridOffsetX + c * this.cellSize;
                const y = this.gridOffsetY + r * this.cellSize;
                gfx.fillStyle((r + c) % 2 === 0 ? CELL_COLOR_A : CELL_COLOR_B, 1);
                gfx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
            }
        }

        // Grid lines
        gfx.lineStyle(1, GRID_LINE, 1);
        for (let r = 0; r <= this.gridSize; r++) {
            const y = this.gridOffsetY + r * this.cellSize;
            gfx.lineBetween(this.gridOffsetX, y, this.gridOffsetX + gridPx, y);
        }
        for (let c = 0; c <= this.gridSize; c++) {
            const x = this.gridOffsetX + c * this.cellSize;
            gfx.lineBetween(x, this.gridOffsetY, x, this.gridOffsetY + gridPx);
        }
    }

    private spawnArrows(): void {
        for (const def of this.levelDef.arrows) {
            const arrow  = new Arrow(def.row, def.col, def.direction);
            this.grid[def.row][def.col] = arrow;

            const gfx = this.add.graphics();
            gfx.x = this.cellCenterX(def.col);
            gfx.y = this.cellCenterY(def.row);
            const color = ARROW_COLORS[def.direction];
            drawArrowShape(gfx, def.direction, this.cellSize * 0.82, color, 1);

            // Make the cell interactive
            gfx.setInteractive(
                new Geom.Rectangle(
                    -this.cellSize / 2, -this.cellSize / 2,
                    this.cellSize, this.cellSize,
                ),
                Geom.Rectangle.Contains,
            );

            arrow.gfx = gfx;
        }
    }

    // ── UI ────────────────────────────────────────────────────────────────────

    private createUI(): void {
        const W = this.scale.width;
        const H = this.scale.height;

        // Level title
        this.add.text(16, 14, `Level ${this.levelDef.id} – ${this.levelDef.title}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#2C3E50',
            fontStyle: 'bold',
        });

        // Move counter
        this.movesText = this.add.text(W / 2, 14, 'Moves: 0', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#5D6D7E',
        }).setOrigin(0.5, 0);

        // Hearts
        this.heartTexts = [];
        this.renderHearts();

        // ── Bottom buttons ────────────────────────────────────────────────────
        const btnY = H - 34;

        // Restart
        const restartBtn = this.add.text(W - 16, btnY, '↺ Restart', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#2980B9',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            this.scene.restart({ levelIndex: this.levelIndex });
        });
        restartBtn.on('pointerover', () => restartBtn.setColor('#3498DB'));
        restartBtn.on('pointerout',  () => restartBtn.setColor('#2980B9'));

        // Menu
        const menuBtn = this.add.text(16, btnY, '☰ Menu', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#7F8C8D',
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => { this.scene.start('MainMenu'); });
        menuBtn.on('pointerover', () => menuBtn.setColor('#2C3E50'));
        menuBtn.on('pointerout',  () => menuBtn.setColor('#7F8C8D'));

        // Undo
        this.undoBtn = this.add.text(W / 2, btnY, '⟵ Undo', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#BDC3C7',
        }).setOrigin(0.5, 0.5);
    }

    private renderHearts(): void {
        const W = this.scale.width;

        // Clear old hearts
        this.heartTexts.forEach(t => t.destroy());
        this.heartTexts = [];

        const total   = this.levelDef.hearts;
        const spacing = 28;
        const startX  = W - 16 - (total - 1) * spacing;

        for (let i = 0; i < total; i++) {
            const filled = i < this.hearts;
            const t = this.add.text(startX + i * spacing, 14, filled ? '❤' : '🖤', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: filled ? '#E74C3C' : '#BDC3C7',
            });
            this.heartTexts.push(t);
        }
    }

    // ── Input handlers ────────────────────────────────────────────────────────

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        if (this.isAnimating) return;
        const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
        if (row < 0) return; // outside grid
        this.pathGfx.clear();
        this.tryExtract(row, col);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer): void {
        if (this.isAnimating) return;
        const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
        this.pathGfx.clear();
        if (row < 0) return;
        const arrow = this.grid[row][col];
        if (arrow) this.drawPathHighlight(arrow);
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (this.isAnimating) return;
        if (event.key === 'z' || event.key === 'Z') {
            this.doUndo();
        }
    }

    // ── Core game logic ───────────────────────────────────────────────────────

    /**
     * Attempt to extract the arrow at (row, col).
     * If the path is clear → animate slide-off.
     * Otherwise → collision: deduct heart, flash the arrow red.
     */
    private tryExtract(row: number, col: number): void {
        const arrow = this.grid[row][col];
        if (!arrow || !arrow.gfx) return;

        if (this.isPathClear(arrow)) {
            this.extractArrow(arrow);
        } else {
            this.collisionEffect(arrow);
        }
    }

    /**
     * Returns true if every cell along the arrow's exit path is empty.
     */
    private isPathClear(arrow: Arrow): boolean {
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

    /**
     * Slides the arrow off the grid and removes it from the game state.
     */
    private extractArrow(arrow: Arrow): void {
        const gfx = arrow.gfx!;
        this.isAnimating = true;

        // Stash for undo BEFORE removing from grid
        this.lastArrow = new Arrow(arrow.row, arrow.col, arrow.direction);

        // Remove from logical grid immediately
        this.grid[arrow.row][arrow.col] = null;
        this.arrowsLeft--;
        this.moveCount++;
        this.movesText.setText(`Moves: ${this.moveCount}`);

        // Enable undo button
        this.undoBtn
            .setColor('#2980B9')
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.doUndo())
            .on('pointerover', () => this.undoBtn.setColor('#3498DB'))
            .on('pointerout',  () => this.undoBtn.setColor('#2980B9'));

        // Target position: well off-screen in the exit direction
        const { dr, dc }  = arrow.getDelta();
        const distance    = (this.gridSize + 2) * this.cellSize;
        const targetX     = gfx.x + dc * distance;
        const targetY     = gfx.y + dr * distance;

        // Particle burst at current position
        this.spawnParticles(gfx.x, gfx.y, ARROW_COLORS[arrow.direction]);

        this.tweens.add({
            targets:  gfx,
            x:        targetX,
            y:        targetY,
            duration: 320,
            ease:     'Cubic.easeIn',
            onComplete: () => {
                gfx.destroy();
                this.isAnimating = false;
                this.checkWin();
            },
        });
    }

    /**
     * Flash the arrow red; deduct a heart; check game-over.
     */
    private collisionEffect(arrow: Arrow): void {
        const gfx = arrow.gfx!;
        const color = ARROW_COLORS[arrow.direction];

        // Red flash tween
        this.tweens.add({
            targets:  gfx,
            alpha:    0.1,
            duration: 80,
            yoyo:     true,
            repeat:   2,
            ease:     'Linear',
            onStart: () => {
                drawArrowShape(gfx, arrow.direction, this.cellSize * 0.82, 0xE74C3C, 1);
            },
            onComplete: () => {
                drawArrowShape(gfx, arrow.direction, this.cellSize * 0.82, color, 1);
                gfx.alpha = 1;
            },
        });

        // Camera shake
        this.cameras.main.shake(200, 0.005);

        this.hearts--;
        this.renderHearts();

        if (this.hearts <= 0) {
            this.time.delayedCall(400, () => {
                this.scene.start('GameOver', { levelIndex: this.levelIndex });
            });
        }
    }

    /**
     * Single-step undo: put the last successfully extracted arrow back.
     */
    private doUndo(): void {
        if (!this.lastArrow || this.isAnimating) return;

        const arrow = this.lastArrow;
        this.lastArrow = null;

        // Restore grid state
        this.grid[arrow.row][arrow.col] = arrow;
        this.arrowsLeft++;
        this.moveCount--;
        this.movesText.setText(`Moves: ${this.moveCount}`);

        // Re-draw the arrow sprite
        const gfx = this.add.graphics();
        gfx.x = this.cellCenterX(arrow.col);
        gfx.y = this.cellCenterY(arrow.row);
        gfx.alpha = 0;
        drawArrowShape(gfx, arrow.direction, this.cellSize * 0.82, ARROW_COLORS[arrow.direction], 1);
        arrow.gfx = gfx;

        this.tweens.add({
            targets: gfx,
            alpha:   1,
            duration: 250,
            ease: 'Linear',
        });

        // Disable undo button until next extraction
        this.undoBtn
            .setColor('#BDC3C7')
            .removeInteractive()
            .off('pointerdown')
            .off('pointerover')
            .off('pointerout');
    }

    // ── Win / save ────────────────────────────────────────────────────────────

    private checkWin(): void {
        if (this.arrowsLeft > 0) return;

        // Save progress
        const nextLevel = Math.min(this.levelIndex + 1, LEVELS.length - 1);
        try {
            localStorage.setItem('arrows_level', nextLevel.toString());
        } catch {
            // ignore storage errors
        }

        const stars = this.hearts >= this.levelDef.hearts
            ? 3
            : this.hearts > 0
                ? 2
                : 1;

        this.time.delayedCall(300, () => {
            this.scene.start('LevelComplete', {
                levelIndex: this.levelIndex,
                stars,
                moves:      this.moveCount,
            });
        });
    }

    // ── Visual helpers ────────────────────────────────────────────────────────

    /**
     * Draw a translucent highlight over every cell on the arrow's exit path.
     * Green = clear; Red = blocked.
     */
    private drawPathHighlight(arrow: Arrow): void {
        const gfx           = this.pathGfx;
        const { dr, dc }    = arrow.getDelta();
        const pathClear     = this.isPathClear(arrow);

        // Highlight the arrow's own cell softly
        gfx.fillStyle(pathClear ? 0x58D68D : 0xE74C3C, 0.18);
        gfx.fillRect(
            this.gridOffsetX + arrow.col * this.cellSize + 1,
            this.gridOffsetY + arrow.row * this.cellSize + 1,
            this.cellSize - 2, this.cellSize - 2,
        );

        let r = arrow.row + dr;
        let c = arrow.col + dc;
        while (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
            const blocked = this.grid[r][c] !== null;
            gfx.fillStyle(blocked ? 0xE74C3C : 0xA9CCE3, 0.25);
            gfx.fillRect(
                this.gridOffsetX + c * this.cellSize + 1,
                this.gridOffsetY + r * this.cellSize + 1,
                this.cellSize - 2, this.cellSize - 2,
            );
            if (blocked) break; // stop highlighting beyond the blocker
            r += dr;
            c += dc;
        }
    }

    /**
     * Emit a small burst of coloured dots at (x, y).
     */
    private spawnParticles(x: number, y: number, color: number): void {
        const COUNT    = 8;
        const SIZE     = 4;
        for (let i = 0; i < COUNT; i++) {
            const angle  = (i / COUNT) * Math.PI * 2;
            const speed  = PhaserMath.Between(40, 80);
            const dot    = this.add.graphics();
            dot.fillStyle(color, 1);
            dot.fillCircle(0, 0, SIZE);
            dot.x = x;
            dot.y = y;

            this.tweens.add({
                targets:  dot,
                x:        x + Math.cos(angle) * speed,
                y:        y + Math.sin(angle) * speed,
                alpha:    0,
                scaleX:   0.2,
                scaleY:   0.2,
                duration: 400,
                ease:     'Power2',
                onComplete: () => dot.destroy(),
            });
        }
    }

    // ── Coordinate helpers ────────────────────────────────────────────────────

    private cellCenterX(col: number): number {
        return this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    }

    private cellCenterY(row: number): number {
        return this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
    }

    /** Convert canvas pixel to grid (row, col).  Returns {row:-1, col:-1} if outside. */
    private pixelToGrid(px: number, py: number): { row: number; col: number } {
        const c = Math.floor((px - this.gridOffsetX) / this.cellSize);
        const r = Math.floor((py - this.gridOffsetY) / this.cellSize);
        if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) {
            return { row: -1, col: -1 };
        }
        return { row: r, col: c };
    }
}
