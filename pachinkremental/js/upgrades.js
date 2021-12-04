class Upgrade {
	constructor({
		machine,
		id,
		name,
		category,
		button_class,
		description,
		cost_func,
		value_func,
		max_level,
		value_suffix,
		visible_func,
		on_update,
		on_buy,
		tooltip_width,
	}) {
		this.machine = machine;
		this.id = id;
		this.name = name;
		this.category = category;
		if (button_class) {
			this.button_class = button_class;
		} else {
			this.button_class = ButtonClassForUpgradeCategory(category);
		}
		this.description = description;
		this.cost_func = cost_func;
		if (value_func) {
			this.value_func = value_func;
		} else {
			this.value_func = this.GetLevel;
		}
		this.max_level = max_level;
		this.value_suffix = value_suffix;
		const kNoop = () => {};
		if (visible_func) {
			this.visible_func = visible_func;
		} else {
			this.visible_func = () => true;
		}
		if (on_update) {
			this.on_update = on_update;
		} else {
			this.on_update = kNoop;
		}
		if (on_buy) {
			this.on_buy = on_buy;
		} else {
			this.on_buy = kNoop;
		}
		this.tooltip_width = tooltip_width;
	}

	IsMaxed() {
		return this.GetLevel() >= this.max_level;
	}

	ShouldEnableButton() {
		if (this.IsMaxed()) {
			return false;
		}
		if (this.GetCost() > this.machine.GetSaveData().points) {
			return false;
		}
		return true;
	}

	Update() {
		this.on_update();
		state.update_upgrade_buttons_all = true;
	}

	Buy() {
		let cost = this.GetCost();
		let save_data = this.machine.GetSaveData();
		if (save_data.points < cost) {
			return false;
		}
		if (this.IsMaxed()) {
			return false;
		}
		if (!save_data.upgrade_levels[this.id]) {
			save_data.upgrade_levels[this.id] = 0;
		}
		let new_level = ++save_data.upgrade_levels[this.id];
		save_data.points -= cost;
		this.Update();
		this.on_buy(new_level);
		if (new_level == this.max_level) {
			this.machine.CheckMachineMaxed();
		}
		return true;
	}

	OnClick() {
		if (state.holding_shift) {
			while (this.Buy());
		} else {
			this.Buy();
		}
	}

	GetLevel() {
		return this.machine.GetSaveData().upgrade_levels[this.id];
	}

	GetCost() {
		return this.cost_func(this.GetLevel());
	}

	GetValue() {
		return this.value_func(this.GetLevel());
	}

	GetText(state) {
		let result = "<b>" + this.name + "</b>";
		let level = this.GetLevel();
		result +=
			"<br>" +
			FormatNumberMedium(this.value_func(level)) +
			this.value_suffix;
		if (this.IsMaxed()) {
			result += " (MAX)";
		} else {
			let total_cost = this.cost_func(level);
			let level_after = level + 1;
			if (state.holding_shift) {
				const points_left = this.machine.GetSaveData().points;
				while (level_after < this.max_level) {
					let next_cost = total_cost + this.cost_func(level_after);
					if (next_cost <= points_left) {
						++level_after;
						total_cost = next_cost;
					} else {
						break;
					}
				}
			}
			result +=
				" \u2192 " +
				FormatNumberMedium(this.value_func(level_after)) +
				this.value_suffix;
			result += "<br>Cost: " + FormatNumberMedium(total_cost);
		}
		if (GetSetting("show_upgrade_levels")) {
			result += "<br>Bought: " + level;
		}
		return result;
	}
}

class DelayReductionUpgrade extends Upgrade {
	constructor({
		machine,
		id,
		name,
		category,
		button_class,
		description,
		cost_func,
		value_func,
		max_level,
		item_suffix,
		visible_func,
		on_update,
		on_buy,
		tooltip_width,
	}) {
		super({
			machine,
			id,
			name,
			category,
			button_class,
			description,
			cost_func,
			value_func,
			max_level,
			value_suffix: " ms",
			visible_func,
			on_update,
			on_buy,
			tooltip_width,
		});
		this.item_suffix = item_suffix;
	}

