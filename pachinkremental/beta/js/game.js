const kVersion = "v1.11.2-beta";
const kTitleAndVersion = "Pachinkremental " + kVersion;

const kFrameInterval = 1000.0 / kFPS;

const kManualDropCooldown = 80.0;
const kMinCooldownToDraw = 300.0;
const kTopCanvasLayer = "canvas_ripples";

function CreateBallWithNoise(x, y, dx, dy, ball_type_index) {
	let dNoise = SampleGaussianNoise(0.0, 20.0);
	let angleNoise = SampleGaussianNoise(0.0, 0.1);
	return new Ball(x, y, dx + dNoise.x, dy + dNoise.y, ball_type_index, angleNoise.x, angleNoise.y);
}

function DropBall(x, y, ball_type_index) {
	let machine = ActiveMachine(state);
	let stats = machine.GetSaveData().stats;
	if (!ball_type_index) {
		ball_type_index = machine.RollBallType();
	}
	const ball_type = machine.BallTypes()[ball_type_index];
	state.balls_by_type[ball_type_index].push(
		CreateBallWithNoise(x, y, 0.0, 0.0, ball_type_index)
	);
	++stats.balls_dropped;
	++stats[ball_type.name + "_balls"];
	state.last_ball_drop = state.current_time;
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

function TotalBalls(state) {
	let total = 0;
	for (let i = 0; i < state.balls_by_type.length; ++i) {
		total += state.balls_by_type[i].length;
	}
	return total;
}

function UpdateScoreHistory(state) {
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

	const ball_types = ActiveMachine(state).BallTypes();
	for (let i = 0; i < ball_types.length; ++i) {
		let total = 0;
		let ball_type_history = state.score_history_by_ball_type.per_5s[i];
		for (let j = 0; j < ball_type_history.length; ++j) {
			total += ball_type_history[j];
			if (j == 0) {
				state.score_history_by_ball_type.last_5s[i] = total;
			} else if (j == 2) {
				state.score_history_by_ball_type.last_15s[i] = total;
			} else if (j == 11) {
				state.score_history_by_ball_type.last_60s[i] = total;
			}
		}
		for (let j = ball_type_history.length - 1; j > 0; --j) {
			ball_type_history[j] = ball_type_history[j - 1];
		}
		ball_type_history[0] = 0;
	}
}

function LoadActiveMachine(state) {
	state.update_stats_panel = true;
	state.update_upgrade_buttons = true;
	state.update_upgrades = true;
	state.update_buff_display = true;
	state.redraw_all = true;

	const machine = ActiveMachine(state);
	const num_ball_types = machine.BallTypes().length;
	const save_data = machine.GetSaveData();
	machine.OnActivate();
	state.display_points = save_data.points;
	state.balls_by_type = [...Array(num_ball_types)].map(_ => new Array(0));
	state.upgrade_headers = machine.UpgradeHeaders();
	for (let i = 0; i < state.upgrade_headers.length; ++i) {
		let header = state.upgrade_headers[i];
		for (let j = 0; j < header.categories.length; ++j) {
			state.upgrade_category_to_header_map[header.categories[j]] =
				header.id;
		}
	}

	state.score_history.fill(0);
	state.score_history_by_ball_type.per_5s =
		[...Array(num_ball_types)].map(_ => Array(12).fill(0));
	state.score_history_by_ball_type.last_5s = Array(num_ball_types).fill(0);
	state.score_history_by_ball_type.last_15s = Array(num_ball_types).fill(0);
	state.score_history_by_ball_type.last_60s = Array(num_ball_types).fill(0);

	const drop_zones = machine.board.drop_zones;
	let html = "";
	for (let i = 0; i < drop_zones.length; ++i) {
		html += '<button type="button" class="dropZone" id="drop_zone' + i +
			'"></button>'
	}
	UpdateInnerHTML("drop_zones", html);

	InitUpgradeHeaderCollapsibles(state.upgrade_headers);
	InitUpgradeButtons(machine.upgrades);
	InitStatsPanel(state);
	InitOptions(state);
	UpdateFavicon(state);
	UpdateOpacitySlidersFromSaveFile(state);
	UpdateFaviconChoiceFromSaveFile(state);
	UpdateCollapsibles(save_data.options.collapsed);
	OnResize();
}

function InitState() {
	let state = {
		current_time: Date.now(),
		machines: [
			new FirstMachine(kFirstMachineID, "Basic"),
			new BumperMachine(kBumperMachineID, "Bumpers"),
		],
		active_machine_index: 0,
		balls_by_type: [],
		score_text: new Array(0),
		score_history: [...Array(12)].map(_ => 0),
		score_history_by_ball_type: {
			per_5s: [],
			last_5s: [],
			last_15s: [],
			last_60s: [],
		},
		last_score_history_update: Date.now(),
		last_ball_drop: 0,
		notifications: new Array(0),
		upgrade_headers: null,
		upgrade_category_to_header_map: {},
		display_points: 0,
		canvas_scale: 2.0,
		redraw_all: true,
		redraw_targets: false,
		redraw_auto_drop: false,
		redraw_wheel: false,
		reset_target_text: false,
		update_stats_panel: true,
		update_upgrades: true,
		update_upgrade_buttons: true,
		update_buff_display: true,
		enable_score_text: true,
		auto_drop_cooldown: 1000.0,
		auto_drop_cooldown_left: 1000.0,
		active_tooltip: null,
		wheel_popup_text: new Array(0),
		ripples: new Array(0),
		april_fools: false,
		last_drawn: {
			can_drop: true,
			num_balls: 0,
			num_score_texts: 0,
			num_wheel_popup_texts: 0,
			num_ripples: 0,
			april_fools: false,
		},
		intervals: {
			auto_save: null,
			update: null,
		},
		timeouts: {
			check_event: null,
		},
		save_file: {
			game_version: kSaveFileVersion,
			is_beta: !kIsLiveVersion,
			active_machine: kFirstMachineID,
			stats: {
				score_last5s: 0,
				score_last15s: 0,
				score_last60s: 0,
				start_time: Date.now(),
				machine_maxed_times: {}
			},
			machines: {},
			options: {
				auto_save_enabled: true,
				dark_mode: false,
				classic_opal_balls: false,
				show_upgrade_levels: false,
				apply_opacity_to_popup_text: true,
				show_combos: true,
				notation: 0,
				favicon: -1,
				april_fools_enabled: 2,
				quality: 0,
				display_popup_text: 0,
				maxed_upgrades: 1,
				collapsed: {
					upgrades: false,
					machines: false,
					stats: true,
					options: true,
				},
			},
		}
	};
	for (let i = 0; i < state.machines.length; ++i) {
		let machine = state.machines[i];
		let id = machine.id;
		state.save_file.machines[id] = machine.DefaultSaveData();
		state.save_file.stats.machine_maxed_times[id] = null;
	}
	return state;
}

function UpdateScoreDisplay(state, force_update) {
	const kRatio = 1.0 / 9.0 + 0.2;
	let update = force_update;
	const points = ActiveMachine(state).GetSaveData().points;
	if (state.display_points != points) {
		let delta = Math.abs(points - state.display_points);
		if (delta < points * 1e-6) {
			state.display_points = points;
		} else {
			let display_delta = Math.ceil(delta * kRatio);
			if (state.display_points < points) {
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

function UpdateBuffDisplay(state) {
	state.update_buff_display = false;
	UpdateInnerHTML("buff", ActiveMachine(state).BuffDisplayText());
}

function ActivateHyper() {
	const machine = ActiveMachine(state);
	machine.ActivateHyperSystem();
}

function CanDrop(state) {
	if (state.balls_by_type[0].length >= ActiveMachine(state).max_balls) {
		return false;
	}
	return true;
}

function SetCollapsibleHeaderState(id, collapse) {
	let collapsed_display = document.getElementById(id + "_collapsed");
	let contents = document.getElementById(id + "_contents");
	if (contents && collapsed_display) {
		contents.style.height = collapse ? "0px" : "auto";
		collapsed_display.innerHTML = collapse ? "[+]" : "[&ndash;]";
	}

	let header = document.getElementById("button_" + id + "_header");
	if (header) {
		let options = header.classList.contains("upgradesSubHeader") ?
				ActiveMachine(state).GetSaveData().options :
				state.save_file.options;
		options.collapsed[id] = collapse;
	}

	if (!collapse) {
		let header_new = document.getElementById(id + "_header_new");
		if (header_new) {
			header_new.style.display = "none";
		}
	}
}

function UpdateCollapsibles(collapsed_options) {
	for (let id in collapsed_options) {
		SetCollapsibleHeaderState(id, collapsed_options[id]);
	}
}

function ToggleVisibility(id) {
	SetCollapsibleHeaderState(id, !IsCollapsed(id));
}

function IsCollapsed(panel_name) {
	let contents = document.getElementById(panel_name + "_contents");
	if (!contents) {
		return undefined;
	}
	return contents.style.height == "0px";
}

function SwitchMachine(index) {
	state.active_machine_index = index;
	const new_active_machine = state.machines[index];
	state.save_file.active_machine = new_active_machine.id;
	state.redraw_all = true;
	state.update_stats_panel = true;
	state.update_upgrades = true;
	state.update_upgrade_buttons = true;
	state.update_buff_display = true;
	state.display_points = new_active_machine.GetSaveData().points;
	state.wheel_popup_text.length = 0;
	state.score_text.length = 0;
	state.ripples.length = 0;
	LoadActiveMachine(state);
	UpdateScoreDisplay(state, /*force_update=*/true);
	UpdateMachinesHeader(state);
	UpdateDarkMode();
	ResizeCanvas();

	for (let i = 0; i < state.score_history.length; ++i) {
		state.score_history[i] = 0;
	}

}

function UpdateOneFrame(state) {
	state.current_time += kFrameInterval;
	let machine = ActiveMachine(state);
	let save_data = machine.GetSaveData();
	const ball_types = machine.BallTypes();
	for (let i = 0; i < state.balls_by_type.length; ++i) {
		if (state.balls_by_type[i].length > 0) {
			UpdateBalls(
				state.balls_by_type[i],
				machine.board,
				ball_types[i].physics_params
			);
		}
	}

	if (save_data.score_buff_duration > 0) {
		save_data.score_buff_duration -= kFrameInterval;
		if (save_data.score_buff_duration <= 0) {
			save_data.score_buff_duration = 0;
			machine.OnBuffTimeout(state);
		}
		state.update_buff_display = true;
	}

	if (machine.AutoDropOn() && save_data.auto_drop_pos) {
		if (CanDrop(state)) {
			if (state.auto_drop_cooldown_left <= kFrameInterval) {
				state.auto_drop_cooldown_left = state.auto_drop_cooldown;
				let pos = save_data.auto_drop_pos;
				DropBall(pos.x, pos.y);
			} else {
				state.auto_drop_cooldown_left -= kFrameInterval;
			}
			if (state.auto_drop_cooldown >= kMinCooldownToDraw) {
				state.redraw_auto_drop = true;
			}
		}
	}

	if (machine.bonus_wheel && machine.bonus_wheel.IsSpinning()) {
		state.redraw_wheel = true;
		machine.bonus_wheel.UpdateOneFrame();
	} else if (machine.AutoSpinOn() && save_data.spins > 0) {
		SpinBonusWheel();
	}

	if (state.last_score_history_update + 5000.0 <= state.current_time) {
		UpdateScoreHistory(state);
		state.last_score_history_update = state.current_time;
	}
}

function IsAprilFoolsActive() {
	const april_fools_enabled = GetSetting("april_fools_enabled");
	if (april_fools_enabled == 0) {
		return false;
	}
	if (april_fools_enabled == 1) {
		return true;
	}
	const date = new Date();
	return date.getMonth() == 3 && date.getDate() == 1;
}

function MillisecondsToMidnight() {
  var now = new Date();
  var midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return (midnight - now);
}

function CheckEvents() {
	state.april_fools = IsAprilFoolsActive();

	if (state.timeouts.check_event) {
		clearTimeout(state.timeouts.check_event);
	}
	state.timeouts.check_event = setTimeout(CheckEvents, MillisecondsToMidnight());
}

function Update() {
	const num_frames = Math.floor(
		(Date.now() - state.current_time) / kFrameInterval
	);
	const elapsed = num_frames * kFrameInterval;
	if (num_frames <= 0) {
		return;
	}
	for (let i = 0; i < num_frames; ++i) {
		state.enable_score_text = num_frames - i < 60;
		UpdateOneFrame(state);
	}

	UpdateScoreDisplay(state, /*force_update=*/false);

	if (state.last_drawn.april_fools != state.april_fools) {
		state.redraw_all = true;
		state.last_drawn.april_fools = state.april_fools;
		if (state.april_fools) {
			state.notifications.push(new Notification("Happy April Fools Day!", "#F8F"));
		}
	}

	Draw(state);
	if (state.update_stats_panel && !IsCollapsed("stats")) {
		UpdateStatsPanel(state);
	}
	if (state.update_buff_display) {
		UpdateBuffDisplay(state);
		ActiveMachine(state).UpdateHyperSystemDisplay(state);
	}
	if (state.update_upgrades) {
		UpdateUpgrades(state);
	}
	if (state.update_upgrade_buttons && !IsCollapsed("upgrades")) {
		UpdateUpgradeButtons(state);
	}
}

function OnClick(event) {
	let canvas = document.getElementById(kTopCanvasLayer);
	let canvas_left = canvas.offsetLeft + canvas.clientLeft;
	let canvas_top = canvas.offsetTop + canvas.clientTop;
	let canvas_x = event.clientX - canvas_left;
	let canvas_y = event.clientY - canvas_top;
	if (state.april_fools) {
		canvas_x = canvas.width - canvas_x;
		canvas_y = canvas.height - canvas_y;
	}
	let board_x = canvas_x / state.canvas_scale;
	let board_y = canvas_y / state.canvas_scale;
	let pos = new Point(board_x, board_y);

	let machine = ActiveMachine(state);
	if (machine.board.CanDropAt(pos)) {
		let save_data = machine.GetSaveData();
		let time_since_prev_drop = state.current_time - state.last_ball_drop;
		if (time_since_prev_drop >= kManualDropCooldown && CanDrop(state)) {
			DropBall(board_x, board_y);
			++save_data.stats.balls_dropped_manual;
		}
		if (machine.AutoDropOn()) {
			save_data.auto_drop_pos = pos;
			state.redraw_auto_drop = true;
		}
	}
}

function UpdateDarkMode() {
	var color_scheme;
	if (GetSetting("dark_mode")) {
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
	InitMachinesHeader(state);
	let loaded_save = LoadFromLocalStorage();
	LoadActiveMachine(state);
	document.getElementById(kTopCanvasLayer).addEventListener("click", OnClick);
	document.title = kTitleAndVersion;
	document.getElementById("title_version").innerHTML = kTitleAndVersion;
	document.getElementById("version_ending").innerHTML = kVersion;
	if (loaded_save && ActiveMachine(state).GetSaveData().points) {
		UpdateScoreDisplay(state, /*force_update=*/true);
	} else {
		document.getElementById("message_box").innerHTML =
			"<h1>Welcome to Pachinkremental!</h1>" +
			"<h1>Click anywhere in the green box to drop a ball.</h1>";
	}
	let other_ver = kIsLiveVersion ? "live_ver_links" : "beta_ver_links";
	document.getElementById(other_ver).style.display = "inline-block";
	DisplayArchivedSaveFileButtons();
	UpdateDarkMode();

	window.onresize = OnResize;

	Draw(state);

	state.intervals.update = setInterval(Update, kFrameInterval);
	CheckEvents();

	console.log("Hi there! I don't mind if people hack/cheat, but if you make any screenshots, save files, videos, etc. that way, I'd appreciate it if you clearly label them as hacked. Thanks! --Poochy.EXE");
}
