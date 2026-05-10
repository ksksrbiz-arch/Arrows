import { Geom, Math as PhaserMath, Scene } from 'phaser';
import { Arrow, Direction } from '../Arrow';
import { BasePuzzleEngine } from '../engine/BasePuzzleEngine';
import { GameMode, GameSceneDataLike, getGameMode, ModeLevel } from '../GameMode';
import { UIManager } from '../ui/UIManager';
import { drawArrowShape } from './Preloader';

const ARROW_COLORS: Record<Direction, number> = {
    [Direction.UP]: 0x5DADE2,
    [Direction.DOWN]: 0xEC7063,
    [Direction.LEFT]: 0x58D68D,
    [Direction.RIGHT]: 0xF0B27A,
};

const CELL_COLOR_A = 0xFFFFFF;
const CELL_COLOR_B = 0xF0F3F4;
const GRID_LINE = 0xD5D8DC;
const GRID_SHADOW = 0xBFC9CA;
const BG_COLOR = '#EBF5FB';
const CLEAR_PATH_STATUS = 'Clear lane - this arrow can exit now.';
const BLOCKED_PATH_STATUS = 'Blocked lane - clear the obstacle first.';
const EMPTY_CELL_STATUS = 'Empty cell - hover an arrow to preview its exit path.';
const SUCCESS_STATUS = 'Nice move - keep peeling the board apart.';
const ZEN_BLOCKED_STATUS = 'Blocked lane, but Zen mode keeps the run alive.';
const HEART_LOSS_STATUS = 'Blocked path - you lost a heart.';
const GAME_OVER_STATUS = 'No hearts left - level failed.';
const UNDO_STATUS = 'Last move restored.';

export class GameScene extends Scene {
    private mode!: GameMode;
    private modeLevel!: ModeLevel;
    private engine!: BasePuzzleEngine;
    private ui!: UIManager;
    private isAnimating!: boolean;
    private startedAt!: number;

    private cellSize!: number;
    private gridOffsetX!: number;
    private gridOffsetY!: number;

    private gridGfx!: Phaser.GameObjects.Graphics;
    private pathGfx!: Phaser.GameObjects.Graphics;

    constructor() {
        super('Game');
    }

