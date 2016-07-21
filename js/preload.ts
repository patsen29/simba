
class Preload extends Phaser.State {
    game: PhaserGame;
    preload() {
        this.game.load.image("bg", "img/kauffman-n.jpg");
        this.game.load.image("scorepanel", "img/scorepanel.png");
        this.game.load.image("icon", "img/favicon.png");
        this.game.load.spritesheet('arrowbuttons', 'img/arrowbuttons.png', 39, 28);
        this.game.load.spritesheet('closeButton', 'img/close.png', 36, 36);
        this.game.load.spritesheet('buttons', 'img/buttons.png', 190, 45);
        this.game.load.spritesheet('barebar', 'img/barebar.png', 96, 16);
        
        this.game.load.json('teamData', 'data/teams2015.json');
    }
    create() {
        this.game.debug.text("In Preload", 10, 10);
        this.game.state.start("GameTitle");
        this.game.data = this.loadTeams();
    }
    loadTeams() {
        let dataIn = this.game.cache.getJSON("teamData");
        let data = new LeagueData();
        if (!dataIn.lgAvg) {
            throw "Failed to load data: no lgAvg";
        }
        data.lgAvg = {};
        for (let key in dataIn.lgAvg) {
            let ratio = Ratio.fromJson(dataIn.lgAvg[key]);
            ratio["id"] = key;
            data.lgAvg[key] = ratio;
        }

        // Load teams
        if (!dataIn.teams) {
            throw "Failed to load data: no teams";
        }
        data.teams = [];
        data.defaults = dataIn.defaults || [0, 1];
        for (let i = 0; i < dataIn.teams.length; i++) {
            let teamRaw = dataIn.teams[i];
            let lgAvg = data.lgAvg[teamRaw.lgAvg];
            if (!lgAvg) {
                throw "Failed to load data: team " + (teamRaw.abbr || i) + " has missing lgAvg " + teamRaw.lgAvg;
            }
            let team = new Team(teamRaw.city, teamRaw.nick, teamRaw.abbr, teamRaw.useDH, lgAvg);
            let teamId = teamRaw.lgAvg + teamRaw.abbr;
            data.teams.push(team);

            // Load players
            let playerMap = {};
            for (let playerId in teamRaw.roster) {
                let player = ratePlayer(teamRaw.roster[playerId], lgAvg);
                team.roster.push(player);
                playerMap[playerId] = player;
            }
            for (let j = 0; j < teamRaw.rotation.length; j++) {
                let pitcherId = teamRaw.rotation[j]
                team.staff.sp.push(playerMap[pitcherId]);
            }
            for (let j = 0; j < teamRaw.lineups.length; j++) {
                let lineup = new Lineup();
                for (let k = 0; k < teamRaw.lineups[j].length; k += 2) {
                    let playerId = teamRaw.lineups[j][k];
                    let player = playerMap[playerId];
                    if (playerId && !player) {
                        throw "Could not load lineup for " + (teamRaw.abbr || i) + ", missing player " + playerId;
                    }
                    lineup.add(player, teamRaw.lineups[j][k + 1]);
                }
                team.lineups.push(lineup);
            }
        }
        return data;
    }
}
