export function createAudio() {
  let ctx = null;
  let master = null;
  let sizzleGain = null;
  let muted = false;

  function makeNoise(seconds) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);

    const noise = makeNoise(2.2);

    const bed = ctx.createBufferSource();
    bed.buffer = noise;
    bed.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = "lowpass";
    bedFilter.frequency.value = 240;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.05;
    bed.connect(bedFilter).connect(bedGain).connect(master);
    bed.start();

    const sizzle = ctx.createBufferSource();
    sizzle.buffer = noise;
    sizzle.loop = true;
    const sizzleFilter = ctx.createBiquadFilter();
    sizzleFilter.type = "bandpass";
    sizzleFilter.frequency.value = 3400;
    sizzleFilter.Q.value = 0.7;
    sizzleGain = ctx.createGain();
    sizzleGain.gain.value = 0;
    sizzle.connect(sizzleFilter).connect(sizzleGain).connect(master);
    sizzle.start();
  }

  function setSizzle(level) {
    if (!ctx || !sizzleGain) return;
    const value = Math.max(0, Math.min(0.2, level));
    sizzleGain.gain.setTargetAtTime(value, ctx.currentTime, 0.25);
  }

  function blip(freq, at, gainValue) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 0.3);
  }

  function coin() {
    if (!ctx) return;
    const t = ctx.currentTime;
    blip(1960, t, 0.16);
    blip(2640, t + 0.055, 0.13);
  }

  function click() {
    if (!ctx) return;
    const t = ctx.currentTime;
    blip(880, t, 0.05);
  }

  function toggle() {
    muted = !muted;
    if (master && ctx) {
      master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
    }
    return muted;
  }

  return {
    ensure,
    setSizzle,
    coin,
    click,
    toggle,
    get muted() {
      return muted;
    },
  };
}
