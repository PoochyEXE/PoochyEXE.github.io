var max_drop_y = 20;
var min_drop_x = 10;
var max_drop_x = 100;

const kFrameInterval = 1000.0 / kFPS;
	
const kHorizontalSpacing = 18;
const kWallSpacing = 4;
const kHalfWallSpace = kWallSpacing / 2;
const kVerticalSpacing = Math.sqrt(3) * kHorizontalSpacing / 2;
const kColumns = 9;
const kRows = 13;
const kBottomSlotRows = 5;
const kWidth = kHorizontalSpacing * kColumns + kWallSpacing;
const kHeight = 256;
const kBaseSlotValues = [20, 100, 200, 1, 250, 1, 200, 100, 20];
const kMinCooldownToDraw = 300.0;
const kTopCanvasLayer = "canvas5";
const kQualityOptions = ["High", "Medium", "Low"];

function DefaultBoard() {
	let pegs = Array(0);
	for (let y = kHeight - kHalfWallSpace; y >= kHalfWallSpace; y -= kWallSpacing) {
		pegs.push(new Point(kHalfWallSpace, y));
		pegs.push(new Point(kWidth - kHalfWallSpace, y));
	}
	var y = kHeight - kHalfWallSpace;
	for (let col = 0; col < kColumns; ++col) {
		const prev_x = col * kHorizontalSpacing + kHalfWallSpace;
		const next_x = (col + 1) * kHorizontalSpacing + kHalfWallSpace;
		const delta_x = next_x - prev_x;
		const mid_pegs = Math.floor(delta_x / kWallSpacing);
		for (let subcol = 1; subcol <= mid_pegs; ++subcol) {
			const x = prev_x + (subcol * delta_x / mid_pegs);
			pegs.push(new Point(x, y));
		}
	}
	y -= kWallSpacing;
	for (let row = 1; row < kBottomSlotRows; ++row) {
		for (let col = 1; col < kColumns; ++col) {
			const x = col * kHorizontalSpacing + kHalfWallSpace;
			pegs.push(new Point(x, y));
		}
		y -= kWallSpacing;
	}
	for (let row = 0; row < kRows; ++row) {
		if (row % 2 == 0) {
			for (let col = 1; col < kColumns; ++col) {
				const x = col * kHorizontalSpacing + kHalfWallSpace;
				pegs.push(new Point(x, y));
			}
		} else {
			for (let col = 0; col < kColumns; ++col) {
				const x = (col + 0.5) * kHorizontalSpacing + kHalfWallSpace;
				pegs.push(new Point(x, y));
			}
			const y_above = y - kVerticalSpacing / 4;
			const x_left = 0.25 * kHorizontalSpacing + kHalfWallSpace;
			const x_right = kWidth - x_left;
			pegs.push(new Point(x_left, y_above));
			pegs.push(new Point(x_right, y_above));
		}
		y -= kVerticalSpacing;
	}
	max_drop_y = y;
	min_drop_x = 10;
	max_drop_x = kWidth - 10;
	return new PegBoard(kWidth, kHeight, pegs);
}

function DefaultTargets() {
	const kDrawRadius = (kHorizontalSpacing - kWallSpacing) / 2;
	const kY = kHeight - kDrawRadius - kWallSpacing;
	const kTargetColor = "#8FF";
	const kHitboxRadius = Math.min(kDrawRadius * 1.5 - kBallRadius);

	let target_sets = Array(0);
	let targets = Array(0);
	for (let col = 0; col < kBaseSlotValues.length; ++col) {
		const x = (col + 0.5) * kHorizontalSpacing + kHalfWallSpace;
		const pos = new Point(x, kY);
		const value = kBaseSlotValues[col];
		targets.push(new ScoreTarget(
				pos, kDrawRadius, kHitboxRadius, kTargetColor, col, /*active=*/true, value));
	}
	target_sets.push(new TargetSet(targets));
	return target_sets;
}

