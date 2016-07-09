/// <reference path="app.ts"/>

class GameScreen extends Phaser.State {
    game: PhaserGame;
    animationQueue: Animation[];

    inningLabel: Phaser.Text;
    scoreLabels: Phaser.Text[];
    outLabel: Phaser.Text;
    announcerLabel: Phaser.Text;

    preload() {
        this.animationQueue = [];
        this.scoreLabels = [];
    }
    create() {
        let font = { font: "20px Arial", fill: "#000000" };
        let fontWrap = {
            font: "18px Arial",
            fill: "black",
            align: 'left',
            wordWrap: true,
            wordWrapWidth: 200
        }

        this.game.stage.backgroundColor = '#0000ff';
        this.add.image(0, 0, "bg");
        this.add.image(200, 0, "scorepanel");
        // CLE 1 TOR 1 - Top 11th - 0 out
        // Runners 3rd, 2nd, 1st, batter, pitcher
        // Last play/announcer

        // CLE 1  Top 11 | Announcer goes here
        // TOR 1  0 out  | and here

        let game = this.game.ballgame;
        for (let i = 0; i < 2; i++) {
            let abbr = game.teams[i].ref.abbr;
            this.game.add.text(210, 10 + 40 * i, abbr, font);
            this.scoreLabels[i] = this.game.add.text(260, 10 + 40 * i, "0", font);
        }
        this.inningLabel = this.game.add.text(300, 10, "Top 1st", font);
        this.outLabel = this.game.add.text(300, 50, "0 out", font);

        this.announcerLabel = this.game.add.text(390, 10, "Play ball!", fontWrap);

        this.game.add.button(10, 560, 'arrowbuttons', this.advanceGame, this, 1, 1, 3);
        this.game.add.button(70, 560, 'arrowbuttons', this.simGame, this, 1, 1, 3);

    }
    updateStrings() {
        let g = this.game.ballgame;
        this.inningLabel.text = g.getInningString();
        for (let i=0; i<2; i++) {
            this.scoreLabels[i].text = "";
        }
        this.outLabel.text = g.outs + " out";
        this.announcerLabel.text = g.getLastPlay().getLog();
    }
    advanceGame() {
        let g = this.game.ballgame;
		g.advanceGame(null);
		this.updateStrings();
	}
    simGame() {
		let g = this.game.ballgame;
		while (g.status === 1) {
			g.advanceGame(null);
		}
		this.updateStrings();
    }
}

class Animation {

}