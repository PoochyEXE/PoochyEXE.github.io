var kFPS = 30;
var kAccel = 500;
var kCollisionElasticity = 0.3;
var kBeachBallAccel = 100;
var kBeachBallCollisionElasticity = 0.7;

function UpdateBalls(balls, board, target_sets, is_beach_ball) {
	const kEpsilon = 1e-3 / kFPS;
	const k2Pi = Math.PI * 2;
	const kPegSearchRadius = kPegRadius + kBallRadius;
	let accel = is_beach_ball ? kBeachBallAccel : kAccel;
	let collision_elasticity =
		is_beach_ball ? kBeachBallCollisionElasticity : kCollisionElasticity;
	for (let b = 0; b < balls.length; ++b) {
		let time_to_sim = 1.0 / kFPS;
		let pos = balls[b].pos;
		let vel = balls[b].vel;
		let omega = balls[b].omega;

		for (let iter = 0; iter < 10 && time_to_sim > kEpsilon; ++iter) {
			let new_pos = pos.Add(vel.Multiply(time_to_sim));
			let collide_peg = board.FindNearestPeg(new_pos, kPegSearchRadius);
			if (collide_peg == null) {
				pos = new_pos;
				break;
			}
			let time_step = time_to_sim;
			while (time_step > kEpsilon) {
				time_step /= 2;
				new_pos = pos.Add(vel.Multiply(time_step));
				let collide_peg = board.FindNearestPeg(
					new_pos,
					kPegSearchRadius
				);
				if (collide_peg == null) {
					pos = new_pos;
					time_to_sim -= time_step;
				}
			}
			new_pos = pos.Add(vel.Multiply(time_step));
			collide_peg = board.FindNearestPeg(new_pos, kPegSearchRadius);
			if (collide_peg == null) {
				time_to_sim -= time_step;
				pos = new_pos;
			} else {
				let delta = pos.DeltaToPoint(collide_peg);
				let perp_delta = delta.Perpendicular().Normalize();
				let perp_vel = vel.ProjectionOnto(perp_delta);
				let parallel_vel = vel.Subtract(perp_vel);
				vel = vel.Add(parallel_vel.Multiply(-1 - collision_elasticity));
				omega *= collision_elasticity;
				omega += perp_vel.DotProduct(perp_delta) / kBallRadius;
				
				// In the extremely unlikely event a ball is balanced perfectly
				// on top of a peg, give it a tiny nudge.
				if (Math.abs(delta.x) < 1e-10 && Math.abs(vel.x) < 1e-10) {
					console.log(
						"Ball at " + pos.DebugStr() +
						" stuck perfectly balanced on peg at " +
						collide_peg.DebugStr() + " -- giving it a tiny nudge."
					);
					let noise = SampleGaussianNoise(0, 1e-5);
					vel.x += noise.x;
					vel.y += noise.y;
				}
			}
		}

		balls[b].pos = pos;
		balls[b].vel = vel;
		balls[b].omega = omega;
		balls[b].vel.y += accel / kFPS;
		balls[b].rotation += omega / kFPS;
		balls[b].rotation %= k2Pi;
		balls[b].total_rotations += Math.abs(omega) / kFPS;

		for (let s = 0; s < target_sets.length; ++s) {
			let t_set = target_sets[s];
			if (
				pos.x < t_set.min_x ||
				pos.x > t_set.max_x ||
				pos.y < t_set.min_y ||
				pos.y > t_set.max_y
			) {
				continue;
			}
			for (let t = 0; t < t_set.targets.length; ++t) {
				t_set.targets[t].CheckForHit(balls[b]);
			}
		}
	}

	// Remove balls that are inactive or have fallen outside the board.
	var next_index = 0;
	for (let b = 0; b < balls.length; ++b) {
		if (!balls[b].active) {
			continue;
		}
		let pos = balls[b].pos;
		if (pos.x < 0 || pos.x > board.width || pos.y > board.height) {
			continue;
		}
		if (next_index != b) {
			balls[next_index] = balls[b];
		}
		++next_index;
	}
	if (next_index < balls.length) {
		balls.length = next_index;
	}
}
