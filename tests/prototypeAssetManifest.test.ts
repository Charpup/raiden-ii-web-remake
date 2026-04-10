import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";
import { resolvePixiTextureSource } from "../src/app/render/PixiSceneAdapter";

describe("Prototype asset manifest", () => {
  it("PRT-002 exposes private-override candidates ahead of tracked fallback assets", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");

    expect(manifest.resolveTextureCandidates("shared.player-ship")).toEqual([
      "/games/raiden-ii/private-prototype/gameplay/player-ship.png",
      "/games/raiden-ii/assets/gameplay/player-ship.svg"
    ]);
    expect(manifest.resolveAudioCandidates("bgm-stage-1")).toEqual([
      "/games/raiden-ii/private-prototype/audio/bgm-stage-1.ogg"
    ]);
  });

  it("PRT-002 ships tracked fallback files for every declared texture asset", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const missing = manifest
      .listTextureAssets()
      .filter((asset) =>
        !existsSync(path.join(process.cwd(), "public", asset.fallbackRelativePath))
      )
      .map((asset) => asset.id);

    expect(missing).toEqual([]);
  });

  it("REG-201 resolves Pixi texture sources through private-pack-first semantics instead of fallback-only urls", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const privateImage = { width: 32, height: 32 } as HTMLImageElement;
    const fakeStore = {
      getImage(assetId: string) {
        return assetId === "shared.player-ship" ? privateImage : null;
      }
    };

    expect(resolvePixiTextureSource("shared.player-ship", manifest, fakeStore)).toBe(privateImage);
    expect(resolvePixiTextureSource("shared.enemy-scout", manifest, fakeStore)).toBe(
      "/games/raiden-ii/private-prototype/gameplay/enemy-scout.png"
    );
  });
});
