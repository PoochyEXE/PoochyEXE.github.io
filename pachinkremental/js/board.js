const kPegRadius = 1.5;
const kBallRadius = 5.5;

const kCellSize = 8.0;

class Target {
	constructor({ pos, draw_radius, hitbox_radius, color, text, id, active }) {
		this.pos = pos;
		this.draw_radius = draw_radius;
		this.hitbox_radius = hitbox_radius;
		this.hitbox_radius_sqr = hitbox_radius * hitbox_radius;
		this.color = color;
		this.text = text;
		this.id = id;
		this.active = active;
	}

	OnHit() {
		console.log("Not implemented!");
	}

	CheckForHit(ball) {
		if (!this.active) {
			return;
		}
		if (this.id == ball.last_hit) {
			return;
		}
		if (this.pos.DistanceSqrToPoint(ball.pos) < this.hitbox_radius_sqr) {
			if (state.save_file.stats.target_hits[this.id]) {
				++state.save_file.stats.target_hits[this.id];
			} else {
				state.save_file.stats.target_hits[this.id] = 1;
			}

			this.OnHit(ball);
			ball.last_hit = this.id;
		}
	}
}

function AwardPoints(base_value, ball) {
	var total_value = base_value;
	var color_rgb = "0,128,0";
	if (IsScoreBuffActive()) {
		total_value *= state.save_file.score_buff_multiplier;
	}
	let popup_text_level = 0;
	if (ball.ball_type_index != kBallTypeIDs.NORMAL) {
		if (HasEightBallSpecial(ball.ball_type_index)) {
			popup_text_level = 3;
			color_rgb = k8BallHighlightColor;
			let exponent =
				(GetUpgradeLevel("eight_ball_score_exponent") > 0) ?
				state.eight_ball_score_exponent :
				state.emerald_ball_exponent;
			total_value *= Math.pow(state.special_ball_multiplier, exponent);
			total_value *= 8;
			if (ball.ball_type_index == kBallTypeIDs.BEACH_BALL) {
				total_value *= 2;
				color_rgb = kPrismatic;
			}
		} else if (HasEmeraldSpecial(ball.ball_type_index)) {
			total_value *= Math.pow(
				state.special_ball_multiplier, state.emerald_ball_exponent
			);
			popup_text_level = 2;
			color_rgb = "0,192,0";
		} else {
			popup_text_level = 1;
			total_value *= state.special_ball_multiplier;
			color_rgb = "170,143,0";
		}
	}
	AddScore(total_value);
	MaybeAddScoreText({
		level: popup_text_level,
		text: `+${FormatNumberShort(total_value)}`,
		pos: ball.pos,
		color_rgb
	});
}

class ScoreTarget extends Target {
	constructor({ pos, draw_radius, hitbox_radius, color, id, active, value }) {
		super({
			pos,
			draw_radius,
			hitbox_radius,
			color,
			text: FormatNumberShort(value),
			id,
			active
		});
		this.value = value;
	}

	OnHit(ball) {
		ball.active = false;
		AwardPoints(this.value, ball);
		if (this.id == 4) {
			OnCenterSlotHit(ball);
		}
	}

	SetValue(new_value) {
		this.value = new_value;
		this.text = FormatNumberShort(new_value);
	}
}

