class ColorSchemeClassMapping {
	constructor(base_class, light_class, dark_class) {
		this.base = base_class;
		this.light = light_class;
		this.dark = dark_class;
	}
}

const kColorSchemes = ["light", "dark"];

const kColorSchemeClasses = [
	new ColorSchemeClassMapping("messageBox", "messageBoxLight", "messageBoxDark"),
	new ColorSchemeClassMapping("upgradesContainer", "upgradesContainerLight", "upgradesContainerDark"),
	new ColorSchemeClassMapping("upgradesSubContainer", "upgradesSubContainerLight", "upgradesSubContainerDark"),
	new ColorSchemeClassMapping("machinesContainer", "machinesContainerLight", "machinesContainerDark"),
	new ColorSchemeClassMapping("statsContainer", "statsContainerLight", "statsContainerDark"),
	new ColorSchemeClassMapping("optionsContainer", "optionsContainerLight", "optionsContainerDark"),
	new ColorSchemeClassMapping("upgradesHeader", "upgradesHeaderLight", "upgradesHeaderDark"),
	new ColorSchemeClassMapping("upgradesSubHeader", "upgradesSubHeaderLight", "upgradesSubHeaderDark"),
	new ColorSchemeClassMapping("machinesHeader", "machinesHeaderLight", "machinesHeaderDark"),
	new ColorSchemeClassMapping("statsHeader", "statsHeaderLight", "statsHeaderDark"),
	new ColorSchemeClassMapping("optionsHeader", "optionsHeaderLight", "optionsHeaderDark"),
	new ColorSchemeClassMapping("upgradeButton", "upgradeButtonLight", "upgradeButtonDark"),
	new ColorSchemeClassMapping("rubyUpgradeButton", "rubyUpgradeButtonLight", "rubyUpgradeButtonDark"),
	new ColorSchemeClassMapping("sapphireUpgradeButton", "sapphireUpgradeButtonLight", "sapphireUpgradeButtonDark"),
	new ColorSchemeClassMapping("emeraldUpgradeButton", "emeraldUpgradeButtonLight", "emeraldUpgradeButtonDark"),
	new ColorSchemeClassMapping("topazUpgradeButton", "topazUpgradeButtonLight", "topazUpgradeButtonDark"),
	new ColorSchemeClassMapping("turquoiseUpgradeButton", "turquoiseUpgradeButtonLight", "turquoiseUpgradeButtonDark"),
	new ColorSchemeClassMapping("amethystUpgradeButton", "amethystUpgradeButtonLight", "amethystUpgradeButtonDark"),
	new ColorSchemeClassMapping("opalUpgradeButton", "opalUpgradeButtonLight", "opalUpgradeButtonDark"),
	new ColorSchemeClassMapping("opalStaticUpgradeButton", "opalStaticUpgradeButtonLight", "opalStaticUpgradeButtonDark"),
	new ColorSchemeClassMapping("eightBallUpgradeButton", "eightBallUpgradeButtonLight", "eightBallUpgradeButtonDark"),
	new ColorSchemeClassMapping("beachBallUpgradeButton", "beachBallUpgradeButtonLight", "beachBallUpgradeButtonDark"),
	new ColorSchemeClassMapping("rubberBandBallUpgradeButton", "rubberBandBallUpgradeButtonLight", "rubberBandBallUpgradeButtonDark"),
	new ColorSchemeClassMapping("spiralBallUpgradeButton", "spiralBallUpgradeButtonLight", "spiralBallUpgradeButtonDark"),
	new ColorSchemeClassMapping("machineButton", "machineButtonLight", "machineButtonDark"),
	new ColorSchemeClassMapping("statsButton", "statsButtonLight", "statsButtonDark"),
	new ColorSchemeClassMapping("optionButton", "optionButtonLight", "optionButtonDark"),
	new ColorSchemeClassMapping("optionButtonRed", "optionButtonRedLight", "optionButtonRedDark"),
	new ColorSchemeClassMapping("modalContent", "modalContentLight", "modalContentDark"),
	new ColorSchemeClassMapping("modalCloseButton", "modalCloseButtonLight", "modalCloseButtonDark"),
	new ColorSchemeClassMapping("prismaticText", "prismaticTextLight", "prismaticTextDark"),
	new ColorSchemeClassMapping("speedrunTimerCompleted", "speedrunTimerCompletedLight", "speedrunTimerCompletedDark"),
	new ColorSchemeClassMapping("speedrunTimerSplit", "speedrunTimerSplitLight", "speedrunTimerSplitDark"),
	new ColorSchemeClassMapping("exportedSave", "exportedSaveLight", "exportedSaveDark"),
];

