class ObjectPool {
	constructor() {
		this.ball_pool = [];
		this.ripple_pool = [];
		this.rising_text_pool = [];
	}

	NewBall(x, y, dx, dy, ball_type_index, rotation, omega) {
		if (this.ball_pool.length == 0) {
			return new Ball(x, y, dx, dy, ball_type_index, rotation, omega);
		} else {
			let ball = this.ball_pool.pop();
			ball.Reset(x, y, dx, dy, ball_type_index, rotation, omega);
			return ball;
		}
	}

	ReleaseBall(ball) {
		this.ball_pool.push(ball);
	}

	NewRipple(x, y, color_rgb, start_radius) {
		if (this.ripple_pool.length == 0) {
			return new RippleEffect(x, y, color_rgb, start_radius);
		} else {
			let ripple = this.ripple_pool.pop();
			ripple.Reset(x, y, color_rgb, start_radius);
			return ripple;
		}
	}

	ReleaseRipple(ripple) {
		this.ripple_pool.push(ripple);
	}

	NewRisingText(text, pos, color_rgb, opacity) {
		if (this.rising_text_pool.length == 0) {
			return new RisingText(text, pos, color_rgb, opacity);
		} else {
			let rising_text = this.rising_text_pool.pop();
			rising_text.Reset(text, pos, color_rgb, opacity);
			return rising_text;
		}
	}

	ReleaseRisingText(rising_text) {
		this.rising_text_pool.push(rising_text);
	}
}

object_pool = new ObjectPool();

class Point {
	constructor(x, y) {
		this.Reset(x, y);
	}

	Reset(x, y) {
		this.x = x;
		this.y = y;
	}

	CopyFrom(other) {
		this.x = other.x;
		this.y = other.y;
	}

	DistanceSqrToPoint(other) {
		const dx = this.x - other.x;
		const dy = this.y - other.y;
		return dx * dx + dy * dy;
	}

	DeltaToPoint(other) {
		return new Vector(other.x - this.x, other.y - this.y);
	}

	Add(vec) {
		return new Point(this.x + vec.x, this.y + vec.y);
	}

	MutateAdd(vec) {
		this.x += vec.x;
		this.y += vec.y;
	}

	MutateAddNTimes(vec, n) {
		this.x += vec.x * n;
		this.y += vec.y * n;
	}

	DebugStr() {
		return `(${this.x}, ${this.y})`
	}
}

class Vector {
	constructor(x, y) {
		this.Reset(x, y);
	}

	Reset(x, y) {
		this.x = x;
		this.y = y;
	}

	CopyFrom(other) {
		this.x = other.x;
		this.y = other.y;
	}

	Add(other) {
		return new Vector(this.x + other.x, this.y + other.y);
	}

	Subtract(other) {
		return new Vector(this.x - other.x, this.y - other.y);
	}

	Multiply(mult) {
		return new Vector(this.x * mult, this.y * mult);
	}

	MutateAdd(other) {
		this.x += other.x;
		this.y += other.y;
	}

	MutateAddNTimes(other, n) {
		this.x += other.x * n;
		this.y += other.y * n;
	}

	MutateSubtract(other) {
		this.x -= other.x;
		this.y -= other.y;
	}

	MutateMultiply(mult) {
		this.x *= mult;
		this.y *= mult;
	}

	MagnitudeSqr() {
		return this.x * this.x + this.y * this.y;
	}

	Magnitude() {
		return Math.sqrt(this.MagnitudeSqr());
	}

	Normalize() {
		const magnitude = this.Magnitude();
		return new Vector(this.x / magnitude, this.y / magnitude);
	}

	MutateNormalize() {
		const magnitude = this.Magnitude();
		this.x /= magnitude;
		this.y /= magnitude;
	}

	DotProduct(other) {
		return this.x * other.x + this.y * other.y;
	}

	ProjectionOnto(other) {
		let result = other.Normalize();
		result.MutateMultiply(result.DotProduct(this));
		return result;
	}

	// Rotates 90 degrees left.
	Perpendicular() {
		return new Vector(-this.y, this.x);
	}

