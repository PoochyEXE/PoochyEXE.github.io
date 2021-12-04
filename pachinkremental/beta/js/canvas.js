const kPegColor = {
	inner: "#888",
	outer: "#000"
};

const kPegColorDarkMode = {
	inner: "#AAA",
	outer: "#333"
};

const kPrismatic = "PRISMATIC";
const k8Ball = "8-BALL";
const k8BallHighlightColor = "246, 31,183";
const kBeachBall = "BEACH";
const kRubberBand = "RUBBER_BAND";
const kSpiral = "SPIRAL";
const kBumperColor = "BUMPER";

const kBumperHitExpandSizes = [0, 1, 2, 3, 2, 1];

const kNumBeachBallColors = 6;
// The order to shuffle beach ball colors into for rubber band balls.
const kRubberBandColorIndices = [4, 5, 1, 2, 3, 0];
// The order to draw the rubber bands.
const kRubberBandLayerOrder = [0, 2, 3, 1, 4, 5];

const kPrismaticLightnessDefault = 60;
const kPrismaticLightnessOuter = 60;
const kPrismaticLightnessInner = 87.5;
const kPrismaticLightnessRipple = 60;
const kPrismaticCycleDuration = 2000.0;

// Cache Beach Ball colors.
function InitBeachBallColors(lightness) {
	let colors = [];
	for (let i = 0; i < kNumBeachBallColors; ++i) {
		colors.push(GetPrismaticColor(i, kNumBeachBallColors, lightness, 1.0));
	}
	return colors;
}

const kBeachBallOuterColors = InitBeachBallColors(kPrismaticLightnessOuter);
const kBeachBallInnerColors = InitBeachBallColors(kPrismaticLightnessInner);

// Cache ripple colors for multi-color ripples.
function InitPrismaticRippleColorHSLs(lightness) {
	let colors = [];
	for (let i = 0; i < kNumBeachBallColors; ++i) {
		colors.push(GetPrismaticColorHSL(i, kNumBeachBallColors, lightness));
	}
	return colors;
}

const kPrismaticRippleColorHSLs =
	InitPrismaticRippleColorHSLs(kPrismaticLightnessRipple);

function GetPegColor() {
	if (GetSetting("dark_mode") && !state.april_fools) {
		return kPegColorDarkMode;
	} else {
		return kPegColor;
	}
}

function AddAlphaToColorRGB(color_rgb, alpha) {
	return "rgba(" + color_rgb + "," + alpha + ")";
}

function AddAlphaToColorHSL(color_hsl, alpha) {
	return "hsla(" + color_hsl + ", " + alpha + ")";
}

function GetPrismaticColorHSL(time_elapsed, cycle_duration, lightness) {
	const kHueShift = 120;
	let hue = (360 * time_elapsed / cycle_duration) + kHueShift;
	return hue + "deg,100%," + lightness + "%";
}

function GetPrismaticColor(time_elapsed, cycle_duration, lightness) {
	let color_hsl = GetPrismaticColorHSL(time_elapsed, cycle_duration, lightness);
	return "hsl(" + color_hsl + ")";
}

function GetPrismaticColorWithAlpha(time_elapsed, cycle_duration, lightness, alpha) {
	let color_hsl = GetPrismaticColorHSL(time_elapsed, cycle_duration, lightness);
	return AddAlphaToColorHSL(color_hsl, alpha);
}

function DrawGlow(pos, inner_color, outer_color, alpha, inner_radius, outer_radius, ctx) {
	let gradient = ctx.createRadialGradient(
		pos.x, pos.y, inner_radius, pos.x, pos.y, outer_radius
	);
	gradient.addColorStop(0, outer_color);
	gradient.addColorStop(1e-7, inner_color);
	gradient.addColorStop(1, outer_color);
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, outer_radius, 0, 2 * Math.PI);
	ctx.fill();
}

function DrawGlowRGB(pos, color_rgb, alpha, inner_radius, outer_radius, ctx) {
	let inner_color = AddAlphaToColorRGB(color_rgb, alpha);
	let outer_color = AddAlphaToColorRGB(color_rgb, /*alpha=*/0);
	DrawGlow(pos, inner_color, outer_color, alpha, inner_radius, outer_radius, ctx);
}

function DrawGlowHSL(pos, color_hsl, alpha, inner_radius, outer_radius, ctx) {
	let inner_color = AddAlphaToColorHSL(color_hsl, alpha);
	let outer_color = AddAlphaToColorHSL(color_hsl, /*alpha=*/0);
	DrawGlow(pos, inner_color, outer_color, alpha, inner_radius, outer_radius, ctx);
}