	GetText(state) {
		let result = "<b>" + this.name + "</b>";
		let level = this.GetLevel();
		let delay_now = this.value_func(level);
		let rate_now = 60000.0 / delay_now;
		if (this.IsMaxed()) {
			result +=
				"<br>" + FormatNumberMedium(delay_now) + this.value_suffix;
			result +=
				"<br>(" +
				FormatNumberMedium(rate_now) +
				" " +
				this.item_suffix +
				"/min) (MAX)";
		} else {
			let total_cost = this.cost_func(level);
			let level_after = level + 1;
			if (state.holding_shift) {
				const points_left = this.machine.GetSaveData().points;
				while (level_after <= this.max_level) {
					let next_cost = total_cost + this.cost_func(level_after);
					if (next_cost <= points_left) {
						++level_after;
						total_cost = next_cost;
					} else {
						break;
					}
				}
			}
			let delay_next = this.value_func(level_after);
			let rate_next = 60000.0 / delay_next;
			result +=
				"<br>" + FormatNumberMedium(delay_now) + this.value_suffix;
			result +=
				" \u2192 " + FormatNumberMedium(delay_next) + this.value_suffix;
			result += "<br>(" + FormatNumberMedium(rate_now);
			result += " \u2192 " + FormatNumberMedium(rate_next);
			result += " " + this.item_suffix + "/min)";
			result += "<br>Cost: " + FormatNumberMedium(total_cost);
		}
		if (GetSetting("show_upgrade_levels")) {
			result += "<br>Bought: " + level;
		}
		return result;
	}
}

class FeatureUnlockUpgrade extends Upgrade {
	constructor({
		machine,
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost_func,
		visible_func,
		on_update,
		on_buy,
		tooltip_width,
	}) {
		super({
			machine,
			id,
			name,
			category,
			button_class,
			description,
			cost_func,
			value_func: null,
			max_level: 1,
			value_suffix: "",
			visible_func,
			on_update,
			on_buy,
			tooltip_width,
		});
		if (unlocked_name) {
			this.unlocked_name = unlocked_name;
		} else {
			this.unlocked_name = name;
		}
	}

	GetText(state) {
		let result = "<b>" + this.name + "</b><br>";
		if (this.GetLevel() > 0) {
			return "<b>" + this.unlocked_name + "</b><br>Unlocked!";
		} else {
			return "<b>" + this.name + "</b><br>Cost: " + FormatNumberMedium(this.cost_func());
		}
		return result;
	}
}

class FixedCostFeatureUnlockUpgrade extends FeatureUnlockUpgrade {
	constructor({
		machine,
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost,
		visible_func,
		on_update,
		on_buy,
		tooltip_width,
	}) {
		super({
			machine,
			id,
			name,
			unlocked_name,
			category,
			button_class,
			description,
			cost_func: () => cost,
			visible_func,
			on_update,
			on_buy,
			tooltip_width,
		});
	}
}

class CirnoFixedCostUpgrade extends FixedCostFeatureUnlockUpgrade {
	constructor({
		machine,
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost,
		visible_func,
		on_update,
		on_buy,
		tooltip_width,
	}) {
		super({
			machine,
			id,
			name,
			unlocked_name,
			category,
			button_class,
			description,
			cost,
			visible_func,
			on_update,
			on_buy,
			tooltip_width,
		});
	}

	GetText(state) {
		return super.GetText(state).replace("9", "⑨");
	}
}

class ToggleUnlockUpgrade extends FixedCostFeatureUnlockUpgrade {
	constructor({
		machine,
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost,
		visible_func,
		on_update,
		on_buy,
		tooltip_width,
	}) {
		super({
			machine,
			id,
			name,
			unlocked_name,
			category,
			button_class,
			description,
			cost,
			visible_func,
			on_update,
			on_buy,
			tooltip_width,
		});
	}

	SaveFileKey() {
		return this.id + "_enabled";
	}

	GetToggleState() {
		return this.machine.GetSaveData().options[this.SaveFileKey()];
	}

	SetToggleState(new_state) {
		this.machine.GetSaveData().options[this.SaveFileKey()] = new_state;
	}

	OnClick() {
		if (this.GetLevel() == 0) {
			if (this.Buy()) {
				this.SetToggleState(true);
			}
		} else {
			this.SetToggleState(!this.GetToggleState());
		}
		this.Update();
	}

	GetText(state) {
		let result = "<b>" + this.name + "</b><br>";
		if (this.GetLevel() == 0) {
			result += "Cost: " + FormatNumberMedium(this.GetCost());
		} else if (this.GetToggleState()) {
			result += "ON";
		} else {
			result += "OFF";
		}
		return result;
	}

	ShouldEnableButton() {
		if (this.GetLevel() > 0) {
			return true;
		} else {
			return super.ShouldEnableButton();
		}
	}
}

function BallTypeUnlockUpgradeID(ball_type) {
	return "unlock_" + ball_type.name + "_balls";
}

