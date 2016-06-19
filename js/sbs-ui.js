/// <reference path="sbs.ts" />
$(document).ready(function () {
    jQuery.get("data/teams.json").done(function (data) {
        loadData(data);
        populateDropdowns();
    }).fail(function () {
        throw "Failed to load data.";
    });
    $("button.start-game").click(function () {
        console.log("Start game");
        var teams = [];
        teams[0] = DATA.teams[$("select#select-team-0").val()];
        teams[1] = DATA.teams[$("select#select-team-1").val()];
        if (!teams[0] || !teams[1]) {
            throw "Could not start game due to missing team";
        }
        var game = new Game(teams[0], teams[1]);
        DATA.game = game;
        var useDH = teams[1].useDH; // TODO: Let user pick DH rule?
        var starterSlot = Math.floor(Math.random() * 4.8); // TODO: Let user select starter
        for (var i = 0; i < 2; i++) {
            var pitcher = teams[i].staff.sp[starterSlot];
            // TODO: Let player select lineups
            var lineup = teams[i].lineups[useDH ? 1 : 0];
            var teamState = game.teams[i];
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
        updateGame(game);
        $('li a[href="#game"]').tab('show');
    });
    $("button.advance-game").click(function () {
        var game = DATA.game;
        if (game && game.status === 1) {
            game.advanceGame();
            updateGame(game);
        }
        else {
            throw "No game in progress";
        }
    });
    $("button.sim-game").click(function () {
        var game = DATA.game;
        if (game && game.status === 1) {
            while (game.status === 1) {
                game.advanceGame();
            }
            updateGame(game);
        }
        else {
            throw "No game in progress";
        }
    });
    $('a[data-toggle="tab"][href="#boxscore"]').on('shown.bs.tab', function (e) {
        updateBoxScore(DATA.game);
    });
    $('a[data-toggle="tab"][href="#gamelog"]').on('shown.bs.tab', function (e) {
        updateGameLog(DATA.game);
    });
});
function loadData(dataIn) {
    // load lg averages
    if (!dataIn.lgAvg) {
        throw "Failed to load data: no lgAvg";
    }
    DATA.lgAvg = {};
    for (var key in dataIn.lgAvg) {
        var ratio = Ratio.fromJson(dataIn.lgAvg[key]);
        ratio["id"] = key;
        DATA.lgAvg[key] = ratio;
    }
    // Load teams
    if (!dataIn.teams) {
        throw "Failed to load data: no teams";
    }
    DATA.teams = {};
    DATA.defaults = dataIn.defaults || ["", ""];
    for (var i = 0; i < dataIn.teams.length; i++) {
        var teamRaw = dataIn.teams[i];
        var lgAvg = DATA.lgAvg[teamRaw.lgAvg];
        if (!lgAvg) {
            throw "Failed to load data: team " + (teamRaw.abbr || i) + " has missing lgAvg " + teamRaw.lgAvg;
        }
        var team = new Team(teamRaw.city, teamRaw.nick, teamRaw.abbr, teamRaw.useDH, lgAvg);
        var teamId = teamRaw.lgAvg + teamRaw.abbr;
        if (DATA.teams[teamId]) {
            throw "Trying to add team " + (teamRaw.abbr || i) + ", but it is already there.";
        }
        DATA.teams[teamId] = team;
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
    console.log("Done loading data");
}
function populateDropdowns() {
    var teamSelects = $("select.select-team");
    teamSelects.empty();
    teamSelects.append("<option></option>");
    for (var teamId in DATA.teams) {
        var team = DATA.teams[teamId];
        teamSelects.append("<option value='" + teamId + "'>" + team.city + " " + team.nick + "</option>");
    }
    $("select#select-team-0").val(DATA.defaults[0]);
    $("select#select-team-1").val(DATA.defaults[1]);
}
function updateGame(game) {
    var innStr = game.getInningString();
    var score = game.teams[0].ref.abbr + " " + game.teams[0].r +
        " " + game.teams[1].ref.abbr + " " + game.teams[1].r;
    $("span.score").text(score);
    $("span.inning").text(innStr);
    $("span.outs").text(game.outs.toString());
    $("span.run3").text(getName(game.bases[3]));
    $("span.run2").text(getName(game.bases[2]));
    $("span.run1").text(getName(game.bases[1]));
    $("span.batter").text(getName(game.getBatter()));
    $("span.pitcher").text(getName(game.getPitcher()));
    var lastPlay = game.getLastPlay();
    var lastPlayString = (lastPlay ? lastPlay.getLog() : "...");
    $("span.last-play").text(lastPlayString);
}
function updateBoxScore(game) {
    var div = $("div.boxscore-panel").empty();
    if (!game) {
        div.text("No game in progress");
        return;
    }
    // Create line score
    var table = $("<table/>").addClass("table table-bordered");
    div.append(table);
    // Header row for line score
    var tr = $("<tr/>");
    tr.append("<th>" + game.getInningString() + "</th>");
    var numInn = Math.max(game.regInnings, game.inning);
    for (var i = 1; i <= numInn; i++) {
        tr.append("<th>" + i + "</th>");
    }
    tr.append("<th>R</th>");
    tr.append("<th>H</th>");
    tr.append("<th>E</th>");
    table.append(tr);
    // Create the box score
    var divRow = $("<div/>").addClass("row");
    div.append(divRow);
    // Team-specific rows
    for (var tm = 0; tm < 2; tm++) {
        var team = game.teams[tm];
        // Entries for line score
        tr = $("<tr/>");
        tr.append("<td>" + team.ref.nick + "</td>");
        for (var i = 1; i <= numInn; i++) {
            var runsInn = "";
            if (i < game.inning) {
                runsInn = team.getLineScore(i).toString();
            }
            else if (i === game.inning && (!game.innTop || tm === 0)) {
                runsInn = team.getLineScore(i).toString();
            }
            else if (i === game.inning && game.status === 2) {
                runsInn = "X";
            }
            tr.append("<td>" + runsInn + "</td>");
        }
        tr.append("<td>" + team.r + "</td>");
        tr.append("<td>" + team.h + "</td>");
        tr.append("<td>" + team.e + "</td>");
        table.append(tr);
        // Box score entries
        var teamCol = $("<div/>").addClass("col-md-6");
        divRow.append(teamCol);
        // Box score batters
        var boxBat = $("<table/>").addClass("table")
            .append("<tr><th>" + team.ref.nick + "</th><th>AB</th><th>R</th><th>H</th><th>RBI</th><th>BB</th><th>SO</th></tr>");
        teamCol.append(boxBat);
        // Box score pitcher
        var boxPit = $("<table/>").addClass("table")
            .append("<tr><th>Pitchers</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>SO</th></tr>");
        teamCol.append(boxPit);
        for (var j = 0; j < team.boxscore.length; j++) {
            var entry = team.boxscore[j];
            if (entry.slot < 9) {
                boxBat.append($("<tr/>")
                    .append($("<td/>").text(entry.getName()))
                    .append($("<td/>").text(entry.getStat("bAB")))
                    .append($("<td/>").text(entry.getStat("bR")))
                    .append($("<td/>").text(entry.getStat("bH")))
                    .append($("<td/>").text(entry.getStat("bRBI")))
                    .append($("<td/>").text(entry.getStat("bBB")))
                    .append($("<td/>").text(entry.getStat("bSO"))));
            }
            if (entry.posList.indexOf(1) > -1) {
                boxPit.append($("<tr/>")
                    .append($("<td/>").text(entry.player.getName()))
                    .append($("<td/>").text(FormatUtils.formatIP(entry.getStat("pIPO"))))
                    .append($("<td/>").text(entry.getStat("pH")))
                    .append($("<td/>").text(entry.getStat("pR")))
                    .append($("<td/>").text(entry.getStat("pER")))
                    .append($("<td/>").text(entry.getStat("pBB")))
                    .append($("<td/>").text(entry.getStat("pSO"))));
            }
        }
    }
}
var FormatUtils = (function () {
    function FormatUtils() {
    }
    FormatUtils.formatIP = function (ipo) {
        var int = Math.floor(ipo / 3);
        var frac = ipo - 3 * int;
        return int + "." + frac;
    };
    return FormatUtils;
}());
function updateGameLog(game) {
    // TODO: Do we need to rebuild from scratch each time?
    // Try to keep an 'update from' number, and only clear if it's 0/start.
    var logDiv = $("div.gamelog-panel").empty();
    if (!game) {
        logDiv.text("No game in progress");
        return;
    }
    var playLog = game.playLog;
    for (var i = 0; i < playLog.length; i++) {
        var element = void 0, logEntry = playLog[i];
        if (logEntry.type === 'inning') {
            element = $("<div/>");
        }
        else {
            element = $("<span/>");
        }
        element.addClass(logEntry.type).text(logEntry.getLog());
        logDiv.append(element);
    }
}