	DebugStr() {
		return `<${this.x}, ${this.y}>`
	}
}

class Rectangle {
	constructor(min_x, max_x, min_y, max_y) {
		this.min_x = min_x;
		this.max_x = max_x;
		this.min_y = min_y;
		this.max_y = max_y;
	}

	Contains(point) {
		return this.min_x <= point.x && this.max_x >= point.x &&
			this.min_y <= point.y && this.max_y >= point.y;
	}
}

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

class RisingText {
	constructor(text, pos, color_rgb, opacity) {
		this.pos = new Point(pos.x, pos.y);
		this.Reset(text, pos, color_rgb, opacity);
	}

	Reset(text, pos, color_rgb, opacity) {
		this.text = text;
		this.pos.Reset(pos.x, pos.y);
		this.color_rgb = color_rgb;
		this.start_time = state.current_time;
		this.opacity = opacity;
	}
}

// Appends a linear series of points from start to end, equally spaced and at
// least min_spacing apart. Does not append the start or end points themselves.
function AppendInterpolatedLine(points_array, start, end, min_spacing) {
	let delta = start.DeltaToPoint(end);
	let dist = delta.Magnitude();
	let num_intervals = Math.floor(dist / min_spacing);
	let step_dist = dist / num_intervals;
	let step = delta.Normalize().Multiply(step_dist);
	for (let i = 1; i < num_intervals; ++i) {
		points_array.push(start.Add(step.Multiply(i)));
	}
}

// Appends a linear series of points between each consecutive pair of points in
// `vertices`, equally spaced and at least min_spacing apart, including all
// points in `vertices`.
function AppendInterpolatedPolyline(points_array, vertices, min_spacing) {
	points_array.push(new Point(vertices[0].x, vertices[0].y));
	for (let i = 1; i < vertices.length; ++i) {
		AppendInterpolatedLine(
			points_array, vertices[i - 1], vertices[i], min_spacing
		);
		points_array.push(new Point(vertices[i].x, vertices[i].y));
	}
}

// Appends an arc of points between start_radians and end_radians along the circle
// wih the specified center with radius. Radians are counterclockwise starting from
// the right (parallel with the positive x-axis). Output points are equally spaced
// and at least min_spacing apart (straight line distance).
function AppendInterpolatedArc(points_array, center, radius, start_radians, end_radians, min_spacing) {
	console.assert(radius > 0);
	console.assert(min_spacing <= radius);
	const radius_sqr = radius * radius;
	const min_spacing_sqr = min_spacing * min_spacing;
	const min_spacing_radians = Math.acos(1 - min_spacing_sqr / radius_sqr);
	const radian_delta = (end_radians - start_radians);
	const num_intervals =
		Math.floor(Math.abs(radian_delta) / min_spacing_radians) + 1;
	for (let i = 0; i <= num_intervals; ++i) {
		let radians = start_radians + radian_delta * i / num_intervals;
		let vec = new Vector(radius * cos(radians), radius * sin(radians));
		points_array.push(center.Add(vec));
	}
}

function ActiveMachine(state) {
	return state.machines[state.active_machine_index];
}

function UpdateInnerHTML(elem_id, html) {
	let elem = document.getElementById(elem_id);
	if (!elem) {
		return false;
	} else if (elem.innerHTML != html) {
		elem.innerHTML = html;
		return true;
	} else {
		return false;
	}
}

function UpdateDisplay(elem_id, display) {
	let elem = document.getElementById(elem_id);
	if (!elem) {
		return false;
	} else if (elem.style.display != display) {
		elem.style.display = display;
		return true;
	} else {
		return false;
	}
}

function MaybeAddScoreText({ level, text, pos, color_rgb, opacity }) {
	if (
		state.enable_score_text &&
		opacity > 0 &&
		level >= ActiveMachine(state).GetSetting("display_popup_text")
	) {
		state.score_text.push(
			object_pool.NewRisingText(text, pos, color_rgb, opacity)
		);
	}
}