function DrawTextOnBall(ball, text, font_size, ctx) {
	const kTextWidth = kBallRadius * 1.5;
	ctx.save();
	ctx.translate(ball.pos.x, ball.pos.y);
	ctx.rotate(-ball.rotation);
	ctx.textAlign = "center";
	ctx.fillStyle = "#000";
	ctx.font = font_size + "px sans-serif";
	ctx.fillText(text, 0, font_size / 3, kTextWidth);
	ctx.restore();
}

function DrawPrismaticBalls(balls, ctx) {
	const kCycleDuration = 1000.0;
	const kGlowSize = 3;
	const kGlowAlpha = 0.5;
	for (let i = 0; i < balls.length; ++i) {
		let time_elapsed = state.current_time - balls[i].start_time;
		let pos = balls[i].pos;
		let inner_color = GetPrismaticColor(
			time_elapsed, kCycleDuration, kPrismaticLightnessInner
		);
		let outer_color = GetPrismaticColor(
			time_elapsed, kCycleDuration, kPrismaticLightnessOuter
		);
		let glow_color = GetPrismaticColorHSL(
			time_elapsed + kCycleDuration / 2.0, kCycleDuration, kPrismaticLightnessOuter
		);
		DrawGlowHSL(
			pos, glow_color, kGlowAlpha, kBallRadius, kBallRadius + kGlowSize, ctx
		);

		let inner_x = pos.x - kBallRadius / 3;
		let inner_y = pos.y - kBallRadius / 3;
		let inner_r = kBallRadius / 10;
		let outer_x = pos.x;
		let outer_y = pos.y;
		let outer_r = kBallRadius;
		let gradient = ctx.createRadialGradient(
			inner_x,
			inner_y,
			inner_r,
			outer_x,
			outer_y,
			outer_r
		);
		gradient.addColorStop(0, inner_color);
		const kCycleLength = kNumBeachBallColors;
		let point_in_cycle = (time_elapsed * kCycleLength) / kCycleDuration;
		let color_stop =
			(1.0 - point_in_cycle + Math.floor(point_in_cycle)) / kCycleLength;
		let color_stop_interval = 1.0 / kCycleLength;
		while (color_stop < 1.0) {
			let lightness =
				kPrismaticLightnessOuter * color_stop +
				kPrismaticLightnessInner * (1.0 - color_stop);
			let color = GetPrismaticColor(
				time_elapsed + (1.0 - color_stop) * kCycleDuration,
				kCycleDuration,
				lightness,
			);
			gradient.addColorStop(color_stop, color);
			color_stop += color_stop_interval;
		}
		gradient.addColorStop(1, outer_color);
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, kBallRadius, 0, 2 * Math.PI);
		ctx.fill();
	}
}

function DrawEightBalls(balls, ctx) {
	const kInnerRadiusFraction = 0.5;
	const kEpsilon = 1e-7;
	const kGlowSize = 3;
	const kGlowAlpha = 0.5;
	for (let i = 0; i < balls.length; ++i) {
		let pos = balls[i].pos;
		DrawGlowRGB(
			pos, k8BallHighlightColor, kGlowAlpha, kBallRadius, kBallRadius + kGlowSize, ctx
		);

		let inner_r = kBallRadius * kInnerRadiusFraction;
		let outer_r = kBallRadius;
		let gradient = ctx.createRadialGradient(
			pos.x, pos.y, inner_r, pos.x, pos.y, outer_r
		);
		gradient.addColorStop(0, "#FFF");
		gradient.addColorStop(kEpsilon, "#333");
		gradient.addColorStop(1, "#000");
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, kBallRadius, 0, 2 * Math.PI);
		ctx.fill();
		DrawTextOnBall(balls[i], /*text=*/"8", /*font_size=*/5, ctx);
	}
}

function DrawEightBallsNoGradient(balls, ctx) {
	const kInnerRadiusFraction = 0.5;
	const kGlowSize = 3;
	const kGlowAlpha = 0.5;
	for (let i = 0; i < balls.length; ++i) {
		let pos = balls[i].pos;

		// Draw highlight
		ctx.beginPath();
		ctx.strokeStyle = AddAlphaToColorRGB(k8BallHighlightColor, kGlowAlpha);
		ctx.fillStyle = "rgba(0,0,0,0)";
		ctx.arc(pos.x, pos.y, kBallRadius, 0, 2 * Math.PI);
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw the ball itself
		ctx.beginPath();
		ctx.strokeStyle = "#000";
		ctx.arc(pos.x, pos.y, kBallRadius * 0.75, 0, 2 * Math.PI);
		ctx.lineWidth = kBallRadius * 0.5;
		ctx.stroke();
		DrawCircle(ctx, pos, kBallRadius / 2.0, "#FFF");
		DrawTextOnBall(balls[i], /*text=*/"8", /*font_size=*/5, ctx);
	}
}

