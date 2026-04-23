/**
 * useSound — Web Audio API sound engine for Plinko.
 *
 * All sounds are synthesised procedurally; no external audio files are
 * required.  The AudioContext is created lazily on the first play() call so
 * we stay within browser autoplay policy (user gesture has occurred by the
 * time any sound is requested).
 *
 * The module holds a single shared AudioContext and a shared `enabled` ref so
 * every component that calls useSound() sees the same mute state.
 */

import { ref } from 'vue';

// ─── Module-level singletons ──────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();

  return _ctx;
}

const STORAGE_KEY = 'plinko_sound_enabled';
const _enabled = ref(localStorage.getItem(STORAGE_KEY) !== 'false');

// Throttle peg-hit sounds to avoid phasing artefacts at high frame rates.
const PEG_HIT_THROTTLE_MS = 40;
let _lastPegHit = 0;

// ─── Sound synthesis helpers ──────────────────────────────────────────────────

function osc(
  ctx: AudioContext,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  startTime: number,
  duration: number,
  gain: number,
  gainFade = duration
): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.connect(g);
  g.connect(ctx.destination);

  o.type = type;
  o.frequency.setValueAtTime(freqStart, startTime);

  if (freqEnd !== freqStart) {
    o.frequency.exponentialRampToValueAtTime(
      Math.max(freqEnd, 0.01),
      startTime + duration
    );
  }

  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + gainFade);

  o.start(startTime);
  o.stop(startTime + gainFade + 0.01);
}

// ── peg_hit ───────────────────────────────────────────────────────────────────
function synthPegHit(ctx: AudioContext, pitch: number): void {
  const t = ctx.currentTime;

  osc(ctx, 'sine',     900 * pitch,  200 * pitch, t, 0.04, 0.22, 0.07);
  osc(ctx, 'triangle', 1400 * pitch, 400 * pitch, t, 0.02, 0.08, 0.04);
}

// ── bucket_land ───────────────────────────────────────────────────────────────
function synthBucketLand(ctx: AudioContext): void {
  const chord = [523.25, 659.25, 783.99]; // C5 E5 G5

  chord.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.07;

    osc(ctx, 'triangle', freq, freq, t, 0.25, 0.35, 0.28);
    osc(ctx, 'sine',     freq * 2, freq * 2, t, 0.15, 0.1, 0.15);
  });
}

// ── balance_update ────────────────────────────────────────────────────────────
function synthBalanceUpdate(ctx: AudioContext): void {
  const t = ctx.currentTime;

  osc(ctx, 'sine', 1318.5, 880, t, 0.12, 0.18, 0.14); // E6→A5
  osc(ctx, 'sine', 1318.5 * 2, 880 * 2, t + 0.04, 0.08, 0.08, 0.10);
}

// ── big_win jingle ────────────────────────────────────────────────────────────
function synthBigWin(ctx: AudioContext): void {
  // Triumphant C major arpeggio + octave chord
  const melody: Array<{ freq: number; t: number; dur: number }> = [
    { freq: 523.25, t: 0.00, dur: 0.18 },   // C5
    { freq: 659.25, t: 0.14, dur: 0.18 },   // E5
    { freq: 783.99, t: 0.28, dur: 0.18 },   // G5
    { freq: 1046.5, t: 0.42, dur: 0.30 },   // C6
    { freq: 783.99, t: 0.60, dur: 0.14 },   // G5
    { freq: 1046.5, t: 0.72, dur: 0.14 },   // C6
    { freq: 1318.5, t: 0.84, dur: 0.40 },   // E6 (hold)
    { freq: 1046.5, t: 0.84, dur: 0.40 },   // C6 (chord)
    { freq: 783.99, t: 0.84, dur: 0.40 },   // G5 (chord)
  ];

  melody.forEach(({ freq, t, dur }) => {
    const start = ctx.currentTime + t;

    osc(ctx, 'square',   freq,     freq,     start, dur, 0.12, dur + 0.05);
    osc(ctx, 'triangle', freq * 2, freq * 2, start, dur, 0.06, dur + 0.05);
  });

  // Bright high-frequency shimmer at the start
  osc(ctx, 'sine', 4000, 2000, ctx.currentTime, 0.06, 0.05, 0.08);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type SoundId = 'peg_hit' | 'bucket_land' | 'balance_update' | 'big_win';

export function useSound() {
  const enabled = _enabled;

  function play(id: SoundId, pitch = 1.0): void {
    if (!enabled.value) return;

    const ctx = getCtx();

    if (id === 'peg_hit') {
      const now = performance.now();
      if (now - _lastPegHit < PEG_HIT_THROTTLE_MS) return;
      _lastPegHit = now;
      synthPegHit(ctx, pitch);

      return;
    }

    if (id === 'bucket_land')    {
      synthBucketLand(ctx);

      return;
    }

    if (id === 'balance_update') {
      synthBalanceUpdate(ctx);

      return;
    }

    if (id === 'big_win')        {
      synthBigWin(ctx);

      return;
    }
  }

  function toggle(): void {
    enabled.value = !enabled.value;
    localStorage.setItem(STORAGE_KEY, String(enabled.value));
  }

  return { enabled, play, toggle };
}
