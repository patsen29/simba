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
        // CLE 1 TOR 1 - Top 11th - 0 out
        // Runners 3rd, 2nd, 1st, batter, pitcher
        // Last play/announcer
        // CLE 1  Top 11 | Announcer goes here
        // TOR 1  0 out  | and here
        var game = this.game.ballgame;
        for (var i = 0; i < 2; i++) {
            var abbr = game.teams[i].ref.abbr;
            this.game.add.text(210, 10 + 40 * i, abbr, font);
            this.scoreLabels[i] = this.game.add.text(260, 10 + 40 * i, "0", font);
        }
        this.inningLabel = this.game.add.text(300, 10, "Top 1st", font);
        this.outLabel = this.game.add.text(300, 50, "0 out", font);
        this.announcerLabel = this.game.add.text(390, 10, "Play ball!", fontWrap);
        this.game.add.button(10, 560, 'arrowbuttons', this.advanceGame, this, 1, 1, 3);
        this.game.add.button(70, 560, 'arrowbuttons', this.simGame, this, 1, 1, 3);
    };
    GameScreen.prototype.updateStrings = function () {
        var g = this.game.ballgame;
        this.inningLabel.text = g.getInningString();
        for (var i = 0; i < 2; i++) {
            this.scoreLabels[i].text = "";
        }
        this.outLabel.text = g.outs + " out";
        this.announcerLabel.text = g.getLastPlay().getLog();
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
    return GameScreen;
}(Phaser.State));
var Animation = (function () {
    function Animation() {
    }
    return Animation;
}());