function DrawBeachBalls(balls, use_gradient, ctx) {
	for (let i = 0; i < balls.length; ++i) {
		const pos = balls[i].pos;
		const rotation = balls[i].rotation;
		for (let j = 0; j < kNumBeachBallColors; ++j) {
			const segment_rotation =
				Math.PI * 2.0 * j / kNumBeachBallColors - rotation;
			const outer_color = kBeachBallOuterColors[j];
			if (use_gradient) {
				const inner_color = kBeachBallInnerColors[j];
				ctx.fillStyle = CreateBallGradient(
					ctx, pos, kBallRadius, inner_color, outer_color
				);
			} else {
				ctx.fillStyle = outer_color;
			}
			ctx.beginPath();
			ctx.moveTo(pos.x, pos.y);
			ctx.arc(
				pos.x,
				pos.y,
				kBallRadius,
				segment_rotation,
				segment_rotation + Math.PI / 3.0
			);
			ctx.lineTo(pos.x, pos.y);
			ctx.fill();
		}
	}
}

function DrawRubberBandBalls(balls, use_gradient, ctx) {
	const kNumColors = kRubberBandColorIndices.length;
	for (let i = 0; i < balls.length; ++i) {
		const pos = balls[i].pos;
		const rotation = balls[i].rotation;
		for (let j = 0; j < kNumColors; ++j) {
			const segment_rotation =
				Math.PI * kRubberBandLayerOrder[j] / kNumColors - rotation;
			const color_index = kRubberBandColorIndices[j];
			const outer_color = kBeachBallOuterColors[color_index];
			if (use_gradient) {
				const inner_color = kBeachBallInnerColors[color_index];
				ctx.fillStyle = CreateBallGradient(
					ctx, pos, kBallRadius, inner_color, outer_color
				);
			} else {
				ctx.fillStyle = outer_color;
			}
			ctx.beginPath();
			ctx.arc(
				pos.x,
				pos.y,
				kBallRadius,
				segment_rotation,
				segment_rotation + Math.PI / 6.0
			);
			ctx.arc(
				pos.x,
				pos.y,
				kBallRadius,
				segment_rotation + Math.PI,
				segment_rotation + Math.PI * 7.0 / 6.0
			);
			ctx.fill();
		}
	}
}

function DrawSpiralOnBall(pos, rotation, inner_color, outer_color, ctx) {
	const kTransparent = "rgba(0, 0, 0, 0)";
	const kEpsilon = 1e-7;
	const kLineWidth = 2;
	let gradient = CreateRadialGradientForBall(ctx, pos, kBallRadius);

	gradient.addColorStop(0.0, inner_color);
	gradient.addColorStop(1.0 - kEpsilon, outer_color);
	gradient.addColorStop(1, kTransparent);
	ctx.strokeStyle = gradient;
	ctx.lineCap = "round";
	ctx.lineWidth = kLineWidth;
	ctx.beginPath();
	let shift_dist = kLineWidth / 2.0;
	ctx.moveTo(
		pos.x + Math.cos(rotation) * shift_dist,
		pos.y + Math.sin(rotation) * shift_dist
	);
	const kStep = 8;
	const kMaxIter = kStep * (Math.ceil(kBallRadius / kLineWidth));
	for (let r = 0; r < kMaxIter; ++r) {
		rotation += Math.PI / kStep;
		shift_dist += kLineWidth / kStep;
		ctx.lineTo(
			pos.x + Math.cos(rotation) * shift_dist,
			pos.y + Math.sin(rotation) * shift_dist
		);
	}
	ctx.stroke();
}

