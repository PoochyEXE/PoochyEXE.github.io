
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
	localStorage.setItem('save_file', SaveFileToString(state));
	state.notifications.push(new Notification("Game saved", "#8F8"));
}

function LoadGame(save_file_str) {
	let load_save = SaveFileFromString(save_file_str);
	if (load_save && load_save.game_version) {
		default_state = InitState();
		state.save_file = {...default_state.save_file, ...load_save};
		state.save_file.stats = {...default_state.save_file.stats, ...load_save.stats};
		state.save_file.upgrade_levels = {...default_state.save_file.upgrade_levels, ...load_save.upgrade_levels};
		state.display_score = state.save_file.stats.total_score;
		state.display_points = state.save_file.points;
		state.update_upgrade_buttons = true;
		state.bonus_wheel = default_state.bonus_wheel;
		state.redraw_wheel = true;
		for (let id in state.upgrades) {
			state.upgrades[id].Update();
		}
		if (state.save_file.stats.total_score > 0) {
			UpdateScoreDisplay(state, /*forceUpdate=*/true);
		}
		UpdateUpgradeButtons(state);
		UpdateOptionsButtons();
		UpdateAutoSaveInterval();
		state.notifications.push(new Notification("Game loaded", "#8F8"));
	} else {
		state.notifications.push(new Notification("Error: Save file appears to be corrupted!", "#F88"));
	}
}

function LoadFromLocalStorage() {
	let save_file_str = localStorage.getItem('save_file');
	if (save_file_str) {
		LoadGame(save_file_str);
	}
}

function ImportSave() {
	let save_file_str = prompt("Paste your save file below.\nCAUTION: This will overwrite your current save file!", "");

	if (save_file_str != null && save_file_str != "") {
		LoadGame(save_file_str);
	} 
}

function ExportSave() {
	prompt("Your save file is below. Copy the text and keep it someplace safe.", SaveFileToString(state));
}

function EraseSave() {
	const kCaution = "\u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0 CAUTION!! \u26A0\n\n"
	let answer = prompt(kCaution + "This will erase all your progress and restart the game from scratch!\n\n" + kCaution +
			"\nIf you are really sure, type \"DELETE\" in all caps below, then click OK.", "");
	if (answer == "DELETE") {
		localStorage.removeItem('save_file')
		state = InitState();
		Load();
		state.notifications.push(new Notification("Save file erased", "#F88"));
	}
}

function UpdateOptionsButtons() {
	document.getElementById("button_auto_save").innerHTML = "Auto Save: " + 
		(state.save_file.auto_save_enabled ? "ON" : "OFF");
	document.getElementById("button_quality").innerHTML = "Quality: " + 
		kQualityOptions[state.save_file.quality];
}

function UpdateAutoSaveInterval() {
	if (state.save_file.auto_save_enabled) {
		if (!state.intervals.auto_save) {
			state.intervals.auto_save = setInterval(SaveToLocalStorage, 60000);
		}
		document.getElementById("button_auto_save").innerHTML = "Auto Save: ON"
	} else {
		if (state.intervals.auto_save) {
			clearInterval(state.intervals.auto_save);
			state.intervals.auto_save = null;
		}
		document.getElementById("button_auto_save").innerHTML = "Auto Save: OFF"
	}
}

function ToggleAutoSave() {
	state.save_file.auto_save_enabled = !state.save_file.auto_save_enabled;
	UpdateAutoSaveInterval();
	UpdateOptionsButtons();
}

function ToggleQuality() {
	++state.save_file.quality;
	if (state.save_file.quality >= kQualityOptions.length) {
		state.save_file.quality = 0;
	}
	state.redraw_all = true;
	UpdateOptionsButtons();
}
