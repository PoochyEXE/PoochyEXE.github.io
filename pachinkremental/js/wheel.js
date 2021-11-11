class BonusWheel {
	constructor(machine, spaces) {
		this.machine = machine;
		this.spaces = spaces;
		this.pos = 0.5 / spaces.length;
		this.spin_distance = 0.0; // Revolutions left to turn on current spin
		this.multi_spin = 1;
	}

	IsSpinning() {
		return this.spin_distance > 0.0;
	}

	UpdateAllSpaces() {
		for (let i = 0; i < this.spaces.length; ++i) {
			this.spaces[i].Update();
		}
		state.redraw_wheel = true;
	}

	Spin() {
		let spins = this.machine.GetSaveData().spins;
		if (this.IsSpinning() || spins <= 0) {
			return false;
		}
		if (this.machine.MultiSpinOn()) {
			this.multi_spin = Math.ceil(spins * 0.1);
		} else {
			this.multi_spin = 1;
		}
		this.spin_distance = Math.random() * 2 + 2.0;
		this.UpdateAllSpaces();
		UpdateSpinCounter();
		return true;
	}

	SpaceAt(space_id) {
		let index = space_id % this.spaces.length;
		if (index < 0) {
			index += this.spaces.length;
		}
		return this.spaces[index];
	}

	PositionToSpace(pos) {
		return this.SpaceAt(Math.floor(pos * this.spaces.length));
	}

	Rotate(revs) {
		this.pos += revs;
		if (this.pos >= 1.0) {
			this.pos -= 1.0;
		}
	}

	UpdateOneFrame() {
		if (!this.IsSpinning()) {
			return;
		}
		const kBaseDecel = 0.001; // 0.002 revs/frame/frame
		let decel = kBaseDecel * this.machine.bonus_wheel_speed;
		let delta = Math.sqrt(decel * this.spin_distance);
		if (this.spin_distance <= delta) {
			this.Rotate(this.spin_distance);
			this.spin_distance = 0;
			this.machine.GetSaveData().spins -= this.multi_spin;
			this.PositionToSpace(this.pos).on_hit_func(this.machine, this.multi_spin);
			UpdateSpinCounter();
		} else {
			this.Rotate(delta);
			this.spin_distance -= delta;
		}
	}
}

class BonusWheelSpace {
	constructor({ active_color, text_func, on_hit_func }) {
		this.active_color = active_color;
		this.inactive_color = active_color
			.replaceAll("F", "D")
			.replaceAll("8", "7");
		this.text = text_func ? text_func() : "";
		this.text_func = text_func;
		this.on_hit_func = on_hit_func;
	}

	Update() {
		this.text = this.text_func();
	}
}

const kWheelPopupTextPos = new Point(150, 75);
const kWheelPopupTextColor = "255,255,255";

class BonusWheelPointSpace extends BonusWheelSpace {
	constructor({ active_color, value_func }) {
		super({ active_color });
		this.text_func = this.GetText;
		this.on_hit_func = this.OnHit;
		this.value_func = value_func;
	}

	GetText() {
		return FormatNumberMedium(this.value_func()) + " points";
	}

	OnHit(machine, multi_spin) {
		let save_file = machine.GetSaveData();
		let value = this.value_func() * multi_spin;
		if (machine.IsUnlocked("better_buff_multiplier")) {
			value *= save_file.stats.max_buff_multiplier;
		} else if (machine.IsScoreBuffActive()) {
			value *= save_file.score_buff_multiplier;
		}
		machine.AddScore(value);
		save_file.stats.bonus_wheel_points_scored += value;
		MaybeAddBonusWheelText({
			text: `+${FormatNumberMedium(value)} points`,
			pos: kWheelPopupTextPos,
			color_rgb: kWheelPopupTextColor
		});
	}

	Update() {
		this.text = this.text_func();
	}
}

function SpinBonusWheel() {
	const machine = ActiveMachine(state);
	if (machine.bonus_wheel) {
		machine.bonus_wheel.Spin();
		UpdateSpinCounter();
	}
}

function UpdateSpinCounter() {
	const machine = ActiveMachine(state);
	if (!machine.bonus_wheel || !machine.IsUnlocked("unlock_bonus_wheel")) {
		UpdateDisplay("bonus_wheel", "none");
		return;
	}
	const save_data = machine.GetSaveData();
	UpdateDisplay("bonus_wheel", "inline");
	UpdateInnerHTML("spin_count", FormatNumberLong(save_data.spins));
	document.getElementById("button_spin").disabled =
		machine.bonus_wheel.IsSpinning() || save_data.spins <= 0;
	UpdateDisplay("multi_spin", machine.IsUnlocked("multi_spin") ? "inline" : "none");
	UpdateInnerHTML("multi_spin_count", FormatNumberLong(machine.bonus_wheel.multi_spin));
}
