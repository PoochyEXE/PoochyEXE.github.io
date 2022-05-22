
function SetCollapsibleHeaderState(id, collapse) {
	let collapsed_display = document.getElementById(id + "_collapsed");
	let contents = document.getElementById(id + "_contents");
	if (contents && collapsed_display) {
		contents.style.height = collapse ? "0px" : "auto";
		collapsed_display.innerHTML = collapse ? "[+]" : "[&ndash;]";
	}

	let header = document.getElementById("button_" + id + "_header");
	if (header) {
		let options = header.classList.contains("upgradesSubHeader") ?
				ActiveMachine(state).GetSaveData().options :
				state.save_file.options;
		options.collapsed[id] = collapse;
	}

	if (!collapse) {
		let header_new = document.getElementById(id + "_header_new");
		if (header_new) {
			header_new.style.display = "none";
		}
	}
}

function UpdateCollapsibles(collapsed_options) {
	for (let id in collapsed_options) {
		SetCollapsibleHeaderState(id, collapsed_options[id]);
	}
}

function ToggleVisibility(id) {
	SetCollapsibleHeaderState(id, !IsCollapsed(id));
}

function IsCollapsed(panel_name) {
	let contents = document.getElementById(panel_name + "_contents");
	if (!contents) {
		return undefined;
	}
	return contents.style.height == "0px";
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
