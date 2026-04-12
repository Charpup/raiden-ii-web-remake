import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";

function runValidator(root: string) {
  return spawnSync(process.execPath, ["scripts/validate-replacement-assets.mjs", "--root", root], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}

describe("Replacement asset validator", () => {
  it("AST-202R reports exact missing Stage 1 replacement files and exits non-zero", () => {
    const root = mkdtempSync(path.join(tmpdir(), "raiden2-replacement-assets-missing-"));
    const result = runValidator(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain("shared.player-ship");
    expect(output).toContain("assets/replacement/gameplay/player-ship.png");
    expect(output).toContain("bgm-stage-1");
    expect(output).toContain("assets/replacement/audio/bgm-stage-1.ogg");
  });

  it("AST-202R passes when the expected Stage 1 replacement tree exists", () => {
    const root = mkdtempSync(path.join(tmpdir(), "raiden2-replacement-assets-complete-"));
    const manifest = createAssetManifest("/games/raiden-ii/");

    for (const asset of manifest.getRequiredReplacementTextureAssets("stage-1")) {
      if (!asset.replacementRelativePath) {
        throw new Error(`Missing replacement texture path for ${asset.id}`);
      }

      const filePath = path.join(root, asset.replacementRelativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, "png-fixture");
    }

    for (const cue of manifest.getRequiredReplacementAudioCues("stage-1")) {
      if (!cue.replacementRelativePath) {
        throw new Error(`Missing replacement audio path for ${cue.id}`);
      }

      const filePath = path.join(root, cue.replacementRelativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, "ogg-fixture");
    }

    const result = runValidator(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain("Stage 1 replacement assets are complete");
  });
});
