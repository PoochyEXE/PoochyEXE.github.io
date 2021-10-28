function CostToMax(id) {
	const upgrade = ActiveMachine(state).upgrades[id];
	let total = 0;
	if (upgrade.max_level < 99999) {
		for (let level = 0; level < upgrade.max_level; ++level) {
			total += upgrade.cost_func(level);
		}
	}
	return total;
}

function CostToMaxAll() {
	const upgrades = ActiveMachine(state).upgrades;
	let total = 0;
	for (id in upgrades) {
		total += CostToMax(id);
	}
	return total;
}

function CostToMaxMap() {
	const upgrades = ActiveMachine(state).upgrades;
	let result = {};
	for (id in upgrades) {
		result[id] = CostToMax(id);
	}
	return result;
}

function DrawFavicon(ball_type_index) {
	UpdateDisplay("debug", "block")
	let canvas = document.getElementById("favicon_canvas");
	let ctx = canvas.getContext("2d");
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(
		canvas.width / (2.0 * kBallRadius),
		canvas.height / (2.0 * kBallRadius)
	);

	const ball_type = ActiveMachine(state).BallTypes()[ball_type_index];
	DrawBalls(
		[new Ball(kBallRadius, kBallRadius, 0, 0, ball_type_index, 0, 0)],
		ball_type.inner_color,
		ball_type.outer_color,
		ctx
	);

	let a_elem = document.getElementById("favicon_link")
	a_elem.setAttribute('download', ball_type.name + '.png');
	a_elem.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
}
