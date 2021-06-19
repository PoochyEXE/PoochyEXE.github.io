const kQualityOptions = ["High", "Medium", "Low"];
const kAprilFoolsOptions = ["Disabled", "Always On", "Enabled"];
const kMaxedUpgradesOptions = ["Full Size", "Shrink"];
const kNotationOptions = ["English", "Scientific", "Engineering", "漢字"];

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
	new ColorSchemeClassMapping("eightBallUpgradeButton", "eightBallUpgradeButtonLight", "eightBallUpgradeButtonDark"),
	new ColorSchemeClassMapping("beachBallUpgradeButton", "beachBallUpgradeButtonLight", "beachBallUpgradeButtonDark"),
	new ColorSchemeClassMapping("machineButton", "machineButtonLight", "machineButtonDark"),
	new ColorSchemeClassMapping("optionButton", "optionButtonLight", "optionButtonDark"),
	new ColorSchemeClassMapping("optionButtonRed", "optionButtonRedLight", "optionButtonRedDark"),
	new ColorSchemeClassMapping("modalContent", "modalContentLight", "modalContentDark"),
	new ColorSchemeClassMapping("modalCloseButton", "modalCloseButtonLight", "modalCloseButtonDark"),
	new ColorSchemeClassMapping("prismaticText", "prismaticTextLight", "prismaticTextDark"),
	new ColorSchemeClassMapping("speedrunTimerCompleted", "speedrunTimerCompletedLight", "speedrunTimerCompletedDark"),
	new ColorSchemeClassMapping("exportedSave", "exportedSaveLight", "exportedSaveDark"),
];

function GetSetting(id) {
	if (!state) {
		return undefined;
	}
	return state.save_file.options[id];
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
			html += '&nbsp;<button type="button" class="optionButton" id="button_classic_opal_balls" onclick="ToggleBooleanOption(\'classic_opal_balls\')">Opal Balls</button>'
		}
		html += '</div>';
	}
	UpdateInnerHTML("options_opacity", html);

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
	UpdateInnerHTML("options_favicon", html);
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
	const machine = ActiveMachine(state);
	UpdateInnerHTML("button_auto_save",
		"Auto Save: " + (state.save_file.options.auto_save_enabled ? "ON" : "OFF"));
	UpdateInnerHTML("button_quality",
		"Quality: " + kQualityOptions[state.save_file.options.quality]);
	UpdateInnerHTML("button_dark_mode",
		"Dark Mode: " + (state.save_file.options.dark_mode ? "ON" : "OFF"));
	UpdateInnerHTML("button_popup_text",
		"Pop-up text: " + machine.CurrentPopupTextOptionName());
	UpdateInnerHTML("button_upgrade_levels_bought",
		"Upgrade levels bought: " + (state.save_file.options.show_upgrade_levels ? "Show" : "Hide"));
	UpdateInnerHTML("button_maxed_upgrades",
		"Maxed upgrades: " + kMaxedUpgradesOptions[state.save_file.options.maxed_upgrades]);
	UpdateInnerHTML("button_april_fools",
		"April Fools: " + kAprilFoolsOptions[GetSetting("april_fools_enabled")]);
	UpdateInnerHTML("button_classic_opal_balls",
		"Style: " + (state.save_file.options.classic_opal_balls ? "Classic" : "Default"));
	UpdateInnerHTML("button_notation",
		"Notation: " + kNotationOptions[GetSetting("notation")]);
	UpdateInnerHTML("button_apply_opacity_to_popup_text",
		"Apply opacity settings to pop-up text: " + (state.save_file.options.apply_opacity_to_popup_text ? "ON" : "OFF"));
	UpdateDisplay("button_show_combos", ActiveMachine(state).IsUnlocked("unlock_combos") ? "inline" : "none");
	UpdateInnerHTML("button_show_combos",
		"Show combos: " + (state.save_file.options.show_combos ? "ON" : "OFF"));
}

function UpdateAutoSaveInterval() {
	if (state.save_file.options.auto_save_enabled) {
		if (!state.intervals.auto_save) {
			state.intervals.auto_save = setInterval(SaveToLocalStorage, 60000);
		}
		document.getElementById("button_auto_save").innerHTML = "Auto Save: ON";
	} else {
		if (state.intervals.auto_save) {
			clearInterval(state.intervals.auto_save);
			state.intervals.auto_save = null;
		}
		document.getElementById("button_auto_save").innerHTML =
			"Auto Save: OFF";
	}
}

function ToggleAutoSave() {
	state.save_file.options.auto_save_enabled = !state.save_file.options.auto_save_enabled;
	UpdateAutoSaveInterval();
	UpdateOptionsButtons();
}

function TogglePopupText() {
	ActiveMachine(state).TogglePopupText();
	UpdateOptionsButtons();
}

function ToggleQuality() {
	++state.save_file.options.quality;
	if (state.save_file.options.quality >= kQualityOptions.length) {
		state.save_file.options.quality = 0;
	}
	state.redraw_all = true;
	UpdateOptionsButtons();
}

function ToggleDarkMode() {
	state.save_file.options.dark_mode = !state.save_file.options.dark_mode;
	state.redraw_all = true;
	UpdateDarkMode();
	UpdateOptionsButtons();
}

function ToggleNotation() {
	++state.save_file.options.notation;
	if (state.save_file.options.notation >= kNotationOptions.length) {
		state.save_file.options.notation = 0;
	}
	state.update_upgrade_buttons = true;
	state.update_buff_display = true;
	state.redraw_wheel = true;
	state.reset_target_text = true;
	state.redraw_targets = true;
	state.update_stats_panel = true;
	UpdateSpinCounter();
	UpdateOptionsButtons();
}

function ToggleBooleanOption(id) {
	state.save_file.options[id] = !state.save_file.options[id];
	UpdateOptionsButtons();
}

function ToggleShowUpgradeLevels() {
	state.save_file.options.show_upgrade_levels =
		!state.save_file.options.show_upgrade_levels;
	state.update_upgrade_buttons = true;
	UpdateOptionsButtons();
}

function ToggleMaxedUpgrades() {
	++state.save_file.options.maxed_upgrades;
	if (state.save_file.options.maxed_upgrades >= kMaxedUpgradesOptions.length) {
		state.save_file.options.maxed_upgrades = 0;
	}
	state.update_upgrade_buttons = true;
	UpdateOptionsButtons();
}

function ToggleAprilFools() {
	++state.save_file.options.april_fools_enabled;
	if (state.save_file.options.april_fools_enabled >= kAprilFoolsOptions.length) {
		state.save_file.options.april_fools_enabled = 0;
	}
	state.april_fools = IsAprilFoolsActive();
	UpdateOptionsButtons();
}
