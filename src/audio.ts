/**
 * 音效：Web Audio 现场合成，零音频素材、零网络请求。
 * 感官友好约束（研 01 §2.5）：默认关闭、音量克制（峰值 ~0.12）、无突兀音色。
 */

let ctx: AudioContext | null = null;
let enabled = false;

export function isSoundOn(): boolean {
  return enabled;
}

/** 必须在用户手势里调用（iOS 解锁 AudioContext） */
export function setSound(on: boolean): void {
  enabled = on;
  if (on) {
    ensureCtx();
    chime();
  }
}

function ensureCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freqFrom: number, freqTo: number, start: number, dur: number, peak: number): void {
  const c = ensureCtx();
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqFrom, t);
  osc.frequency.exponentialRampToValueAtTime(freqTo, t + dur * 0.4);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** 答对/确认：温和的两音上行 */
export function chime(): void {
  if (!enabled) return;
  tone(660, 880, 0, 0.35, 0.12);
}

/** 收尾仪式：轻柔的三音琶音（刻意不做"烟花式"强刺激） */
export function celebrate(): void {
  if (!enabled) return;
  tone(523, 523, 0, 0.3, 0.1);
  tone(659, 659, 0.18, 0.3, 0.1);
  tone(784, 784, 0.36, 0.45, 0.1);
}
