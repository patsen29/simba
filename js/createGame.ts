class CreateGame extends Phaser.State {
    game: PhaserGame;
    teamIds: number[];
    starters: number[];
    labels: Phaser.Text[];
    preload() {
        this.teamIds = this.game.data.defaults.slice();
        this.starters = [0, 0];
        this.labels = [];
    }
    create() {
        this.game.stage.backgroundColor = '#0000ff';

        let font = {
            font: "20px Arial",
            fill: "#ffffff"
        };

        this.labels[0] = this.game.add.text(10, 100, "", font);
        this.labels[1] = this.game.add.text(10, 150, "", font);

        this.labels[2] = this.game.add.text(410, 100, "", font);
        this.labels[3] = this.game.add.text(410, 150, "", font);
        
        this.game.add.button(200, 90, 'arrowbuttons', function() {
            this.changeTeam(0);
        }, this, 1, 1, 3);
        this.game.add.button(200, 140, 'arrowbuttons', function() {
            this.changePitcher(0);
        }, this, 1, 1, 3);
        
        this.game.add.button(600, 90, 'arrowbuttons', function() {
            this.changeTeam(1);
        }, this, 1, 1, 3);
        this.game.add.button(600, 140, 'arrowbuttons', function() {
            this.changePitcher(1);
        }, this, 1, 1, 3);
        
        this.labels[4] = this.game.add.text(200, 200, "Start game", font);
        this.labels[4].inputEnabled = true;
        this.labels[4].events.onInputDown.add(this.startGame, this);
        this.updateStrings();
    }
    getTeam(id: number) {
        let teamId = this.teamIds[id];
        return this.game.data.teams[teamId];
    }
    changeTeam(id: number) {
        let numTeams = this.game.data.teams.length;
        this.teamIds[id] = (this.teamIds[id] + 1) % numTeams;
        if (this.teamIds[id] === this.teamIds[1 - id]) {
            this.teamIds[id] = (this.teamIds[id] + 1) % numTeams;
        }
        this.updateStrings();
    }
    changePitcher(id: number) {
        const numStarters = 5;
        this.starters[id] = (this.starters[id] + 1) % numStarters;
        this.updateStrings();
    }
    updateStrings() {
        let team = this.getTeam(0);
        let pitcher = team.staff.sp[this.starters[0]];
        this.labels[0].setText(team.city + " " + team.nick);
        this.labels[1].setText((this.starters[0] + 1) + ". " + pitcher.getName(2));

        team = this.getTeam(1);
        pitcher = team.staff.sp[this.starters[1]];
        this.labels[2].setText(team.city + " " + team.nick);
        this.labels[3].setText((this.starters[1] + 1) + ". " + pitcher.getName(2));
    }
    startGame() {
        let teams = [];
        teams[0] = this.getTeam(0);
        teams[1] = this.getTeam(1);
        let game = new Game(teams[0], teams[1]);
        let useDH = this.getTeam(1).useDH; // TODO: Let user pick DH rule.
        for (let i = 0; i < 2; i++) {
            let pitcher = teams[i].staff.sp[this.starters[i]];
            // TODO: Let player select lineups
            let lineup = teams[i].lineups[useDH ? 1 : 0];
            let teamState = game.teams[i];
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
        this.game.ballgame = game;
        this.game.state.start("GameScreen");
    }
}
