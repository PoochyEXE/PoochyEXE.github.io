const kAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

async function LoadAudio(src) {
	try {
		const response = await fetch(src);
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await kAudioCtx.decodeAudioData(arrayBuffer);
		return audioBuffer;
	} catch (err) {
		console.error(`Unable to fetch the audio file. Error: ${err.message}`);
	}
}
