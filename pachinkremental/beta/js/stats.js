
function InitStatsPanel(state) {
	const ball_types = ActiveMachine(state).BallTypes();
	let html = '';
	for (let id = 0; id < ball_types.length; ++id) {
		let type_name = ball_types[id].name + "_balls";
		html +=
			'<div id="stats_container_' + type_name +
			'_stat" class="statsRow" style="display: none;"><b>' +
			ball_types[id].display_name +
			'balls: </b><span id="stats_' + type_name +
			'_stat" class="statsEntry"></span></div>';
	}
	UpdateInnerHTML("stats_by_ball_type", html);
	
	UpdateDisplay("stats_container_max_buff_multiplier", "none");
	UpdateDisplay("stats_container_balls_dropped_manual", "none");
}

function UpdateStatsEntry(state, key, val) {
	let elem = document.getElementById("stats_" + key);
	if (!elem || val == null || val == undefined) {
		return;
	}
	let visible = (val != 0);
	if (key == "balls_dropped_manual") {
		visible = ActiveMachine(state).IsUnlocked("auto_drop");
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


function UpdateStatsByBallType() {
	const stat_type = document.getElementById("stats_by_ball_type_select").value;
	const machine = ActiveMachine(state);
	const ball_types = machine.BallTypes();
	const current_stats = machine.GetSaveData().stats;
	const ball_type_stat_funcs = {
		balls_dropped: (ball_type) =>
			current_stats[ball_type.name + "_balls"],
		total_points: (ball_type) =>
			current_stats[ball_type.name + "_balls_points_scored"],
		last5s_points: (ball_type) =>
			state.score_history_by_ball_type.last_5s[ball_type.id],
		last15s_points: (ball_type) =>
			state.score_history_by_ball_type.last_15s[ball_type.id],
		last60s_points: (ball_type) =>
			state.score_history_by_ball_type.last_60s[ball_type.id],
	};
	const stat_func = ball_type_stat_funcs[stat_type];
	
	for (let i = 0; i < ball_types.length; ++i) {
		let unlock_upgrade_id = BallTypeUnlockUpgradeID(ball_types[i]);
		let stat_name = ball_types[i].name + "_balls_stat";
		let is_unlocked = (i == 0) || machine.IsUnlocked(unlock_upgrade_id);
		let display = is_unlocked ? "block" : "none";
		let value = FormatNumberLong(stat_func(ball_types[i]));
		UpdateDisplay("stats_container_" + stat_name, display);
		UpdateInnerHTML("stats_" + stat_name, value);
	}
}

function IsAnySpecialBallUnlocked(state) {
	const machine = ActiveMachine(state);
	const ball_types = machine.BallTypes();
	for (let i = 1; i < ball_types.length; ++i) {
		if (machine.IsBallTypeUnlocked(ball_types[i])) {
			return true;
		}
	}
	return false;
}

function UpdateStatsPanel(state) {
	state.update_stats_panel = false;
	for (key in state.save_file.stats) {
		let val = state.save_file.stats[key];
		UpdateStatsEntry(state, key, val);
	}
	const machine_stats = ActiveMachine(state).GetSaveData().stats;
	for (key in machine_stats) {
		let val = machine_stats[key];
		UpdateStatsEntry(state, key, val);
	}

	if (IsAnySpecialBallUnlocked(state)) {
		UpdateDisplay("stats_container_stats_by_ball_type", "inline-block");
		UpdateStatsByBallType();
	} else {
		UpdateDisplay("stats_container_stats_by_ball_type", "none");
	}
}
