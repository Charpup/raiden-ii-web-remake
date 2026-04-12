// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";
import { WebAudioPlaybackAdapter } from "../src/app/audio/AudioPlaybackAdapter";
import { Canvas2DSceneAdapter } from "../src/app/render/Canvas2DSceneAdapter";

describe("Replacement-first adapters", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("REN-201 uses the preloaded private image for required Stage 1 visuals instead of lazy fallback resolution", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const privateImage = new Image();
    const fakeStore = {
      getImage(assetId: string) {
        return assetId === "shared.player-ship" ? privateImage : null;
      }
    };

    const adapter = new Canvas2DSceneAdapter(manifest, fakeStore);
    const cached = (adapter as unknown as { getOrStartImageLoad(assetId: string): { image: HTMLImageElement; loaded: boolean } })
      .getOrStartImageLoad("shared.player-ship");

    expect(cached.image).toBe(privateImage);
    expect(cached.loaded).toBe(true);
  });

  it("AUD-201 uses preloaded private audio buffers for required Stage 1 cues instead of synth fallback", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const privateBuffer = { tag: "private-bgm" } as unknown as AudioBuffer;
    const fakeStore = {
      getAudioBuffer(cueId: string) {
        return cueId === "bgm-stage-1" ? privateBuffer : null;
      }
    };

    const adapter = new WebAudioPlaybackAdapter(manifest, fakeStore);
    const createFallbackBgmBuffer = vi.spyOn(
      adapter as unknown as { createFallbackBgmBuffer: (context: AudioContext, cue: string) => AudioBuffer },
      "createFallbackBgmBuffer"
    );

    const resolved = (adapter as unknown as {
      resolveCueBuffer(cue: string, mode: "bgm" | "sfx"): AudioBuffer;
    }).resolveCueBuffer("bgm-stage-1", "bgm");

    expect(resolved).toBe(privateBuffer);
    expect(createFallbackBgmBuffer).not.toHaveBeenCalled();
  });
});
