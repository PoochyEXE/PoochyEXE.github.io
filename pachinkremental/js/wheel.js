class BonusWheel {
	constructor(spaces) {
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
		let decel = kBaseDecel * state.bonus_wheel_speed;
		let delta = Math.sqrt(decel * this.spin_distance);
		if (this.spin_distance <= delta) {
			this.Rotate(this.spin_distance);
			this.spin_distance = 0;
			state.save_file.spins -= this.multi_spin;
			this.PositionToSpace(this.pos).on_hit_func(this.multi_spin);
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
		return FormatNumberShort(this.value_func()) + " points";
	}

	OnHit(multi_spin) {
		let value = this.value_func() * multi_spin;
		if (IsUnlocked("better_buff_multiplier")) {
			value *= state.save_file.stats.max_buff_multiplier;
		} else if (IsScoreBuffActive()) {
			value *= state.save_file.score_buff_multiplier;
		}
		AddScore(value);
		MaybeAddBonusWheelText({
			text: `+${FormatNumberShort(value)} points`,
			pos: kWheelPopupTextPos,
			color_rgb: kWheelPopupTextColor
		});
	}

	Update() {
		this.text = this.text_func();
	}
}

function DefaultWheel() {
	let spaces = Array(0);
	spaces.push(
		new BonusWheelPointSpace({
			active_color: "#8F8",
			value_func: () => {
				let multiplier = state.special_ball_multiplier;
				if (IsUnlocked("better_point_values")) {
					multiplier = Math.pow(multiplier, state.emerald_ball_exponent)
				}
				return GetSlotValue(4) * multiplier;
			}
		})
	);
	spaces.push(
		new BonusWheelPointSpace({
			active_color: "#8FF",
			value_func: () => GetSlotValue(3)
		})
	);
	spaces.push(
		new BonusWheelPointSpace({
			active_color: "#88F",
			value_func: () => GetSlotValue(4)
		})
	);
	spaces.push(
		new BonusWheelSpace({
			active_color: "#F8F",
			text_func: () =>
				IsUnlocked("better_drops_2")
					? "Drop 3 gemstone balls"
					: "Drop 3 gold balls",

			on_hit_func: (multi_spin) => {
				if (IsUnlocked("better_multi_spin")) {
					state.save_file.spins += multi_spin - 1;
				}
				if (IsUnlocked("better_drops_3")) {
					DropBonusBalls(
						ShuffleArray([
							kBallTypeIDs.TOPAZ,
							kBallTypeIDs.TURQUOISE,
							kBallTypeIDs.AMETHYST
						])
					);
					MaybeAddBonusWheelText({
						text: "3 gemstone balls!",
						pos: kWheelPopupTextPos,
						color_rgb: kWheelPopupTextColor
					});
				} else if (IsUnlocked("better_drops_2")) {
					DropBonusBalls(
						ShuffleArray([
							kBallTypeIDs.RUBY,
							kBallTypeIDs.SAPPHIRE,
							kBallTypeIDs.EMERALD
						])
					);
					MaybeAddBonusWheelText({
						text: "3 gemstone balls!",
						pos: kWheelPopupTextPos,
						color_rgb: kWheelPopupTextColor
					});
				} else {
					DropBonusBalls([
						kBallTypeIDs.GOLD,
						kBallTypeIDs.GOLD,
						kBallTypeIDs.GOLD
					]);
					MaybeAddBonusWheelText({
						text: "3 gold balls!",
						pos: kWheelPopupTextPos,
						color_rgb: kWheelPopupTextColor
					});
				}
			}
		})
	);
	spaces.push(
		new BonusWheelSpace({
			active_color: "#F88",
			text_func: () => "ZONK",
			on_hit_func: () => {
				MaybeAddBonusWheelText({
					text: "*sad trombone*",
					pos: kWheelPopupTextPos,
					color_rgb: kWheelPopupTextColor
				});
			}
		})
	);
	spaces.push(
		new BonusWheelSpace({
			active_color: "#FF8",
			text_func: () => {
				if (!IsUnlocked("better_drops_1")) {
					return "Drop 7 gold balls";
				} else if (IsUnlocked("unlock_opal_balls")) {
					return "Drop 7 gemstone balls";
				} else {
					return "Drop 7 special balls";
				}
			},
			on_hit_func: (multi_spin) => {
				if (IsUnlocked("better_multi_spin")) {
					state.save_file.spins += multi_spin - 1;
				}
				if (IsUnlocked("better_drops_1")) {
					let bonus_balls = [];
					bonus_balls.push(
						IsUnlocked("unlock_ruby_balls")
							? kBallTypeIDs.RUBY
							: kBallTypeIDs.GOLD
					);
					bonus_balls.push(
						IsUnlocked("unlock_sapphire_balls")
							? kBallTypeIDs.SAPPHIRE
							: kBallTypeIDs.GOLD
					);
					bonus_balls.push(
						IsUnlocked("unlock_emerald_balls")
							? kBallTypeIDs.EMERALD
							: kBallTypeIDs.GOLD
					);
					bonus_balls.push(
						IsUnlocked("unlock_topaz_balls")
							? kBallTypeIDs.TOPAZ
							: kBallTypeIDs.GOLD
					);
					bonus_balls.push(
						IsUnlocked("unlock_turquoise_balls")
							? kBallTypeIDs.TURQUOISE
							: kBallTypeIDs.GOLD
					);
					bonus_balls.push(
						IsUnlocked("unlock_amethyst_balls")
							? kBallTypeIDs.AMETHYST
							: kBallTypeIDs.GOLD
					);
					bonus_balls.push(
						IsUnlocked("unlock_opal_balls")
							? kBallTypeIDs.OPAL
							: kBallTypeIDs.GOLD
					);
					bonus_balls = ShuffleArray(bonus_balls);
					DropBonusBalls(bonus_balls);
					let popup_text = IsUnlocked("unlock_opal_balls")
						? "7 gemstone balls!"
						: "7 special balls!";
					MaybeAddBonusWheelText({
						text: popup_text,
						pos: kWheelPopupTextPos,
						color_rgb: kWheelPopupTextColor
					});
				} else {
					DropBonusBalls([...Array(7)].map(_ => kBallTypeIDs.GOLD));
					MaybeAddBonusWheelText({
						text: "7 gold balls!",
						pos: kWheelPopupTextPos,
						color_rgb: kWheelPopupTextColor
					});
				}
			}
		})
	);
	return new BonusWheel(spaces);
}
