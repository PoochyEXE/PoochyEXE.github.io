const kPegRadius = 1.5;
const kBallRadius = 5.5;

const kCellSize = 8.0;

class Target {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, text, id, active }) {
		this.machine = machine;
		this.pos = pos;
		this.draw_radius = draw_radius;
		this.hitbox_radius = hitbox_radius;
		this.hitbox_radius_sqr = hitbox_radius * hitbox_radius;
		this.color = color;
		this.text = text;
		this.id = id;
		this.active = active;
	}

	OnHit(ball) {
		console.error("Not implemented!");
	}

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

			this.OnHit(ball);
			ball.last_hit = this.id;
		}
	}
}

class ScoreTarget extends Target {
	constructor({ machine, pos, draw_radius, hitbox_radius, color, id, active, value }) {
		super({
			machine,
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
		this.machine.AwardPoints(this.value, ball);
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
}

class PegBoard {
	constructor(width, height, pegs, drop_zones) {
		this.width = width;
		this.height = height;
		this.pegs = pegs;
		this.drop_zones = drop_zones;
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
	
	CanDropAt(pos) {
		for (let i = 0; i < this.drop_zones.length; ++i) {
			if (this.drop_zones[i].Contains(pos)) {
				return true;
			}
		}
		return false;
	}
}
