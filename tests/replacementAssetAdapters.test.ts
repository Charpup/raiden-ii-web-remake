// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";
import { WebAudioPlaybackAdapter } from "../src/app/audio/AudioPlaybackAdapter";
import {
  Canvas2DSceneAdapter,
  computeAnchoredDrawRect
} from "../src/app/render/Canvas2DSceneAdapter";
import { resolvePixiSpritePresentation } from "../src/app/render/PixiSceneAdapter";

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

  it("ACO-302 shares texture anchor semantics between Canvas2D and Pixi adapters", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const ground = manifest.getTextureAsset("shared.enemy-ground");

    expect(computeAnchoredDrawRect(ground, 1)).toEqual({
      x: -15,
      y: -13.64,
      width: 30,
      height: 22
    });
    expect(resolvePixiSpritePresentation(ground, 1.25)).toEqual({
      anchor: { x: 0.5, y: 0.62 },
      width: 37.5,
      height: 27.5
    });
  });
});
