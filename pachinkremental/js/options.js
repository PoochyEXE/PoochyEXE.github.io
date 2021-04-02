const kQualityOptions = ["High", "Medium", "Low"];
const kPopupTextOptions = [
	"Enable All",
	"Gold+ only",
	"Gemstone+ only",
	"Disable All",
];
const kAprilFoolsOptions = [
	"Disabled",
	"Always On",
	"Enabled",
];
const kSaveFileVersion = 2;

function UpdateBallOpacity(elem) {
	state.save_file.options[elem.id] = elem.value;
}

function UpdateOpacitySlidersFromSaveFile(save_file) {
	for (let i = 0; i < kBallTypes.length; ++i) {
		let id = kBallTypes[i].name + "_ball_opacity";
		let elem = document.getElementById(id);
		elem.value = save_file.options[id];
	}
}

function InitOptions(state) {
	let opacity_div = document.getElementById("options_opacity");
	html = "<b>Opacity:</b>";
	for (let i = 0; i < kBallTypes.length; ++i) {
		let id = kBallTypes[i].name + "_ball_opacity";
		let display_name = kBallTypes[i].display_name + " Balls"
		let default_display = (i > 0) ? "none" : "block";
		html += '<div id="' + id + '_wrapper" class="opacitySlider" ';
		html += 'style="display: ' + default_display + ';">';
		html += '<input type="range" min="0" max="100" step="5" ';
		html += 'onchange="UpdateBallOpacity(this)" ';
		html += 'value="' + state.save_file.options[id] + '" ';
		html += 'id="' + id + '" name="' + id + '">';
		html += '<label for="' + id + '">' + display_name + '</label>';
		html += '</div>';
	}
	opacity_div.innerHTML = html;
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
	localStorage.setItem("save_file", SaveFileToString(state));
	state.notifications.push(new Notification("Game saved", "#8F8"));
}

function LoadGame(save_file_str) {
	let load_save = SaveFileFromString(save_file_str);
	if (load_save && load_save.game_version) {
		if (load_save.game_version > kSaveFileVersion) {
			state.notifications.push(
				new Notification(
					"Error: Save file appears to be from an incompatible future version.",
					"#F88"
				)
			);
		}
		default_state = InitState();
		state.save_file = { ...default_state.save_file, ...load_save };
		state.save_file.stats = {
			...default_state.save_file.stats,
			...load_save.stats
		};
		state.save_file.upgrade_levels = {
			...default_state.save_file.upgrade_levels,
			...load_save.upgrade_levels
		};
		state.save_file.options = {
			...default_state.save_file.options,
			...load_save.options
		};
		if (state.save_file.game_version < 2) {
			state.save_file.options.auto_save_enabled = state.save_file.auto_save_enabled;
			delete state.save_file.auto_save_enabled;
			state.save_file.options.auto_drop_enabled = state.save_file.auto_drop_enabled;
			delete state.save_file.auto_drop_enabled;
			state.save_file.options.auto_spin_enabled = state.save_file.auto_spin_enabled;
			delete state.save_file.auto_spin_enabled;
			state.save_file.options.multi_spin_enabled = state.save_file.multi_spin_enabled;
			delete state.save_file.multi_spin_enabled;
			state.save_file.options.april_fools_enabled = state.save_file.april_fools_enabled ? 2 : 0;
			delete state.save_file.april_fools_enabled;
			state.save_file.options.quality = state.save_file.quality;
			delete state.save_file.quality;
			state.save_file.options.display_popup_text = state.save_file.display_popup_text;
			delete state.save_file.display_popup_text;
		}
		state.save_file.game_version = kSaveFileVersion;
		state.display_score = state.save_file.stats.total_score;
		state.display_points = state.save_file.points;
		state.update_upgrade_buttons = true;
		state.bonus_wheel = default_state.bonus_wheel;
		state.redraw_wheel = true;
		for (let id in state.upgrades) {
			state.upgrades[id].Update();
		}
		if (state.save_file.stats.total_score > 0) {
			UpdateScoreDisplay(state, /*forceUpdate=*/ true);
		}
		UpdateUpgradeButtons(state);
		UpdateOptionsButtons();
		UpdateAutoSaveInterval();
		UpdateOpacitySlidersFromSaveFile(state.save_file);
		state.notifications.push(new Notification("Game loaded", "#8F8"));
	} else {
		state.notifications.push(
			new Notification(
				"Error: Save file appears to be corrupted!",
				"#F88"
			)
		);
	}
}

function LoadFromLocalStorage() {
	let save_file_str = localStorage.getItem("save_file");
	if (save_file_str) {
		LoadGame(save_file_str);
	}
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

function ExportSave() {
	document.getElementById("exported_save").innerHTML = SaveFileToString(
		state
	);
	document.getElementById("export_save_modal").style.display = "block";
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
		localStorage.removeItem("save_file");
		location.reload();
	}
}

function UpdateOptionsButtons() {
	document.getElementById("button_auto_save").innerHTML =
		"Auto Save: " + (state.save_file.options.auto_save_enabled ? "ON" : "OFF");
	document.getElementById("button_quality").innerHTML =
		"Quality: " + kQualityOptions[state.save_file.options.quality];
	document.getElementById("button_popup_text").innerHTML =
		"Pop-up text: " + kPopupTextOptions[state.save_file.options.display_popup_text];
	document.getElementById("button_april_fools").innerHTML =
		"April Fools: " + kAprilFoolsOptions[state.save_file.options.april_fools_enabled];
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
	++state.save_file.options.display_popup_text;
	if (
		state.save_file.options.display_popup_text == 1 &&
		!IsUnlocked("unlock_gold_balls")
	) {
		state.save_file.options.display_popup_text = kPopupTextOptions.length - 1;
	} else if (
		state.save_file.options.display_popup_text == 2 &&
		!AnyTier1GemstoneBallsUnlocked()
	) {
		state.save_file.options.display_popup_text = kPopupTextOptions.length - 1;
	}
	if (state.save_file.options.display_popup_text >= kPopupTextOptions.length) {
		state.save_file.options.display_popup_text = 0;
	}
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

function ToggleAprilFools() {
	++state.save_file.options.april_fools_enabled;
	if (state.save_file.options.april_fools_enabled >= kAprilFoolsOptions.length) {
		state.save_file.options.april_fools_enabled = 0;
	}
	UpdateOptionsButtons();
}
