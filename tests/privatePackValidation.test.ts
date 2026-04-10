import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { createAssetManifest } from "../src/app/assets/assetManifest";

function runValidator(root: string) {
  return spawnSync(process.execPath, ["scripts/validate-private-pack.mjs", "--root", root], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}

describe("Private pack validator", () => {
  it("AST-202 reports exact missing Stage 1 private files and exits non-zero", () => {
    const root = mkdtempSync(path.join(tmpdir(), "raiden2-private-pack-missing-"));
    const result = runValidator(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain("shared.player-ship");
    expect(output).toContain("private-prototype/gameplay/player-ship.png");
    expect(output).toContain("bgm-stage-1");
    expect(output).toContain("private-prototype/audio/bgm-stage-1.ogg");
  });

  it("AST-202 passes when the expected Stage 1 loose-file tree exists", () => {
    const root = mkdtempSync(path.join(tmpdir(), "raiden2-private-pack-complete-"));
    const manifest = createAssetManifest("/games/raiden-ii/");

    for (const asset of manifest.getRequiredPrivateTextureAssets("stage-1")) {
      if (!asset.privateOverrideRelativePath) {
        throw new Error(`Missing private texture path for ${asset.id}`);
      }

      const filePath = path.join(root, asset.privateOverrideRelativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, "png-fixture");
    }

    for (const cue of manifest.getRequiredPrivateAudioCues("stage-1")) {
      if (!cue.privateOverrideRelativePath) {
        throw new Error(`Missing private audio path for ${cue.id}`);
      }

      const filePath = path.join(root, cue.privateOverrideRelativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, "ogg-fixture");
    }

    const result = runValidator(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain("Stage 1 private pack is complete");
  });
});
