import type { AudioFrame } from "../../game/core/types";
import type { AssetManifest } from "../assets/assetManifest";
import type { ReplacementAssetStore } from "../assets/ReplacementAssetStore";

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

type CueMode = "bgm" | "sfx";

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as BrowserAudioWindow;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

function cueToHash(cue: string): number {
  return [...cue].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function stageMelody(cue: string): number[] {
  const stageNumber = Number.parseInt(cue.replace(/\D+/g, ""), 10) || 1;
  const roots = [196, 220, 247, 262, 294, 330, 370, 392];
  const root = roots[(stageNumber - 1) % roots.length];

  return [root, root * 1.122, root * 1.334, root * 1.5, root * 1.334, root * 1.122];
}

export class WebAudioPlaybackAdapter implements AudioPlaybackAdapter {
  private readonly assetManifest?: AssetManifest;

  private readonly assetPackStore?: Pick<ReplacementAssetStore, "getAudioBuffer">;

  private context: AudioContext | null = null;

  private unlocked = false;

  private suspended = false;

  private currentBgmCue: string | null = null;

  private activeBgmSource: AudioBufferSourceNode | null = null;

  private activeBgmGain: GainNode | null = null;

  private readonly bufferCache = new Map<string, AudioBuffer>();

  private readonly loadingBuffers = new Map<string, Promise<AudioBuffer | null>>();

  constructor(
    assetManifest?: AssetManifest,
    assetPackStore?: Pick<ReplacementAssetStore, "getAudioBuffer">
  ) {
    this.assetManifest = assetManifest;
    this.assetPackStore = assetPackStore;
  }

  unlock(): void {
    this.unlocked = true;
    const context = this.ensureContext();
    if (!context || this.suspended) {
      return;
    }

    void context.resume().then(() => {
      if (this.currentBgmCue) {
        this.startBgm(this.currentBgmCue);
      }
    });
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
      void this.context.resume().then(() => {
        if (this.currentBgmCue) {
          this.startBgm(this.currentBgmCue);
        }
      });
    }
  }

  destroy(): void {
    this.stopBgm();
    if (this.context) {
      void this.context.close();
      this.context = null;
    }
    this.bufferCache.clear();
    this.loadingBuffers.clear();
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
    if (this.activeBgmSource) {
      return;
    }

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const buffer = this.resolveCueBuffer(cue, "bgm");
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0.18;
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    this.activeBgmSource = source;
    this.activeBgmGain = gain;
  }

  private stopBgm(): void {
    if (this.activeBgmSource) {
      this.activeBgmSource.stop();
      this.activeBgmSource.disconnect();
      this.activeBgmSource = null;
    }

    if (this.activeBgmGain) {
      this.activeBgmGain.disconnect();
      this.activeBgmGain = null;
    }
  }

  private playSfx(cue: string): void {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const buffer = this.resolveCueBuffer(cue, "sfx");
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = cue.includes("bomb") ? 0.26 : 0.2;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  }

  private resolveCueBuffer(cue: string, mode: CueMode): AudioBuffer {
    const preloaded = this.assetPackStore?.getAudioBuffer(cue);
    if (preloaded) {
      this.bufferCache.set(cue, preloaded);
      return preloaded;
    }

    const cached = this.bufferCache.get(cue);
    if (cached) {
      return cached;
    }

    const context = this.ensureContext();
    if (!context) {
      throw new Error("AudioContext is unavailable.");
    }

    const synthesized = mode === "bgm"
      ? this.createFallbackBgmBuffer(context, cue)
      : this.createFallbackSfxBuffer(context, cue);
    this.bufferCache.set(cue, synthesized);
    void this.tryLoadPrivateOverride(cue, mode);
    return synthesized;
  }

  private async tryLoadPrivateOverride(cue: string, mode: CueMode): Promise<void> {
    if (!this.assetManifest || this.loadingBuffers.has(cue)) {
      return;
    }

    const candidates = this.assetManifest.resolveAudioCandidates(cue);
    if (candidates.length === 0) {
      return;
    }

    const task = this.loadAudioBufferFromCandidates(candidates).finally(() => {
      this.loadingBuffers.delete(cue);
    });
    this.loadingBuffers.set(cue, task);
    const loaded = await task;
    if (!loaded) {
      return;
    }

    this.bufferCache.set(cue, loaded);
    if (mode === "bgm" && cue === this.currentBgmCue && this.unlocked && !this.suspended) {
      this.stopBgm();
      this.startBgm(cue);
    }
  }

  private async loadAudioBufferFromCandidates(
    candidates: string[]
  ): Promise<AudioBuffer | null> {
    const context = this.ensureContext();
    if (!context || typeof fetch !== "function") {
      return null;
    }

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate);
        if (!response.ok) {
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
        return decoded;
      } catch {
        continue;
      }
    }

    return null;
  }

  private createFallbackBgmBuffer(context: AudioContext, cue: string): AudioBuffer {
    const durationSeconds = 3.6;
    const sampleRate = context.sampleRate;
    const frameCount = Math.floor(durationSeconds * sampleRate);
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const channel = buffer.getChannelData(0);
    const notes = stageMelody(cue);
    const stepFrames = Math.floor(frameCount / notes.length);
    const bass = notes[0] / 2;

    for (let index = 0; index < frameCount; index += 1) {
      const time = index / sampleRate;
      const noteIndex = Math.floor(index / stepFrames) % notes.length;
      const local = (index % stepFrames) / stepFrames;
      const envelope = Math.max(0, 1 - local * 0.88);
      const melody =
        Math.sin(2 * Math.PI * notes[noteIndex] * time) * 0.42 +
        Math.sin(2 * Math.PI * notes[noteIndex] * 2 * time) * 0.12;
      const bassline = Math.sin(2 * Math.PI * bass * time) * 0.18;
      const pulse = Math.sin(2 * Math.PI * 8 * time) > 0 ? 0.03 : -0.03;
      channel[index] = (melody * envelope + bassline + pulse) * 0.45;
    }

    return buffer;
  }

  private createFallbackSfxBuffer(context: AudioContext, cue: string): AudioBuffer {
    const durationSeconds = cue.includes("bomb") ? 0.48 : 0.14;
    const sampleRate = context.sampleRate;
    const frameCount = Math.floor(durationSeconds * sampleRate);
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const channel = buffer.getChannelData(0);
    const hash = cueToHash(cue);
    const baseFrequency = cue.includes("bomb") ? 84 : 220 + (hash % 160);

    for (let index = 0; index < frameCount; index += 1) {
      const time = index / sampleRate;
      const decay = Math.exp(-time * (cue.includes("bomb") ? 7 : 24));
      const tone = Math.sin(2 * Math.PI * (baseFrequency + time * 140) * time);
      const noise = (Math.sin(index * 12.9898 + hash) * 43758.5453) % 1;
      const noiseCentered = (noise - Math.floor(noise)) * 2 - 1;
      channel[index] = (tone * 0.72 + noiseCentered * 0.28) * decay * 0.5;
    }

    return buffer;
  }
}
