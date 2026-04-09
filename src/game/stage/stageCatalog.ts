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
    name: "Countryside",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 12,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-1-opening-scoutcraft",
        trigger: { type: "scroll", scrollY: 12 },
        enemies: [
          {
            id: "stage-1-opening-scout-1",
            kind: "beige-scoutcraft",
            position: { x: 74, y: 92 },
            health: 8,
            scoreValue: 600,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-1-opening-scout-2",
            kind: "beige-scoutcraft",
            position: { x: 156, y: 76 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 2,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-1-opening-scout-3",
            kind: "beige-scoutcraft",
            position: { x: 248, y: 92 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 4,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-1-opening-scout-4",
            kind: "beige-scoutcraft",
            position: { x: 118, y: 112 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 3,
            behaviorId: "scoutcraft-swoop"
          }
        ]
      },
      {
        id: "stage-1-farm-turretline",
        trigger: { type: "scroll", scrollY: 38 },
        enemies: [
          {
            id: "stage-1-farm-tank-left",
            kind: "small-tank",
            position: { x: 72, y: 122 },
            health: 16,
            scoreValue: 850,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-1-farm-tank-right",
            kind: "small-tank",
            position: { x: 248, y: 118 },
            health: 16,
            scoreValue: 850,
            spawnOffsetFrames: 2,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-1-farm-turret-core",
            kind: "farm-turret",
            position: { x: 160, y: 86 },
            health: 24,
            scoreValue: 1_200,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-1-first-cache-carrier",
        trigger: { type: "scroll", scrollY: 66 },
        enemies: [
          {
            id: "stage-1-cache-carrier",
            kind: "item-carrier",
            position: { x: 160, y: 84 },
            health: 18,
            scoreValue: 1_500,
            behaviorId: "carrier-drift"
          },
          {
            id: "stage-1-cache-escort-left",
            kind: "beige-scoutcraft",
            position: { x: 86, y: 96 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-1-cache-escort-right",
            kind: "beige-scoutcraft",
            position: { x: 234, y: 96 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-1-warplane-pincer",
        trigger: { type: "scroll", scrollY: 94 },
        enemies: [
          {
            id: "stage-1-alpha-left",
            kind: "alpha-warplane",
            position: { x: 72, y: 84 },
            health: 22,
            scoreValue: 1_400,
            behaviorId: "warplane-strafe"
          },
          {
            id: "stage-1-alpha-right",
            kind: "alpha-warplane",
            position: { x: 248, y: 84 },
            health: 22,
            scoreValue: 1_400,
            spawnOffsetFrames: 3,
            behaviorId: "warplane-strafe"
          },
          {
            id: "stage-1-pincer-scout",
            kind: "beige-scoutcraft",
            position: { x: 160, y: 70 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 6,
            behaviorId: "scoutcraft-swoop"
          }
        ]
      },
      {
        id: "stage-1-swamp-pressure",
        trigger: { type: "scroll", scrollY: 132 },
        enemies: [
          {
            id: "stage-1-swamp-gunboat",
            kind: "gunboat",
            position: { x: 160, y: 100 },
            health: 40,
            scoreValue: 2_000,
            behaviorId: "gunboat-midline"
          },
          {
            id: "stage-1-swamp-scout-left",
            kind: "beige-scoutcraft",
            position: { x: 92, y: 90 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 2,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-1-swamp-scout-right",
            kind: "beige-scoutcraft",
            position: { x: 228, y: 90 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 4,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-1-swamp-turret",
            kind: "marsh-turret",
            position: { x: 160, y: 76 },
            health: 26,
            scoreValue: 1_100,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-1-crater-run",
        trigger: { type: "scroll", scrollY: 172 },
        enemies: [
          {
            id: "stage-1-crater-tank-left",
            kind: "small-tank",
            position: { x: 88, y: 122 },
            health: 16,
            scoreValue: 850,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-1-crater-tank-right",
            kind: "small-tank",
            position: { x: 232, y: 122 },
            health: 16,
            scoreValue: 850,
            spawnOffsetFrames: 1,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-1-crater-warplane",
            kind: "alpha-warplane",
            position: { x: 160, y: 74 },
            health: 22,
            scoreValue: 1_400,
            spawnOffsetFrames: 1,
            behaviorId: "warplane-strafe"
          }
        ]
      },
      {
        id: "stage-1-fairy-tree-guard",
        trigger: { type: "scroll", scrollY: 198 },
        enemies: [
          {
            id: "stage-1-fairy-tree",
            kind: "hidden-tree",
            position: { x: 160, y: 160 },
            health: 12,
            scoreValue: 250,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-1-tree-escort-left",
            kind: "beige-scoutcraft",
            position: { x: 78, y: 92 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-1-tree-escort-right",
            kind: "beige-scoutcraft",
            position: { x: 242, y: 92 },
            health: 8,
            scoreValue: 600,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-1-pre-boss-medal-cache",
        trigger: { type: "scroll", scrollY: 244 },
        enemies: [
          {
            id: "stage-1-pre-boss-cache-left",
            kind: "medal-cache",
            position: { x: 100, y: 150 },
            health: 14,
            scoreValue: 500,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-1-pre-boss-cache-core",
            kind: "medal-cache",
            position: { x: 160, y: 132 },
            health: 18,
            scoreValue: 750,
            spawnOffsetFrames: 2,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-1-pre-boss-cache-right",
            kind: "medal-cache",
            position: { x: 220, y: 150 },
            health: 14,
            scoreValue: 500,
            spawnOffsetFrames: 4,
            behaviorId: "static-scenery"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-1-checkpoint-crater-exit",
        scrollY: 188,
        position: { x: 160, y: 472 },
        waveCursor: 6
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-1-hidden-fairy",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-1-fairy-tree"
        },
        reward: {
          pickupId: "stage-1-hidden-fairy-reward",
          kind: "fairy",
          position: { x: 160, y: 232 },
          scoreValue: 10_000
        },
        checkpointRespawnRewards: [
          {
            pickupId: "stage-1-fairy-respawn-main",
            kind: "main-vulcan",
            position: { x: 128, y: 446 },
            scoreValue: 0
          },
          {
            pickupId: "stage-1-fairy-respawn-sub",
            kind: "sub-homing",
            position: { x: 160, y: 430 },
            scoreValue: 0
          },
          {
            pickupId: "stage-1-fairy-respawn-bomb",
            kind: "bomb",
            position: { x: 192, y: 446 },
            scoreValue: 0
          }
        ]
      },
      {
        id: "stage-1-hidden-cache-reward",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-1-pre-boss-cache-core"
        },
        reward: {
          pickupId: "stage-1-hidden-cache-medal",
          kind: "medal",
          position: { x: 160, y: 214 },
          scoreValue: 500
        },
        rewardOverrides: {
          hard: {
            pickupId: "stage-1-hidden-cache-miclus",
            kind: "miclus",
            position: { x: 160, y: 214 },
            scoreValue: 10_000
          }
        }
      }
    ],
    boss: {
      id: "stage-1-death-walkers",
      trigger: {
        type: "waves-cleared",
        minScrollY: 286
      },
      position: { x: 160, y: 92 },
      maxHealth: 320,
      scoreValue: 50_000,
      parts: [
        {
          id: "stage-1-walker-left",
          position: { x: 120, y: 92 },
          maxHealth: 160
        },
        {
          id: "stage-1-walker-right",
          position: { x: 200, y: 92 },
          maxHealth: 160
        }
      ],
      phases: [
        {
          id: "stage-1-walkers-opening",
          healthAtOrBelow: 320,
          patternId: "paired-diagonals"
        },
        {
          id: "stage-1-walkers-rotary-combo",
          healthAtOrBelow: 200,
          patternId: "rotary-straight-burst"
        },
        {
          id: "stage-1-walkers-desperation",
          healthAtOrBelow: 80,
          patternId: "desperation-flak"
        }
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