class BallTypeUnlockUpgrade extends FeatureUnlockUpgrade {
	constructor({
		machine,
		ball_type,
		ball_description,
		cost_func,
		visible_func,
		tooltip_width,
	}) {
		super({
			machine,
			id: BallTypeUnlockUpgradeID(ball_type),
			name: "Unlock " + ball_type.display_name + "Balls",
			unlocked_name: ball_type.display_name + "Balls",
			category: ball_type.name + "_balls",
			description:
				"Unlock " + ball_type.display_name + "balls. " + ball_description,
			cost_func,
			visible_func,
			on_update: () => {
				let display = (this.GetValue() > 0) ? "block" : "none";
				UpdateDisplay(ball_type.name + "_ball_opacity_wrapper", display);
				UpdateDisplay(ball_type.name + "_favicon_wrapper", display);
				UpdateFavicon(state);
			},
			tooltip_width,
			on_buy: UpdateOptionsButtons
		});
	}
}

class BallTypeRateUpgrade extends Upgrade {
	constructor({ machine, ball_type, cost_func, value_func, max_level }) {
		super({
			machine,
			id: ball_type.name + "_ball_rate",
			name: ball_type.display_name + "Ball Rate",
			category: ball_type.name + "_balls",
			description:
				"Increases the probability of dropping " +
				ball_type.display_name + "balls.",
			cost_func: cost_func,
			value_func: value_func,
			max_level: max_level,
			value_suffix: "%",
			visible_func: () =>
				machine.IsBallTypeUnlocked(ball_type),
			on_update: () => {
				machine.ball_type_rates[ball_type.id] =
					this.GetValue() / 100.0;
			},
			on_buy: null
		});
	}
}

class UpgradeHeader {
	constructor(machine, id, display_name, visible_func, categories, explanation_html) {
		this.machine = machine;
		this.id = id;
		this.display_name = display_name;
		if (visible_func) {
			this.visible_func = visible_func;
		} else {
			this.visible_func = () => true;
		}
		if (categories) {
			this.categories = categories;
		} else {
			this.categories = [id];
		}
		this.explanation_html = explanation_html;
	}

	ToHTML() {
		let html =
			'<div id="' + this.id + '_upgrades_container" class="upgradesContainer">' +
			'<button type="button" class="upgradesSubHeader" id="button_' +
			this.id + '_header" onclick="ToggleVisibility(\''+ this.id + '\')">' +
			'<span id="' + this.id + '_collapsed">[&ndash;]</span> ' +
			this.display_name +
			'<span id="' + this.id + '_header_new" class="upgradeHeaderNew" style="display: none;"><sup>New!</sup></span>' +
			'</button>' +
			'<div id="' + this.id + '_contents" class="upgradesContents" style="display: block;">';
		if (this.explanation_html) {
			html +=
				'<div id="' + this.id +
				'_explantion" class="messageBox" style="padding-top: 5px; padding-bottom: 5px;">' +
				this.explanation_html + '</div>'
		}
		for (let i = 0; i < this.categories.length; ++i) {
			html +=
				'<div id="' + this.categories[i] +
				'_contents" class="upgradesContents" style="display: inline-block;"></div>';
		}
		html += '</div></div>'
		return html;
	}
}

class SingleBallTypeUpgradeHeader extends UpgradeHeader {
	constructor(machine, ball_type, explanation_html) {
		super(
			machine,
			/*id=*/ball_type.name + "_balls",
			/*display_name=*/ball_type.display_name + "Balls",
			/*visible_func=*/() => machine.IsUpgradeVisible(BallTypeUnlockUpgradeID(ball_type)),
			null,
			explanation_html
		);
	}
}

function InitUpgradeHeaderCollapsibles(upgrade_headers) {
	let html = '';
	for (let i = 0; i < upgrade_headers.length; ++i) {
		html += upgrade_headers[i].ToHTML();
	}
	document.getElementById("upgrade_headers").innerHTML = html;
}

function ButtonClassForUpgradeCategory(category) {
	if (category == "ruby_balls") {
		return "rubyUpgradeButton";
	} else if (category == "sapphire_balls") {
		return "sapphireUpgradeButton";
	} else if (category == "emerald_balls") {
		return "emeraldUpgradeButton";
	} else if (category == "topaz_balls") {
		return "topazUpgradeButton";
	} else if (category == "turquoise_balls") {
		return "turquoiseUpgradeButton";
	} else if (category == "amethyst_balls") {
		return "amethystUpgradeButton";
	} else if (category == "opal_balls") {
		return "opalUpgradeButton";
	} else if (category == "eight_balls") {
		return "eightBallUpgradeButton";
	} else if (category == "beach_balls") {
		return "beachBallUpgradeButton";
	} else if (category == "rubberband_balls") {
		return "rubberBandBallUpgradeButton";
	} else if (category == "spiral_balls") {
		return "spiralBallUpgradeButton";
	} else {
		return "upgradeButton";
	}
}