function DrawSpiralBalls(balls, current_time, use_gradient, ctx) {
	const kGlowSize = 3;
	const kMaxGlowOmega = 50.0;
	const kMaxGlowAlpha = 0.8;
	const kGlowColor = "0,255,0";
	for (let i = 0; i < balls.length; ++i) {
		let pos = balls[i].pos;
		let rotation = balls[i].rotation;

		const kPrismaticCycleShift = kPrismaticCycleDuration / 2.0;
		let color_1_outer = GetPrismaticColor(
			current_time - balls[i].start_time,
			kPrismaticCycleDuration,
			kPrismaticLightnessOuter
		);
		let color_2_outer = GetPrismaticColor(
			current_time + kPrismaticCycleShift - balls[i].start_time,
			kPrismaticCycleDuration,
			kPrismaticLightnessOuter
		);
		let rot2 = rotation + Math.PI;
		if (use_gradient) {
			let color_1_inner = GetPrismaticColor(
				current_time - balls[i].start_time,
				kPrismaticCycleDuration,
				kPrismaticLightnessInner
			);
			let color_2_inner = GetPrismaticColor(
				current_time + kPrismaticCycleShift - balls[i].start_time,
				kPrismaticCycleDuration,
				kPrismaticLightnessInner
			);
			let glow_fraction = Math.sqrt(Math.abs(balls[i].omega) / kMaxGlowOmega);
			glow_fraction = Math.min(glow_fraction, 1.0);
			let glow_alpha = kMaxGlowAlpha * glow_fraction;
			DrawGlowRGB(
				pos, kGlowColor, glow_alpha, kBallRadius, kBallRadius + kGlowSize, ctx
			);
			DrawSpiralOnBall(pos, -rotation, color_1_inner, color_1_outer, ctx);
			DrawSpiralOnBall(pos, -rot2, color_2_inner, color_2_outer, ctx);
		} else {
			DrawSpiralOnBall(pos, -rotation, color_1_outer, color_1_outer, ctx);
			DrawSpiralOnBall(pos, -rot2, color_2_outer, color_2_outer, ctx);
		}
	}
}

function CreateRadialGradientForBall(ctx, pos, radius) {
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
	return gradient;
}

function CreateBallGradient(ctx, pos, radius, inner_color, outer_color) {
	let gradient = CreateRadialGradientForBall(ctx, pos, radius);
	gradient.addColorStop(0, inner_color);
	gradient.addColorStop(1, outer_color);
	return gradient;
}

function CreateBumperGradient(ctx, pos, radius) {
	const kOuterColor = "#080";
	const kInnerColor = "#8F8";
	const kTransparent = "rgba(0, 0, 0, 0)";
	const kEpsilon = 1e-7;
	let inner_r = radius / 3.0;
	let gradient =
		ctx.createRadialGradient(pos.x, pos.y, inner_r, pos.x, pos.y, radius);
	gradient.addColorStop(0, kTransparent);
	gradient.addColorStop(kEpsilon, kOuterColor);
	gradient.addColorStop(0.5, kInnerColor);
	gradient.addColorStop(1.0, kOuterColor);
	return gradient;
}

