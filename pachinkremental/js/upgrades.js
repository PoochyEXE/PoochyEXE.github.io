class Upgrade {
	constructor(id, name, cost_func, value_func, max_level, value_suffix, visible_func, on_update, on_buy) {
		this.id = id;
		this.name = name;
		this.cost_func = cost_func;
		if (value_func) {
			this.value_func = value_func;
		} else {
			this.value_func = this.GetLevel;
		}
		this.cost = cost_func(0);
		this.max_level = max_level;
		this.value_suffix = value_suffix;
		const kNoop = function() {};
		if (visible_func) {
			this.visible_func = visible_func;
		} else {
			this.visible_func = function() { return true; }
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
		result += "<br/>" + FormatNumberShort(this.value_func(level)) + this.value_suffix;
		if (level >= this.max_level) {
			result += " (MAX)";
		} else {
			result += " \u2192 " + FormatNumberShort(this.value_func(level + 1)) + this.value_suffix;
			result += "<br/>Cost: " + FormatNumberShort(this.cost_func(level));
		}
		result += "<br/>Bought: " + level;
		return result;
	}
}

class DelayReductionUpgrade extends Upgrade {
	constructor(id, name, cost_func, value_func, max_level, item_suffix, visible_func, on_update, on_buy) {
		super(id, name, cost_func, value_func, max_level, /*value_suffix=*/" ms", visible_func, on_update, on_buy);
		this.item_suffix = item_suffix;
	}
	
	GetText() {
		let result = "<b>" + this.name + "</b>";
		let level = this.GetLevel();
		let delay_now = this.value_func(level);
		let rate_now = 60000.0 / delay_now;
		if (level >= this.max_level) {
			result += "<br/>" + FormatNumberShort(delay_now) + this.value_suffix + " (MAX)";
			result += "<br/>(" + FormatNumberShort(rate_now) + " " + this.item_suffix + "/min)";
		} else {
			let delay_next = this.value_func(level + 1);
			let rate_next = 60000.0 / delay_next;
			result += "<br/>" + FormatNumberShort(delay_now) + this.value_suffix;
			result += " \u2192 " + FormatNumberShort(delay_next) + this.value_suffix;
			result += "<br/>(" + FormatNumberShort(rate_now);
			result += " \u2192 " + FormatNumberShort(rate_next);
			result += " " + this.item_suffix + "/min)";
			result += "<br/>Cost: " + FormatNumberShort(this.cost_func(level));
		}
		result += "<br/>Bought: " + level;
		return result;
	}
}

class FeatureUnlockUpgrade extends Upgrade {
	constructor(id, name, cost_func, visible_func, on_update, on_buy) {
		super(id, name, cost_func, /*value_func=*/null, /*max_level=*/1,
				/*value_suffix=*/'', visible_func, on_update, on_buy);
	}
	
	GetText() {
		let result = "<b>" + this.name + "</b><br/>";
		if (this.GetLevel() == 0) {
			result += "Cost: " + FormatNumberShort(this.cost_func());
		} else {
			result += "Unlocked!"
		}
		return result;
	}
}

class FixedCostFeatureUnlockUpgrade extends FeatureUnlockUpgrade {
	constructor(id, name, cost, visible_func, on_update, on_buy) {
		super(id, name, function(level) { return cost; }, visible_func, on_update, on_buy);
	}
}

class ToggleUnlockUpgrade extends FixedCostFeatureUnlockUpgrade {
	constructor(id, name, cost, visible_func, on_update, on_buy) {
		super(id, name, cost, visible_func, on_update, on_buy);
	}
	
	SaveFileKey() {
		return this.id + "_enabled";
	}
	
	GetToggleState() {
		return state.save_file[this.SaveFileKey()];
	}
	
	SetToggleState(new_state) {
		state.save_file[this.SaveFileKey()] = new_state;
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
		let result = "<b>" + this.name + "</b><br/>";
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

function ActivateOrExtendDoubleScoreBuff() {
	state.save_file.score_buff_multiplier = 2.0;
	state.save_file.score_buff_duration = 60000.0;
}

function OnCenterSlotHit(ball) {
	if (ball.ball_type_index == kBallTypeIDs.RUBY ||
			ball.ball_type_index == kBallTypeIDs.TOPAZ ||
			ball.ball_type_index == kBallTypeIDs.AMETHYST) {
		let text_pos = new Point(ball.pos.x, ball.pos.y - 10);
		MaybeAddScoreText("2\u00D7 scoring!", text_pos, "255,0,0");
		ActivateOrExtendDoubleScoreBuff();
	}
}

function ShouldDisplayGemstoneBallUpgrades() {
	return GetUpgradeLevel("gold_ball_rate") >= 24;
}

function GemstoneBallUnlockCost() {
	let exp = 12;
	if (state) {
		if (IsUnlocked("unlock_ruby_balls")) {
			exp += 4;
		}
		if (IsUnlocked("unlock_sapphire_balls")) {
			exp += 4;
		}
		if (IsUnlocked("unlock_emerald_balls")) {
			exp += 4;
		}
		if (IsUnlocked("unlock_topaz_balls")) {
			exp += 4;
		}
		if (IsUnlocked("unlock_turquoise_balls")) {
			exp += 4;
		}
		if (IsUnlocked("unlock_amethyst_balls")) {
			exp += 4;
		}
	}
	return Math.pow(10, exp);
}

function AllTier1GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return IsUnlocked("unlock_ruby_balls") && IsUnlocked("unlock_sapphire_balls") && IsUnlocked("unlock_emerald_balls");
}

function AnyTier1GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return IsUnlocked("unlock_ruby_balls") || IsUnlocked("unlock_sapphire_balls") || IsUnlocked("unlock_emerald_balls");
}

function AllTier2GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return IsUnlocked("unlock_topaz_balls") && IsUnlocked("unlock_turquoise_balls") && IsUnlocked("unlock_amethyst_balls");
}