function InitUpgradeButtons(upgrades) {
	for (let upgrade_id in upgrades) {
		let upgrade = upgrades[upgrade_id];
		let category_div_id = upgrade.category + "_contents";
		let category_div = document.getElementById(category_div_id);
		category_div.innerHTML +=
			'<div class="upgradeButtonWrapper" id="' +
			upgrade_id +
			'" onmouseenter="ShowUpgradeTooltip(this)" onmouseleave="HideButtonTooltip(this)">' +
			'<button type="button" class="' +
			upgrade.button_class +
			'" id="button_upgrade_' +
			upgrade.id +
			'" onclick="UpgradeButtonHandler(this)"></button></div>';
	}
}

function UpdateUpgrades(state) {
	state.update_upgrades = false;
	let upgrades = ActiveMachine(state).upgrades;
	for (let id in upgrades) {
		upgrades[id].Update();
	}
}

function UpgradeButtonHandler(elem) {
	const kPrefix = "button_upgrade_";
	console.assert(elem.id.indexOf(kPrefix) == 0);
	let upgrade_id = elem.id.slice(kPrefix.length);
	ActiveMachine(state).upgrades[upgrade_id].OnClick();
}

function UpdateUpgradeButtonsText(state) {
	state.update_upgrade_buttons_text = false;
	const machine = ActiveMachine(state);
	UpdateInnerHTML("next_upgrade_hint", machine.NextUpgradeHint());
	for (let id in machine.upgrades) {
		const upgrade = machine.upgrades[id];
		UpdateInnerHTML("button_upgrade_" + id, upgrade.GetText(state));
	}
}

function UpdateUpgradeButtonsEnabled(state) {
	state.update_upgrade_buttons_enabled = false;
	const machine = ActiveMachine(state);
	UpdateInnerHTML("next_upgrade_hint", machine.NextUpgradeHint());
	for (let id in machine.upgrades) {
		const upgrade = machine.upgrades[id];
		let elem = document.getElementById("button_upgrade_" + id);
		let disabled = !upgrade.ShouldEnableButton();
		if (elem.disabled != disabled) {
			elem.disabled = disabled;
		}
		if (disabled && GetSetting("maxed_upgrades") == 1 && upgrade.IsMaxed()) {
			elem.classList.add("upgradeButtonMaxedShrink");
		} else {
			elem.classList.remove("upgradeButtonMaxedShrink");
		}
	}
}

function UpdateUpgradeButtonsVisible(state) {
	state.update_upgrade_buttons_visible = false;
	const machine = ActiveMachine(state);
	UpdateInnerHTML("next_upgrade_hint", machine.NextUpgradeHint());
	for (let id in machine.upgrades) {
		const upgrade = machine.upgrades[id];
		let elem = document.getElementById("button_upgrade_" + id);
		let visible = upgrade.visible_func();
		let display = visible ? "inline" : "none";
		if (elem.style.display != display) {
			elem.style.display = display;
			if (visible && !machine.IsUnlocked(id)) {
				let header =
					state.upgrade_category_to_header_map[upgrade.category];
				if (IsCollapsed(header)) {
					UpdateDisplay(header + "_header_new", "inline");
				}
				if (IsCollapsed("upgrades")) {
					UpdateDisplay("upgrades_header_new", "inline");
				}
			}
		}
	}

	for (let i = 0; i < state.upgrade_headers.length; ++i) {
		let header = state.upgrade_headers[i];
		let display = header.visible_func() ? "inline-block" : "none";
		UpdateDisplay(header.id + "_upgrades_container", display);
	}
}

function UpdateUpgradeButtonsAll(state) {
	state.update_upgrade_buttons_all = false;
	UpdateUpgradeButtonsText(state);
	UpdateUpgradeButtonsEnabled(state);
	UpdateUpgradeButtonsVisible(state);
}

function ShowUpgradeTooltip(elem) {
	const upgrade = ActiveMachine(state).upgrades[elem.id];
	ShowButtonTooltip(elem, upgrade.description, upgrade.tooltip_width);
}

function CurrentPlayTime() {
	return Date.now() - state.save_file.stats.start_time;
}

function ShowEndingIfAllMachinesMaxed() {
	for (let i = 0; i < state.machines.length; ++i) {
		if (!state.machines[i].AreAllUpgradesMaxed()) {
			return false;
		}
	}

	let play_time = FormatDurationLong(CurrentPlayTime(), /*show_ms=*/true);
	UpdateInnerHTML("ending_play_time", play_time);
	document.getElementById("ending_modal").style.display = "block";
	return true;
}
