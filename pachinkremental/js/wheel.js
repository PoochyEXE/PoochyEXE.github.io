class BonusWheel {
	constructor(spaces) {
		this.spaces = spaces;
		this.pos = 0.5 / spaces.length;
		this.spin_distance = 0.0;  // Revolutions left to turn on current spin
	}
	
	IsSpinning() {
		return this.spin_distance > 0.0;
	}
	
	Spin() {
		if (this.IsSpinning() || state.save_file.spins <= 0) {
			return false;
		}
		this.spin_distance = Math.random() * 2 + 2.0;
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
			--state.save_file.spins;
			UpdateSpinCounter();
			this.PositionToSpace(this.pos).on_hit_func();
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
		this.text = text_func();
		this.text_func = text_func;
		this.on_hit_func = on_hit_func;
	}
	
	Update() {
		this.text = this.text_func();
	}
}

function DefaultWheel(state) {
	const kPopupTextPos = new Point(150, 75);
	const kPopupTextColor = "255,255,255"
	let spaces = Array(0);
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#8F8",
		/*inactive_color=*/"#7D7",
		/*text_func=*/function() {
			return FormatNumberShort(state.target_sets[0].targets[4].value * state.gold_ball_multiplier) + " points";
		},
		/*on_hit_func=*/function() { 
			AddScore(state.target_sets[0].targets[4].value * state.gold_ball_multiplier);
			state.wheel_popup_text.push(new RisingText("+" + this.text, kPopupTextPos, kPopupTextColor));
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#8FF",
		/*inactive_color=*/"#7DD",
		/*text_func=*/function() { return FormatNumberShort(state.target_sets[0].targets[3].value) + " points"; },
		/*on_hit_func=*/function() {
			AddScore(state.target_sets[0].targets[3].value);
			state.wheel_popup_text.push(new RisingText("+" + this.text, kPopupTextPos, kPopupTextColor));
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#88F",
		/*inactive_color=*/"#77D",
		/*text_func=*/function() { return FormatNumberShort(state.target_sets[0].targets[4].value) + " points"; },
		/*on_hit_func=*/function() {
			AddScore(state.target_sets[0].targets[4].value);
			state.wheel_popup_text.push(new RisingText("+" + this.text, kPopupTextPos, kPopupTextColor));
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#F8F",
		/*inactive_color=*/"#D7D",
		/*text_func=*/function() { return "Drop 3 gold balls"; },
		/*on_hit_func=*/function() {
			DropBonusGoldBalls(3);
			state.wheel_popup_text.push(new RisingText("3 gold balls!", kPopupTextPos, kPopupTextColor));
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#F88",
		/*inactive_color=*/"#D77",
		/*text_func=*/function() { return "ZONK"; },
		/*on_hit_func=*/function() {
			state.wheel_popup_text.push(new RisingText("*sad trombone*", kPopupTextPos, kPopupTextColor));
		},
	));
	spaces.push(new BonusWheelSpace(
		/*active_color=*/"#FF8",
		/*inactive_color=*/"#DD7",
		/*text_func=*/function() { return "Drop 7 gold balls"; },
		/*on_hit_func=*/function() {
			DropBonusGoldBalls(7); 
			state.wheel_popup_text.push(new RisingText("7 gold balls!", kPopupTextPos, kPopupTextColor));
		},
	));
	return new BonusWheel(spaces);
}