class Ball {
	constructor(x, y, dx, dy, ball_type_index, rotation, omega) {
		this.pos = new Point(x, y);
		this.vel = new Vector(dx, dy);
		this.Reset(x, y, dx, dy, ball_type_index, rotation, omega);
	}

	Reset(x, y, dx, dy, ball_type_index, rotation, omega) {
		this.pos.Reset(x, y);
		this.vel.Reset(dx, dy);
		this.ball_type_index = ball_type_index;
		this.active = true;
		this.last_hit = null;
		this.last_hit_time = null;
		this.combo = 0;
		this.combo_bonus = 0;
		this.start_time = state.current_time;
		this.rotation = rotation;  // Counterclockwise in radians
		this.omega = omega;  // Angular velocity in radians/second
		this.total_rotations = 0.0;  // Total radians rotated.
		this.score_targets_hit = 0;
		this.bumpers_hit = 0;
		this.bounces = 0;
	}
}

function CreateBallWithNoise(x, y, dx, dy, ball_type_index) {
	let dNoise = SampleGaussianNoise(0.0, 20.0);
	let angleNoise = SampleGaussianNoise(0.0, 0.1);
	return object_pool.NewBall(
		x, y, dx + dNoise.x, dy + dNoise.y, ball_type_index, angleNoise.x, angleNoise.y
	);
}

function DropBall(x, y, ball_type_index) {
	let machine = ActiveMachine(state);
	let stats = machine.GetSaveData().stats;
	if (!ball_type_index) {
		ball_type_index = machine.RollBallType();
	}
	const ball_type = machine.BallTypes()[ball_type_index];
	state.balls_by_type[ball_type_index].push(
		CreateBallWithNoise(x, y, 0.0, 0.0, ball_type_index)
	);
	++stats.balls_dropped;
	++stats[ball_type.name + "_balls"];
	state.last_ball_drop = state.current_time;
	if (ball_type.ripple_color_rgb) {
		state.ripples.push(
			object_pool.NewRipple(
				x,
				y,
				ball_type.ripple_color_rgb,
				kBallRadius
			)
		);
	}
	state.update_stats_panel = true;
}

function TotalBalls(state) {
	let total = 0;
	for (let i = 0; i < state.balls_by_type.length; ++i) {
		total += state.balls_by_type[i].length;
	}
	return total;
}