function AnyTier2GemstoneBallsUnlocked() {
	if (!state) return undefined;
	return IsUnlocked("unlock_topaz_balls") || IsUnlocked("unlock_turquoise_balls") || IsUnlocked("unlock_amethyst_balls");
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
					MaybeAddScoreText(popup_text, bottom_targets[i].pos, "0,0,255");
				}
				state.bonus_wheel.UpdateAllSpaces();
			}));
	upgrades_list.push(new Upgrade("center_value", "Center Slot Value",
			/*cost_func=*/function(level) {
				return 100 * Math.pow(5, level);
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
				MaybeAddScoreText(popup_text, target.pos, "0,0,255");
				state.bonus_wheel.UpdateAllSpaces();
			}));
	upgrades_list.push(new ToggleUnlockUpgrade("auto_drop", "Auto-Drop", /*cost=*/100000,
			/*visible_func=*/function() {
				return GetUpgradeLevel("center_value") > 1;
			},
			/*on_update=*/function() {
				state.redraw_auto_drop = true;
				state.update_upgrade_buttons = true;
			}));
	upgrades_list.push(new DelayReductionUpgrade("auto_drop_delay", "Auto-Drop Delay",
			/*cost_func=*/function(level) {
				return 200000 * Math.pow(2, level);
			},
			/*value_func=*/function(level) {
				return Math.max(100, Math.floor(Math.pow(0.9, level) * 1000.0));
			},
			/*max_level=*/22,
			/*item_suffix=*/"balls",
			/*visible_func=*/function() {
				return IsUnlocked("auto_drop");
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
			/*max_level=*/49,
			/*value_suffix=*/'',
			/*visible_func=*/function() {
				return GetUpgradeLevel("center_value") > 1;
			},
			/*on_update=*/function() {
				return state.max_balls = this.GetValue();
			},
			/*on_buy=*/null));
	upgrades_list.push(new FixedCostFeatureUnlockUpgrade("unlock_gold_balls", "Unlock Gold Balls", /*cost=*/500000,
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
				return IsUnlocked("unlock_gold_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.GOLD] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	upgrades_list.push(new Upgrade("gold_ball_value", "Gold Ball Value",
			/*cost_func=*/function(level) {
				return 10000000 * Math.pow(10, level);
			},
			/*value_func=*/function(level) {
				return level + 2;
			},
			/*max_level=*/Infinity,
			/*value_suffix=*/kTimesSymbol,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_gold_balls");
			},
			/*on_update=*/function() {
				state.special_ball_multiplier = this.GetValue();
				state.bonus_wheel.UpdateAllSpaces();
			},
			/*on_buy=*/null));
	upgrades_list.push(new FixedCostFeatureUnlockUpgrade("unlock_bonus_wheel", "Unlock Bonus Wheel", /*cost=*/2000000,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_gold_balls");
			},
			/*on_update=*/function() {
				let unlocked = (this.GetValue() > 0);
				document.getElementById("bonus_wheel").style.display = unlocked ? "inline" : "none";
				let spin_targets = state.target_sets[1].targets;
				console.assert(spin_targets.length == 3);
				spin_targets[0].active = unlocked;
				spin_targets[2].active = unlocked;
				UpdateSpinCounter();
				state.bonus_wheel.UpdateAllSpaces();
				state.redraw_targets = true;
			}));
	upgrades_list.push(new FixedCostFeatureUnlockUpgrade("add_spin_target", "Extra Spin Target", /*cost=*/10000000,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_bonus_wheel");
			},
			/*on_update=*/function() {
				let unlocked = (this.GetValue() > 0);
				document.getElementById("bonus_wheel").style.display = unlocked ? "inline" : "none";
				let spin_targets = state.target_sets[1].targets;
				console.assert(spin_targets.length == 3);
				spin_targets[1].active = unlocked;
				state.redraw_targets = true;
			}));
	upgrades_list.push(new ToggleUnlockUpgrade("auto_spin", "Auto-Spin", /*cost=*/50000000,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_bonus_wheel");
			},
			/*on_update=*/null));
	upgrades_list.push(new ToggleUnlockUpgrade("multi_spin", "Multi-Spin", /*cost=*/50000000,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_bonus_wheel");
			},
			/*on_update=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_ruby_balls", "Unlock Ruby Balls",
			/*cost_func=*/GemstoneBallUnlockCost,
			/*visible_func=*/ShouldDisplayGemstoneBallUpgrades));
	upgrades_list.push(new Upgrade("ruby_ball_rate", "Ruby Ball Rate",
			/*cost_func=*/function(level) {
				return 5e12 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return (level + 1) / 10.0;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return IsUnlocked("unlock_ruby_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.RUBY] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_sapphire_balls", "Unlock Sapphire Balls",
			/*cost_func=*/GemstoneBallUnlockCost,
			/*visible_func=*/ShouldDisplayGemstoneBallUpgrades));
	upgrades_list.push(new Upgrade("sapphire_ball_rate", "Sapphire Ball Rate",
			/*cost_func=*/function(level) {
				return 5e12 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return (level + 1) / 10.0;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return IsUnlocked("unlock_sapphire_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.SAPPHIRE] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_emerald_balls", "Unlock Emerald Balls",
			/*cost_func=*/GemstoneBallUnlockCost,
			/*visible_func=*/ShouldDisplayGemstoneBallUpgrades));
	upgrades_list.push(new Upgrade("emerald_ball_rate", "Emerald Ball Rate",
			/*cost_func=*/function(level) {
				return 5e12 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return (level + 1) / 10.0;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return IsUnlocked("unlock_emerald_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.EMERALD] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_topaz_balls", "Unlock Topaz Balls",
			/*cost_func=*/GemstoneBallUnlockCost,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_ruby_balls") && IsUnlocked("unlock_emerald_balls");
			}));
	upgrades_list.push(new Upgrade("topaz_ball_rate", "Topaz Ball Rate",
			/*cost_func=*/function(level) {
				return 5e20 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return (level + 1) / 10.0;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return IsUnlocked("unlock_topaz_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.TOPAZ] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_turquoise_balls", "Unlock Turquoise Balls",
			/*cost_func=*/GemstoneBallUnlockCost,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_emerald_balls") && IsUnlocked("unlock_sapphire_balls");
			}));
	upgrades_list.push(new Upgrade("turquoise_ball_rate", "Turquoise Ball Rate",
			/*cost_func=*/function(level) {
				return 5e20 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return (level + 1) / 10.0;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return IsUnlocked("unlock_turquoise_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.TURQUOISE] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	upgrades_list.push(new FeatureUnlockUpgrade("unlock_amethyst_balls", "Unlock Amethyst Balls",
			/*cost_func=*/GemstoneBallUnlockCost,
			/*visible_func=*/function() {
				return IsUnlocked("unlock_ruby_balls") && IsUnlocked("unlock_sapphire_balls");
			}));
	upgrades_list.push(new Upgrade("amethyst_ball_rate", "Amethyst Ball Rate",
			/*cost_func=*/function(level) {
				return 5e20 * Math.pow(5, level);
			},
			/*value_func=*/function(level) {
				return (level + 1) / 10.0;
			},
			/*max_level=*/49,
			/*value_suffix=*/"%",
			/*visible_func=*/function() {
				return IsUnlocked("unlock_amethyst_balls");
			},
			/*on_update=*/function() {
				state.ball_type_rates[kBallTypeIDs.AMETHYST] = this.GetValue() / 100.0;
			},
			/*on_buy=*/null));
	
	let upgrades_map = {};
	for (let i = 0; i < upgrades_list.length; ++i) {
		let upgrade = upgrades_list[i];
		upgrades_map[upgrade.id] = upgrade;
	}
	
	return upgrades_map;
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
	let elem = document.getElementById(header_id);
	elem.style.display = visible ? "inline-block" : "none";
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
	UpdateUpgradeSubHeader("basic_upgrades_container", true);
	UpdateUpgradeSubHeader("auto-drop_upgrades_container", state.upgrades["auto_drop"].visible_func());
	UpdateUpgradeSubHeader("bonus_wheel_upgrades_container", state.upgrades["unlock_bonus_wheel"].visible_func());
	UpdateUpgradeSubHeader("gold_balls_upgrades_container", state.upgrades["unlock_gold_balls"].visible_func());
	UpdateUpgradeSubHeader("gemstone_balls_upgrades_container", ShouldDisplayGemstoneBallUpgrades());
}
