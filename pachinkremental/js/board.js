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

	HitboxBoundingBox() {
		return {
			x_lo: this.pos.x - this.hitbox_radius,
			x_hi: this.pos.x + this.hitbox_radius,
			y_lo: this.pos.y - this.hitbox_radius,
			y_hi: this.pos.y + this.hitbox_radius,
		};
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

		let min_x = targets[0].pos.x;
		let max_x = targets[0].pos.x;
		let min_y = targets[0].pos.y;
		let max_y = targets[0].pos.y;
		for (let i = 0; i < targets.length; ++i) {
			let bbox = targets[i].HitboxBoundingBox();
			min_x = Math.min(min_x, bbox.x_lo);
			max_x = Math.max(max_x, bbox.x_hi);
			min_y = Math.min(min_y, bbox.y_lo);
			max_y = Math.max(max_y, bbox.y_hi);
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
	constructor({ machine, pos, radius, strength, value, id, active }) {
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

		this.BounceBall(ball);
		
		ball.last_hit = null;
		++ball.bumpers_hit;
		state.redraw_bumpers = true;
		if (GetSetting("show_hit_rates")) {
			state.redraw_stats_overlay = true;
		}
	}
	
	BounceBall(ball) {
		const ball_physics_params =
			this.machine.BallTypes()[ball.ball_type_index].physics_params;
		let delta_norm = this.pos.DeltaToPoint(ball.pos);
		delta_norm.MutateNormalize();
		ball.vel.MutateMultiply(ball_physics_params.collision_elasticity);
		ball.vel.MutateAddNTimes(delta_norm, this.strength);
		ball.pos.CopyFrom(this.pos);
		ball.pos.MutateAddNTimes(delta_norm, this.hitbox_radius);

		const kNoiseSigma = 0.01;
		this.AddBounceNoise(ball, kNoiseSigma);
	}

	AddBounceNoise(ball, sigma) {
		if (sigma > 0) {
			let noise = SampleGaussianNoise(0, sigma);
			ball.vel.MutateAdd(noise);
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

class LongBumper extends Bumper {
	constructor({ machine, pos, length, thickness, normal_vector, strength, value, id, active, bounce_noise_sigma }) {
		super({
			machine,
			pos,
			radius: length / 2.0,
			strength,
			value,
			id,
			active
		});
		this.length = length;
		this.thickness = thickness;
		console.assert(thickness > 0);
		console.assert(length >= thickness * 2.0);
		this.thickness_sqr = thickness * thickness;
		this.normal_vector = normal_vector.Normalize();
		this.parallel_vector = this.normal_vector.Perpendicular();
		let endpoint_delta = this.parallel_vector.Multiply(length / 2.0 - thickness);
		this.left_endpoint = this.pos.Add(endpoint_delta);
		this.right_endpoint = this.pos.Add(endpoint_delta.Multiply(-1));
		this.strength = strength;
		if (bounce_noise_sigma) {
			this.bounce_noise_sigma = bounce_noise_sigma;
		} else {
			this.bounce_noise_sigma = 0;
		}
		this.hit_animation = 0;
		this.ResetText();
	}

	CheckForHit(ball) {
		if (!this.active) {
			return;
		}
		if (this.pos.DistanceSqrToPoint(ball.pos) >= this.hitbox_radius_sqr) {
			return;
		}
		let delta = this.pos.DeltaToPoint(ball.pos);
		let delta_normal = delta.DotProduct(this.normal_vector);
		if (Math.abs(delta_normal) >= this.thickness + kBallRadius) {
			return;
		}

		let save_file = this.machine.GetSaveData();
		if (save_file.stats.target_hits[this.id]) {
			++save_file.stats.target_hits[this.id];
		} else {
			save_file.stats.target_hits[this.id] = 1;
		}

		this.OnHit(ball);
	}

	BounceBall(ball) {
		const ball_physics_params =
			this.machine.BallTypes()[ball.ball_type_index].physics_params;

		let norm = ball.vel.ProjectionOnto(this.normal_vector);
		let speed_norm = norm.Magnitude();
		norm.MutateMultiply(-1.0);
		norm.MutateNormalize();
		ball.vel.MutateAddNTimes(norm, this.strength + speed_norm * (1.0 - ball_physics_params.collision_elasticity));

		let delta = this.pos.DeltaToPoint(ball.pos);
		let delta_norm = delta.DotProduct(this.normal_vector);
		let pos_adjust = this.thickness + kBallRadius - Math.abs(delta_norm);
		ball.pos.MutateAddNTimes(norm, pos_adjust);

		this.AddBounceNoise(ball, this.bounce_noise_sigma);
	}

	ResetText() {
		this.text = "";
	}

	SetValue(new_value) {
		this.value = new_value;
		this.ResetText();
	}

	HitboxBoundingBox() {
		const hitbox_delta = this.thickness + kBallRadius;
		return {
			x_lo: Math.min(this.left_endpoint.x, this.right_endpoint.x) - hitbox_delta,
			x_hi: Math.max(this.left_endpoint.x, this.right_endpoint.x) + hitbox_delta,
			y_lo: Math.min(this.left_endpoint.y, this.right_endpoint.y) - hitbox_delta,
			y_hi: Math.max(this.left_endpoint.y, this.right_endpoint.y) + hitbox_delta,
		};
	}
}

// TODO: Hit rate displays too far above the bumper, based on its length.
class HorizontalLongBumper extends LongBumper {
	constructor({ machine, pos, length, thickness, strength, value, id, active, bounce_noise_sigma }) {
		super({
			machine,
			pos,
			length,
			thickness,
			normal_vector: new Vector(0, 1),
			strength, value,
			id,
			active,
			bounce_noise_sigma
		});
	}

	CheckForHit(ball) {
		if (!this.active) {
			return;
		}
		if (Math.abs(ball.pos.y - this.pos.y) >= this.thickness + kBallRadius) {
			return;
		}
		if (Math.abs(ball.pos.x - this.pos.x) >= this.length + kBallRadius) {
			return;
		}

		let save_file = this.machine.GetSaveData();
		if (save_file.stats.target_hits[this.id]) {
			++save_file.stats.target_hits[this.id];
		} else {
			save_file.stats.target_hits[this.id] = 1;
		}

		this.OnHit(ball);
	}

	BounceBall(ball) {
		const ball_physics_params =
			this.machine.BallTypes()[ball.ball_type_index].physics_params;

		let dir_mult = ball.vel.y < 0 ? 1 : -1;
		ball.vel.y *= ball_physics_params.collision_elasticity;
		ball.vel.y += dir_mult * this.strength;
		ball.pos.y = this.pos.y + dir_mult * (this.thickness + kBallRadius);
		this.AddBounceNoise(ball, this.bounce_noise_sigma);
	}

	HitboxBoundingBox() {
		const hitbox_delta = this.thickness + kBallRadius;
		return {
			x_lo: this.left_endpoint.x - hitbox_delta,
			x_hi: this.right_endpoint.x + hitbox_delta,
			y_lo: this.pos.y - hitbox_delta,
			y_hi: this.pos.y + hitbox_delta,
		};
	}
}

class VerticalLongBumper extends LongBumper {
	constructor({ machine, pos, length, thickness, strength, value, id, active, bounce_noise_sigma }) {
		super({
			machine,
			pos,
			length,
			thickness,
			normal_vector: new Vector(1, 0),
			strength, value,
			id,
			active,
			bounce_noise_sigma
		});
	}

	CheckForHit(ball) {
		if (!this.active) {
			return;
		}
		if (Math.abs(ball.pos.x - this.pos.x) >= this.thickness + kBallRadius) {
			return;
		}
		if (Math.abs(ball.pos.y - this.pos.y) >= this.length + kBallRadius) {
			return;
		}

		let save_file = this.machine.GetSaveData();
		if (save_file.stats.target_hits[this.id]) {
			++save_file.stats.target_hits[this.id];
		} else {
			save_file.stats.target_hits[this.id] = 1;
		}

		this.OnHit(ball);
	}

	BounceBall(ball) {
		const ball_physics_params =
			this.machine.BallTypes()[ball.ball_type_index].physics_params;

		let dir_mult = ball.vel.x < 0 ? 1 : -1;
		ball.vel.x *= ball_physics_params.collision_elasticity;
		ball.vel.x += dir_mult * this.strength;
		ball.pos.x = this.pos.x + dir_mult * (this.thickness + kBallRadius);
		this.AddBounceNoise(ball, this.bounce_noise_sigma);
	}

	HitboxBoundingBox() {
		const hitbox_delta = this.thickness + kBallRadius;
		return {
			x_lo: this.pos.x - hitbox_delta,
			x_hi: this.pos.x + hitbox_delta,
			y_lo: this.right_endpoint.y + hitbox_delta,
			y_hi: this.left_endpoint.y - hitbox_delta,
		};
	}
}

class Whirlpool extends Target {
	constructor({ machine, pos, radius, strength, damping_ratio, max_speed, value, id, active }) {
		super({
			machine,
			pos,
			draw_radius: radius,
			hitbox_radius: radius + kBallRadius,
			color: kWhirlpoolColor,
			text: "",
			id,
			active,
			pass_through: true
		});
		this.strength = strength;
		this.damping_ratio = damping_ratio;
		this.max_speed = max_speed;
		this.max_speed_sqr = max_speed * max_speed;
		this.ResetText();
	}

	OnHit(ball) {
		let delta = ball.pos.DeltaToPoint(this.pos);
		let dist = delta.Magnitude();
		delta.MutateNormalize();
		ball.vel.MutateMultiply(this.damping_ratio);
		ball.vel.MutateAddNTimes(delta, this.strength / Math.max(1.0, dist));
		if (ball.vel.MagnitudeSqr() > this.max_speed_sqr) {
			ball.vel.MutateNormalize();
			ball.vel.MutateMultiply(this.max_speed);
		}
		ball.last_hit = null;
	}
}


class Portal extends Target {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, id, active }) {
		super({
			machine: machine,
			pos: pos,
			draw_radius: draw_radius,
			hitbox_radius: hitbox_radius ? hitbox_radius : draw_radius - kBallRadius,
			color: color,
			text: "",
			id: id,
			active: active,
			pass_through: true
		});
		this.dest_id = undefined;
		this.dest_pos = undefined;
		this.dest_delta = undefined;
	}
	
	SetDestination(dest) {
		this.dest_id = dest.id;
		this.dest_pos = dest.pos;
		this.dest_delta = this.pos.DeltaToPoint(dest.pos);
	}

	OnHit(ball) {
		if (!this.dest_id || !this.dest_pos || !this.dest_delta) {
			return;
		}
		ball.pos.MutateAdd(this.dest_delta);
		ball.last_hit = this.dest_id;

		if (GetSetting("show_hit_rates")) {
			state.redraw_stats_overlay = true;
		}
	}
}

class PegBoard {
	constructor({ width, height, pegs, drop_zones, target_sets, bumper_sets, long_bumper_sets, whirlpool_sets, portal_sets }) {
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
		if (long_bumper_sets) {
			this.long_bumper_sets = long_bumper_sets;
		} else {
			this.long_bumper_sets = Array(0);
		}
		if (whirlpool_sets) {
			this.whirlpool_sets = whirlpool_sets;
		} else {
			this.whirlpool_sets = Array(0);
		}
		if (portal_sets) {
			this.portal_sets = portal_sets;
		} else {
			this.portal_sets = Array(0);
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
