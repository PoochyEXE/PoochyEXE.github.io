const kVersion = "v1.1.0";
const kTitleAndVersion = "Pachinkremental " + kVersion;

var max_drop_y = 20;
var min_drop_x = 10;
var max_drop_x = 100;

const kFrameInterval = 1000.0 / kFPS;

const kMinCooldownToDraw = 300.0;
const kTopCanvasLayer = "canvas6";

const kBallTypes = [
	//          | id |    name    | display_name | inner_color | outer_color | ripple_color_rgb |
	new BallType(0,   "normal",    "Normal ",     "#CCC",       "#888",       null             ),
	new BallType(1,   "gold",      "Gold ",       "#FFD700",    "#AA8F00",    "170,143,  0"    ),
	new BallType(2,   "ruby",      "Ruby ",       "#FBB",       "#F33",       "255, 48, 48"    ),
	new BallType(3,   "sapphire",  "Sapphire ",   "#BBF",       "#33F",       " 48, 48,255"    ),
	new BallType(4,   "emerald",   "Emerald ",    "#BFB",       "#3F3",       " 48,255, 48"    ),
	new BallType(5,   "topaz",     "Topaz ",      "#FFB",       "#FF3",       "255,255, 48"    ),
	new BallType(6,   "turquoise", "Turquoise ",  "#BFF",       "#3FF",       " 48,255,255"    ),
	new BallType(7,   "amethyst",  "Amethyst ",   "#FBF",       "#F3F",       "255, 48,255"    ),
	new BallType(8,   "opal",      "Opal ",       kPrismatic,   kPrismatic,   kPrismatic       ),
	new BallType(9,   "eight",     "8-",          k8Ball,       k8Ball,       "246, 31,183"    ),
	new BallType(10,  "beach",     "Beach ",      kBeachBall,   kBeachBall,   kBeachBall       ),
];

const kBallTypeIDs = {
	NORMAL: 0,
	GOLD: 1,
	RUBY: 2,
	SAPPHIRE: 3,
	EMERALD: 4,
	TOPAZ: 5,
	TURQUOISE: 6,
	AMETHYST: 7,
	OPAL: 8,
	EIGHT_BALL: 9,
	BEACH_BALL: 10,
};

function CreateBallWithNoise(x, y, dx, dy, ball_type_index) {
	let dNoise = SampleGaussianNoise(0.0, 20.0);
	let angleNoise = SampleGaussianNoise(0.0, 0.1);
	return new Ball(x, y, dx + dNoise.x, dy + dNoise.y, ball_type_index, angleNoise.x, angleNoise.y);
}

function RollBallType() {
	let ball_type_roll = Math.random();
	for (i = kBallTypes.length - 1; i > 0; --i) {
		if (!IsUnlocked("unlock_" + kBallTypes[i].name + "_balls")) {
			continue;
		}
		if (ball_type_roll < state.ball_type_rates[i]) {
			return i;
		} else {
			ball_type_roll -= state.ball_type_rates[i];
		}
	}
	return 0;
}

function DropBall(x, y, ball_type_index) {
	if (!ball_type_index) {
		ball_type_index = RollBallType();
	}
	const ball_type = kBallTypes[ball_type_index];
	state.balls_by_type[ball_type_index].push(
		CreateBallWithNoise(x, y, 0.0, 0.0, ball_type_index)
	);
	++state.save_file.stats.balls_dropped;
	++state.save_file.stats[ball_type.name + "_balls"];
	if (ball_type.ripple_color_rgb) {
		state.ripples.push(
			new RippleEffect(
				new Point(x, y),
				ball_type.ripple_color_rgb,
				kBallRadius
			)
		);
	}
	state.update_stats_panel = true;
}

function DropBonusBalls(ball_types) {
	let y = max_drop_y / 2;
	let spacing = (max_drop_x - min_drop_x) / (ball_types.length + 1);
	for (let i = 0; i < ball_types.length; ++i) {
		let x = spacing * (i + 1) + min_drop_x;
		DropBall(x, y, ball_types[i]);
	}
}

function TotalBalls(state) {
	let total = 0;
	for (let i = 0; i < state.balls_by_type.length; ++i) {
		total += state.balls_by_type[i].length;
	}
	return total;
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
	state.update_stats_panel = true;
	state.update_upgrade_buttons = true;
}

