const kBumperMachineID = "bumper";

const kBumperMachineBallTypes = [
	//          | id |    name     | display_name  |      physics_params      | inner_color | outer_color | ripple_color_rgb |
	kNormalBallType,
	new BallType(1,   "gold",       "Gold ",        kPhysicsParams.normal,     "#FFD700",    "#AA8F00",    "170,143,  0"    ),
	new BallType(2,   "ruby",       "Ruby ",        kPhysicsParams.normal,     "#FBB",       "#F33",       "255, 48, 48"    ),
	new BallType(3,   "sapphire",   "Sapphire ",    kPhysicsParams.normal,     "#BBF",       "#33F",       " 48, 48,255"    ),
	new BallType(4,   "emerald",    "Emerald ",     kPhysicsParams.normal,     "#BFB",       "#3F3",       " 48,255, 48"    ),
	new BallType(5,   "topaz",      "Topaz ",       kPhysicsParams.normal,     "#FFB",       "#FF3",       "255,255, 48"    ),
	new BallType(6,   "turquoise",  "Turquoise ",   kPhysicsParams.normal,     "#BFF",       "#3FF",       " 48,255,255"    ),
	new BallType(7,   "amethyst",   "Amethyst ",    kPhysicsParams.normal,     "#FBF",       "#F3F",       "255, 48,255"    ),
	new BallType(8,   "opal",       "Opal ",        kPhysicsParams.normal,     kPrismatic,   kPrismatic,   kPrismatic       ),
	new BallType(9,   "beach",      "Beach ",       kPhysicsParams.beach_ball, kBeachBall,   kBeachBall,   kBeachBall       ),
	new BallType(10,  "rubberband", "Rubber Band ", kPhysicsParams.rubber,     kRubberBand,  kRubberBand,  kRubberBand      ),
	new BallType(11,  "spiral",     "Spiral ",      kPhysicsParams.normal,     kSpiral,      kSpiral,      kPrismatic       ),
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
	BEACH_BALL: 9,
	RUBBER_BAND: 10,
	SPIRAL: 11,
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

		this.ruby_ball_value_percent = 10;
		this.sapphire_ball_value_percent = 10;
		this.emerald_ball_value_percent = 50;
		this.rubberband_ball_value_percent = 1;
		this.combo_timeout = 1;
		this.hyper_multiplier = 10;
		this.max_hyper_charge = 50000;
		this.hyper_charge_rate = 1.0;
		this.hyper_duration = 15000;
		this.last_hyper_end_time = 0;
		this.overdrive = false;
		this.spiral_power = 0.0;
		this.spiral_multiplier = 1.0;

		//this.bonus_wheel = this.InitWheel();
	}

	OnActivate() {
		this.CheckOverdrive();
		//this.bonus_wheel = this.InitWheel();
	}
	
	OnBuffTimeout(state) {
		this.DeactivateOverdrive();
		this.last_hyper_end_time = state.current_time;
	}

	BallTypes() {
		return kBumperMachineBallTypes;
	}

	RollBallType() {
		let ball_type = super.RollBallType();
		if (
			ball_type == kBumperMachineBallTypeIDs.NORMAL &&
			this.overdrive &&
			this.IsUnlocked("overdrive_midas")
		) {
			ball_type = kBumperMachineBallTypeIDs.GOLD;
		}
		return ball_type;
	}

	DefaultSaveData() {
		let save_data = super.DefaultSaveData();
		save_data.options.auto_hyper_enabled = false;
		save_data.hyper_charge = 0;
		save_data.hyper_combo = 0;
		save_data.spiral_power = 0;
		save_data.score_buff_duration = 0;
		save_data.score_buff_time_dilation = 1.0;
		save_data.stats.hyper_activations = 0;
		save_data.stats.max_combo = 0;
		save_data.stats.max_hyper_combo = 0;
		save_data.stats.longest_lasting_ruby_ball = 0;
		save_data.stats.emerald_ball_most_bumper_hits = 0;
		save_data.stats.sapphire_ball_most_target_hits = 0;
		save_data.stats.rubberband_ball_most_bounces = 0;
		save_data.stats.max_spiral_power_percent = 0;
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
				kPrismatic,
				kPrismatic,
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
				kPrismatic,
				kPrismatic,
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
			new UpgradeHeader(this, "overdrive", "Overdrive", this.upgrades["unlock_overdrive"].visible_func),
			/* TODO: Add bonus wheel.
			new UpgradeHeader(this, "bonus_wheel", "Bonus Wheel", this.upgrades["unlock_bonus_wheel"].visible_func),
			*/
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kBumperMachineBallTypeIDs.GOLD]
			),
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kBumperMachineBallTypeIDs.BEACH_BALL]
			),
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kBumperMachineBallTypeIDs.RUBBER_BAND]
			),
			new SingleBallTypeUpgradeHeader(
				this, this.ball_types[kBumperMachineBallTypeIDs.SPIRAL]
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
				"Gemstone balls have the benefits of gold balls (including not counting towards the max balls limit), plus an additional point value multiplier. Each type of gemstone ball has its own way to increase its multiplier.<br>NOTE: Each gemstone ball unlocked sharply increases the cost of unlocking the others!"
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
		pegs.pop();
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
				id: "add_score_targets",
				name: "Add Score Targets",
				category: "board",
				description: "Adds 5 more high-value blue score targets in hard-to-hit places.",
				cost: 1e12,
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
				visible_func: () =>
					this.IsUnlocked("unlock_hyper_system") &&
					this.GetSaveData().stats.hyper_activations > 0,
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
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "hyper_combo",
				name: "Hyper Combo",
				category: "hyper",
				description: "The Hyper System gets its own combo, counting every bumper and score target hit by every ball during a Hyper System activation. The score multiplier grows as this combo increases. (The effect stacks multiplicatively with the Hyper Multiplier upgrade.)",
				cost: 8e18,
				visible_func: () =>
					this.IsUnlocked("unlock_hyper_system") &&
					this.IsUnlocked("unlock_combos") &&
					this.GetSaveData().stats.hyper_activations > 0,
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "hyper_recharge",
				name: "Hyper Recharge",
				category: "hyper",
				description: "When time runs out, the Hyper System regains some charge based on the length of the Hyper Combo achieved. (Does not stack with the Charge Rate upgrade.)",
				cost: 888e24,
				visible_func: () =>
					this.IsUnlocked("hyper_combo") &&
					this.GetSaveData().stats.hyper_activations > 0,
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "unlock_overdrive",
				name: "Overdrive",
				category: "overdrive",
				description: 'Unlock Overdrive, which activates whenever the Hyper Combo is over 1000 hits. It doubles the Hyper Combo effect and can be upgraded with additional effects.<br><font color="#3FF">「届け蒼の彼方へ…♪」</font>',
				cost: 8e21,
				visible_func: () =>
					this.IsUnlocked("hyper_combo") &&
					this.GetSaveData().stats.max_hyper_combo >= 1000,
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_midas",
				name: "OD Midas",
				category: "overdrive",
				description: "Overdrive turns all normal balls into gold balls.",
				cost: 8e22,
				visible_func: () => this.IsUnlocked("unlock_overdrive"),
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_accelerator",
				name: "OD Accelerator",
				category: "overdrive",
				description: "Overdrive makes the Hyper Combo's multiplier increase faster.",
				cost: 8e23,
				visible_func: () => this.IsUnlocked("unlock_overdrive"),
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_heavens_time",
				name: "OD Heaven's Time",
				category: "overdrive",
				description: "Overdrive dilates time for the Hyper System, making its energy drain half as fast.",
				cost: 11e24,
				visible_func: () => this.IsUnlocked("unlock_overdrive"),
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_secret_code",
				name: 'OD <span class="arrows">&uarr;&uarr;&darr;&darr;&larr;&rarr;&larr;&rarr;</span>BA',
				category: "overdrive",
				description: "+30 base Hyper Multiplier during Overdrive.",
				cost: 573e24,
				visible_func: () => this.IsUnlocked("unlock_overdrive"),
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_lunatic_red_eyes",
				name: "OD Lunatic Red Eyes",
				category: "overdrive",
				button_class: "rubyUpgradeButton",
				description: '<span class="spellCard">「幻朧月睨(ルナティックレッドアイズ)」</span><br>2&times; Ruby Ball Value during Overdrive.',
				cost: 8e24,
				visible_func: () =>
					this.IsUnlocked("unlock_overdrive") &&
					this.IsMaxed("ruby_ball_value_percent"),
				tooltip_width: 270,
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_green_eyed_monster",
				name: "OD Green-Eyed Monster",
				category: "overdrive",
				button_class: "emeraldUpgradeButton",
				description: '<span class="spellCard">嫉妬「緑色の眼をした見えない怪物」</span><br>2&times; Emerald Ball Value during Overdrive.',
				cost: 11e24,
				visible_func: () =>
					this.IsUnlocked("unlock_overdrive") &&
					this.IsMaxed("emerald_ball_value_percent"),
				tooltip_width: 270,
			})
		);
		upgrades_list.push(
			new CirnoFixedCostUpgrade({
				machine: this,
				id: "overdrive_perfect_freeze",
				name: "OD Perfect Freeze",
				category: "overdrive",
				button_class: "sapphireUpgradeButton",
				description: '<span class="spellCard">凍符「パーフェクトフリーズ」</span><br>2&times; Sapphire Ball Value during Overdrive.<br>⑨',
				cost: 9e24,
				visible_func: () =>
					this.IsUnlocked("unlock_overdrive") &&
					this.IsMaxed("sapphire_ball_value_percent"),
				tooltip_width: 270,
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "overdrive_rainbow_ufo",
				name: "OD Rainbow UFO",
				category: "overdrive",
				button_class: "opalUpgradeButton",
				description: '<span class="spellCard">正体不明「恐怖の虹色ＵＦＯ襲来」</span><br>During Overdrive, the 3 gemstone ball multipliers stack multiplicatively instead of additively.',
				cost: 12e27,
				visible_func: () =>
					this.IsUnlocked("unlock_overdrive") &&
					this.IsUnlocked("overdrive_lunatic_red_eyes") &&
					this.IsUnlocked("overdrive_green_eyed_monster") &&
					this.IsUnlocked("overdrive_perfect_freeze") &&
					this.IsUnlocked("unlock_opal_balls"),
				tooltip_width: 270,
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
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.BEACH_BALL],
				ball_description:
					"Beach balls have bonuses of Opal balls plus they never break their combo. They're also bouncier and floatier.",
				cost_func: () => 1e21,
				visible_func: () =>
					this.IsUnlocked("unlock_opal_balls") &&
					this.IsMaxed("combo_timeout"),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.BEACH_BALL],
				cost_func: level => 1e21 * Math.pow(10, level),
				value_func: level => (level + 1) / 2.0,
				max_level: 9
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.RUBBER_BAND],
				ball_description:
					"Rubber band balls have bonuses of Opal balls plus they never break their combo. They're also much bouncier and they increase in value with each bounce. (Stacks multiplicatively with gemstone ball multipliers.)",
				cost_func: () => 1e21,
				visible_func: () =>
					this.IsUnlocked("unlock_opal_balls") &&
					this.IsMaxed("combo_timeout"),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.RUBBER_BAND],
				cost_func: level => 1e21 * Math.pow(10, level),
				value_func: level => (level + 1) / 2.0,
				max_level: 9
			})
		);
		upgrades_list.push(
			new Upgrade({
				machine: this,
				id: "rubberband_ball_value_percent",
				name: "Rubber Band Ball Value",
				category: "rubberband_balls",
				description: "Point value increase per bounce for Rubber Band balls.",
				cost_func: level => 1e21 * Math.pow(2, level),
				value_func: level => (level + 5),
				max_level: 25,
				value_suffix: "%",
				visible_func: () => this.IsUnlocked("unlock_rubberband_balls"),
				on_update: function() {
					this.machine.rubberband_ball_value_percent = this.GetValue();
				},
			})
		);
		upgrades_list.push(
			new BallTypeUnlockUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.SPIRAL],
				ball_description:
					"Spiral balls have bonuses of Opal balls plus they generate Spiral Power when they rotate. Spiral Power provides a global score buff, but drains over time.<br>「俺を誰だと思ってやがる！」",
				cost_func: () => 1e21,
				visible_func: () =>
					this.IsUnlocked("unlock_opal_balls") &&
					this.IsMaxed("combo_timeout"),
			})
		);
		upgrades_list.push(
			new BallTypeRateUpgrade({
				machine: this,
				ball_type: this.ball_types[kBumperMachineBallTypeIDs.SPIRAL],
				cost_func: level => 1e21 * Math.pow(10, level),
				value_func: level => (level + 1) / 2.0,
				max_level: 9
			})
		);
		upgrades_list.push(
			new FixedCostFeatureUnlockUpgrade({
				machine: this,
				id: "pierce_the_heavens",
				name: "Pierce the Heavens",
				category: "spiral_balls",
				description: "Allows Spiral Power to exceed 100%, with diminishing returns above 100%.",
				cost: 1e27,
				visible_func: () => this.IsUnlocked("unlock_spiral_balls"),
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
			let duration_sec = save_data.score_buff_duration / 1000.0;
			let hyper_combo_value =
				this.HyperComboValue(save_data.hyper_combo);
			let hyper_mult = this.hyper_multiplier;
			if (this.IsUnlocked("overdrive_secret_code")) {
				hyper_mult += 30;
			}
			let multiplier_text = ""
			if (hyper_combo_value > 1.0) {
				let total_multiplier = hyper_mult * hyper_combo_value;
				if (total_multiplier < 100) {
					// Prevent flickering between 1 decimal place and rounding to
					// the nearest integer.
					multiplier_text = total_multiplier.toFixed(1);
				} else {
					multiplier_text = FormatNumberMedium(total_multiplier)
				}
			} else {
				multiplier_text = FormatNumberMedium(hyper_mult);
			}
			return "All scoring \u00D7" + multiplier_text + " for " +
				duration_sec.toFixed(1) + " seconds!";
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
			save_data.score_buff_time_dilation = 1.0;
			save_data.hyper_charge = 0;
			++save_data.stats.hyper_activations;
			save_data.hyper_combo = 0;
		}
		state.update_buff_display = true;
	}

	HyperComboValue(hyper_combo) {
		let value = Math.max(1.0, hyper_combo / 200.0);
		if (this.overdrive) {
			if (this.IsUnlocked("overdrive_accelerator")) {
				value *= 1.0 + (hyper_combo / 1000.0);
			} else {
				value *= 2.0;
			}
		}
		return value;
	}

	AutoHyperOn() {
		return this.IsUnlocked("auto_hyper") &&
			this.GetSaveData().options.auto_hyper_enabled;
	}

	UpdateHyperSystemDisplay(state) {
		if (!this.IsUnlocked("unlock_hyper_system")) {
			UpdateDisplay("hyper_system", "none");
			return;
		}
		UpdateDisplay("hyper_system", "inline-block");
		const save_data = this.GetSaveData();
		let button_elem = document.getElementById("button_hyper");
		let status_elem = document.getElementById("hyper_status");
		let meter_fraction = 0;
		if (save_data.score_buff_duration > 0) {
			status_elem.style.opacity = 1.0;
			meter_fraction =
				save_data.score_buff_duration / this.hyper_duration;
			button_elem.disabled = true;
			if (save_data.hyper_combo > 0) {
				let status_text = save_data.hyper_combo + " hit";
				if (save_data.hyper_combo > 1) {
					status_text += "s";
				}
				let hyper_combo_value =
					this.HyperComboValue(save_data.hyper_combo);
				status_text += "! Multiplier \u00D7" +
					hyper_combo_value.toFixed(2);
				UpdateInnerHTML("hyper_status", status_text);
			} else {
				UpdateInnerHTML("hyper_status", "Hyper System active!");
			}
		} else if (save_data.hyper_charge < this.max_hyper_charge) {
			meter_fraction =
				save_data.hyper_charge / this.max_hyper_charge;
			button_elem.disabled = true;
			let since_hyper_end = state.current_time - this.last_hyper_end_time;
			const kFadeTime = 2000.0;
			if (save_data.hyper_combo > 0 && since_hyper_end < kFadeTime) {
				status_elem.style.opacity = 1.0 - (since_hyper_end / kFadeTime);
			} else {
				UpdateInnerHTML("hyper_status", "Hyper System charging...");
				if (save_data.hyper_combo > 0 && since_hyper_end < kFadeTime * 2) {
					status_elem.style.opacity = (since_hyper_end / kFadeTime) - 1.0;
				} else {
					status_elem.style.opacity = 1.0;
				}
			}
		} else {
			status_elem.style.opacity = 1.0;
			meter_fraction = 1.0;
			button_elem.disabled = false;
			UpdateInnerHTML("hyper_status", "Hyper System ready!");
		}

		let meter_percent = 100.0 * meter_fraction;
		if (meter_percent > 100.0) {
			meter_percent = 100.0;
		}
		if (meter_percent < 0.0) {
			meter_percent = 0.0;
		}
		document.getElementById("hyper_meter_fill").style.width =
			meter_percent + "%";
	}

	ActivateOverdrive() {
		this.overdrive = true;
		document.getElementById("hyper_status").classList.add("overdrive");
		
		if (this.IsUnlocked("overdrive_midas")) {
			const kNormal = kBumperMachineBallTypeIDs.NORMAL;
			const kGold = kBumperMachineBallTypeIDs.GOLD;
			let normal_balls = state.balls_by_type[kNormal];
			let gold_balls = state.balls_by_type[kGold];
			if (normal_balls && gold_balls) {
				for (let i = 0; i < normal_balls.length; ++i) {
					let ball = normal_balls[i];
					ball.ball_type_index = kGold;
					state.ripples.push(
						new RippleEffect(
							new Point(ball.pos.x, ball.pos.y),
							kBumperMachineBallTypes[kGold].ripple_color_rgb,
							kBallRadius
						)
					);
					gold_balls.push(normal_balls[i]);
				}
				state.balls_by_type[kNormal] = [];
			}
		}
		
		if (this.IsUnlocked("overdrive_heavens_time")) {
			this.GetSaveData().score_buff_time_dilation = 2.0;
		}
	}
	
	DeactivateOverdrive() {
		this.overdrive = false;
		document.getElementById("hyper_status").classList.remove("overdrive");
		this.GetSaveData().score_buff_time_dilation = 1.0;
	}
	
	CheckOverdrive() {
		let save_data = this.GetSaveData();
		if (
			save_data.score_buff_duration > 0 &&
			save_data.hyper_combo >= 1000 &&
			this.IsUnlocked("unlock_overdrive")
		) {
			if (!this.overdrive) {
				this.ActivateOverdrive();
			}
		} else if (this.overdrive) {
			this.DeactivateOverdrive();
		}
	}

	UpdateOneFrame() {
		let save_data = this.GetSaveData();

		if (!this.IsUnlocked("unlock_spiral_balls")) {
			UpdateDisplay("spiral_power", "none");
		} else {
			UpdateDisplay("spiral_power", "inline-block");
			const kMaxSpiralPower = 5000;
			const kMaxSpiralMultiplier = 10;
			save_data.spiral_power *= 0.99;
			const spiral_balls =
				state.balls_by_type[kBumperMachineBallTypeIDs.SPIRAL];
			for (let i = 0; i < spiral_balls.length; ++i) {
				save_data.spiral_power += Math.abs(spiral_balls[i].omega);
			}
			if (!this.IsUnlocked("pierce_the_heavens")) {
				save_data.spiral_power =
					Math.min(save_data.spiral_power, kMaxSpiralPower);
			}
			let meter_fraction = save_data.spiral_power / kMaxSpiralPower;
			let multiplier_fraction = meter_fraction;
			if (multiplier_fraction > 1.0) {
				multiplier_fraction = Math.sqrt(multiplier_fraction);
			}
			this.spiral_multiplier =
				1.0 + multiplier_fraction * (kMaxSpiralMultiplier - 1);
			let meter_percent = 100.0 * meter_fraction;
			save_data.stats.max_spiral_power_percent =
				Math.max(save_data.stats.max_spiral_power_percent, meter_percent);
			if (meter_percent < 0.0) {
				meter_percent = 0.0;
			}
			let display_percent =
				meter_percent.toFixed(2).padStart(6, "\xa0") + "%";
			UpdateInnerHTML("spiral_power_percent", display_percent);
			if (meter_percent > 100.0) {
				meter_percent = 100.0;
			}
			document.getElementById("spiral_meter_fill").style.width =
				meter_percent + "%";
			UpdateInnerHTML("spiral_multiplier", this.spiral_multiplier.toFixed(2));
		}
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
				(
					!this.HasBeachBallSpecial(ball.ball_type_index) &&
					!this.HasRubberBandBallSpecial(ball.ball_type_index) &&
					!this.HasSpiralBallSpecial(ball.ball_type_index) &&
					ball.last_hit_time + combo_timeout_ms < state.current_time
				)
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
					if (this.IsUnlocked("hyper_combo")) {
						++save_data.hyper_combo;
						this.CheckOverdrive();
						save_data.stats.max_hyper_combo =
							Math.max(save_data.hyper_combo, save_data.stats.max_hyper_combo);
						total_value *= this.HyperComboValue(save_data.hyper_combo);
						
						if (this.IsUnlocked("hyper_recharge")) {
							save_data.hyper_charge = Math.min(
								save_data.hyper_charge + 10,
								this.max_hyper_charge * 0.3
							);
						}
					}
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
				let ruby_value = 0;
				if (this.HasRubySpecial(ball.ball_type_index)) {
					let sec_elapsed =
						(state.current_time - ball.start_time) / 1000.0;
					ruby_value = sec_elapsed * this.ruby_ball_value_percent;

					save_data.stats.longest_lasting_ruby_ball = Math.max(
						save_data.stats.longest_lasting_ruby_ball,
						sec_elapsed
					);
				}
				let sapphire_value = 0;
				if (this.HasSapphireSpecial(ball.ball_type_index)) {
					sapphire_value =
						ball.score_targets_hit * this.sapphire_ball_value_percent;

					save_data.stats.sapphire_ball_most_target_hits = Math.max(
						save_data.stats.sapphire_ball_most_target_hits,
						ball.score_targets_hit
					);
				}
				let emerald_value = 0;
				if (this.HasEmeraldSpecial(ball.ball_type_index)) {
					emerald_value =
						ball.bumpers_hit * this.emerald_ball_value_percent;

					save_data.stats.emerald_ball_most_bumper_hits = Math.max(
						save_data.stats.emerald_ball_most_bumper_hits,
						ball.bumpers_hit
					);
				}
				if (this.overdrive) {
					if (this.IsUnlocked("overdrive_lunatic_red_eyes")) {
						ruby_value *= 2;
					}
					if (this.IsUnlocked("overdrive_perfect_freeze")) {
						sapphire_value *= 2;
					}
					if (this.IsUnlocked("overdrive_green_eyed_monster")) {
						emerald_value *= 2;
					}
				}
				let multiplier = 1.0;
				if (this.overdrive && this.IsUnlocked("overdrive_rainbow_ufo")) {
					multiplier *= 1.0 + ruby_value / 100.0;
					multiplier *= 1.0 + sapphire_value / 100.0;
					multiplier *= 1.0 + emerald_value / 100.0;
				} else {
					multiplier = 1.0 +
						(ruby_value + sapphire_value + emerald_value) / 100.0;
				}
				if (this.HasRubberBandBallSpecial(ball.ball_type_index)) {
					let rubberband_value =
						ball.bounces * this.rubberband_ball_value_percent;
					multiplier *= 1.0 + rubberband_value / 100.0;

					save_data.stats.rubberband_ball_most_bounces = Math.max(
						save_data.stats.rubberband_ball_most_bounces,
						ball.bounces
					);
				}
				if (
					this.IsUnlocked("unlock_spiral_balls") &&
					this.spiral_multiplier > 1.0
				) {
					multiplier *= this.spiral_multiplier;
				}
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
		return 1e12 * Math.pow(20, n - 1);
	}

	Tier1GemstoneBallRateCostFunc(level) {
		return 1e12 * Math.pow(5, level);
	}

	Tier2GemstoneBallRateCostFunc(level) {
		return 1e15 * Math.pow(5, level);
	}

	GemstoneBallRateValueFunc(level) {
		return 1 + level / 2.0;
	}

	HasBeachBallSpecial(ball_type_index) {
		return ball_type_index == kBumperMachineBallTypeIDs.BEACH_BALL;
	}

	HasRubberBandBallSpecial(ball_type_index) {
		return ball_type_index == kBumperMachineBallTypeIDs.RUBBER_BAND;
	}

	HasSpiralBallSpecial(ball_type_index) {
		return ball_type_index == kBumperMachineBallTypeIDs.SPIRAL;
	}

	HasOpalSpecial(ball_type_index) {
		return (
			ball_type_index == kBumperMachineBallTypeIDs.OPAL ||
			ball_type_index == kBumperMachineBallTypeIDs.SPIRAL ||
			this.HasBeachBallSpecial(ball_type_index) || 
			this.HasRubberBandBallSpecial(ball_type_index)
		);
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
		} else if (!this.IsUnlocked("unlock_hyper_system")) {
			return "Unlock Hyper System";
		} else if (!this.IsUpgradeVisible("auto_hyper")) {
			return "Activate the Hyper System once";
		} else if (!this.AllTier1GemstoneBallsUnlocked()) {
			return "Unlock all 3 of Ruby, Sapphire, and Emerald Balls";
		} else if (!this.AllTier2GemstoneBallsUnlocked()) {
			return "Unlock all 3 of Topaz, Turquoise, and Amethyst Balls";
		} else if (!this.IsUnlocked("hyper_combo")) {
			return "Unlock Hyper Combo";
		} else if (!this.IsUpgradeVisible("unlock_overdrive")) {
			return "Reach a Hyper Combo of 1000";
		} else if (!this.IsUnlocked("unlock_overdrive")) {
			return "Unlock Overdrive";
		} else if (!this.IsUnlocked("unlock_opal_balls")) {
			return "Unlock Opal Balls";
		} else if (!this.IsUpgradeVisible("unlock_beach_balls")) {
			return "Upgrade Combo Timeout to 5 seconds";
		} else if (
			!this.IsUnlocked("unlock_beach_balls") ||
			!this.IsUnlocked("unlock_rubberband_balls")
		) {
			return "Unlock Beach Balls and Rubber Band Balls";
		} else if (
			!this.IsMaxed("ruby_ball_value_percent") ||
			!this.IsMaxed("emerald_ball_value_percent") ||
			!this.IsMaxed("sapphire_ball_value_percent")
		) {
			return "100% Ruby Ball Value, 100% Emerald Ball Value, or 500% Sapphire Ball Value. Each one reveals a different upgrade when maxed.";
		} else if (!this.IsUpgradeVisible("overdrive_rainbow_ufo")) {
			return "Unlock all 3 Overdrive upgrades corresponding to Ruby, Sapphire, and Emerald Balls.";
		} else {
			return "None! Congratulations, you've reached the current endgame!"
		}
		/*
		} else if (!this.AreAllUpgradesMaxed()) {
			return "Max all upgrades that can be maxed. (Costs about " + FormatNumberShort(1.34e30) + " points total. Point Multiplier and Gold Ball Multiplier have no maximum.)";
		} else {
			return "None! Congratulations, you've maxed everything that can be maxed on this machine! Please check back for more updates in the future."
		}
		*/
	}
}
