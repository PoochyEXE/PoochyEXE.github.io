class Upgrade {
	constructor({
		id,
		name,
		category,
		collapsible_header,
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
		if (collapsible_header) {
			this.collapsible_header = collapsible_header;
		} else {
			this.collapsible_header = category;
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
		++state.save_file.upgrade_levels[this.id];
		state.save_file.points -= cost;
		this.Update();
		this.on_buy();
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
		result += "<br>Bought: " + level;
		return result;
	}
}

class DelayReductionUpgrade extends Upgrade {
	constructor({
		id,
		name,
		category,
		collapsible_header,
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
			collapsible_header,
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
		result += "<br>Bought: " + level;
		return result;
	}
}

class FeatureUnlockUpgrade extends Upgrade {
	constructor({
		id,
		name,
		category,
		collapsible_header,
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
			collapsible_header,
			description,
			cost_func,
			value_func: null,
			max_level: 1,
			value_suffix: "",
			visible_func,
			on_update,
			on_buy
		});
	}

	GetText() {
		let result = "<b>" + this.name + "</b><br>";
		if (this.GetLevel() == 0) {
			result += "Cost: " + FormatNumberShort(this.cost_func());
		} else {
			result += "Unlocked!";
		}
		return result;
	}
}

class FixedCostFeatureUnlockUpgrade extends FeatureUnlockUpgrade {
	constructor({
		id,
		name,
		category,
		collapsible_header,
		description,
		cost,
		visible_func,
		on_update,
		on_buy
	}) {
		super({
			id,
			name,
			category,
			collapsible_header,
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
		category,
		collapsible_header,
		description,
		cost,
		visible_func,
		on_update,
		on_buy
	}) {
		super({
			id,
			name,
			category,
			collapsible_header,
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
	constructor({ ball_type, ball_description, collapsible_header, cost_func, visible_func }) {
		super({
			id: `unlock_${ball_type.name}_balls`,
			name: "Unlock " + ball_type.display_name + "Balls",
			category: ball_type.name + "_balls",
			collapsible_header: collapsible_header,
			description:
				"Unlock " + ball_type.display_name + "balls. " + ball_description,
			cost_func,
			visible_func,
			on_update: () => {
				let div_id = ball_type.name + "_ball_opacity_wrapper";
				let display = (this.GetValue() > 0) ? "block" : "none";
				UpdateDisplay(div_id, display);
			},
		});
	}
}

class BallTypeRateUpgrade extends Upgrade {
	constructor({ ball_type, collapsible_header, cost_func, value_func, max_level }) {
		super({
			id: ball_type.name + "_ball_rate",
			name: ball_type.display_name + "Ball Rate",
			category: ball_type.name + "_balls",
			collapsible_header: collapsible_header,
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

function ActivateOrExtendScoreBuff(multiplier) {
	const kBuffDuration = 60000.0;
	if (!IsUnlocked("ruby_ball_buff_stackable") || state.save_file.score_buff_duration <= 0.0 || state.save_file.score_buff_multiplier <= 1.0) {
		state.save_file.score_buff_multiplier = multiplier;
		state.save_file.score_buff_duration = kBuffDuration;
	} else {
		let stacks = state.save_file.score_buff_multiplier - 1.0;
		state.save_file.score_buff_duration += (kBuffDuration / stacks) * (multiplier - 1.0);
		if (state.save_file.score_buff_duration > kBuffDuration) {
			state.save_file.score_buff_multiplier *= (state.save_file.score_buff_duration / kBuffDuration);
			state.save_file.score_buff_duration = kBuffDuration;
		}
	}
}

function OnCenterSlotHit(ball) {
	if (
		ball.ball_type_index == kBallTypeIDs.RUBY ||
		ball.ball_type_index == kBallTypeIDs.TOPAZ ||
		ball.ball_type_index == kBallTypeIDs.AMETHYST ||
		ball.ball_type_index == kBallTypeIDs.OPAL
	) {
		let text_pos = new Point(ball.pos.x, ball.pos.y - 10);
		MaybeAddScoreText({
			level: 2,
			text: "2\u00D7 scoring!",
			pos: text_pos,
			color_rgb: "255,0,0"
		});
		ActivateOrExtendScoreBuff(2.0);
	} else if (ball.ball_type_index == kBallTypeIDs.EIGHT_BALL) {
		let text_pos = new Point(ball.pos.x, ball.pos.y - 10);
		MaybeAddScoreText({
			level: 2,
			text: "8\u00D7 scoring!",
			pos: text_pos,
			color_rgb: k8BallHighlightColor
		});
		ActivateOrExtendScoreBuff(8.0);
	}
}

function ShouldDisplayGemstoneBallUpgrades() {
	return GetUpgradeLevel("gold_ball_rate") >= 19;
}

function NthGemstoneBallUnlockCost(n) {
	return 1e12 * Math.pow(2000, n - 1);
}

function GemstoneBallUnlockCost() {
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
	return NthGemstoneBallUnlockCost(prev_unlocks + 1);
}

function Tier1GemstoneBallRateCostFunc(level) {
	return 5e12 * Math.pow(5, level);
}

function Tier2GemstoneBallRateCostFunc(level) {
	return 5e18 * Math.pow(5, level);
}

function GemstoneBallRateValueFunc(level) {
	return (level + 1) / 10.0;
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
						level: 2,
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
					level: 2,
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
			category: "auto-drop",
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
			category: "auto-drop",
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
			collapsible_header: "gold_balls",
			cost_func: () => 500000,
			visible_func: () => GetUpgradeLevel("max_balls") > 0
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.GOLD],
			cost_func: level => 1000000 * Math.pow(2, level),
			value_func: level => level + 1,
			max_level: 49
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
			category: "bonus_wheel_basic",
			collapsible_header: "bonus_wheel",
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
			category: "bonus_wheel_basic",
			collapsible_header: "bonus_wheel",
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
			category: "bonus_wheel_basic",
			collapsible_header: "bonus_wheel",
			description: "Automatically spin the Bonus Wheel.",
			cost: 50000000,
			visible_func: () => IsUnlocked("unlock_bonus_wheel"),
			on_update: null
		})
	);
	upgrades_list.push(
		new ToggleUnlockUpgrade({
			id: "multi_spin",
			name: "Multi-Spin",
			category: "bonus_wheel_basic",
			collapsible_header: "bonus_wheel",
			description:
				"Uses 10% of your available spins at a time, multiplying any points you win from that spin. NOTE: Bonus gold ball drops are not multiplied.",
			cost: 50000000,
			visible_func: () => IsUnlocked("unlock_bonus_wheel"),
			on_update: null
		})
	);
	upgrades_list.push(
		new FixedCostFeatureUnlockUpgrade({
			id: "better_drops_1",
			name: "Better Ball Drops",
			category: "bonus_wheel_gemstone_balls",
			collapsible_header: "bonus_wheel",
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
			category: "bonus_wheel_gemstone_balls",
			collapsible_header: "bonus_wheel",
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
			category: "bonus_wheel_gemstone_balls",
			collapsible_header: "bonus_wheel",
			description:
				'Change the "Drop 3 gemstone balls" space to drop 1 Topaz, 1 Turquoise, and 1 Amethyst ball.',
			cost: NthGemstoneBallUnlockCost(6),
			visible_func: AllTier2GemstoneBallsUnlocked,
			on_update: null
		})
	);
	upgrades_list.push(
		new Upgrade({
			id: "bonus_wheel_speed",
			name: "Wheel Speed",
			category: "bonus_wheel_row3",
			collapsible_header: "bonus_wheel",
			description: "Makes bonus wheel spins play out faster.",
			cost_func: level => 1e12 * Math.pow(10, level),
			value_func: level => level * 0.1 + 1.0,
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
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: ShouldDisplayGemstoneBallUpgrades
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.RUBY],
			collapsible_header: "gemstone_balls",
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
			collapsible_header: "gemstone_balls",
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
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: ShouldDisplayGemstoneBallUpgrades
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.SAPPHIRE],
			collapsible_header: "gemstone_balls",
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
			collapsible_header: "gemstone_balls",
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
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: ShouldDisplayGemstoneBallUpgrades
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EMERALD],
			collapsible_header: "gemstone_balls",
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
			collapsible_header: "gemstone_balls",
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
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: () =>
				IsUnlocked("unlock_ruby_balls") &&
				IsUnlocked("unlock_emerald_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TOPAZ],
			collapsible_header: "gemstone_balls",
			cost_func: Tier2GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TURQUOISE],
			ball_description:
				"Turquoise balls have the bonuses of both emerald and sapphire balls.",
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: () =>
				IsUnlocked("unlock_emerald_balls") &&
				IsUnlocked("unlock_sapphire_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.TURQUOISE],
			collapsible_header: "gemstone_balls",
			cost_func: Tier2GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.AMETHYST],
			ball_description:
				"Amethyst balls have the bonuses of both ruby and sapphire balls.",
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: () =>
				IsUnlocked("unlock_ruby_balls") &&
				IsUnlocked("unlock_sapphire_balls")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.AMETHYST],
			collapsible_header: "gemstone_balls",
			cost_func: Tier2GemstoneBallRateCostFunc,
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.OPAL],
			ball_description:
				"Opal balls have the combined bonuses of ruby, sapphire, and emerald balls.",
			collapsible_header: "gemstone_balls",
			cost_func: GemstoneBallUnlockCost,
			visible_func: AllTier2GemstoneBallsUnlocked
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.OPAL],
			collapsible_header: "gemstone_balls",
			cost_func: level => 5e24 * Math.pow(5, level),
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
		})
	);
	upgrades_list.push(
		new BallTypeUnlockUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EIGHT_BALL],
			ball_description:
				'8-Balls are like Opal balls, but worth 8&times; points and 8&times; spins, and awards an 8&times; scoring buff instead of 2&times;. (Score buff stacks additively with the Ruby ball buff.)<br><i>"Veemo!"</i>',
			collapsible_header: "eight_balls",
			cost_func: () => 888e33,
			visible_func: () =>
				IsUnlocked("unlock_opal_balls") &&
				IsUnlocked("ruby_ball_buff_stackable")
		})
	);
	upgrades_list.push(
		new BallTypeRateUpgrade({
			ball_type: kBallTypes[kBallTypeIDs.EIGHT_BALL],
			collapsible_header: "eight_balls",
			cost_func: level => 888e33 * Math.pow(10, level),
			value_func: GemstoneBallRateValueFunc,
			max_level: 49
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
	} else {
		return "upgradeButton";
	}
}

function InitUpgradeButtons(upgrades) {
	for (let upgrade_id in upgrades) {
		let upgrade = upgrades[upgrade_id];
		let category_div_id = upgrade.category + "_contents";
		let category_div = document.getElementById(category_div_id);
		let button_class = ButtonClassForUpgradeCategory(upgrade.category);
		category_div.innerHTML +=
			'<div class="upgradeButtonWrapper" id="' +
			upgrade_id +
			'" onmouseenter="ShowUpgradeTooltip(this)" onmouseleave="HideUpgradeTooltip(this)">' +
			'<button type="button" class="' +
			button_class +
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

function UpdateUpgradeSubHeader(header_id, visible) {
	UpdateDisplay(header_id, visible ? "inline-block" : "none");
}

function UpdateUpgradeButtons(state) {
	if (!state.update_upgrade_buttons) {
		return;
	}
	state.update_upgrade_buttons = false;

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
				let header = upgrade.collapsible_header;
				if (IsCollapsed(header)) {
					UpdateDisplay(header + "_header_new", "inline");
				}
				if (IsCollapsed("upgrades")) {
					UpdateDisplay("upgrades_header_new", "inline");
				}
			}
		}
	}
	UpdateUpgradeSubHeader("basic_upgrades_container", true);
	UpdateUpgradeSubHeader(
		"auto-drop_upgrades_container",
		state.upgrades["auto_drop"].visible_func()
	);
	UpdateUpgradeSubHeader(
		"bonus_wheel_upgrades_container",
		state.upgrades["unlock_bonus_wheel"].visible_func()
	);
	UpdateUpgradeSubHeader(
		"gold_balls_upgrades_container",
		state.upgrades["unlock_gold_balls"].visible_func()
	);
	UpdateUpgradeSubHeader(
		"gemstone_balls_upgrades_container",
		ShouldDisplayGemstoneBallUpgrades()
	);
	UpdateUpgradeSubHeader(
		"eight_balls_upgrades_container",
		state.upgrades["unlock_eight_balls"].visible_func()
	);
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
