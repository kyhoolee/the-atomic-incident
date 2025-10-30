export class MenuView {
    scene;
    selection;
    callbacks;
    constructor(scene, selection, callbacks) {
        this.scene = scene;
        this.selection = selection;
        this.callbacks = callbacks;
        this.build();
    }
    build() {
        const { width, height } = this.scene.scale;
        const title = this.scene.add.text(width / 2, height * 0.2, 'THE ATOMIC INCIDENT', {
            fontFamily: 'Montserrat',
            fontSize: '48px',
            color: '#ffffff'
        });
        title.setOrigin(0.5);
        const playButton = this.scene.add.text(width / 2, height * 0.45, '[ PLAY ]', {
            fontFamily: 'Montserrat',
            fontSize: '32px',
            color: '#66ffcc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        playButton.on('pointerup', () => this.callbacks.onPlay(this.selection));
        // TODO: replace placeholder text buttons with UI components defined in design doc.
        const optionsButton = this.scene.add.text(width / 2, height * 0.55, 'Options', {
            fontFamily: 'Montserrat',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        optionsButton.on('pointerup', () => this.callbacks.onOptions());
    }
}
