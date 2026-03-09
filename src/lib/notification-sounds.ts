// Notification sounds using Web Audio API - no external files needed

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is blocked
  }
}

/** Short "pop" sound for incoming chat/DM messages */
export function playMessageSound() {
  playTone(880, 0.12, "sine", 0.1);
  setTimeout(() => playTone(1100, 0.08, "sine", 0.08), 60);
}

/** Two-tone chime for friend requests */
export function playFriendRequestSound() {
  playTone(660, 0.15, "triangle", 0.12);
  setTimeout(() => playTone(880, 0.2, "triangle", 0.1), 150);
  setTimeout(() => playTone(1100, 0.25, "triangle", 0.08), 300);
}
