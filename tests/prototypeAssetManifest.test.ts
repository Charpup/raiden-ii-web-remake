import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";

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
});
