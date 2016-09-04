/// <reference path="angular/angular.d.ts" />

let app = angular.module('simba', []);

class PendingTeam {
    team: Team;
    label: string;
    selected: string;
    constructor(label: string) {
        this.label = label;
    }
    // TODO: starter, lineup
}

class PendingGame {
    teams: PendingTeam[]
    teamsRef: Team[];
    useDH: boolean;
    constructor(teamsRef: Team[]) {
        this.teams = [new PendingTeam("Away"), new PendingTeam("Home")];
        this.teamsRef = teamsRef;
    }
}

function formatIP(ipo) {
    let int = Math.floor(ipo / 3);
    let frac = ipo - 3 * int;
    return int + "." + frac;
}

class UIController {
    tab: String;
    pendingGame: PendingGame;
    $scope;
    // game vars
    game: Game;
    gameTab: number; // not ideal

    constructor($scope, $http) {
        this.$scope = $scope;
        this.tab = "loading";
        let file = "data/teams2015.json";
        // let file = "data/test.json";
        $http.get(file).then(function(response) {
            $scope.data = League.fromJSON(response.data);
        });
        this.tab = "main";
    }
    switchTab(tab) {
        this.tab = tab;
    }
    isTab(tab) {
        return this.tab === tab;
    }
    showTeam(key: string) {
        let data = this.$scope.data;
        let teamData = data.teams[key];
        if (!teamData) {
            console.warn("Could not showTeam " + key);
            return;
        }
        this.$scope.teamData = teamData;
        this.tab = "viewteam";
    }
    createGame() {
        this.pendingGame = new PendingGame(this.$scope.data.teams);
        this.tab = "startgame";
    }
    
    // This should probably be in a new controller
    setTeam(pendingTeam: PendingTeam) {
        let teamsRef = this.pendingGame.teamsRef;
        let team = teamsRef[pendingTeam.selected];
        // TODO: Handle multiple leagues/years?
        if (team) {
            pendingTeam.team = team;
            if (pendingTeam.label === "Home") {
                this.pendingGame.useDH = team.useDH;
            }
            // TODO: Starter and lineups
        } else {
            console.warn("Could not set team " + pendingTeam.selected);
        }
    }
    clearTeam(pendingTeam: PendingTeam) {
        pendingTeam.team = null;
    }
    startGame(pendingGame: PendingGame) {
        let teams = pendingGame.teams;
        let game = new Game(teams[0].team, teams[1].team);
        let useDH = pendingGame.useDH;
        
        for (let i = 0; i < 2; i++) {
            let team = teams[i].team;
            if (!team) {
                return false;
            }
            let starter = 0; // TODO: Select starter
            let pitcher = team.staff.sp[starter];
            // TODO: Let player select lineups
            let lineup = team.lineups[useDH ? 1 : 0];
            let teamState = game.teams[i];
            teamState.manager = null; // TODO: Allow human players.
            for (let j = 0; j < lineup.size(); j++) {
                let pos = lineup.getPos(j);
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
    }
    
    // This should be in a new InGameController
    getName(player: Player, type?: number) {
        if (!player) {
            return null; // Intended to or with a default.
        }
        return player.getName(type);
    }
    getLastPlay(g: Game) {
        if (g) {
            let last = g.getLastPlay();
            if (last) {
                return last.getLog();
            } 
        }
        return null;
    }
    advanceGame(g: Game, command: string) {
		g.advanceGame(command || "");
	}
    simGame(g: Game) {
		while (g.status === 1) {
			g.advanceGame(null);
		}
    }
    generateBoxScore(g: Game) {
        if (!g) {
            return null;
        }
        let lines = [];

        // Linescore header
        let line = pad(g.getInningString(), "              ", true)
        for (let i = 1; i <= g.inning || i <= 9; i++) {
            line += pad(i, "   ");
        }
        line += "   R  H  E";
        lines.push(line);
        
        // Linescore teams
        for (let i = 0; i < 2; i++) {
            let team = g.teams[i];
			line = pad(team.ref.nick, "              ", true)
			for (let j = 1; j <= g.inning || j <= 9; j++) {
				let display = (j < g.inning) || (j == g.inning && (i == 0 || !g.innTop));
				if (display) {
					line += pad(team.linescore[j] || 0, "   ");
				} else if (g.status >= 2) {
					line += "  X";
				} else {
					line += "   ";
				}
			}
			line += pad(team.r, "    ");
			line += pad(team.h, "   ");
			line += pad(team.e, "   ");
			lines.push(line);
        }
        
        // Batting part of box score
        let batLines = [], pitLines = [];
        for (let i = 0; i < 2; i++) {
            let team = g.teams[i];
            batLines[i] = [pad(team.ref.nick, "                  ", true) + " AB  R  H BI BB SO"];
            pitLines[i] = [pad(team.ref.nick, "                  ", true) + " IP  H  R ER BB SO"];

            for (let j = 0; j < team.boxscore.length; j++) {
                var entry = team.boxscore[j];
                if (entry.slot < 9) { // TODO: Sort by slot, indent
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
                    let ip = formatIP(entry.getStat("pIPO"));
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
        let n = Math.max(batLines[0].length, batLines[1].length);
        for (let j = 0; j < n; j++) {
            let line0 = batLines[0][j] || "";
            let line1 = batLines[1][j] || "";
            line = pad(line0, "                                        ", true) + line1
            lines.push(line);
        }
        
        // Pit lines to main box
        lines.push("");
        n = Math.max(pitLines[0].length, pitLines[1].length);
        for (let j = 0; j < n; j++) {
            let line0 = pitLines[0][j] || "";
            let line1 = pitLines[1][j] || "";
            line = pad(line0, "                                        ", true) + line1
            lines.push(line);
        }

        return lines.join("\n");
    }
    
}

class ImportController {
    
}

app.controller('UIController', UIController);
app.controller('ImportController', ImportController);
