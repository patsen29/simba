class League {
    schedule: Schedule;
    teams: {[key: string]: Team} = {};
    lgAvg: {[key: string]: Ratio} = {};

    static fromJSON(dataIn) {
        let lg = new League();
        if (!dataIn.lgAvg) {
            throw "Failed to load data: no lgAvg";
        }
        for (let key in dataIn.lgAvg) {
            let lgAvg = LeagueAverage.fromJson(dataIn.lgAvg[key], key);
            lg.lgAvg[key] = lgAvg;
        }

        // Load teams
        if (!dataIn.teams) {
            throw "Failed to load data: no teams";
        }
        for (let key in dataIn.teams) {
            let teamRaw = dataIn.teams[key];
            let lgAvg = lg.lgAvg[teamRaw.lgAvg];
            if (!lgAvg) {
                throw "Failed to load data: team " + key + " has missing lgAvg " + teamRaw.lgAvg;
            }
            let team = new Team(key, teamRaw.city, teamRaw.nick, teamRaw.abbr, teamRaw.useDH, lgAvg);
            let teamId = teamRaw.lgAvg + teamRaw.abbr;
            lg.teams[key] = team;

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
                        throw "Could not load lineup for " + key + ", missing player " + playerId;
                    }
                    lineup.add(player, teamRaw.lineups[j][k + 1]);
                }
                team.lineups.push(lineup);
            }
        }
        
        // Load schedule
        if (dataIn.schedule) {
            lg.schedule = new Schedule();
            for (let i=0; i<dataIn.schedule.length; i++) {
                let dayObj = dataIn.schedule[i];
                let dateStr = dayObj.date;
                let dayNum = Date.parse(dateStr) / 86400000;
                let schDay = new ScheduleDay(dayNum, dateStr);
                for (let j=0; j<dayObj.games.length; j++) {
                    let gameObj = dayObj.games[j];
                    let scheduledGame = new ScheduledGame(gameObj.away, gameObj.home);
                    schDay.games.push(scheduledGame);
                }
                lg.schedule.days.push(schDay);
            }
        }
        
        console.log(lg);
        return lg;
    }

    importTeamFromDat(data: string[], nick: string, abbr: string) {
        let line = data[0];
        let lg = line[1];
        let year = +line.substring(10, 14);
        let city = line.substring(15, 26);
        let lgAvg = this.lgAvg[year.toString() + lg];
        let key = year + lg + abbr;
        let useDH = (lg === 'A' && year >= 1973);
        let team = new Team(key, city, nick, abbr, useDH, lgAvg);
        
        // TODO
        
        this.teams[key] = team;
    }

    
}

class Schedule {
    days: ScheduleDay[] = [];
    next: number = 0;

    static fromJSON(games: Object[]) {
        let sch = new Schedule();
        sch.next = 0;
        for (let i = 0; i < games.length; i++) {}
        return sch;
    }
}

class ScheduleDay {
    day: number;
    display: String;
    games: ScheduledGame[] = [];
    constructor(day: number, display: String) {
        this.day = day;
        this.display = display;
    }
}

class ScheduledGame {
    teams: [string, string];
    result: any;
    constructor(away: string, home: string) {
        this.teams = [away, home];
    }
}

function importSchedule(data: string[], year: number) {
    // incoming data is SBS raw, so lines of [mm/dd/yy], and team names (2015nSTL 2015nCHC)
    let sch = new Schedule();
    let schDay: ScheduleDay;
    for (let i = 0; i < data.length; i++) {
        let line = data[i];
        if (line[0] === "[") {
            let dateStr = year + "-" + line.substring(1, 3) + "-" + line.substring(4, 6);
            let dayNum = Date.parse(dateStr) / 86400000;
            schDay = new ScheduleDay(dayNum, dateStr);
            sch.days.push(schDay);
        }
        else {
            let teams = line.split(/ +/);
            let schGame = new ScheduledGame(teams[0], teams[1]);
            schDay.games.push(schGame);
        }
    }
    return sch;
}

/*
{
	"roster": {
		"reyesjo01~1": "32    06 Reyes, Jose       288  82  17   0   4  17I 38  34 S  13 16  2  69 069-6",
		"reverbe01~2": "27    07 Revere, Ben       226  72   9   1   1  13E 28  19 L   0  7  2  56 056-7 001-8",
		"donaljo02": "29    05 Donaldson, Josh   620 184  41   2  41  73E133 123 R  18  6  0 158 150-5 007-D",
	},
	"rotation": ["dicker.01", "estrama01", "buehrma01", "hutchdr01", "priceda01~2"],
	"lineups": [
		["reyesjo01~1", 6, "reverbe01~2", 7, "donaljo02", 5, "bautijo02", 9, "martiru01", 2, "smoakju01", 3, "pillake01", 8, "goinsry01", 4, null, 1],
		["reyesjo01~1", 6, "reverbe01~2", 7, "donaljo02", 5, "encared01", 10, "bautijo02", 9, "martiru01", 2, "pillake01", 8, "goinsry01", 4, "smoakju01", 3]
	]
}
*/
