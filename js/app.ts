/// <reference path="../lib/phaser.d.ts"/>
/// <reference path="sbs.ts"/>

class LeagueData {
    lgAvg;
    teams: Team[];
    defaults: number[];
}

class PhaserGame extends Phaser.Game {
    data: LeagueData;
    ballgame: Game;
    constructor() {
        super(800, 600, Phaser.AUTO, "content");
        this.state.add('BootState', BootState);
        this.state.add('Preload', Preload);
        this.state.add('GameTitle', GameTitle);
        this.state.add('CreateGame', CreateGame);
        this.state.add('GameScreen', GameScreen);
        this.state.start('BootState');
    }
}

class BootState extends Phaser.State {
    preload() {}
    create() {
        this.game.debug.text("In BootState", 10, 10);
        this.game.state.start("Preload");
    }
}

window.onload = () => {
    window["GAME"] = new PhaserGame();
};
// Screen is 800x600, assume 20px tiles, so 40x30.