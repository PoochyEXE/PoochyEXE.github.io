const kFirstMachineID = "first";

const kFirstMachineBallTypes = [
	//          | id |    name    | display_name |      physics_params       | inner_color | outer_color | ripple_color_rgb |
	kNormalBallType,
	new BallType(1,   "gold",      "Gold ",       kPhysicsParams.normal,     "#FFD700",    "#AA8F00",    "170,143,  0"    ),
	new BallType(2,   "ruby",      "Ruby ",       kPhysicsParams.normal,     "#FBB",       "#F33",       "255, 48, 48"    ),
	new BallType(3,   "sapphire",  "Sapphire ",   kPhysicsParams.normal,     "#BBF",       "#33F",       " 48, 48,255"    ),
	new BallType(4,   "emerald",   "Emerald ",    kPhysicsParams.normal,     "#BFB",       "#3F3",       " 48,255, 48"    ),
	new BallType(5,   "topaz",     "Topaz ",      kPhysicsParams.normal,     "#FFB",       "#FF3",       "255,255, 48"    ),
	new BallType(6,   "turquoise", "Turquoise ",  kPhysicsParams.normal,     "#BFF",       "#3FF",       " 48,255,255"    ),
	new BallType(7,   "amethyst",  "Amethyst ",   kPhysicsParams.normal,     "#FBF",       "#F3F",       "255, 48,255"    ),
	new BallType(8,   "opal",      "Opal ",       kPhysicsParams.normal,     kPrismatic,   kPrismatic,   kPrismatic       ),
	new BallType(9,   "eight",     "8-",          kPhysicsParams.normal,     k8Ball,       k8Ball,       "246, 31,183"    ),
	new BallType(10,  "beach",     "Beach ",      kPhysicsParams.beach_ball, kBeachBall,   kBeachBall,   kBeachBall       ),
];

const kFirstMachineBallTypeIDs = {
	NORMAL: 0,
	GOLD: 1,
	RUBY: 2,
	SAPPHIRE: 3,
	EMERALD: 4,
	TOPAZ: 5,
	TURQUOISE: 6,
	AMETHYST: 7,
	OPAL: 8,
	EIGHT_BALL: 9,
	BEACH_BALL: 10,
};

const kFirstMachinePopupTextOptions = [
	"Enable All",
	"Gold+ only",
	"Gemstone+ only",
	"8-Ball+ only",
	"Disable All",
];

const kFirstMachineStatsEntries = [
	new StatsEntry({
		id: "max_buff_multiplier",
		display_name: "Highest buff multiplier",
	}),
	new StatsEntry({
		id: "bonus_wheel_points_scored",
		display_name: "Points scored by Bonus Wheel",
	}),
	new StatsEntry({
		id: "longest_lasting_beach_ball",
		display_name: "Longest-lasting Beach Ball",
		suffix: " seconds",
	}),
	new StatsEntry({
		id: "max_beach_ball_rotated_degrees",
		display_name: "Most rotations by a Beach Ball",
		suffix: "&deg;",
	}),
]

class CenterSlotTarget extends ScoreTarget {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, id, active, value }) {
		super({
			machine,
			pos,
			draw_radius,
			hitbox_radius,
			color,
			id,
			active,
			value,
			pass_through: false
		});
	}

	OnHit(ball) {
		super.OnHit(ball);
		this.machine.OnCenterSlotHit(ball);
	}
}

class SpinTarget extends Target {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, id }) {
		super({
			machine,
			pos,
			draw_radius,
			hitbox_radius,
			color,
			text: "Spin",
			id,
			pass_through: true
		});
	}

	OnHit(ball) {
		let text_pos = new Point(ball.pos.x, ball.pos.y);
		if (
			this.machine.HasTurquoiseSpecial(ball.ball_type_index) &&
			this.machine.IsUnlocked("turquoise_synergy")
		) {
			this.machine.AwardPoints(this.machine.CenterSlotValue(), ball);
			text_pos.y -= 10;
		}
		this.machine.AwardSpins(ball, text_pos);
	}
}

class FirstMachine extends PachinkoMachine {
	constructor(id, display_name) {
		super(id, display_name, kFirstMachineBallTypes);

		this.special_ball_multiplier = 2;
		this.sapphire_ball_exponent = 1.0;
		this.emerald_ball_exponent = 2.0;
		this.eight_ball_score_exponent = 1.0;
		this.eight_ball_spin_exponent = 1.0;
		this.beach_ball_score_exponent = 1.0;
		this.beach_ball_spin_exponent = 0.5;
		this.bonus_wheel = this.InitWheel();
		this.bonus_wheel_speed = 1.0;
	}

	OnActivate() {
		this.bonus_wheel = this.InitWheel();
	}

	BallTypes() {
		return kFirstMachineBallTypes;
	}

	DefaultSaveData() {
		let save_data = super.DefaultSaveData();
		save_data.spins = 0;
		save_data.score_buff_multiplier = 0;
		save_data.score_buff_duration = 0;
		save_data.score_buff_time_dilation = 1.0;
		save_data.options.auto_spin_enabled = false;
		save_data.options.multi_spin_enabled = false;
		return save_data;
	}

	InitStatsEntries() {
		return kFirstMachineStatsEntries;
	}

	TogglePopupText() {
		let options = this.GetSaveData().options;
		++options.display_popup_text;
		if (
			options.display_popup_text == 1 &&
			!this.IsUnlocked("unlock_gold_balls")
		) {
			options.display_popup_text = kFirstMachinePopupTextOptions.length - 1;
		} else if (
			options.display_popup_text == 2 &&
			!this.AnyTier1GemstoneBallsUnlocked()
		) {
			options.display_popup_text = kFirstMachinePopupTextOptions.length - 1;
		}
		if (options.display_popup_text >= kFirstMachinePopupTextOptions.length) {
			options.display_popup_text = 0;
		}
	}

	CurrentPopupTextOptionName() {
		return kFirstMachinePopupTextOptions[this.GetSetting("display_popup_text")];
	}

