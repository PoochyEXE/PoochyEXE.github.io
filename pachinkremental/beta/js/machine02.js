const kBumperMachineID = "bumper";

const kBumperMachineBallTypes = [
	//          | id |    name    | display_name |      physics_params       | inner_color | outer_color | ripple_color_rgb |
	kNormalBallType,
	new BallType(1,   "gold",      "Gold ",       kPhysicsParams.normal,     "#FFD700",    "#AA8F00",    "170,143,  0"    ),
];

const kBumperMachineBallTypeIDs = {
	NORMAL: 0,
	GOLD: 1,
};

const kBumperMachinePopupTextOptions = [
	"Enable All",
	"Gold+ only",
	"Gemstone+ only",
	"8-Ball+ only",
	"Disable All",
];

class BumperMachine extends PachinkoMachine {
	constructor(id, display_name) {
		super(id, display_name, kBumperMachineBallTypes);
		
		//this.bonus_wheel = this.InitWheel();
	}
	
	OnActivate() {
		//this.bonus_wheel = this.InitWheel();
	}
	
	BallTypes() {
		return kBumperMachineBallTypes;
	}

	DefaultSaveData() {
		let save_data = super.DefaultSaveData();
		//save_data.options.auto_spin_enabled = false;
		//save_data.options.multi_spin_enabled = false;
		return save_data;
	}

	TogglePopupText() {
		let options = this.GetSaveData().options;
		++options.display_popup_text;
		if (
			options.display_popup_text == 1 &&
			!this.IsUnlocked("unlock_gold_balls")
		) {
			options.display_popup_text = kFirstMachinePopupTextOptions.length - 1;
		}
		if (options.display_popup_text >= kFirstMachinePopupTextOptions.length) {
			options.display_popup_text = 0;
		}
	}

	CurrentPopupTextOptionName() {
		return kBumperMachinePopupTextOptions[this.GetSetting("display_popup_text")];
	}

