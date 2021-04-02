const kPegColor = {
	inner: "#888",
	outer: "#000"
};

const kPrismatic = "PRISMATIC";

function GetPrismaticColor(start_time, time_now, cycle_duration, saturation) {
	const kCycleColors = [
		[0, 1, 0],
		[0, 1, 1],
		[0, 0, 1],
		[1, 0, 1],
		[1, 0, 0],
		[1, 1, 0]
	];
	let point_in_cycle =
		((time_now - start_time) * kCycleColors.length) / cycle_duration;
	let index_before = Math.floor(point_in_cycle);
	let fraction = point_in_cycle - index_before;
	let color_before = kCycleColors[index_before % kCycleColors.length];
	let color_after = kCycleColors[(index_before + 1) % kCycleColors.length];
	let color_rgb = [0, 0, 0];
	let lo = Math.round((1 - saturation) * 255);
	for (let i = 0; i < 3; ++i) {
		let channel_fraction =
			color_before[i] * (1 - fraction) + color_after[i] * fraction;
		color_rgb[i] = Math.round(lo + (255 - lo) * channel_fraction);
	}
	return color_rgb[0] + ", " + color_rgb[1] + ", " + color_rgb[2];
}

function DrawGradientCircle(ctx, pos, radius, inner_color, outer_color) {
	let inner_x = pos.x - radius / 3;
	let inner_y = pos.y - radius / 3;
	let inner_r = radius / 10;
	let outer_x = pos.x;
	let outer_y = pos.y;
	let outer_r = radius;
	let gradient = ctx.createRadialGradient(
		inner_x,
		inner_y,
		inner_r,
		outer_x,
		outer_y,
		outer_r
	);
	gradient.addColorStop(0, inner_color);
	gradient.addColorStop(1, outer_color);
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
	ctx.fill();
}

function DrawCircle(ctx, pos, radius, color) {
	console.assert(ctx);
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
	ctx.fill();
}

function GetCanvasLayer(layer_id) {
	return document.getElementById("canvas" + layer_id);
}

function GetCanvasContext(layer_id) {
	return GetCanvasLayer(layer_id).getContext("2d");
}

function ClearLayerAndReturnContext(layer_id) {
	let canvas = GetCanvasLayer(layer_id);
	let ctx = canvas.getContext("2d");
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (state.april_fools) {
		ctx.translate(canvas.width, canvas.height);
		ctx.rotate(Math.PI);
	}
	ctx.scale(state.canvas_scale, state.canvas_scale);
	return ctx;
}

function ResizeCanvas() {
	const aspect_ratio = state.board.width / state.board.height;
	const max_height = window.innerHeight - 25;
	const max_width = window.innerWidth - 300;
	state.canvas_scale = Math.min(
		max_height / state.board.height,
		max_width / state.board.width
	);
	const height = state.board.height * state.canvas_scale;
	const width = state.board.width * state.canvas_scale;
	let board_td = document.getElementById("board-td");
	board_td.width = width;
	board_td.height = height;
	let canvasLayers = document.getElementsByClassName("board");
	for (let i = 0; i < canvasLayers.length; ++i) {
		let canvas = canvasLayers[i];
		let aspect_ratio = state.board.width / state.board.height;
		canvas.height = height;
		canvas.width = width;
	}
	document.getElementById("outer_table").style.height = height + "px";

	const right_ui_width = window.innerWidth - width - 30;
	let right_ui_cells = document.getElementsByClassName("rightUI");
	for (let i = 0; i < right_ui_cells.length; ++i) {
		right_ui_cells[i].width = right_ui_width;
	}
}

function DrawPegs(positions, ctx) {
	for (let i = 0; i < positions.length; ++i) {
		DrawGradientCircle(
			ctx,
			positions[i],
			kPegRadius,
			kPegColor.inner,
			kPegColor.outer
		);
	}
}

function DrawPegsNoGradient(positions, ctx) {
	for (let i = 0; i < positions.length; ++i) {
		DrawCircle(ctx, positions[i], kPegRadius, kPegColor.outer);
	}
}

