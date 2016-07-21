var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameTitle = (function (_super) {
    __extends(GameTitle, _super);
    function GameTitle() {
        _super.apply(this, arguments);
    }
    GameTitle.prototype.preload = function () { };
    GameTitle.prototype.create = function () {
        this.game.stage.backgroundColor = '#0000ff';
        this.add.image(0, 0, "bg");
        var font = {
            font: "20px Arial",
            fill: "black",
            align: "center"
        };
        var exhGame = this.game.add.button(600, 250, 'buttons', this.startExhibitionGame, this, 0, 0, 1);
        var text = this.game.add.text(0, 0, "Exhibition game", font);
        text.x = Math.floor(600 + exhGame.width / 2);
        text.y = Math.floor(250 + exhGame.height / 2);
        text.anchor.set(0.5, 0.5);
    };
    GameTitle.prototype.startExhibitionGame = function () {
        this.game.state.start("CreateGame");
    };
    return GameTitle;
}(Phaser.State));
