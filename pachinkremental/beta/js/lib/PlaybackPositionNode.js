// From https://github.com/WebAudio/web-audio-api/issues/2397#issuecomment-1262583050
// Modified from https://github.com/kurtsmurf/whirly/blob/master/src/PlaybackPositionNode.js
// to report playback position in seconds, allow custom loop start and end, and add stop().

// playback position hack:
// https://github.com/WebAudio/web-audio-api/issues/2397#issuecomment-459514360

// composite audio node:
// https://github.com/GoogleChromeLabs/web-audio-samples/wiki/CompositeAudioNode

// extends the interface of AudioBufferSourceNode with a `playbackPosition` property
class PlaybackPositionNode extends AudioBufferSourceNode {
  constructor(context) {
	super(context);

    // initialize component audio nodes
    this._bufferSource = new AudioBufferSourceNode(context);
    this._splitter = new ChannelSplitterNode(context);
    this._out = new ChannelMergerNode(context);
    this._sampleHolder = new Float32Array(1);
	this._length_sec = 0;
  }

  // get current progress in seconds
  get playbackPosition() {
    this._analyser?.getFloatTimeDomainData(this._sampleHolder);
    return this._sampleHolder[0] * this._length_sec;
  }

  // creates an AudioBuffer with an extra `position` track
  set buffer(audioBuffer) {
    // create a new AudioBuffer of the same length as param with one extra channel
    // load it into the AudioBufferSourceNode
    this._bufferSource.buffer = new AudioBuffer({
      length: audioBuffer.length,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels + 1,
    });

	this._length_sec = audioBuffer.length / audioBuffer.sampleRate;

    // copy data from the audioBuffer arg to our new AudioBuffer
    for (let index = 0; index < audioBuffer.numberOfChannels; index++) {
      this._bufferSource.buffer.copyToChannel(
        audioBuffer.getChannelData(index),
        index,
      );
    }

    // fill up the position channel with numbers from 0 to 1
    for (let index = 0; index < audioBuffer.length; index++) {
      this._bufferSource.buffer.getChannelData(audioBuffer.numberOfChannels)[
        index
      ] = index / audioBuffer.length;
    }

    // split the channels
    this._bufferSource.connect(this._splitter);

    // connect all the audio channels to the line out
    for (let index = 0; index < audioBuffer.numberOfChannels; index++) {
      this._splitter.connect(this._out, index, index);
    }

    // connect the position channel to an analyzer so we can extract position data
    this._analyser = new AnalyserNode(this.context);
    this._splitter.connect(this._analyser, audioBuffer.numberOfChannels);
  }

  // forward component node properties

  get loop() {
    return this._bufferSource.loop;
  }

  set loop(val) {
    this._bufferSource.loop = val;
  }

  get loopStart() {
    return this._bufferSource.loopStart;
  }

  set loopStart(val) {
    this._bufferSource.loopStart = val;
  }

  get loopEnd() {
    return this._bufferSource.loopEnd;
  }

  set loopEnd(val) {
    this._bufferSource.loopEnd = val;
  }

  get playbackRate() {
    return this._bufferSource.playbackRate;
  }

  start(...args) {
    this._bufferSource.start(...args);
  }

  stop(...args) {
    this._bufferSource.stop(...args);
  }

  connect(...args) {
    this._out.connect(...args);
  }
}
