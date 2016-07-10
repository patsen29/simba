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
    };
    GameScreen.prototype.create = function () {
        var font = { font: "20px Arial", fill: "#000000" };
        var fontWrap = {
            font: "18px Arial",
            fill: "black",
            align: 'left',
            wordWrap: true,
            wordWrapWidth: 200
        };
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
        this.batterLabel = this.game.add.text(10, 300, "", font);
        this.pitcherLabel = this.game.add.text(10, 330, "", font);
        for (var i = 1; i <= 3; i++) {
            this.runnerLabels[i] = this.game.add.text(10, 330 + i * 30, "R", font);
        }
        this.game.add.button(10, 560, 'arrowbuttons', this.advanceGame, this, 1, 1, 3);
        this.game.add.button(70, 560, 'arrowbuttons', this.simGame, this, 1, 1, 3);
        this.game.add.button(750, 10, 'closeButton', this.quitGame, this, 0, 0, 0);
        this.updateStrings();
    };
    GameScreen.prototype.updateStrings = function () {
        var g = this.game.ballgame;
        var innStr = (g.innTop ? "Top" : "Bot") + " " + g.inning;
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
        this.batterLabel.text = "Batting: " + g.getBatter().getName();
        this.pitcherLabel.text = "Pitching: " + g.getPitcher().getName();
        for (var i = 1; i <= 3; i++) {
            var text = "";
            if (g.bases[i]) {
                text = g.bases[i].getName();
            }
            this.runnerLabels[i].text = toOrdinal(i) + ": " + text;
        }
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
