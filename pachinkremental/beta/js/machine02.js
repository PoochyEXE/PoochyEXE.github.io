const kBumperMachineID = "bumper";

const kBumperMachineBallTypes = [
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
];

const kBumperMachineBallTypeIDs = {
	NORMAL: 0,
	GOLD: 1,
	RUBY: 2,
	SAPPHIRE: 3,
	EMERALD: 4,
	TOPAZ: 5,
	TURQUOISE: 6,
	AMETHYST: 7,
	OPAL: 8,
};

const kBumperMachinePopupTextOptions = [
	"Enable All",
	"Gold+ only",
	"Gemstone+ only",
	"Disable All",
];

class BumperMachine extends PachinkoMachine {
	constructor(id, display_name) {
		super(id, display_name, kBumperMachineBallTypes);

		this.ruby_ball_value_percent = 5;
		this.sapphire_ball_value_percent = 10;
		this.emerald_ball_value_percent = 50;
		this.combo_timeout = 1;
		this.hyper_multiplier = 10;
		this.max_hyper_charge = 50000;
		this.hyper_charge_rate = 1.0;
		this.hyper_duration = 15000;

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
		save_data.options.auto_hyper_enabled = false;
		save_data.hyper_charge = 0;
		save_data.score_buff_duration = 0;
		save_data.stats.hyper_activations = 0;
		save_data.stats.max_combo = 0;
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
			options.display_popup_text = kBumperMachinePopupTextOptions.length - 1;
		} else if (
			options.display_popup_text == 2 &&
			!this.AnyTier1GemstoneBallsUnlocked()
		) {
			options.display_popup_text = kFirstMachinePopupTextOptions.length - 1;
		}
		if (options.display_popup_text >= kBumperMachinePopupTextOptions.length) {
			options.display_popup_text = 0;
		}
	}

	PopupTextColorForBallType(ball_type_index) {
		if (GetSetting("dark_mode")) {
			const kDarkModeColors = [
				"  0,128,  0",
				"170,143,  0",
				"255,  0,  0",
				" 48, 96,255",
				"  0,255,  0",
				"255,255,  0",
				"  0,255,255",
				"255,  0,255",
				kPrismatic,
			]
			return kDarkModeColors[ball_type_index];
		} else {
			const kLightModeColors = [
				"  0,128,  0",
				"170,143,  0",
				"255,  0,  0",
				"  0,  0,255",
				"  0,255,  0",
				"192,192,  0",
				"  0,192,192",
				"192,  0,192",
				kPrismatic,
			]
			return kLightModeColors[ball_type_index];
		}
	}

	PopupTextLevelForBallType(ball_type_index) {
		if (ball_type_index == kBumperMachineBallTypeIDs.NORMAL) {
			return 0;
		} else if (ball_type_index == kBumperMachineBallTypeIDs.GOLD) {
			return 1;
		} else {
			return 2;
		}
	}

	CurrentPopupTextOptionName() {
		return kBumperMachinePopupTextOptions[this.GetSetting("display_popup_text")];
	}

	UpgradeHeaders() {
		return [
			new UpgradeHeader(this, "board", "Board"),
			new UpgradeHeader(this, "auto_drop", "Auto-Drop", this.upgrades["auto_drop"].visible_func),
			new UpgradeHeader(this, "combos", "Combos", this.upgrades["unlock_combos"].visible_func),
			new UpgradeHeader(this, "hyper", "Hyper System", this.upgrades["unlock_hyper_system"].visible_func),
			/* TODO: Add bonus wheel.
			new UpgradeHeader(this, "bonus_wheel", "Bonus Wheel", this.upgrades["unlock_bonus_wheel"].visible_func),
			*/
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kBumperMachineBallTypeIDs.GOLD]
			),
			new UpgradeHeader(
				this,
				"gemstone_balls",
				"Gemstone Balls",
				() => this.ShouldDisplayGemstoneBallUpgrades(),
				[
					"ruby_balls",
					"topaz_balls",
					"emerald_balls",
					"turquoise_balls",
					"sapphire_balls",
					"amethyst_balls",
					"opal_balls"
				],
				"Gemstone balls have the benefits of gold balls, plus an additional point value multiplier. Each type of gemstone ball has its own way to increase its multiplier.<br>NOTE: Each gemstone ball unlocked sharply increases the cost of unlocking the others!"
			),
		];
	}

	BaseValues() {
		return {
			bottom: [10, 20, 30, 50, 100, 500, 100, 50, 30, 20, 10],
			funnel_center: [1000, 500, 1000],
			funnel_sides: [50, 100],
			top_sides: [10000, 5000, 10000],
			top_center: [5000, 10000],
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

		function midfield_target_set({machine, points, set_id, target_ids, values}) {
			console.assert(points.length == values.length);
			console.assert(points.length == target_ids.length);
			let targets = [];
			for (let i = 0; i < points.length; ++i) {
				targets.push(new ScoreTarget({
					machine: machine,
					pos: points[i],
					draw_radius: kTargetDrawRadius,
					hitbox_radius: kTargetHitboxRadius,
					color: kTargetColor,
					id: set_id + "_" + target_ids[i],
					active: true,
					value: values[i],
					pass_through: true
				}));
			}
			return new TargetSet(targets);
		}

		// Bottom target slots
		let y = kHeight - kHalfWallSpace;
		for (let row = 0; row < kBottomSlotRows; ++row) {
			y -= kWallSpacing;
			even_grid_row(y);
		}

		let target_sets = Array(0);
		let bumper_sets = Array(0);

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
		target_sets.push(midfield_target_set({
			machine: this,
			points: [
				new Point(grid_cols[9], y - kVerticalSpacing * 0.75),
				new Point(grid_cols[11], y - kHalfWallSpace),
				new Point(grid_cols[13], y - kVerticalSpacing * 0.75),
			],
			set_id: "funnel_center",
			target_ids: ["left", "middle", "right"],
			values: kBaseValues.funnel_center,
		}));

		y -= kVerticalSpacing * 2;

		target_sets.push(midfield_target_set({
			machine: this,
			points: [
				new Point(grid_cols[1], y),
				new Point(grid_cols[3], y),
			],
			set_id: "funnel_left",
			target_ids: ["outer", "inner"],
			values: kBaseValues.funnel_sides,
		}));
		target_sets.push(midfield_target_set({
			machine: this,
			points: [
				new Point(grid_cols[21], y),
				new Point(grid_cols[19], y),
			],
			set_id: "funnel_right",
			target_ids: ["outer", "inner"],
			values: kBaseValues.funnel_sides,
		}));

		y -= kVerticalSpacing / 2;
		even_grid_row(y);
		y -= kVerticalSpacing;
		odd_grid_row(y);
		y -= kVerticalSpacing;

		const kBumperStrength = 300.0;
		const kBumperRadius = kHorizontalSpacing * 0.75;
		y -= kVerticalSpacing;

		bumper_sets.push(new TargetSet([
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
		]));

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
			new Point(grid_cols[10], y - kVerticalSpacing * 5.125),
			new Point(grid_cols[10], y - kVerticalSpacing * 5.75),
		]
		AppendInterpolatedPolyline(pegs, bumper_center_left_wall, kWallSpacing);
		const bumper_center_right_wall = [
			new Point(grid_cols[12], y - kVerticalSpacing * 5.125),
			new Point(grid_cols[12], y - kVerticalSpacing * 5.75),
		]
		AppendInterpolatedPolyline(pegs, bumper_center_right_wall, kWallSpacing);
		pegs.push(new Point((grid_cols[9] + grid_cols[10]) / 2.0, y - kVerticalSpacing * 6))
		pegs.push(new Point((grid_cols[12] + grid_cols[13]) / 2.0, y - kVerticalSpacing * 6))
		pegs.push(new Point(grid_cols[11], y - kVerticalSpacing * 7))
		target_sets.push(midfield_target_set({
			machine: this,
			points: [
				new Point(grid_cols[11], y - kVerticalSpacing * 7.625),
				new Point(grid_cols[11], y - kVerticalSpacing * 5.5),
			],
			set_id: "top_center",
			target_ids: ["upper", "lower"],
			values: kBaseValues.top_center,
		}));
		target_sets[target_sets.length - 1].targets[0].active = false;
		target_sets.push(midfield_target_set({
			machine: this,
			points: [
				new Point(grid_cols[1], y - kVerticalSpacing * 7.625),
				new Point(grid_cols[1], y - kVerticalSpacing * 5.5),
				new Point(grid_cols[1], y - kVerticalSpacing * 1.875),
			],
			set_id: "top_left",
			target_ids: ["upper", "middle", "lower"],
			values: kBaseValues.top_sides,
		}));
		target_sets[target_sets.length - 1].targets[0].active = false;
		target_sets[target_sets.length - 1].targets[2].active = false;
		target_sets.push(midfield_target_set({
			machine: this,
			points: [
				new Point(grid_cols[21], y - kVerticalSpacing * 7.625),
				new Point(grid_cols[21], y - kVerticalSpacing * 5.5),
				new Point(grid_cols[21], y - kVerticalSpacing * 1.875),
			],
			set_id: "top_right",
			target_ids: ["upper", "middle", "lower"],
			values: kBaseValues.top_sides,
		}));
		target_sets[target_sets.length - 1].targets[0].active = false;
		target_sets[target_sets.length - 1].targets[2].active = false;

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

		return new PegBoard(kWidth, kHeight, pegs, drop_zones, target_sets, bumper_sets);
	}

	UpdateScoreTargetSet(target_set, base_values, multiplier) {
		console.assert(target_set.targets.length == base_values.length);
		for (let i = 0; i < target_set.targets.length; ++i) {
			target_set.targets[i].SetValue(base_values[i] * multiplier);
		}
	}

	UpdateScoreTargets() {
		const kBaseValues = this.BaseValues();
		let target_sets = this.board.target_sets;
		const board_mult = this.GetUpgradeValue("multiplier");
		const middle_mult =
			this.GetUpgradeValue("middle_target_multiplier") * board_mult;
		const bottom_mult =
			this.GetUpgradeValue("bottom_slot_multiplier") * board_mult;
		this.UpdateScoreTargetSet(target_sets[0], kBaseValues.bottom, bottom_mult);
		this.UpdateScoreTargetSet(target_sets[1], kBaseValues.funnel_center, middle_mult);
		this.UpdateScoreTargetSet(target_sets[2], kBaseValues.funnel_sides, middle_mult);
		this.UpdateScoreTargetSet(target_sets[3], kBaseValues.funnel_sides, middle_mult);
		this.UpdateScoreTargetSet(target_sets[4], kBaseValues.top_center, board_mult);
		this.UpdateScoreTargetSet(target_sets[5], kBaseValues.top_sides, board_mult);
		this.UpdateScoreTargetSet(target_sets[6], kBaseValues.top_sides, board_mult);

		state.redraw_targets = true;
	}

	UpdateBumperValues() {
		const base_value = this.GetUpgradeValue("bumper_value");
		const multiplier = this.GetUpgradeValue("multiplier");
		const value = base_value * multiplier;
		let bumper_sets = this.board.bumper_sets;
		for (let i = 0; i < this.board.bumper_sets.length; ++i) {
			let bumpers = this.board.bumper_sets[i].targets;
			for (let j = 0; j < bumpers.length; ++j) {
				bumpers[j].SetValue(value);
			}
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
				cost_func: level => 250 * Math.pow(5, level),
				value_func: level => Math.pow(10, Math.floor(level / 3)) * [1, 2, 5][level % 3],
				max_level: Infinity,
				value_suffix: kTimesSymbol,
				visible_func: null,
				on_update: () => {
					this.UpdateScoreTargets();
					this.UpdateBumperValues();
				},
				on_buy: (new_level) => {
					let color_rgb =
						GetSetting("dark_mode") ? "48,96,255" : "0,0,255"
					let multiple = ((new_level % 3) == 2) ? "2.5" : "2"
					let popup_text = kTimesSymbol + multiple;
					for (let i = 0; i < this.board.target_sets.length; ++i) {
						let targets = this.board.target_sets[i].targets;
						for (let j = 0; j < targets.length; ++j) {
							if (targets[j].active) {
								MaybeAddScoreText({
									level: 3,
									text: popup_text,
									pos: targets[j].pos,
									color_rgb: color_rgb,
									opacity: 1.0,
								});
							}
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
				cost_func: level => 100 * Math.pow(2, level),
				value_func: level => Math.max(level * 10, level * 20 - 500),
				max_level: 75,
				value_suffix: "",
				visible_func: null,
				on_update: () => this.UpdateBumperValues(),
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "add_score_targets",
				name: "Add Score Targets",
				category: "board",
				description: "Adds 5 more high-value blue score targets in hard-to-hit places.",
				cost: 1e10,
				visible_func: () => this.ShouldDisplayGemstoneBallUpgrades(),
				on_update: function() {
					let unlocked = this.GetValue() > 0;
					let target_sets = this.machine.board.target_sets;
					target_sets[4].targets[0].active = unlocked;
					target_sets[5].targets[0].active = unlocked;
					target_sets[5].targets[2].active = unlocked;
					target_sets[6].targets[0].active = unlocked;
					target_sets[6].targets[2].active = unlocked;
					state.redraw_targets = true;
				}
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "middle_target_multiplier",
				name: "Middle Target Value",
				category: "board",
				description: "Multiplies the value of the score targets in the middle section (below the bumpers).",
				cost_func: level => 1e10 * Math.pow(100, level),
				value_func: level => level + 1,
				max_level: 9,
				value_suffix: kTimesSymbol,
				visible_func: () => this.ShouldDisplayGemstoneBallUpgrades(),
				on_update: () => this.UpdateScoreTargets(),
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "bottom_slot_multiplier",
				name: "Bottom Slot Value",
				category: "board",
				description: "Multiplies the value of the bottom slots.",
				cost_func: level => 1e10 * Math.pow(100, level),
				value_func: level => level + 1,
				max_level: 9,
				value_suffix: kTimesSymbol,
				visible_func: () => this.ShouldDisplayGemstoneBallUpgrades(),
				on_update: () => this.UpdateScoreTargets(),
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
				cost: 25000,
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
				cost_func: level => 50000 * Math.pow(2, level),
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
				cost_func: level => 25000 * Math.pow(2, level),
				value_func: level => level + 1,
				max_level: 49,
				value_suffix: "",
				visible_func: () => this.GetUpgradeLevel("multiplier") > 1,
				on_update: function() {
					this.machine.max_balls = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "unlock_combos",
				name: "Unlock Combos",
				category: "combos",
				description:
					"Unlocks combos. A ball that hits multiple bumpers and/or score targets in quick succession starts a combo, which multiplies the point values of everything hit in the combo. The 2nd hit is worth 2&times; points, the 3rd thing hit is 3&times;, and so on.",
				cost: 10000,
				visible_func: () => this.GetUpgradeLevel("bumper_value") > 0,
				on_buy: UpdateOptionsButtons
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "combo_timeout",
				name: "Combo Timeout",
				category: "combos",
				description: "Increase the time a ball can go without hitting a bumper or target before its combo breaks.",
				cost_func: level => 1e6 * Math.pow(100, level),
				value_func: level => (level + 1) / 2.0,
				max_level: 9,
				value_suffix: " sec",
				visible_func: () => this.IsUnlocked("unlock_combos"),
				on_update: function() {
					this.machine.combo_timeout = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "gp_system",
				name: "GP System",
				category: "combos",
				description:
					'The base value of each bumper or target hit is added to the base value of all subsequent hits in the combo.' +
					'<div class="small">Example: Hitting a 1000-point target, a 100-point bumper, then a 500-point target in a combo awards 1000 points for the 1st hit, (1000+100)\u00D72 points for the 2nd hit, and (1000+100+500)\u00D73 points for the 3rd hit.</div><div>「死ぬがよい」</div>',
				cost: 8e8,
				visible_func: () => this.IsUnlocked("unlock_combos"),
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "unlock_hyper_system",
				name: "Hyper System",
				category: "hyper",
				description:
					"Unlock the Hyper System, which is charged by combos. The more hits in a combo, the more charge it's worth. When it's fully charged, activate the Hyper System to gain 10\u00D7 scoring for 15 seconds!",
				cost: 8e9,
				visible_func: () => this.IsUnlocked("unlock_combos"),
				on_buy: () => {
					state.update_buff_display = true
				},
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "hyper_multiplier",
				name: "Hyper Multiplier",
				category: "hyper",
				description: "Increases the Hyper System score multiplier.",
				cost_func: level => 8e10 * Math.pow(10, level),
				value_func: level => level + 10,
				max_level: 20,
				value_suffix: kTimesSymbol,
				visible_func: () => this.IsUnlocked("unlock_hyper_system"),
				on_update: function() {
					this.machine.hyper_multiplier = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "hyper_charge_rate",
				name: "Charge Rate",
				category: "hyper",
				description: "Makes the Hyper System charge faster.",
				cost_func: level => 2e10 * Math.pow(3, level),
				value_func: level => (level / 10.0) + 1.0,
				max_level: 40,
				value_suffix: kTimesSymbol,
				visible_func: () => this.IsUnlocked("unlock_hyper_system"),
				on_update: function() {
					this.machine.hyper_charge_rate = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new ToggleUnlockUpgrade({
				machine: this,
				id: "auto_hyper",
				name: "Auto-Hyper",
				category: "hyper",
				description:
					"Automatically activates the Hyper System when it's fully charged.",
				cost: 8e10,
				visible_func: () =>
					this.IsUnlocked("unlock_hyper_system") &&
					this.GetSaveData().stats.hyper_activations > 0,
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.GOLD],
				ball_description:
					"Gold balls are worth double points and don't count towards the max balls limit.",
				cost_func: () => 50000,
				visible_func: () => this.GetUpgradeLevel("max_balls") > 0
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.GOLD],
				cost_func: level => 75000 * Math.pow(2, level),
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
				cost_func: level => 100000 * Math.pow(2, level),
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
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.RUBY],
				ball_description:
					"A Ruby ball gets +10% value (upgradable) per second.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => this.ShouldDisplayGemstoneBallUpgrades(),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.RUBY],
				cost_func: this.Tier1GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "ruby_ball_value_percent",
				name: "Ruby Ball Value",
				category: "ruby_balls",
				description: "Point value increase per second for Ruby balls.",
				cost_func: level => 2e10 * Math.pow(2, level),
				value_func: level => 2 * level + 10,
				max_level: 45,
				value_suffix: "%",
				visible_func: () => this.IsUnlocked("unlock_ruby_balls"),
				on_update: function() {
					this.machine.ruby_ball_value_percent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.SAPPHIRE],
				ball_description:
					"A Sapphire ball gets +50% value (upgradable) each time it hits a blue score target.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => this.ShouldDisplayGemstoneBallUpgrades(),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.SAPPHIRE],
				cost_func: this.Tier1GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "sapphire_ball_value_percent",
				name: "Sapphire Ball Value",
				category: "sapphire_balls",
				description: "Point value increase per blue target hit for Sapphire balls.",
				cost_func: level => 2e10 * Math.pow(2, level),
				value_func: level => (level + 5) * 10,
				max_level: 45,
				value_suffix: "%",
				visible_func: () => this.IsUnlocked("unlock_sapphire_balls"),
				on_update: function() {
					this.machine.sapphire_ball_value_percent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.EMERALD],
				ball_description:
					"An Emerald ball gets +10% value (upgradable) each time it hits a green bumper.",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => this.ShouldDisplayGemstoneBallUpgrades(),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.EMERALD],
				cost_func: this.Tier1GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "emerald_ball_value_percent",
				name: "Emerald Ball Value",
				category: "emerald_balls",
				description: "Point value increase per green bumper hit for Emerald balls.",
				cost_func: level => 2e10 * Math.pow(2, level),
				value_func: level => 2 * level + 10,
				max_level: 45,
				value_suffix: "%",
				visible_func: () => this.IsUnlocked("unlock_emerald_balls"),
				on_update: function() {
					this.machine.emerald_ball_value_percent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.TOPAZ],
				ball_description:
					"Topaz balls have the bonuses of both ruby and emerald balls. (The two multipliers stack additively.)",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () =>
					this.IsUnlocked("unlock_ruby_balls") &&
					this.IsUnlocked("unlock_emerald_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.TOPAZ],
				cost_func: this.Tier2GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.TURQUOISE],
				ball_description:
					"Turquoise balls have the bonuses of both emerald and sapphire balls. (The two multipliers stack additively.)",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () =>
					this.IsUnlocked("unlock_emerald_balls") &&
					this.IsUnlocked("unlock_sapphire_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.TURQUOISE],
				cost_func: this.Tier2GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.AMETHYST],
				ball_description:
					"Amethyst balls have the bonuses of both ruby and sapphire balls. (The two multipliers stack additively.)",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () =>
					this.IsUnlocked("unlock_ruby_balls") &&
					this.IsUnlocked("unlock_sapphire_balls")
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.AMETHYST],
				cost_func: this.Tier2GemstoneBallRateCostFunc,
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.OPAL],
				ball_description:
					"Opal balls have the combined bonuses of all the other gemstone balls. (The three multipliers stack additively.)",
				cost_func: this.GemstoneBallUnlockCost,
				visible_func: () => this.AllTier2GemstoneBallsUnlocked(),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.OPAL],
				cost_func: level => 2e17 * Math.pow(5, level),
				value_func: this.GemstoneBallRateValueFunc,
				max_level: 18
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

	BuffDisplayText() {
		let save_data = this.GetSaveData();
		if (save_data.score_buff_duration > 0) {
			let duration_sec =
				Math.round(save_data.score_buff_duration / 1000.0);
			return "All scoring \u00D7" +
				FormatNumberMedium(this.hyper_multiplier) +
				" for " + duration_sec + " seconds!";
		} else if (this.IsUnlocked("unlock_hyper_system")) {
			return 'Score multiplier: \u00D71';
		} else {
			return "";
		}
	}

	ActivateHyperSystem() {
		let save_data = this.GetSaveData();
		if (save_data.hyper_charge >= this.max_hyper_charge) {
			save_data.score_buff_duration = this.hyper_duration;
			save_data.hyper_charge = 0;
			++save_data.stats.hyper_activations;
		}
		state.update_buff_display = true;
	}

	AutoHyperOn() {
		return this.IsUnlocked("auto_hyper") &&
			this.GetSaveData().options.auto_hyper_enabled;
	}

	AwardPoints(base_value, ball) {
		const kTimesSymbol = "\u00D7";

		let color_rgb = this.PopupTextColorForBallType(ball.ball_type_index);
		let popup_text_level = this.PopupTextLevelForBallType(ball.ball_type_index);
		let popup_text_opacity =
			PopupTextOpacityForBallType(ball.ball_type_index);

		let save_data = this.GetSaveData();
		let total_value = base_value;

		if (this.IsUnlocked("unlock_combos")) {
			let gp_system_unlocked = this.IsUnlocked("gp_system");
			const combo_timeout_ms = this.combo_timeout * 1000;
			if (
				ball.combo == 0 ||
				ball.last_hit_time + combo_timeout_ms < state.current_time
			) {
				ball.combo = 1;
				ball.combo_bonus = gp_system_unlocked ? base_value : 0;
			} else {
				++ball.combo;
				if (gp_system_unlocked) {
					ball.combo_bonus += base_value;
					total_value = ball.combo_bonus;
				}
				total_value *= ball.combo;
				if (GetSetting("show_combos")) {
					MaybeAddScoreText({
						level: popup_text_level,
						text: kTimesSymbol + ball.combo + " combo",
						pos: new Point(ball.pos.x, ball.pos.y - 10),
						color_rgb,
						opacity: popup_text_opacity,
					});
				}
			}
			ball.last_hit_time = state.current_time;

			if (this.IsUnlocked("unlock_hyper_system")) {
				if (save_data.score_buff_duration > 0) {
					total_value *= this.hyper_multiplier;
				} else {
					save_data.hyper_charge += ball.combo * this.hyper_charge_rate;
					if (save_data.hyper_charge >= this.max_hyper_charge) {
						if (this.AutoHyperOn()) {
							this.ActivateHyperSystem();
						} else {
							save_data.hyper_charge = this.max_hyper_charge;
						}
					}
					state.update_buff_display = true;
				}
			}

			save_data.stats.max_combo =
				Math.max(save_data.stats.max_combo, ball.combo);
		}

		if (ball.ball_type_index != kBumperMachineBallTypeIDs.NORMAL) {
			total_value *= this.special_ball_multiplier;
			if (ball.ball_type_index != kBumperMachineBallTypeIDs.GOLD) {
				let gem_add_percent = 0;
				if (this.HasRubySpecial(ball.ball_type_index)) {
					let sec_elapsed =
						(state.current_time - ball.start_time) / 1000.0;
					gem_add_percent +=
					sec_elapsed * this.ruby_ball_value_percent;
				}
				if (this.HasSapphireSpecial(ball.ball_type_index)) {
					gem_add_percent +=
						ball.score_targets_hit * this.sapphire_ball_value_percent;
				}
				if (this.HasEmeraldSpecial(ball.ball_type_index)) {
					gem_add_percent +=
						ball.bumpers_hit * this.emerald_ball_value_percent;
				}
				let multiplier = 1.0 + (gem_add_percent / 100.0);
				total_value *= multiplier;
			}
		}

		this.AddScore(total_value);
		this.AddPointsForBallToStats(total_value, ball.ball_type_index);
		MaybeAddScoreText({
			level: popup_text_level,
			text: `+${FormatNumberShort(total_value)}`,
			pos: ball.pos,
			color_rgb,
			opacity: popup_text_opacity,
		});
	}

	ShouldDisplayGemstoneBallUpgrades() {
		return this.IsMaxed("gold_ball_rate");
	}

	NumGemstoneBallsUnlocked() {
		let prev_unlocks = 0;
		const kGemstoneBalls = [
			kBumperMachineBallTypeIDs.RUBY,
			kBumperMachineBallTypeIDs.SAPPHIRE,
			kBumperMachineBallTypeIDs.EMERALD,
			kBumperMachineBallTypeIDs.TOPAZ,
			kBumperMachineBallTypeIDs.TURQUOISE,
			kBumperMachineBallTypeIDs.AMETHYST,
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
		return 25e8 * Math.pow(20, n - 1);
	}

	Tier1GemstoneBallRateCostFunc(level) {
		return 1e9 * Math.pow(5, level);
	}

	Tier2GemstoneBallRateCostFunc(level) {
		return 1e12 * Math.pow(5, level);
	}

	GemstoneBallRateValueFunc(level) {
		return 1 + level / 2.0;
	}

	HasOpalSpecial(ball_type_index) {
		return ball_type_index == kBumperMachineBallTypeIDs.OPAL;
	}

	HasRubySpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.RUBY ||
			ball_type_index == kBumperMachineBallTypeIDs.TOPAZ ||
			ball_type_index == kBumperMachineBallTypeIDs.AMETHYST ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasSapphireSpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.SAPPHIRE ||
			ball_type_index == kBumperMachineBallTypeIDs.TURQUOISE ||
			ball_type_index == kBumperMachineBallTypeIDs.AMETHYST ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasEmeraldSpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.EMERALD ||
			ball_type_index == kBumperMachineBallTypeIDs.TOPAZ ||
			ball_type_index == kBumperMachineBallTypeIDs.TURQUOISE ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasTopazSpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.TOPAZ ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasTurquoiseSpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.TURQUOISE ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	HasAmethystSpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.AMETHYST ||
			this.HasOpalSpecial(ball_type_index)
		);
	}

	NextUpgradeHint() {
		if (!this.IsUpgradeVisible("unlock_combos")) {
			return "10 Bumper Value";
		} else if (!this.IsUpgradeVisible("auto_drop")) {
			return "5x Point Multiplier";
		} else if (!this.IsUnlocked("unlock_combos")) {
			return "Unlock Combos";
		} else if (!this.IsUpgradeVisible("unlock_gold_balls")) {
			return "2 Max Balls";
		} else if (!this.IsUpgradeVisible("gold_ball_rate")) {
			return "Unlock Gold Balls";
		} else if (!this.ShouldDisplayGemstoneBallUpgrades()) {
			return "15% Gold Ball Rate";
		} else if (!this.ShouldDisplayGemstoneBallUpgrades()) {
			return "15% Gold Ball Rate";
		} else if (!this.IsUnlocked("unlock_hyper_system")) {
			return "Unlock Hyper System";
		} else if (!this.AllTier1GemstoneBallsUnlocked()) {
			return "Unlock all 3 of Ruby, Sapphire, and Emerald Balls";
		} else if (!this.AllTier2GemstoneBallsUnlocked()) {
			return "Unlock all 3 of Topaz, Turquoise, and Amethyst Balls";
		} else {
			return "None yet, please wait for the next beta update."
		}
	}
}
