let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

/** Panggil setelah interaksi user (login / aktifkan notif) supaya sound jalan di mobile */
export const unlockNotificationAudio = async () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
};

const tone = (ctx, frequency, startAt, duration, volume = 0.12) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
};

export const playNotificationSound = async (type = 'default') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();

    const t = ctx.currentTime;

    switch (type) {
      case 'new-order':
        tone(ctx, 880, t, 0.12);
        tone(ctx, 1175, t + 0.14, 0.18, 0.14);
        break;
      case 'turn':
        tone(ctx, 784, t, 0.1, 0.14);
        tone(ctx, 988, t + 0.11, 0.1, 0.14);
        tone(ctx, 1319, t + 0.22, 0.22, 0.15);
        break;
      case 'almost':
        tone(ctx, 659, t, 0.12);
        tone(ctx, 880, t + 0.13, 0.14);
        break;
      case 'done':
        tone(ctx, 523, t, 0.14);
        tone(ctx, 659, t + 0.16, 0.2, 0.1);
        break;
      default:
        tone(ctx, 800, t, 0.15);
        tone(ctx, 1000, t + 0.12, 0.12);
    }
  } catch (err) {
    console.warn('Notification sound failed:', err);
  }
};
