import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import replacementAssetCatalog from "../src/app/assets/replacementAssetCatalog.json" with { type: "json" };

function parseRootArgument(argv) {
  const rootIndex = argv.indexOf("--root");
  if (rootIndex >= 0) {
    return argv[rootIndex + 1];
  }

  return path.join(process.cwd(), "public");
}

function validateStageBundle(root, stageId, contract, attributionDoc) {
  const missingAssets = [];
  const undocumentedAssets = [];

  for (const asset of contract.requiredReplacementTextures) {
    if (!existsSync(path.join(root, asset.path))) {
      missingAssets.push({
        kind: "texture",
        id: asset.id,
        path: asset.path
      });
    }

    if (!asset.license.includes("CC0") && !attributionDoc.includes(asset.id)) {
      undocumentedAssets.push({
        kind: "texture",
        id: asset.id
      });
    }
  }

  for (const cue of contract.requiredReplacementAudioCues) {
    if (!existsSync(path.join(root, cue.path))) {
      missingAssets.push({
        kind: "audio",
        id: cue.id,
        path: cue.path
      });
    }

    if (!cue.license.includes("CC0") && !attributionDoc.includes(cue.id)) {
      undocumentedAssets.push({
        kind: "audio",
        id: cue.id
      });
    }
  }

  if (missingAssets.length > 0) {
    console.error(`Stage 1 replacement asset validation failed for ${stageId}:`);
    for (const asset of missingAssets) {
      console.error(`- ${asset.kind}:${asset.id} -> ${asset.path}`);
    }
    return 1;
  }

  if (undocumentedAssets.length > 0) {
    console.error(`Stage 1 replacement assets are missing attribution entries for ${stageId}:`);
    for (const asset of undocumentedAssets) {
      console.error(`- ${asset.kind}:${asset.id}`);
    }
    return 1;
  }

  console.log("Stage 1 replacement assets are complete.");
  return 0;
}

const root = parseRootArgument(process.argv.slice(2));
const stage1Contract = replacementAssetCatalog.stageBundles["stage-1"];
const attributionDoc = readFileSync(
  path.join(process.cwd(), "THIRD_PARTY_ASSETS.md"),
  "utf8"
);

process.exit(validateStageBundle(root, "stage-1", stage1Contract, attributionDoc));
