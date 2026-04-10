import { existsSync } from "node:fs";
import path from "node:path";

import privatePackContract from "../src/app/assets/privatePackContract.json" with { type: "json" };

function parseRootArgument(argv) {
  const rootIndex = argv.indexOf("--root");
  if (rootIndex >= 0) {
    return argv[rootIndex + 1];
  }

  return path.join(process.cwd(), "public");
}

function validateStageBundle(root, stageId, contract) {
  const missingAssets = [];

  for (const asset of contract.requiredPrivateTextures) {
    if (!existsSync(path.join(root, asset.path))) {
      missingAssets.push({
        kind: "texture",
        id: asset.id,
        path: asset.path
      });
    }
  }

  for (const cue of contract.requiredPrivateAudioCues) {
    if (!existsSync(path.join(root, cue.path))) {
      missingAssets.push({
        kind: "audio",
        id: cue.id,
        path: cue.path
      });
    }
  }

  if (missingAssets.length > 0) {
    console.error(`Stage 1 private pack validation failed for ${stageId}:`);
    for (const asset of missingAssets) {
      console.error(`- ${asset.kind}:${asset.id} -> ${asset.path}`);
    }
    return 1;
  }

  console.log("Stage 1 private pack is complete.");
  return 0;
}

const root = parseRootArgument(process.argv.slice(2));
const stage1Contract = privatePackContract.stageBundles["stage-1"];

process.exit(validateStageBundle(root, "stage-1", stage1Contract));
