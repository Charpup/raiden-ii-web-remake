import { describe, expect, it } from "vitest";

import { enemyMovementProfiles } from "../src/game/core/Simulation";
import { stageCatalog } from "../src/game/stage/stageCatalog";

function collectAuthoredBehaviorKeys(): string[] {
  const keys = new Set<string>();

  for (const stage of Object.values(stageCatalog)) {
    for (const wave of stage.waves) {
      for (const enemy of wave.enemies) {
        if (enemy.behaviorId) {
          keys.add(enemy.behaviorId);
        }
        if (enemy.behaviorVariantId) {
          keys.add(enemy.behaviorVariantId);
        }
      }
    }

    for (const trigger of stage.hiddenTriggers) {
      for (const enemy of trigger.revealEnemies ?? []) {
        if (enemy.behaviorId) {
          keys.add(enemy.behaviorId);
        }
        if (enemy.behaviorVariantId) {
          keys.add(enemy.behaviorVariantId);
        }
      }
    }
  }

  return [...keys].sort();
}

describe("Enemy behavior profile coverage", () => {
  it("CRD-102 keeps every authored enemy behavior key mapped to a movement profile", () => {
    const missingKeys = collectAuthoredBehaviorKeys().filter(
      (behaviorKey) => !(behaviorKey in enemyMovementProfiles)
    );

    expect(missingKeys).toEqual([]);
  });
});
