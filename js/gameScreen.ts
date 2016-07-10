/// <reference path="app.ts"/>

class GameScreen extends Phaser.State {
    game: PhaserGame;
    animationQueue: Animation[];

    inningLabel: Phaser.Text;
    scoreLabels: Phaser.Text[];
    outLabel: Phaser.Text;
    announcerLabel: Phaser.Text;
    batterLabel: Phaser.Text;
    pitcherLabel: Phaser.Text;
    runnerLabels: Phaser.Text[];

    preload() {
        this.animationQueue = [];
        this.scoreLabels = [];
        this.runnerLabels = [];
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

        let game = this.game.ballgame;
        for (let i = 0; i < 2; i++) {
            let abbr = game.teams[i].ref.abbr;
            this.game.add.text(210, 10 + 40 * i, abbr, font);
            this.scoreLabels[i] = this.game.add.text(260, 10 + 40 * i, "0", font);
        }
        this.inningLabel = this.game.add.text(300, 10, "Top 1st", font);
        this.outLabel = this.game.add.text(300, 50, "0 out", font);

        this.announcerLabel = this.game.add.text(390, 10, "Play ball!", fontWrap);
        this.batterLabel = this.game.add.text(10, 300, "", font);
        this.pitcherLabel = this.game.add.text(10, 330, "", font);
        for (let i = 1; i <= 3; i++) {
            this.runnerLabels[i] = this.game.add.text(10, 330 + i*30, "R", font);
        }

        this.game.add.button(10, 560, 'arrowbuttons', this.advanceGame, this, 1, 1, 3);
        this.game.add.button(70, 560, 'arrowbuttons', this.simGame, this, 1, 1, 3);
        
        this.game.add.button(750, 10, 'closeButton', this.quitGame, this, 0, 0, 0);
        
        this.updateStrings()
    }
    updateStrings() {
        let g = this.game.ballgame;
        let innStr = (g.innTop ? "Top" : "Bot") + " " + g.inning;
        this.inningLabel.text = innStr;
        for (let i=0; i<2; i++) {
            this.scoreLabels[i].text = g.teams[i].r.toString();
        }
        this.outLabel.text = g.outs + " out";
        let logStr = "Play ball!";
        if (g.getLastPlay()) {
            logStr = g.getLastPlay().getLog();
        }
        this.announcerLabel.text = logStr;
        
        this.batterLabel.text = "Batting: " + g.getBatter().getName();
        this.pitcherLabel.text = "Pitching: " + g.getPitcher().getName();
        for (let i=1; i<=3; i++) {
            let text = "";
            if (g.bases[i]) {
                text = g.bases[i].getName();
            }
            this.runnerLabels[i].text = toOrdinal(i) + ": " + text;
        }
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
    quitGame() {
        this.game.ballgame = null;
        this.game.state.start("GameTitle");
    }
}

class Animation {

}