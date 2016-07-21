/// <reference path="app.ts"/>

class GameScreen extends Phaser.State {
    // TODO: Have player cards. 175x125 too small? 375x525 for big?
    game: PhaserGame;
    animationQueue: Animation[];

    inningLabel: Phaser.Text;
    scoreLabels: Phaser.Text[];
    outLabel: Phaser.Text;
    announcerLabel: Phaser.Text;
    batterLabel: Phaser.Text;
    pitcherLabel: Phaser.Text;
    runnerLabels: Phaser.Text[];
    runnerSprites: Phaser.Sprite[];

    preload() {
        this.animationQueue = [];
        this.scoreLabels = [];
        this.runnerLabels = [];
        this.runnerSprites = [];
        this.game.load.image("card", "img/player/0B2.jpg");
    }
    create() {
        let font = { font: "20px Arial", fill: "black" };
        let fontWrap = {
            font: "18px Arial",
            fill: "black",
            align: 'left',
            wordWrap: true,
            wordWrapWidth: 200
        }
        let fontRun = { font: "13px Arial", fill: "white", align: "center" }

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

        let loc = [[223, 477], [470, 415], [350, 350], [160, 390], [305, 403]];
        for (let i=0; i<loc.length; i++) {
            let sprite = this.game.add.sprite(loc[i][0], loc[i][1], 'barebar');
            sprite.anchor.set(0.5, 0.5);
            this.runnerSprites[i] = sprite;
            
            let label = this.game.add.text(loc[i][0], loc[i][1], "text", fontRun);
            label.anchor.set(0.5, 0.4);
            this.runnerLabels[i] = label;
        }

        this.game.add.button(10, 560, 'arrowbuttons', this.advanceGame, this, 1, 1, 3);
        this.game.add.button(70, 560, 'arrowbuttons', this.simGame, this, 1, 1, 3);
        
        this.game.add.button(750, 10, 'closeButton', this.quitGame, this, 0, 0, 0);
        
        this.updateStrings()
    }
    updateStrings() {
        let colours = [0x002147, 0xcc092f]; // TODO: Customize these to teams.
        let g = this.game.ballgame;
        let innStr = (g.innTop ? "Top" : "Bot") + " " + g.inning;
        let offColour = (g.innTop ? colours[0] : colours[1]);
        let defColour = (g.innTop ? colours[1] : colours[0]);
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
        
        for (let i=1; i<=3; i++) {
            if (g.bases[i]) {
                this.runnerLabels[i].visible = true;
                this.runnerLabels[i].text = g.bases[i].getName();
                this.runnerSprites[i].visible = true;
                this.runnerSprites[i].tint = offColour;
            } else {
                this.runnerLabels[i].visible = false;
                this.runnerSprites[i].visible = false;
            }
        }
        this.runnerSprites[0].tint = offColour;
        this.runnerSprites[4].tint = defColour;
        this.runnerLabels[0].text = g.getBatter().getName();
        this.runnerLabels[4].text = g.getPitcher().getName();
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