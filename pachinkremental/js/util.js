class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
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
}

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
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

	DotProduct(other) {
		return this.x * other.x + this.y * other.y;
	}

	ProjectionOnto(other) {
		const other_norm = other.Normalize();
		return other_norm.Multiply(other_norm.DotProduct(this));
	}

	// Rotates 90 degrees left.
	Perpendicular() {
		return new Vector(-this.y, this.x);
	}
}

class Ball {
	constructor(x, y, dx, dy, ball_type_index) {
		this.pos = new Point(x, y);
		this.vel = new Vector(dx, dy);
		this.ball_type_index = ball_type_index;
		this.active = true;
		this.last_hit = null;
		this.start_time = Date.now();
	}
}

class RisingText {
	constructor(text, pos, color_rgb) {
		this.text = text;
		this.pos = pos;
		this.color_rgb = color_rgb;
		this.start_time = Date.now();
	}
}

function MaybeAddScoreText({ level, text, pos, color_rgb }) {
	if (
		state.enable_score_text &&
		level >= state.save_file.display_popup_text
	) {
		state.score_text.push(new RisingText(text, pos, color_rgb));
	}
}

function MaybeAddBonusWheelText({ text, pos, color_rgb }) {
	if (state.enable_score_text) {
		state.wheel_popup_text.push(new RisingText(text, pos, color_rgb));
	}
}

class RippleEffect {
	constructor(pos, color_rgb, start_radius) {
		this.pos = pos;
		this.color_rgb = color_rgb;
		this.start_radius = start_radius;
		this.start_time = Date.now();
	}
}

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

	return new Point(z0, z1);
}

function FormatSmallNumberShort(num) {
	const kPrecision = 3;
	if (Number.isInteger(num)) {
		return num.toString();
	} else if (num < 100 && Number.isInteger(num * 10)) {
		return num.toFixed(1);
	} else {
		return num.toPrecision(kPrecision);
	}
}

const shortSuffixes = [
	"",
	"K",
	"M",
	"B",
	"T",
	"Qa",
	"Qi",
	"Sx",
	"Sp",
	"Oc",
	"No",
	"Dc"
];

function FormatNumberShort(num) {
	const kPrecision = 3;
	if (num < 1000) {
		return FormatSmallNumberShort(num);
	}
	let suffix_index = Math.floor(Math.log10(num) / 3);
	if (suffix_index >= shortSuffixes.length) {
		return num.toPrecision(kPrecision).replace("+", "");
	}
	if (suffix_index == 0) {
		return FormatSmallNumberShort(num);
	}
	let prefix = num / Math.pow(1000, suffix_index);
	let prefix_str = FormatSmallNumberShort(prefix);
	return prefix_str + shortSuffixes[suffix_index];
}

const longSuffixes = [
	"",
	"",
	"",
	"billion",
	"trillion",
	"quadrillion",
	"quintillion",
	"sextillion",
	"septillion",
	"octillion",
	"nonillion",
	"decillion"
];

function FormatNumberLong(num) {
	const kPrecision = 3;
	if (num < 1000) {
		return num.toString();
	}
	let suffix_index = Math.floor(Math.log10(num) / 3);
	if (suffix_index >= longSuffixes.length) {
		return num.toPrecision(kPrecision).replace("+", "");
	}
	if (longSuffixes[suffix_index] == "") {
		return num.toLocaleString();
	}
	let prefix = num / Math.pow(1000, suffix_index);
	return prefix.toFixed(kPrecision) + " " + longSuffixes[suffix_index];
}

class BallType {
	constructor(
		id,
		name,
		display_name,
		inner_color,
		outer_color,
		ripple_color_rgb
	) {
		this.id = id;
		this.name = name;
		this.display_name = display_name;
		this.inner_color = inner_color;
		this.outer_color = outer_color;
		this.ripple_color_rgb = ripple_color_rgb;
	}
}

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