function DrawBalls(balls, inner_color, outer_color, ctx) {
	const kPrismaticSaturationOuter = 0.8;
	const kPrismaticSaturationInner = 0.25;
	const kPrismaticCycleDuration = 2000.0;
	const kPrismaticCycleShift = kPrismaticCycleDuration / 6.0;
	const time = Date.now();
	for (let i = 0; i < balls.length; ++i) {
		let inner_color_rgb = inner_color;
		if (inner_color == kPrismatic) {
			inner_color_rgb =
				"rgb(" +
				GetPrismaticColor(
					balls[i].start_time,
					time + kPrismaticCycleShift,
					kPrismaticCycleDuration,
					/*saturation=*/ kPrismaticSaturationInner
				) +
				")";
		}
		let outer_color_rgb = outer_color;
		if (outer_color == kPrismatic) {
			outer_color_rgb =
				"rgb(" +
				GetPrismaticColor(
					balls[i].start_time,
					time,
					kPrismaticCycleDuration,
					/*saturation=*/ kPrismaticSaturationOuter
				) +
				")";
		}
		DrawGradientCircle(
			ctx,
			balls[i].pos,
			kBallRadius,
			inner_color_rgb,
			outer_color_rgb
		);
	}
}

function DrawBallsNoGradient(balls, color, ctx) {
	const kPrismaticSaturation = 0.8;
	const kPrismaticCycleDuration = 2000.0;
	const time = Date.now();
	for (let i = 0; i < balls.length; ++i) {
		let color_rgb = color;
		if (color == kPrismatic) {
			color_rgb =
				"rgb(" +
				GetPrismaticColor(
					balls[i].start_time,
					time,
					kPrismaticCycleDuration,
					/*saturation=*/ kPrismaticSaturation
				) +
				")";
		}
		DrawCircle(ctx, balls[i].pos, kBallRadius, color_rgb);
	}
}

function DrawTargets(target_sets, ctx) {
	let font_size = 8;
	for (let i = 0; i < target_sets.length; ++i) {
		const targets = target_sets[i].targets;
		for (let j = 0; j < targets.length; ++j) {
			const target = targets[j];
			if (!target.active) {
				continue;
			}
			const pos = target.pos;
			ctx.fillStyle = target.color;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, target.draw_radius, 0, 2 * Math.PI);
			ctx.fill();

			ctx.textAlign = "center";
			ctx.fillStyle = "#000";
			ctx.font = font_size + "px sans-serif";
			let text_width = target.draw_radius * 1.5;
			ctx.fillText(target.text, pos.x, pos.y + font_size / 3, text_width);
		}
	}
}

function DrawScoreText(score_text, font_size, duration, rise, ctx) {
	const kPrismaticSaturation = 0.8;
	let next_index = 0;
	const time = Date.now();
	for (let i = 0; i < score_text.length; ++i) {
		let curr_text = score_text[i];
		let elapsed = time - curr_text.start_time;
		if (elapsed > duration) {
			continue;
		}
		let fraction = elapsed / duration;
		let color_rgb = curr_text.color_rgb;
		if (color_rgb == kPrismatic) {
			color_rgb = GetPrismaticColor(
				curr_text.start_time,
				time,
				duration / 2,
				/*saturation=*/ kPrismaticSaturation
			);
		}
		ctx.textAlign = "center";
		ctx.font = "bold " + font_size + "px sans-serif";
		ctx.fillStyle = "rgba(" + color_rgb + ", " + (1 - fraction) + ")";
		ctx.fillText(
			curr_text.text,
			curr_text.pos.x,
			curr_text.pos.y - fraction * rise
		);

		if (next_index != i) {
			score_text[next_index] = score_text[i];
		}
		++next_index;
	}
	score_text.length = next_index;
}

function DrawRipples(ripples, duration, expand, ctx) {
	const kPrismaticSaturation = 0.8;
	let next_index = 0;
	const time = Date.now();
	ctx.lineWidth = "1px";
	for (let i = 0; i < ripples.length; ++i) {
		let curr_ripples = ripples[i];
		let elapsed = time - curr_ripples.start_time;
		if (elapsed > duration) {
			continue;
		}
		let fraction = elapsed / duration;
		let color_rgb = curr_ripples.color_rgb;
		if (color_rgb == kPrismatic) {
			color_rgb = GetPrismaticColor(
				curr_ripples.start_time,
				time,
				duration / 2,
				/*saturation=*/ kPrismaticSaturation
			);
		}
		let radius = curr_ripples.start_radius + expand * fraction;
		ctx.strokeStyle = "rgba(" + color_rgb + ", " + (1 - fraction) + ")";
		ctx.beginPath();
		ctx.arc(curr_ripples.pos.x, curr_ripples.pos.y, radius, 0, 2 * Math.PI);
		ctx.stroke();
		if (next_index != i) {
			ripples[next_index] = ripples[i];
		}
		++next_index;
	}
	ripples.length = next_index;
}

