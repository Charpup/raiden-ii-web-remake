import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createAssetManifest } from "../src/app/assets/assetManifest";

function readPngDimensions(relativePath: string): { width: number; height: number } {
  const buffer = readFileSync(path.join(process.cwd(), "public", relativePath));
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

describe("Asset manifest", () => {
  it("AST-001 exposes shell, shared, and stage-specific bundle membership", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");

    expect(manifest.shellBundle.assetIds).toContain("shell.marquee");
    expect(manifest.sharedBundle.assetIds).toContain("shared.player-ship");
    expect(manifest.getStageBundle("stage-4")).toMatchObject({
      stageId: "stage-4"
    });
    expect(manifest.getStageBundle("stage-8").audioCueIds).toContain("bgm-stage-8");
  });

  it("AST-001 resolves base-path-safe asset urls without double slashes", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");

    expect(manifest.resolveUrl("shell.marquee")).toBe(
      "/games/raiden-ii/assets/ui/marquee.svg"
    );
    expect(manifest.resolvePath("assets/audio/sfx/fire.wav")).toBe(
      "/games/raiden-ii/assets/audio/sfx/fire.wav"
    );
  });

  it("AST-201R exposes the required replacement Stage 1 asset inventory through the stage bundle and manifest helpers", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const stage1Bundle = manifest.getStageBundle("stage-1");

    expect(stage1Bundle.requiredReplacementTextureIds).toEqual([
      "stage-1.backdrop-sky",
      "stage-1.backdrop-terrain",
      "shared.player-ship",
      "shared.enemy-scout",
      "shared.enemy-warplane",
      "shared.enemy-ground",
      "shared.enemy-turret",
      "shared.enemy-carrier",
      "shared.enemy-gunboat",
      "shared.enemy-scenery",
      "shared.pickup-medal",
      "shared.pickup-fairy",
      "shared.pickup-weapon",
      "shared.pickup-bomb",
      "shared.pickup-extend",
      "shared.boss-walker-body",
      "shared.boss-walker-part",
      "shared.player-bullet",
      "shared.enemy-bullet",
      "shared.effect-hit",
      "shared.effect-explosion",
      "shared.effect-respawn"
    ]);
    expect(stage1Bundle.requiredReplacementAudioCueIds).toEqual([
      "bgm-stage-1",
      "sfx-player1-fire",
      "sfx-player1-bomb",
      "sfx-player-hit",
      "sfx-player-respawn",
      "sfx-enemy-destroyed"
    ]);
    expect(manifest.getRequiredReplacementTextureAssets("stage-1").map((asset) => asset.id)).toEqual(
      stage1Bundle.requiredReplacementTextureIds
    );
    expect(manifest.getRequiredReplacementAudioCues("stage-1").map((cue) => cue.id)).toEqual(
      stage1Bundle.requiredReplacementAudioCueIds
    );
  });

  it("ACO-301 exposes stable Stage 1 art-cohesion draw metadata", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");

    expect(manifest.getTextureAsset("shared.player-ship")).toMatchObject({
      width: 28,
      height: 34,
      anchor: { x: 0.5, y: 0.58 }
    });
    expect(manifest.getTextureAsset("shared.enemy-ground")).toMatchObject({
      width: 30,
      height: 22,
      anchor: { x: 0.5, y: 0.62 }
    });
    expect(manifest.getTextureAsset("shared.enemy-turret")).toMatchObject({
      width: 28,
      height: 28,
      anchor: { x: 0.5, y: 0.62 }
    });
    expect(manifest.getTextureAsset("shared.enemy-scenery")).toMatchObject({
      width: 28,
      height: 32,
      anchor: { x: 0.5, y: 0.68 }
    });
    expect(manifest.getTextureAsset("shared.player-bullet")).toMatchObject({
      width: 10,
      height: 20,
      anchor: { x: 0.5, y: 0.5 }
    });
    expect(manifest.getTextureAsset("shared.enemy-bullet")).toMatchObject({
      width: 10,
      height: 20,
      anchor: { x: 0.5, y: 0.5 }
    });
    expect(manifest.getTextureAsset("shared.pickup-weapon")).toMatchObject({
      width: 22,
      height: 22,
      anchor: { x: 0.5, y: 0.5 }
    });
    expect(manifest.getTextureAsset("shared.boss-walker-body")).toMatchObject({
      width: 100,
      height: 58,
      anchor: { x: 0.5, y: 0.56 }
    });
    expect(manifest.getTextureAsset("shared.boss-walker-part")).toMatchObject({
      width: 42,
      height: 30,
      anchor: { x: 0.5, y: 0.56 }
    });
  });

  it("ACO-303 uses a stitched Stage 1 terrain and readable bullet/pickup PNG dimensions", () => {
    const manifest = createAssetManifest("/games/raiden-ii/");
    const terrain = manifest.getTextureAsset("stage-1.backdrop-terrain");

    expect(terrain).toMatchObject({
      width: 320,
      height: 568
    });
    expect(readPngDimensions("assets/replacement/stages/stage-1/backdrop-terrain.png")).toEqual({
      width: 320,
      height: 568
    });

    for (const assetId of ["shared.player-bullet", "shared.enemy-bullet"]) {
      const asset = manifest.getTextureAsset(assetId);
      const dimensions = readPngDimensions(asset.replacementRelativePath!);
      expect(dimensions.width).toBeGreaterThanOrEqual(8);
      expect(dimensions.height).toBeGreaterThanOrEqual(16);
    }

    for (const assetId of [
      "shared.pickup-medal",
      "shared.pickup-fairy",
      "shared.pickup-weapon",
      "shared.pickup-bomb",
      "shared.pickup-extend"
    ]) {
      const asset = manifest.getTextureAsset(assetId);
      const dimensions = readPngDimensions(asset.replacementRelativePath!);
      expect(dimensions.width).toBeGreaterThanOrEqual(16);
      expect(dimensions.height).toBeGreaterThanOrEqual(12);
    }
  });
});
