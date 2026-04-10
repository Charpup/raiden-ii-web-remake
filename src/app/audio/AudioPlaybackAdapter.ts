import type { AudioFrame } from "../../game/core/types";

export interface AudioPlaybackAdapter {
  unlock(): void | Promise<void>;
  sync(frame: AudioFrame): void;
  setSuspended(suspended: boolean): void;
  destroy(): void;
}

interface BrowserAudioWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as BrowserAudioWindow;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

function cueToFrequency(cue: string, base: number): number {
  const hash = [...cue].reduce((total, char) => total + char.charCodeAt(0), 0);
  return base + (hash % 240);
}

export class WebAudioPlaybackAdapter implements AudioPlaybackAdapter {
  private context: AudioContext | null = null;

  private unlocked = false;

  private suspended = false;

  private currentBgmCue: string | null = null;

  private activeOscillators: OscillatorNode[] = [];

  unlock(): void {
    this.unlocked = true;
    this.ensureContext();
    if (!this.suspended) {
      void this.context?.resume();
      if (this.currentBgmCue) {
        this.startBgm(this.currentBgmCue);
      }
    }
  }

  sync(frame: AudioFrame): void {
    if (frame.bgmCue !== this.currentBgmCue) {
      this.currentBgmCue = frame.bgmCue;
      this.stopBgm();
      if (this.unlocked && !this.suspended && frame.bgmCue) {
        this.startBgm(frame.bgmCue);
      }
    }

    if (!this.unlocked || this.suspended) {
      return;
    }

    for (const cue of frame.sfxCues) {
      this.playSfx(cue);
    }
  }

  setSuspended(suspended: boolean): void {
    this.suspended = suspended;
    if (!this.context) {
      return;
    }

    if (suspended) {
      this.stopBgm();
      void this.context.suspend();
      return;
    }

    if (this.unlocked) {
      void this.context.resume();
      if (this.currentBgmCue) {
        this.startBgm(this.currentBgmCue);
      }
    }
  }

  destroy(): void {
    this.stopBgm();
    if (this.context) {
      void this.context.close();
      this.context = null;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      return null;
    }

    this.context = new AudioContextConstructor();
    return this.context;
  }

  private startBgm(cue: string): void {
    if (this.activeOscillators.length > 0) {
      return;
    }

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const masterGain = context.createGain();
    masterGain.gain.value = 0.03;
    masterGain.connect(context.destination);

    const baseFrequency = cueToFrequency(cue, 90);
    const voices: Array<[OscillatorType, number]> = [
      ["triangle", baseFrequency],
      ["sine", baseFrequency * 1.5]
    ];

    this.activeOscillators = voices.map(([type, frequency]) => {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.connect(masterGain);
      oscillator.start();
      return oscillator;
    });
  }

  private stopBgm(): void {
    for (const oscillator of this.activeOscillators) {
      oscillator.stop();
      oscillator.disconnect();
    }
    this.activeOscillators = [];
  }

  private playSfx(cue: string): void {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "square";
    oscillator.frequency.value = cueToFrequency(cue, 180);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }
}
