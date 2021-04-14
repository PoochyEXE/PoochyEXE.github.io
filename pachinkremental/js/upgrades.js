class Upgrade {
	constructor({
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
		on_buy
	}) {
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
		this.cost = cost_func(0);
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
	}

	ShouldEnableButton() {
		if (this.GetLevel() >= this.max_level) {
			return false;
		}
		if (this.GetCost() > state.save_file.points) {
			return false;
		}
		return true;
	}

	Update() {
		this.on_update();
		state.update_upgrade_buttons = true;
	}

	Buy() {
		let cost = this.GetCost();
		if (state.save_file.points < cost) {
			return false;
		}
		if (this.GetLevel() >= this.max_level) {
			return false;
		}
		++state.save_file.upgrade_levels[this.id];
		state.save_file.points -= cost;
		this.Update();
		this.on_buy();
		if (this.GetLevel() == this.max_level) {
			ShowEndingIfAllUpgradesMaxed();
		}
		return true;
	}

	OnClick() {
		this.Buy();
	}

	GetLevel() {
		return state.save_file.upgrade_levels[this.id];
	}

	GetCost() {
		return this.cost_func(this.GetLevel());
	}

	GetValue() {
		return this.value_func(this.GetLevel());
	}

	GetText() {
		let result = "<b>" + this.name + "</b>";
		let level = this.GetLevel();
		result +=
			"<br>" +
			FormatNumberShort(this.value_func(level)) +
			this.value_suffix;
		if (level >= this.max_level) {
			result += " (MAX)";
		} else {
			result +=
				" \u2192 " +
				FormatNumberShort(this.value_func(level + 1)) +
				this.value_suffix;
			result += "<br>Cost: " + FormatNumberShort(this.cost_func(level));
		}
		if (state.save_file.options.show_upgrade_levels) {
			result += "<br>Bought: " + level;
		}
		return result;
	}
}

class DelayReductionUpgrade extends Upgrade {
	constructor({
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
		on_buy
	}) {
		super({
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
			on_buy
		});
		this.item_suffix = item_suffix;
	}

	GetText() {
		let result = "<b>" + this.name + "</b>";
		let level = this.GetLevel();
		let delay_now = this.value_func(level);
		let rate_now = 60000.0 / delay_now;
		if (level >= this.max_level) {
			result +=
				"<br>" + FormatNumberShort(delay_now) + this.value_suffix;
			result +=
				"<br>(" +
				FormatNumberShort(rate_now) +
				" " +
				this.item_suffix +
				"/min) (MAX)";
		} else {
			let delay_next = this.value_func(level + 1);
			let rate_next = 60000.0 / delay_next;
			result +=
				"<br>" + FormatNumberShort(delay_now) + this.value_suffix;
			result +=
				" \u2192 " + FormatNumberShort(delay_next) + this.value_suffix;
			result += "<br>(" + FormatNumberShort(rate_now);
			result += " \u2192 " + FormatNumberShort(rate_next);
			result += " " + this.item_suffix + "/min)";
			result += "<br>Cost: " + FormatNumberShort(this.cost_func(level));
		}
		if (state.save_file.options.show_upgrade_levels) {
			result += "<br>Bought: " + level;
		}
		return result;
	}
}

class FeatureUnlockUpgrade extends Upgrade {
	constructor({
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost_func,
		visible_func,
		on_update,
		on_buy
	}) {
		super({
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
			on_buy
		});
		if (unlocked_name) {
			this.unlocked_name = unlocked_name;
		} else {
			this.unlocked_name = name;
		}
	}

	GetText() {
		let result = "<b>" + this.name + "</b><br>";
		if (this.GetLevel() == 0) {
			return "<b>" + this.name + "</b><br>Cost: " + FormatNumberShort(this.cost_func());
		} else {
			return "<b>" + this.unlocked_name + "</b><br>Unlocked!";
		}
		return result;
	}
}

class FixedCostFeatureUnlockUpgrade extends FeatureUnlockUpgrade {
	constructor({
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost,
		visible_func,
		on_update,
		on_buy
	}) {
		super({
			id,
			name,
			unlocked_name,
			category,
			button_class,
			description,
			cost_func: () => cost,
			visible_func,
			on_update,
			on_buy
		});
	}
}

class ToggleUnlockUpgrade extends FixedCostFeatureUnlockUpgrade {
	constructor({
		id,
		name,
		unlocked_name,
		category,
		button_class,
		description,
		cost,
		visible_func,
		on_update,
		on_buy
	}) {
		super({
			id,
			name,
			unlocked_name,
			category,
			button_class,
			description,
			cost,
			visible_func,
			on_update,
			on_buy
		});
	}

	SaveFileKey() {
		return this.id + "_enabled";
	}

	GetToggleState() {
		return state.save_file.options[this.SaveFileKey()];
	}

