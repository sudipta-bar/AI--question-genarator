'use client';

type SoundName = 'tap' | 'open' | 'success' | 'error';

let audioContext: AudioContext | null = null;
let enabled = true;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getContext() {
  if (typeof window === 'undefined' || prefersReducedMotion() || !enabled) return null;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

function tone(frequency: number, start: number, duration: number, gain: number, type: OscillatorType = 'sine') {
  const context = getContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export async function unlockInterfaceAudio() {
  const context = getContext();
  if (!context) return;
  if (context.state === 'suspended') await context.resume();
}

export function setInterfaceAudioEnabled(value: boolean) {
  enabled = value;
}

export function playInterfaceSound(sound: SoundName) {
  const context = getContext();
  if (!context || context.state !== 'running') return;
  const now = context.currentTime;

  if (sound === 'tap') {
    tone(520, now, 0.045, 0.018, 'triangle');
    return;
  }

  if (sound === 'open') {
    tone(440, now, 0.06, 0.014, 'sine');
    tone(660, now + 0.035, 0.08, 0.012, 'sine');
    return;
  }

  if (sound === 'success') {
    tone(523.25, now, 0.09, 0.018, 'sine');
    tone(659.25, now + 0.07, 0.11, 0.018, 'sine');
    tone(783.99, now + 0.15, 0.16, 0.014, 'sine');
    return;
  }

  tone(220, now, 0.1, 0.02, 'triangle');
  tone(164.81, now + 0.08, 0.16, 0.018, 'triangle');
}
