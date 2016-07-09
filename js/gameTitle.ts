class GameTitle extends Phaser.State {
    preload() {}
    create() {
        this.game.stage.backgroundColor = '#0000ff';
        //this.add.image(0, 0, "bg");
        this.game.debug.text("In GameTitle", 10, 10);

        let font = {
            font: "20px Arial",
            fill: "#ffffff"
        };
        let text = this.game.add.text(10, 100, "Exhibition game", font);
        text.inputEnabled = true;
        text.events.onInputDown.add(this.startExhibitionGame, this);
    }
    startExhibitionGame() {
        this.game.state.start("CreateGame");
    }
}
