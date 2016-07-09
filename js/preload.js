var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Preload = (function (_super) {
    __extends(Preload, _super);
    function Preload() {
        _super.apply(this, arguments);
    }
    Preload.prototype.preload = function () {
        this.game.load.image("bg", "img/kauffman-n.jpg");
        this.game.load.image("scorepanel", "img/scorepanel.png");
        this.game.load.spritesheet('arrowbuttons', 'img/arrowbuttons.png', 39, 28);
        this.game.load.spritesheet('closeButton', 'img/close.png', 36, 36);
        this.game.load.json('teamData', 'data/teams2015.json');
    };
    Preload.prototype.create = function () {
        this.game.debug.text("In Preload", 10, 10);
        this.game.state.start("GameTitle");
        this.game.data = this.loadTeams();
    };
    Preload.prototype.loadTeams = function () {
        var dataIn = this.game.cache.getJSON("teamData");
        var data = new LeagueData();
        if (!dataIn.lgAvg) {
            throw "Failed to load data: no lgAvg";
        }
        data.lgAvg = {};
        for (var key in dataIn.lgAvg) {
            var ratio = Ratio.fromJson(dataIn.lgAvg[key]);
            ratio["id"] = key;
            data.lgAvg[key] = ratio;
        }
        // Load teams
        if (!dataIn.teams) {
            throw "Failed to load data: no teams";
        }
        data.teams = [];
        data.defaults = dataIn.defaults || [0, 1];
        for (var i = 0; i < dataIn.teams.length; i++) {
            var teamRaw = dataIn.teams[i];
            var lgAvg = data.lgAvg[teamRaw.lgAvg];
            if (!lgAvg) {
                throw "Failed to load data: team " + (teamRaw.abbr || i) + " has missing lgAvg " + teamRaw.lgAvg;
            }
            var team = new Team(teamRaw.city, teamRaw.nick, teamRaw.abbr, teamRaw.useDH, lgAvg);
            var teamId = teamRaw.lgAvg + teamRaw.abbr;
            data.teams.push(team);
            // Load players
            var playerMap = {};
            for (var playerId in teamRaw.roster) {
                var player = ratePlayer(teamRaw.roster[playerId], lgAvg);
                team.roster.push(player);
                playerMap[playerId] = player;
            }
            for (var j = 0; j < teamRaw.rotation.length; j++) {
                var pitcherId = teamRaw.rotation[j];
                team.staff.sp.push(playerMap[pitcherId]);
            }
            for (var j = 0; j < teamRaw.lineups.length; j++) {
                var lineup = new Lineup();
                for (var k = 0; k < teamRaw.lineups[j].length; k += 2) {
                    var playerId = teamRaw.lineups[j][k];
                    var player = playerMap[playerId];
                    if (playerId && !player) {
                        throw "Could not load lineup for " + (teamRaw.abbr || i) + ", missing player " + playerId;
                    }
                    lineup.add(player, teamRaw.lineups[j][k + 1]);
                }
                team.lineups.push(lineup);
            }
        }
        return data;
    };
    return Preload;
}(Phaser.State));
