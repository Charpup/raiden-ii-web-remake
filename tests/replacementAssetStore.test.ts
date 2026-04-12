// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";
import { DefaultReplacementAssetStore } from "../src/app/assets/ReplacementAssetStore";

describe("Replacement asset store", () => {
  it("AST-201R and RNT-201R preload the required Stage 1 textures and audio into a ready load state", async () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const store = new DefaultReplacementAssetStore(manifest, {
      imageLoader: async (url) => {
        const image = new Image();
        image.src = url;
        return image;
      },
      audioLoader: async () => ({ tag: "audio-buffer" } as unknown as AudioBuffer)
    });

    const result = await store.ensureStageBundle("stage-1");
    const loadState = store.getLoadState();

    expect(result.ok).toBe(true);
    expect(result.missingAssets).toEqual([]);
    expect(loadState.state).toBe("ready");
    expect(loadState.stageId).toBe("stage-1");
    expect(loadState.loadedTextureIds).toContain("shared.player-ship");
    expect(loadState.loadedAudioCueIds).toContain("bgm-stage-1");
    expect(store.getImage("shared.player-ship")).not.toBeNull();
    expect(store.getAudioBuffer("bgm-stage-1")).not.toBeNull();

    store.reset();
    expect(store.getLoadState().state).toBe("idle");
  });

  it("AST-202R records exact missing asset ids and paths when Stage 1 preload fails", async () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const store = new DefaultReplacementAssetStore(manifest, {
      imageLoader: async (url) => {
        if (url.includes("player-ship")) {
          throw new Error("missing player ship");
        }

        const image = new Image();
        image.src = url;
        return image;
      },
      audioLoader: async (url) => {
        if (url.includes("bgm-stage-1")) {
          return null;
        }

        return { tag: "audio-buffer" } as unknown as AudioBuffer;
      }
    });

    const result = await store.ensureStageBundle("stage-1");
    const loadState = store.getLoadState();

    expect(result.ok).toBe(false);
    expect(loadState.state).toBe("error");
    expect(loadState.missingAssets).toEqual(
      expect.arrayContaining([
        {
          kind: "texture",
          id: "shared.player-ship",
          path: "assets/replacement/gameplay/player-ship.png"
        },
        {
          kind: "audio",
          id: "bgm-stage-1",
          path: "assets/replacement/audio/bgm-stage-1.ogg"
        }
      ])
    );
    expect(store.getMissingAssets()).toEqual(loadState.missingAssets);
  });
});