	SetToggleState(new_state) {
		state.save_file.options[this.SaveFileKey()] = new_state;
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

	GetText() {
		let result = "<b>" + this.name + "</b><br>";
		if (this.GetLevel() == 0) {
			result += "Cost: " + FormatNumberShort(this.cost);
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

class BallTypeUnlockUpgrade extends FeatureUnlockUpgrade {
	constructor({ ball_type, ball_description, cost_func, visible_func }) {
		super({
			id: `unlock_${ball_type.name}_balls`,
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
				UpdateFavicon();
			},
		});
	}
}

class BallTypeRateUpgrade extends Upgrade {
	constructor({ ball_type, cost_func, value_func, max_level }) {
		super({
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
				IsUnlocked("unlock_" + ball_type.name + "_balls"),
			on_update: () => {
				state.ball_type_rates[ball_type.id] = this.GetValue() / 100.0;
			},
			on_buy: null
		});
	}
}

class UpgradeHeader {
	constructor(id, display_name, visible_func, categories, explanation_html) {
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
	constructor(ball_type, explanation_html) {
		super(
			/*id=*/ball_type.name + "_balls",
			/*display_name=*/ball_type.display_name + "Balls",
			/*visible_func=*/() => IsUpgradeVisible("unlock_" + ball_type.name + "_balls"),
			null,
			explanation_html
		);
	}
}

function InitUpgradeHeaders(state) {
	return [
		new UpgradeHeader("board", "Board"),
		new UpgradeHeader("auto_drop", "Auto-Drop", state.upgrades["auto_drop"].visible_func),
		new UpgradeHeader("bonus_wheel", "Bonus Wheel", state.upgrades["unlock_bonus_wheel"].visible_func),
		new SingleBallTypeUpgradeHeader(kBallTypes[kBallTypeIDs.GOLD]),
		new SingleBallTypeUpgradeHeader(kBallTypes[kBallTypeIDs.EIGHT_BALL]),
		new SingleBallTypeUpgradeHeader(kBallTypes[kBallTypeIDs.BEACH_BALL]),
		new UpgradeHeader(
			"gemstone_balls",
			"Gemstone Balls",
			ShouldDisplayGemstoneBallUpgrades,
			[
				"ruby_balls",
				"topaz_balls",
				"emerald_balls",
				"turquoise_balls",
				"sapphire_balls",
				"amethyst_balls",
				"opal_balls"
			],
			"Gemstone balls have the benefits of gold balls, plus additional bonuses.<br>NOTE: Unlocking one gemstone ball sharply increases the cost of unlocking the others!"
		),
	];
}

function InitUpgradeHeaderCollapsibles(upgrade_headers) {
	let html = '';
	for (let i = 0; i < upgrade_headers.length; ++i) {
		html += upgrade_headers[i].ToHTML();
	}
	document.getElementById("upgrade_headers").innerHTML = html;
}

function GetUpgradeLevel(upgrade_id) {
	if (!state) {
		return undefined;
	}
	return state.save_file.upgrade_levels[upgrade_id];
}

function IsUnlocked(upgrade_id) {
	return GetUpgradeLevel(upgrade_id) > 0;
}

function IsMaxed(upgrade_id) {
	if (!state) {
		return undefined;
	}
	return GetUpgradeLevel(upgrade_id) >= state.upgrades[upgrade_id].max_level;
}

function IsUpgradeVisible(upgrade_id) {
	return state.upgrades[upgrade_id].visible_func();
}

function AutoDropOn() {
	return IsUnlocked("auto_drop") && state.save_file.options.auto_drop_enabled;
}

function AutoSpinOn() {
	return IsUnlocked("auto_spin") && state.save_file.options.auto_spin_enabled;
}

function MultiSpinOn() {
	return IsUnlocked("multi_spin") && state.save_file.options.multi_spin_enabled;
}

function HasEightBallSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.EIGHT_BALL ||
		ball_type_index == kBallTypeIDs.BEACH_BALL
	);
}


function HasOpalSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.OPAL ||
		HasEightBallSpecial(ball_type_index)
	);
}

function HasRubySpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.RUBY ||
		ball_type_index == kBallTypeIDs.TOPAZ ||
		ball_type_index == kBallTypeIDs.AMETHYST ||
		HasOpalSpecial(ball_type_index)
	);
}

function HasSapphireSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.SAPPHIRE ||
		ball_type_index == kBallTypeIDs.TURQUOISE ||
		ball_type_index == kBallTypeIDs.AMETHYST ||
		HasOpalSpecial(ball_type_index)
	);
}

function HasEmeraldSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.EMERALD ||
		ball_type_index == kBallTypeIDs.TOPAZ ||
		ball_type_index == kBallTypeIDs.TURQUOISE ||
		HasOpalSpecial(ball_type_index)
	);
}

function HasTopazSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.TOPAZ ||
		HasOpalSpecial(ball_type_index)
	);
}

function HasTurquoiseSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.TURQUOISE ||
		HasOpalSpecial(ball_type_index)
	);
}

function HasAmethystSpecial(ball_type_index) {
	return (
		ball_type_index == kBallTypeIDs.AMETHYST ||
		HasOpalSpecial(ball_type_index)
	);
}

function IsScoreBuffActive() {
	return state.save_file.score_buff_multiplier > 1 &&
		state.save_file.score_buff_duration > 0;
}

function ActivateOrExtendScoreBuff(multiplier) {
	const kBuffDuration = 60000.0;
	if (!IsUnlocked("ruby_ball_buff_stackable") || !IsScoreBuffActive()) {
		state.save_file.score_buff_multiplier = multiplier;
		state.save_file.score_buff_duration = kBuffDuration;
	} else {
		let stacks = state.save_file.score_buff_multiplier - 1.0;
		state.save_file.score_buff_duration +=
			(kBuffDuration / stacks) * (multiplier - 1.0);
		if (state.save_file.score_buff_duration > kBuffDuration) {
			state.save_file.score_buff_multiplier *=
				(state.save_file.score_buff_duration / kBuffDuration);
			state.save_file.score_buff_duration = kBuffDuration;
		}
	}
	if (state.save_file.stats.max_buff_multiplier < state.save_file.score_buff_multiplier) {
		state.save_file.stats.max_buff_multiplier = state.save_file.score_buff_multiplier;
	}
}

function OnCenterSlotHit(ball) {
	let text_pos = new Point(ball.pos.x, ball.pos.y - 10);
	if (
		HasTurquoiseSpecial(ball.ball_type_index) &&
		IsUnlocked("turquoise_synergy")
	) {
		AwardSpins(ball, text_pos);
		text_pos.y -= 10;
	}
	if (HasRubySpecial(ball.ball_type_index)) {
		let multiplier = 2.0;
		let color_rgb = "255,0,0"
		let text_level = 2;
		if (ball.ball_type_index == kBallTypeIDs.BEACH_BALL) {
			multiplier = 16;
			color_rgb = kPrismatic;
			text_level = 3;
		} else if (ball.ball_type_index == kBallTypeIDs.EIGHT_BALL) {
			multiplier = 8;
			color_rgb = k8BallHighlightColor;
			text_level = 3;
		} else if (
			HasTopazSpecial(ball.ball_type_index) &&
			IsUnlocked("topaz_synergy")
		) {
			multiplier = state.emerald_ball_exponent;
			color_rgb = "255,255,0"
		}
		let mult_display = FormatNumberShort(multiplier);
		MaybeAddScoreText({
			level: text_level,
			text: mult_display + "\u00D7 scoring!",
			pos: text_pos,
			color_rgb: color_rgb
		});
		ActivateOrExtendScoreBuff(multiplier);
	}
}

function ShouldDisplayGemstoneBallUpgrades() {
	return IsMaxed("gold_ball_rate") && IsUnlocked("unlock_bonus_wheel");
}

function NthGemstoneBallUnlockCost(n) {
	return 1e12 * Math.pow(2000, n - 1);
}

function NumGemstoneBallsUnlocked() {
	let prev_unlocks = 0;
	if (state) {
		if (IsUnlocked("unlock_ruby_balls")) {
			++prev_unlocks;
		}
		if (IsUnlocked("unlock_sapphire_balls")) {
			++prev_unlocks;
		}
		if (IsUnlocked("unlock_emerald_balls")) {
			++prev_unlocks;
		}
		if (IsUnlocked("unlock_topaz_balls")) {
			++prev_unlocks;
		}
		if (IsUnlocked("unlock_turquoise_balls")) {
			++prev_unlocks;
		}
		if (IsUnlocked("unlock_amethyst_balls")) {
			++prev_unlocks;
		}
	}
	return prev_unlocks;
}

function GemstoneBallUnlockCost() {
	let prev_unlocks = NumGemstoneBallsUnlocked();
	return NthGemstoneBallUnlockCost(prev_unlocks + 1);
}

function Tier1GemstoneBallRateCostFunc(level) {
	return 5e12 * Math.pow(5, level);
}

function Tier2GemstoneBallRateCostFunc(level) {
	return 5e18 * Math.pow(5, level);
}

function GemstoneBallRateValueFunc(level) {
	return (level + 1) / 5.0;
}

function AllTier1GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return (
		IsUnlocked("unlock_ruby_balls") &&
		IsUnlocked("unlock_sapphire_balls") &&
		IsUnlocked("unlock_emerald_balls")
	);
}

function AnyTier1GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return (
		IsUnlocked("unlock_ruby_balls") ||
		IsUnlocked("unlock_sapphire_balls") ||
		IsUnlocked("unlock_emerald_balls")
	);
}

