import { defaultCombatRules } from "../combat/CombatSystems";
import type { CabinetProfile, CabinetRules, CombatRules } from "./types";

const cabinetRulePresets: Record<CabinetProfile, CabinetRules> = {
  easy: {
    profile: "easy",
    startingLives: 2,
    startingBombs: 3,
    extendThresholds: [200_000, 600_000, 1_200_000],
    continueEnabled: true,
    continueCountdownFrames: 600,
    enemyHealthMultiplier: 1,
    bossHealthMultiplier: 1,
    scrollSpeedMultiplier: 1
  },
  hard: {
    profile: "hard",
    startingLives: 1,
    startingBombs: 2,
    extendThresholds: [400_000, 900_000, 1_600_000],
    continueEnabled: true,
    continueCountdownFrames: 600,
    enemyHealthMultiplier: 1.15,
    bossHealthMultiplier: 1.2,
    scrollSpeedMultiplier: 1.05
  }
};

export function getCabinetRules(profile: CabinetProfile): CabinetRules {
  const preset = cabinetRulePresets[profile];

  return {
    ...preset,
    extendThresholds: [...preset.extendThresholds]
  };
}

export function getCombatRulesForCabinet(
  profile: CabinetProfile,
  baseRules: CombatRules = defaultCombatRules
): CombatRules {
  const cabinetRules = getCabinetRules(profile);

  return {
    ...baseRules,
    extendThresholds: [...cabinetRules.extendThresholds]
  };
}
