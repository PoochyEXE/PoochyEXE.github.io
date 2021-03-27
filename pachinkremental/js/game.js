const kVersion = "v0.3.0 beta";
const kTitleAndVersion = "Pachinkremental " + kVersion;

var max_drop_y = 20;
var min_drop_x = 10;
var max_drop_x = 100;

const kFrameInterval = 1000.0 / kFPS;
	
const kMinCooldownToDraw = 300.0;
const kTopCanvasLayer = "canvas6";
const kQualityOptions = ["High", "Medium", "Low"];

const kGoldBallRippleColor = "170,143,0";

function CreateBallWithNoise(x, y, dx, dy, is_gold) {
	let dNoise = SampleGaussianNoise(0.0, 20.0);
	return new Ball(x, y, dx + dNoise.x, dy + dNoise.y, is_gold);
}

function DropGoldBall(x, y) {
	state.gold_balls.push(CreateBallWithNoise(x, y, 0.0, 0.0, true));
	++state.save_file.stats.gold_balls;
	state.ripples.push(new RippleEffect(new Point(x, y), kGoldBallRippleColor, kBallRadius));
}

function DropBall(x, y) {
	if (GetUpgradeLevel("unlock_gold_balls") > 0 && Math.random() < state.gold_ball_rate) {
		DropGoldBall(x, y);
	} else {
		state.balls.push(CreateBallWithNoise(x, y, 0.0, 0.0, false));
	}
	++state.save_file.stats.balls_dropped;
	state.stats_updated = true;
}

function DropBonusGoldBalls(num_to_drop) {
	let y = max_drop_y / 2;
	let spacing = (max_drop_x - min_drop_x) / (num_to_drop + 1);
	for (let i = 1; i <= num_to_drop; ++i) {
		let x = spacing * i + min_drop_x;
		DropGoldBall(x, y);
	}
}

function GetUpgradeLevel(upgrade_id) {
	return state.save_file.upgrade_levels[upgrade_id];
}

function AutoDropOn() {
	return GetUpgradeLevel("auto_drop") >= 1 && state.save_file.auto_drop_enabled;
}

function AutoSpinOn() {
	return GetUpgradeLevel("auto_spin") >= 1 && state.save_file.auto_spin_enabled;
}

function MultiSpinOn() {
	return GetUpgradeLevel("multi_spin") >= 1 && state.save_file.multi_spin_enabled;
}

function UpdateScoreHistory() {
	let total = 0;
	for (let i = 0; i < state.score_history.length; ++i) {
		total += state.score_history[i];
		if (i == 0) {
			state.save_file.stats.score_last5s = total;
		} else if (i == 2) {
			state.save_file.stats.score_last15s = total;
		} else if (i == 11) {
			state.save_file.stats.score_last60s = total;
		}
	}
	for (let i = state.score_history.length - 1; i > 0; --i) {
		state.score_history[i] = state.score_history[i - 1];
	}
	state.score_history[0] = 0;
}

function AddScore(points) {
	state.save_file.stats.total_score += points;
	state.save_file.points += points;
	state.score_history[0] += points;
	state.stats_updated = true;
	state.update_upgrade_buttons = true;
}

function InitState() {
	let state = {
		last_update: Date.now(),
		board: DefaultBoard(),
		target_sets: DefaultTargets(),
		balls: new Array(0),
		gold_balls: new Array(0),
		score_text: new Array(0),
		score_history: [...Array(12)].map(_ => 0),
		notifications: new Array(0),
		upgrades: InitUpgrades(),
		display_points: 0,
		canvas_scale: 2.0,
		redraw_all: true,
		redraw_targets: false,
		redraw_auto_drop: false,
		redraw_wheel: false,
		stats_updated: true,
		update_upgrade_buttons: true,
		auto_drop_cooldown: 1000.0,
		auto_drop_cooldown_left: 1000.0,
		max_balls: 1,
		gold_ball_multiplier: 2,
		gold_ball_rate: 0.01,
		bonus_wheel: null,
		wheel_popup_text: new Array(0),
		ripples: new Array(0),
		last_drawn: {
			can_drop: true,
			num_balls: 0,
			num_score_texts: 0,
			num_wheel_popup_texts: 0,
			num_ripples: 0,
		},
		intervals: {
			auto_save: null,
			update: null,
			score_history: null,
		},
		save_file: {
			game_version: 1,
			points: 0,
			spins: 0,
			auto_drop_pos: null,
			auto_drop_enabled: false,
			auto_save_enabled: true,
			auto_spin_enabled: false,
			multi_spin_enabled: false,
			quality: 0,
			stats: {
				total_score: 0,
				score_last5s: 0,
				score_last15s: 0,
				score_last60s: 0,
				balls_dropped: 0,
				balls_dropped_manual: 0,
				gold_balls: 0,
				target_hits: {},
			},
			upgrade_levels: {
				multiplier: 0,
				center_value: 0,
				auto_drop: 0,
				max_balls: 0,
				auto_drop_delay: 0,
				unlock_gold_balls: 0,
				gold_ball_rate: 0,
				gold_ball_value: 0,
				unlock_bonus_wheel: 0,
				add_spin_target: 0,
				auto_spin: 0,
				multi_spin: 0,
			},
		},
	};
	state.bonus_wheel = DefaultWheel(state);
	return state;
}