function AllTier2GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return (
		IsUnlocked("unlock_topaz_balls") &&
		IsUnlocked("unlock_turquoise_balls") &&
		IsUnlocked("unlock_amethyst_balls")
	);
}

function AnyTier2GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return (
		IsUnlocked("unlock_topaz_balls") ||
		IsUnlocked("unlock_turquoise_balls") ||
		IsUnlocked("unlock_amethyst_balls")
	);
}

function InitUpgrades() {
	const kTimesSymbol = "\u00D7";
	let upgrades_list = new Array();
	upgrades_list.push(
		new Upgrade({
			id: "multiplier",
			name: "Point Multiplier",
			category: "board",
			description: "Multipiles all point gains.",
			cost_func: level => 200 * Math.pow(200, level),
			value_func: level => Math.pow(5, level),
			max_level: Infinity,
			value_suffix: kTimesSymbol,
			visible_func: null,
			on_update: UpdateBottomTargets,
			on_buy: () => {
				let bottom_targets = state.target_sets[0].targets;
				let popup_text = kTimesSymbol + "5";
				for (let i = 0; i < bottom_targets.length; ++i) {
					MaybeAddScoreText({
						level: 3,
						text: popup_text,
						pos: bottom_targets[i].pos,
						color_rgb: "0,0,255"
					});
				}
				state.bonus_wheel.UpdateAllSpaces();
			}
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "center_value",
			name: "Center Slot Value",
			category: "board",
			description: "Point value of the bottom center slot.",
			cost_func: level => 100 * Math.pow(5, level),
			value_func: level => 250 * Math.pow(2, level),
			max_level: Infinity,
			value_suffix: "",
			visible_func: null,
			on_update: UpdateBottomTargets,
			on_buy: () => {
				let target = state.target_sets[0].targets[4];
				let popup_text = kTimesSymbol + "2";
				MaybeAddScoreText({
					level: 3,
					text: popup_text,
					pos: target.pos,
					color_rgb: "0,0,255"
				});
				state.bonus_wheel.UpdateAllSpaces();
			}
		})
	);
	upgrades_list.push(
		new ToggleUnlockUpgrade({
			id: "auto_drop",
			name: "Auto-Drop",
			category: "auto_drop",
			description:
				"Automatically drops a ball when allowed. Click in the drop zone to move the drop position.",
			cost: 100000,
			visible_func: () => GetUpgradeLevel("center_value") > 1,
			on_update: () => {
				state.redraw_auto_drop = true;
				state.update_upgrade_buttons = true;
			}
		})
	);
	upgrades_list.push(
		new DelayReductionUpgrade({
			id: "auto_drop_delay",
			name: "Auto-Drop Delay",
			category: "auto_drop",
			description: "Decreases the auto drop delay.",
			cost_func: level => 200000 * Math.pow(2, level),
			value_func: level =>
				Math.max(100, Math.floor(Math.pow(0.9, level) * 1000.0)),
			max_level: 22,
			item_suffix: "balls",
			visible_func: () => IsUnlocked("auto_drop"),
			on_update: function() {
				state.auto_drop_cooldown = this.GetValue();
				if (state.auto_drop_cooldown_left > state.auto_drop_cooldown) {
					state.auto_drop_cooldown_left = state.auto_drop_cooldown;
				}
				state.redraw_auto_drop = true;
			},
			on_buy: null
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "max_balls",
			name: "Max Balls",
			category: "board",
			description:
				"Maximum number of balls allowed on the board at once.",
			cost_func: level => 200000 * Math.pow(2, level),
			value_func: level => level + 1,
			max_level: 49,
			value_suffix: "",
			visible_func: () => GetUpgradeLevel("center_value") > 1,
			on_update: function() {
				state.max_balls = this.GetValue();
			},
			on_buy: null
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.GOLD],
			ball_description:
				"Gold balls are worth double points and don't count towards the max balls limit.",
			cost_func: () => 500000,
			visible_func: () => GetUpgradeLevel("max_balls") > 0
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.GOLD],
			cost_func: level => 1000000 * Math.pow(2, level),
			value_func: level => level + 1,
			max_level: 14
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "gold_ball_value",
			name: "Gold Ball Value",
			category: "gold_balls",
			description: "Increases point multiplier for gold balls.",
			cost_func: level => 10000000 * Math.pow(10, level),
			value_func: level => level + 2,
			max_level: Infinity,
			value_suffix: kTimesSymbol,
			visible_func: () => IsUnlocked("unlock_gold_balls"),
			on_update: function() {
				state.special_ball_multiplier = this.GetValue();
				state.bonus_wheel.UpdateAllSpaces();
			},
			on_buy: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "unlock_bonus_wheel",
			name: "Unlock Bonus Wheel",
			unlocked_name: "Bonus Wheel",
			category: "bonus_wheel",
			description:
				"Unlocks the Bonus Wheel. Also adds 2 targets, which award a spin for each ball that passes through them. Point values on the wheel scale based on your upgrades.",
			cost: 2000000,
			visible_func: () => IsUnlocked("unlock_gold_balls"),
			on_update: function() {
				let unlocked = this.GetValue() > 0;
				UpdateDisplay("bonus_wheel", unlocked ? "inline" : "none");
				let spin_targets = state.target_sets[1].targets;
				console.assert(spin_targets.length == 3);
				spin_targets[0].active = unlocked;
				spin_targets[2].active = unlocked;
				UpdateSpinCounter();
				state.bonus_wheel.UpdateAllSpaces();
				state.redraw_targets = true;
			}
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "add_spin_target",
			name: "Extra Spin Target",
			category: "bonus_wheel",
			description: "Adds an extra target that awards Bonus Wheel spins.",
			cost: 10000000,
			visible_func: () => IsUnlocked("unlock_bonus_wheel"),

			on_update: function() {
				let unlocked = this.GetValue() > 0;
				document.getElementById("bonus_wheel").style.display = unlocked
					? "inline"
					: "none";
				let spin_targets = state.target_sets[1].targets;
				console.assert(spin_targets.length == 3);
				spin_targets[1].active = unlocked;
				state.redraw_targets = true;
			}
		})
	);
	upgrades_list.push(
		new ToggleUnlockUpgrade({
			id: "auto_spin",
			name: "Auto-Spin",
			category: "bonus_wheel",
			description: "Automatically spin the Bonus Wheel.",
			cost: 100000000,
			visible_func: () => IsUnlocked("unlock_bonus_wheel"),
			on_update: null
		})
	);
	upgrades_list.push(
		new ToggleUnlockUpgrade({
			id: "multi_spin",
			name: "Multi-Spin",
			category: "bonus_wheel",
			description:
				"Uses 10% of your available spins at a time, multiplying any points you win from that spin. NOTE: Bonus gold ball drops are not multiplied.",
			cost: 100000000,
			visible_func: () => IsUnlocked("unlock_bonus_wheel"),
			on_update: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_drops_1",
			name: "Better Ball Drops",
			category: "bonus_wheel",
			description:
				'Change the "Drop 7 gold balls" space to "Drop 7 special balls". One gemstone ball of each type you have unlocked replaces one of the gold balls. This automatically updates as you unlock more gemstone balls.',
			cost: NthGemstoneBallUnlockCost(1),
			visible_func: AnyTier1GemstoneBallsUnlocked,
			on_update: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_drops_2",
			name: "Better Ball Drops 2",
			category: "bonus_wheel",
			description:
				'Change the "Drop 3 gold balls" space to "Drop 3 gemstone balls", which drops 1 Ruby, 1 Emerald, and 1 Sapphire ball.',
			cost: NthGemstoneBallUnlockCost(3),
			visible_func: AllTier1GemstoneBallsUnlocked,
			on_update: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_drops_3",
			name: "Better Ball Drops 3",
			category: "bonus_wheel",
			description:
				'Change the "Drop 3 gemstone balls" space to drop 1 Topaz, 1 Turquoise, and 1 Amethyst ball.',
			cost: NthGemstoneBallUnlockCost(6),
			visible_func: AllTier2GemstoneBallsUnlocked,
			on_update: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_drops_4",
			name: "Better Ball Drops 4",
			category: "bonus_wheel",
			description:
				'Change the "Drop 3 gemstone balls" space to "Drop 3 special balls", which drops 1 Opal ball, 1 8-Ball, and 1 Beach ball.',
			cost: 2e55,
			visible_func: () => IsUnlocked("unlock_beach_balls"),
			on_update: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_buff_multiplier",
			name: "Better Buff Multiplier",
			category: "bonus_wheel",
			button_class: "rubyUpgradeButton",
			description:
				'Instead of applying the <i>current</i> score multiplier buff to points won from wheel spins, the <i>highest</i> multiplier you have ever achieved is applied.',
			cost: 1e48,
			visible_func: () =>
				IsMaxed("ruby_ball_rate") &&
				IsUnlocked("ruby_ball_buff_stackable"),
			on_update: () => {
				state.bonus_wheel.UpdateAllSpaces();
			}
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_point_values",
			name: "Better Point Values",
			category: "bonus_wheel",
			button_class: "emeraldUpgradeButton",
			description:
				'Makes the highest point value on the wheel scale to the value of emerald balls instead of gold balls.',
			cost: 1e68,
			visible_func: () => IsMaxed("emerald_ball_rate"),
			on_update: () => {
				state.bonus_wheel.UpdateAllSpaces();
			}
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_multi_spin",
			name: "Better Multi-Spin",
			category: "bonus_wheel",
			button_class: "sapphireUpgradeButton",
			description:
				'Refunds additional spins consumed by Multi-Spin when landing on a ball drop space. (Note: ZONK still wastes all spins consumed.)',
			cost: 1e51,
			visible_func: () => IsMaxed("sapphire_ball_rate"),
			on_update: () => {
				state.bonus_wheel.UpdateAllSpaces();
			}
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "bonus_wheel_speed",
			name: "Wheel Speed",
			category: "bonus_wheel",
			description: "Makes bonus wheel spins play out faster.",
			cost_func: level => 1e12 * Math.pow(10, level),
			value_func: level => (level / 10.0) + 1.0,
			max_level: 20,
			value_suffix: kTimesSymbol,
			visible_func: () =>
				IsUnlocked("better_drops_1") ||
				IsUnlocked("better_drops_2") ||
				IsUnlocked("better_drops_3"),
			on_update: function() {
				state.bonus_wheel_speed = this.GetValue();
			},
			on_buy: null
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.RUBY],
			ball_description:
				"Ruby balls are worth the same as a gold ball, plus if a ruby ball falls in the center slot, it activates a buff that doubles all points scored for 60 seconds.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: ShouldDisplayGemstoneBallUpgrades
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.RUBY],
			cost_func: Tier1GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "ruby_ball_buff_stackable",
			name: "Stackable Buff",
			category: "ruby_balls",
			description:
				"Makes the ruby ball buff stackable. If a ruby ball falls in the center slot while the buff is already active, it extends the duration. Any time over 60 seconds is converted to a multiplier increase. The time extension is inversely proportional to the existing multiplier.",
			cost: 1e18,
			visible_func: () => IsUnlocked("unlock_ruby_balls")
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.SAPPHIRE],
			ball_description:
				"Sapphire balls are worth the same as a gold ball, plus the gold ball multiplier is also applied to the number of bonus wheel spins earned by sapphire balls.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: ShouldDisplayGemstoneBallUpgrades
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.SAPPHIRE],
			cost_func: Tier1GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "sapphire_ball_exponent",
			name: "Sapphire Exponent",
			category: "sapphire_balls",
			description: "Increases the exponent on the gold ball value multiplier for sapphire balls. Note: The number of spins earned per sapphire ball is rounded down to the nearest whole number.",
			cost_func: level => 1e15 * Math.pow(5, level),
			value_func: level => (level / 10.0) + 1,
			max_level: 20,
			value_suffix: "",
			visible_func: () => IsUnlocked("unlock_sapphire_balls"),
			on_update: function() {
				state.sapphire_ball_exponent = this.GetValue();
			},
			on_buy: null
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EMERALD],
			ball_description:
				"Points scored by emerald balls are multiplied by the square of the gold ball multiplier.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: ShouldDisplayGemstoneBallUpgrades
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EMERALD],
			cost_func: Tier1GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "emerald_ball_exponent",
			name: "Emerald Exponent",
			category: "emerald_balls",
			description: "Increases the exponent on the gold ball value multiplier for emerald balls.",
			cost_func: level => 1e15 * Math.pow(25, level),
			value_func: level => (level / 10.0) + 2,
			max_level: 10,
			value_suffix: "",
			visible_func: () => IsUnlocked("unlock_emerald_balls"),
			on_update: function() {
				state.emerald_ball_exponent = this.GetValue();
			},
			on_buy: null
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TOPAZ],
			ball_description:
				"Topaz balls have the bonuses of both ruby and emerald balls.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: () =>
				IsUnlocked("unlock_ruby_balls") &&
				IsUnlocked("unlock_emerald_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TOPAZ],
			cost_func: Tier2GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "topaz_synergy",
			name: "Topaz Synergy",
			category: "topaz_balls",
			description:
				'Makes the score buff multiplier awarded by Topaz balls equal to the Emerald exponent, e.g. an Emerald exponent of 3 means a Topaz ball in the center slot awards a 3&times; scoring buff instead of just 2&times; scoring.',
			cost: 1e24,
			visible_func: () =>
				IsUnlocked("unlock_topaz_balls") &&
				IsUnlocked("ruby_ball_buff_stackable") &&
				GetUpgradeLevel("emerald_ball_exponent") >= 1
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TURQUOISE],
			ball_description:
				"Turquoise balls have the bonuses of both emerald and sapphire balls.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: () =>
				IsUnlocked("unlock_emerald_balls") &&
				IsUnlocked("unlock_sapphire_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TURQUOISE],
			cost_func: Tier2GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "turquoise_synergy",
			name: "Turquoise Synergy",
			category: "turquoise_balls",
			description:
				'If a Turquoise ball hits a spin target, it also awards the value of the center slot, and if it lands in the center slot, it also awards the spins for a hitting a spin target.',
			cost: 1e24,
			visible_func: () => IsUnlocked("unlock_turquoise_balls")
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.AMETHYST],
			ball_description:
				"Amethyst balls have the bonuses of both ruby and sapphire balls.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: () =>
				IsUnlocked("unlock_ruby_balls") &&
				IsUnlocked("unlock_sapphire_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.AMETHYST],
			cost_func: Tier2GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "amethyst_synergy",
			name: "Amethyst Synergy",
			category: "amethyst_balls",
			description:
				'Applies the score buff multiplier to spins earned by Amethyst balls. (Spins awarded are rounded down to the nearest whole number.)',
			cost: 1e24,
			visible_func: () => IsUnlocked("unlock_amethyst_balls"),
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.OPAL],
			ball_description:
				"Opal balls have the combined bonuses of all the other gemstone balls.",
			cost_func: GemstoneBallUnlockCost,
			visible_func: AllTier2GemstoneBallsUnlocked
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.OPAL],
			cost_func: level => 1e32 * Math.pow(5, level),
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EIGHT_BALL],
			ball_description:
				'8-Balls are like Opal balls, but are worth 8&times; the points and spins of Opal balls, and awards an 8&times; scoring buff instead of 2&times;. (Score buff stacks additively with the Ruby ball buff.)<br><i>"Veemo!"</i>',
			cost_func: () => 888e33,
			visible_func: () =>
				IsUnlocked("unlock_opal_balls") &&
				IsUnlocked("ruby_ball_buff_stackable")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EIGHT_BALL],
			cost_func: level => 888e33 * Math.pow(10, level),
			value_func: function(level) {
				if (level >= 43) {
					return 8.88;
				} else {
					return (level + 1) / 5.0;
				}
			},
			max_level: 43
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "eight_ball_score_exponent",
			name: "8-Ball Score Exponent",
			category: "eight_balls",
			description: "Increases the exponent on the 8&times; multiplier for points scored by 8-Balls.",
			cost_func: level => 888e33 * Math.pow(10, level),
			value_func: level => (level / 5.0) + 1,
			max_level: 35,
			value_suffix: "",
			visible_func: () =>
				IsUnlocked("unlock_eight_balls") &&
				IsMaxed("emerald_ball_exponent"),
			on_update: function() {
				state.eight_ball_score_exponent = this.GetValue();
			},
		})
	);
	/*
	upgrades_list.push(
		new Upgrade({
			id: "eight_ball_spin_exponent",
			name: "8-Ball Spin Exponent",
			category: "eight_balls",
			description: "Increases the exponent on the 8&times; multiplier for spins earned by 8-Balls. Note: The number of spins earned per ball is rounded down to the nearest whole number.",
			cost_func: level => 888e33 * Math.pow(10, level),
			value_func: level => (level / 10.0) + 1,
			max_level: 70,
			value_suffix: "",
			visible_func: () =>
				IsUnlocked("unlock_eight_balls") &&
				IsMaxed("sapphire_ball_exponent"),
			on_update: function() {
				state.eight_ball_spin_exponent = this.GetValue();
			},
		})
	);
	*/
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.BEACH_BALL],
			ball_description:
				"Beach balls are bouncier and floatier than other balls. They're worth double the points and spins of 8-balls, and award a 16&times; scoring buff.",
			cost_func: () => 1e50,
			visible_func: () => IsUnlocked("unlock_eight_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.BEACH_BALL],
			cost_func: level => 1e51 * Math.pow(10, level),
			value_func: GemstoneBallRateValueFunc,
			max_level: 24
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "beach_ball_time_based_multiplier",
			name: "Time-Based Multiplier",
			category: "beach_balls",
			description:
				"The more time a beach ball spends bouncing around, the more points and spins it's worth.",
			cost: 1e52,
			visible_func: () => IsUnlocked("unlock_beach_balls")
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "beach_ball_score_exponent",
			name: "Beach Ball Score Exponent",
			category: "beach_balls",
			description: "Increases the exponent on the time-based multiplier for points scored by Beach Balls.",
			cost_func: level => 1e53 * Math.pow(10, level),
			value_func: level => (level / 5.0) + 1,
			max_level: 5,
			value_suffix: "",
			visible_func: () =>
				IsUnlocked("beach_ball_time_based_multiplier"),
			on_update: function() {
				state.beach_ball_score_exponent = this.GetValue();
			},
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "beach_ball_spin_exponent",
			name: "Beach Ball Spin Exponent",
			category: "beach_balls",
			description: "Increases the exponent on the time-based multiplier for spins earned by Beach Balls. Note: The number of spins earned per ball is rounded down to the nearest whole number.",
			cost_func: level => 1e53 * Math.pow(1e4, level),
			value_func: level => (level / 10.0) + 0.5,
			max_level: 5,
			value_suffix: "",
			visible_func: () =>
				IsUnlocked("beach_ball_time_based_multiplier"),
			on_update: function() {
				state.beach_ball_spin_exponent = this.GetValue();
			},
		})
	);

	let upgrades_map = {};
	for (let i = 0; i < upgrades_list.length; ++i) {
		let upgrade = upgrades_list[i];
		upgrades_map[upgrade.id] = upgrade;
	}

	return upgrades_map;
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
			'" onmouseenter="ShowUpgradeTooltip(this)" onmouseleave="HideUpgradeTooltip(this)">' +
			'<button type="button" class="' +
			upgrade.button_class +
			'" id="button_upgrade_' +
			upgrade.id +
			'" onclick="UpgradeButtonHandler(this)"></button></div>';
	}
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

