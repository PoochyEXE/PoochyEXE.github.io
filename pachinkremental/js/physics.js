const kFPS = 30;
const kPhysicsParams = {
	normal: {
		accel: 500,
		collision_elasticity: 0.3
	},
	beach_ball: {
		accel: 100,
		collision_elasticity: 0.7
	},
	rubber: {
		accel: 300,
		collision_elasticity: 0.85
	},
};

function UpdateBalls(balls, board, params) {
	const kEpsilon = 1e-3 / kFPS;
	const k2Pi = Math.PI * 2;
	const kPegSearchRadius = kPegRadius + kBallRadius;
	let new_pos = new Point(0, 0);
	for (let b = 0; b < balls.length; ++b) {
		let time_to_sim = 1.0 / kFPS;
		let pos = balls[b].pos;
		let vel = balls[b].vel;
		let omega = balls[b].omega;

		for (let iter = 0; iter < 10 && time_to_sim >= kEpsilon; ++iter) {
			let time_step = time_to_sim;
			let speed = vel.Magnitude();
			if (time_step * speed > 2.0 * kBallRadius) {
				time_step = Math.max(2.0 * kBallRadius / speed, kEpsilon);
			}
			new_pos.CopyFrom(pos);
			new_pos.MutateAddNTimes(vel, time_step);
			let collide_peg = board.FindNearestPeg(new_pos, kPegSearchRadius);
			if (collide_peg == null) {
				pos.CopyFrom(new_pos);
				time_to_sim -= time_step;
				continue;
			}
			while (time_step >= kEpsilon) {
				time_step /= 2;
				new_pos.CopyFrom(pos);
				new_pos.MutateAddNTimes(vel, time_step);
				let collide_peg = board.FindNearestPeg(
					new_pos,
					kPegSearchRadius
				);
				if (collide_peg == null) {
					pos.CopyFrom(new_pos);
					time_to_sim -= time_step;
				}
			}
			new_pos.CopyFrom(pos);
			new_pos.MutateAddNTimes(vel, time_step);
			collide_peg = board.FindNearestPeg(new_pos, kPegSearchRadius);
			if (collide_peg == null) {
				time_to_sim -= time_step;
				pos.CopyFrom(new_pos);
			} else {
				let delta = pos.DeltaToPoint(collide_peg);
				let perp_delta = delta.Perpendicular();
				perp_delta.MutateNormalize();
				let parallel_vel = vel.ProjectionOnto(delta);
				let perp_vel = vel.Subtract(parallel_vel);
				vel.MutateAddNTimes(parallel_vel, -1 - params.collision_elasticity);
				omega *= params.collision_elasticity;
				omega += perp_vel.DotProduct(perp_delta) / kBallRadius;
				++balls[b].bounces;

				// In the extremely unlikely event a ball is balanced perfectly
				// on top of a peg, give it a tiny nudge.
				if (Math.abs(delta.x) < 1e-10 && Math.abs(vel.x) < 1e-10) {
					console.log(
						"Ball at " + pos.DebugStr() +
						" stuck perfectly balanced on peg at " +
						collide_peg.DebugStr() + " -- giving it a tiny nudge."
					);
					vel.MutateAdd(SampleGaussianNoise(0, 1e-5));
				}
			}
		}

		// Invisible wall above the sides of the board to keep balls in play if they
		// bounce over the top corner pegs.
		if (pos.y < 0) {
			const min_x = kBallRadius;
			const max_x = board.width - kBallRadius;
			while (pos.x < min_x || pos.x > max_x) {
				vel.x = -1 * params.collision_elasticity * vel.x;
				if (pos.x < min_x) {
					pos.x += (1 + params.collision_elasticity) * (min_x - pos.x);
				} else if (pos.x > max_x) {
					pos.x -= (1 + params.collision_elasticity) * (pos.x - max_x);
				}
			}
		}

		balls[b].pos = pos;
		balls[b].vel = vel;
		balls[b].omega = omega;
		balls[b].vel.y += params.accel / kFPS;
		balls[b].rotation += omega / kFPS;
		balls[b].rotation %= k2Pi;
		balls[b].total_rotations += Math.abs(omega) / kFPS;

		for (let s = 0; s < board.target_sets.length; ++s) {
			board.target_sets[s].CheckForHit(balls[b]);
		}
		for (let s = 0; s < board.bumper_sets.length; ++s) {
			board.bumper_sets[s].CheckForHit(balls[b]);
		}
	}

	// Remove balls that are inactive or have fallen outside the board.
	for (let b = 0; b < balls.length; ++b) {
		if (!balls[b].active) {
			continue;
		}
		let pos = balls[b].pos;
		if (pos.x < 0 || pos.x > board.width || pos.y > board.height) {
			balls[b].active = false;
		}
	}
	var next_index = 0;
	for (let b = 0; b < balls.length; ++b) {
		if (!balls[b].active) {
			object_pool.ReleaseBall(balls[b]);
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
