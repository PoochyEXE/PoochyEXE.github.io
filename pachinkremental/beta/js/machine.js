const kNormalBallType = new BallType(0, "normal", "Normal ", kPhysicsParams.normal, "#CCC", "#888", null);

class PachinkoMachine {
	constructor(id, display_name, ball_types) {
		this.id = id;
		this.display_name = display_name;
		this.ball_types = ball_types;
		this.board = this.InitBoard();
		this.upgrades = this.InitUpgrades();
		this.bonus_wheel = null;
		this.max_balls = 1;
		this.ball_type_rates = [1.0];
		for (let i = 1; i < ball_types.length; ++i) {
			let name = this.ball_types[i].name;
			let rate_upgrade = this.upgrades[name + "_ball_rate"];
			this.ball_type_rates.push(rate_upgrade.value_func(0) / 100.0);
		}
	}
	
	OnActivate() {}

	InitBoard() {
		console.error("Not implemented!");
	}

	InitUpgrades() {
		console.error("Not implemented!");
	}
	
	NextUpgradeHint() {
		console.error("Not implemented!");
	}
	
	DropBonusBalls(ball_types) {
		console.error("Not implemented!");
	}

	TogglePopupText() {
		let options = this.GetSaveData().options;
		options.display_popup_text = 1 - options.display_popup_text;
	}

	CurrentPopupTextOptionName() {
		return this.GetSetting("display_popup_text") ? "Enabled" : "Disabled";
	}
	
	BuffDisplayText() {
		return "";
	}

	DefaultSaveData() {
		let save_data = {
			points: 0,
			auto_drop_pos: null,
			stats: {
				total_score: 0,
				balls_dropped: 0,
				balls_dropped_manual: 0,
				target_hits: {}
			},
			upgrade_levels: {},
			options: {
				auto_drop_enabled: false,
				display_popup_text: 0,
				favicon: -1
			}
		}

		for (let upgrade_id in this.upgrades) {
			save_data.upgrade_levels[upgrade_id] = 0;
		}
		
		for (let i = 0; i < this.ball_types.length; ++i) {
			let name = this.ball_types[i].name;
			save_data.stats[name + "_balls"] = 0;
			save_data.options[name + "_ball_opacity"] = 100;
		}

		return save_data;
	}

	BallTypes() {
		return [kNormalBallType];
	}
	
	BallType(id) {
		return BallTypes()[id];
	}

	GetSaveData() {
		return state.save_file.machines[this.id];
	}
	
	GetSetting(id) {
		return this.GetSaveData().options[id];
	}

	AddScore(points) {
		let save_data = this.GetSaveData();
		save_data.stats.total_score += points;
		save_data.points += points;
		state.score_history[0] += points;
		state.update_stats_panel = true;
		state.update_upgrade_buttons = true;
	}

	UpgradeHeaders() {
		return [];
	}

	GetUpgradeLevel(upgrade_id) {
		if (!state) {
			return undefined;
		}
		return this.GetSaveData().upgrade_levels[upgrade_id];
	}

	GetUpgradeValue(upgrade_id) {
		if (!state) {
			return undefined;
		}
		return this.upgrades[upgrade_id].GetValue();
	}

	IsUnlocked(upgrade_id) {
		return this.GetUpgradeLevel(upgrade_id) > 0;
	}

	IsBallTypeUnlocked(ball_type) {
		return this.IsUnlocked(BallTypeUnlockUpgradeID(ball_type));
	}

	IsMaxed(upgrade_id) {
		if (!state) {
			return undefined;
		}
		return this.GetUpgradeLevel(upgrade_id) >= this.upgrades[upgrade_id].max_level;
	}

	IsUpgradeVisible(upgrade_id) {
		return this.upgrades[upgrade_id].visible_func();
	}

	AreAllUpgradesMaxed() {
		for (let id in this.upgrades) {
			if (!isFinite(this.upgrades[id].max_level)) {
				continue;
			}
			if (!this.IsMaxed(id)) {
				return false;
			}
		}
		return true;
	}

	AutoDropOn() {
		return this.IsUnlocked("auto_drop") &&
			this.GetSaveData().options.auto_drop_enabled;
	}

	AutoSpinOn() {
		return this.IsUnlocked("auto_spin") &&
			this.GetSaveData().options.auto_spin_enabled;
	}

	MultiSpinOn() {
		return this.IsUnlocked("multi_spin") &&
			this.GetSaveData().options.multi_spin_enabled;
	}

	AwardPoints(base_value, ball) {
		this.AddScore(base_value);
		MaybeAddScoreText({
			level: 0,
			text: `+${FormatNumberShort(base_value)}`,
			pos: ball.pos,
			color_rgb: "0,128,0"
		});
	}

	RollBallType() {
		const ball_types = this.BallTypes();
		let ball_type_roll = Math.random();
		for (let i = ball_types.length - 1; i > 0; --i) {
			if (!this.IsBallTypeUnlocked(ball_types[i])) {
				continue;
			}
			if (ball_type_roll < this.ball_type_rates[i]) {
				return i;
			} else {
				ball_type_roll -= this.ball_type_rates[i];
			}
		}
		return 0;
	}
}

function InitMachinesHeader(state) {
	let html = '';
	for (let i = 0; i < state.machines.length; ++i) {
		html += '<button type="button" class="machineButton" id="button_machine_'
			+ state.machines[i].id + '" onclick="SwitchMachine(\'' + i
			+ '\')">' + state.machines[i].display_name + '</button> '
	}
	UpdateInnerHTML("machine_buttons", html);
	UpdateMachinesHeader(state);
}

function UpdateMachinesHeader(state) {
	let container_elem = document.getElementById("machines_container");
	let is_maxed = [...Array(state.machines.length)].map((_, i) =>
		state.machines[i].AreAllUpgradesMaxed()
	);
	if (!is_maxed[0]) {
		UpdateDisplay("machines_container", "none");
		return;
	}
	UpdateDisplay("machines_container", "block");

	for (let i = 0; i < state.machines.length; ++i) {
		const active = (state.active_machine_index == i);
		const button_id = "button_machine_" + state.machines[i].id;
		let visible = true;
		if (i > 0) {
			visible = is_maxed[i - 1];
		}
		UpdateDisplay(button_id, visible ? "inline" : "none");
		document.getElementById(button_id).disabled = active || !visible;
		let html = "<b>" + state.machines[i].display_name + "</b>";
		if (is_maxed[i]) {
			html += "<br>Maxed!";
		}
		if (active) {
			html += "<br>(Active)";
		}
		UpdateInnerHTML(button_id, html);
	}
}