function UpgradeButtonHandler(elem) {
	const kPrefix = "button_upgrade_";
	console.assert(elem.id.indexOf(kPrefix) == 0);
	let upgrade_id = elem.id.slice(kPrefix.length);
	state.upgrades[upgrade_id].OnClick();
}

function NextUpgradeHint(state) {
	if (!IsUpgradeVisible("auto_drop")) {
		return "1K Center Slot Value";
	} else if (!IsUpgradeVisible("unlock_gold_balls")) {
		return "2 Max Balls";
	} else if (!IsUpgradeVisible("gold_ball_rate")) {
		return "Unlock Gold Balls";
	} else if (!ShouldDisplayGemstoneBallUpgrades()) {
		return "15% Gold Ball Rate and unlock Bonus Wheel";
	} else if (NumGemstoneBallsUnlocked() < 2) {
		return "Unlock any 2 of Ruby, Sapphire, and Emerald Balls";
	} else if (!AllTier1GemstoneBallsUnlocked()) {
		return "Unlock all 3 of Ruby, Sapphire, and Emerald Balls";
	} else if (!AllTier2GemstoneBallsUnlocked()) {
		return "Unlock all 3 of Topaz, Turquoise, and Amethyst Balls";
	} else if (!IsUpgradeVisible("unlock_eight_balls")) {
		return "Unlock Opal Balls and Stackable Buff";
	} else if (
		!IsUpgradeVisible("better_point_values") ||
		!IsUpgradeVisible("better_multi_spin") ||
		!IsUpgradeVisible("better_buff_multiplier")
	) {
		return "Max Ruby, Sapphire, and Emerald Ball Rates (10%). Each one reveals a different upgrade when maxed.";
	} else if (!IsUpgradeVisible("better_drops_4")) {
		return "Unlock Beach Balls.";
	} else if (!IsUnlocked("beach_ball_time_based_multiplier")) {
		return "Unlock Time-Based Multipiler for Beach Balls.";
	} else {
		return "None! Congratulations, you've reached the current endgame!"
	}
}

