/// <reference path="app.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameScreen = (function (_super) {
    __extends(GameScreen, _super);
    function GameScreen() {
        _super.apply(this, arguments);
    }
    GameScreen.prototype.preload = function () {
        this.animationQueue = [];
        this.scoreLabels = [];
        this.runnerLabels = [];
        this.runnerSprites = [];
        this.game.load.image("card", "img/player/0B2.jpg");
    };
    GameScreen.prototype.create = function () {
        var font = { font: "20px Arial", fill: "black" };
        var fontWrap = {
            font: "18px Arial",
            fill: "black",
            align: 'left',
            wordWrap: true,
            wordWrapWidth: 200
        };
        var fontRun = { font: "13px Arial", fill: "white", align: "center" };
        this.game.stage.backgroundColor = '#0000ff';
        this.add.image(0, 0, "bg");
        this.add.image(200, 0, "scorepanel");
        var game = this.game.ballgame;
        for (var i = 0; i < 2; i++) {
            var abbr = game.teams[i].ref.abbr;
            this.game.add.text(210, 10 + 40 * i, abbr, font);
            this.scoreLabels[i] = this.game.add.text(260, 10 + 40 * i, "0", font);
        }
        this.inningLabel = this.game.add.text(300, 10, "Top 1st", font);
        this.outLabel = this.game.add.text(300, 50, "0 out", font);
        this.announcerLabel = this.game.add.text(390, 10, "Play ball!", fontWrap);
        var loc = [[223, 477], [470, 415], [350, 350], [160, 390], [305, 403]];
        for (var i = 0; i < loc.length; i++) {
            var sprite = this.game.add.sprite(loc[i][0], loc[i][1], 'barebar');
            sprite.anchor.set(0.5, 0.5);
            this.runnerSprites[i] = sprite;
            var label = this.game.add.text(loc[i][0], loc[i][1], "text", fontRun);
            label.anchor.set(0.5, 0.4);
            this.runnerLabels[i] = label;
        }
        this.game.add.button(10, 560, 'arrowbuttons', this.advanceGame, this, 1, 1, 3);
        this.game.add.button(70, 560, 'arrowbuttons', this.simGame, this, 1, 1, 3);
        this.game.add.button(750, 10, 'closeButton', this.quitGame, this, 0, 0, 0);
        this.updateStrings();
    };
    GameScreen.prototype.updateStrings = function () {
        var colours = [0x002147, 0xcc092f]; // TODO: Customize these to teams.
        var g = this.game.ballgame;
        var innStr = (g.innTop ? "Top" : "Bot") + " " + g.inning;
        var offColour = (g.innTop ? colours[0] : colours[1]);
        var defColour = (g.innTop ? colours[1] : colours[0]);
        this.inningLabel.text = innStr;
        for (var i = 0; i < 2; i++) {
            this.scoreLabels[i].text = g.teams[i].r.toString();
        }
        this.outLabel.text = g.outs + " out";
        var logStr = "Play ball!";
        if (g.getLastPlay()) {
            logStr = g.getLastPlay().getLog();
        }
        this.announcerLabel.text = logStr;
        for (var i = 1; i <= 3; i++) {
            if (g.bases[i]) {
                this.runnerLabels[i].visible = true;
                this.runnerLabels[i].text = g.bases[i].getName();
                this.runnerSprites[i].visible = true;
                this.runnerSprites[i].tint = offColour;
            }
            else {
                this.runnerLabels[i].visible = false;
                this.runnerSprites[i].visible = false;
            }
        }
        this.runnerSprites[0].tint = offColour;
        this.runnerSprites[4].tint = defColour;
        this.runnerLabels[0].text = g.getBatter().getName();
        this.runnerLabels[4].text = g.getPitcher().getName();
    };
    GameScreen.prototype.render = function () {
        this.game.debug.inputInfo(500, 500);
    };
    GameScreen.prototype.advanceGame = function () {
        var g = this.game.ballgame;
        g.advanceGame(null);
        this.updateStrings();
    };
    GameScreen.prototype.simGame = function () {
        var g = this.game.ballgame;
        while (g.status === 1) {
            g.advanceGame(null);
        }
        this.updateStrings();
    };
    GameScreen.prototype.quitGame = function () {
        this.game.ballgame = null;
        this.game.state.start("GameTitle");
    };
    return GameScreen;
}(Phaser.State));
var Animation = (function () {
    function Animation() {
    }
    return Animation;
}());
