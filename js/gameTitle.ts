class GameTitle extends Phaser.State {
    preload() {}
    create() {
        this.game.stage.backgroundColor = '#0000ff';
        this.add.image(0, 0, "bg");

        let font = {
            font: "20px Arial",
            fill: "black",
            align: "center"
        };

        let exhGame = this.game.add.button(600, 250, 'buttons', this.startExhibitionGame, this, 0, 0, 1);
        let text = this.game.add.text(0, 0, "Exhibition game", font);
        text.x = Math.floor(600 + exhGame.width / 2);
        text.y = Math.floor(250 + exhGame.height / 2);
        text.anchor.set(0.5, 0.5);
    }
    startExhibitionGame() {
        this.game.state.start("CreateGame");
    }
}
