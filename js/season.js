var League = (function () {
    function League() {
        this.teams = {};
        this.lgAvg = {};
    }
    League.fromJSON = function (dataIn) {
        var lg = new League();
        if (!dataIn.lgAvg) {
            throw "Failed to load data: no lgAvg";
        }
        for (var key in dataIn.lgAvg) {
            var lgAvg = LeagueAverage.fromJson(dataIn.lgAvg[key], key);
            lg.lgAvg[key] = lgAvg;
        }
        // Load teams
        if (!dataIn.teams) {
            throw "Failed to load data: no teams";
        }
        for (var key in dataIn.teams) {
            var teamRaw = dataIn.teams[key];
            var lgAvg = lg.lgAvg[teamRaw.lgAvg];
            if (!lgAvg) {
                throw "Failed to load data: team " + key + " has missing lgAvg " + teamRaw.lgAvg;
            }
            var team = new Team(key, teamRaw.city, teamRaw.nick, teamRaw.abbr, teamRaw.useDH, lgAvg);
            var teamId = teamRaw.lgAvg + teamRaw.abbr;
            lg.teams[key] = team;
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
            for (var i = 0; i < dataIn.schedule.length; i++) {
                var dayObj = dataIn.schedule[i];
                var dateStr = dayObj.date;
                var dayNum = Date.parse(dateStr) / 86400000;
                var schDay = new ScheduleDay(dayNum, dateStr);
                for (var j = 0; j < dayObj.games.length; j++) {
                    var gameObj = dayObj.games[j];
                    var scheduledGame = new ScheduledGame(gameObj.away, gameObj.home);
                    schDay.games.push(scheduledGame);
                }
                lg.schedule.days.push(schDay);
            }
        }
        console.log(lg);
        return lg;
    };
    League.prototype.importTeamFromDat = function (data, nick, abbr) {
        var line = data[0];
        var lg = line[1];
        var year = +line.substring(10, 14);
        var city = line.substring(15, 26);
        var lgAvg = this.lgAvg[year.toString() + lg];
        var key = year + lg + abbr;
        var useDH = (lg === 'A' && year >= 1973);
        var team = new Team(key, city, nick, abbr, useDH, lgAvg);
        // TODO
        this.teams[key] = team;
    };
    return League;
}());
var Schedule = (function () {
    function Schedule() {
        this.days = [];
        this.next = 0;
    }
    Schedule.fromJSON = function (games) {
        var sch = new Schedule();
        sch.next = 0;
        for (var i = 0; i < games.length; i++) { }
        return sch;
    };
    return Schedule;
}());
var ScheduleDay = (function () {
    function ScheduleDay(day, display) {
        this.games = [];
        this.day = day;
        this.display = display;
    }
    return ScheduleDay;
}());
var ScheduledGame = (function () {
    function ScheduledGame(away, home) {
        this.teams = [away, home];
    }
    return ScheduledGame;
}());
function importSchedule(data, year) {
    // incoming data is SBS raw, so lines of [mm/dd/yy], and team names (2015nSTL 2015nCHC)
    var sch = new Schedule();
    var schDay;
    for (var i = 0; i < data.length; i++) {
        var line = data[i];
        if (line[0] === "[") {
            var dateStr = year + "-" + line.substring(1, 3) + "-" + line.substring(4, 6);
            var dayNum = Date.parse(dateStr) / 86400000;
            schDay = new ScheduleDay(dayNum, dateStr);
            sch.days.push(schDay);
        }
        else {
            var teams = line.split(/ +/);
            var schGame = new ScheduledGame(teams[0], teams[1]);
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