function AwardSpins(ball, text_pos) {
	if (HasSapphireSpecial(ball.ball_type_index)) {
		let exponent = state.sapphire_ball_exponent;
		if (
			HasEightBallSpecial(ball.ball_type_index) &&
			GetUpgradeLevel("eight_ball_spin_exponent") > 0
		) {
			exponent = state.eight_ball_spin_exponent;
		}
		let value = Math.pow(state.special_ball_multiplier, exponent);
		let color_rgb = "0,0,255"
		let score_text_level = 2;
		if (
			HasAmethystSpecial(ball.ball_type_index) &&
			IsUnlocked("amethyst_synergy") &&
			IsScoreBuffActive()
		) {
			value *= state.save_file.score_buff_multiplier;
			color_rgb = "255,0,255"
		}
		if (ball.ball_type_index == kBallTypeIDs.EIGHT_BALL) {
			score_text_level = 3;
			value *= 8;
			color_rgb = k8BallHighlightColor;
		}
		if (ball.ball_type_index == kBallTypeIDs.BEACH_BALL) {
			score_text_level = 3;
			value *= 16;
			color_rgb = kPrismatic;
		}
		value = Math.floor(value);
		state.save_file.spins += value;
		UpdateSpinCounter();
		MaybeAddScoreText({
			level: score_text_level,
			text: `+${FormatNumberShort(value)} Spins`,
			pos: text_pos,
			color_rgb: color_rgb
		});
	} else {
		++state.save_file.spins;
		UpdateSpinCounter();
		MaybeAddScoreText({
			level: 0,
			text: "+1 Spin",
			pos: text_pos,
			color_rgb: "0,170,0"
		});
	}
}

class SpinTarget extends Target {
	constructor({ pos, draw_radius, hitbox_radius, color, id }) {
		super({
			pos,
			draw_radius,
			hitbox_radius,
			color,
			text: "Spin",
			id
		});
	}

	OnHit(ball) {
		let text_pos = new Point(ball.pos.x, ball.pos.y);
		if (
			HasTurquoiseSpecial(ball.ball_type_index) &&
			IsUnlocked("turquoise_synergy")
		) {
			AwardPoints(GetSlotValue(4), ball);
			text_pos.y -= 10;
		}
		AwardSpins(ball, text_pos);
	}
}

class TargetSet {
	constructor(targets) {
		this.targets = targets;
		let radius = targets[0].hitbox_radius;
		this.min_x = targets[0].pos.x - radius;
		this.max_x = targets[0].pos.x + radius;
		this.min_y = targets[0].pos.y - radius;
		this.max_y = targets[0].pos.y + radius;
		for (let i = 1; i < targets.length; ++i) {
			let radius = targets[i].hitbox_radius;
			this.min_x = Math.min(this.min_x, targets[i].pos.x - radius);
			this.max_x = Math.max(this.max_x, targets[i].pos.x + radius);
			this.min_y = Math.min(this.min_y, targets[i].pos.y - radius);
			this.max_y = Math.max(this.max_y, targets[i].pos.y + radius);
		}
	}
}

class PegBoard {
	constructor(width, height, pegs) {
		this.width = width;
		this.height = height;
		this.pegs = pegs;
		this.grid_cols = Math.ceil(width / kCellSize);
		this.grid_rows = Math.ceil(height / kCellSize);
		this.cache = [...Array(this.grid_rows * this.grid_cols)].map(_ =>
			Array(0)
		);
		for (let i = 0; i < pegs.length; ++i) {
			const peg = pegs[i];
			if (peg.x < 0 || peg.x > width || peg.y < 0 || peg.y > height) {
				console.log(
					`Skipping out-of-bounds peg at ${peg.DebugStr()}`
				);
				continue;
			}
			const row = Math.floor(peg.y / kCellSize);
			const col = Math.floor(peg.x / kCellSize);
			this.GetCacheCell(row, col).push(peg);
		}
	}

	GetCacheCell(row, col) {
		return this.cache[row * this.grid_cols + col];
	}

	FindPegsWithinRadius(pt, radius) {
		const rad_sqr = radius * radius;
		let result = Array(0);
		let min_row = Math.floor((pt.y - radius) / kCellSize);
		if (min_row < 0) min_row = 0;
		let max_row = Math.floor((pt.y + radius) / kCellSize);
		if (max_row >= this.grid_rows) max_row = this.grid_rows - 1;
		let min_col = Math.floor((pt.x - radius) / kCellSize);
		if (min_col < 0) min_col = 0;
		let max_col = Math.floor((pt.x + radius) / kCellSize);
		if (max_col >= this.grid_cols) max_col = this.grid_cols - 1;
		for (let row = min_row; row <= max_row; row++) {
			for (let col = min_col; col <= max_col; col++) {
				let cell = this.GetCacheCell(row, col);
				for (let i = 0; i < cell.length; ++i) {
					if (cell[i].DistanceSqrToPoint(pt) < rad_sqr) {
						result.push(cell[i]);
					}
				}
			}
		}
		return result;
	}