function UpdateUpgradeButtons(state) {
	if (!state.update_upgrade_buttons) {
		return;
	}
	state.update_upgrade_buttons = false;
	
	UpdateInnerHTML("next_upgrade_hint", NextUpgradeHint(state));

	for (let id in state.upgrades) {
		let upgrade = state.upgrades[id];
		let elem = document.getElementById("button_upgrade_" + id);
		let html = upgrade.GetText();
		if (elem.innerHTML != html) {
			elem.innerHTML = html;
		}
		let disabled = !upgrade.ShouldEnableButton();
		if (elem.disabled != disabled) {
			elem.disabled = disabled;
		}
		let visible = upgrade.visible_func();
		let display = visible ? "inline" : "none";
		if (elem.style.display != display) {
			elem.style.display = display;
			if (visible) {
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

function ShowUpgradeTooltip(elem) {
	state.active_tooltip = elem.id;
	const kWidth = 200;
	let body_rect = document.body.getBoundingClientRect();
	let button_rect = elem.getBoundingClientRect();
	let tooltip_elem = document.getElementById("tooltip");
	tooltip_elem.style.width = kWidth + "px";
	let left_pos = (button_rect.left + button_rect.right - kWidth) / 2.0;
	tooltip_elem.style.display = "block";
	tooltip_elem.innerHTML = state.upgrades[elem.id].description;
	tooltip_elem.style.left = left_pos + "px";
	tooltip_elem.style.top =
		button_rect.top - tooltip_elem.offsetHeight - 5 + "px";
}

function HideUpgradeTooltip(button_elem) {
	if (state.active_tooltip != button_elem.id) {
		return;
	}
	document.getElementById("tooltip").style.display = "none";
}

function AreAllUpgradesMaxed() {
	for (let id in state.upgrades) {
		let upgrade = state.upgrades[id];
		if (!isFinite(upgrade.max_level)) {
			continue;
		}
		if (!IsMaxed(id)) {
			return false;
		}
	}
	return true;
}

function ShowEndingIfAllUpgradesMaxed() {
	if (AreAllUpgradesMaxed()) {
		let play_time = Date.now() - state.save_file.stats.start_time;
		UpdateInnerHTML("ending_play_time", FormatDurationLong(play_time));
		document.getElementById("ending_modal").style.display = "block";
	}
}