function DrawAutoDropPosition(pos, cooldown, ctx) {
	if (!pos) {
		return;
	}
	const kColor = "#00f";
	let font_size = 6;
	let center_x = pos.x;
	let center_y = pos.y;
	let radius = kBallRadius;

	ctx.textAlign = "center";
	ctx.fillStyle = kColor;
	ctx.font = font_size + "px sans-serif";
	let text_width = radius * 1.5;
	ctx.fillText("Auto", center_x, center_y + font_size / 3, text_width);

	if (cooldown > 0.0) {
		ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
		ctx.beginPath();
		ctx.moveTo(center_x, center_y);
		ctx.arc(
			center_x,
			center_y,
			kBallRadius,
			-Math.PI / 2,
			cooldown * 2 * Math.PI - Math.PI / 2
		);
		ctx.lineTo(center_x, center_y);
		ctx.fill();
	}

	ctx.strokeStyle = kColor;
	ctx.beginPath();
	ctx.arc(center_x, center_y, kBallRadius, 0, 2 * Math.PI);
	ctx.stroke();
}

const kSpaceHeight = 50;
const kWheelWidth = 250;

function DrawWheelSpace(space, is_active, left_x, top_y, ctx) {
	const kTextWidth = 150;
	const kFontSize = 20;
	const kFont = "bold " + kFontSize + "px sans-serif";
	ctx.fillStyle = is_active ? space.active_color : space.inactive_color;
	ctx.fillRect(left_x, top_y, kWheelWidth, kSpaceHeight);

	let center_x = left_x + kWheelWidth / 2.0;
	let center_y = top_y + kSpaceHeight / 2.0;

	ctx.textAlign = "center";
	ctx.fillStyle = "#000";
	ctx.font = kFont;
	ctx.fillText(space.text, center_x, center_y + kFontSize / 3, kTextWidth);
}

function DrawWheel(wheel) {
	let canvas = GetCanvasLayer("BonusWheel");
	let ctx = canvas.getContext("2d");
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let center_y = canvas.height / 2;

	// Draw wheel
	let wheel_left_x = (canvas.width - kWheelWidth) / 2;
	let space_pos = wheel.pos * wheel.spaces.length;
	let space_id = Math.floor(space_pos);
	let pos_in_space = space_pos - space_id;
	for (let offset = -2; offset <= 2; ++offset) {
		let curr_space_y =
			(offset - 1 + pos_in_space) * kSpaceHeight + center_y;
		let curr_space = wheel.SpaceAt(space_id - offset);
		DrawWheelSpace(
			curr_space,
			/*is_active=*/ offset == 0,
			wheel_left_x,
			curr_space_y,
			ctx
		);
	}

	// Draw arrows
	const kArrowHeight = 50;
	let arrow_width = (Math.sqrt(3) * kArrowHeight) / 2;
	let y1 = (canvas.height - kArrowHeight) / 2;
	let y2 = canvas.height - y1;
	ctx.fillStyle = "#F00";

	ctx.beginPath();
	ctx.moveTo(0, y1);
	ctx.lineTo(0, y2);
	ctx.lineTo(arrow_width, center_y);
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(canvas.width, y1);
	ctx.lineTo(canvas.width, y2);
	ctx.lineTo(canvas.width - arrow_width, center_y);
	ctx.fill();

	if (state.wheel_popup_text.length > 0) {
		DrawScoreText(
			state.wheel_popup_text,
			/*font_size=*/ 18,
			/*duration=*/ 2000.0,
			/*rise=*/ 50.0,
			ctx
		);
	}
}