function GetSetting(id) {
	if (!state) {
		return undefined;
	}
	return state.save_file.options[id];
}

class OptionButton {
	constructor({id, category, class_name, display_name, default_value, display_value_func, on_update_func, visible_func}) {
		this.id = id;
		if (category) {
			this.category = category;
		} else {
			this.category = "misc";
		}
		if (class_name) {
			this.class_name = class_name;
		} else {
			this.class_name = "optionButton";
		}
		this.display_name = display_name;
		this.default_value = default_value;
		this.display_value_func = display_value_func;
		const kNoop = () => {};
		if (on_update_func) {
			this.on_update_func = on_update_func;
		} else {
			this.on_update_func = kNoop;
		}
		if (visible_func) {
			this.visible_func = visible_func;
		} else {
			this.visible_func = () => true;
		}
	}

	GetSetting() {
		return GetSetting(this.id);
	}

	DisplayValue() {
		return this.display_value_func(this.GetSetting());
	}

	UpdateButton() {
		let button_id = "button_" + this.id;
		UpdateInnerHTML(button_id, this.display_name + ": " + this.DisplayValue());
		UpdateDisplay(button_id, this.visible_func() ? "inline" : "none");
	}

	OnClick() {
		this.on_update_func();
		this.UpdateButton();
	}
}


class BooleanOptionButton extends OptionButton {
	constructor({id, category, class_name, display_name, default_value, text_on, text_off, on_update_func, visible_func}) {
		super({
			id,
			category,
			class_name,
			display_name,
			default_value,
			display_value_func: (value) => value ? text_on : text_off,
			on_update_func,
			visible_func,
		});
	}

	OnClick() {
		state.save_file.options[this.id] = !state.save_file.options[this.id];
		super.OnClick();
	}
}

class ListOptionButton extends OptionButton {
	constructor({id, category, class_name, display_name, default_value, values, on_update_func, visible_func}) {
		super({
			id,
			category,
			class_name,
			display_name,
			default_value: default_value ? default_value : 0,
			display_value_func: (value) => this.values[value],
			on_update_func,
			visible_func,
		});
		this.values = values;
	}

	OnClick() {
		++state.save_file.options[this.id];
		if (state.save_file.options[this.id] >= this.values.length) {
			state.save_file.options[this.id] = 0;
		}
		super.OnClick();
	}
}

