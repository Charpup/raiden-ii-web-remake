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
});
