import { Scene } from 'phaser';

/**
 * Boot – minimal first scene.
 * Immediately transitions to the Preloader.
 */
export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create() {
        this.scene.start('Preloader');
    }
}
