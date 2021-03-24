const kPegRadius = 1.5;
const kBallRadius = 5.5;

const kCellSize = 8.0;

class Target {
	constructor(pos, draw_radius, hitbox_radius, color, text, id, active, on_hit) {
		this.pos = pos;
		this.draw_radius = draw_radius;
		this.hitbox_radius = hitbox_radius;
		this.hitbox_radius_sqr = hitbox_radius * hitbox_radius;
		this.color = color;
		this.text = text;
		this.id = id;
		this.active = active;
		this.on_hit = on_hit;
	}
	
	CheckForHit(ball) {
		if (!this.active) {
			return;
		}
		if (this.id == ball.last_hit) {
			return;
		}
		if (this.pos.DistanceSqrToPoint(ball.pos) < this.hitbox_radius_sqr) {
			this.on_hit(ball);
			ball.last_hit = this.id;
		}
	}
}

class ScoreTarget extends Target {
	constructor(pos, draw_radius, hitbox_radius, color, id, active, value) {
		super(pos, draw_radius, hitbox_radius, color, FormatNumberShort(value), id, active, null);
		this.on_hit = this.OnHit;
		this.value = value;
	}

	OnHit(ball) {
		ball.active = false;
		if (ball.is_gold) {
			let total_value = this.value * state.gold_ball_multiplier;
			state.save_file.stats.total_score += total_value;
			state.save_file.points += total_value;
			state.score_text.push(new RisingText("+" + FormatNumberShort(total_value), ball.pos, Date.now()));
		} else {
			state.save_file.stats.total_score += this.value;
			state.save_file.points += this.value;
			state.score_text.push(new RisingText("+" + this.text, ball.pos, Date.now()));
		}
		state.stats_updated = true;
		state.update_upgrade_buttons = true;
	}
	
	SetValue(new_value) {
		this.value = new_value;
		this.text = FormatNumberShort(new_value);
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
		this.cache = [...Array(this.grid_rows * this.grid_cols)].map(_ => Array(0))
		for (let i = 0; i < pegs.length; ++i) {
			const peg = pegs[i];
			if (peg.x < 0 || peg.x > width || peg.y < 0 || peg.y > height) {
				console.log("Skipping out-of-bounds peg at (" + peg.x + ", " + peg.y + ")");
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