function MaybeAddBonusWheelText({ text, pos, color_rgb }) {
	if (state.enable_score_text) {
		state.wheel_popup_text.push(
			object_pool.NewRisingText(text, pos, color_rgb, 1.0)
		);
	}
}

class RippleEffect {
	constructor(x, y, color_rgb, start_radius) {
		this.pos = new Point(x, y);
		this.Reset(x, y, color_rgb, start_radius);
	}

	Reset(x, y, color_rgb, start_radius) {
		this.pos.Reset(x, y);
		this.color_rgb = color_rgb;
		this.start_radius = start_radius;
		this.start_time = state.current_time;
	}
}

// Based on https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
function SampleGaussianNoise(mu, sigma) {
	const two_pi = 2.0 * Math.PI;

	let u1 = 0.0;
	let u2 = 0.0;
	do {
		u1 = Math.random();
		u2 = Math.random();
	} while (u1 <= Number.EPSILON);

	const magnitude = sigma * Math.sqrt(-2.0 * Math.log(u1));
	const z0 = magnitude * Math.cos(two_pi * u2) + mu;
	const z1 = magnitude * Math.sin(two_pi * u2) + mu;

	return new Vector(z0, z1);
}

class BallType {
	constructor(
		id,
		name,
		display_name,
		physics_params,
		inner_color,
		outer_color,
		ripple_color_rgb
	) {
		this.id = id;
		this.name = name;
		this.display_name = display_name;
		this.physics_params = physics_params;
		this.inner_color = inner_color;
		this.outer_color = outer_color;
		this.ripple_color_rgb = ripple_color_rgb;
	}
}

// Fisher-Yates shuffle.
// Implemented from psuedocode at
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
function ShuffleArray(array) {
	let result = array.slice(0);
	for (let i = result.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		let temp = result[i];
		result[i] = result[j];
		result[j] = temp;
	}
	return result;
}

// Lightweight checksum. Not meant to be cryptographically secure.
// If anyone else is reading this, I don't care if people edit their save
// files. I just want to prevent crazy bugs caused by loading
// unintentionally corrupted save files. --Poochy.EXE
function SaveFileChecksum(save_file) {
	let result = 0;
	for (let i = 0; i < save_file.length; ++i) {
		result = (result >>> 1) | (result << 63);
		result ^= save_file.charCodeAt(i);
		result &= 0xffffffff;
	}
	return result;
}

function ShowButtonTooltip(elem, inner_html, tooltip_width) {
	state.active_tooltip = elem.id;
	const kDefaultWidth = 200;
	const kPadding = 5;
	const kTargetAspectRatio = 0.75;
	let body_rect = document.body.getBoundingClientRect();
	let button_rect = elem.getBoundingClientRect();
	let tooltip_elem = document.getElementById("tooltip");
	tooltip_elem.style.display = "block";
	tooltip_elem.innerHTML = inner_html;
	let width = kDefaultWidth;
	if (tooltip_width) {
		width = tooltip_width;
	} else {
		tooltip_elem.style.width = kDefaultWidth + "px";
		let tooltip_rect = tooltip_elem.getBoundingClientRect();
		if (tooltip_rect.width * kTargetAspectRatio < tooltip_rect.height) {
			width = Math.max(kDefaultWidth, Math.ceil(Math.sqrt(tooltip_rect.width * tooltip_rect.height / kTargetAspectRatio)));
		}
	}
	tooltip_elem.style.width = width + "px";
	let left_pos = Math.min(
		(button_rect.left + button_rect.right - width) / 2.0,
		body_rect.right - width - kPadding
	);
	let top_pos = button_rect.top - tooltip_elem.offsetHeight - kPadding;
	if (top_pos < 0) {
		top_pos = button_rect.bottom + kPadding;
	}
	tooltip_elem.style.left = left_pos + "px";
	tooltip_elem.style.top = top_pos + "px";
}

function HideButtonTooltip(button_elem) {
	if (state.active_tooltip != button_elem.id) {
		return;
	}
	document.getElementById("tooltip").style.display = "none";
}
