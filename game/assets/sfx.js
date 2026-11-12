/* SFX.js — efek suara + musik latar disintesis via Web Audio API.
   Tanpa file audio eksternal: aman dari CORS di file://, tanpa masalah lisensi. */
const SFX = (() => {
  let ctx = null, masterGain = null, musicGain = null, sfxGain = null;
  let muted = false;
  try { muted = localStorage.getItem('cpns_audio_muted') === '1'; } catch (e) {}

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.22;
      musicGain.connect(masterGain);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(masterGain);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', gain = 0.3, delay = 0, dest = null, slideTo = null } = {}) {
    ensureCtx();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(dest || sfxGain);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }

  function noiseBurst(dur, { gain = 0.3, delay = 0, filterFreq = null } = {}) {
    ensureCtx();
    const t0 = ctx.currentTime + delay;
    const bufSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    let node = src;
    if (filterFreq) {
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = filterFreq;
      src.connect(filt); node = filt;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g); g.connect(sfxGain);
    src.start(t0);
  }

  const api = {};
  api.click = () => tone(700, 0.05, { type: 'square', gain: 0.12 });
  api.hit = () => { tone(880, 0.08, { type: 'square', gain: 0.22 }); tone(1200, 0.08, { type: 'square', gain: 0.14, delay: 0.04 }); };
  api.miss = () => tone(180, 0.25, { type: 'sawtooth', gain: 0.18, slideTo: 80 });
  api.correct = () => { tone(523.25, 0.12, { gain: 0.22 }); tone(659.25, 0.12, { gain: 0.22, delay: 0.1 }); tone(783.99, 0.22, { gain: 0.28, delay: 0.2 }); };
  api.wrong = () => { tone(200, 0.3, { type: 'sawtooth', gain: 0.22 }); tone(150, 0.35, { type: 'sawtooth', gain: 0.18, delay: 0.05 }); };
  api.loseLife = () => noiseBurst(0.3, { gain: 0.28, filterFreq: 800 });
  api.lock = () => tone(440, 0.1, { type: 'square', gain: 0.2 });
  api.tick = () => tone(1000, 0.04, { type: 'square', gain: 0.1 });
  api.lifeline = () => { tone(660, 0.1, { type: 'triangle', gain: 0.18 }); tone(880, 0.1, { type: 'triangle', gain: 0.18, delay: 0.08 }); };
  api.walk = () => { tone(392, 0.15, { gain: 0.22 }); tone(494, 0.15, { gain: 0.22, delay: 0.12 }); tone(587, 0.2, { gain: 0.24, delay: 0.24 }); };
  api.jackpot = () => { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.35, { gain: 0.28, delay: i * 0.13 })); };
  api.fold = () => noiseBurst(0.4, { gain: 0.14, filterFreq: 2000 });
  api.gameOver = () => { tone(300, 0.3, { type: 'sawtooth', gain: 0.18 }); tone(200, 0.4, { type: 'sawtooth', gain: 0.18, delay: 0.2 }); tone(120, 0.5, { type: 'sawtooth', gain: 0.18, delay: 0.4 }); };

  // musik latar: sequencer sederhana berbasis setTimeout.
  // ponytail: bisa drift di bawah beban berat; upgrade ke AudioContext lookahead scheduler kalau jadi masalah nyata.
  const SCALES = {
    carnival: [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77],
    ambient: [220, 261.63, 293.66, 329.63, 392, 440],
    tense: [220, 233.08, 261.63, 277.18, 311.13],
  };
  const MUSIC_PATTERNS = {
    tembak: { scale: 'carnival', notes: [0, 2, 4, 2, 5, 4, 2, 0], tempo: 320, type: 'triangle', gain: 0.11 },
    ruang: { scale: 'ambient', notes: [0, 2, 3, 2, 4, 3, 2, 0], tempo: 600, type: 'sine', gain: 0.09 },
    kuis: { scale: 'tense', notes: [0, 1, 0, 2, 0, 1, 3, 0], tempo: 480, type: 'sine', gain: 0.08 },
  };
  let currentTrack = null, musicTimer = null;

  function startMusic(name) {
    stopMusic();
    const pat = MUSIC_PATTERNS[name];
    if (!pat) return;
    ensureCtx();
    currentTrack = name;
    const scale = SCALES[pat.scale];
    let step = 0;
    (function playStep() {
      if (currentTrack !== name) return;
      const note = scale[pat.notes[step % pat.notes.length]];
      tone(note, pat.tempo / 1000 * 0.9, { type: pat.type, gain: pat.gain, dest: musicGain });
      step++;
      musicTimer = setTimeout(playStep, pat.tempo);
    })();
  }
  function stopMusic() {
    currentTrack = null;
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  }
  api.startMusic = startMusic;
  api.stopMusic = stopMusic;

  api.toggleMute = () => {
    muted = !muted;
    try { localStorage.setItem('cpns_audio_muted', muted ? '1' : '0'); } catch (e) {}
    ensureCtx();
    masterGain.gain.value = muted ? 0 : 1;
    return muted;
  };
  api.isMuted = () => muted;
  api.unlock = () => ensureCtx();

  return api;
})();
