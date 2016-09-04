const POS_LABELS = ["-", "P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "PH", "PR"];

class Dice {
	roll(sides?: number) {
		if (!sides || sides <= 1) {
			return Math.random();
		}
		return Math.floor(Math.random() * sides) + 1;
	}
}

class StackedDice extends Dice {
	stacked: number[];
	constructor() {
		super();
		this.stacked = [];
	}
	stack(roll: number) {
		this.stacked.push(roll);
	}
	roll(sides ? : number) {
		if (this.stacked.length === 0) {
			throw new Error("StackedDice has no results left");
		}
		return this.stacked.shift();
	}
}

class Player {
	last: string;
	first: string;
	pos: number;
	arm: string; // bats/throws in R/R format
	bat: Ratio;
	pit: Ratio;
	stamina: number;
	speed: number;
	stats: any = {};
	getName(type ? : number) {
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
		// TODO: Handle max length better?
	}
	toString() {
		return "[" + this.getName(1) + " " + POS_LABELS[this.pos] + "]";
	}
}

class Ratio {
	bb: number;
	so: number;
	hr: number;
	h: number;
	xb: number;
	tr: number;
	sba: number;
	gb: number;
	constructor(old ? : Ratio) {
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
	multiply(by: Ratio) {
		this.bb *= by.bb;
		this.so *= by.so;
		this.hr *= by.hr;
		this.h *= by.h;
		this.xb *= by.xb;
		this.tr *= by.tr;
		this.sba *= by.sba;
		this.gb *= by.gb;
		return this;
	}
	toMatchup() {
		let matchup = new Matchup();
		let high = 1;

		let bb = this.bb / (1 + this.bb);
		high = high - bb;
		matchup.bb = high;

		let so = this.so / (1 + this.so) * high;
		high = high - so;
		matchup.so = high;

		let hr = this.hr / (1 + this.hr) * high;
		high = high - hr;
		matchup.hr = high;

		let h = this.h / (1 + this.h) * high;
		let low = high - h;

		let xb = this.xb / (1 + this.xb) * (high - low);
		high = low + xb;
		matchup.si = high;

		let tr = this.tr / (1 + this.tr) * (high - low);
		matchup.db = low + tr;
		matchup.tr = low;

		let gb = this.gb / (1 + this.gb) * low;
		matchup.gb = low - gb;
		return matchup;
	}
}

class LeagueAverage extends Ratio {
	id: string;
	static fromJson(json: any, id: string) {
		let r = new LeagueAverage();
		r.bb = json.bb;
		r.so = json.so;
		r.hr = json.hr;
		r.h = json.h;
		r.xb = json.xb;
		r.tr = json.tr;
		r.sba = json.sba;
		r.gb = json.gb;
		r.id = id;
		return r;
	}
}

class Matchup {
	// Defines the endpoints for the thousand-sided dice.
	// Goes in order GB 3B 2B 1B HR SO BB. Start at BB, and check for roll > value.
	bb: number;
	so: number;
	hr: number;
	tr: number;
	db: number;
	si: number;
	gb: number;
}

// Turns raw batting stats into ratios. If given lgAvg, will return multipliers.
function calcBatRatios(bat, lgAvg ? : Ratio): Ratio {
	let ab = bat.ab as number;
	let h = bat.h;
	let db = bat.db;
	let tr = bat.tr;
	let hr = bat.hr;
	let bb = bat.bb;
	let so = bat.so;
	let sb = bat.sb;
	let si = h - db - tr - hr;

	let ratios = new Ratio();
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
function calcPitRatios(stats, lgAvg ? : Ratio): Ratio {
	let ip = stats.ip;
	let h = stats.h;
	let hr = stats.hr;
	let bb = stats.bb;
	let so = stats.so;
	let bfp = stats.bfp || (2.94 * ip + h + bb);
	let ab = bfp - bb;

	let ratios = new Ratio();
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

function ratePlayer(line: string, lgAvg: Ratio): Player {
	let p = new Player();
	p.pos = +line.substring(6, 8);
	let name = line.substring(9, 27).trim().split(",");
	p.last = name[0].trim();
	p.first = (name[1] || "").trim();

	if (p.pos === 1) {
		let ip = +line.substring(27, 30);
		let h = +line.substring(31, 34);
		let hr = +line.substring(43, 46);
		let bb = +line.substring(47, 50);
		let so = +line.substring(51, 54);
		let era = +line.substring(55, 58) / 100;
		let g = +line.substring(71, 74);
		let gs = +line.substring(75, 78);
		p.pit = calcPitRatios({
			ip: ip,
			h: h,
			hr: hr,
			bb: bb,
			so: so
		}, lgAvg);
		let r = era*ip/9;
		p.stamina = (ip + r) / g * 3;
		let arm = line[59];
		if (arm === arm.toUpperCase()) {
			p.arm = arm + "/" + arm;
		}
		else if (arm === 'l') {
			p.arm = "R/L";
		}
		else if (arm === 'r') {
			p.arm = "L/R";
		}

		// Hitting ratings
		let code = line[80] || "C";
		let bH = {"A":25, "B":20, "C":15, "D":10, "E":5}[code]
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
		p.speed = 1;

	}
	else {
		let ab = +line.substring(27, 30);
		let h = +line.substring(31, 34);
		let db = +line.substring(35, 38);
		let tr = +line.substring(39, 42);
		let hr = +line.substring(43, 46);
		let bb = +line.substring(47, 50);
		let so = +line.substring(51, 54);
		p.arm = line[59] + "/?";
		let sb = +line.substring(64, 67);
		let cs = +line.substring(68, 70);
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
		
		// Calculate speed
		let sp1 = ((sb + 3) / (sb + cs + 7) - .4) * 20;
		let sp2 = Math.sqrt((sb + cs) / (h - db - tr - hr + bb)) / .07;
		let sp3 = tr / (ab - hr - so) / .0016;
		sp1 = Math.max(0, Math.min(10, sp1));
		sp2 = Math.max(0, Math.min(10, sp2));
		sp3 = Math.max(0, Math.min(10, sp3));
		p.speed = Math.max(1, Math.round((10 * sp1 + 10 * sp2 + 6 * sp3) / 26));
	}

	return p;
}

class BoxScoreEntry {
	slot: number;
	player: Player;
	posList: number[];
	pos: number;
	stats: Object;
	constructor(slot: number, player: Player, pos: number) {
		this.slot = slot;
		this.player = player;
		this.pos = pos;
		this.posList = [pos];
		this.stats = {};
	}
	changePosition(pos: number) {
		this.pos = pos;
		if (this.posList.indexOf(pos) == -1) {
			this.posList.push(pos);
		}
	}
	getName(includePos: boolean) {
		let str = this.player.getName();
		if (includePos) {
			let posStr = [];
			for (let i=0; i<this.posList.length; i++) {
				posStr.push(POS_LABELS[this.posList[i]].toLowerCase());
			}
			str = str + " " + posStr.join("-");
		}
		return str;
	}
	creditStat(stat: string) {
		this.stats[stat] = this.getStat(stat) + 1;
	}
	getStat(stat: string) {
		return this.stats[stat] || 0;
	}
}

class PitchingStaff {
	sp: Player[];
	cl: Player[];
	constructor() {
		this.sp = [];
		this.cl = [];
	}
	// TODO: Expand
}

class Lineup {
	lineup: Array < [Player, number] > ;
	constructor() {
		this.lineup = [];
	}
	add(player: Player, pos: number) {
		this.lineup.push([player, pos]);
	}
	setLineup(slot:number, player:Player, pos:number) {
		this.lineup[slot] = [player, pos];
	}
	getPlayer(index: number) {
		return this.lineup[index][0];
	}
	getPos(index: number) {
		return this.lineup[index][1];
	}
	getFielder(pos: number) {
		for (let i = 0; i < this.lineup.length; i++) {
			if (this.lineup[i][1] === pos) {
				return this.lineup[i][0];
			}
		}
		return null;
	}
	size() {
		return this.lineup.length;
	}
	toString() {
		let players = [];
		for (let i = 0; i < this.lineup.length; i++) {
			let name = getName(this.lineup[i][0]);
			let pos = POS_LABELS[this.lineup[i][1]];
			players.push(name + " " + pos);
		}
		return players.join(", ");
	}
}

class Team {
	key: string;
	city: string; // City name (Toronto)
	nick: string; // Team nickname (Blue Jays)
	abbr: string; // Short code (TOR)
	useDH: boolean; // Uses DH in home games
	lgAvg: Ratio;
	roster: Player[];
	// Inactive/disabled roster?
	lineups: Lineup[];
	staff: PitchingStaff;
	constructor(key: string, city: string, nick: string, abbr: string, useDH: boolean, lgAvg: Ratio) {
		this.key = key;
		this.city = city;
		this.nick = nick;
		this.abbr = abbr;
		this.useDH = useDH;
		this.lgAvg = lgAvg;
		this.roster = [];
		this.lineups = [];
		this.staff = new PitchingStaff();
	}
	getFullName() {
		return this.city + " " + this.nick;
	}
}

class TeamState {
	// Used to keep team state in games
	ref: Team; // Reference to team object
	lineup: Lineup; // array of tuples
	bench: Player[];
	boxscore: BoxScoreEntry[];
	stats: Object;
	linescore: number[];
	r: number;
	h: number;
	e: number;
	manager: string; // username if player, falsy if AI
	fatigue: number; // current pitcher fatigue
	atBat: number; // Who's next to bat (0-8)
	constructor(team: Team) {
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
		for (let i = 0; i < team.roster.length; i++) {
			this.bench.push(team.roster[i]);
		}
	}
	checkDefense() {
		// Makes sure there's at least one player per position, returns failing position, or 0 for success.
		for (let pos = 1; pos <= 9; pos++) {
			let found = false;
			for (let i = 0; i < this.lineup.size(); i++) {
				if (this.lineup.getPos(i) === pos) {
					found = true;
				}
			}
			if (!found) {
				return pos;
			}
		}
		return 0;
	}
	advanceLineup() {
		this.atBat = (this.atBat + 1) % 9;
	}
	creditRun(inning: number) {
		this.r++;
		this.linescore[inning] = (this.linescore[inning] || 0) + 1;
	}
	setLineup(slot:number, player:Player, pos:number) {
		this.lineup.setLineup(slot, player, pos);
	}
	getLineScore(inning:number) {
		return this.linescore[inning] || 0;
	}
	getBatter() {
		return this.lineup.getPlayer(this.atBat);
	}
	getFielder(pos: number) {
		return this.lineup.getFielder(pos);
	}
	findBoxScoreEntry(player: Player) {
		for (let i=0; i<this.boxscore.length; i++) {
			if (this.boxscore[i].player === player) {
				return this.boxscore[i];
			}
		}
		throw "Can't find box score entry for " + player;
	}
	creditBatter(...stats: string[]) {
		let entry = this.findBoxScoreEntry(this.getBatter());
		for (let i=0; i<stats.length; i++) {
			entry.creditStat(stats[i]);
		}
	}
	creditPitcher(...stats: string[]) {
		let entry = this.findBoxScoreEntry(this.getFielder(1));
		for (let i=0; i<stats.length; i++) {
			entry.creditStat(stats[i]);
		}
	}
	creditPlayer(player: Player, ...stats: string[]) {
		let entry = this.findBoxScoreEntry(player);
		for (let i=0; i<stats.length; i++) {
			entry.creditStat(stats[i]);
		}
	}
}

interface Loggable {
	type: string;
	getLog(): string;
}

class InningChange implements Loggable {
	inning: number;
	innTop: boolean;
	type: string;
	constructor(inningIn: number, innTopIn: boolean) {
		this.inning = inningIn;
		this.innTop = innTopIn;
		this.type = "inning";
	}
	getLog() {
		var str = (this.innTop ? "Top " : "Bottom ");
        return str + toOrdinal(this.inning)
	}
}

class Substitution implements Loggable {
	playerOut: Player; 
	playerIn: Player;
	pos: number;
	slot: number;
	type: string;
	constructor(playerIn: Player, playerOut: Player, pos:number, slot:number) {
		this.playerIn = playerIn;
		this.playerOut = playerOut;
		this.pos = pos;
		this.slot = slot;
		this.type = "sub";
	}
	getLog() {
		// TODO: Make more useful.
		let str = this.playerIn.getName();
		if (this.pos === 1) {
			str += " relieves ";
		} else if (this.pos === 11) {
			str += " pinch hits for ";
		} else if (this.pos === 12) {
			str += " pinch runs for ";
		} else {
			str += " replaces ";
		}
		str += this.playerOut.getName();
		return str + ". ";
	}
}

class Play implements Loggable {
	game: Game;
	status: number; // 
	pitcher: Player; // TODO: Defense later?
	bases: Player[]; // Includes batter [0,1,2,3]
	adv: number[];
	play: string;
	flags: any;
	type: string;
	constructor(game: Game) {
		this.game = game;
		this.status = 0;
		this.pitcher = game.getPitcher();
		this.bases = [game.getBatter(), game.bases[1], game.bases[2], game.bases[3]];
		this.adv = [null, null, null, null];
		this.flags = {};
		this.type = "play";
	}
	getLog() {
		let batter = this.bases[0].getName();
		if (this.status < 2) {
			return batter + " steps in. ";
		}
		else {
			let str = batter;
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
					if (this.flags.gdpResult) {
						str += " grounded into double play";
					} else if (this.flags.reachFC) {
						str += " reached on fielder's choice";
					} else {
						str += " grounded out";
					}
					break;
				case "FB":
					str += " flied out";
					break;
				default:
					str += " does unknown play " + this.play;
			}
			let labels = [" is out", " to first", " to second", " to third", " scores"];
			for (let i=1; i<=3; i++) {
				if (this.bases[i] && this.adv[i] !== null && this.adv[i] !== i ) {
					let advBase = this.adv[i];
					str = str + ", " + this.bases[i].getName() + labels[advBase];
				}
			}
			return str + ". ";
		}
	}
	private rollPlay(matchup: Matchup, roll: number) {
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
	}
	
	private findOdds(specs) {
		let odds = specs.base || 0;
		if (specs.speed) {
			odds = odds + .04 * specs.speed;
		}
		if (specs.outsRule) {
			if (this.game.outs === 2) {
				odds += .10;
			} else {
				odds -= .05;
			}
		}
		// TODO: Randomize ±20%
		let cap = specs.cap || .02;
		if (odds < cap) {
			odds = cap;
		}
		if (odds > 1 - cap) { 
			odds = 1 - cap; 
		}
		return odds;
	}
	
	private resolveBB() {
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
	}
	private resolveSO() {
		this.adv[0] = 0;
		this.game.getTeamOffense().creditBatter("bSO", "bAB");
		this.game.getTeamDefense().creditPitcher("pSO", "pBFP");
		this.finalizePlay();
	}
	private resolveHR() {
		this.adv = [4, 4, 4, 4];
		this.game.getTeamOffense().h += 1;
		this.game.getTeamOffense().creditBatter("bH", "bHR", "bAB");
		this.game.getTeamDefense().creditPitcher("pH", "pHR", "pBFP");
		this.finalizePlay();
	}
	private resolve3B() {
		this.adv = [3, 4, 4, 4];
		this.game.getTeamOffense().h += 1;
		this.game.getTeamOffense().creditBatter("bH", "b3B", "bAB");
		this.game.getTeamDefense().creditPitcher("pH", "pBFP");
		this.finalizePlay();
	}
	
	private resolve2B() {
		this.adv = [2, 3, 4, 4];
		if (this.bases[1]) {
			if (!this.flags.odds1) {
				this.flags.odds1 = this.findOdds({
					base: .3, 
					speed: this.bases[1].speed,
					outsRule: true
				});
			}
			if (!this.flags.off) {
				// Assuming AI
				let breakevenArr = [.91, .79, .46];
				let breakeven = breakevenArr[this.game.outs];
				if (this.flags.odds1 >= breakeven) {
					this.flags.off = "send";
				} else {
					this.flags.off = "hold";
				}
				console.log("  [AI] Score from 1st? " + this.flags.odds1 + 
						" vs " + breakeven + ": " + this.flags.off);
				// TODO: Stop for humans
			}
			if (this.flags.off === "send") {
				let roll = this.game.dice.roll();
				if (roll < this.flags.odds1) {
					this.adv[1] = 4;
				} else {
					this.adv[1] = 0;
				}
				console.log("  Score from 1st? " + 
						roll.toFixed(3) + ": " + this.adv[1]);
			}
		}
		
		this.game.getTeamOffense().h += 1;
		this.game.getTeamOffense().creditBatter("bH", "b2B", "bAB");
		this.game.getTeamDefense().creditPitcher("pH", "pBFP");
		this.finalizePlay();
	}
	
	private resolve1B() {
		this.adv = [1, 2, 3, 4];
		// TODO Advance on singles
		console.debug("TODO Resolve 1B");
		this.game.getTeamOffense().h += 1;
		this.game.getTeamOffense().creditBatter("bH", "bAB");
		this.game.getTeamDefense().creditPitcher("pH", "pBFP");
		this.finalizePlay();
	}
	
	private resolveGB() {
		if (!this.flags.gbType) {
			this.flags.gbType = this.game.dice.roll(4);
		}
		if (this.game.outs === 2) {
			// Take routine out at 1st
			this.adv[0] = 0;
			
		} else if (this.flags.gbType === 1) {
			// automatic runner advancing grounders
			this.adv = [0, 2, 3, 4];

		} else if (this.flags.gbType === 2) {
			// non-runner advancing, and lead forced runner is out. (Or GB is no one on 1st)
			this.resolveSoftGB();
			
		} else {
			// potential double play grounders
			this.resolvePotentialGDP();
		}
		
		this.game.getTeamOffense().creditBatter("bAB");
		this.game.getTeamDefense().creditPitcher("pBFP");
		this.finalizePlay();
	}
	
	private resolveSoftGB() {
		if (this.bases[1]) {
			if (this.bases[2]) {
				if (this.bases[3]) {
					this.adv = [1, 2, 3, 0];
				} else {
					this.adv = [1, 2, 0, null];
				}
			} else {
				this.adv = [1, 0, null, 3];
			}
		} else {
			this.adv = [0, null, 2, 3];
		}
	}
	
	private resolvePotentialGDP() {
		if (this.flags.infieldIn) {
			throw "TODO Not implemented yet";
			
		} else {
			if (this.bases[1]) {
				let dpDC = 4 + this.bases[1].speed; // Base 5/13 odds. TODO: Factor speed, defense.
				let dpRoll = this.game.dice.roll(13);
				console.debug("  DP roll: " + dpRoll + " vs DC " + dpDC);
				if (dpRoll >= dpDC) {
					this.flags.gdpResult = true;
					this.game.getTeamOffense().creditBatter("bGDP");
					if (this.game.outs >= 1) {
						this.adv = [0, 0, null, null];
					} else {
						this.adv = [0, 0, 3, 4];
					}
				} else {
					this.adv = [1, 0, 3, 4];
					this.flags.reachFC = true;
				}
			} else {
				this.adv = [0, 2, 3, 4];
			}
		}
	}
	
	private resolveFB() {
		if (this.game.outs === 2) {
			this.adv[0] = 0;
			this.game.getTeamOffense().creditBatter("bAB");

		} else if (this.bases[2] || this.bases[3]) {
			// TODO: Upgrade this.
			this.adv[0] = 0;
			this.game.getTeamOffense().creditBatter("bAB");
			// this.resolveTagup();
			
		} else {
			this.adv[0] = 0;
			this.game.getTeamOffense().creditBatter("bAB");
		}
		
		// TODO Handle tagup.
		console.debug("TODO Resolve FB");
		this.game.getTeamDefense().creditPitcher("pBFP");
		this.finalizePlay();
	}
	
	private resolveTagup() {
		var odds2 = 0, odds3 = 0;
	}
	
	private finalizePlay() {
		// Note: this.game.bases is game state we're updating.
		// this.bases is the initial state of bases before the play.
		let def = this.game.getTeamDefense();
		let off = this.game.getTeamOffense();
		if (this.status < 9) {
			for (let i = 3; i >= 0; i--) {
				let creditRun = false;
				switch (this.adv[i]) {
					case 0: // Out
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
					case 4: // Score
						if (i > 0 && this.bases[i]) {
							this.game.bases[i] = null;
							off.creditPlayer(this.bases[i], "bR");
							let rbiFlag = this.adv[0] !== null; // TODO: Check RBIs better.
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
			let scoreDiff = this.game.teams[0].r - this.game.teams[1].r;
			let lastInning = this.game.inning >= this.game.regInnings;
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
	}
	advance(command: string) {
		if (this.status === 0) {
			// TODO: Do something about empty commands.
			if (command && command.substring(0, 6) === "force:") {
				this.play = command.substring(6);
				this.status = 2;
			} else {
				// auto advance for now.
				this.status = 1;
				// TODO: Handle manager commands.
			}
		}
		if (this.status === 1) {
			let ratios = new Ratio(this.game.environment);
			ratios.multiply(this.bases[0].bat); // batter
			ratios.multiply(this.pitcher.pit); // TODO: More?
			let matchup = ratios.toMatchup();
			let roll = this.game.dice.roll();
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
	}
}

class Game {
	teams: TeamState[];
	inning: number;
	innTop: boolean; // true for top, false for bottom
	outs: number;
	bases: Player[];
	status: number; // 0 pregame, 1 in game, 2 final
	environment: Ratio;
	dice: Dice;
	regInnings: number;
	startOfInning: boolean;
	playLog: Loggable[];

	constructor(away: Team, home: Team) {
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

	setLineup(team: TeamState, slot: number, player: Player, pos: number) {
		if (this.status > 1) {
			throw "Can't set lineup if game is over";
		}

		// If game hasn't started, return used player to bench
		if (this.status === 0 && team.lineup[slot]) {
			team.bench.push(team.lineup[slot][0]);
		}
		// Start game creates box score entries. After, we need to make them here.
		if (this.status === 1) { 
			let lin = team.lineup;
			let entry = new BoxScoreEntry(slot, player, pos);
			team.boxscore.push(entry);

			let out = team.lineup.getPlayer(slot);
			let subLog = new Substitution(player, out, pos, slot);
			this.playLog.push(subLog);
		}

		team.setLineup(slot, player, pos);
		let index = team.bench.indexOf(player);
		if (index >= 0) {
			team.bench.splice(index, 1);
		}
	}

	startGame() {
		// Check for valid defense.
		for (let i = 0; i < 2; i++) {
			let team = this.teams[i];
			if (team.lineup.size() < 9) {
				throw (team.ref.abbr + " doesn't have enough players");
			}
			let missingPosition = team.checkDefense();
			if (missingPosition) {
				throw (team.ref.abbr + " doesn't have player at " + missingPosition);
			}
		}
		// Initialize box score
		for (let i = 0; i < 2; i++) {
			let team = this.teams[i];
			for (let j = 0; j < team.lineup.size(); j++) {
				let lin = team.lineup;
				let entry = new BoxScoreEntry(j, lin.getPlayer(j), lin.getPos(j));
				team.boxscore.push(entry);
			}
		}
		// Start game.
		this.status = 1;
		this.playLog.push(new InningChange(1, true));
	}

	getInningString() {
		if (this.status === 0) {
			return "Pre-game";
		}
		else if (this.status === 2) {
			if (this.inning > this.regInnings) {
				return "Final (" + this.inning + ")";
			}
			return "Final";
		}
		let str = (this.innTop ? "Top " : "Bottom ");
		return str + toOrdinal(this.inning);
	}

	getTeamOffense() {
		return this.teams[this.innTop ? 0 : 1];
	}
	getTeamDefense() {
		return this.teams[this.innTop ? 1 : 0];
	}
	getBatter() {
		let off = this.getTeamOffense();
		return off.getBatter();
	}
	getFielder(pos: number) {
		let def = this.getTeamDefense();
		return def.getFielder(pos);
	}
	getPitcher() {
		return this.getFielder(1);
	}
	advanceGame(command: string) {
		if (this.status === 0) {
			throw "Can't advance game before it starts";
		}
		else if (this.status === 2) {
			throw "Can't advance game when it is over";
		}
		let last = this.getLastPlay();
		if (last && last instanceof Play && last.status < 9) {
			last.advance(command);
		}
		else {
			// Make a few quick AI checks
			let def = this.getTeamDefense();
			let callReliever = !this.getPitcher() || AIUtils.considerReliever(def, this.startOfInning);
			if (callReliever) {
				let relievers = AIUtils.findRelievers(def);
				if (relievers.length) {
					let roll = this.dice.roll(relievers.length);
					let reliever = relievers[roll - 1];
					this.substitutePitcher(reliever);
					return;
				}
			}
			
			this.startOfInning = false;
			let play = new Play(this);
			this.playLog.push(play);
			play.advance(command);
		}
	}
	substitute(team: TeamState, slot: number, player: Player, pos: number) {
		// let out = team.lineup[slot][0];
		this.setLineup(team, slot, player, pos);
		if (pos === 1) {
			team.fatigue = 0;
		}
	}
	substitutePitcher(reliever: Player) {
		let def = this.getTeamDefense();
		let oldPitcher = def.getFielder(1);
		if (!oldPitcher) { // if no pitcher in lineup, replace a PH.
			oldPitcher = def.getFielder(11); 
		} 
		let slot = def.findBoxScoreEntry(oldPitcher).slot;
		this.substitute(def, slot, reliever, 1);
	}
	getLastPlay() {
		for (let i = this.playLog.length - 1; i >= 0; i--) {
			if (this.playLog[i] instanceof Play) {
				return this.playLog[i];
			}
		}
		return null;
	}
	switchInning() {
		if (!this.innTop) {
			this.inning++;
		}
		this.innTop = !this.innTop;
		this.bases = [null, null, null, null];
		this.outs = 0;
		let inningChange = new InningChange(this.inning, this.innTop);
		this.playLog.push(inningChange);
		this.startOfInning = true;
	}
	endGame() {
		this.status = 2;
	}
}

class AIUtils {
	static findRelievers(team: TeamState) {
		let list = [];
		for (let i=0; i<team.bench.length; i++) {
			let player = team.bench[i];
			if (player.pit && player.stamina < 10) {
				list.push(player)
			}
		}
		return list;
	}
	static considerReliever(team: TeamState, startOfInning: boolean) {
		// Step 1: Decide if we need a hook
		// Step 2: Decide game situation and what kind of reliever we need
		// Step 3: Set initial expectation of new pitcher's stamina
		
		// CL 9th, up 1-3
		// SU 8th+, within 2; maybe 7th
		// MR 5-7th, within 4
		// LR 1-3
		
		let pitcher = team.getFielder(1);
		let stamina = pitcher.stamina;
		let fatigue = team.fatigue;
		// console.debug("Reliever check: " + fatigue + " vs " + stamina);
		if (startOfInning) {
			if (fatigue > stamina - 1) {
				return true;
			}
		} else {
			if (fatigue > stamina + 2) {
				return true;
			}
		}
		return false;
	}
}

function toOrdinal(num: number) {
	let base = num % 100;
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

function getName(player: Player, type?: number) {
	if (player) {
		return player.getName(type);
	}
	return "";
}

function pad(val: string|number, pad: string, right?: boolean) {
    if (right) {
        return (val + pad).substring(0, pad.length);
    } else {
        return (pad + val).slice(-pad.length);
    }
}