	UpgradeHeaders() {
		return [
			new UpgradeHeader(this, "board", "Board"),
			new UpgradeHeader(this, "auto_drop", "Auto-Drop", this.upgrades["auto_drop"].visible_func),
			/* TODO: Add bonus wheel.
			new UpgradeHeader(this, "bonus_wheel", "Bonus Wheel", this.upgrades["unlock_bonus_wheel"].visible_func),
			*/
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kFirstMachineBallTypeIDs.GOLD]
			),
		];
	}
	
	BaseValues() {
		return {
			bottom: [10, 20, 30, 50, 100, 500, 100, 50, 30, 20, 10],
			funnel_center: [1000, 500, 1000],
			funnel_sides: [50, 100],
			top: [5000, 10000, 5000],
		}
	}
	
	InitBoard() {
		const kBaseValues = this.BaseValues();
		const kHorizontalSpacing = 18;
		const kWallSpacing = 4;
		const kHalfWallSpace = kWallSpacing / 2;
		const kVerticalSpacing = (Math.sqrt(3) * kHorizontalSpacing) / 2;
		const kColumns = kBaseValues.bottom.length;
		const kRows = 13;
		const kBottomSlotRows = 5;
		const kWidth = kHorizontalSpacing * kColumns + kWallSpacing;
		const kHeight = 430;

		let pegs = Array(0);
		let border_polyline = Array(0);
		const left_x = kHalfWallSpace;
		const right_x = kWidth - kHalfWallSpace;
		const top_y = kHalfWallSpace;
		const bottom_y = kHeight - kHalfWallSpace;
		border_polyline.push(new Point(left_x, top_y));
		for (let col = 0; col <= kColumns; ++col) {
			const x = col * kHorizontalSpacing + left_x;
			border_polyline.push(new Point(x, bottom_y));
		}
		border_polyline.push(new Point(right_x, top_y));
		AppendInterpolatedPolyline(pegs, border_polyline, kWallSpacing);
		
		const grid_cols = [...Array(kColumns * 2 + 1)].map((_, i) =>
			i * kHorizontalSpacing / 2.0 + kHalfWallSpace
		);
		
		function even_grid_row(y) {
			for (let col = 2; col < grid_cols.length - 1; col += 2) {
				pegs.push(new Point(grid_cols[col], y));
			}
		}
		
		function odd_grid_row_nudgers(y) {
			const y_above = y - kVerticalSpacing / 4;
			const x_left = 0.25 * kHorizontalSpacing + kHalfWallSpace;
			const x_right = kWidth - x_left;
			pegs.push(new Point(x_left, y_above));
			pegs.push(new Point(x_right, y_above));
		}
		
		function odd_grid_row(y) {
			for (let col = 1; col < grid_cols.length; col += 2) {
				pegs.push(new Point(grid_cols[col], y));
			}
			odd_grid_row_nudgers(y);
		}
		
		// Bottom target slots
		let y = kHeight - kHalfWallSpace;
		for (let row = 0; row < kBottomSlotRows; ++row) {
			y -= kWallSpacing;
			even_grid_row(y);
		}
		
		let target_sets = Array(0);

		const kTargetDrawRadius = (kHorizontalSpacing - kWallSpacing) / 2;
		const kTargetColor = "rgba(0, 128, 255, 0.5)";
		const kBottomTargetColor = "#8FF";
		const kTargetHitboxRadius = Math.min(kTargetDrawRadius * 1.5 - kBallRadius);

		// Bottom targets
		const kBottomTargetY = kHeight - kTargetDrawRadius - kWallSpacing;
		let bottom_targets = Array(0);
		for (let col = 0; col < kBaseValues.bottom.length; ++col) {
			const x = grid_cols[2 * col + 1];
			const pos = new Point(x, kBottomTargetY);
			const value = kBaseValues.bottom[col];
			bottom_targets.push(
				new ScoreTarget({
					machine: this,
					pos,
					draw_radius: kTargetDrawRadius,
					hitbox_radius: kTargetHitboxRadius,
					color: kBottomTargetColor,
					id: col,
					active: true,
					value,
					pass_through: false
				})
			);
		}
		target_sets.push(new TargetSet(bottom_targets));
		
		y -= kVerticalSpacing;
		odd_grid_row(y);
		y -= kVerticalSpacing;
		even_grid_row(y);
		y -= kVerticalSpacing;
		odd_grid_row(y);
		y -= kVerticalSpacing;
		even_grid_row(y);
		y -= kVerticalSpacing;
		const funnel_left_polyline = [
			new Point(grid_cols[9], y),
			new Point(grid_cols[2], y - kVerticalSpacing * 1.75),
			new Point(grid_cols[2], y - kVerticalSpacing * 5),
		];
		AppendInterpolatedPolyline(
			pegs, funnel_left_polyline, kWallSpacing
		);
		pegs.pop();
		const funnel_right_polyline = [
			new Point(grid_cols[13], y),
			new Point(grid_cols[20], y - kVerticalSpacing * 1.75),
			new Point(grid_cols[20], y - kVerticalSpacing * 5),
		];
		AppendInterpolatedPolyline(
			pegs, funnel_right_polyline, kWallSpacing
		);
		pegs.pop();
		const below_funnel_left_polyline = [
			new Point(grid_cols[4], y),
			new Point(grid_cols[0], y - kVerticalSpacing),
		];
		AppendInterpolatedPolyline(
			pegs, below_funnel_left_polyline, kWallSpacing
		);
		pegs.pop();
		const below_funnel_right_polyline = [
			new Point(grid_cols[18], y),
			new Point(grid_cols[22], y - kVerticalSpacing),
		];
		AppendInterpolatedPolyline(
			pegs, below_funnel_right_polyline, kWallSpacing
		);
		pegs.pop();
		const funnel_top_left_polyline = [
			new Point(grid_cols[4], y - kVerticalSpacing * 2.5),
			new Point(grid_cols[4], y - kVerticalSpacing * 5),
		];
		AppendInterpolatedPolyline(
			pegs, funnel_top_left_polyline, kWallSpacing
		);
		pegs.pop();
		const funnel_top_right_polyline = [
			new Point(grid_cols[18], y - kVerticalSpacing * 2.5),
			new Point(grid_cols[18], y - kVerticalSpacing * 5),
		];
		AppendInterpolatedPolyline(
			pegs, funnel_top_right_polyline, kWallSpacing
		);
		pegs.pop();
		const funnel_center_left_channel_lower = [
			new Point(grid_cols[8], y - kVerticalSpacing * 2),
			new Point(grid_cols[10], y - kVerticalSpacing * 3),
		]
		AppendInterpolatedPolyline(
			pegs, funnel_center_left_channel_lower, kWallSpacing
		);
		const funnel_center_right_channel_lower = [
			new Point(grid_cols[14], y - kVerticalSpacing * 2),
			new Point(grid_cols[12], y - kVerticalSpacing * 3),
		]
		AppendInterpolatedPolyline(
			pegs, funnel_center_right_channel_lower, kWallSpacing
		);
		const funnel_center_left_channel_upper = [
			new Point(grid_cols[6], y - kVerticalSpacing * 2.5),
			new Point(grid_cols[9], y - kVerticalSpacing * 4),
		]
		AppendInterpolatedPolyline(
			pegs, funnel_center_left_channel_upper, kWallSpacing
		);
		const funnel_center_right_channel_upper = [
			new Point(grid_cols[16], y - kVerticalSpacing * 2.5),
			new Point(grid_cols[13], y - kVerticalSpacing * 4),
		]
		AppendInterpolatedPolyline(
			pegs, funnel_center_right_channel_upper, kWallSpacing
		);
		pegs.push(new Point(grid_cols[11], y));
		pegs.push(new Point(grid_cols[10], y - kVerticalSpacing));
		pegs.push(new Point(grid_cols[12], y - kVerticalSpacing));
		pegs.push(new Point(grid_cols[11], y - kVerticalSpacing * 2));
		pegs.push(new Point(grid_cols[11], y - kVerticalSpacing * 4));
		y -= kVerticalSpacing * 2.5;
		let funnel_center_targets = [
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[9], y - kVerticalSpacing * 0.75),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_center_left",
				active: true,
				value: kBaseValues.funnel_center[0],
				pass_through: true
			}),
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[11], y - kHalfWallSpace),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_center_middle",
				active: true,
				value: kBaseValues.funnel_center[1],
				pass_through: true
			}),
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[13], y - kVerticalSpacing * 0.75),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_center_right",
				active: true,
				value: kBaseValues.funnel_center[2],
				pass_through: true
			}),
		];
		target_sets.push(new TargetSet(funnel_center_targets));
		
		y -= kVerticalSpacing * 2;
		
		let funnel_left_targets = [
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[1], y),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_left_outer",
				active: true,
				value: kBaseValues.funnel_sides[0],
				pass_through: true
			}),
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[3], y),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_left_inner",
				active: true,
				value: kBaseValues.funnel_sides[1],
				pass_through: true
			})
		];
		target_sets.push(new TargetSet(funnel_left_targets));
		
		let funnel_right_targets = [
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[21], y),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_right_outer",
				active: true,
				value: kBaseValues.funnel_sides[0],
				pass_through: true
			}),
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[19], y),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "funnel_right_inner",
				active: true,
				value: kBaseValues.funnel_sides[1],
				pass_through: true
			})
		];
		target_sets.push(new TargetSet(funnel_right_targets));
		
		y -= kVerticalSpacing / 2;
		even_grid_row(y);
		y -= kVerticalSpacing;
		odd_grid_row(y);
		y -= kVerticalSpacing;

		const kBumperStrength = 300.0;
		const kBumperRadius = kHorizontalSpacing * 0.75;
		y -= kVerticalSpacing;
		let bumpers = [
			new Bumper({
				machine: this,
				pos: new Point(grid_cols[6], y),
				radius: kBumperRadius,
				strength: kBumperStrength,
				value: 0,
				id: "bumper_lower_left",
				active: true,
			}),
			new Bumper({
				machine: this,
				pos: new Point(grid_cols[16], y),
				radius: kBumperRadius,
				strength: kBumperStrength,
				value: 0,
				id: "bumper_lower_right",
				active: true,
			}),
			new Bumper({
				machine: this,
				pos: new Point(grid_cols[11], y - kVerticalSpacing * 2.5),
				radius: kBumperRadius,
				strength: kBumperStrength,
				value: 0,
				id: "bumper_center",
				active: true,
			}),
			new Bumper({
				machine: this,
				pos: new Point(grid_cols[6], y - kVerticalSpacing * 5),
				radius: kBumperRadius,
				strength: kBumperStrength,
				value: 0,
				id: "bumper_top_left",
				active: true,
			}),
			new Bumper({
				machine: this,
				pos: new Point(grid_cols[16], y - kVerticalSpacing * 5),
				radius: kBumperRadius,
				strength: kBumperStrength,
				value: 0,
				id: "bumper_top_right",
				active: true,
			}),
		];
		target_sets.push(new TargetSet(bumpers));
		
		const bumper_left_ramp = [
			new Point(grid_cols[3], y - kVerticalSpacing * 2),
			new Point(grid_cols[0], y - kVerticalSpacing * 2.75),
		]
		AppendInterpolatedPolyline(pegs, bumper_left_ramp, kWallSpacing);
		pegs.pop();
		const bumper_right_ramp = [
			new Point(grid_cols[19], y - kVerticalSpacing * 2),
			new Point(grid_cols[22], y - kVerticalSpacing * 2.75),
		]
		AppendInterpolatedPolyline(pegs, bumper_right_ramp, kWallSpacing);
		pegs.pop();
		const bumper_left_wall = [
			new Point(grid_cols[2], y - kVerticalSpacing * 3.75),
			new Point(grid_cols[2], y - kVerticalSpacing * 6),
		]
		AppendInterpolatedPolyline(pegs, bumper_left_wall, kWallSpacing);
		const bumper_right_wall = [
			new Point(grid_cols[20], y - kVerticalSpacing * 3.75),
			new Point(grid_cols[20], y - kVerticalSpacing * 6),
		]
		AppendInterpolatedPolyline(pegs, bumper_right_wall, kWallSpacing);
		const bumper_center_left_wall = [
			new Point(grid_cols[10], y - kVerticalSpacing * 5),
			new Point(grid_cols[10], y - kVerticalSpacing * 6),
		]
		AppendInterpolatedPolyline(pegs, bumper_center_left_wall, kWallSpacing);
		const bumper_center_right_wall = [
			new Point(grid_cols[12], y - kVerticalSpacing * 5),
			new Point(grid_cols[12], y - kVerticalSpacing * 6),
		]
		AppendInterpolatedPolyline(pegs, bumper_center_right_wall, kWallSpacing);
		target_sets.push(new TargetSet([
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[1], y - kVerticalSpacing * 5.5),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "top_left",
				active: true,
				value: kBaseValues.top[0],
				pass_through: true
			}),
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[11], y - kVerticalSpacing * 5.5),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "top_center",
				active: true,
				value: kBaseValues.top[1],
				pass_through: true
			}),
			new ScoreTarget({
				machine: this,
				pos: new Point(grid_cols[21], y - kVerticalSpacing * 5.5),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kTargetColor,
				id: "top_right",
				active: true,
				value: kBaseValues.top[2],
				pass_through: true
			}),
		]));
		
		y -= kVerticalSpacing * 7.5;
		const top_left_ramp = [
			new Point(grid_cols[4], y),
			new Point(grid_cols[0], y - kVerticalSpacing),
		]
		AppendInterpolatedPolyline(pegs, top_left_ramp, kWallSpacing);
		pegs.pop();
		const top_right_ramp = [
			new Point(grid_cols[18], y),
			new Point(grid_cols[22], y - kVerticalSpacing),
		]
		AppendInterpolatedPolyline(pegs, top_right_ramp, kWallSpacing);
		const top_center_ramp = [
			new Point(grid_cols[8], y),
			new Point(grid_cols[11], y - kVerticalSpacing * 0.75),
			new Point(grid_cols[14], y),
		]
		AppendInterpolatedPolyline(pegs, top_center_ramp, kWallSpacing);
		pegs.push(new Point(grid_cols[6], y));
		pegs.push(new Point(grid_cols[16], y));
		y -= kVerticalSpacing;
		pegs.push(new Point(grid_cols[5], y));
		pegs.push(new Point(grid_cols[7], y));
		pegs.push(new Point(grid_cols[15], y));
		pegs.push(new Point(grid_cols[17], y));
		y -= kVerticalSpacing;
		even_grid_row(y);
		y -= kVerticalSpacing;
		odd_grid_row(y);
		y -= kVerticalSpacing;
		
		/*
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
		*/
		
		let min_drop_x = 10;
		let max_drop_x = kWidth - 10;
		let min_drop_y = 0;
		let max_drop_y = y;
		let drop_zones = [
			new Rectangle(min_drop_x, max_drop_x, min_drop_y, max_drop_y)
		];

		/* TODO: Add bonus wheel.
		const kSpinTargetColor = "rgba(0, 0, 255, 0.5)";
		let spin_targets = [
			new SpinTarget({
				machine: this,
				pos: new Point(grid_cols[5], y),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kSpinTargetColor,
				id: "spin_left"
			}),
			new SpinTarget({
				machine: this,
				pos: new Point(grid_cols[17], y),
				draw_radius: kTargetDrawRadius,
				hitbox_radius: kTargetHitboxRadius,
				color: kSpinTargetColor,
				id: "spin_right"
			})
		];
		target_sets.push(new TargetSet(spin_targets));
		*/

		return new PegBoard(kWidth, kHeight, pegs, target_sets, drop_zones);
	}
	
	UpdateScoreTargetSet(target_set, base_values) {
		console.assert(target_set.targets.length == base_values.length);
		const multiplier = this.GetUpgradeValue("multiplier");
		for (let i = 0; i < target_set.targets.length; ++i) {
			target_set.targets[i].SetValue(base_values[i] * multiplier);
		}
	}

	UpdateScoreTargets() {
		const kBaseValues = this.BaseValues();
		let target_sets = this.board.target_sets;
		this.UpdateScoreTargetSet(target_sets[0], kBaseValues.bottom);
		this.UpdateScoreTargetSet(target_sets[1], kBaseValues.funnel_center);
		this.UpdateScoreTargetSet(target_sets[2], kBaseValues.funnel_sides);
		this.UpdateScoreTargetSet(target_sets[3], kBaseValues.funnel_sides);
		// Set #4 is the bumpers, so skip it.
		this.UpdateScoreTargetSet(target_sets[5], kBaseValues.top);
		state.redraw_targets = true;
	}
	
	UpdateBumperValues() {
		const base_value = this.GetUpgradeValue("bumper_value");
		const multiplier = this.GetUpgradeValue("multiplier");
		const value = base_value * multiplier;
		let bumper_set = this.board.target_sets[4];
		for (let i = 0; i < bumper_set.targets.length; ++i) {
			bumper_set.targets[i].SetValue(value);
		}
	}

	InitUpgrades() {
		const kTimesSymbol = "\u00D7";
		let upgrades_list = new Array();
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "multiplier",
				name: "Point Multiplier",
				category: "board",
				description: "Multipiles all point gains.",
				cost_func: level => 250 * Math.pow(20, level),
				value_func: level => Math.pow(10, Math.floor(level / 3)) * [1, 2, 5][level % 3],
				max_level: Infinity,
				value_suffix: kTimesSymbol,
				visible_func: null,
				on_update: () => this.UpdateScoreTargets(),
				on_buy: (new_level) => {
					// Set #4 is the bumpers, so skip it.
					const kScoreTargetSets = [0, 1, 2, 3, 5];
					let bottom_targets = this.board.target_sets[0].targets;
					let multiple = ((new_level % 3) == 2) ? "2.5" : "2"
					let popup_text = kTimesSymbol + multiple;
					for (let i = 0; i < kScoreTargetSets.length; ++i) {
						let set_number = kScoreTargetSets[i];
						let targets = this.board.target_sets[set_number].targets;
						for (let j = 0; j < targets.length; ++j) {
							MaybeAddScoreText({
								level: 3,
								text: popup_text,
								pos: targets[j].pos,
								color_rgb: "0,0,255"
							});
						}
					}
					/* TODO: Add bonus wheel.
					this.bonus_wheel.UpdateAllSpaces();
					*/
				}
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "bumper_value",
				name: "Bumper Value",
				category: "board",
				description: "Points awarded by bumpers when hit.",
				cost_func: level => 100 * Math.pow(10, level),
				value_func: level => level * 10,
				max_level: 10,
				value_suffix: "",
				visible_func: null,
				on_update: () => this.UpdateBumperValues(),
				on_buy: null
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
				visible_func: () => this.GetUpgradeLevel("multiplier") > 1,
				on_update: () => {
					state.redraw_auto_drop = true;
					state.update_upgrade_buttons = true;
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
				on_buy: null
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
				cost_func: level => 50000 * Math.pow(2, level),
				value_func: level => level + 1,
				max_level: 49,
				value_suffix: "",
				visible_func: () => this.GetUpgradeLevel("multiplier") > 1,
				on_update: function() {
					this.machine.max_balls = this.GetValue();
				},
				on_buy: null
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
					/* TODO: Add bonus wheel.
					this.machine.bonus_wheel.UpdateAllSpaces();
					*/
				},
				on_buy: null
			})
		);
		/* TODO: Add bonus wheel.
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
		*/

		let upgrades_map = {};
		for (let i = 0; i < upgrades_list.length; ++i) {
			let upgrade = upgrades_list[i];
			upgrades_map[upgrade.id] = upgrade;
		}

		return upgrades_map;
	}

	AwardPoints(base_value, ball) {
		let total_value = base_value;
		let color_rgb = "0,128,0";
		let popup_text_level = 0;
		if (ball.ball_type_index != kFirstMachineBallTypeIDs.NORMAL) {
			popup_text_level = 1;
			total_value *= this.special_ball_multiplier;
			color_rgb = "170,143,0";
		}
		this.AddScore(total_value);
		MaybeAddScoreText({
			level: popup_text_level,
			text: `+${FormatNumberShort(total_value)}`,
			pos: ball.pos,
			color_rgb
		});
	}

	NextUpgradeHint() {
		if (!this.IsUpgradeVisible("unlock_gold_balls")) {
			return "2 Max Balls";
		} else if (!this.IsUpgradeVisible("gold_ball_rate")) {
			return "Unlock Gold Balls";
		} else {
			return "None yet, please wait for the next beta update."
		}
	}
}
