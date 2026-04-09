import type { StageDefinition } from "./stageTypes";

const sharedDifficulty = {
  easy: {
    enemyHealthMultiplier: 1,
    bossHealthMultiplier: 1,
    scrollSpeedMultiplier: 1
  },
  hard: {
    enemyHealthMultiplier: 1.35,
    bossHealthMultiplier: 1.25,
    scrollSpeedMultiplier: 1.05
  }
} as const;

const sharedLoopTuning = {
  enemyHealthMultiplierPerLoop: 0.15,
  bossHealthMultiplierPerLoop: 0.2,
  scrollSpeedMultiplierPerLoop: 0.04
} as const;

export const stageCatalog: Record<string, StageDefinition> = {
  "stage-1": {
    id: "stage-1",
    name: "Operation Burning Sky",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 12,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-1-wave-1",
        trigger: { type: "scroll", scrollY: 24 },
        enemies: [
          {
            id: "stage-1-wave-1-lead",
            kind: "gunboat",
            position: { x: 160, y: 104 },
            health: 40,
            scoreValue: 2_000
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-1-checkpoint-alpha",
        scrollY: 48,
        position: { x: 160, y: 470 },
        waveCursor: 1
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-1-hidden-miclus",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-1-wave-1-lead"
        },
        reward: {
          pickupId: "stage-1-hidden-miclus-reward",
          kind: "hidden-medal",
          position: { x: 160, y: 240 },
          scoreValue: 5_000
        }
      }
    ],
    boss: {
      id: "stage-1-boss",
      trigger: {
        type: "waves-cleared",
        minScrollY: 96
      },
      position: { x: 160, y: 92 },
      maxHealth: 120,
      scoreValue: 50_000,
      phases: [
        { id: "stage-1-boss-phase-1", healthAtOrBelow: 120 },
        { id: "stage-1-boss-phase-2", healthAtOrBelow: 50 }
      ]
    }
  },
  "stage-8": {
    id: "stage-8",
    name: "Orbital Descent",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 16,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-8-wave-1",
        trigger: { type: "scroll", scrollY: 16 },
        enemies: [
          {
            id: "stage-8-wave-1-escort",
            kind: "escort",
            position: { x: 160, y: 96 },
            health: 30,
            scoreValue: 1_500
          }
        ]
      }
    ],
    checkpoints: [],
    hiddenTriggers: [],
    boss: {
      id: "stage-8-boss",
      trigger: {
        type: "waves-cleared",
        minScrollY: 48
      },
      position: { x: 160, y: 88 },
      maxHealth: 140,
      scoreValue: 75_000,
      phases: [{ id: "stage-8-boss-phase-1", healthAtOrBelow: 140 }]
    },
    loopAdvance: {
      enabled: true,
      nextStageId: "stage-1"
    }
  }
};

export function getStageDefinition(stageId: string): StageDefinition {
  const stage = stageCatalog[stageId];
  if (!stage) {
    throw new Error(`Unknown stage definition: ${stageId}`);
  }

  return stage;
}