function InitOptionButtons() {
	return [
		new BooleanOptionButton({
			id: "dark_mode",
			display_name: "Dark Mode",
			default_value: ShouldDefaultToDarkMode(),
			text_on: "ON",
			text_off: "OFF",
			on_update_func: () => {
				state.redraw_all = true;
				UpdateDarkMode();
			},
		}),
		new ListOptionButton({
			id: "notation",
			display_name: "Notation",
			values: ["English", "Scientific", "Engineering", "漢字"],
			default_value: 0,
			on_update_func: OnNotationToggle,
		}),
		new ListOptionButton({
			id: "quality",
			display_name: "Quality",
			values: ["High", "Medium", "Low"],
			default_value: 0,
			on_update_func: () => {
				state.redraw_all = true;
			},
		}),
		new OptionButton({
			id: "popup_text",
			display_name: "Pop-up text",
			display_value_func: () =>
				ActiveMachine(state).CurrentPopupTextOptionName(),
			on_update_func: () =>
				ActiveMachine(state).TogglePopupText(),
		}),
		new BooleanOptionButton({
			id: "apply_opacity_to_popup_text",
			display_name: "Apply opacity settings to pop-up text",
			text_on: "ON",
			text_off: "OFF",
			default_value: true,
		}),
		new BooleanOptionButton({
			id: "show_combos",
			display_name: "Combos",
			text_on: "Show",
			text_off: "Hide",
			default_value: true,
			visible_func: () =>
				ActiveMachine(state).IsUnlocked("unlock_combos"),
		}),
		new BooleanOptionButton({
			id: "show_upgrade_levels",
			display_name: "Upgrade levels bought",
			text_on: "Show",
			text_off: "Hide",
			default_value: false,
			on_update_func: () => {
				state.update_upgrade_buttons_text = true;
			},
		}),
		new BooleanOptionButton({
			id: "static_opal_ball_upgrade_buttons",
			display_name: "Opal ball upgrade button style",
			text_on: "Static",
			text_off: "Default",
			default_value: false,
			on_update_func: UpdateOpalBallUpgradesStyle,
			visible_func: () =>
				ActiveMachine(state).IsUpgradeVisible("unlock_opal_balls"),
		}),
		new ListOptionButton({
			id: "maxed_upgrades",
			display_name: "Maxed upgrades",
			values: ["Full Size", "Shrink"],
			default_value: 1,
			on_update_func: () => {
				state.update_upgrade_buttons_enabled = true;
			},
		}),
		new BooleanOptionButton({
			id: "board_glow_enabled",
			display_name: "Board glow",
			text_on: "Enabled",
			text_off: "Disabled",
			default_value: true,
			on_update_func: () => {
				state.redraw_board_glow = true;
			},
		}),
		new BooleanOptionButton({
			id: "auto_reset_hit_rates",
			category: "stats_hit_rates",
			class_name: "statsButton",
			display_name: "Auto reset hit rates when changing Auto-Drop location",
			text_on: "ON",
			text_off: "OFF",
			default_value: false,
		}),
		new ListOptionButton({
			id: "april_fools_enabled",
			display_name: "April Fools",
			values: ["Disabled", "Always On", "Enabled"],
			default_value: 2,
			on_update_func: () => {
				state.april_fools = IsAprilFoolsActive();
			},
		}),
		new BooleanOptionButton({
			id: "classic_opal_balls",
			category: "opal_balls",
			display_name: "Style",
			text_on: "Classic",
			text_off: "Default",
			default_value: false,
		}),
		new BooleanOptionButton({
			id: "auto_save_enabled",
			category: "auto_save",
			display_name: "Auto Save",
			text_on: "ON",
			text_off: "OFF",
			default_value: true,
			on_update_func: UpdateAutoSaveInterval,
		}),
	];
}

function BuildOptionsMap(options_list) {
	let options_map = {};
	for (let i = 0; i < options_list.length; ++i) {
		const opt = options_list[i];
		options_map[opt.id] = opt;
	}
	return options_map;
}

const kOptionButtons = InitOptionButtons();
const kOptionButtonsMap = BuildOptionsMap(kOptionButtons);

function OnOptionButtonClick(id) {
	kOptionButtonsMap[id].OnClick();
}

function DefaultGlobalSettings() {
	settings = {
		show_hit_rates: false,
		favicon: -1,
		collapsed: {
			upgrades: false,
			machines: false,
			stats: true,
			options: true,
		},
	};
	for (let i = 0; i < kOptionButtons.length; ++i) {
		const opt = kOptionButtons[i];
		if (isFinite(opt.default_value)) {
			settings[opt.id] = opt.default_value;
		}
	}
	return settings;
}

