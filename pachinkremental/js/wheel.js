class BonusWheel {
	constructor(spaces) {
		this.spaces = spaces;
		this.pos = 0.5 / spaces.length;
		this.spin_distance = 0.0;  // Revolutions left to turn on current spin
		this.multi_spin = 1;
	}
	
	IsSpinning() {
		return this.spin_distance > 0.0;
	}
	
	UpdateAllSpaces() {
		for (let i = 0; i < this.spaces.length; ++i) {
			this.spaces[i].Update();
		}
	}
	
	Spin() {
		if (this.IsSpinning() || state.save_file.spins <= 0) {
			return false;
		}
		if (MultiSpinOn()) {
			this.multi_spin = Math.ceil(state.save_file.spins * 0.1);
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
		if (index < 0){
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
		const kDecel = 0.001;  // 0.002 revs/sec/sec
		let delta = Math.sqrt(kDecel * this.spin_distance);
		if (this.spin_distance <= delta) {
			this.Rotate(this.spin_distance);
			this.spin_distance = 0;
			state.save_file.spins -= this.multi_spin;
			UpdateSpinCounter();
			this.PositionToSpace(this.pos).on_hit_func(this.multi_spin);
		} else {
			this.Rotate(delta);
			this.spin_distance -= delta;
		}
	}
}

class BonusWheelSpace {
	constructor(active_color, inactive_color, text_func, on_hit_func) {
		this.active_color = active_color;
		this.inactive_color = inactive_color;
		this.text = text_func ? text_func() : "";
		this.text_func = text_func;
		this.on_hit_func = on_hit_func;
	}
	
	Update() {
		this.text = this.text_func();
	}
}

const kWheelPopupTextPos = new Point(150, 75);
const kWheelPopupTextColor = "255,255,255"

class BonusWheelPointSpace extends BonusWheelSpace {
	constructor(active_color, inactive_color, value_func) {
		super(active_color, inactive_color,
				/*text_func=*/null,
				/*on_hit_func=*/null);
		this.text_func = this.GetText;
		this.on_hit_func = this.OnHit;
		this.value_func = value_func;
	}
	
	GetText() {
		return FormatNumberShort(this.value_func()) + " points";
	}
	
	OnHit(multi_spin) {
		let value = this.value_func() * multi_spin;
		AddScore(value);
		MaybeAddBonusWheelText("+" + FormatNumberShort(value) + " points",
				kWheelPopupTextPos, kWheelPopupTextColor);
	}
	
	Update() {
		this.text = this.text_func();
	}
}

function DefaultWheel() {
	let spaces = Array(0);
	spaces.push(new BonusWheelPointSpace(
		/*active_color=*/"#8F8",
		/*inactive_color=*/"#7D7",
		/*value_func=*/function() {
			return GetSlotValue(4) * state.special_ball_multiplier;
		},
	));
	spaces.push(new BonusWheelPointSpace(
		/*active_color=*/"#8FF",
		/*inactive_color=*/"#7DD",
		/*value_func=*/function() {
			return GetSlotValue(3);
		},
	));
	spaces.push(new BonusWheelPointSpace(
		/*active_color=*/"#88F",
		/*inactive_color=*/"#77D",
		/*value_func=*/function() {
			return GetSlotValue(4);
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#F8F",
		/*inactive_color=*/"#D7D",
		/*text_func=*/function() {
			if (AllTier1GemstoneBallsUnlocked()) {
				return "Drop 3 gemstone balls";
			} else {
				return "Drop 3 gold balls";
			}
		},
		/*on_hit_func=*/function() {
			if (AllTier2GemstoneBallsUnlocked()) {
				DropBonusBalls([kBallTypeIDs.TOPAZ, kBallTypeIDs.TURQUOISE, kBallTypeIDs.AMETHYST]);
				MaybeAddBonusWheelText("3 gemstone balls!", kWheelPopupTextPos, kWheelPopupTextColor);
			} else if (AllTier1GemstoneBallsUnlocked()) {
				DropBonusBalls([kBallTypeIDs.RUBY, kBallTypeIDs.SAPPHIRE, kBallTypeIDs.EMERALD]);
				MaybeAddBonusWheelText("3 gemstone balls!", kWheelPopupTextPos, kWheelPopupTextColor);
			} else {
				DropBonusBalls([kBallTypeIDs.GOLD, kBallTypeIDs.GOLD, kBallTypeIDs.GOLD]);
				MaybeAddBonusWheelText("3 gold balls!", kWheelPopupTextPos, kWheelPopupTextColor);
			}
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#F88",
		/*inactive_color=*/"#D77",
		/*text_func=*/function() { return "ZONK"; },
		/*on_hit_func=*/function() {
			MaybeAddBonusWheelText("*sad trombone*", kWheelPopupTextPos, kWheelPopupTextColor);
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#FF8",
		/*inactive_color=*/"#DD7",
		/*text_func=*/function() {
			if (AnyTier1GemstoneBallsUnlocked()) {
				return "Drop 7 special balls";
			} else {
				return "Drop 7 gold balls";
			}
		},
		/*on_hit_func=*/function() {
			let bonus_balls = [kBallTypeIDs.GOLD]
			bonus_balls.push(IsUnlocked("unlock_ruby_balls")      ? kBallTypeIDs.RUBY      : kBallTypeIDs.GOLD);
			bonus_balls.push(IsUnlocked("unlock_sapphire_balls")  ? kBallTypeIDs.SAPPHIRE  : kBallTypeIDs.GOLD);
			bonus_balls.push(IsUnlocked("unlock_emerald_balls")   ? kBallTypeIDs.EMERALD   : kBallTypeIDs.GOLD);
			bonus_balls.push(IsUnlocked("unlock_topaz_balls")     ? kBallTypeIDs.TOPAZ     : kBallTypeIDs.GOLD);
			bonus_balls.push(IsUnlocked("unlock_turquoise_balls") ? kBallTypeIDs.TURQUOISE : kBallTypeIDs.GOLD);
			bonus_balls.push(IsUnlocked("unlock_amethyst_balls")  ? kBallTypeIDs.AMETHYST  : kBallTypeIDs.GOLD);
			DropBonusBalls(bonus_balls);
			MaybeAddBonusWheelText(AnyTier1GemstoneBallsUnlocked() ? "7 special balls!" : "7 gold balls!", kWheelPopupTextPos, kWheelPopupTextColor);
		},
	));
	return new BonusWheel(spaces);
}