function InitState() {
	let state = {
		current_time: Date.now(),
		board: DefaultBoard(),
		target_sets: DefaultTargets(),
		balls_by_type: [...Array(kBallTypes.length)].map(_ => new Array(0)),
		score_text: new Array(0),
		score_history: [...Array(12)].map(_ => 0),
		notifications: new Array(0),
		upgrades: InitUpgrades(),
		upgrade_headers: null,
		upgrade_category_to_header_map: {},
		display_points: 0,
		canvas_scale: 2.0,
		redraw_all: true,
		redraw_targets: false,
		redraw_auto_drop: false,
		redraw_wheel: false,
		update_stats_panel: true,
		update_upgrade_buttons: true,
		enable_score_text: true,
		update_buff_display: true,
		auto_drop_cooldown: 1000.0,
		auto_drop_cooldown_left: 1000.0,
		max_balls: 1,
		ball_type_rates: [1.0],
		special_ball_multiplier: 2,
		sapphire_ball_exponent: 1.0,
		emerald_ball_exponent: 2.0,
		eight_ball_score_exponent: 1.0,
		eight_ball_spin_exponent: 1.0,
		beach_ball_score_exponent: 1.0,
		beach_ball_spin_exponent: 0.5,
		bonus_wheel: null,
		bonus_wheel_speed: 1.0,
		active_tooltip: null,
		wheel_popup_text: new Array(0),
		ripples: new Array(0),
		april_fools: false,
		last_drawn: {
			can_drop: true,
			num_balls: 0,
			num_score_texts: 0,
			num_wheel_popup_texts: 0,
			num_ripples: 0
		},
		intervals: {
			auto_save: null,
			update: null,
			score_history: null
		},
		save_file: {
			game_version: kSaveFileVersion,
			is_beta: !kIsLiveVersion,
			points: 0,
			spins: 0,
			auto_drop_pos: null,
			score_buff_multiplier: 1,
			score_buff_duration: 0,
			stats: {
				total_score: 0,
				score_last5s: 0,
				score_last15s: 0,
				score_last60s: 0,
				balls_dropped: 0,
				balls_dropped_manual: 0,
				max_buff_multiplier: 0,
				start_time: Date.now(),
				target_hits: {}
			},
			upgrade_levels: {
				multiplier: 0,
				center_value: 0,
				auto_drop: 0,
				max_balls: 0,
				auto_drop_delay: 0,
				gold_ball_value: 0,
				unlock_bonus_wheel: 0,
				add_spin_target: 0,
				auto_spin: 0,
				multi_spin: 0,
				ruby_ball_buff_stackable: 0,
				sapphire_ball_exponent: 0,
				emerald_ball_exponent: 0
			},
			options: {
				auto_save_enabled: true,
				auto_drop_enabled: false,
				auto_spin_enabled: false,
				multi_spin_enabled: false,
				dark_mode: false,
				classic_opal_balls: false,
				show_upgrade_levels: false,
				scientific_notation: false,
				favicon: -1,
				april_fools_enabled: 0,
				quality: 0,
				display_popup_text: 0,
			},
		}
	};
	state.upgrade_headers = InitUpgradeHeaders(state);
	for (let i = 0; i < state.upgrade_headers.length; ++i) {
		let header = state.upgrade_headers[i];
		for (let j = 0; j < header.categories.length; ++j) {
			state.upgrade_category_to_header_map[header.categories[j]] =
				header.id;
		}
	}
	for (upgrade in state.upgrades) {
		state.save_file.upgrade_levels[upgrade] = 0;
	}
	for (let i = 0; i < kBallTypes.length; ++i) {
		let name = kBallTypes[i].name;
		state.save_file.stats[name + "_balls"] = 0;
		state.save_file.options[name + "_ball_opacity"] = 100;
		if (i > 0) {
			let rate_upgrade = state.upgrades[name + "_ball_rate"];
			state.ball_type_rates.push(rate_upgrade.value_func(0) / 100.0);
		}
	}
	state.bonus_wheel = DefaultWheel(state);
	return state;
}

function GetSlotValue(slot_id) {
	return state.target_sets[0].targets[slot_id].value;
}

function UpdateScoreDisplay(state, force_update) {
	const kRatio = 1.0 / 9.0 + 0.2;
	let update = force_update;
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
		let html =
			'<span class="messageBoxLarge">Points: ' +
			FormatNumberLong(state.display_points) +
			"</span>";
		UpdateInnerHTML("message_box", html);
	}
}