	FindNearestPeg(pt, max_radius) {
		let result = null;
		let result_dist_sqr = max_radius * max_radius;
		let min_row = Math.floor((pt.y - max_radius) / kCellSize);
		if (min_row < 0) min_row = 0;
		let max_row = Math.floor((pt.y + max_radius) / kCellSize);
		if (max_row >= this.grid_rows) max_row = this.grid_rows - 1;
		let min_col = Math.floor((pt.x - max_radius) / kCellSize);
		if (min_col < 0) min_col = 0;
		let max_col = Math.floor((pt.x + max_radius) / kCellSize);
		if (max_col >= this.grid_cols) max_col = this.grid_cols - 1;
		for (let row = min_row; row <= max_row; row++) {
			for (let col = min_col; col <= max_col; col++) {
				let cell = this.GetCacheCell(row, col);
				for (let i = 0; i < cell.length; ++i) {
					let dist_sqr = cell[i].DistanceSqrToPoint(pt);
					if (dist_sqr < result_dist_sqr) {
						result = cell[i];
						result_dist_sqr = dist_sqr;
					}
				}
			}
		}
		return result;
	}
}

const kHorizontalSpacing = 18;
const kWallSpacing = 4;
const kHalfWallSpace = kWallSpacing / 2;
const kVerticalSpacing = (Math.sqrt(3) * kHorizontalSpacing) / 2;
const kColumns = 9;
const kRows = 13;
const kBottomSlotRows = 5;
const kWidth = kHorizontalSpacing * kColumns + kWallSpacing;
const kHeight = 256;
const kBaseSlotValues = [20, 100, 200, 1, 250, 1, 200, 100, 20];

function DefaultBoard() {
	let pegs = Array(0);
	for (
		let y = kHeight - kHalfWallSpace;
		y >= kHalfWallSpace;
		y -= kWallSpacing
	) {
		pegs.push(new Point(kHalfWallSpace, y));
		pegs.push(new Point(kWidth - kHalfWallSpace, y));
	}
	var y = kHeight - kHalfWallSpace;
	for (let col = 0; col < kColumns; ++col) {
		const prev_x = col * kHorizontalSpacing + kHalfWallSpace;
		const next_x = (col + 1) * kHorizontalSpacing + kHalfWallSpace;
		const delta_x = next_x - prev_x;
		const mid_pegs = Math.floor(delta_x / kWallSpacing);
		for (let subcol = 1; subcol <= mid_pegs; ++subcol) {
			const x = prev_x + (subcol * delta_x) / mid_pegs;
			pegs.push(new Point(x, y));
		}
	}
	y -= kWallSpacing;
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
	max_drop_y = y;
	min_drop_x = 10;
	max_drop_x = kWidth - 10;
	return new PegBoard(kWidth, kHeight, pegs);
}

function DefaultTargets() {
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
		bottom_targets.push(
			new ScoreTarget({
				pos,
				draw_radius: kDrawRadius,
				hitbox_radius: kHitboxRadius,
				color: kTargetColor,
				id: col,
				active: true,
				value
			})
		);
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
			pos: new Point(left_x, kSpinTargetY),
			draw_radius: kDrawRadius,
			hitbox_radius: kHitboxRadius,
			color: kSpinTargetColor,
			id: "spin_left"
		})
	);
	spin_targets.push(
		new SpinTarget({
			pos: new Point(center_x, kSpinTargetY),
			draw_radius: kDrawRadius,
			hitbox_radius: kHitboxRadius,
			color: kSpinTargetColor,
			id: "spin_center"
		})
	);
	spin_targets.push(
		new SpinTarget({
			pos: new Point(right_x, kSpinTargetY),
			draw_radius: kDrawRadius,
			hitbox_radius: kHitboxRadius,
			color: kSpinTargetColor,
			id: "spin_right"
		})
	);
	target_sets.push(new TargetSet(spin_targets));

	return target_sets;
}
