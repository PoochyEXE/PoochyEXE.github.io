const kPegRadius = 1.5;
const kBallRadius = 5.5;

const kCellSize = 8.0;

class Target {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, text, id, active, pass_through }) {
		this.machine = machine;
		this.pos = pos;
		this.draw_radius = draw_radius;
		this.hitbox_radius = hitbox_radius;
		this.hitbox_radius_sqr = hitbox_radius * hitbox_radius;
		this.color = color;
		this.text = text;
		this.id = id;
		this.active = active;
		this.pass_through = pass_through;
	}

	OnHit(ball) {
		console.error("Not implemented!");
	}

	ResetText() {}

	CheckForHit(ball) {
		if (!this.active) {
			return;
		}
		if (this.id == ball.last_hit) {
			return;
		}
		if (this.pos.DistanceSqrToPoint(ball.pos) < this.hitbox_radius_sqr) {
			let save_file = this.machine.GetSaveData();
			if (save_file.stats.target_hits[this.id]) {
				++save_file.stats.target_hits[this.id];
			} else {
				save_file.stats.target_hits[this.id] = 1;
			}

			ball.last_hit = this.id;
			this.OnHit(ball);
		}
	}
}

class ScoreTarget extends Target {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, id, active, value, pass_through }) {
		super({
			machine,
			pos,
			draw_radius,
			hitbox_radius,
			color,
			text: FormatNumberShort(value),
			id,
			active,
			pass_through
		});
		this.value = value;
	}

	OnHit(ball) {
		if (!this.pass_through) {
			ball.active = false;
		}
		this.machine.AwardPoints(this.value, ball);
		++ball.score_targets_hit;
		if (GetSetting("show_hit_rates")) {
			state.redraw_stats_overlay = true;
		}
	}

	ResetText() {
		this.text = FormatNumberShort(this.value);
	}

	SetValue(new_value) {
		this.value = new_value;
		this.ResetText();
	}
}

class TargetSet {
	constructor(targets) {
		this.targets = targets;

		let radius = targets[0].hitbox_radius;
		let min_x = targets[0].pos.x - radius;
		let max_x = targets[0].pos.x + radius;
		let min_y = targets[0].pos.y - radius;
		let max_y = targets[0].pos.y + radius;
		for (let i = 1; i < targets.length; ++i) {
			let radius = targets[i].hitbox_radius;
			min_x = Math.min(min_x, targets[i].pos.x - radius);
			max_x = Math.max(max_x, targets[i].pos.x + radius);
			min_y = Math.min(min_y, targets[i].pos.y - radius);
			max_y = Math.max(max_y, targets[i].pos.y + radius);
		}
		this.bounding_box = new Rectangle(min_x, max_x, min_y, max_y);
	}

	CheckForHit(ball) {
		if (this.bounding_box.Contains(ball.pos)) {
			for (let t = 0; t < this.targets.length; ++t) {
				this.targets[t].CheckForHit(ball);
			}
		}
	}
}

class Bumper extends Target {
	constructor({ machine, pos, radius, strength, color, value, id, active }) {
		super({
			machine,
			pos,
			draw_radius: radius,
			hitbox_radius: radius + kBallRadius,
			color: kBumperColor,
			text: "",
			id,
			active,
			pass_through: true
		});
		this.value = value;
		this.strength = strength;
		this.hit_animation = 0;
		this.ResetText();
	}

	OnHit(ball) {
		this.hit_animation = kBumperHitExpandSizes.length - 1;
		if (this.value) {
			this.machine.AwardPoints(this.value, ball);
		}
		const ball_physics_params =
			this.machine.BallTypes()[ball.ball_type_index].physics_params;

		const kNoiseSigma = 0.01;
		let noise = SampleGaussianNoise(0, kNoiseSigma);
		let delta_norm = this.pos.DeltaToPoint(ball.pos);
		delta_norm.MutateNormalize();
		ball.vel.MutateMultiply(ball_physics_params.collision_elasticity);
		ball.vel.MutateAdd(noise);
		ball.vel.MutateAddNTimes(delta_norm, this.strength);
		ball.pos.CopyFrom(this.pos);
		ball.pos.MutateAddNTimes(delta_norm, this.hitbox_radius);
		ball.last_hit = null;
		++ball.bumpers_hit;
		state.redraw_bumpers = true;
		if (GetSetting("show_hit_rates")) {
			state.redraw_stats_overlay = true;
		}
	}

	ResetText() {
		this.text = "";
		/*
		if (this.value) {
			this.text = FormatNumberShort(this.value);
		} else {
			this.text = "";
		}
		*/
	}

	SetValue(new_value) {
		this.value = new_value;
		this.ResetText();
	}
}

class PegBoard {
	constructor(width, height, pegs, drop_zones, target_sets, bumper_sets) {
		this.width = width;
		this.height = height;
		this.pegs = pegs;
		this.drop_zones = drop_zones;
		this.target_sets = target_sets;
		if (bumper_sets) {
			this.bumper_sets = bumper_sets;
		} else {
			this.bumper_sets = Array(0);
		}
		this.grid_cols = Math.ceil(width / kCellSize);
		this.grid_rows = Math.ceil(height / kCellSize);
		this.cache =
			[...Array(this.grid_rows * this.grid_cols)].map(_ => Array(0));
		for (let i = 0; i < pegs.length; ++i) {
			const peg = pegs[i];
			if (peg.x < 0 || peg.x > width || peg.y < 0 || peg.y > height) {
				console.log(`Skipping out-of-bounds peg at ${peg.DebugStr()}`);
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

	CanDropAt(pos) {
		for (let i = 0; i < this.drop_zones.length; ++i) {
			if (this.drop_zones[i].Contains(pos)) {
				return true;
			}
		}
		return false;
	}
}