function UpdateBuffDisplay() {
	if (!state.update_buff_display) {
		return;
	}
	state.update_buff_display = false;
	let html = "";
	if (state.save_file.score_buff_duration > 0) {
		let duration_sec = Math.round(
			state.save_file.score_buff_duration / 1000.0
		);
		html =
			"All scoring \u00D7" +
			FormatNumberShort(state.save_file.score_buff_multiplier) +
			" for " + duration_sec + " seconds!";
	} else if (IsUnlocked("unlock_ruby_balls")) {
		html = 'Score multiplier: \u00D71';
	}
	UpdateInnerHTML("buff", html);
}

function SpinBonusWheel() {
	state.bonus_wheel.Spin();
	UpdateSpinCounter();
}

function UpdateSpinCounter() {
	UpdateDisplay("bonus_wheel", IsUnlocked("unlock_bonus_wheel") ? "inline" : "none");
	UpdateInnerHTML("spin_count", FormatNumberLong(state.save_file.spins));
	document.getElementById("button_spin").disabled =
		state.bonus_wheel.IsSpinning() || state.save_file.spins <= 0;
	UpdateDisplay("multi_spin", IsUnlocked("multi_spin") ? "inline" : "none");
	UpdateInnerHTML("multi_spin_count", FormatNumberLong(state.bonus_wheel.multi_spin));
}

function InitStatsPanel(state) {
	let balls_by_type_container =
		document.getElementById("stats_balls_dropped_by_type");
	let html = '';
	for (let id = 1; id < kBallTypes.length; ++id) {
		let type_name = kBallTypes[id].name + "_balls";
		html +=
			'<div id="stats_container_' + type_name +
			'" class="statsRow" style="display: none;"><b>' +
			kBallTypes[id].display_name +
			'balls: </b><span id="stats_' + type_name +
			'" class="statsEntry"></span></div>';
	}
	balls_by_type_container.innerHTML = html;
}

function UpdateStatsPanel(state) {
	if (!state.update_stats_panel) {
		return;
	}
	state.update_stats_panel = false;
	for (key in state.save_file.stats) {
		let elem = document.getElementById("stats_" + key);
		if (!elem) {
			continue;
		}
		let val = state.save_file.stats[key];
		if (val == null || val == undefined) {
			continue;
		}
		let visible = (val != 0);
		if (key == "balls_dropped_manual") {
			visible = IsUnlocked("auto_drop");
		}
		if (visible) {
			let container = document.getElementById("stats_container_" + key);
			if (container && container.style.display != "block") {
				container.style.display = "block";
			}
		}
		let html = Number.isFinite(val) ? FormatNumberLong(val) : val;
		if (elem.innerHTML != html) {
			elem.innerHTML = html;
		}
	}
}

function CanDrop(state) {
	if (state.balls_by_type[0].length >= state.max_balls) {
		return false;
	}
	return true;
}

function ToggleVisibility(id) {
	let collapsed = document.getElementById(id + "_collapsed");
	let contents = document.getElementById(id + "_contents");
	if (contents.style.height == "0px") {
		contents.style.height = "auto";
		collapsed.innerHTML = "[&ndash;]";
	} else {
		contents.style.height = "0px";
		collapsed.innerHTML = "[+]";
	}
	let header_new = document.getElementById(id + "_header_new");
	if (header_new) {
		header_new.style.display = "none";
	}
}

function IsCollapsed(panel_name) {
	let contents = document.getElementById(panel_name + "_contents");
	if (!contents) {
		return undefined;
	}
	return contents.style.height == "0px";
}

