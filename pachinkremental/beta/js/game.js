const kVersion = "v2.2.0-beta";
const kTitleAndVersion = "Pachinkremental " + kVersion;

const kFrameInterval = 1000.0 / kPhysicsFPS;

const kManualDropCooldown = 80.0;
const kTopCanvasLayer = "canvas_ripples";

function LoadActiveMachine(state) {
	state.update_stats_panel = true;
	state.update_upgrade_buttons_all = true;
	state.update_upgrades = true;
	state.update_buff_display = true;
	state.redraw_all = true;

	state.board_glow.color = null;
	state.board_glow.size = null;

	UpdateDisplay("hyper_system", "none");
	UpdateDisplay("spiral_power", "none");

	const machine = ActiveMachine(state);
	const num_ball_types = machine.BallTypes().length;
	const save_data = machine.GetSaveData();
	machine.OnActivate();
	state.display_points = save_data.points;
	state.balls_by_type = [...Array(num_ball_types)].map(_ => new Array(0));
	state.wheel_popup_text.length = 0;
	state.score_text.length = 0;
	state.ripples.length = 0;

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
	UpdateHitRatesDisplay(state);
	UpdateMachinesHeader(state);
	UpdateDarkMode();
	UpdateOpalBallUpgradesStyle();
	ResizeCanvas(state, machine.board);
	OnResize();
}

function InitState() {
	let bgm_gain_node = kAudioCtx.createGain();
	bgm_gain_node.connect(kAudioCtx.destination);
	let state = {
		game_started: false,
		all_maxed: false,
		current_time: performance.now(),
		machines: [
			new FirstMachine(kFirstMachineID, "Basic"),
			new BumperMachine(kBumperMachineID, "Bumpers"),
		],
		bgm_gain_node: bgm_gain_node,
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
		last_score_history_update: performance.now(),
		last_ball_drop: 0,
		board_glow: {
			color: null,
			size: null,
		},
		notifications: new Array(0),
		upgrade_headers: null,
		upgrade_category_to_header_map: {},
		display_points: 0,
		canvas_scale: 2.0,
		frames_since_redraw: 0,
		redraw_rate: 1,
		redraw_all: true,
		redraw_targets: false,
		redraw_auto_drop: false,
		redraw_stats_overlay: false,
		redraw_wheel: false,
		redraw_board_glow: false,
		redraw_whirlpools: false,
		redraw_portals: false,
		reset_target_text: false,
		update_stats_panel: true,
		update_upgrades: true,
		update_upgrade_buttons_all: true,
		update_upgrade_buttons_text: true,
		update_upgrade_buttons_enabled: true,
		update_upgrade_buttons_visible: true,
		update_buff_display: true,
		enable_score_text: true,
		auto_drop_cooldown: 1000.0,
		auto_drop_cooldown_left: 1000.0,
		active_tooltip: null,
		wheel_popup_text: new Array(0),
		ripples: new Array(0),
		holding_shift: false,
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
				machine_maxed_times: {},
				il_speedrun_pbs: {},
			},
			machines: {},
			options: DefaultGlobalSettings(),
		},
		il_speedrun_active: false,
		il_speedrun_complete: false,
		il_speedrun_temp_save: null,
	};
	for (let i = 0; i < state.machines.length; ++i) {
		let machine = state.machines[i];
		let id = machine.id;
		state.save_file.machines[id] = machine.DefaultSaveData();
		state.save_file.stats.machine_maxed_times[id] = null;
		state.save_file.stats.il_speedrun_pbs[id] = null;
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

function SwitchMachine(index) {
	if (state.il_speedrun_active && !state.il_speedrun_complete) {
		const kConfirmMessage =
			"Are you sure you want to abandon your current IL speedrun?";
		let answer = confirm(kConfirmMessage);
		// Hacky workaround for the fact that we won't see an onkeyup event
		// while the confirmation dialog is up.
		state.holding_shift = false;
		if (!answer) {
			return;
		}
	}
	
	ActiveMachine(state).OnDeactivate();
	state.active_machine_index = index;
	const new_active_machine = state.machines[index];
	state.save_file.active_machine = new_active_machine.id;

	if (state.holding_shift) {
		SpeedrunTimerStarted(state);
		state.il_speedrun_active = true;
		state.il_speedrun_complete = false;
		state.il_speedrun_temp_save = ActiveMachine(state).DefaultSaveData();
	} else {
		state.il_speedrun_active = false;
		state.il_speedrun_complete = false;
		state.il_speedrun_temp_save = null;
		if (state.all_maxed) {
			StopSpeedrunTimer(state);
		} else {
			SpeedrunTimerStarted(state);
			UpdateSpeedrunTimer(state);
		}
	}

	LoadActiveMachine(state);
	UpdateScoreDisplay(state, /*force_update=*/true);
}

function ILSpeedrunComplete(machine_name, time_elapsed_ms, is_new_pb) {
	let time_elapsed_text = FormatDurationLong(time_elapsed_ms, /*show_ms=*/true);
	UpdateInnerHTML("il_speedrun_complete_time", time_elapsed_text);
	UpdateInnerHTML("il_speedrun_complete_machine_name", machine_name);
	UpdateDisplay("il_speedrun_new_pb", is_new_pb ? "block" : "none");
	UpdateDisplay("il_speedrun_complete_modal", "block");
	StopILSpeedrunTimer(state, time_elapsed_ms);
	state.il_speedrun_complete = true;
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
				ball_types[i].physics_params,
				state.current_time,
			);
		}
	}

	if (save_data.score_buff_duration > 0) {
		let elapsed = kFrameInterval;
		if (save_data.score_buff_time_dilation > 1.0) {
			elapsed /= save_data.score_buff_time_dilation;
		}
		save_data.score_buff_duration -= elapsed;
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

	machine.UpdateOneFrame(state);
	machine.board.UpdateOneFrame(state);

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

function CheckShiftKeyToggle(event) {
	if (state.holding_shift != event.shiftKey) {
		state.holding_shift = event.shiftKey;
		state.update_upgrade_buttons_text = true;
		UpdateMachinesHeader(state);
	}
}

function OnKeyUp(event) {
	CheckShiftKeyToggle(event);
}

function OnKeyDown(event) {
	CheckShiftKeyToggle(event);
}

function Update() {
	const num_frames = Math.floor(
		(performance.now() - state.current_time) / kFrameInterval
	);
	for (let i = 0; i < num_frames; ++i) {
		state.enable_score_text = (num_frames - i) < 60;
		UpdateOneFrame(state);
	}
	state.frames_since_redraw += num_frames;
}

function OnAnimationFrame() {
	Update();
	if (state.frames_since_redraw < state.redraw_rate) {
		requestAnimationFrame(OnAnimationFrame);
		return;
	}
	state.frames_since_redraw = 0;

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
	}
	if (state.update_upgrades) {
		UpdateUpgrades(state);
	}
	if (!IsCollapsed("upgrades")) {
		if (state.update_upgrade_buttons_all) {
			UpdateUpgradeButtonsAll(state);
		}
		if (state.update_upgrade_buttons_text) {
			UpdateUpgradeButtonsText(state);
		}
		if (state.update_upgrade_buttons_enabled) {
			UpdateUpgradeButtonsEnabled(state);
		}
		if (state.update_upgrade_buttons_visible) {
			UpdateUpgradeButtonsVisible(state);
		}
	}
	UpdateSpeedrunTimer(state);

	requestAnimationFrame(OnAnimationFrame);
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
			if (save_data.stats.balls_dropped == 0) {
				let timestamp = Date.now();
				save_data.stats.start_time = timestamp;
				if (!state.game_started) {
					state.game_started = true;
					state.save_file.stats.start_time = timestamp;
				}
			}
			DropBall(board_x, board_y);
			++save_data.stats.balls_dropped_manual;
		}
		if (machine.AutoDropOn()) {
			save_data.auto_drop_pos = pos;
			state.redraw_auto_drop = true;
			if (GetSetting("auto_reset_hit_rates")) {
				ResetHitRates();
			}
		}
	}
}

