const kNumericPrecision = 3;

function FormatSmallNumberShort(num) {
	if (Number.isInteger(num)) {
		return num.toString();
	} else if (num < 100 && Number.isInteger(num * 10)) {
		return num.toFixed(1);
	} else {
		return num.toPrecision(kNumericPrecision);
	}
}

function FormatNumberScientificNotation(num) {
	return num.toPrecision(kNumericPrecision).replace("+", "");
}

const kShortSuffixes = [
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
	"Dc",
	"UDc",
	"DDc",
	"TDc",
	"QaDc",
	"QiDc",
	"SeDc",
	"SpDc",
	"OcDc",
	"NoDc",
	"V",
	"UV",
	"DV",
	"TV",
	"QaV",
	"QiV",
	"SeV",
	"SpV",
	"OcV",
	"NoV",
	"Tr",
	"UTr",
	"DTr",
	"TTr",
	"QaTr",
	"QiTr",
	"SeTr",
	"SpTr",
	"OcTr",
	"NoTr",
];

function FormatNumberShort(num) {
	if (num < 1000) {
		return FormatSmallNumberShort(num);
	}
	let suffix_index = Math.floor(Math.log10(num) / 3);
	if (suffix_index == 0) {
		return FormatSmallNumberShort(num);
	}
	if (
		GetSetting("scientific_notation") ||
		suffix_index >= kShortSuffixes.length
	) {
		return FormatNumberScientificNotation(num);
	}
	let prefix = num / Math.pow(1000, suffix_index);
	let prefix_str = FormatSmallNumberShort(prefix);
	return prefix_str + kShortSuffixes[suffix_index];
}

const kLongSuffixes = [
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
	"decillion",
	"undecillion",
	"duodecillion",
	"tredecillion",
	"quattuordecillion",
	"quindecillion",
	"sedecillion",
	"septedecillion",
	"octodecillion",
	"novendecillion",
	"vigintillion",
	"unvigintillion",
	"duovigintillion",
	"tresvigintillion",
	"quattuorvigintillion",
	"quinvigintillion",
	"sesvigintillion",
	"septemvigintillion",
	"octovigintillion",
	"novemvigintillion",
	"trigintillion",
	"untrigintillion",
	"duotrigintillion",
	"trestrigintillion",
	"quattuortrigintillion",
	"quintrigintillion",
	"sestrigintillion",
	"septentrigintillion",
	"octotrigintillion",
	"noventrigintillion",
];

function FormatNumberLong(num) {
	if (num < 1000) {
		return FormatSmallNumberShort(num);
	}
	let suffix_index = Math.floor(Math.log10(num) / 3);
	if (suffix_index >= kShortSuffixes.length) {
		return FormatNumberScientificNotation(num);
	}
	if (kLongSuffixes[suffix_index] == "") {
		return num.toLocaleString();
	}
	if (GetSetting("scientific_notation")) {
		return FormatNumberScientificNotation(num);
	}
	let prefix = num / Math.pow(1000, suffix_index);
	return prefix.toFixed(kNumericPrecision) + " " +
		kLongSuffixes[suffix_index];
}

function ZeroPad(num, len) {
	return String(num).padStart(len, "0");
}

function FormatDurationLong(duration_ms) {
	console.assert(duration_ms > 0);
	let x = Math.round(duration_ms);
	let ms = x % 1000;
	x = Math.floor(x / 1000);
	let secs = x % 60;
	x = Math.floor(x / 60);
	let result = ZeroPad(secs, 2) + "s " + ZeroPad(ms, 3) + "ms";
	if (x <= 0) {
		return result;
	}
	let mins = x % 60;
	x = Math.floor(x / 60);
	result = ZeroPad(mins, 2) + "m " + result;
	if (x <= 0) {
		return result;
	}
	let hours = x % 24;
	x = Math.floor(x / 24);
	result = ZeroPad(hours, 2) + "h " + result;
	if (x <= 0) {
		return result;
	}
	result = x + "d " + result;
	return result;
}
