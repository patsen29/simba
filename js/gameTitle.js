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
        //this.add.image(0, 0, "bg");
        this.game.debug.text("In GameTitle", 10, 10);
        var font = {
            font: "20px Arial",
            fill: "#ffffff"
        };
        var text = this.game.add.text(10, 100, "Exhibition game", font);
        text.inputEnabled = true;
        text.events.onInputDown.add(this.startExhibitionGame, this);
    };
    GameTitle.prototype.startExhibitionGame = function () {
        this.game.state.start("CreateGame");
    };
    return GameTitle;
}(Phaser.State));