function DrawGradientCircle(ctx, pos, radius, inner_color, outer_color) {
	ctx.fillStyle =
		CreateBallGradient(ctx, pos, radius, inner_color, outer_color);
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
	return document.getElementById("canvas_" + layer_id);
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
	let board = ActiveMachine(state).board;
	const aspect_ratio = board.width / board.height;
	const max_height = window.innerHeight - 25;
	const max_width = window.innerWidth - 300;
	state.canvas_scale = Math.min(
		max_height / board.height,
		max_width / board.width
	);
	const height = board.height * state.canvas_scale;
	const width = board.width * state.canvas_scale;
	let board_td = document.getElementById("board-td");
	board_td.width = width;
	board_td.height = height;
	let canvasLayers = document.getElementsByClassName("board");
	for (let i = 0; i < canvasLayers.length; ++i) {
		let canvas = canvasLayers[i];
		let aspect_ratio = board.width / board.height;
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
	let peg_color = GetPegColor();
	for (let i = 0; i < positions.length; ++i) {
		DrawGradientCircle(
			ctx,
			positions[i],
			kPegRadius,
			peg_color.inner,
			peg_color.outer
		);
	}
}

function DrawPegsNoGradient(positions, ctx) {
	let peg_color = GetPegColor();
	for (let i = 0; i < positions.length; ++i) {
		DrawCircle(ctx, positions[i], kPegRadius, peg_color.outer);
	}
}

function DrawBalls(balls, inner_color, outer_color, ctx) {
	if (inner_color == k8Ball && outer_color == k8Ball) {
		DrawEightBalls(balls, ctx);
		return;
	}
	if (inner_color == kBeachBall && outer_color == kBeachBall) {
		DrawBeachBalls(balls, true, ctx);
		return;
	}
	if (inner_color == kRubberBand && outer_color == kRubberBand) {
		DrawRubberBandBalls(balls, true, ctx);
		return;
	}
	if (inner_color == kSpiral && outer_color == kSpiral) {
		DrawSpiralBalls(balls, state.current_time, true, ctx);
		return;
	}
	if (
		!GetSetting("classic_opal_balls") &&
		inner_color == kPrismatic &&
		outer_color == kPrismatic
	) {
		DrawPrismaticBalls(balls, ctx);
		return;
	}
	const kPrismaticCycleShift = kPrismaticCycleDuration / 6.0;
	const current_time = state.current_time;
	for (let i = 0; i < balls.length; ++i) {
		let inner_color_hsl = inner_color;
		if (inner_color == kPrismatic) {
			inner_color_hsl = GetPrismaticColor(
				current_time + kPrismaticCycleShift - balls[i].start_time,
				kPrismaticCycleDuration,
				kPrismaticLightnessInner
			);
		}
		let outer_color_hsl = outer_color;
		if (outer_color == kPrismatic) {
			outer_color_hsl = GetPrismaticColor(
				current_time - balls[i].start_time,
				kPrismaticCycleDuration,
				kPrismaticLightnessOuter
			);
		}
		DrawGradientCircle(
			ctx,
			balls[i].pos,
			kBallRadius,
			inner_color_hsl,
			outer_color_hsl
		);
	}
}

function DrawBallsNoGradient(balls, color, ctx) {
	if (color == k8Ball) {
		DrawEightBallsNoGradient(balls, ctx);
		return;
	} else if (color == kBeachBall) {
		DrawBeachBalls(balls, false, ctx);
		return;
	} else if (color == kRubberBand) {
		DrawRubberBandBalls(balls, false, ctx);
		return;
	} else if (color == kSpiral) {
		DrawSpiralBalls(balls, state.current_time, false, ctx);
		return;
	}
	const kPrismaticCycleDuration = 2000.0;
	for (let i = 0; i < balls.length; ++i) {
		let color_rgb = color;
		if (color == kPrismatic) {
			color_rgb =
				GetPrismaticColor(
					state.current_time - balls[i].start_time,
					kPrismaticCycleDuration,
					kPrismaticLightnessOuter
				);
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
			let radius = target.draw_radius;
			ctx.fillStyle = target.color;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
			ctx.fill();

			ctx.textAlign = "center";
			ctx.fillStyle = "#000";
			ctx.font = font_size + "px sans-serif";
			let text_width = target.draw_radius * 1.5;
			ctx.fillText(target.text, pos.x, pos.y + font_size / 3, text_width);
		}
	}
}

function DrawBumpers(bumper_sets, ctx) {
	let font_size = 8;
	for (let i = 0; i < bumper_sets.length; ++i) {
		const bumpers = bumper_sets[i].targets;
		for (let j = 0; j < bumpers.length; ++j) {
			const bumper = bumpers[j];
			if (!bumper.active) {
				continue;
			}
			const pos = bumper.pos;
			let radius = bumper.draw_radius;
			if (bumper.hit_animation > 0) {
				radius += kBumperHitExpandSizes[bumper.hit_animation];
				bumper.hit_animation -= 1;
				state.redraw_bumpers = true;
			}
			ctx.fillStyle = CreateBumperGradient(ctx, pos, radius);
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
			ctx.fill();

			if (bumper.text) {
				ctx.textAlign = "center";
				ctx.fillStyle = "#000";
				ctx.font = font_size + "px sans-serif";
				let text_width = bumper.draw_radius * 1.5;
				ctx.fillText(bumper.text, pos.x, pos.y + font_size / 3, text_width);
			}
		}
	}
}

function DrawHitRateText(x, y, hits, total_balls, ctx) {
	let rate_text = "--";
	if (total_balls > 0) {
		if (!hits) {
			hits = 0;
		}
		let rate = Math.round(100 * hits / total_balls);
		rate_text = rate.toLocaleString();
	}
	ctx.strokeText(rate_text, x, y);
	ctx.fillText(rate_text, x, y);
}

function DrawHitRates(stats, target_sets, bumper_sets, ctx) {
	let total_balls = 0;
	for (let i = 0; i < target_sets.length; ++i) {
		const targets = target_sets[i].targets;
		for (let j = 0; j < targets.length; ++j) {
			const target = targets[j];
			const hits = stats.target_hits[target.id];
			if (hits && !target.pass_through) {
				total_balls += hits;
			}
		}
	}
	if (!IsCollapsed("stats")) {
		let total_balls_text = FormatNumberLong(total_balls);
		UpdateInnerHTML("stats_hit_rates_balls_counted", total_balls_text);
	}

	const kFontSize = 8;
	const dark_mode = GetSetting("dark_mode");
	ctx.textAlign = "center";
	ctx.fillStyle = dark_mode ? "#FFF" : "#000";
	ctx.strokeStyle = dark_mode ? "#000" : "#FFF";
	ctx.font = "bold " + kFontSize + "px sans-serif";
	for (let i = 0; i < target_sets.length; ++i) {
		const targets = target_sets[i].targets;
		for (let j = 0; j < targets.length; ++j) {
			const target = targets[j];
			if (target.active) {
				DrawHitRateText(
					target.pos.x,
					target.pos.y - target.draw_radius - 2,
					stats.target_hits[target.id],
					total_balls,
					ctx
				);
			}
		}
	}
	for (let i = 0; i < bumper_sets.length; ++i) {
		const bumpers = bumper_sets[i].targets;
		for (let j = 0; j < bumpers.length; ++j) {
			const bumper = bumpers[j];
			if (bumper.active) {
				DrawHitRateText(
					bumper.pos.x,
					bumper.pos.y - bumper.draw_radius - 4,
					stats.target_hits[bumper.id],
					total_balls,
					ctx
				);
			}
		}
	}
}

function DrawScoreText(score_text, font_size, duration, rise, stroke_color_rgb, ctx) {
	const kPrismaticLightness = kPrismaticLightnessDefault;
	let next_index = 0;
	const time = performance.now();
	ctx.textAlign = "center";
	ctx.font = "bold " + font_size + "px sans-serif";
	for (let i = 0; i < score_text.length; ++i) {
		let curr_text = score_text[i];
		let elapsed = state.current_time - curr_text.start_time;
		if (elapsed > duration) {
			object_pool.ReleaseRisingText(curr_text)
			continue;
		}
		let fraction = elapsed / duration;
		let alpha = curr_text.opacity * (1 - fraction);
		if (curr_text.color_rgb == kPrismatic) {
			ctx.fillStyle = GetPrismaticColorWithAlpha(
				elapsed,
				duration / 2,
				kPrismaticLightness,
				alpha
			);
		} else {
			ctx.fillStyle = AddAlphaToColorRGB(curr_text.color_rgb, alpha);
		}

		if (stroke_color_rgb) {
			stroke_color_rgba = AddAlphaToColorRGB(stroke_color_rgb, alpha);
			ctx.strokeStyle = stroke_color_rgba;
			ctx.strokeText(
				curr_text.text,
				curr_text.pos.x,
				curr_text.pos.y - fraction * rise
			);
		}

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
	let next_index = 0;
	ctx.lineWidth = "1px";
	for (let i = 0; i < ripples.length; ++i) {
		let ripple = ripples[i];
		let elapsed = state.current_time - ripple.start_time;
		if (elapsed > duration) {
			object_pool.ReleaseRipple(ripple);
			continue;
		}
		let fraction = elapsed / duration;
		let radius = ripple.start_radius + expand * fraction;
		let alpha = 1 - fraction;

		if (ripple.color_rgb == kBeachBall) {
			const kNumColors = kPrismaticRippleColorHSLs.length;
			let rotation = 4.0 * Math.PI * elapsed / duration;
			for (let i = 0; i < kNumColors; ++i) {
				let segment_rotation = rotation + Math.PI * 2.0 * i / kNumColors;
				ctx.strokeStyle =
					AddAlphaToColorHSL(kPrismaticRippleColorHSLs[i], alpha);
				ctx.beginPath();
				ctx.arc(
					ripple.pos.x,
					ripple.pos.y,
					radius,
					segment_rotation,
					segment_rotation + Math.PI / 3.0
				);
				ctx.stroke();
			}
		} else if (ripple.color_rgb == kRubberBand) {
			const kNumColors = kPrismaticRippleColorHSLs.length;
			let rotation = 4.0 * Math.PI * elapsed / duration;
			for (let i = 0; i < kNumColors; ++i) {
				let segment_rotation = rotation + Math.PI * i / kNumColors;
				let color_hsl =
					kPrismaticRippleColorHSLs[kRubberBandColorIndices[i]];
				ctx.strokeStyle = AddAlphaToColorHSL(color_hsl, alpha);
				ctx.beginPath();
				ctx.arc(
					ripple.pos.x,
					ripple.pos.y,
					radius,
					segment_rotation,
					segment_rotation + Math.PI / 6.0
				);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(
					ripple.pos.x,
					ripple.pos.y,
					radius,
					segment_rotation + Math.PI,
					segment_rotation + Math.PI * 7.0 / 6.0
				);
				ctx.stroke();
			}
		} else if (ripple.color_rgb == kSpiral) {
			let rotation = Math.PI * elapsed / duration;
			let color1 = GetPrismaticColorWithAlpha(
				elapsed,
				duration / 2,
				kPrismaticLightnessRipple,
				alpha
			);
			let color2 = GetPrismaticColorWithAlpha(
				elapsed + duration / 4,
				duration / 2,
				kPrismaticLightnessRipple,
				alpha
			);
			const kRepetitions = 6;
			for (let i = 0; i < kRepetitions * 2; ++i) {
				let segment_rotation = rotation + Math.PI * i / kRepetitions;
				ctx.strokeStyle = (i & 1) ? color1 : color2;
				ctx.beginPath();
				ctx.arc(
					ripple.pos.x,
					ripple.pos.y,
					radius,
					segment_rotation,
					segment_rotation + Math.PI / kRepetitions
				);
				ctx.stroke();
			}
		} else {
			if (ripple.color_rgb == kPrismatic) {
				ctx.strokeStyle = GetPrismaticColorWithAlpha(
					elapsed,
					duration / 2,
					kPrismaticLightnessRipple,
					alpha
				);
			} else {
				ctx.strokeStyle = AddAlphaToColorRGB(ripple.color_rgb, alpha);
			}
			ctx.beginPath();
			ctx.arc(ripple.pos.x, ripple.pos.y, radius, 0, 2 * Math.PI);
			ctx.stroke();
		}
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
	let canvas = GetCanvasLayer("bonus_wheel");
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
			/*stroke_color_rgb=*/ "0, 0, 0",
			ctx
		);
	}
}

function DrawBoardGlow(state) {
	state.redraw_board_glow = false;
	const glow = state.board_glow;
	let ctx = ClearLayerAndReturnContext("glow");
	let glow_active =
		glow.color && glow.size > 0 && GetSetting("board_glow_enabled");
	if (!glow_active) {
		return;
	}
	const board = ActiveMachine(state).board;
	const width = board.width;
	const height = board.height;
	const size = glow.size;
	const kTransparent = "rgba(0,0,0,0)";

	// Top
	let gradient = ctx.createLinearGradient(0, 0, 0, size);
	gradient.addColorStop(0, glow.color);
	gradient.addColorStop(1, kTransparent);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, size);

	// Bottom
	gradient = ctx.createLinearGradient(0, height, 0, height - size);
	gradient.addColorStop(0, glow.color);
	gradient.addColorStop(1, kTransparent);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, height - size, width, size);

	// Left
	gradient = ctx.createLinearGradient(0, 0, size, 0);
	gradient.addColorStop(0, glow.color);
	gradient.addColorStop(1, kTransparent);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, height);

	// Right
	gradient = ctx.createLinearGradient(width, 0, width - size, 0);
	gradient.addColorStop(0, glow.color);
	gradient.addColorStop(1, kTransparent);
	ctx.fillStyle = gradient;
	ctx.fillRect(width - size, 0, size, height);
}