    init(data: GameSceneDataLike) {
        this.mode = getGameMode(data?.modeId);
        this.modeLevel = this.mode.resolveLevel(data ?? {});
        this.engine = new BasePuzzleEngine(this.modeLevel.levelDef, {
            heartsDelta: this.mode.heartsDelta,
            allowUndo: this.mode.allowUndo,
            infiniteHearts: this.mode.infiniteHearts,
        });
        this.isAnimating = false;
        this.startedAt = 0;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.drawSceneChrome(W, H);
        this.computeGridLayout(W, H);

        this.gridGfx = this.add.graphics();
        this.pathGfx = this.add.graphics();

        this.drawGrid();
        this.spawnArrows();

        this.ui = new UIManager(this, this.mode, this.modeLevel);
        this.ui.create(W, H, this.engine, {
            onMenu: () => this.scene.start('MainMenu'),
            onRestart: () => this.scene.restart(this.modeLevel.context),
            onUndo: () => this.doUndo(),
        });

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerout', () => {
            this.pathGfx.clear();
            this.ui.setStatus(this.mode.getIdleStatus());
        }, this);
        this.input.keyboard?.on('keydown', this.onKeyDown, this);
        this.startedAt = this.time.now;
    }

    update(): void {
        if (this.ui && this.startedAt > 0) {
            this.ui.update(this.engine, this.time.now - this.startedAt);
        }
    }

    private computeGridLayout(width: number, height: number): void {
        const topBarH = 60;
        const bottomBarH = 70;
        const availH = height - topBarH - bottomBarH;
        const maxGridPx = Math.min(width * 0.88, availH * 0.96);
        this.cellSize = Math.floor(maxGridPx / this.engine.gridSize);
        const gridPx = this.cellSize * this.engine.gridSize;
        this.gridOffsetX = Math.round((width - gridPx) / 2);
        this.gridOffsetY = topBarH + Math.round((availH - gridPx) / 2);
    }

    private drawGrid(): void {
        const gfx = this.gridGfx;
        gfx.clear();
        const gridPx = this.cellSize * this.engine.gridSize;

        gfx.fillStyle(GRID_SHADOW, 0.6);
        gfx.fillRoundedRect(this.gridOffsetX - 3, this.gridOffsetY - 3, gridPx + 6, gridPx + 6, 6);

        for (let r = 0; r < this.engine.gridSize; r++) {
            for (let c = 0; c < this.engine.gridSize; c++) {
                const x = this.gridOffsetX + c * this.cellSize;
                const y = this.gridOffsetY + r * this.cellSize;
                gfx.fillStyle((r + c) % 2 === 0 ? CELL_COLOR_A : CELL_COLOR_B, 1);
                gfx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
            }
        }

        gfx.lineStyle(1, GRID_LINE, 1);
        for (let r = 0; r <= this.engine.gridSize; r++) {
            const y = this.gridOffsetY + r * this.cellSize;
            gfx.lineBetween(this.gridOffsetX, y, this.gridOffsetX + gridPx, y);
        }
        for (let c = 0; c <= this.engine.gridSize; c++) {
            const x = this.gridOffsetX + c * this.cellSize;
            gfx.lineBetween(x, this.gridOffsetY, x, this.gridOffsetY + gridPx);
        }
    }

    private spawnArrows(): void {
        for (let r = 0; r < this.engine.gridSize; r++) {
            for (let c = 0; c < this.engine.gridSize; c++) {
                const arrow = this.engine.getArrow(r, c);
                if (arrow) this.createArrowGraphic(arrow, 1);
            }
        }
    }

    private createArrowGraphic(arrow: Arrow, alpha: number): Phaser.GameObjects.Graphics {
        const gfx = this.add.graphics();
        gfx.x = this.cellCenterX(arrow.col);
        gfx.y = this.cellCenterY(arrow.row);
        gfx.alpha = alpha;
        drawArrowShape(gfx, arrow.direction, this.cellSize * 0.82, ARROW_COLORS[arrow.direction], 1);
        gfx.setInteractive(
            new Geom.Rectangle(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize),
            Geom.Rectangle.Contains,
        );
        arrow.gfx = gfx;
        return gfx;
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        if (this.isAnimating) return;
        this.pathGfx.clear();
        const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
        if (row < 0) {
            this.ui.setStatus(this.mode.getIdleStatus());
            return;
        }
        this.tryExtract(row, col);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer): void {
        if (this.isAnimating) return;
        const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
        this.pathGfx.clear();
        if (row < 0) {
            this.ui.setStatus(this.mode.getIdleStatus());
            return;
        }

        const arrow = this.engine.getArrow(row, col);
        if (arrow) {
            this.drawPathHighlight(arrow);
            this.ui.setStatus(this.engine.isPathClear(arrow) ? CLEAR_PATH_STATUS : BLOCKED_PATH_STATUS);
        } else {
            this.ui.setStatus(EMPTY_CELL_STATUS);
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (this.isAnimating) return;
        if (event.key === 'z' || event.key === 'Z') {
            this.doUndo();
        } else if (event.key === 'r' || event.key === 'R') {
            this.scene.restart(this.modeLevel.context);
        } else if (event.key === 'Escape') {
            this.scene.start('MainMenu');
        } else if (this.mode.id === 'daily' && event.key === 'ArrowLeft') {
            this.shiftDaily(-1);
        } else if (this.mode.id === 'daily' && event.key === 'ArrowRight') {
            this.shiftDaily(1);
        }
    }

    private tryExtract(row: number, col: number): void {
        const result = this.engine.tryExtract(row, col);
        if (result.type === 'empty') return;

        if (result.type === 'extract') {
            this.extractArrow(result.arrow);
        } else {
            this.collisionEffect(result.arrow, result.gameOver, result.lostHeart);
        }
    }

    private extractArrow(arrow: Arrow): void {
        const gfx = arrow.gfx;
        if (!gfx) return;

        this.isAnimating = true;
        this.ui.update(this.engine, this.time.now - this.startedAt);
        this.ui.setStatus(SUCCESS_STATUS);
        this.ui.setUndoEnabled(this.engine.canUndo(), () => this.doUndo());

        const { dr, dc } = arrow.getDelta();
        const distance = (this.engine.gridSize + 2) * this.cellSize;
        const targetX = gfx.x + dc * distance;
        const targetY = gfx.y + dr * distance;

        this.spawnParticles(gfx.x, gfx.y, ARROW_COLORS[arrow.direction]);

        this.tweens.add({
            targets: gfx,
            x: targetX,
            y: targetY,
            duration: 320,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                gfx.destroy();
                this.isAnimating = false;
                this.checkWin();
            },
        });
    }

    private collisionEffect(arrow: Arrow, gameOver: boolean, lostHeart: boolean): void {
        const gfx = arrow.gfx;
        if (!gfx) return;

        const color = ARROW_COLORS[arrow.direction];
        this.tweens.add({
            targets: gfx,
            alpha: 0.1,
            duration: 80,
            yoyo: true,
            repeat: 2,
            ease: 'Linear',
            onStart: () => drawArrowShape(gfx, arrow.direction, this.cellSize * 0.82, 0xE74C3C, 1),
            onComplete: () => {
                drawArrowShape(gfx, arrow.direction, this.cellSize * 0.82, color, 1);
                gfx.alpha = 1;
            },
        });

        this.cameras.main.shake(200, 0.005);
        this.ui.update(this.engine, this.time.now - this.startedAt);

        if (!lostHeart) {
            this.ui.setStatus(ZEN_BLOCKED_STATUS);
            return;
        }

        this.ui.setStatus(gameOver ? GAME_OVER_STATUS : HEART_LOSS_STATUS);
        if (gameOver) {
            const fail = this.mode.onFail(this.modeLevel, this.engine, this.time.now - this.startedAt);
            this.time.delayedCall(400, () => {
                this.scene.start('GameOver', {
                    ...this.modeLevel.context,
                    modeId: this.mode.id,
                    message: fail.message,
                    score: fail.score,
                    highScore: fail.highScore,
                });
            });
        }
    }

    private doUndo(): void {
        if (this.isAnimating) return;
        const arrow = this.engine.undo();
        if (!arrow) return;

        const gfx = this.createArrowGraphic(arrow, 0);
        this.tweens.add({ targets: gfx, alpha: 1, duration: 250, ease: 'Linear' });
        this.ui.update(this.engine, this.time.now - this.startedAt);
        this.ui.setUndoEnabled(false, () => this.doUndo());
        this.ui.setStatus(UNDO_STATUS);
    }

    private checkWin(): void {
        if (this.engine.arrowsLeft > 0) return;

        const outcome = this.mode.onComplete({
            level: this.modeLevel,
            engine: this.engine,
            elapsedMs: this.time.now - this.startedAt,
        });

        this.time.delayedCall(300, () => {
            this.scene.start('LevelComplete', {
                ...this.modeLevel.context,
                levelIndex: this.modeLevel.context.levelIndex ?? 0,
                modeId: this.mode.id,
                stars: outcome.stars,
                moves: this.engine.moveCount,
                summary: outcome.summary,
                score: outcome.score,
                highScore: outcome.highScore,
                nextData: outcome.nextData,
            });
        });
    }

    private drawPathHighlight(arrow: Arrow): void {
        const gfx = this.pathGfx;
        const { dr, dc } = arrow.getDelta();
        const pathClear = this.engine.isPathClear(arrow);

        gfx.fillStyle(pathClear ? 0x58D68D : 0xE74C3C, 0.18);
        gfx.fillRect(
            this.gridOffsetX + arrow.col * this.cellSize + 1,
            this.gridOffsetY + arrow.row * this.cellSize + 1,
            this.cellSize - 2,
            this.cellSize - 2,
        );

        let r = arrow.row + dr;
        let c = arrow.col + dc;
        while (r >= 0 && r < this.engine.gridSize && c >= 0 && c < this.engine.gridSize) {
            const blocked = this.engine.grid[r][c] !== null;
            gfx.fillStyle(blocked ? 0xE74C3C : 0xA9CCE3, 0.25);
            gfx.fillRect(
                this.gridOffsetX + c * this.cellSize + 1,
                this.gridOffsetY + r * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2,
            );
            if (blocked) break;
            r += dr;
            c += dc;
        }
    }

    private spawnParticles(x: number, y: number, color: number): void {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = PhaserMath.Between(40, 80);
            const dot = this.add.graphics();
            dot.fillStyle(color, 1);
            dot.fillCircle(0, 0, 4);
            dot.x = x;
            dot.y = y;

            this.tweens.add({
                targets: dot,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 400,
                ease: 'Power2',
                onComplete: () => dot.destroy(),
            });
        }
    }

    private cellCenterX(col: number): number {
        return this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    }

    private cellCenterY(row: number): number {
        return this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
    }

    private pixelToGrid(px: number, py: number): { row: number; col: number } {
        const c = Math.floor((px - this.gridOffsetX) / this.cellSize);
        const r = Math.floor((py - this.gridOffsetY) / this.cellSize);
        if (r < 0 || r >= this.engine.gridSize || c < 0 || c >= this.engine.gridSize) {
            return { row: -1, col: -1 };
        }
        return { row: r, col: c };
    }

    private drawSceneChrome(width: number, height: number): void {
        this.cameras.main.setBackgroundColor(BG_COLOR);
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xEAF4FB, 0xEAF4FB, 0xD4E6F1, 0xD4E6F1, 1);
        bg.fillRect(0, 0, width, height);
        bg.fillStyle(this.mode.accentColor, 0.08);
        bg.fillCircle(width * 0.16, height * 0.18, 120);
        bg.fillCircle(width * 0.84, height * 0.84, 150);

        bg.fillStyle(0x0F1726, 0.18);
        bg.fillRoundedRect(12, 10, width - 24, 46, 18);
        bg.fillStyle(0xFFFFFF, 0.12);
        bg.fillRoundedRect(12, height - 66, width - 24, 44, 18);
    }

    private shiftDaily(days: number): void {
        const dateKey = this.modeLevel.context.dateKey;
        if (!dateKey) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;

        const date = new Date(`${dateKey}T00:00:00.000Z`);
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) return;

        date.setUTCDate(date.getUTCDate() + days);
        this.scene.restart({ modeId: this.mode.id, dateKey: date.toISOString().slice(0, 10) });
    }
}