function UpdateOneFrame(state, draw) {
	state.current_time += kFrameInterval;
	for (let i = 0; i < state.balls_by_type.length; ++i) {
		if (state.balls_by_type[i].length > 0) {
			UpdateBalls(
				state.balls_by_type[i],
				state.board,
				state.target_sets,
				i == kBallTypeIDs.BEACH_BALL
			);
		}
	}

	if (state.save_file.score_buff_duration > 0) {
		state.save_file.score_buff_duration -= kFrameInterval;
		if (state.save_file.score_buff_duration < 0) {
			state.save_file.score_buff_duration = 0;
		}
		state.update_buff_display = true;
	}

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

function IsAprilFoolsActive() {
	if (state.save_file.options.april_fools_enabled == 0) {
		return false;
	}
	if (state.save_file.options.april_fools_enabled == 1) {
		return true;
	}
	const date = new Date();
	return date.getMonth() == 3 && date.getDate() == 1;
}

function Update() {
	let now_april_fools = IsAprilFoolsActive();
	if (now_april_fools != state.april_fools) {
		state.redraw_all = true;
		state.april_fools = now_april_fools;
		if (now_april_fools) {
			state.notifications.push(new Notification("Happy April Fools Day!", "#F8F"));
		}
	}
	const num_frames = Math.floor(
		(Date.now() - state.current_time) / kFrameInterval
	);
	const elapsed = num_frames * kFrameInterval;
	if (num_frames <= 0) {
		return;
	}
	for (let i = 0; i < num_frames; ++i) {
		state.enable_score_text = num_frames - i < 60;
		UpdateOneFrame(state, false);
	}

	UpdateScoreDisplay(state, /*force_update=*/false);
	UpdateBuffDisplay(state, /*force_update=*/false);

	Draw(state);
	UpdateStatsPanel(state);
	UpdateUpgradeButtons(state);
}

function OnClick(event) {
	let canvas = document.getElementById(kTopCanvasLayer);
	let canvas_left = canvas.offsetLeft + canvas.clientLeft;
	let canvas_top = canvas.offsetTop + canvas.clientTop;
	let canvas_x = event.pageX - canvas_left;
	let canvas_y = event.pageY - canvas_top;
	if (state.april_fools) {
		canvas_x = canvas.width - canvas_x;
		canvas_y = canvas.height - canvas_y;
	}
	let board_x = canvas_x / state.canvas_scale;
	let board_y = canvas_y / state.canvas_scale;
	let pos = new Point(board_x, board_y);
	if (
		board_x >= min_drop_x &&
		board_x <= max_drop_x &&
		board_y >= 0 &&
		board_y <= max_drop_y
	) {
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

function UpdateDarkMode() {
	var color_scheme;
	if (state.save_file.options.dark_mode) {
		document.body.style.backgroundColor = "#000";
		color_scheme = "dark";
	} else {
		document.body.style.backgroundColor = "#FFF";
		color_scheme = "light";
	}
	
	for (let i = 0; i < kColorSchemeClasses.length; ++i) {
		let class_mapping = kColorSchemeClasses[i];
		let elems = document.getElementsByClassName(class_mapping.base);
		for (let j = elems.length - 1; j >= 0; --j) {
			let elem = elems[j];
			for (let k = 0; k < kColorSchemes.length; ++k) {
				if (kColorSchemes[k] == color_scheme) {
					elem.classList.add(class_mapping[kColorSchemes[k]]);
				} else {
					elem.classList.remove(class_mapping[kColorSchemes[k]]);
				}
			}
		}
	}
}

var state = InitState();

function OnResize() {
	state.redraw_all = true;
	ResizeCanvas();
	ResizeModals();
}

function Load() {
	InitUpgradeHeaderCollapsibles(state.upgrade_headers);
	InitUpgradeButtons(state.upgrades);
	InitStatsPanel(state);
	InitOptions(state);
	document.getElementById(kTopCanvasLayer).addEventListener("click", OnClick);
	document.title = kTitleAndVersion;
	document.getElementById("title_version").innerHTML = kTitleAndVersion;
	document.getElementById("version_ending").innerHTML = kVersion;
	document.getElementById("message_box").innerHTML =
		"<h1>Welcome to Pachinkremental!</h1>" +
		"<h1>Click anywhere in the green box to drop a ball.</h1>";
	let other_ver = kIsLiveVersion ? "live_ver_links" : "beta_ver_links";
	document.getElementById(other_ver).style.display = "inline-block";
	LoadFromLocalStorage();
	DisplayArchivedSaveFileButtons();
	UpdateDarkMode();

	OnResize();
	window.onresize = OnResize;

	Draw(state);

	state.intervals.update = setInterval(Update, kFrameInterval);
	state.intervals.score_history = setInterval(UpdateScoreHistory, 5000.0);
	
	console.log("Hi there! I don't mind if people hack/cheat, but if you make any screenshots, save files, videos, etc. that way, I'd appreciate it if you clearly label them as hacked. Thanks! --Poochy.EXE");
}
