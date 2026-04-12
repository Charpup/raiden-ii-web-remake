import type { AssetManifest } from "./assetManifest";

export type AssetLoadState = "idle" | "loading" | "ready" | "error";

export interface MissingReplacementAsset {
  kind: "texture" | "audio";
  id: string;
  path: string;
}

export interface ReplacementAssetLoadState {
  state: AssetLoadState;
  stageId: string | null;
  missingCount: number;
  missingAssets: MissingReplacementAsset[];
  loadedTextureIds: string[];
  loadedAudioCueIds: string[];
}

export interface ReplacementAssetStore {
  ensureStageBundle(
    stageId: string
  ): Promise<{ ok: boolean; missingAssets: MissingReplacementAsset[] }>;
  getImage(assetId: string): HTMLImageElement | null;
  getAudioBuffer(cueId: string): AudioBuffer | null;
  getMissingAssets(): MissingReplacementAsset[];
  getLoadState(): ReplacementAssetLoadState;
  reset(): void;
}

interface ReplacementAssetStoreOptions {
  imageLoader?: (url: string) => Promise<HTMLImageElement>;
  audioLoader?: (url: string) => Promise<AudioBuffer | null>;
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

async function defaultImageLoader(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";

  return new Promise((resolve, reject) => {
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Failed to load image: ${url}`)), {
      once: true
    });
    image.src = url;
  });
}

async function defaultAudioLoader(url: string): Promise<AudioBuffer | null> {
  if (typeof fetch !== "function") {
    return null;
  }

  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) {
    return null;
  }

  const context = new AudioContextConstructor();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    return null;
  } finally {
    await context.close();
  }
}

export class DefaultReplacementAssetStore implements ReplacementAssetStore {
  private readonly manifest: AssetManifest;

  private readonly imageLoader: (url: string) => Promise<HTMLImageElement>;

  private readonly audioLoader: (url: string) => Promise<AudioBuffer | null>;

  private readonly images = new Map<string, HTMLImageElement>();

  private readonly audioBuffers = new Map<string, AudioBuffer>();

  private loadState: ReplacementAssetLoadState = {
    state: "idle",
    stageId: null,
    missingCount: 0,
    missingAssets: [],
    loadedTextureIds: [],
    loadedAudioCueIds: []
  };

  constructor(manifest: AssetManifest, options: ReplacementAssetStoreOptions = {}) {
    this.manifest = manifest;
    this.imageLoader = options.imageLoader ?? defaultImageLoader;
    this.audioLoader = options.audioLoader ?? defaultAudioLoader;
  }

  async ensureStageBundle(
    stageId: string
  ): Promise<{ ok: boolean; missingAssets: MissingReplacementAsset[] }> {
    this.loadState = {
      state: "loading",
      stageId,
      missingCount: 0,
      missingAssets: [],
      loadedTextureIds: [],
      loadedAudioCueIds: []
    };

    const missingAssets: MissingReplacementAsset[] = [];
    const loadedTextureIds: string[] = [];
    const loadedAudioCueIds: string[] = [];

    for (const asset of this.manifest.getRequiredReplacementTextureAssets(stageId)) {
      try {
        const image = await this.imageLoader(this.manifest.resolvePath(asset.replacementRelativePath));
        this.images.set(asset.id, image);
        loadedTextureIds.push(asset.id);
      } catch {
        missingAssets.push({
          kind: "texture",
          id: asset.id,
          path: asset.replacementRelativePath
        });
      }
    }

    for (const cue of this.manifest.getRequiredReplacementAudioCues(stageId)) {
      const buffer = await this.audioLoader(this.manifest.resolvePath(cue.replacementRelativePath));
      if (!buffer) {
        missingAssets.push({
          kind: "audio",
          id: cue.id,
          path: cue.replacementRelativePath
        });
        continue;
      }

      this.audioBuffers.set(cue.id, buffer);
      loadedAudioCueIds.push(cue.id);
    }

    this.loadState = {
      state: missingAssets.length > 0 ? "error" : "ready",
      stageId,
      missingCount: missingAssets.length,
      missingAssets,
      loadedTextureIds,
      loadedAudioCueIds
    };

    return {
      ok: missingAssets.length === 0,
      missingAssets: [...missingAssets]
    };
  }

  getImage(assetId: string): HTMLImageElement | null {
    return this.images.get(assetId) ?? null;
  }

  getAudioBuffer(cueId: string): AudioBuffer | null {
    return this.audioBuffers.get(cueId) ?? null;
  }

  getMissingAssets(): MissingReplacementAsset[] {
    return [...this.loadState.missingAssets];
  }

  getLoadState(): ReplacementAssetLoadState {
    return {
      ...this.loadState,
      missingAssets: [...this.loadState.missingAssets],
      loadedTextureIds: [...this.loadState.loadedTextureIds],
      loadedAudioCueIds: [...this.loadState.loadedAudioCueIds]
    };
  }

  reset(): void {
    this.loadState = {
      state: "idle",
      stageId: null,
      missingCount: 0,
      missingAssets: [],
      loadedTextureIds: [],
      loadedAudioCueIds: []
    };
  }
}