function Draw(state) {
	const machine = ActiveMachine(state);
	machine.Draw(state);
	const board = machine.board;
	// Drop Zone
	const can_drop =
		CanDrop(state) ||
		(machine.AutoDropOn() && state.auto_drop_cooldown < kMinCooldownToDraw);
	if (state.redraw_all || state.last_drawn.can_drop != can_drop) {
		const drop_zones = machine.board.drop_zones;
		for (let i = 0; i < drop_zones.length; ++i) {
			let drop_zone_elem = document.getElementById("drop_zone" + i);
			if (drop_zone_elem.disabled == can_drop) {
				drop_zone_elem.disabled = !can_drop;
			}
		}
		if (state.redraw_all) {
			for (let i = 0; i < drop_zones.length; ++i) {
				let drop_zone_elem = document.getElementById("drop_zone" + i);
				let rect = drop_zones[i];
				const kLeftOffset = 5;
				const kTopOffset = 5;
				let width_px = (rect.max_x - rect.min_x) * state.canvas_scale;
				let height_px = (rect.max_y - rect.min_y) * state.canvas_scale;
				drop_zone_elem.style.width = width_px + "px";
				drop_zone_elem.style.height = height_px + "px";
				if (state.april_fools) {
					let top_px = kTopOffset + (board.height - rect.min_y) * state.canvas_scale - height_px;
					let left_px = kLeftOffset + (board.width - rect.max_x) * state.canvas_scale;
					drop_zone_elem.style.top = top_px + "px";
					drop_zone_elem.style.left = left_px + "px";
				} else {
					let top_px = kTopOffset + rect.min_y * state.canvas_scale;
					let left_px = kLeftOffset + rect.min_x * state.canvas_scale;
					drop_zone_elem.style.top = kTopOffset + "px";
					drop_zone_elem.style.left = left_px + "px";
				}
			}
		}
		state.last_drawn.can_drop = can_drop;
	}
	// Board
	if (state.redraw_all) {
		let ctx = ClearLayerAndReturnContext("board");
		if (GetSetting("quality") <= 1) {
			DrawPegs(board.pegs, ctx);
		} else {
			DrawPegsNoGradient(board.pegs, ctx);
		}
	}
	// Balls
	let total_balls = TotalBalls(state);
	if (state.redraw_all || total_balls > 0 || state.last_drawn.num_balls > 0) {
		const ball_types = machine.BallTypes();
		let ctx = ClearLayerAndReturnContext("balls");
		for (let i = 0; i < state.balls_by_type.length; ++i) {
			let opacity_id = ball_types[i].name + "_ball_opacity";
			let opacity_pct = machine.GetSetting(opacity_id);
			if (opacity_pct <= 0) {
				continue;
			}
			ctx.globalAlpha = opacity_pct / 100.0;
			if (GetSetting("quality") == 0) {
				DrawBalls(
					state.balls_by_type[i],
					ball_types[i].inner_color,
					ball_types[i].outer_color,
					ctx
				);
			} else {
				DrawBallsNoGradient(
					state.balls_by_type[i],
					ball_types[i].outer_color,
					ctx
				);
			}
		}
		state.last_drawn.num_balls = total_balls;
	}
	// Bumpers
	if (state.redraw_all || state.redraw_bumpers) {
		let ctx = ClearLayerAndReturnContext("bumpers");
		state.redraw_bumpers = false;
		DrawBumpers(machine.board.bumper_sets, ctx);
	}
	// Targets
	if (state.reset_target_text) {
		state.reset_target_text = false;
		let target_sets = machine.board.target_sets;
		for (let i = 0; i < target_sets.length; ++i) {
			const targets = target_sets[i].targets;
			for (let j = 0; j < targets.length; ++j) {
				targets[j].ResetText();
			}
		}
	}
	if (state.redraw_all || state.redraw_targets) {
		let ctx = ClearLayerAndReturnContext("targets");
		state.redraw_targets = false;
		DrawTargets(machine.board.target_sets, ctx);
	}
	// Stats
	if (state.redraw_all || state.redraw_stats_overlay) {
		let ctx = ClearLayerAndReturnContext("stats");
		state.redraw_stats_overlay = false;
		if (GetSetting("show_hit_rates")) {
			DrawHitRates(
				machine.GetSaveData().stats,
				machine.board.target_sets,
				machine.board.bumper_sets,
				ctx
			);
		}
	}
	// Auto-Drop position
	if (state.redraw_all || state.redraw_auto_drop) {
		let ctx = ClearLayerAndReturnContext("auto_drop");
		if (machine.AutoDropOn()) {
			let cooldown = 0;
			if (state.auto_drop_cooldown >= kMinCooldownToDraw) {
				cooldown =
					state.auto_drop_cooldown_left / state.auto_drop_cooldown;
			}
			DrawAutoDropPosition(machine.GetSaveData().auto_drop_pos, cooldown, ctx);
		}
		state.redraw_auto_drop = false;
	}
	// Score text
	if (
		state.redraw_all ||
		state.score_text.length > 0 ||
		state.last_drawn.num_score_text > 0
	) {
		let ctx = ClearLayerAndReturnContext("score_text");
		DrawScoreText(
			state.score_text,
			/*font_size=*/ 8,
			/*duration=*/ 1000.0,
			/*rise=*/ 15.0,
			/*stroke_color_rgb=*/ null,
			ctx
		);
		state.last_drawn.num_score_texts = state.score_text.length;
	}
	// Ripple effects
	if (
		state.redraw_all ||
		state.ripples.length > 0 ||
		state.last_drawn.num_ripples > 0
	) {
		let ctx = ClearLayerAndReturnContext("ripples");
		DrawRipples(state.ripples, /*duration=*/ 1000.0, /*expand=*/ 20.0, ctx);
		state.last_drawn.num_ripples = state.ripples.length;
	}
	// Board glow
	if (state.redraw_all || state.redraw_board_glow) {
		DrawBoardGlow(state);
	}

	if (state.redraw_all) {
		UpdateAutoSaveInterval();
		UpdateOptionsButtons();
		UpdateSpinCounter();
	}

	UpdateNotifications(state);

	state.redraw_all = false;
}