var state = InitState();

function OnResize() {
	state.redraw_all = true;
	ResizeCanvas(state, ActiveMachine(state).board);
	ResizeModals();
}

function Load() {
	InitMachinesHeader(state);
	let loaded_save = LoadFromLocalStorage();
	if (!loaded_save) {
		LoadActiveMachine(state);
	}
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
	UpdateOpalBallUpgradesStyle();
	UpdateRedrawRate();

	window.onresize = OnResize;

	window.addEventListener("beforeunload", function (e) {
		if (state.il_speedrun_active && !state.il_speedrun_complete) {
			const kConfirmMessage = "Are you sure you want to quit? "
				+ "Your IL speedrun will not be saved!";
			(e || window.event).returnValue = kConfirmMessage;  // Gecko + IE
			return kConfirmMessage;  // Gecko + Webkit, Safari, Chrome etc.
		}
	});

	Draw(state);

	requestAnimationFrame(OnAnimationFrame);

	// Additional update once per second for when the tab is inactive, to avoid
	// a giant lag spike trying to catch up when regaining focus after being
	// inactive for several minutes.
	state.intervals.update = setInterval(Update, 1000);

	CheckEvents();

	console.log("Hi there! I don't mind if people hack/cheat, but if you make any screenshots, save files, videos, etc. that way, I'd appreciate it if you clearly label them as hacked. Thanks! --Poochy.EXE");
}
