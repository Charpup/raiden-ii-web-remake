import { describe, expect, it } from "vitest";
import { createAssetManifest } from "../src/app/assets/assetManifest";

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
});
