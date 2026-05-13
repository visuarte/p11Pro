// VoiceAssistant.js
// Implements a light wrapper around Web Speech API (SpeechRecognition) and Web Audio API AnalyserNode.
// Exposes events via an internal EventTarget: 'state', 'transcript', 'finalTranscript', 'error', 'audioFrame'.

export default class VoiceAssistant {
  constructor(opts = {}) {
    this.lang = opts.lang || 'es-ES';
    this.continuous = opts.continuous !== false;
    this.interimResults = opts.interimResults !== false;
    this.state = 'idle';
    this.eventTarget = new EventTarget();
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this._polling = false;

    // Check for SpeechRecognition support
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.Rec = Rec ? Rec : null;
    if (!this.Rec) this._emit('error', { code: 'unsupported', message: 'SpeechRecognition no soportado' });
  }

  async start() {
    if (this.state === 'listening') return;
    try {
      await this._ensureMic();
      this._startRecognition();
      this._startAudioLoop();
      this._setState('listening');
    } catch (err) {
      this._emit('error', { code: 'mic', message: err.message || String(err) });
      this._setState('idle');
    }
  }

  stop() {
    this._stopRecognition();
    this._stopAudioLoop();
    this._setState('idle');
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch(_) {}
      this.audioContext = null;
      this.analyser = null;
    }
  }

  on(type, cb) { this.eventTarget.addEventListener(type, (e) => cb(e.detail)); }
  off(type, cb) { this.eventTarget.removeEventListener(type, cb); }

  getAnalyser() { return this.analyser; }

  async _ensureMic() {
    if (this.stream) return this.stream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia no soportado');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Setup AudioContext and analyser
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const src = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;
    src.connect(this.analyser);
    return this.stream;
  }

  _startRecognition() {
    if (!this.Rec) return;
    this.rec = new this.Rec();
    this.rec.lang = this.lang;
    this.rec.continuous = this.continuous;
    this.rec.interimResults = this.interimResults;
    this.rec.onstart = () => this._emit('state', { state: 'listening' });
    this.rec.onend = () => {
      // Chrome often ends; restart for continuous behavior
      if (this.state === 'listening') {
        setTimeout(() => this._startRecognition(), 250);
      }
    };
    this.rec.onerror = (e) => this._emit('error', e);
    this.rec.onresult = (ev) => {
      let interim = '';
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) this._emit('transcript', { interim });
      if (final) this._emit('finalTranscript', { final });
    };
    try { this.rec.start(); } catch (e) { /* some browsers throw if started twice */ }
  }

  _stopRecognition() {
    if (this.rec) {
      try { this.rec.onresult = null; this.rec.onend = null; this.rec.onerror = null; this.rec.stop(); } catch (e) {}
      this.rec = null;
    }
  }

  _startAudioLoop() {
    if (!this.analyser || this._polling) return;
    this._polling = true;
    const buf = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this._polling) return;
      this.analyser.getByteFrequencyData(buf);
      // emit the array copy
      this._emit('audioFrame', { freq: buf.slice(0) });
      requestAnimationFrame(tick);
    };
    tick();
  }

  _stopAudioLoop() { this._polling = false; }

  _setState(s) { this.state = s; this._emit('state', { state: s }); }

  _emit(type, detail) { this.eventTarget.dispatchEvent(new CustomEvent(type, { detail })); }
}

