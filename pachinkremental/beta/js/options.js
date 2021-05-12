const kQualityOptions = ["High", "Medium", "Low"];
const kAprilFoolsOptions = ["Disabled", "Always On", "Enabled"];
const kMaxedUpgradesOptions = ["Full Size", "Shrink"];
const kIsLiveVersion = false;
const kLiveSaveFileName = "save_file";
const kBetaSaveFileName = "beta_save_file";
const kSaveFileVersion = 5;
const kSaveFileName = kIsLiveVersion ? kLiveSaveFileName : kBetaSaveFileName;

const kPrevSaveFileVersions = [
	// 0
	// There was never a version 0, since 0 is falsey in JS and I want
	// "!save_file.game_version" to imply a save file is corrupted.
	null,

	// 1
	{
		archive_id: null,
		last_version: "v0.6.2 beta",
	},

	// 2
	{
		archive_id: "beta_0",
		last_version: "v0.12.2 beta",
	},
];

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

function InitOptions(state) {
	const machine = ActiveMachine(state);
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

function SaveFileToString(state) {
	let inner_data = JSON.stringify(state.save_file);
	return btoa(JSON.stringify([inner_data, SaveFileChecksum(inner_data)]));
}

function SaveFileFromString(save_file_str) {
	if (!save_file_str) {
		return null;
	}
	try {
		let outer_data = JSON.parse(atob(save_file_str));
		if (SaveFileChecksum(outer_data[0]) != outer_data[1]) {
			return null;
		}
		return JSON.parse(outer_data[0]);
	} catch (error) {
		console.error("Could not parse save file: " + save_file_str);
		return null;
	}
}

function SaveToLocalStorage() {
	localStorage.setItem(kSaveFileName, SaveFileToString(state));
	state.notifications.push(new Notification("Game saved", "#8F8"));
}

function LoadGame(save_file_str) {
	let load_save = SaveFileFromString(save_file_str);
	if (load_save && load_save.game_version) {
		if (kIsLiveVersion && load_save.is_beta) {
			state.notifications.push(
				new Notification(
					"Error: Beta version save files are incompatible with the live version.",
					"#F88"
				)
			);
			return false;
		}
		if (load_save.game_version > kSaveFileVersion) {
			state.notifications.push(
				new Notification(
					"Error: Save file appears to be from an incompatible future version.",
					"#F88"
				)
			);
			return false;
		}
		if (load_save.game_version < 3) {
			ArchiveSaveFile(2, save_file_str);
			const kVer3UpgradeMessage =
				"<b>Pachinkremental is out of beta!</b><br><br>Unfortunately, save files from the beta are not compatible with the new version, but you can continue playing v0.12.2 beta using your previous save file if you want. (You can also retrieve this archived save file from the Options menu.)"
			ExportArchivedSave(2, kVer3UpgradeMessage);
			return false;
		}
		default_state = InitState();
		state.save_file = { ...default_state.save_file, ...load_save };
		state.save_file.stats = {
			...default_state.save_file.stats,
			...load_save.stats
		};
		state.save_file.options = {
			...default_state.save_file.options,
			...load_save.options
		};
		if (load_save.game_version < 5) {
			let first_machine_save = state.save_file.machines[kFirstMachineID];
			for (let key in first_machine_save) {
				if (key == "options" || key == "stats") {
					continue;
				}
				first_machine_save[key] = state.save_file[key];
				delete state.save_file[key];
			}
			for (let key in first_machine_save.stats) {
				first_machine_save.stats[key] = state.save_file.stats[key];
				delete state.save_file.stats[key];
			}
			for (let key in first_machine_save.options) {
				first_machine_save.options[key] = state.save_file.options[key];
				delete state.save_file.options[key];
			}
		} else {
			for (let machine_id in default_state.save_file.machines) {
				state.save_file.machines[machine_id] = {
					...default_state.save_file.machines[machine_id],
					...load_save.machines[machine_id]
				};
				state.save_file.machines[machine_id].stats = {
					...default_state.save_file.machines[machine_id].stats,
					...load_save.machines[machine_id].stats
				};
				state.save_file.machines[machine_id].upgrade_levels = {
					...default_state.save_file.machines[machine_id].upgrade_levels,
					...load_save.machines[machine_id].upgrade_levels
				};
				state.save_file.machines[machine_id].options = {
					...default_state.save_file.machines[machine_id].options,
					...load_save.machines[machine_id].options
				};
			}
		}
		for (let i = 0; i < state.machines.length; ++i) {
			if (state.machines[i].id == state.save_file.active_machine) {
				state.active_machine_index = i;
				break;
			}
		}
		state.save_file.game_version = kSaveFileVersion;
		state.update_upgrade_buttons = true;
		state.update_buff_display = true;
		state.bonus_wheel = default_state.bonus_wheel;
		state.redraw_wheel = true;
		if (!kIsLiveVersion) {
			state.save_file.is_beta = true;
		}
		LoadActiveMachine(state);
		if (ActiveMachine(state).GetSaveData().stats.total_score > 0) {
			UpdateScoreDisplay(state, /*forceUpdate=*/ true);
		}
		UpdateOptionsButtons();
		UpdateAutoSaveInterval();
		UpdateDarkMode();
		UpdateMachinesHeader(state);
		UpdateFavicon(state);
		UpdateOpacitySlidersFromSaveFile(state);
		UpdateFaviconChoiceFromSaveFile(state);
		state.notifications.push(new Notification("Game loaded", "#8F8"));
		return true;
	} else {
		state.notifications.push(
			new Notification(
				"Error: Save file appears to be corrupted!",
				"#F88"
			)
		);
		return false;
	}
}

function LoadFromLocalStorage() {
	let save_file_str = localStorage.getItem(kSaveFileName);
	if (save_file_str) {
		return LoadGame(save_file_str);
	} else if (!kIsLiveVersion) {
		DisplayBetaIntro();
	}
	return false;
}

function ImportSave() {
	let save_file_str = prompt(
		"Paste your save file below.\nCAUTION: This will overwrite your current save file!",
		""
	);

	if (save_file_str != null && save_file_str != "") {
		LoadGame(save_file_str);
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

function ArchiveSaveFile(save_file_ver, save_file_str) {
	let ver_info = kPrevSaveFileVersions[save_file_ver];
	let save_file_id = ver_info.archive_id + "_archived_save_file";
	localStorage.setItem(save_file_id, save_file_str);
}

function ExportArchivedSave(save_file_ver, message_prefix) {
	let ver_info = kPrevSaveFileVersions[save_file_ver];
	let export_message = "";
	if (message_prefix) {
		export_message = message_prefix + "<br><br>";
	}
	export_message +=
		"Your archived save file for <b>" + ver_info.last_version +
		"</b> is below. Copy the text and keep it someplace safe."
	export_message +=
		'<br>You can import this save file into the corresponding archived version of the game. See the <a href="https://github.com/PoochyEXE/PoochyEXE.github.io/tree/main/pachinkremental#archived-versions" target="_blank" rel="noopener noreferrer">manual</a> for a list of archived versions.'
	UpdateInnerHTML("export_message", export_message);
	let export_textarea = document.getElementById("exported_save");
	let save_file_id = ver_info.archive_id + "_archived_save_file";
	export_textarea.innerHTML = localStorage.getItem(save_file_id);
	export_textarea.focus();
	export_textarea.select();
	document.getElementById("export_save_modal").style.display = "block";
	ResizeModals();
}

function DisplayBetaIntro() {
	let message =
		'<b>Welcome to the beta version of Pachinkremental!</b><br><br>' +
		'Beta version save files are separate from the live version.<br><br>' +
		'<span class="warning">CAUTION: Beta save files may occasionally be wiped or archived!</span><br><br>' +
		'You can import a live version save into the beta, but <span class="warning">beta version saves cannot be imported back into the live version.</span><br><br>' +
		'For your convenience, your save file from the live version is below.';
	UpdateInnerHTML("export_message", message);
	let export_textarea = document.getElementById("exported_save");
	export_textarea.innerHTML = localStorage.getItem(kLiveSaveFileName);
	export_textarea.focus();
	export_textarea.select();
	document.getElementById("export_save_modal").style.display = "block";
	ResizeModals();
}

function DisplayArchivedSaveFileButtons() {
	let html = ""
	for (let i = 1; i < kPrevSaveFileVersions.length; ++i) {
		let ver_info = kPrevSaveFileVersions[i];
		if (!ver_info) {
			continue;
		}
		if (!ver_info.archive_id) {
			continue;
		}
		let save_file_id = ver_info.archive_id + "_archived_save_file";
		if (!localStorage.getItem(save_file_id)) {
			continue;
		}
		html += '<button type="button" class="optionButton" ';
		html += 'id="button_export_archived_save_file_' + i + '" ';
		html += 'onclick="ExportArchivedSave(' + i + ')">';
		html += 'Export archived save file (' + ver_info.last_version + ')';
		html += '</button>';
	}
	UpdateInnerHTML("options_archived_save_files", html);
}

function ExportSave() {
	UpdateInnerHTML(
		"export_message",
		"Your save file is below. Copy the text and keep it someplace safe."
	);
	let export_textarea = document.getElementById("exported_save");
	export_textarea.innerHTML = SaveFileToString(state);
	export_textarea.focus();
	export_textarea.select();
	document.getElementById("export_save_modal").style.display = "block";
	ResizeModals();
}

function EraseSave() {
	const kCaution =
		"\u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0\n\n";
	let answer = prompt(
		kCaution +
			"This will erase all your progress and restart the game from scratch!\n\n" +
			kCaution +
			'\nIf you are really sure, type "DELETE" in all caps below, then click OK.',
		""
	);
	if (answer == "DELETE") {
		localStorage.removeItem(kSaveFileName);
		location.reload();
	}
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
	UpdateInnerHTML("button_scientific_notation",
		"Scientific Notation: " + (state.save_file.options.scientific_notation ? "ON" : "OFF"));
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

function ToggleScientificNotation(id) {
	state.save_file.options.scientific_notation =
		!state.save_file.options.scientific_notation;
	state.update_upgrade_buttons = true;
	state.update_buff_display = true;
	state.redraw_wheel = true;
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
	UpdateOptionsButtons();
}