function CreateBallWithNoise(x, y, dx, dy, is_gold) {
	let dNoise = SampleGaussianNoise(0.0, 20.0);
	return new Ball(x, y, dx + dNoise.x, dy + dNoise.y, is_gold);
}

function DropBall(x, y) {
	if (GetUpgradeLevel("unlock_gold_balls") > 0 && Math.random() < state.gold_ball_rate) {
		state.gold_balls.push(CreateBallWithNoise(x, y, 0.0, 0.0, true));
		++state.save_file.stats.gold_balls;
	} else {
		state.balls.push(CreateBallWithNoise(x, y, 0.0, 0.0, false));
	}
	++state.save_file.stats.balls_dropped;
	state.stats_updated = true;
}

function UpdateBottomTargets() {
	let bottom_targets = state.target_sets[0].targets;
	console.assert(bottom_targets.length == 9);
	let multiplier_upgrade = state.upgrades["multiplier"];
	let multiplier = multiplier_upgrade.GetValue();
	let center_value_upgrade = state.upgrades["center_value"];
	for (let i = 0; i < kBaseSlotValues.length; ++i) {
		let base_value = kBaseSlotValues[i];
		if (i == 4) {
			base_value = center_value_upgrade.GetValue();
		}
		bottom_targets[i].SetValue(base_value * multiplier);
	}
	state.redraw_targets = true;
}

function GetUpgradeLevel(upgrade_id) {
	return state.save_file.upgrade_levels[upgrade_id];
}

