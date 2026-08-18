function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function updateReadingRoomToggles() {
  $$(".sound-toggle").forEach(toggle => {
    toggle.textContent = readingRoomEnabled ? "Reading Room: On" : "Reading Room: Off";
    toggle.classList.toggle("is-on", readingRoomEnabled);
    toggle.setAttribute("aria-pressed", String(readingRoomEnabled));
    toggle.setAttribute("aria-label", readingRoomEnabled ? "Turn reading room ambience off" : "Turn reading room ambience on");
  });
}

function updateThemeToggles() {
  document.documentElement.dataset.theme = currentTheme;
  localStorage.setItem("writersTheme", currentTheme);
  $$(".theme-toggle").forEach(toggle => {
    const isDark = currentTheme === "dark";
    toggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    toggle.classList.toggle("is-on", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
  });
}

function tone({ frequency = 440, duration = 0.08, type = "sine", gain = 0.012, delay = 0 }) {
  const ctx = getAudioContext();
  if (!ctx || !readingRoomEnabled) return;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + duration;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.018);
  volume.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function playPaperSound() {
  const ctx = getAudioContext();
  if (!ctx || !readingRoomEnabled) return;
  const duration = 0.18;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const volume = ctx.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 920;
  volume.gain.value = 0.012;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(volume);
  volume.connect(ctx.destination);
  source.start();
}

function playSoftTick() {
  tone({ frequency: 420, duration: 0.06, type: "triangle", gain: 0.007 });
}

function startReadingRoom() {
  const ctx = getAudioContext();
  if (!ctx || readingRoomNodes) return;
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * 0.35;
  const noise = ctx.createBufferSource();
  const lowpass = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 420;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 1.6);
  noise.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
  readingRoomNodes = { noise, gain };
}

function stopReadingRoom() {
  if (!readingRoomNodes || !audioContext) return;
  const { noise, gain } = readingRoomNodes;
  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.7);
  setTimeout(() => {
    try { noise.stop(); } catch (error) {}
    readingRoomNodes = null;
  }, 760);
}

function setReadingRoom(enabled) {
  readingRoomEnabled = enabled;
  localStorage.setItem("writersReadingRoom", enabled ? "on" : "off");
  updateReadingRoomToggles();
  if (enabled) {
    startReadingRoom();
    tone({ frequency: 392, duration: 0.12, type: "triangle", gain: 0.01, delay: 0.02 });
  } else {
    stopReadingRoom();
  }
}
