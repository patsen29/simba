/// <reference path="jquery.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var POS_LABELS = ["-", "P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "PH", "PR"];
var DATA = {};
var Dice = (function () {
    function Dice() {
    }
    Dice.prototype.roll = function (sides) {
        if (!sides) {
            return Math.random();
        }
        return Math.floor(Math.random() * sides) + 1;
    };
    return Dice;
}());
var StackedDice = (function (_super) {
    __extends(StackedDice, _super);
    function StackedDice() {
        _super.call(this);
        this.stacked = [];
    }
    StackedDice.prototype.stack = function (roll) {
        this.stacked.push(roll);
    };
    StackedDice.prototype.roll = function (sides) {
        if (this.stacked.length === 0) {
            throw new Error("StackedDice has no results left");
        }
        return this.stacked.shift();
    };
    return StackedDice;
}(Dice));
var Player = (function () {
    function Player() {
        this.stats = {};
    }
    Player.prototype.getName = function (type) {
        if (!type) {
            return this.last;
        }
        else if (type === -1) {
            return this.last + ", " + this.first[0] + ".";
        }
        else if (type < -1) {
            return this.last + ", " + this.first;
        }
        else if (type === 1) {
            return this.first[0] + ". " + this.last;
        }
        else {
            return this.first + " " + this.last;
        }
    };
    Player.prototype.toString = function () {
        return "[" + this.getName(1) + " " + POS_LABELS[this.pos] + "]";
    };
    return Player;
}());
var Ratio = (function () {
    function Ratio(old) {
        if (old) {
            this.bb = old.bb;
            this.so = old.so;
            this.hr = old.hr;
            this.h = old.h;
            this.xb = old.xb;
            this.tr = old.tr;
            this.sba = old.sba;
            this.gb = old.gb;
        }
    }
    Ratio.fromJson = function (json) {
        var r = new Ratio();
        r.bb = json.bb;
        r.so = json.so;
        r.hr = json.hr;
        r.h = json.h;
        r.xb = json.xb;
        r.tr = json.tr;
        r.sba = json.sba;
        r.gb = json.gb;
        return r;
    };
    Ratio.prototype.multiply = function (by) {
        this.bb *= by.bb;
        this.so *= by.so;
        this.hr *= by.hr;
        this.h *= by.h;
        this.xb *= by.xb;
        this.tr *= by.tr;
        this.sba *= by.sba;
        this.gb *= by.gb;
        return this;
    };
    Ratio.prototype.toMatchup = function () {
        var matchup = new Matchup();
        var high = 1;
        var bb = this.bb / (1 + this.bb);
        high = high - bb;
        matchup.bb = high;
        var so = this.so / (1 + this.so) * high;
        high = high - so;
        matchup.so = high;
        var hr = this.hr / (1 + this.hr) * high;
        high = high - hr;
        matchup.hr = high;
        var h = this.h / (1 + this.h) * high;
        var low = high - h;
        var xb = this.xb / (1 + this.xb) * (high - low);
        high = low + xb;
        matchup.si = high;
        var tr = this.tr / (1 + this.tr) * (high - low);
        matchup.db = low + tr;
        matchup.tr = low;
        var gb = this.gb / (1 + this.gb) * low;
        matchup.gb = low - gb;
        return matchup;
    };
    return Ratio;
}());
var Matchup = (function () {
    function Matchup() {
    }
    return Matchup;
}());
// Turns raw batting stats into ratios. If given lgAvg, will return multipliers.
function calcBatRatios(bat, lgAvg) {
    var ab = bat.ab;
    var h = bat.h;
    var db = bat.db;
    var tr = bat.tr;
    var hr = bat.hr;
    var bb = bat.bb;
    var so = bat.so;
    var sb = bat.sb;
    var si = h - db - tr - hr;
    var ratios = new Ratio();
    ratios.bb = bb / ab;
    ratios.so = so / (ab - so);
    ratios.hr = hr / (ab - so - hr);
    ratios.h = (h - hr) / (ab - so - h);
    ratios.xb = (db + tr) / si;
    ratios.tr = tr / db;
    ratios.sba = sb / (.8 * si + .6 * bb);
    ratios.gb = 1;
    if (lgAvg) {
        ratios.bb /= lgAvg.bb;
        ratios.so /= lgAvg.so;
        ratios.hr /= lgAvg.hr;
        ratios.h /= lgAvg.h;
        ratios.xb /= lgAvg.xb;
        ratios.tr /= lgAvg.tr;
        ratios.sba /= lgAvg.sba;
    }
    return ratios;
}
// Turns raw pitching stats into ratios. If given lgAvg, will return multipliers.
function calcPitRatios(stats, lgAvg) {
    var ip = stats.ip;
    var h = stats.h;
    var hr = stats.hr;
    var bb = stats.bb;
    var so = stats.so;
    var bfp = stats.bfp || (2.94 * ip + h + bb);
    var ab = bfp - bb;
    var ratios = new Ratio();
    ratios.bb = bb / ab;
    ratios.so = so / (ab - so);
    ratios.hr = hr / (ab - so - hr);
    ratios.h = (h - hr) / (ab - so - hr);
    ratios.xb = 1;
    ratios.tr = 1;
    ratios.sba = 1;
    ratios.gb = 1;
    if (lgAvg) {
        ratios.bb /= lgAvg.bb;
        ratios.so /= lgAvg.so;
        ratios.hr /= lgAvg.hr;
        ratios.h /= lgAvg.h;
    }
    return ratios;
}
function ratePlayer(line, lgAvg) {
    var p = new Player();
    p.pos = +line.substring(6, 8);
    var name = line.substring(9, 27).trim().split(",");
    p.last = name[0].trim();
    p.first = (name[1] || "").trim();
    if (p.pos === 1) {
        var ip = +line.substring(27, 30);
        var h = +line.substring(31, 34);
        var hr = +line.substring(43, 46);
        var bb = +line.substring(47, 50);
        var so = +line.substring(51, 54);
        var era = +line.substring(55, 58) / 100;
        var g = +line.substring(71, 74);
        var gs = +line.substring(75, 78);
        p.pit = calcPitRatios({
            ip: ip,
            h: h,
            hr: hr,
            bb: bb,
            so: so
        }, lgAvg);
        var r = era * ip / 9;
        p.stamina = (ip + r) / g * 3;
        var arm = line[59];
        if (arm === arm.toUpperCase()) {
            p.arm = arm + "/" + arm;
        }
        else if (arm === 'l') {
            p.arm = "R/L";
        }
        else if (arm === 'r') {
            p.arm = "L/R";
        }
        p.stats["pIP"] = ip;
        p.stats["pERA"] = era;
        // Hitting ratings
        var code = line[80] || "C";
        var bH = { "A": 25, "B": 20, "C": 15, "D": 10, "E": 5 }[code];
        p.bat = calcBatRatios({
            // These make sense for 2010-16
            ab: 100,
            h: bH,
            db: .16 * bH,
            tr: .008 * bH,
            hr: .035 * bH,
            bb: 3.5,
            so: 55 - 1.02 * bH,
            sb: 0.07
        });
    }
    else {
        var ab = +line.substring(27, 30);
        var h = +line.substring(31, 34);
        var db = +line.substring(35, 38);
        var tr = +line.substring(39, 42);
        var hr = +line.substring(43, 46);
        var bb = +line.substring(47, 50);
        var so = +line.substring(51, 54);
        p.arm = line[59] + "/?";
        var sb = +line.substring(64, 67);
        p.bat = calcBatRatios({
            ab: ab,
            h: h,
            db: db,
            tr: tr,
            hr: hr,
            bb: bb,
            so: so,
            sb: sb
        }, lgAvg);
        p.stats["bAB"] = ab;
        p.stats["bH"] = h;
        p.stats["bHR"] = hr;
    }
    return p;
}
var BoxScoreEntry = (function () {
    function BoxScoreEntry(slot, player, pos) {
        this.slot = slot;
        this.player = player;
        this.pos = pos;
        this.posList = [pos];
        this.stats = {};
    }
    BoxScoreEntry.prototype.changePosition = function (pos) {
        this.pos = pos;
        if (this.posList.indexOf(pos) == -1) {
            this.posList.push(pos);
        }
    };
    BoxScoreEntry.prototype.getName = function () {
        var posStr = [];
        for (var i = 0; i < this.posList.length; i++) {
            posStr.push(POS_LABELS[this.posList[i]].toLowerCase());
        }
        return this.player.getName() + " " + posStr.join("-");
    };
    BoxScoreEntry.prototype.creditStat = function (stat) {
        this.stats[stat] = this.getStat(stat) + 1;
    };
    BoxScoreEntry.prototype.getStat = function (stat) {
        return this.stats[stat] || 0;
    };
    return BoxScoreEntry;
}());
var PitchingStaff = (function () {
    function PitchingStaff() {
        this.sp = [];
        this.cl = [];
    }
    return PitchingStaff;
}());
var PendingGame = (function () {
    function PendingGame() {
        this.teams = [];
        this.starters = [];
        this.lineups = [];
    }
    PendingGame.prototype.setTeam = function (index, teamId) {
        // TODO: Finish this.
        var team = DATA.teams[teamId];
        this.teams[index] = team;
        if (index === 1 && this.useDH !== team.useDH) {
            this.useDH = team.useDH;
        }
        else {
        }
    };
    return PendingGame;
}());
var Lineup = (function () {
    function Lineup() {
        this.lineup = [];
    }
    Lineup.prototype.add = function (player, pos) {
        this.lineup.push([player, pos]);
    };
    Lineup.prototype.setLineup = function (slot, player, pos) {
        this.lineup[slot] = [player, pos];
    };
    Lineup.prototype.getPlayer = function (index) {
        return this.lineup[index][0];
    };
    Lineup.prototype.getPos = function (index) {
        return this.lineup[index][1];
    };
    Lineup.prototype.getFielder = function (pos) {
        for (var i = 0; i < this.lineup.length; i++) {
            if (this.lineup[i][1] === pos) {
                return this.lineup[i][0];
            }
        }
        return null;
    };
    Lineup.prototype.size = function () {
        return this.lineup.length;
    };
    Lineup.prototype.toString = function () {
        var players = [];
        for (var i = 0; i < this.lineup.length; i++) {
            var name_1 = getName(this.lineup[i][0]);
            var pos = POS_LABELS[this.lineup[i][1]];
            players.push(name_1 + " " + pos);
        }
        return players.join(", ");
    };
    return Lineup;
}());
var Team = (function () {
    function Team(city, nick, abbr, useDH, lgAvg) {
        this.city = city;
        this.nick = nick;
        this.abbr = abbr;
        this.useDH = useDH;
        this.lgAvg = lgAvg;
        this.roster = [];
        this.lineups = [];
        this.staff = new PitchingStaff();
    }
    return Team;
}());
var TeamState = (function () {
    function TeamState(team) {
        this.ref = team;
        this.lineup = new Lineup();
        this.bench = [];
        this.boxscore = [];
        this.linescore = []; // 0 indexed, so 1st inn is 0.
        this.r = 0;
        this.h = 0;
        this.e = 0;
        this.atBat = 0;
        this.fatigue = 0;
        for (var i = 0; i < team.roster.length; i++) {
            this.bench.push(team.roster[i]);
        }
    }
    TeamState.prototype.checkDefense = function () {
        // Makes sure there's at least one player per position, returns failing position, or 0 for success.
        for (var pos = 1; pos <= 9; pos++) {
            var found = false;
            for (var i = 0; i < this.lineup.size(); i++) {
                if (this.lineup.getPos(i) === pos) {
                    found = true;
                }
            }
            if (!found) {
                return pos;
            }
        }
        return 0;
    };
    TeamState.prototype.advanceLineup = function () {
        this.atBat = (this.atBat + 1) % 9;
    };
    TeamState.prototype.creditRun = function (inning) {
        this.r++;
        this.linescore[inning] = (this.linescore[inning] || 0) + 1;
    };
    TeamState.prototype.setLineup = function (slot, player, pos) {
        this.lineup.setLineup(slot, player, pos);
    };
    TeamState.prototype.getLineScore = function (inning) {
        return this.linescore[inning] || 0;
    };
    TeamState.prototype.getBatter = function () {
        return this.lineup.getPlayer(this.atBat);
    };
    TeamState.prototype.getFielder = function (pos) {
        return this.lineup.getFielder(pos);
    };
    TeamState.prototype.findBoxScoreEntry = function (player) {
        for (var i = 0; i < this.boxscore.length; i++) {
            if (this.boxscore[i].player === player) {
                return this.boxscore[i];
            }
        }
        throw "Can't find box score entry for " + player;
    };
    TeamState.prototype.creditBatter = function () {
        var stats = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            stats[_i - 0] = arguments[_i];
        }
        var entry = this.findBoxScoreEntry(this.getBatter());
        for (var i = 0; i < stats.length; i++) {
            entry.creditStat(stats[i]);
        }
    };
    TeamState.prototype.creditPitcher = function () {
        var stats = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            stats[_i - 0] = arguments[_i];
        }
        var entry = this.findBoxScoreEntry(this.getFielder(1));
        for (var i = 0; i < stats.length; i++) {
            entry.creditStat(stats[i]);
        }
    };
    TeamState.prototype.creditPlayer = function (player) {
        var stats = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            stats[_i - 1] = arguments[_i];
        }
        var entry = this.findBoxScoreEntry(player);
        for (var i = 0; i < stats.length; i++) {
            entry.creditStat(stats[i]);
        }
    };
    return TeamState;
}());
var InningChange = (function () {
    function InningChange(inningIn, innTopIn) {
        this.inning = inningIn;
        this.innTop = innTopIn;
        this.type = "inning";
    }
    InningChange.prototype.getLog = function () {
        var str = (this.innTop ? "Top " : "Bottom ");
        return str + toOrdinal(this.inning);
    };
    return InningChange;
}());
var Substitution = (function () {
    function Substitution(playerIn, playerOut, pos, slot) {
        this.playerIn = playerIn;
        this.playerOut = playerOut;
        this.pos = pos;
        this.slot = slot;
        this.type = "sub";
    }
    Substitution.prototype.getLog = function () {
        // TODO: Make more useful.
        var str = this.playerIn.getName();
        if (this.pos === 1) {
            str += " relieves ";
        }
        else if (this.pos === 11) {
            str += " pinch hits for ";
        }
        else if (this.pos === 12) {
            str += " pinch runs for ";
        }
        else {
            str += " replaces ";
        }
        str += this.playerOut.getName();
        return str + ". ";
    };
    return Substitution;
}());
var Play = (function () {
    function Play(game) {
        this.game = game;
        this.status = 0;
        this.pitcher = game.getPitcher();
        this.bases = [game.getBatter(), game.bases[1], game.bases[2], game.bases[3]];
        this.adv = [null, null, null, null];
        this.flags = {};
        this.type = "play";
    }
    Play.prototype.getLog = function () {
        var batter = this.bases[0].getName();
        if (this.status < 2) {
            return batter + " steps in. ";
        }
        else {
            var str = batter;
            switch (this.play) {
                case "BB":
                    str += " walked";
                    break;
                case "SO":
                    str += " struck out";
                    break;
                case "HR":
                    str += " homered";
                    break;
                case "3B":
                    str += " tripled";
                    break;
                case "2B":
                    str += " doubled";
                    break;
                case "1B":
                    str += " singled";
                    break;
                case "GB":
                    str += " grounded out";
                    break;
                case "FB":
                    str += " flied out";
                    break;
                default:
                    str += " does unknown play " + this.play;
            }
            return str + ". ";
        }
    };
    Play.prototype.rollPlay = function (matchup, roll) {
        if (roll > matchup.bb) {
            return "BB";
        }
        else if (roll > matchup.so) {
            return "SO";
        }
        else if (roll > matchup.hr) {
            return "HR";
        }
        else if (roll > matchup.si) {
            return "1B";
        }
        else if (roll > matchup.db) {
            return "2B";
        }
        else if (roll > matchup.tr) {
            return "3B";
        }
        else if (roll > matchup.gb) {
            return "GB";
        }
        else {
            return "FB";
        }
    };
    Play.prototype.resolveBB = function () {
        this.adv[0] = 1;
        if (this.bases[1]) {
            this.adv[1] = 2;
            if (this.bases[2]) {
                this.adv[2] = 3;
                if (this.bases[3]) {
                    this.adv[3] = 4;
                }
            }
        }
        this.game.getTeamOffense().creditBatter("bBB");
        this.game.getTeamDefense().creditPitcher("pBB", "pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolveSO = function () {
        this.adv[0] = 0;
        this.game.getTeamOffense().creditBatter("bSO", "bAB");
        this.game.getTeamDefense().creditPitcher("pSO", "pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolveHR = function () {
        this.adv = [4, 4, 4, 4];
        this.game.getTeamOffense().h += 1;
        this.game.getTeamOffense().creditBatter("bH", "bHR", "bAB");
        this.game.getTeamDefense().creditPitcher("pH", "pHR", "pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolve3B = function () {
        this.adv = [3, 4, 4, 4];
        this.game.getTeamOffense().h += 1;
        this.game.getTeamOffense().creditBatter("bH", "b3B", "bAB");
        this.game.getTeamDefense().creditPitcher("pH", "pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolve2B = function () {
        this.adv = [2, 3, 4, 4];
        // TODO Score from 1st on double
        console.debug("TODO Resolve 2B");
        this.game.getTeamOffense().h += 1;
        this.game.getTeamOffense().creditBatter("bH", "b2B", "bAB");
        this.game.getTeamDefense().creditPitcher("pH", "pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolve1B = function () {
        this.adv = [1, 2, 3, 4];
        // TODO Advance on singles
        console.debug("TODO Resolve 1B");
        this.game.getTeamOffense().h += 1;
        this.game.getTeamOffense().creditBatter("bH", "bAB");
        this.game.getTeamDefense().creditPitcher("pH", "pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolveGB = function () {
        this.adv[0] = 0;
        // TODO Handle real grounders
        console.debug("TODO Resolve GB");
        this.game.getTeamOffense().creditBatter("bAB");
        this.game.getTeamDefense().creditPitcher("pBFP");
        this.finalizePlay();
    };
    Play.prototype.resolveFB = function () {
        this.adv[0] = 0;
        // TODO Handle tagup.
        console.debug("TODO Resolve FB");
        this.game.getTeamOffense().creditBatter("bAB");
        this.game.getTeamDefense().creditPitcher("pBFP");
        this.finalizePlay();
    };
    Play.prototype.finalizePlay = function () {
        // Note: this.game.bases is game state we're updating.
        // this.bases is the initial state of bases before the play.
        var def = this.game.getTeamDefense();
        var off = this.game.getTeamOffense();
        if (this.status < 9) {
            for (var i = 3; i >= 0; i--) {
                var creditRun = false;
                switch (this.adv[i]) {
                    case 0:
                        if (this.bases[i]) {
                            this.game.outs++;
                            def.creditPitcher("pIPO");
                            def.fatigue++;
                        }
                        if (i > 0) {
                            this.game.bases[i] = null;
                        }
                        break;
                    case 1:
                    case 2:
                    case 3:
                        if (i === 0) {
                            // put batter on base.
                            this.game.bases[this.adv[i]] = this.bases[0];
                        }
                        else if (this.bases[i]) {
                            // put runner on new base, and clear old base.
                            this.game.bases[this.adv[i]] = this.bases[i];
                            this.game.bases[i] = null;
                        }
                        break;
                    case 4:
                        if (i > 0 && this.bases[i]) {
                            this.game.bases[i] = null;
                            off.creditPlayer(this.bases[i], "bR");
                            var rbiFlag = this.adv[0] !== null; // TODO: Check RBIs better.
                            if (rbiFlag) {
                                off.creditBatter("bRBI");
                            }
                            creditRun = true;
                        }
                        if (i === 0) {
                            off.creditBatter("bR", "bRBI");
                            creditRun = true;
                        }
                        break;
                }
                if (creditRun) {
                    off.creditRun(this.game.inning);
                    def.creditPitcher("pR", "pER"); // TODO: Handle earned runs
                    def.fatigue += 3;
                }
            }
            // Advance lineup if needed
            if (this.adv[0] !== null) {
                off.advanceLineup();
            }
            // Possibly switch innings or end game
            var scoreDiff = this.game.teams[0].r - this.game.teams[1].r;
            var lastInning = this.game.inning >= this.game.regInnings;
            if (lastInning && scoreDiff < 0) {
                // If 9th or later and home team is winning, 
                // end the game if it's the bottom (walkoff) or top gets 3 outs.
                if (!this.game.innTop || this.game.outs == 3) {
                    this.game.endGame();
                }
            }
            else if (this.game.outs >= 3) {
                if (lastInning && !this.game.innTop && scoreDiff) {
                    this.game.endGame();
                }
                else {
                    this.game.switchInning();
                }
            }
            this.status = 9;
        }
    };
    Play.prototype.advance = function (command) {
        if (this.status === 0) {
            this.status = 1; // TODO: Handle manager cmds
        }
        if (this.status === 1) {
            var ratios = new Ratio(this.game.environment);
            ratios.multiply(this.bases[0].bat); // batter
            ratios.multiply(this.pitcher.pit); // TODO: More?
            var matchup = ratios.toMatchup();
            var roll = this.game.dice.roll();
            this.play = this.rollPlay(matchup, roll);
            // console.debug(this.bases[0].getName() + " batting vs " + this.pitcher.getName() + ", rolled " + this.play + "(" + roll.toFixed(4) + ")");
            this.status = 2;
        }
        if (this.status >= 2 && this.status < 9) {
            switch (this.play) {
                case "BB":
                    this.resolveBB();
                    break;
                case "SO":
                    this.resolveSO();
                    break;
                case "HR":
                    this.resolveHR();
                    break;
                case "3B":
                    this.resolve3B();
                    break;
                case "2B":
                    this.resolve2B();
                    break;
                case "1B":
                    this.resolve1B();
                    break;
                case "GB":
                    this.resolveGB();
                    break;
                case "FB":
                    this.resolveFB();
                    break;
                default:
                    throw new Error("Don't know how to resolve play " + this.play);
            }
        }
        // TODO: At some point, need to update game state.
    };
    return Play;
}());
var Game = (function () {
    function Game(away, home) {
        this.inning = 1;
        this.innTop = true;
        this.outs = 0;
        this.bases = [null, null, null, null];
        this.status = 0;
        this.teams = [new TeamState(away), new TeamState(home)];
        this.environment = home.lgAvg;
        this.dice = new Dice();
        this.regInnings = 9;
        this.playLog = [];
        this.startOfInning = true;
    }
    Game.prototype.setLineup = function (team, slot, player, pos) {
        if (this.status > 1) {
            throw "Can't set lineup if game is over";
        }
        // If game hasn't started, return used player to bench
        if (this.status === 0 && team.lineup[slot]) {
            team.bench.push(team.lineup[slot][0]);
        }
        // Start game creates box score entries. After, we need to make them here.
        if (this.status === 1) {
            var lin = team.lineup;
            var entry = new BoxScoreEntry(slot, player, pos);
            team.boxscore.push(entry);
            var out = team.lineup.getPlayer(slot);
            var subLog = new Substitution(player, out, pos, slot);
            this.playLog.push(subLog);
        }
        team.setLineup(slot, player, pos);
        var index = team.bench.indexOf(player);
        if (index >= 0) {
            team.bench.splice(index, 1);
        }
    };
    Game.prototype.startGame = function () {
        // Check for valid defense.
        for (var i = 0; i < 2; i++) {
            var team = this.teams[i];
            if (team.lineup.size() < 9) {
                throw (team.ref.abbr + " doesn't have enough players");
            }
            var missingPosition = team.checkDefense();
            if (missingPosition) {
                throw (team.ref.abbr + " doesn't have player at " + missingPosition);
            }
        }
        // Initialize box score
        for (var i = 0; i < 2; i++) {
            var team = this.teams[i];
            for (var j = 0; j < team.lineup.size(); j++) {
                var lin = team.lineup;
                var entry = new BoxScoreEntry(j, lin.getPlayer(j), lin.getPos(j));
                team.boxscore.push(entry);
            }
        }
        // Start game.
        this.status = 1;
        this.playLog.push(new InningChange(1, true));
    };
    Game.prototype.getInningString = function () {
        if (this.status === 0) {
            return "Pre-game";
        }
        else if (this.status === 2) {
            if (this.inning > this.regInnings) {
                return "Final (" + this.inning + ")";
            }
            return "Final";
        }
        var str = (this.innTop ? "Top " : "Bottom ");
        return str + toOrdinal(this.inning);
    };
    Game.prototype.getTeamOffense = function () {
        return this.teams[this.innTop ? 0 : 1];
    };
    Game.prototype.getTeamDefense = function () {
        return this.teams[this.innTop ? 1 : 0];
    };
    Game.prototype.getBatter = function () {
        var off = this.getTeamOffense();
        return off.getBatter();
    };
    Game.prototype.getFielder = function (pos) {
        var def = this.getTeamDefense();
        return def.getFielder(pos);
    };
    Game.prototype.getPitcher = function () {
        return this.getFielder(1);
    };
    Game.prototype.advanceGame = function (command) {
        if (this.status === 0) {
            throw "Can't advance game before it starts";
        }
        else if (this.status === 2) {
            throw "Can't advance game when it is over";
        }
        var last = this.getLastPlay();
        if (last && last instanceof Play && last.status < 9) {
            last.advance(command);
        }
        else {
            // Make a few quick AI checks
            var def = this.getTeamDefense();
            var callReliever = !this.getPitcher() || AIUtils.considerReliever(def, this.startOfInning);
            if (callReliever) {
                var relievers = AIUtils.findRelievers(def);
                if (relievers.length) {
                    var roll = this.dice.roll(relievers.length);
                    var reliever = relievers[roll - 1];
                    this.substitutePitcher(reliever);
                    return;
                }
            }
            this.startOfInning = false;
            var play = new Play(this);
            this.playLog.push(play);
            play.advance(command);
        }
    };
    Game.prototype.substitute = function (team, slot, player, pos) {
        // let out = team.lineup[slot][0];
        this.setLineup(team, slot, player, pos);
        if (pos === 1) {
            team.fatigue = 0;
        }
    };
    Game.prototype.substitutePitcher = function (reliever) {
        var def = this.getTeamDefense();
        var oldPitcher = def.getFielder(1);
        if (!oldPitcher) {
            oldPitcher = def.getFielder(11);
        }
        var slot = def.findBoxScoreEntry(oldPitcher).slot;
        this.substitute(def, slot, reliever, 1);
    };
    Game.prototype.getLastPlay = function () {
        for (var i = this.playLog.length - 1; i >= 0; i--) {
            if (this.playLog[i] instanceof Play) {
                return this.playLog[i];
            }
        }
        return null;
    };
    Game.prototype.switchInning = function () {
        if (!this.innTop) {
            this.inning++;
        }
        this.innTop = !this.innTop;
        this.bases = [null, null, null, null];
        this.outs = 0;
        var inningChange = new InningChange(this.inning, this.innTop);
        this.playLog.push(inningChange);
        this.startOfInning = true;
    };
    Game.prototype.endGame = function () {
        this.status = 2;
    };
    return Game;
}());
var AIUtils = (function () {
    function AIUtils() {
    }
    AIUtils.findRelievers = function (team) {
        var list = [];
        for (var i = 0; i < team.bench.length; i++) {
            var player = team.bench[i];
            if (player.pit && player.stamina < 10) {
                list.push(player);
            }
        }
        return list;
    };
    AIUtils.considerReliever = function (team, startOfInning) {
        var pitcher = team.getFielder(1);
        var stamina = pitcher.stamina;
        var fatigue = team.fatigue;
        // console.debug("Reliever check: " + fatigue + " vs " + stamina);
        if (startOfInning) {
            if (fatigue > stamina - 1) {
                return true;
            }
        }
        else {
            if (fatigue > stamina + 2) {
                return true;
            }
        }
        return false;
    };
    return AIUtils;
}());
function toOrdinal(num) {
    var base = num % 100;
    if (base > 3 && base < 21) {
        return num + "th";
    }
    else if (base % 10 == 1) {
        return num + "st";
    }
    else if (base % 10 == 2) {
        return num + "nd";
    }
    else if (base % 10 == 3) {
        return num + "rd";
    }
    else {
        return num + "th";
    }
}
function getName(player, type) {
    if (player) {
        return player.getName(type);
    }
    return "";
}