function AutoPickFavicon(state) {
	const machine = ActiveMachine(state);
	const ball_types = machine.BallTypes();
	for (let i = ball_types.length - 1; i > 0; --i) {
		if (machine.IsBallTypeUnlocked(ball_types[i])) {
			return ball_types[i].name;
		}
	}
	return ball_types[0].name;
}

function UpdateFavicon(state) {
	const machine = ActiveMachine(state);
	const id = machine.GetSetting("favicon");
	const ball_types = machine.BallTypes();
	const name = (id >= 0 && id < ball_types.length) ? ball_types[id].name : AutoPickFavicon(state);
	document.getElementById("favicon").href = "favicon/" + name + ".png";
}

function UpdateFaviconChoice(elem) {
	ActiveMachine(state).GetSaveData().options.favicon = parseInt(elem.value);
	UpdateFavicon(state);
}

function UpdateBallOpacity(elem) {
	ActiveMachine(state).GetSaveData().options[elem.id] = elem.value;
}

function UpdateOpacitySlidersFromSaveFile(state) {
	const machine = ActiveMachine(state);
	const ball_types = machine.BallTypes();
	for (let i = 0; i < ball_types.length; ++i) {
		let id = ball_types[i].name + "_ball_opacity";
		let elem = document.getElementById(id);
		elem.value = machine.GetSetting(id);
	}
}

function UpdateFaviconChoiceFromSaveFile(state) {
	const machine = ActiveMachine(state);
	const ball_types = machine.BallTypes();
	let index = parseInt(machine.GetSetting("favicon"));
	let id = "auto_favicon";
	if (index >= 0) {
		id = ball_types[index].name + "_favicon";
	}
	let elem = document.getElementById(id);
	elem.checked = true;
}

function PopupTextOpacityForBallType(ball_type_index) {
	if (GetSetting("apply_opacity_to_popup_text")) {
		const machine = ActiveMachine(state);
		const ball_type_name = machine.BallTypes()[ball_type_index].name;
		return machine.GetSetting(ball_type_name + "_ball_opacity") / 100.0;
	} else {
		return 1.0;
	}
}

function InitOptions(state) {
	let category_html = {};
	const ball_types = ActiveMachine(state).BallTypes();
	let html = "<b>Opacity:</b>";
	for (let i = 0; i < ball_types.length; ++i) {
		let id = ball_types[i].name + "_ball_opacity";
		let display_name = ball_types[i].display_name + "Balls"
		let default_display = (i > 0) ? "none" : "block";
		html += '<div id="' + id + '_wrapper" class="opacitySlider" ';
		html += 'style="display: ' + default_display + ';">';
		html += '<input type="range" min="0" max="100" step="5" ';
		html += 'onchange="UpdateBallOpacity(this)" value="100" ';
		html += 'id="' + id + '" name="' + id + '">';
		html += '<label for="' + id + '">' + display_name + '</label>';
		if (ball_types[i].name == "opal") {
			html += '&nbsp;<span id="options_opal_balls"></span>'
		}
		html += '</div>';
	}
	category_html["opacity"] = html;

	html = "<b>Favicon:</b>";
	for (let i = -1; i < ball_types.length; ++i) {
		let id = (i < 0) ? "auto_favicon" : ball_types[i].name + "_favicon";
		let display_name =
			(i < 0) ? "Auto" : ball_types[i].display_name + "Ball";
		let default_display = (i > 0) ? "none" : "block";
		html += '<div id="' + id + '_wrapper" class="iconOption" ';
		html += 'style="display: ' + default_display + ';">';
		html += '<input type="radio" name="favicon_option" ';
		html += 'onchange="UpdateFaviconChoice(this)" ';
		html += 'value=' + i + ' ';
		html += 'id="' + id + '">';
		html += '<label for="' + id + '">' + display_name + '</label>';
		html += '</div>';
	}
	category_html["favicon"] = html;

	for (let i = 0; i < kOptionButtons.length; ++i) {
		let id = kOptionButtons[i].id;
		let category = kOptionButtons[i].category;
		let button_html =
			'<button type="button" class="' + kOptionButtons[i].class_name +
			'" id="button_' + id + '" onclick="OnOptionButtonClick(\'' + id +
			'\')"></button> '
		if (category_html[category]) {
			category_html[category] += button_html;
		} else {
			category_html[category] = button_html;
		}
	}

	for (let category_id in category_html) {
		UpdateInnerHTML("options_" + category_id, category_html[category_id]);
	}
}