	UpgradeHeaders() {
		return [
			new UpgradeHeader(this, "board", "Board"),
			new UpgradeHeader(this, "auto_drop", "Auto-Drop", this.upgrades["auto_drop"].visible_func),
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kFirstMachineBallTypeIDs.GOLD]
			),
			new UpgradeHeader(this, "bonus_wheel", "Bonus Wheel", this.upgrades["unlock_bonus_wheel"].visible_func),
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kFirstMachineBallTypeIDs.EIGHT_BALL]
			),
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kFirstMachineBallTypeIDs.BEACH_BALL]
			),
			new UpgradeHeader(
				this,
				"gemstone_balls",
				"Gemstone Balls",
				() => {
					return this.ShouldDisplayGemstoneBallUpgrades();
				},
				[
					"ruby_balls",
					"topaz_balls",
					"emerald_balls",
					"turquoise_balls",
					"sapphire_balls",
					"amethyst_balls",
					"opal_balls"
				],
				"Gemstone balls have the benefits of gold balls (including not counting towards the max balls limit), plus additional bonuses.<br>NOTE: Each gemstone ball unlocked sharply increases the cost of unlocking the others!"
			),
		];
	}

	BaseSlotValues() {
		return [20, 100, 200, 1, 250, 1, 200, 100, 20];
	}

	InitBoard() {
		const kBaseSlotValues = this.BaseSlotValues();
		const kHorizontalSpacing = 18;
		const kWallSpacing = 4;
		const kHalfWallSpace = kWallSpacing / 2;
		const kVerticalSpacing = (Math.sqrt(3) * kHorizontalSpacing) / 2;
		const kColumns = kBaseSlotValues.length;
		const kRows = 13;
		const kBottomSlotRows = 5;
		const kWidth = kHorizontalSpacing * kColumns + kWallSpacing;
		const kHeight = 256;

		let pegs = Array(0);
		let border_polyline = Array(0);
		const left_wall_x = kHalfWallSpace;
		const right_wall_x = kWidth - kHalfWallSpace;
		const top_y = kHalfWallSpace;
		const bottom_y = kHeight - kHalfWallSpace;
		border_polyline.push(new Point(left_wall_x, top_y));
		var y = kHeight - kHalfWallSpace;
		for (let col = 0; col <= kColumns; ++col) {
			const x = col * kHorizontalSpacing + left_wall_x;
			border_polyline.push(new Point(x, bottom_y));
		}
		border_polyline.push(new Point(right_wall_x, top_y));
		AppendInterpolatedPolyline(pegs, border_polyline, kWallSpacing);

		var y = kHeight - kHalfWallSpace - kWallSpacing;
		for (let row = 1; row < kBottomSlotRows; ++row) {
			for (let col = 1; col < kColumns; ++col) {
				const x = col * kHorizontalSpacing + kHalfWallSpace;
				pegs.push(new Point(x, y));
			}
			y -= kWallSpacing;
		}
		for (let row = 0; row < kRows; ++row) {
			if (row % 2 == 0) {
				for (let col = 1; col < kColumns; ++col) {
					const x = col * kHorizontalSpacing + kHalfWallSpace;
					pegs.push(new Point(x, y));
				}
			} else {
				for (let col = 0; col < kColumns; ++col) {
					const x = (col + 0.5) * kHorizontalSpacing + kHalfWallSpace;
					pegs.push(new Point(x, y));
				}
				const y_above = y - kVerticalSpacing / 4;
				const x_left = 0.25 * kHorizontalSpacing + kHalfWallSpace;
				const x_right = kWidth - x_left;
				pegs.push(new Point(x_left, y_above));
				pegs.push(new Point(x_right, y_above));
			}
			y -= kVerticalSpacing;
		}
		let min_drop_x = 10;
		let max_drop_x = kWidth - 10;
		let min_drop_y = 0;
		let max_drop_y = y;
		let drop_zones = [
			new Rectangle(min_drop_x, max_drop_x, min_drop_y, max_drop_y)
		];

		const kDrawRadius = (kHorizontalSpacing - kWallSpacing) / 2;
		const kTargetColor = "#8FF";
		const kHitboxRadius = Math.min(kDrawRadius * 1.5 - kBallRadius);

		let target_sets = Array(0);

		const kBottomTargetY = kHeight - kDrawRadius - kWallSpacing;
		let bottom_targets = Array(0);
		for (let col = 0; col < kBaseSlotValues.length; ++col) {
			const x = (col + 0.5) * kHorizontalSpacing + kHalfWallSpace;
			const pos = new Point(x, kBottomTargetY);
			const value = kBaseSlotValues[col];
			if (col == 4) {
				bottom_targets.push(
					new CenterSlotTarget({
						machine: this,
						pos,
						draw_radius: kDrawRadius,
						hitbox_radius: kHitboxRadius,
						color: kTargetColor,
						id: col,
						active: true,
						value
					})
				);
			} else {
				bottom_targets.push(
					new ScoreTarget({
						machine: this,
						pos,
						draw_radius: kDrawRadius,
						hitbox_radius: kHitboxRadius,
						color: kTargetColor,
						id: col,
						active: true,
						value,
						pass_through: false
					})
				);
			}
		}
		target_sets.push(new TargetSet(bottom_targets));

		const kSpinTargetColor = "rgba(0, 0, 255, 0.5)";
		const kSpinTargetY =
			kHeight - kWallSpacing * (kBottomSlotRows + 0.5) - kVerticalSpacing * 2;
		let spin_targets = Array(0);
		const left_x = 1.5 * kHorizontalSpacing + kHalfWallSpace;
		const center_x = 4.5 * kHorizontalSpacing + kHalfWallSpace;
		const right_x = 7.5 * kHorizontalSpacing + kHalfWallSpace;
		spin_targets.push(
			new SpinTarget({
				machine: this,
				pos: new Point(left_x, kSpinTargetY),
				draw_radius: kDrawRadius,
				hitbox_radius: kHitboxRadius,
				color: kSpinTargetColor,
				id: "spin_left"
			})
		);
		spin_targets.push(
			new SpinTarget({
				machine: this,
				pos: new Point(center_x, kSpinTargetY),
				draw_radius: kDrawRadius,
				hitbox_radius: kHitboxRadius,
				color: kSpinTargetColor,
				id: "spin_center"
			})
		);
		spin_targets.push(
			new SpinTarget({
				machine: this,
				pos: new Point(right_x, kSpinTargetY),
				draw_radius: kDrawRadius,
				hitbox_radius: kHitboxRadius,
				color: kSpinTargetColor,
				id: "spin_right"
			})
		);
		target_sets.push(new TargetSet(spin_targets));

		return new PegBoard(kWidth, kHeight, pegs, drop_zones, target_sets);
	}

	UpdateBottomTargets() {
		const kBaseSlotValues = this.BaseSlotValues();
		let bottom_targets = this.board.target_sets[0].targets;
		console.assert(bottom_targets.length == 9);
		let multiplier = this.GetUpgradeValue("multiplier");
		for (let i = 0; i < kBaseSlotValues.length; ++i) {
			let base_value = kBaseSlotValues[i];
			if (i == 4) {
				base_value = this.GetUpgradeValue("center_value");
			}
			bottom_targets[i].SetValue(base_value * multiplier);
		}
		state.redraw_targets = true;
	}

	InitUpgrades() {
		const kTimesSymbol = "×";
		let upgrades_list = new Array();
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "multiplier",
				name: "Point Multiplier",
				category: "board",
				description: "Multipiles all point gains.",
				cost_func: level => 200 * Math.pow(200, level),
				value_func: level => Math.pow(5, level),
				max_level: Infinity,
				value_suffix: kTimesSymbol,
				visible_func: null,
				on_update: () => this.UpdateBottomTargets(),
				on_buy: (level) => {
					let color_rgb =
						GetSetting("dark_mode") ? "48,96,255" : "0,0,255"
					let bottom_targets = this.board.target_sets[0].targets;
					for (let i = 0; i < bottom_targets.length; ++i) {
						MaybeAddScoreText({
							level: 3,
							text: "×5",
							pos: bottom_targets[i].pos,
							color_rgb: color_rgb,
							opacity: 1.0,
						});
					}
					this.bonus_wheel.UpdateAllSpaces();
				}
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "center_value",
				name: "Center Slot Value",
				category: "board",
				description: "Point value of the bottom center slot.",
				cost_func: level => 100 * Math.pow(5, level),
				value_func: level => 250 * Math.pow(2, level),
				max_level: Infinity,
				value_suffix: "",
				visible_func: null,
				on_update: () => this.UpdateBottomTargets(),
				on_buy: (level) => {
					let color_rgb =
						GetSetting("dark_mode") ? "48,96,255" : "0,0,255"
					let pos = this.board.target_sets[0].targets[4].pos;
					MaybeAddScoreText({
						level: 3,
						text: "×2",
						pos: pos,
						color_rgb: color_rgb,
						opacity: 1.0,
					});
					this.bonus_wheel.UpdateAllSpaces();
				}
			})
		);
		upgrades_list.push(
			new ToggleUnlockUpgrade({
				machine: this,
				id: "auto_drop",
				name: "Auto-Drop",
				category: "auto_drop",
				description:
					"Automatically drops a ball when allowed. Click in the drop zone to move the drop position.",
				cost: 100000,
				visible_func: () => this.GetUpgradeLevel("center_value") > 1,
				on_update: () => {
					state.redraw_auto_drop = true;
				}
			})
		);
		upgrades_list.push(
			new DelayReductionUpgrade({
				machine: this,
				id: "auto_drop_delay",
				name: "Auto-Drop Delay",
				category: "auto_drop",
				description: "Decreases the auto drop delay.",
				cost_func: level => 200000 * Math.pow(2, level),
				value_func: level =>
					Math.max(100, Math.floor(Math.pow(0.9, level) * 1000.0)),
				max_level: 22,
				item_suffix: "balls",
				visible_func: () => this.IsUnlocked("auto_drop"),
				on_update: function() {
					state.auto_drop_cooldown = this.GetValue();
					if (state.auto_drop_cooldown_left > state.auto_drop_cooldown) {
						state.auto_drop_cooldown_left = state.auto_drop_cooldown;
					}
					state.redraw_auto_drop = true;
				},
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "max_balls",
				name: "Max Balls",
				category: "board",
				description:
					"Maximum number of balls allowed on the board at once.",
				cost_func: level => 200000 * Math.pow(2, level),
				value_func: level => level + 1,
				max_level: 49,
				value_suffix: "",
				visible_func: () => this.GetUpgradeLevel("center_value") > 1,
				on_update: function() {
					this.machine.max_balls = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.GOLD],
				ball_description:
					"Gold balls are worth double points and don't count towards the max balls limit.",
				cost_func: () => 500000,
				visible_func: () => this.GetUpgradeLevel("max_balls") > 0
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.GOLD],
				cost_func: level => 1000000 * Math.pow(2, level),
				value_func: level => level + 1,
				max_level: 14
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "gold_ball_value",
				name: "Gold Ball Value",
				category: "gold_balls",
				description: "Increases point multiplier for gold balls.",
				cost_func: level => 10000000 * Math.pow(10, level),
				value_func: level => level + 2,
				max_level: Infinity,
				value_suffix: kTimesSymbol,
				visible_func: () => this.IsUnlocked("unlock_gold_balls"),
				on_update: function() {
					this.machine.special_ball_multiplier = this.GetValue();
					this.machine.bonus_wheel.UpdateAllSpaces();
				},
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "unlock_bonus_wheel",
				name: "Unlock Bonus Wheel",
				unlocked_name: "Bonus Wheel",
				category: "bonus_wheel",
				description:
					"Unlocks the Bonus Wheel. Also adds 2 targets, which award a spin for each ball that passes through them. Point values on the wheel scale based on your upgrades.",
				cost: 2000000,
				visible_func: () => this.IsUnlocked("unlock_gold_balls"),
				on_update: function() {
					let unlocked = this.GetValue() > 0;
					UpdateDisplay("bonus_wheel", unlocked ? "inline" : "none");
					let spin_targets = this.machine.board.target_sets[1].targets;
					console.assert(spin_targets.length == 3);
					spin_targets[0].active = unlocked;
					spin_targets[2].active = unlocked;
					UpdateSpinCounter();
					this.machine.bonus_wheel.UpdateAllSpaces();
					state.redraw_targets = true;
				}
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "add_spin_target",
				name: "Extra Spin Target",
				category: "bonus_wheel",
				description: "Adds an extra target that awards Bonus Wheel spins.",
				cost: 10000000,
				visible_func: () => this.IsUnlocked("unlock_bonus_wheel"),
				on_update: function() {
					let unlocked = this.GetValue() > 0;
					let spin_targets = this.machine.board.target_sets[1].targets;
					console.assert(spin_targets.length == 3);
					spin_targets[1].active = unlocked;
					state.redraw_targets = true;
				}
			})
		);
		upgrades_list.push(
			new ToggleUnlockUpgrade({
				machine: this,
				id: "auto_spin",
				name: "Auto-Spin",
				category: "bonus_wheel",
				description: "Automatically spin the Bonus Wheel.",
				cost: 100000000,
				visible_func: () => this.IsUnlocked("unlock_bonus_wheel"),
				on_update: null
			})
		);
		upgrades_list.push(
			new ToggleUnlockUpgrade({
				machine: this,
				id: "multi_spin",
				name: "Multi-Spin",
				category: "bonus_wheel",
				description:
					"Uses 10% of your available spins at a time, multiplying any points you win from that spin. NOTE: Bonus gold ball drops are not multiplied.",
				cost: 100000000,
				visible_func: () => this.IsUnlocked("unlock_bonus_wheel"),
				on_update: null
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_drops_1",
				name: "Better Ball Drops",
				category: "bonus_wheel",
				description:
					'Change the "Drop 7 gold balls" space to "Drop 7 special balls". One gemstone ball of each type you have unlocked replaces one of the gold balls. This automatically updates as you unlock more gemstone balls.',
				cost: this.NthGemstoneBallUnlockCost(1),
				visible_func: () => {
					return this.AnyTier1GemstoneBallsUnlocked();
				},
				on_update: null
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_drops_2",
				name: "Better Ball Drops 2",
				category: "bonus_wheel",
				description:
					'Change the "Drop 3 gold balls" space to "Drop 3 gemstone balls", which drops 1 Ruby, 1 Emerald, and 1 Sapphire ball.',
				cost: this.NthGemstoneBallUnlockCost(3),
				visible_func: () => {
					return this.AllTier1GemstoneBallsUnlocked();
				},
				on_update: null
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_drops_3",
				name: "Better Ball Drops 3",
				category: "bonus_wheel",
				description:
					'Change the "Drop 3 gemstone balls" space to drop 1 Topaz, 1 Turquoise, and 1 Amethyst ball.',
				cost: this.NthGemstoneBallUnlockCost(6),
				visible_func: () => {
					return this.AllTier2GemstoneBallsUnlocked() &&
						this.IsUnlocked("better_drops_2");
				},
				on_update: null
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_drops_4",
				name: "Better Ball Drops 4",
				category: "bonus_wheel",
				description:
					'Change the "Drop 3 gemstone balls" space to "Drop 3 special balls", which drops 1 Opal ball, 1 8-Ball, and 1 Beach ball.',
				cost: 2e55,
				visible_func: () => {
					return this.IsUnlocked("unlock_beach_balls") &&
						this.IsUnlocked("better_drops_3");
				},
				on_update: null
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_buff_multiplier",
				name: "Better Buff Multiplier",
				category: "bonus_wheel",
				button_class: "rubyUpgradeButton",
				description:
					'Instead of applying the <i>current</i> score multiplier buff to points won from wheel spins, the <i>highest</i> multiplier you have ever achieved is applied.',
				cost: 1e48,
				visible_func: () =>
					this.IsMaxed("ruby_ball_rate") &&
					this.IsUnlocked("ruby_ball_buff_stackable"),
				on_update: () => {
					this.bonus_wheel.UpdateAllSpaces();
				}
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_point_values",
				name: "Better Point Values",
				category: "bonus_wheel",
				button_class: "emeraldUpgradeButton",
				description:
					'Makes the highest point value on the wheel scale to the value of emerald balls instead of gold balls.',
				cost: 1e68,
				visible_func: () => this.IsMaxed("emerald_ball_rate"),
				on_update: () => {
					this.bonus_wheel.UpdateAllSpaces();
				}
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "better_multi_spin",
				name: "Better Multi-Spin",
				category: "bonus_wheel",
				button_class: "sapphireUpgradeButton",
				description:
					'Refunds additional spins consumed by Multi-Spin when landing on a ball drop space. (Note: ZONK still wastes all spins consumed.)',
				cost: 1e51,
				visible_func: () => this.IsMaxed("sapphire_ball_rate"),
				on_update: () => {
					this.bonus_wheel.UpdateAllSpaces();
				}
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "bonus_wheel_speed",
				name: "Wheel Speed",
				category: "bonus_wheel",
				description: "Makes bonus wheel spins play out faster.",
				cost_func: level => 1e12 * Math.pow(10, level),
				value_func: level => (level / 10.0) + 1.0,
				max_level: 20,
				value_suffix: kTimesSymbol,
				visible_func: () =>
					this.IsUnlocked("better_drops_1") ||
					this.IsUnlocked("better_drops_2") ||
					this.IsUnlocked("better_drops_3"),
				on_update: function() {
					this.machine.bonus_wheel_speed = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.RUBY],
				ball_description:
					"Ruby balls are worth the same as a gold ball, plus if a ruby ball falls in the center slot, it activates a buff that doubles all points scored for 60 seconds.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => {
					return this.ShouldDisplayGemstoneBallUpgrades();
				},
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.RUBY],
				cost_func: this.Tier1GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "ruby_ball_buff_stackable",
				name: "Stackable Buff",
				category: "ruby_balls",
				description:
					"Makes the ruby ball buff stackable. If a ruby ball falls in the center slot while the buff is already active, it extends the duration. Any time over 60 seconds is converted to a multiplier increase. The time extension is inversely proportional to the existing multiplier.",
				cost: 1e18,
				visible_func: () => this.IsUnlocked("unlock_ruby_balls")
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.SAPPHIRE],
				ball_description:
					"Sapphire balls are worth the same as a gold ball, plus the gold ball multiplier is also applied to the number of bonus wheel spins earned by sapphire balls.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => {
					return this.ShouldDisplayGemstoneBallUpgrades();
				},
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.SAPPHIRE],
				cost_func: this.Tier1GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "sapphire_ball_exponent",
				name: "Sapphire Exponent",
				category: "sapphire_balls",
				description: "Increases the exponent on the gold ball value multiplier for sapphire balls. Note: The number of spins earned per sapphire ball is rounded down to the nearest whole number.",
				cost_func: level => 1e15 * Math.pow(5, level),
				value_func: level => (level / 10.0) + 1,
				max_level: 20,
				value_suffix: "",
				visible_func: () => this.IsUnlocked("unlock_sapphire_balls"),
				on_update: function() {
					this.machine.sapphire_ball_exponent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.EMERALD],
				ball_description:
					"Points scored by emerald balls are multiplied by the square of the gold ball multiplier.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => {
					return this.ShouldDisplayGemstoneBallUpgrades();
				},
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.EMERALD],
				cost_func: this.Tier1GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "emerald_ball_exponent",
				name: "Emerald Exponent",
				category: "emerald_balls",
				description: "Increases the exponent on the gold ball value multiplier for emerald balls.",
				cost_func: level => 1e15 * Math.pow(25, level),
				value_func: level => (level / 10.0) + 2,
				max_level: 10,
				value_suffix: "",
				visible_func: () => this.IsUnlocked("unlock_emerald_balls"),
				on_update: function() {
					this.machine.emerald_ball_exponent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.TOPAZ],
				ball_description:
					"Topaz balls have the bonuses of both ruby and emerald balls.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () =>
					this.IsUnlocked("unlock_ruby_balls") &&
					this.IsUnlocked("unlock_emerald_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.TOPAZ],
				cost_func: this.Tier2GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "topaz_synergy",
				name: "Topaz Synergy",
				category: "topaz_balls",
				description:
					'Makes the score buff multiplier awarded by Topaz balls equal to the Emerald exponent, e.g. an Emerald exponent of 3 means a Topaz ball in the center slot awards a 3&times; scoring buff instead of just 2&times; scoring.',
				cost: 1e24,
				visible_func: () =>
					this.IsUnlocked("unlock_topaz_balls") &&
					this.IsUnlocked("ruby_ball_buff_stackable") &&
					this.GetUpgradeLevel("emerald_ball_exponent") >= 1
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.TURQUOISE],
				ball_description:
					"Turquoise balls have the bonuses of both emerald and sapphire balls.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () =>
					this.IsUnlocked("unlock_emerald_balls") &&
					this.IsUnlocked("unlock_sapphire_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.TURQUOISE],
				cost_func: this.Tier2GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "turquoise_synergy",
				name: "Turquoise Synergy",
				category: "turquoise_balls",
				description:
					'If a Turquoise ball hits a spin target, it also awards the value of the center slot, and if it lands in the center slot, it also awards the spins for a hitting a spin target.',
				cost: 1e24,
				visible_func: () => this.IsUnlocked("unlock_turquoise_balls")
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.AMETHYST],
				ball_description:
					"Amethyst balls have the bonuses of both ruby and sapphire balls.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () =>
					this.IsUnlocked("unlock_ruby_balls") &&
					this.IsUnlocked("unlock_sapphire_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.AMETHYST],
				cost_func: this.Tier2GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "amethyst_synergy",
				name: "Amethyst Synergy",
				category: "amethyst_balls",
				description:
					'Applies the score buff multiplier to spins earned by Amethyst balls. (Spins awarded are rounded down to the nearest whole number.)',
				cost: 1e24,
				visible_func: () => this.IsUnlocked("unlock_amethyst_balls"),
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.OPAL],
				ball_description:
					"Opal balls have the combined bonuses of all the other gemstone balls.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => {
					return this.AllTier2GemstoneBallsUnlocked();
				},
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.OPAL],
				cost_func: level => 1e32 * Math.pow(5, level),
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 49
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.EIGHT_BALL],
				ball_description:
					'8-Balls are like Opal balls, but are worth 8&times; the points and spins of Opal balls, and awards an 8&times; scoring buff instead of 2&times;. (Score buff stacks additively with the Ruby ball buff.)<div class="flavorText">"Veemo!"</div>',
				cost_func: () => 888e33,
				visible_func: () =>
					this.IsUnlocked("unlock_opal_balls") &&
					this.IsUnlocked("ruby_ball_buff_stackable")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.EIGHT_BALL],
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
				machine: this,
				id: "eight_ball_score_exponent",
				name: "8-Ball Score Exponent",
				category: "eight_balls",
				description: "Increases the exponent on the 8&times; multiplier for points scored by 8-Balls.",
				cost_func: level => 888e33 * Math.pow(10, level),
				value_func: level => (level / 5.0) + 1,
				max_level: 35,
				value_suffix: "",
				visible_func: () =>
					this.IsUnlocked("unlock_eight_balls") &&
					this.IsMaxed("emerald_ball_exponent"),
				on_update: function() {
					this.machine.eight_ball_score_exponent = this.GetValue();
				},
			})
		);
		/*
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "eight_ball_spin_exponent",
				name: "8-Ball Spin Exponent",
				category: "eight_balls",
				description: "Increases the exponent on the 8&times; multiplier for spins earned by 8-Balls. Note: The number of spins earned per ball is rounded down to the nearest whole number.",
				cost_func: level => 888e33 * Math.pow(10, level),
				value_func: level => (level / 10.0) + 1,
				max_level: 70,
				value_suffix: "",
				visible_func: () =>
					this.IsUnlocked("unlock_eight_balls") &&
					this.IsMaxed("sapphire_ball_exponent"),
				on_update: function() {
					this.machine.eight_ball_spin_exponent = this.GetValue();
				},
			})
		);
		*/
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.BEACH_BALL],
				ball_description:
					"Beach balls are bouncier and floatier than other balls. They're worth double the points and spins of 8-balls, and award a 16&times; scoring buff.",
				cost_func: () => 1e50,
				visible_func: () => this.IsUnlocked("unlock_eight_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kFirstMachineBallTypeIDs.BEACH_BALL],
				cost_func: level => 1e51 * Math.pow(10, level),
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 24
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "beach_ball_time_based_multiplier",
				name: "Time-Based Multiplier",
				category: "beach_balls",
				description:
					"The more time a beach ball spends bouncing around, the more points and spins it's worth.",
				cost: 1e52,
				visible_func: () => this.IsUnlocked("unlock_beach_balls")
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "beach_ball_score_exponent",
				name: "Beach Ball Score Exponent",
				category: "beach_balls",
				description: "Increases the exponent on the time-based multiplier for points scored by Beach Balls.",
				cost_func: level => 1e53 * Math.pow(10, level),
				value_func: level => (level / 5.0) + 1,
				max_level: 5,
				value_suffix: "",
				visible_func: () =>
					this.IsUnlocked("beach_ball_time_based_multiplier"),
				on_update: function() {
					this.machine.beach_ball_score_exponent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "beach_ball_spin_exponent",
				name: "Beach Ball Spin Exponent",
				category: "beach_balls",
				description: "Increases the exponent on the time-based multiplier for spins earned by Beach Balls. Note: The number of spins earned per ball is rounded down to the nearest whole number.",
				cost_func: level => 1e53 * Math.pow(1e4, level),
				value_func: level => (level / 10.0) + 0.5,
				max_level: 5,
				value_suffix: "",
				visible_func: () =>
					this.IsUnlocked("beach_ball_time_based_multiplier"),
				on_update: function() {
					this.machine.beach_ball_spin_exponent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "beach_ball_rotation_multiplier",
				name: "Rotation Multiplier",
				category: "beach_balls",
				description:
					"The more a beach ball rotates, the more points it's worth. Stacks multiplicatively with Time-Based Multiplier.",
				cost: 1e72,
				visible_func: () =>
					this.IsUnlocked("beach_ball_time_based_multiplier"),
			})
		);

		let upgrades_map = {};
		for (let i = 0; i < upgrades_list.length; ++i) {
			let upgrade = upgrades_list[i];
			upgrades_map[upgrade.id] = upgrade;
		}

		return upgrades_map;
	}

	UpdateOneFrame(state) {
		if (this.bonus_wheel.IsSpinning()) {
			state.redraw_wheel = true;
			this.bonus_wheel.UpdateOneFrame();
		} else if (this.AutoSpinOn() && this.GetSaveData().spins > 0) {
			SpinBonusWheel();
		}
	}

	Draw(state) {
		if (
			state.redraw_all ||
			state.redraw_wheel ||
			state.wheel_popup_text.length > 0 ||
			state.last_drawn.num_wheel_popup_texts > 0
		) {
			state.redraw_wheel = false;
			DrawWheel(this.bonus_wheel);
			state.last_drawn.num_wheel_popup_texts = state.wheel_popup_text.length;
		}
	}

	NextUpgradeHint() {
		if (!this.IsUpgradeVisible("auto_drop")) {
			return "1K Center Slot Value";
		} else if (!this.IsUpgradeVisible("unlock_gold_balls")) {
			return "2 Max Balls";
		} else if (!this.IsUpgradeVisible("gold_ball_rate")) {
			return "Unlock Gold Balls";
		} else if (!this.ShouldDisplayGemstoneBallUpgrades()) {
			return "15% Gold Ball Rate and unlock Bonus Wheel";
		} else if (this.NumGemstoneBallsUnlocked() < 2) {
			return "Unlock any 2 of Ruby, Sapphire, and Emerald Balls";
		} else if (!this.AllTier1GemstoneBallsUnlocked()) {
			return "Unlock all 3 of Ruby, Sapphire, and Emerald Balls";
		} else if (!this.AllTier2GemstoneBallsUnlocked()) {
			return "Unlock all 3 of Topaz, Turquoise, and Amethyst Balls";
		} else if (!this.IsUpgradeVisible("unlock_eight_balls")) {
			return "Unlock Opal Balls and Stackable Buff";
		} else if (
			!this.IsUpgradeVisible("better_point_values") ||
			!this.IsUpgradeVisible("better_multi_spin") ||
			!this.IsUpgradeVisible("better_buff_multiplier")
		) {
			return "Max Ruby, Sapphire, and Emerald Ball Rates (10%). Each one reveals a different upgrade when maxed.";
		} else if (!this.IsUpgradeVisible("better_drops_4")) {
			return "Unlock Beach Balls.";
		} else if (!this.IsUnlocked("beach_ball_time_based_multiplier")) {
			return "Unlock Time-Based Multipiler for Beach Balls.";
		} else if (!this.AreAllUpgradesMaxed()) {
			return "Max all upgrades that can be maxed. (Costs about " + FormatNumberShort(9.87e77) + " points total. Point Multiplier, Center Slot Value, and Gold Ball Multiplier have no maximum.)";
		} else {
			return "None! Congratulations, you've maxed everything that can be maxed on this machine! Check the Machines section below for a new machine!"
		}
	}

	CenterSlotValue() {
		return this.GetUpgradeValue("center_value") * this.GetUpgradeValue("multiplier");
	}

	DropBonusBalls(ball_types) {
		let drop_zone = this.board.drop_zones[0];
		let y = (drop_zone.min_y + drop_zone.max_y) / 2;
		let spacing = (drop_zone.max_x - drop_zone.min_x) / (ball_types.length + 1);
		for (let i = 0; i < ball_types.length; ++i) {
			let x = spacing * (i + 1) + drop_zone.min_x;
			DropBall(x, y, ball_types[i]);
		}
	}

	InitWheel() {
		let spaces = Array(0);
		spaces.push(
			new BonusWheelPointSpace({
				active_color: "#8F8",
				value_func: () => {
					let multiplier = this.special_ball_multiplier;
					if (this.IsUnlocked("better_point_values")) {
						multiplier = Math.pow(multiplier, this.emerald_ball_exponent)
					}
					return this.CenterSlotValue() * multiplier;
				}
			})
		);
		spaces.push(
			new BonusWheelPointSpace({
				active_color: "#8FF",
				value_func: () => this.GetUpgradeValue("multiplier")
			})
		);
		spaces.push(
			new BonusWheelPointSpace({
				active_color: "#88F",
				value_func: () => this.CenterSlotValue()
			})
		);
		spaces.push(
			new BonusWheelSpace({
				active_color: "#F8F",
				text_func: () => {
					if (this.IsUnlocked("better_drops_4")) {
						return "Drop 3 special balls";
					} else if (this.IsUnlocked("better_drops_2")) {
						return "Drop 3 gemstone balls";
					} else {
						return "Drop 3 gold balls";
					}
				},
				on_hit_func: (machine, multi_spin) => {
					if (this.IsUnlocked("better_multi_spin")) {
						machine.GetSaveData().spins += multi_spin - 1;
					}
					if (this.IsUnlocked("better_drops_4")) {
						this.DropBonusBalls(
							ShuffleArray([
								kFirstMachineBallTypeIDs.OPAL,
								kFirstMachineBallTypeIDs.EIGHT_BALL,
								kFirstMachineBallTypeIDs.BEACH_BALL
							])
						);
						MaybeAddBonusWheelText({
							text: "3 special balls!",
							pos: kWheelPopupTextPos,
							color_rgb: kWheelPopupTextColor
						});
					} else if (this.IsUnlocked("better_drops_3")) {
						this.DropBonusBalls(
							ShuffleArray([
								kFirstMachineBallTypeIDs.TOPAZ,
								kFirstMachineBallTypeIDs.TURQUOISE,
								kFirstMachineBallTypeIDs.AMETHYST
							])
						);
						MaybeAddBonusWheelText({
							text: "3 gemstone balls!",
							pos: kWheelPopupTextPos,
							color_rgb: kWheelPopupTextColor
						});
					} else if (this.IsUnlocked("better_drops_2")) {
						this.DropBonusBalls(
							ShuffleArray([
								kFirstMachineBallTypeIDs.RUBY,
								kFirstMachineBallTypeIDs.SAPPHIRE,
								kFirstMachineBallTypeIDs.EMERALD
							])
						);
						MaybeAddBonusWheelText({
							text: "3 gemstone balls!",
							pos: kWheelPopupTextPos,
							color_rgb: kWheelPopupTextColor
						});
					} else {
						this.DropBonusBalls([
							kFirstMachineBallTypeIDs.GOLD,
							kFirstMachineBallTypeIDs.GOLD,
							kFirstMachineBallTypeIDs.GOLD
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
					if (!this.IsUnlocked("better_drops_1")) {
						return "Drop 7 gold balls";
					} else if (this.IsUnlocked("unlock_opal_balls")) {
						return "Drop 7 gemstone balls";
					} else {
						return "Drop 7 special balls";
					}
				},
				on_hit_func: (machine, multi_spin) => {
					if (this.IsUnlocked("better_multi_spin")) {
						machine.GetSaveData().spins += multi_spin - 1;
					}
					if (this.IsUnlocked("better_drops_1")) {
						let bonus_balls = [];
						bonus_balls.push(
							this.IsUnlocked("unlock_ruby_balls")
								? kFirstMachineBallTypeIDs.RUBY
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls.push(
							this.IsUnlocked("unlock_sapphire_balls")
								? kFirstMachineBallTypeIDs.SAPPHIRE
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls.push(
							this.IsUnlocked("unlock_emerald_balls")
								? kFirstMachineBallTypeIDs.EMERALD
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls.push(
							this.IsUnlocked("unlock_topaz_balls")
								? kFirstMachineBallTypeIDs.TOPAZ
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls.push(
							this.IsUnlocked("unlock_turquoise_balls")
								? kFirstMachineBallTypeIDs.TURQUOISE
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls.push(
							this.IsUnlocked("unlock_amethyst_balls")
								? kFirstMachineBallTypeIDs.AMETHYST
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls.push(
							this.IsUnlocked("unlock_opal_balls")
								? kFirstMachineBallTypeIDs.OPAL
								: kFirstMachineBallTypeIDs.GOLD
						);
						bonus_balls = ShuffleArray(bonus_balls);
						this.DropBonusBalls(bonus_balls);
						let popup_text = this.IsUnlocked("unlock_opal_balls")
							? "7 gemstone balls!"
							: "7 special balls!";
						MaybeAddBonusWheelText({
							text: popup_text,
							pos: kWheelPopupTextPos,
							color_rgb: kWheelPopupTextColor
						});
					} else {
						this.DropBonusBalls([...Array(7)].map(_ => kFirstMachineBallTypeIDs.GOLD));
						MaybeAddBonusWheelText({
							text: "7 gold balls!",
							pos: kWheelPopupTextPos,
							color_rgb: kWheelPopupTextColor
						});
					}
				}
			})
		);
		return new BonusWheel(this, spaces);
	}

	AwardPoints(base_value, ball) {
		let total_value = base_value;
		let color_rgb = "0,128,0";
		if (this.IsScoreBuffActive()) {
			total_value *= this.GetSaveData().score_buff_multiplier;
		}
		let popup_text_level = 0;
		let stats = this.GetSaveData().stats;
		if (ball.ball_type_index != kFirstMachineBallTypeIDs.NORMAL) {
			if (this.HasEightBallSpecial(ball.ball_type_index)) {
				popup_text_level = 3;
				color_rgb = k8BallHighlightColor;
				total_value *= Math.pow(
					this.special_ball_multiplier, this.emerald_ball_exponent
				);
				total_value *= Math.pow(8, this.eight_ball_score_exponent);
				if (ball.ball_type_index == kFirstMachineBallTypeIDs.BEACH_BALL) {
					let multiplier = 2;
					if (this.IsUnlocked("beach_ball_time_based_multiplier")) {
						let sec_elapsed =
							(state.current_time - ball.start_time) / 1000.0;
						multiplier = Math.pow(
							sec_elapsed, this.beach_ball_score_exponent
						);
						multiplier = Math.max(multiplier, 2.0);

						stats.longest_lasting_beach_ball =
							Math.max(sec_elapsed, stats.longest_lasting_beach_ball);
					}
					const k2Pi = Math.PI * 2;
					if (
						this.IsUnlocked("beach_ball_rotation_multiplier") &&
						ball.total_rotations > k2Pi
					) {
						multiplier *= ball.total_rotations / k2Pi;

						stats.max_beach_ball_rotated_degrees = Math.max(
							ball.total_rotations * 180.0 / Math.PI,
							stats.max_beach_ball_rotated_degrees
						);
					}
					total_value *= multiplier;
					color_rgb = kPrismatic;
				}
			} else if (this.HasEmeraldSpecial(ball.ball_type_index)) {
				total_value *= Math.pow(
					this.special_ball_multiplier, this.emerald_ball_exponent
				);
				popup_text_level = 2;
				color_rgb = GetSetting("dark_mode") ? "0,255,0" : "0,192,0";
			} else {
				popup_text_level = 1;
				total_value *= this.special_ball_multiplier;
				color_rgb = "170,143,0";
			}
		}
		this.AddScore(total_value);
		this.AddPointsForBallToStats(total_value, ball.ball_type_index);
		MaybeAddScoreText({
			level: popup_text_level,
			text: `+${FormatNumberShort(total_value)}`,
			pos: ball.pos,
			color_rgb,
			opacity: PopupTextOpacityForBallType(ball.ball_type_index)
		});
	}

	AwardSpins(ball, text_pos) {
		if (this.HasSapphireSpecial(ball.ball_type_index)) {
			let value = Math.pow(
				this.special_ball_multiplier, this.sapphire_ball_exponent
			);
			let color_rgb = GetSetting("dark_mode") ? "32,96,255" : "0,0,255";
			let score_text_level = 2;
			if (
				this.HasAmethystSpecial(ball.ball_type_index) &&
				this.IsUnlocked("amethyst_synergy") &&
				this.IsScoreBuffActive()
			) {
				value *= this.GetSaveData().score_buff_multiplier;
				color_rgb = "255,0,255"
			}
			if (this.HasEightBallSpecial(ball.ball_type_index)) {
				score_text_level = 3;
				value *= Math.pow(8, this.eight_ball_spin_exponent);
				color_rgb = k8BallHighlightColor;
				if (ball.ball_type_index == kFirstMachineBallTypeIDs.BEACH_BALL) {
					let multiplier = 2;
					if (this.IsUnlocked("beach_ball_time_based_multiplier")) {
						let sec_elapsed =
							(state.current_time - ball.start_time) / 1000.0;
						multiplier =
							Math.pow(sec_elapsed, this.beach_ball_spin_exponent);
						multiplier = Math.max(multiplier, 2.0);
					}
					value *= multiplier;
					color_rgb = kPrismatic;
				}
			}
			value = Math.floor(value);
			this.GetSaveData().spins += value;
			UpdateSpinCounter();
			MaybeAddScoreText({
				level: score_text_level,
				text: `+${FormatNumberShort(value)} Spins`,
				pos: text_pos,
				color_rgb: color_rgb,
				opacity: PopupTextOpacityForBallType(ball.ball_type_index),
			});
		} else {
			++this.GetSaveData().spins;
			UpdateSpinCounter();
			MaybeAddScoreText({
				level: 0,
				text: "+1 Spin",
				pos: text_pos,
				color_rgb: "0,170,0",
				opacity: PopupTextOpacityForBallType(ball.ball_type_index),
			});
		}
	}

	OnCenterSlotHit(ball) {
		let text_pos = new Point(ball.pos.x, ball.pos.y - 10);
		if (
			this.HasTurquoiseSpecial(ball.ball_type_index) &&
			this.IsUnlocked("turquoise_synergy")
		) {
			this.AwardSpins(ball, text_pos);
			text_pos.y -= 10;
		}
		if (this.HasRubySpecial(ball.ball_type_index)) {
			let multiplier = 2.0;
			let color_rgb = "255,0,0"
			let text_level = 2;
			if (ball.ball_type_index == kFirstMachineBallTypeIDs.BEACH_BALL) {
				multiplier = 16;
				color_rgb = kPrismatic;
				text_level = 3;
			} else if (ball.ball_type_index == kFirstMachineBallTypeIDs.EIGHT_BALL) {
				multiplier = 8;
				color_rgb = k8BallHighlightColor;
				text_level = 3;
			} else if (
				this.HasTopazSpecial(ball.ball_type_index) &&
				this.IsUnlocked("topaz_synergy")
			) {
				multiplier = this.emerald_ball_exponent;
				color_rgb = "255,255,0"
			}
			let mult_display = FormatNumberShort(multiplier);
			MaybeAddScoreText({
				level: text_level,
				text: mult_display + "\u00D7 scoring!",
				pos: text_pos,
				color_rgb: color_rgb,
				opacity: PopupTextOpacityForBallType(ball.ball_type_index),
			});
			this.ActivateOrExtendScoreBuff(multiplier);
		}
	}

	ShouldDisplayGemstoneBallUpgrades() {
		return this.IsMaxed("gold_ball_rate") &&
			this.IsUnlocked("unlock_bonus_wheel");
	}

	NumGemstoneBallsUnlocked() {
		let prev_unlocks = 0;
		const kGemstoneBalls = [
			kFirstMachineBallTypeIDs.RUBY,
			kFirstMachineBallTypeIDs.SAPPHIRE,
			kFirstMachineBallTypeIDs.EMERALD,
			kFirstMachineBallTypeIDs.TOPAZ,
			kFirstMachineBallTypeIDs.TURQUOISE,
			kFirstMachineBallTypeIDs.AMETHYST,
		];
		const ball_types = this.BallTypes();
		for (let i = 0; i < kGemstoneBalls.length; ++i) {
			if (this.IsBallTypeUnlocked(ball_types[kGemstoneBalls[i]])) {
				++prev_unlocks;
			}
		}
		return prev_unlocks;
	}

	GemstoneBallUnlockCost() {
		let prev_unlocks = this.machine.NumGemstoneBallsUnlocked();
		return this.machine.NthGemstoneBallUnlockCost(prev_unlocks + 1);
	}

	AllTier1GemstoneBallsUnlocked() {
		return (
			this.IsUnlocked("unlock_ruby_balls") &&
			this.IsUnlocked("unlock_sapphire_balls") &&
			this.IsUnlocked("unlock_emerald_balls")
		);
	}

	AnyTier1GemstoneBallsUnlocked() {
		return (
			this.IsUnlocked("unlock_ruby_balls") ||
			this.IsUnlocked("unlock_sapphire_balls") ||
			this.IsUnlocked("unlock_emerald_balls")
		);
	}

	AllTier2GemstoneBallsUnlocked() {
		return (
			this.IsUnlocked("unlock_topaz_balls") &&
			this.IsUnlocked("unlock_turquoise_balls") &&
			this.IsUnlocked("unlock_amethyst_balls")
		);
	}

	AnyTier2GemstoneBallsUnlocked() {
		return (
			this.IsUnlocked("unlock_topaz_balls") ||
			this.IsUnlocked("unlock_turquoise_balls") ||
			this.IsUnlocked("unlock_amethyst_balls")
		);
	}

	NthGemstoneBallUnlockCost(n) {
		return 1e12 * Math.pow(2000, n - 1);
	}

	Tier1GemstoneBallRateCostFunc(level) {
		return 5e12 * Math.pow(5, level);
	}

	Tier2GemstoneBallRateCostFunc(level) {
		return 5e18 * Math.pow(5, level);
	}

	GemstoneBallRateValueFunc(level) {
		return (level + 1) / 5.0;
	}

	HasEightBallSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.EIGHT_BALL ||
			ball_type_index == kFirstMachineBallTypeIDs.BEACH_BALL
		);
	}

	HasOpalSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.OPAL ||
			this.HasEightBallSpecial(ball_type_index)
		);
	}

	HasRubySpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.RUBY ||
			ball_type_index == kFirstMachineBallTypeIDs.TOPAZ ||
			ball_type_index == kFirstMachineBallTypeIDs.AMETHYST ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasSapphireSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.SAPPHIRE ||
			ball_type_index == kFirstMachineBallTypeIDs.TURQUOISE ||
			ball_type_index == kFirstMachineBallTypeIDs.AMETHYST ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasEmeraldSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.EMERALD ||
			ball_type_index == kFirstMachineBallTypeIDs.TOPAZ ||
			ball_type_index == kFirstMachineBallTypeIDs.TURQUOISE ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasTopazSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.TOPAZ ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasTurquoiseSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.TURQUOISE ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasAmethystSpecial(ball_type_index) {
		return (
			ball_type_index == kFirstMachineBallTypeIDs.AMETHYST ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	BuffDisplayText() {
		let save_data = this.GetSaveData();
		if (save_data.score_buff_duration > 0) {
			let duration_sec =
				Math.round(save_data.score_buff_duration / 1000.0);
			return "All scoring ×" +
				FormatNumberMedium(save_data.score_buff_multiplier) +
				" for " + duration_sec + " seconds!";
		} else if (this.IsUnlocked("unlock_ruby_balls")) {
			return 'Score multiplier: ×1';
		} else {
			return "";
		}
	}

	IsScoreBuffActive() {
		const save_data = this.GetSaveData();
		return save_data.score_buff_multiplier > 1 &&
			save_data.score_buff_duration > 0;
	}

	ActivateOrExtendScoreBuff(multiplier) {
		const kBuffDuration = 60000.0;
		let save_data = this.GetSaveData();
		if (
			!this.IsUnlocked("ruby_ball_buff_stackable") ||
			!this.IsScoreBuffActive()
		) {
			save_data.score_buff_multiplier = multiplier;
			save_data.score_buff_duration = kBuffDuration;
		} else {
			let stacks = save_data.score_buff_multiplier - 1.0;
			save_data.score_buff_duration +=
				(kBuffDuration / stacks) * (multiplier - 1.0);
			if (save_data.score_buff_duration > kBuffDuration) {
				save_data.score_buff_multiplier *=
					(save_data.score_buff_duration / kBuffDuration);
				save_data.score_buff_duration = kBuffDuration;
			}
		}
		if (save_data.stats.max_buff_multiplier < save_data.score_buff_multiplier) {
			save_data.stats.max_buff_multiplier = save_data.score_buff_multiplier;
		}
	}
}