function InitUpgrades() {
	const kTimesSymbol = "\u00D7";
	let upgrades_list = new Array();
	upgrades_list.push(new Upgrade("multiplier", "Point Multiplier",
			/*cost_func=*/function(level) {
				return 200 * Math.pow(200, level);
			},
			/*value_func=*/function(level) {
				return Math.pow(5, level);
			},
			/*max_level=*/Infinity,
			/*value_suffix=*/kTimesSymbol,
			/*visible_func=*/null,
			/*on_update=*/UpdateBottomTargets,
			/*on_buy=*/function() {
				let bottom_targets = state.target_sets[0].targets;
				let popup_text = kTimesSymbol + "5";
				for (let i = 0; i < bottom_targets.length; ++i) {
					state.score_text.push(new RisingText(popup_text, bottom_targets[i].pos, Date.now()));
				}
			}));
	upgrades_list.push(new Upgrade("center_value", "Center Slot Value",
			/*cost_func=*/function(level) {
				return 200 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return 250 * Math.pow(2, level);
			},
			/*max_level=*/Infinity,
			/*value_suffix=*/'',
			/*visible_func=*/null,
			/*on_update=*/UpdateBottomTargets,
			/*on_buy=*/function() {
				let target = state.target_sets[0].targets[4];
				let popup_text = kTimesSymbol + "2";
				state.score_text.push(new RisingText(popup_text, target.pos, Date.now()));
			}));
	upgrades_list.push(new ToggleUnlockUpgrade("auto_drop", "Auto-Drop", /*cost=*/100000,
			/*visible_func=*/function() {
				return GetUpgradeLevel("center_value") > 3;
			},
			/*on_update=*/function() {
				state.redraw_auto_drop = true;
				state.update_upgrade_buttons = true;
			}));
	upgrades_list.push(new Upgrade("auto_drop_delay", "Auto-Drop Delay",
			/*cost_func=*/function(level) {
				return 200000 * Math.pow(2, level);
			},
			/*value_func=*/function(level) {
				return Math.max(100, Math.floor(Math.pow(0.9, level) * 1000.0));
			},
			/*max_level=*/22,
			/*value_suffix=*/" ms",
			/*visible_func=*/function() {
				return GetUpgradeLevel("auto_drop") > 0;
			},
			/*on_update=*/function() {
				state.auto_drop_cooldown = this.GetValue();
				if (state.auto_drop_cooldown_left > state.auto_drop_cooldown) {
					state.auto_drop_cooldown_left = state.auto_drop_cooldown;
				}
				state.redraw_auto_drop = true;
			},
			/*on_buy=*/null));
	upgrades_list.push(new Upgrade("max_balls", "Max Balls",
			/*cost_func=*/function(level) {
				return 200000 * Math.pow(2, level);
			},
			/*value_func=*/function(level) {
				return level + 1;
			},
			/*max_level=*/Infinity,
			/*value_suffix=*/'',
			/*visible_func=*/function() {
				return GetUpgradeLevel("auto_drop") > 0;
			},
			/*on_update=*/function() {
				return state.max_balls = this.GetValue();
			},
			/*on_buy=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_gold_balls", "Unlock Gold Balls", /*cost=*/500000,
			/*visible_func=*/function() {
				return GetUpgradeLevel("max_balls") > 0;
			},
			/*on_update=*/function() {
			}));
	upgrades_list.push(new Upgrade("gold_ball_rate", "Gold Ball Rate",
			/*cost_func=*/function(level) {
				return 1000000 * Math.pow(2, level);
			},
			/*value_func=*/function(level) {
				return level + 1;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return GetUpgradeLevel("unlock_gold_balls") > 0;
			},
			/*on_update=*/function() {
				state.gold_ball_rate = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	
	let upgrades_map = {};
	for (let i = 0; i < upgrades_list.length; ++i) {
		let upgrade = upgrades_list[i];
		upgrades_map[upgrade.id] = upgrade;
	}
	
	return upgrades_map;
}

function AutoDropOn() {
	return GetUpgradeLevel("auto_drop") >= 1 && state.save_file.auto_drop_enabled;
}

function InitState() {
	return {
		last_update: Date.now(),
		board: DefaultBoard(),
		target_sets: DefaultTargets(),
		balls: new Array(0),
		gold_balls: new Array(0),
		score_text: new Array(0),
		notifications: new Array(0),
		upgrades: InitUpgrades(),
		display_points: 0,
		canvas_scale: 2.0,
		redraw_all: true,
		redraw_targets: false,
		redraw_auto_drop: false,
		stats_updated: true,
		update_upgrade_buttons: true,
		auto_drop_cooldown: 1000.0,
		auto_drop_cooldown_left: 1000.0,
		max_balls: 1,
		gold_ball_multiplier: 2,
		gold_ball_rate: 0.0,
		last_drawn: {
			can_drop: true,
			num_balls: 0,
			num_score_texts: 0,
		},
		intervals: {
			auto_save: null,
			update: null,
		},
		save_file: {
			game_version: 1,
			points: 0,
			auto_drop_enabled: false,
			auto_save_enabled: true,
			auto_drop_pos: null,
			quality: 0,
			stats: {
				total_score: 0,
				balls_dropped: 0,
				balls_dropped_manual: 0,
				gold_balls: 0,
			},
			upgrade_levels: {
				multiplier: 0,
				center_value: 0,
				auto_drop: 0,
				max_balls: 0,
				auto_drop_delay: 0,
				unlock_gold_balls: 0,
				gold_ball_rate: 0,
			},
		},
	}
}

function SaveFileToString(state) {
	let inner_data = JSON.stringify(state.save_file);
	return btoa(JSON.stringify([inner_data, SaveFileChecksum(inner_data)]));
}

function SaveFileFromString(save_file_str) {
	if (!save_file_str) {
		return null;
	}
	try {
		let outer_data = JSON.parse(atob(save_file_str));
		if (SaveFileChecksum(outer_data[0]) != outer_data[1]) {
			return null;
		}
		return JSON.parse(outer_data[0]);
	} catch (error) {
		console.error("Could not parse save file: " + save_file_str);
		return null;
	}
}

function SaveToLocalStorage() {
	localStorage.setItem('save_file', SaveFileToString(state));
	state.notifications.push(new Notification("Game saved", "#8F8"));
}

function LoadGame(save_file_str) {
	let load_save = SaveFileFromString(save_file_str);
	if (load_save && load_save.game_version) {
		state = InitState();
		default_state = InitState();
		state.save_file = {...default_state.save_file, ...load_save};
		state.save_file.stats = {...default_state.save_file.stats, ...load_save.stats};
		state.save_file.upgrade_levels = {...default_state.save_file.upgrade_levels, ...load_save.upgrade_levels};
		state.display_score = state.save_file.stats.total_score;
		state.display_points = state.save_file.points;
		state.update_upgrade_buttons = true;
		for (let id in state.upgrades) {
			state.upgrades[id].Update();
		}
		if (state.save_file.stats.total_score > 0) {
			UpdateScoreDisplay(state, /*forceUpdate=*/true);
		}
		state.notifications.push(new Notification("Game loaded", "#8F8"));
	} else {
		state.notifications.push(new Notification("Error: Save file appears to be corrupted!", "#F88"));
	}
}

function LoadFromLocalStorage() {
	let save_file_str = localStorage.getItem('save_file');
	if (save_file_str) {
		LoadGame(save_file_str);
	}
}

function ImportSave() {
	let save_file_str = prompt("Paste your save file below.\nCAUTION: This will overwrite your current save file!", "");

	if (save_file_str != null && save_file_str != "") {
		LoadGame(save_file_str);
	} 
}

function ExportSave() {
	prompt("Your save file is below. Copy the text and keep it someplace safe.", SaveFileToString(state));
}

function EraseSave() {
	const kCaution = "\u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0\n\n"
	let answer = prompt(kCaution + "This will erase all your progress and restart the game from scratch!\n\n" + kCaution +
			"\nIf you are really sure, type \"DELETE\" in all caps below, then click OK.", "");
	if (answer == "DELETE") {
		localStorage.removeItem('save_file')
		state = InitState();
		Load();
		state.notifications.push(new Notification("Save file erased", "#F88"));
	}
}

function UpdateOptionsButtons() {
	document.getElementById("button_auto_save").innerHTML = "Auto Save: " + 
		(state.save_file.auto_save_enabled ? "ON" : "OFF");
	document.getElementById("button_quality").innerHTML = "Quality: " + 
		kQualityOptions[state.save_file.quality];
}

function UpdateAutoSaveInterval() {
	if (state.save_file.auto_save_enabled) {
		if (!state.intervals.auto_save) {
			state.intervals.auto_save = setInterval(SaveToLocalStorage, 60000);
		}
		document.getElementById("button_auto_save").innerHTML = "Auto Save: ON"
	} else {
		if (state.intervals.auto_save) {
			clearInterval(state.intervals.auto_save);
			state.intervals.auto_save = null;
		}
		document.getElementById("button_auto_save").innerHTML = "Auto Save: OFF"
	}
}

function ToggleAutoSave() {
	state.save_file.auto_save_enabled = !state.save_file.auto_save_enabled;
	UpdateAutoSaveInterval();
	UpdateOptionsButtons();
}

function ToggleQuality() {
	++state.save_file.quality;
	if (state.save_file.quality >= kQualityOptions.length) {
		state.save_file.quality = 0;
	}
	state.redraw_all = true;
	UpdateOptionsButtons();
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
		document.getElementById("messageBox").innerHTML =
			"<h1>Points: " + FormatNumberLong(state.display_points) + "</h1>"
	}
}

function UpgradeButtonHandler(elem) {
	const kPrefix = "button_upgrade_";
	console.assert(elem.id.indexOf(kPrefix) == 0);
	let upgrade_id = elem.id.slice(kPrefix.length);
	state.upgrades[upgrade_id].OnClick();
}

function UpdateUpgradeButtons(state) {
	if (!state.update_upgrade_buttons) {
		return;
	}
	state.update_upgrade_buttons = false;
	
	for (let id in state.upgrades) {
		let upgrade = state.upgrades[id];
		let elem = document.getElementById("button_upgrade_" + id);
		elem.innerHTML = upgrade.GetText();
		elem.disabled = !upgrade.ShouldEnableButton();
		elem.style.display = upgrade.visible_func() ? "inline" : "none";
	}
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

function Draw(state) {
	// Layer 0: Board
	if (state.redraw_all) {
		let ctx = ClearLayerAndReturnContext(0);
		if (state.save_file.quality <= 1) {
			DrawPegs(state.board.pegs, ctx);
		} else {
			DrawPegsNoGradient(state.board.pegs, ctx);
		}
	}
	// Layer 1: Drop Zone
	const can_drop = CanDrop(state) || (AutoDropOn() && state.auto_drop_cooldown < kMinCooldownToDraw);
	if (state.redraw_all || state.last_drawn.can_drop != can_drop) {
		let ctx = ClearLayerAndReturnContext(1);
		DrawDropZone(max_drop_y, min_drop_x, max_drop_x, can_drop, ctx);
		state.last_drawn.can_drop = can_drop;
	}
	// Layer 2: Balls
	if (state.redraw_all || state.balls.length > 0 || state.gold_balls.length > 0 || state.last_drawn.num_balls > 0) {
		let ctx = ClearLayerAndReturnContext(2);
		if (state.save_file.quality == 0) {
			DrawBalls(state.balls, /*gold=*/false, ctx);
			DrawBalls(state.gold_balls, /*gold=*/true, ctx);
		} else {
			DrawBallsNoGradient(state.balls, /*gold=*/false, ctx);
			DrawBallsNoGradient(state.gold_balls, /*gold=*/true, ctx);
		}
		state.last_drawn.num_balls = state.balls.length + state.gold_balls.length;
	}
	// Layer 3: Targets
	if (state.redraw_all || state.redraw_targets) {
		let ctx = ClearLayerAndReturnContext(3);
		DrawTargets(state.target_sets, ctx);
		state.redraw_targets = false;
	}
	// Layer 4: Auto-Drop position
	if (state.redraw_all || state.redraw_auto_drop) {
		let ctx = ClearLayerAndReturnContext(4);
		if (AutoDropOn()) {
			let cooldown = 0;
			if (state.auto_drop_cooldown >= kMinCooldownToDraw) {
				cooldown = state.auto_drop_cooldown_left / state.auto_drop_cooldown;
			}
			DrawAutoDropPosition(state.save_file.auto_drop_pos, cooldown, ctx);
		}
		state.redraw_auto_drop = false;
	}
	// Layer 5: Score text
	if (state.redraw_all || state.score_text.length > 0 || state.last_drawn.num_score_text > 0) {
		let ctx = ClearLayerAndReturnContext(5);
		DrawScoreText(state.score_text, ctx);
		state.last_drawn.num_score_texts = state.score_text.length;
	}
	
	if (state.redraw_all) {
		UpdateAutoSaveInterval();
		UpdateOptionsButtons();
	}

	UpdateNotifications(state);
	
	state.redraw_all = false;
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
	
	if (AutoDropOn() && state.save_file.auto_drop_pos) {
		let pos = state.save_file.auto_drop_pos;
		if (CanDrop(state)) {
			if (state.auto_drop_cooldown_left <= elapsed) {
				state.auto_drop_cooldown_left = state.auto_drop_cooldown;
				DropBall(pos.x, pos.y);
			} else {
				state.auto_drop_cooldown_left -= elapsed;
			}
			if (state.auto_drop_cooldown >= kMinCooldownToDraw) {
				state.redraw_auto_drop = true;
			}
		}
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
	document.getElementById("messageBox").innerHTML =
		"<h1>Welcome to Pachinkremental!</h1>" +
		"<h1>Click anywhere in the green box to drop a ball.</h1>"
	LoadFromLocalStorage();
	var last_update = Date.now();

	OnResize();
	window.onresize = OnResize;

	Draw(state);
	
	state.intervals.update = setInterval(Update, kFrameInterval);
}