function CloseModal(id) {
	document.getElementById(id).style.display = "none";
}

function ResizeModals() {
	const kSizeRatio = 0.7;
	const kPadding = 20;
	let content_width = kSizeRatio * window.innerWidth;
	let content_height = kSizeRatio * window.innerHeight;
	let modal_elems = document.getElementsByClassName("modal");
	for (let i = 0; i < modal_elems.length; ++i) {
		let modal_elem = modal_elems[i];
		let horizontal_pad =
			window.innerWidth * (1.0 - kSizeRatio) / 2.0 - kPadding;
		let vertical_pad =
			window.innerHeight * (1.0 - kSizeRatio) / 2.0 - kPadding;
		modal_elem.style.width = window.innerWidth + "px";
		modal_elem.style.height = window.innerHeight + "px";
		modal_elem.style["padding-left"] = horizontal_pad + "px";
		modal_elem.style["padding-right"] = horizontal_pad + "px";
		modal_elem.style["padding-top"] = vertical_pad + "px";
		modal_elem.style["padding-bottom"] = vertical_pad + "px";
		let content_elem = document.getElementById(modal_elem.id + "_content");
		content_elem.style.padding = kPadding + "px";
		content_elem.style.maxWidth = content_width + "px";
		content_elem.style.maxHeight = content_height + "px";
	}

	// Save file export modal
	let header_height = document.getElementById("export_message").offsetHeight;
	let exported_save_elem = document.getElementById("exported_save");
	exported_save_elem.style.width = (content_width - kPadding) + "px";
	exported_save_elem.style.height =
		(content_height - kPadding * 2 - header_height - 15) + "px";
}

function UpdateOptionsButtons() {
	for (let i = 0; i < kOptionButtons.length; ++i) {
		kOptionButtons[i].UpdateButton();
	}
}

function UpdateOpalBallUpgradesStyle() {
	const kClasses = [
		["opalUpgradeButton", "opalStaticUpgradeButton"],
		["opalUpgradeButtonLight", "opalStaticUpgradeButtonLight"],
		["opalUpgradeButtonDark", "opalStaticUpgradeButtonDark"],
	];

	const from_index = state.save_file.options.static_opal_ball_upgrade_buttons ? 0 : 1;
	const to_index = 1 - from_index;
	for (let i = 0; i < kClasses.length; ++i) {
		const from_class = kClasses[i][from_index];
		const to_class = kClasses[i][to_index];
		let elems = document.getElementsByClassName(from_class);
		for (let j = elems.length - 1; j >= 0; --j) {
			let elem = elems[j];
			elem.classList.add(to_class);
			elem.classList.remove(from_class);
		}
	}
}

function UpdateAutoSaveInterval() {
	if (state.save_file.options.auto_save_enabled) {
		if (!state.intervals.auto_save) {
			state.intervals.auto_save = setInterval(SaveToLocalStorage, 60000);
		}
	} else {
		if (state.intervals.auto_save) {
			clearInterval(state.intervals.auto_save);
			state.intervals.auto_save = null;
		}
	}
}

function ShouldDefaultToDarkMode() {
	if (!window.matchMedia) {
		return false;
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function OnNotationToggle() {
	state.update_upgrade_buttons_text = true;
	state.update_buff_display = true;
	state.redraw_wheel = true;
	state.reset_target_text = true;
	state.redraw_targets = true;
	state.update_stats_panel = true;
	UpdateSpinCounter();
}
