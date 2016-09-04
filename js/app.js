/// <reference path="angular/angular.d.ts" />
var app = angular.module('simba', []);
var PendingTeam = (function () {
    function PendingTeam(label) {
        this.label = label;
    }
    return PendingTeam;
}());
var PendingGame = (function () {
    function PendingGame(teamsRef) {
        this.teams = [new PendingTeam("Away"), new PendingTeam("Home")];
        this.teamsRef = teamsRef;
    }
    return PendingGame;
}());
function formatIP(ipo) {
    var int = Math.floor(ipo / 3);
    var frac = ipo - 3 * int;
    return int + "." + frac;
}
var UIController = (function () {
    function UIController($scope, $http) {
        this.$scope = $scope;
        this.tab = "loading";
        var file = "data/teams2015.json";
        // let file = "data/test.json";
        $http.get(file).then(function (response) {
            $scope.data = League.fromJSON(response.data);
        });
        this.tab = "main";
    }
    UIController.prototype.switchTab = function (tab) {
        this.tab = tab;
    };
    UIController.prototype.isTab = function (tab) {
        return this.tab === tab;
    };
    UIController.prototype.showTeam = function (key) {
        var data = this.$scope.data;
        var teamData = data.teams[key];
        if (!teamData) {
            console.warn("Could not showTeam " + key);
            return;
        }
        this.$scope.teamData = teamData;
        this.tab = "viewteam";
    };
    UIController.prototype.createGame = function () {
        this.pendingGame = new PendingGame(this.$scope.data.teams);
        this.tab = "startgame";
    };
    // This should probably be in a new controller
    UIController.prototype.setTeam = function (pendingTeam) {
        var teamsRef = this.pendingGame.teamsRef;
        var team = teamsRef[pendingTeam.selected];
        // TODO: Handle multiple leagues/years?
        if (team) {
            pendingTeam.team = team;
            if (pendingTeam.label === "Home") {
                this.pendingGame.useDH = team.useDH;
            }
        }
        else {
            console.warn("Could not set team " + pendingTeam.selected);
        }
    };
    UIController.prototype.clearTeam = function (pendingTeam) {
        pendingTeam.team = null;
    };
    UIController.prototype.startGame = function (pendingGame) {
        var teams = pendingGame.teams;
        var game = new Game(teams[0].team, teams[1].team);
        var useDH = pendingGame.useDH;
        for (var i = 0; i < 2; i++) {
            var team = teams[i].team;
            if (!team) {
                return false;
            }
            var starter = 0; // TODO: Select starter
            var pitcher = team.staff.sp[starter];
            // TODO: Let player select lineups
            var lineup = team.lineups[useDH ? 1 : 0];
            var teamState = game.teams[i];
            teamState.manager = null; // TODO: Allow human players.
            for (var j = 0; j < lineup.size(); j++) {
                var pos = lineup.getPos(j);
                if (pos === 1) {
                    game.setLineup(teamState, j, pitcher, 1);
                }
                else {
                    game.setLineup(teamState, j, lineup.getPlayer(j), pos);
                }
            }
            if (useDH) {
                game.setLineup(teamState, 9, pitcher, 1);
            }
        }
        game.startGame();
        this.game = game;
        console.log(game);
        this.tab = "gamescreen";
        this.gameTab = 1;
    };
    // This should be in a new InGameController
    UIController.prototype.getName = function (player, type) {
        if (!player) {
            return null; // Intended to or with a default.
        }
        return player.getName(type);
    };
    UIController.prototype.getLastPlay = function (g) {
        if (g) {
            var last = g.getLastPlay();
            if (last) {
                return last.getLog();
            }
        }
        return null;
    };
    UIController.prototype.advanceGame = function (g, command) {
        g.advanceGame(command || "");
    };
    UIController.prototype.simGame = function (g) {
        while (g.status === 1) {
            g.advanceGame(null);
        }
    };
    UIController.prototype.generateBoxScore = function (g) {
        if (!g) {
            return null;
        }
        var lines = [];
        // Linescore header
        var line = pad(g.getInningString(), "              ", true);
        for (var i = 1; i <= g.inning || i <= 9; i++) {
            line += pad(i, "   ");
        }
        line += "   R  H  E";
        lines.push(line);
        // Linescore teams
        for (var i = 0; i < 2; i++) {
            var team = g.teams[i];
            line = pad(team.ref.nick, "              ", true);
            for (var j = 1; j <= g.inning || j <= 9; j++) {
                var display = (j < g.inning) || (j == g.inning && (i == 0 || !g.innTop));
                if (display) {
                    line += pad(team.linescore[j] || 0, "   ");
                }
                else if (g.status >= 2) {
                    line += "  X";
                }
                else {
                    line += "   ";
                }
            }
            line += pad(team.r, "    ");
            line += pad(team.h, "   ");
            line += pad(team.e, "   ");
            lines.push(line);
        }
        // Batting part of box score
        var batLines = [], pitLines = [];
        for (var i = 0; i < 2; i++) {
            var team = g.teams[i];
            batLines[i] = [pad(team.ref.nick, "                  ", true) + " AB  R  H BI BB SO"];
            pitLines[i] = [pad(team.ref.nick, "                  ", true) + " IP  H  R ER BB SO"];
            for (var j = 0; j < team.boxscore.length; j++) {
                var entry = team.boxscore[j];
                if (entry.slot < 9) {
                    line = pad(entry.getName(true), "                  ", true);
                    line += pad(entry.getStat("bAB"), "   ");
                    line += pad(entry.getStat("bR"), "   ");
                    line += pad(entry.getStat("bH"), "   ");
                    line += pad(entry.getStat("bRBI"), "   ");
                    line += pad(entry.getStat("bBB"), "   ");
                    line += pad(entry.getStat("bSO"), "   ");
                    batLines[i].push(line);
                }
                if (entry.posList.indexOf(1) > -1) {
                    line = pad(entry.getName(false), "                 ", true);
                    var ip = formatIP(entry.getStat("pIPO"));
                    line += pad(ip, "    ");
                    line += pad(entry.getStat("pH"), "   ");
                    line += pad(entry.getStat("pR"), "   ");
                    line += pad(entry.getStat("pER"), "   ");
                    line += pad(entry.getStat("pBB"), "   ");
                    line += pad(entry.getStat("pSO"), "   ");
                    pitLines[i].push(line);
                }
            }
        }
        // Bat lines to main box            
        lines.push("");
        var n = Math.max(batLines[0].length, batLines[1].length);
        for (var j = 0; j < n; j++) {
            var line0 = batLines[0][j] || "";
            var line1 = batLines[1][j] || "";
            line = pad(line0, "                                        ", true) + line1;
            lines.push(line);
        }
        // Pit lines to main box
        lines.push("");
        n = Math.max(pitLines[0].length, pitLines[1].length);
        for (var j = 0; j < n; j++) {
            var line0 = pitLines[0][j] || "";
            var line1 = pitLines[1][j] || "";
            line = pad(line0, "                                        ", true) + line1;
            lines.push(line);
        }
        return lines.join("\n");
    };
    return UIController;
}());
var ImportController = (function () {
    function ImportController() {
    }
    return ImportController;
}());
app.controller('UIController', UIController);
app.controller('ImportController', ImportController);
