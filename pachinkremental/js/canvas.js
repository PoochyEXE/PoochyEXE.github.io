const kPegColor = {
	inner: "#888",
	outer: "#000",
};
const kBallColor = {
	inner: "#CCC",
	outer: "#888",
};
const kGoldBallColor = {
	inner: "#FFD700",
	outer: "#AA8F00",
};

function DrawGradientCircle(ctx, pos, radius, colors) {
	let inner_x = pos.x - radius / 3;
	let inner_y = pos.y - radius / 3;
	let inner_r = radius / 10;
	let outer_x = pos.x;
	let outer_y = pos.y;
	let outer_r = radius;
	let gradient = ctx.createRadialGradient(inner_x, inner_y, inner_r, outer_x, outer_y, outer_r);
	gradient.addColorStop(0, colors.inner);
	gradient.addColorStop(1, colors.outer);
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
	ctx.scale(state.canvas_scale, state.canvas_scale);
	return ctx;
}

function ResizeCanvas() {
	const aspect_ratio = state.board.width / state.board.height;
	const max_height = window.innerHeight - 25;
	const max_width = window.innerWidth - 300;
	state.canvas_scale = Math.min(max_height / state.board.height,
			max_width / state.board.width);
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
	
	const right_ui_width = window.innerWidth - width - 30;
	let right_ui_cells = document.getElementsByClassName("rightUI");
	for (let i = 0; i < right_ui_cells.length; ++i) {
		right_ui_cells[i].width = right_ui_width;
	}
}

function DrawDropZone(max_drop_y, min_drop_x, max_drop_x, can_drop, ctx) {
	if (can_drop) {
		ctx.fillStyle = "rgba(0, 255, 0, 0.25)";
	} else {
		ctx.fillStyle = "rgba(255, 0, 0, 0.25)";
	}
	ctx.fillRect(min_drop_x, 0, (max_drop_x - min_drop_x), max_drop_y);
}

function DrawPegs(positions, ctx) {
	for (let i = 0; i < positions.length; ++i) {
		DrawGradientCircle(ctx, positions[i], kPegRadius, kPegColor);
	}
}

function DrawPegsNoGradient(positions, ctx) {
	for (let i = 0; i < positions.length; ++i) {
		DrawCircle(ctx, positions[i], kPegRadius, kPegColor.outer);
	}
}

function DrawBalls(balls, gold, ctx) {
	for (let i = 0; i < balls.length; ++i) {
		DrawGradientCircle(ctx, balls[i].pos, kBallRadius, gold ? kGoldBallColor : kBallColor);
	}
}

function DrawBallsNoGradient(balls, gold, ctx) {
	for (let i = 0; i < balls.length; ++i) {
		DrawCircle(ctx, balls[i].pos, kBallRadius, gold ? kGoldBallColor.outer : kBallColor.outer);
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
			ctx.font = font_size + 'px sans-serif';
			let text_width = target.draw_radius * 1.5;
			ctx.fillText(target.text, pos.x, pos.y + font_size / 3, text_width);
		}
	}
}

function DrawScoreText(score_text, ctx) {
	const kDuration = 1000.0;
	const kRise = 15.0;
	let font_size = 8;
	let next_index = 0;
	const time = Date.now();
	for (let i = 0; i < score_text.length; ++i) {
		let curr_text = score_text[i];
		let elapsed = time - curr_text.start_time;
		if (elapsed > kDuration) {
			continue;
		}
		let fraction = elapsed / kDuration;
		ctx.textAlign = "center";
		ctx.font = 'bold ' + font_size + 'px sans-serif';
		ctx.fillStyle = "rgba(" + curr_text.color_rgb + ", " + (1 - fraction) + ")";
		ctx.fillText(curr_text.text, curr_text.pos.x, curr_text.pos.y - fraction * kRise);
		
		if (next_index != i) {
			score_text[next_index] = score_text[i];
		}
		++next_index;
	}
	score_text.length = next_index;
}

function DrawAutoDropPosition(pos, cooldown, ctx) {
	if (!pos) {
		return;
	}
	const kColor = "#00f";
	let font_size = 6;
	let center_x = pos.x;
	let center_y = pos.y;
	let radius =  kBallRadius;
	
	ctx.textAlign = "center";
	ctx.fillStyle = kColor;
	ctx.font = font_size + 'px sans-serif';
	let text_width = radius * 1.5;
	ctx.fillText("Auto", center_x, center_y + font_size / 3, text_width);
	
	if (cooldown > 0.0) {
		ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
		ctx.beginPath();
		ctx.moveTo(center_x, center_y);
		ctx.arc(center_x, center_y, kBallRadius,
				-Math.PI / 2, cooldown * 2 * Math.PI - Math.PI / 2);
		ctx.lineTo(center_x, center_y);
		ctx.fill();
	}

	ctx.strokeStyle = kColor;
	ctx.beginPath();
	ctx.arc(center_x, center_y, kBallRadius, 0, 2 * Math.PI);
	ctx.stroke();
}
