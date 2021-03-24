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

class FeatureUnlockUpgrade extends Upgrade {
	constructor(id, name, cost, visible_func, on_update, on_buy) {
		super(id, name, function(level) { return cost; }, /*value_func=*/null,
				/*max_level=*/1, /*value_suffix=*/'', visible_func, on_update, on_buy);
	}
	
	GetText() {
		let result = "<b>" + this.name + "</b><br/>";
		if (this.GetLevel() == 0) {
			result += "Cost: " + FormatNumberShort(this.cost);
		} else {
			result += "Unlocked!"
		}
		return result;
	}
}

class ToggleUnlockUpgrade extends FeatureUnlockUpgrade {
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