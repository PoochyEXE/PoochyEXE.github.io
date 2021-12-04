class Notification {
	constructor(text, bgcolor) {
		this.text = text;
		this.bgcolor = bgcolor;
		this.start_time = performance.now();
	}
}

const kNotificationDuration = 3000.0;
const kNotificationFadeInTime = 250.0;
const kNotificationFadeOutTime = 250.0;
const kNotificationHeight = 30;

function CloseNotification(index) {
	state.notifications[index].start_time =
		performance.now() - kNotificationDuration + kNotificationFadeOutTime;
}

function UpdateNotifications(state) {
	if (state.notifications.length == 0) {
		return;
	}
	const kSpacing = 5;
	const time_now = performance.now();
	state.notifications = state.notifications.filter(
		notif => notif.start_time + kNotificationDuration >= time_now
	);
	let notifs_div = document.getElementById("notifications");

	let html = "";
	for (let i = state.notifications.length - 1; i >= 0; --i) {
		const notif = state.notifications[i];
		const end_time = notif.start_time + kNotificationDuration;
		const opening = time_now < notif.start_time + kNotificationFadeInTime;
		const closing = time_now > end_time - kNotificationFadeOutTime;

		let height_fraction = 1.0;
		if (opening) {
			height_fraction =
				(time_now - notif.start_time) / kNotificationFadeInTime;
		} else if (closing) {
			height_fraction = (end_time - time_now) / kNotificationFadeOutTime;
		}

		let spacing_height = Math.ceil(
			(kNotificationHeight + kSpacing) * height_fraction
		);
		if (spacing_height < 1) {
			continue;
		}
		let height = Math.max(0, spacing_height - kSpacing);
		let notif_html =
			'<div style="height: ' +
			spacing_height +
			'px; clear: both;"><button class="notification" style="background: ' +
			notif.bgcolor +
			"; height: " +
			height +
			'px;"';
		if (!opening && !closing) {
			notif_html += ' onmousedown="CloseNotification(' + i + ')"';
		}
		notif_html += ">";
		notif_html += notif.text;
		notif_html += "</button></div>";
		html += notif_html;
	}
	if (notifs_div.innerHTML != html) {
		notifs_div.innerHTML = html;
	}
}
