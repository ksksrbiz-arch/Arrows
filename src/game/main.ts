import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { GameScene } from './scenes/Game';
import { LevelComplete } from './scenes/LevelComplete';
import { GameOver } from './scenes/GameOver';

/**
 * Phaser game configuration for Arrows – Puzzle Escape.
 *
 * Canvas: 800×600 logical pixels, scaled to fit any device screen while
 * preserving aspect ratio (Phaser.Scale.FIT + CENTER_BOTH).
 */
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#EBF5FB',
    scale: {
        mode:       Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        GameScene,
        LevelComplete,
        GameOver,
    ],
};

const StartGame = (parent: string): Game => {
    return new Game({ ...config, parent });
};

export default StartGame;
