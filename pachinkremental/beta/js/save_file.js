const kIsLiveVersion = false;
const kLiveSaveFileName = "save_file";
const kBetaSaveFileName = "beta_save_file";
const kSaveFileVersion = 7;
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

	// 3
	{
		archive_id: null,
		last_version: "v1.0.1-RC2",
	},

	// 4
	{
		archive_id: null,
		last_version: "v1.1.1",
	},

	// 5
	{
		archive_id: null,
		last_version: "v1.7.1-beta",
	},

	// 6
	{
		archive_id: null,
		last_version: "v2.0.8",
	},
];

// Deprecated.
function SaveFileToStringV1(state) {
	let inner_data = JSON.stringify(state.save_file);
	return btoa(JSON.stringify([inner_data, SaveFileChecksum(inner_data)]));
}

// Only used for backwards compatibility with old save files
// (v2.1.1-beta and older)
function SaveFileFromStringV1(save_file_str) {
	let outer_data = JSON.parse(atob(save_file_str));
	if (SaveFileChecksum(outer_data[0]) != outer_data[1]) {
		return null;
	}
	return JSON.parse(outer_data[0]);
}

function SaveFileToStringV2(state) {
	let inner_data = JSON.stringify(state.save_file);
	let outer_data = LZString.compressToBase64(
		inner_data + "|" + SaveFileChecksum(inner_data)
	);
	return "2|" + outer_data;
}

function SaveFileFromStringV2(save_file_str) {
	let outer_data = save_file_str.split("|");
	let inner_data = LZString.decompressFromBase64(outer_data[1]).split("|");
	let checksum = SaveFileChecksum(inner_data[0]);
	if (checksum != inner_data[1]) {
		console.error(
			"Incorrect save file checksum!" +
			"\nExpected: " + inner_data[1] +
			"\nActual: " + checksum +
			"\nSave file: " + save_file_str
		);
		return null;
	}
	return JSON.parse(inner_data[0]);
}

function SaveFileFromString(save_file_str) {
	if (!save_file_str) {
		return null;
	}
	try {
		if (save_file_str.startsWith("2|")) {
			return SaveFileFromStringV2(save_file_str);
		} else {
			return SaveFileFromStringV1(save_file_str);
		}
	} catch (error) {
		console.error("Could not parse save file: " + save_file_str);
		return null;
	}
}

function SaveToLocalStorage() {
	if (!state.game_started) {
		return;
	}
	localStorage.setItem(kSaveFileName, SaveFileToStringV2(state));
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
		state.save_file.stats.machine_maxed_times = {
			...default_state.save_file.stats.machine_maxed_times,
			...load_save.stats.machine_maxed_times
		};
		state.save_file.options = {
			...default_state.save_file.options,
			...load_save.options
		};
		state.save_file.options.collapsed = {
			...default_state.save_file.options.collapsed,
			...load_save.options.collapsed
		};
		if (load_save.game_version < 6) {
			state.save_file.options.notation =
				load_save.options.scientific_notation ? 1 : 0;
			delete state.save_file.options.scientific_notation;
		}
		if (load_save.game_version < 7) {
			delete state.save_file.options.display_popup_text;
		}
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
				if (key == "collapsed") {
					continue;
				}
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
				state.save_file.machines[machine_id].options.collapsed = {
					...default_state.save_file.machines[machine_id].options.collapsed,
					...load_save.machines[machine_id].options.collapsed
				};
			}
		}
		for (let i = 0; i < state.machines.length; ++i) {
			const machine_id = state.machines[i].id;
			const upgrades = state.machines[i].upgrades;
			let machine_save = state.save_file.machines[machine_id];
			for (let upgrade_id in upgrades) {
				let max_level = upgrades[upgrade_id].max_level;
				if (machine_save.upgrade_levels[upgrade_id] > max_level) {
					machine_save.upgrade_levels[upgrade_id] = max_level;
				}
			}
			state.machines[i].CheckMachineMaxed();
		}
		for (let i = 0; i < state.machines.length; ++i) {
			if (state.machines[i].id == state.save_file.active_machine) {
				state.active_machine_index = i;
				break;
			}
		}
		state.save_file.game_version = kSaveFileVersion;
		state.update_upgrade_buttons_all = true;
		state.update_buff_display = true;
		state.redraw_wheel = true;
		if (!kIsLiveVersion) {
			state.save_file.is_beta = true;
		}
		LoadActiveMachine(state);
		if (ActiveMachine(state).GetSaveData().points) {
			UpdateScoreDisplay(state, /*forceUpdate=*/ true);
		}
		UpdateOptionsButtons();
		UpdateAutoSaveInterval();
		UpdateCollapsibles(state.save_file.options.collapsed);
		CheckAllMachinesMaxed(state);
		state.notifications.push(new Notification("Game loaded", "#8F8"));
		state.game_started = true;
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
	export_textarea.innerHTML = SaveFileToStringV2(state);
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
