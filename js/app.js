/// <reference path="../lib/phaser.d.ts"/>
/// <reference path="sbs.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LeagueData = (function () {
    function LeagueData() {
    }
    return LeagueData;
}());
var PhaserGame = (function (_super) {
    __extends(PhaserGame, _super);
    function PhaserGame() {
        _super.call(this, 800, 600, Phaser.AUTO, "content");
        this.state.add('BootState', BootState);
        this.state.add('Preload', Preload);
        this.state.add('GameTitle', GameTitle);
        this.state.add('CreateGame', CreateGame);
        this.state.add('GameScreen', GameScreen);
        this.state.start('BootState');
    }
    return PhaserGame;
}(Phaser.Game));
var BootState = (function (_super) {
    __extends(BootState, _super);
    function BootState() {
        _super.apply(this, arguments);
    }
    BootState.prototype.preload = function () { };
    BootState.prototype.create = function () {
        this.game.debug.text("In BootState", 10, 10);
        this.game.state.start("Preload");
    };
    return BootState;
}(Phaser.State));
window.onload = function () {
    window["GAME"] = new PhaserGame();
};
// Screen is 800x600, assume 20px tiles, so 40x30. 
