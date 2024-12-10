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

function FormatSmallNumberLong(num) {
	if (Number.isInteger(num)) {
		return num.toString();
	} else {
		return num.toFixed(2);
	}
}

function FormatNumberScientificNotation(num, trim_zeros) {
	let result = num.toPrecision(kNumericPrecision).replace("+", "");
	if (trim_zeros) {
		result = result.replace(/\.?0+e/, "e");
	}
	return result;
}

function FormatNumberEngineeringNotationShort(num) {
	let exponent = 3 * Math.floor(Math.log10(num) / 3);
	if (exponent == 0) {
		return FormatSmallNumberShort(num);
	}
	let prefix = num / Math.pow(10, exponent);
	return FormatSmallNumberShort(prefix) + "e" + exponent.toString();
}

function FormatNumberEngineeringNotationLong(num) {
	let exponent = 3 * Math.floor(Math.log10(num) / 3);
	if (exponent == 0) {
		return FormatSmallNumberLong(num);
	}
	let prefix = num / Math.pow(10, exponent);
	return prefix.toFixed(kNumericPrecision) + "e" + exponent.toString();
}

const kKanji =
	["", "万", "億", "兆", "京", "垓", "秭", "穣", "溝", "澗", "正", "載", "極"];

function FormatNumberShortKanji(num) {
	let suffix_index = Math.floor(Math.log10(num) / 4);
	if (suffix_index == 0) {
		if (num < 1000) {
			return FormatSmallNumberShort(num);
		} else {
			return num.toFixed(0);
		}
	} else if (suffix_index >= kKanji.length) {
		return FormatNumberScientificNotation(num, /*trim_zeros=*/true);
	}
	let prefix = Math.round(num / Math.pow(10000, suffix_index));
	return prefix.toString() + kKanji[suffix_index];
}

function FormatNumberMediumKanji(num) {
	let suffix_index = Math.floor(Math.log10(num) / 4);
	if (suffix_index == 0) {
		if (num < 1000) {
			return FormatSmallNumberShort(num);
		} else {
			return num.toFixed(0);
		}
	} else if (suffix_index >= kKanji.length) {
		return FormatNumberScientificNotation(num, /*trim_zeros=*/true);
	}
	let prefix2 = Math.round(num / Math.pow(10000, suffix_index - 1));
	let prefix1 = Math.floor(prefix2 / 10000);
	prefix2 %= 10000;
	if (prefix2 == 0) {
		return prefix1.toString() + kKanji[suffix_index];
	} else {
		return prefix1.toString() + kKanji[suffix_index] +
			ZeroPad(prefix2.toString(), 4) + kKanji[suffix_index - 1];
	}
}

function FormatNumberLongKanji(num) {
	let suffix_index = Math.floor(Math.log10(num) / 4);
	if (suffix_index == 0) {
		return FormatSmallNumberLong(num);
	} else if (suffix_index == 1) {
		return FormatNumberMediumKanji(num);
	} else if (suffix_index >= kKanji.length) {
		return FormatNumberScientificNotation(num, /*trim_zeros=*/false);
	}
	let prefix3 = Math.round(num / Math.pow(10000, suffix_index - 2));
	let prefix2 = Math.floor(prefix3 / 10000);
	let prefix1 = Math.floor(prefix2 / 10000);
	prefix2 %= 10000;
	prefix3 %= 10000;
	if (prefix3 == 0 && prefix2 == 0) {
		return prefix1.toString() + kKanji[suffix_index];
	} else if (prefix3 == 0) {
		return prefix1.toString() + kKanji[suffix_index] +
			ZeroPad(prefix2.toString(), 4) + kKanji[suffix_index - 1];
	} else {
	return prefix1.toString() + kKanji[suffix_index] +
		ZeroPad(prefix2.toString(), 4) + kKanji[suffix_index - 1] +
		ZeroPad(prefix3.toString(), 4) + kKanji[suffix_index - 2];
	}
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

function FormatNumberShortEnglish(num) {
	let suffix_index = Math.floor(Math.log10(num) / 3);
	if (suffix_index == 0) {
		return FormatSmallNumberShort(num);
	}
	if (
		GetSetting("scientific_notation") ||
		suffix_index >= kShortSuffixes.length
	) {
		return FormatNumberScientificNotation(num, /*trim_zeros=*/true);
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

function FormatNumberLongEnglish(num) {
	let suffix_index = Math.floor(Math.log10(num) / 3);
	if (suffix_index >= kLongSuffixes.length) {
		return FormatNumberScientificNotation(num, /*trim_zeros=*/false);
	}
	if (kLongSuffixes[suffix_index] == "") {
		return num.toLocaleString();
	}
	let prefix = num / Math.pow(1000, suffix_index);
	return prefix.toFixed(kNumericPrecision) + " " +
		kLongSuffixes[suffix_index];
}

function ZeroPad(num, len) {
	return String(num).padStart(len, "0");
}

function FormatNumberShort(num) {
	if (num < 1000) {
		return FormatSmallNumberShort(num);
	}
	switch (GetSetting("notation")) {
		case 0:
			return FormatNumberShortEnglish(num);
		case 1:
		default:
			return FormatNumberScientificNotation(num, /*trim_zeros=*/true);
		case 2:
			return FormatNumberEngineeringNotationShort(num);
		case 3:
			return FormatNumberShortKanji(num);
	}
}

function FormatNumberMedium(num) {
	if (num < 1000) {
		return FormatSmallNumberShort(num);
	}
	switch (GetSetting("notation")) {
		case 0:
			return FormatNumberShortEnglish(num);
		case 1:
		default:
			return FormatNumberScientificNotation(num, /*trim_zeros=*/true);
		case 2:
			return FormatNumberEngineeringNotationShort(num);
		case 3:
			return FormatNumberMediumKanji(num);
	}
}

function FormatNumberLong(num) {
	if (num < 1000) {
		return FormatSmallNumberLong(num);
	}
	switch (GetSetting("notation")) {
		case 0:
			return FormatNumberLongEnglish(num);
		case 1:
		default:
			return FormatNumberScientificNotation(num, /*trim_zeros=*/false);
		case 2:
			return FormatNumberEngineeringNotationLong(num);
		case 3:
			return FormatNumberLongKanji(num);
	}
}

function FormatSpeedrunTimer(duration_ms, show_ms) {
	console.assert(duration_ms >= 0);
	let x = Math.round(duration_ms);
	let result = "";
	if (show_ms) {
		let ms = x % 1000;
		result = "." + ZeroPad(ms, 3);
	}
	x = Math.floor(x / 1000);
	let secs = x % 60;
	x = Math.floor(x / 60);
	result = ZeroPad(secs, 2) + result;
	let mins = x % 60;
	x = Math.floor(x / 60);
	result = ZeroPad(mins, 2) + ":" + result;
	if (x <= 0) {
		return result;
	}
	let hours = x % 24;
	x = Math.floor(x / 24);
	result = ZeroPad(hours, 2) + ":" + result;
	if (x <= 0) {
		return result;
	}
	result = x + "d " + result;
	return result;
}

function FormatDurationLong(duration_ms, show_ms) {
	console.assert(duration_ms >= 0);
	let x = Math.round(duration_ms);
	let result = "";
	if (show_ms) {
		let ms = x % 1000;
		result = " " + ZeroPad(ms, 3) + "ms";
	}
	x = Math.floor(x / 1000);
	let secs = x % 60;
	x = Math.floor(x / 60);
	result = ZeroPad(secs, 2) + "s" + result;
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