function Draw(state) {
	// Layer 0: Drop Zone
	const can_drop =
		CanDrop(state) ||
		(AutoDropOn() && state.auto_drop_cooldown < kMinCooldownToDraw);
	if (state.redraw_all || state.last_drawn.can_drop != can_drop) {
		let drop_zone_elem = document.getElementById("drop_zone");
		if (drop_zone_elem.disabled == can_drop) {
			drop_zone_elem.disabled = !can_drop;
		}
		if (state.redraw_all) {
			const kLeftOffset = 5;
			const kTopOffset = 5;
			let width_px = (max_drop_x - min_drop_x) * state.canvas_scale;
			let height_px = max_drop_y * state.canvas_scale;
			drop_zone_elem.style.width = width_px + "px";
			drop_zone_elem.style.height = height_px + "px";
			if (state.april_fools) {
				let top_px = state.board.height * state.canvas_scale - height_px
				let left_px = kLeftOffset + (state.board.width - max_drop_x) * state.canvas_scale;
				drop_zone_elem.style.top = top_px + "px";
				drop_zone_elem.style.left = left_px + "px";
			} else {
				let left_px = kLeftOffset + min_drop_x * state.canvas_scale;
				drop_zone_elem.style.top = kTopOffset + "px";
				drop_zone_elem.style.left = left_px + "px";
			}
		}
		state.last_drawn.can_drop = can_drop;
	}
	// Layer 1: Board
	if (state.redraw_all) {
		let ctx = ClearLayerAndReturnContext(1);
		if (state.save_file.options.quality <= 1) {
			DrawPegs(state.board.pegs, ctx);
		} else {
			DrawPegsNoGradient(state.board.pegs, ctx);
		}
	}
	// Layer 2: Balls
	let total_balls = TotalBalls(state);
	if (state.redraw_all || total_balls > 0 || state.last_drawn.num_balls > 0) {
		let ctx = ClearLayerAndReturnContext(2);
		for (let i = 0; i < state.balls_by_type.length; ++i) {
			let opacity_id = kBallTypes[i].name + "_ball_opacity";
			let opacity_pct = state.save_file.options[opacity_id];
			if (opacity_pct <= 0) {
				continue;
			}
			ctx.globalAlpha = opacity_pct / 100.0;
			if (state.save_file.options.quality == 0) {
				DrawBalls(
					state.balls_by_type[i],
					kBallTypes[i].inner_color,
					kBallTypes[i].outer_color,
					ctx
				);
			} else {
				DrawBallsNoGradient(
					state.balls_by_type[i],
					kBallTypes[i].outer_color,
					ctx
				);
			}
		}
		state.last_drawn.num_balls = total_balls;
	}
	// Layer 3: Targets
	if (state.redraw_all || state.redraw_targets) {
		let ctx = ClearLayerAndReturnContext(3);
		DrawTargets(state.target_sets, ctx);
		state.redraw_targets = false;
	}
	// Layer 4: Auto-Drop position
	if (state.redraw_all || state.redraw_auto_drop) {
		let ctx = ClearLayerAndReturnContext(4);
		if (AutoDropOn()) {
			let cooldown = 0;
			if (state.auto_drop_cooldown >= kMinCooldownToDraw) {
				cooldown =
					state.auto_drop_cooldown_left / state.auto_drop_cooldown;
			}
			DrawAutoDropPosition(state.save_file.auto_drop_pos, cooldown, ctx);
		}
		state.redraw_auto_drop = false;
	}
	// Layer 5: Score text
	if (
		state.redraw_all ||
		state.score_text.length > 0 ||
		state.last_drawn.num_score_text > 0
	) {
		let ctx = ClearLayerAndReturnContext(5);
		DrawScoreText(
			state.score_text,
			/*font_size=*/ 8,
			/*duration=*/ 1000.0,
			/*rise=*/ 15.0,
			ctx
		);
		state.last_drawn.num_score_texts = state.score_text.length;
	}
	// Layer 6: Ripple effects
	if (
		state.redraw_all ||
		state.ripples.length > 0 ||
		state.last_drawn.num_ripples > 0
	) {
		let ctx = ClearLayerAndReturnContext(6);
		DrawRipples(state.ripples, /*duration=*/ 1000.0, /*expand=*/ 20.0, ctx);
		state.last_drawn.num_ripples = state.ripples.length;
	}

	// Bonus wheel
	if (
		state.redraw_all ||
		state.redraw_wheel ||
		state.wheel_popup_text.length > 0 ||
		state.last_drawn.num_wheel_popup_texts > 0
	) {
		state.redraw_wheel = false;
		DrawWheel(state.bonus_wheel);
		state.last_drawn.num_wheel_popup_texts = state.wheel_popup_text.length;
	}

	if (state.redraw_all) {
		UpdateAutoSaveInterval();
		UpdateOptionsButtons();
		UpdateSpinCounter();
	}

	UpdateNotifications(state);

	state.redraw_all = false;
}