function UpdateScoreDisplay(state, forceUpdate) {
	const kRatio = (1.0 / 9.0) + 0.2;
	let update = forceUpdate;
	if (state.display_points != state.save_file.points) {
		let delta = Math.abs(state.save_file.points - state.display_points);
		if (delta < state.save_file.points * 1e-6) {
			state.display_points = state.save_file.points;
		} else {
			let display_delta = Math.ceil(delta * kRatio);
			if (state.display_points < state.save_file.points) {
				state.display_points += display_delta;
			} else {
				state.display_points -= display_delta;
			}
		}
		update = true;
	}
	if (update) {
		document.getElementById("message_box").innerHTML =
			"<h1>Points: " + FormatNumberLong(state.display_points) + "</h1>"
	}
}

function SpinBonusWheel() {
	state.bonus_wheel.Spin();
	UpdateSpinCounter();
}

function UpdateSpinCounter() {
	document.getElementById("bonus_wheel").style.display = (GetUpgradeLevel("unlock_bonus_wheel") > 0) ? "inline" : "none";
	document.getElementById("spin_count").innerHTML = state.save_file.spins;
	document.getElementById("button_spin").disabled = (state.bonus_wheel.IsSpinning() || state.save_file.spins <= 0);
	document.getElementById("multi_spin").style.display = (GetUpgradeLevel("multi_spin") > 0) ? "inline" : "none";
	document.getElementById("multi_spin_count").innerHTML = state.bonus_wheel.multi_spin;
}

function UpdateStatsPanel(state) {
	if (!state.stats_updated) {
		return;
	}
	state.stats_updated = false;
	for (key in state.save_file.stats) {
		let elem = document.getElementById("stats_" + key);
		if (!elem) {
			continue;
		}
		let val = state.save_file.stats[key];
		if (val == null || val == undefined) {
			continue;
		}
		if (val != 0) {
			let container = document.getElementById("stats_container_" + key);
			if (container) {
				container.style.display = "block";
			}
		}
		if (Number.isFinite(val)) {
			elem.innerHTML = FormatNumberLong(val);
		} else {
			elem.innerHTML = val;
		}
	}
}

function CanDrop(state) {
	if (state.balls.length >= state.max_balls) {
		return false;
	}
	return true;
}

function ToggleVisibility(panel_name) {
	let id = panel_name.toLowerCase();
	let header = document.getElementById("button_" + id + "_header");
	let contents = document.getElementById(id + "_contents");
    if (contents.style.display == "block") {
      contents.style.display = "none";
	  header.innerHTML = "[+] " + panel_name;
    } else {
      contents.style.display = "block";
	  header.innerHTML = "[-] " + panel_name;
    }
}

function UpdateOneFrame(state, draw) {
	if (state.balls.length > 0) {
		UpdateBalls(state.balls, state.board, state.target_sets);
	}
	if (state.gold_balls.length > 0) {
		UpdateBalls(state.gold_balls, state.board, state.target_sets);
	}
	UpdateScoreDisplay(state);
	
	if (AutoDropOn() && state.save_file.auto_drop_pos) {
		if (CanDrop(state)) {
			if (state.auto_drop_cooldown_left <= kFrameInterval) {
				state.auto_drop_cooldown_left = state.auto_drop_cooldown;
				let pos = state.save_file.auto_drop_pos;
				DropBall(pos.x, pos.y);
			} else {
				state.auto_drop_cooldown_left -= kFrameInterval;
			}
			if (state.auto_drop_cooldown >= kMinCooldownToDraw) {
				state.redraw_auto_drop = true;
			}
		}
	}
	
	if (state.bonus_wheel.IsSpinning()) {
		state.redraw_wheel = true;
		state.bonus_wheel.UpdateOneFrame();
	} else if (AutoSpinOn() && state.save_file.spins > 0) {
		SpinBonusWheel();
	}
}

function Update() {
	const this_update = Date.now();
	const num_frames = Math.floor((this_update - state.last_update) / kFrameInterval);
	const elapsed = num_frames * kFrameInterval;
	if (num_frames <= 0) {
		return;
	}
	for (let i = 0; i < num_frames; ++i) {
		UpdateOneFrame(state, false);
	}
	
	Draw(state);
	UpdateStatsPanel(state);
	UpdateUpgradeButtons(state);
	state.last_update += elapsed;
}

function OnClick(event) {
	let canvas = document.getElementById(kTopCanvasLayer);
	let canvas_left = canvas.offsetLeft + canvas.clientLeft;
	let canvas_top = canvas.offsetTop + canvas.clientTop;
	let canvas_x = event.pageX - canvas_left;
	let canvas_y = event.pageY - canvas_top;
	let board_x = canvas_x / state.canvas_scale;
	let board_y = canvas_y / state.canvas_scale;
	let pos = new Point(board_x, board_y);
	if (board_x >= min_drop_x && board_x <= max_drop_x && board_y >= 0 && board_y <= max_drop_y) {
		if (CanDrop(state)) {
			DropBall(board_x, board_y);
			++state.save_file.stats.balls_dropped_manual;
		}
		if (AutoDropOn()) {
			state.save_file.auto_drop_pos = pos;
			state.redraw_auto_drop = true;
		}
	}
}

var state = InitState();

function OnResize() {
	state.redraw_all = true;
	ResizeCanvas();
}

function Load() {
	// TODO: Save and load the game.
	document.getElementById(kTopCanvasLayer).addEventListener('click', OnClick);
	document.title = kTitleAndVersion;
	document.getElementById("title_version").innerHTML = kTitleAndVersion;
	document.getElementById("message_box").innerHTML =
		"<h1>Welcome to Pachinkremental!</h1>" +
		"<h1>Click anywhere in the green box to drop a ball.</h1>"
	LoadFromLocalStorage();
	var last_update = Date.now();

	OnResize();
	window.onresize = OnResize;

	Draw(state);
	
	state.intervals.update = setInterval(Update, kFrameInterval);
	state.intervals.score_history = setInterval(UpdateScoreHistory, 5000.0);
}
