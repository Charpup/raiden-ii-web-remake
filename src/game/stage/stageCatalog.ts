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
    },
    clearTransition: {
      nextStageId: "stage-2"
    }
  },
  "stage-2": {
    id: "stage-2",
    name: "Urban Waterway",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 12,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-2-suburb-approach",
        trigger: { type: "scroll", scrollY: 16 },
        enemies: [
          {
            id: "stage-2-suburb-tank-left",
            kind: "suburb-tank",
            position: { x: 88, y: 122 },
            health: 18,
            scoreValue: 900,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-2-suburb-tank-right",
            kind: "suburb-tank",
            position: { x: 232, y: 122 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-2-suburb-gunship",
            kind: "suburb-gunship",
            position: { x: 160, y: 80 },
            health: 14,
            scoreValue: 800,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-2-canal-gunboats",
        trigger: { type: "scroll", scrollY: 52 },
        enemies: [
          {
            id: "stage-2-canal-gunboat-center",
            kind: "canal-gunboat",
            position: { x: 160, y: 100 },
            health: 36,
            scoreValue: 1_800,
            behaviorId: "gunboat-midline"
          },
          {
            id: "stage-2-canal-gunboat-left",
            kind: "canal-gunboat",
            position: { x: 104, y: 112 },
            health: 32,
            scoreValue: 1_600,
            spawnOffsetFrames: 2,
            behaviorId: "gunboat-midline"
          },
          {
            id: "stage-2-canal-gunboat-right",
            kind: "canal-gunboat",
            position: { x: 216, y: 112 },
            health: 32,
            scoreValue: 1_600,
            spawnOffsetFrames: 4,
            behaviorId: "gunboat-midline"
          }
        ]
      },
      {
        id: "stage-2-amphibious-pair",
        trigger: { type: "scroll", scrollY: 94 },
        enemies: [
          {
            id: "stage-2-amphibious-heavy-1",
            kind: "amphibious-heavy-tank",
            position: { x: 118, y: 126 },
            health: 72,
            scoreValue: 4_500,
            behaviorId: "amphibious-midboss"
          },
          {
            id: "stage-2-amphibious-heavy-2",
            kind: "amphibious-heavy-tank",
            position: { x: 206, y: 118 },
            health: 72,
            scoreValue: 4_500,
            spawnOffsetFrames: 6,
            behaviorId: "amphibious-midboss"
          }
        ]
      },
      {
        id: "stage-2-base-entrance",
        trigger: { type: "scroll", scrollY: 142 },
        enemies: [
          {
            id: "stage-2-base-cache-left",
            kind: "base-cache",
            position: { x: 92, y: 146 },
            health: 18,
            scoreValue: 700,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-2-base-hangar-core",
            kind: "hangar-core",
            position: { x: 160, y: 116 },
            health: 42,
            scoreValue: 2_500,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-2-base-cache-right",
            kind: "base-cache",
            position: { x: 228, y: 146 },
            health: 18,
            scoreValue: 700,
            spawnOffsetFrames: 4,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-2-return-to-town",
        trigger: { type: "scroll", scrollY: 196 },
        enemies: [
          {
            id: "stage-2-return-gunship-left",
            kind: "return-gunship",
            position: { x: 86, y: 86 },
            health: 18,
            scoreValue: 900,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-2-return-gunship-right",
            kind: "return-gunship",
            position: { x: 234, y: 86 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-2-return-laser-tank",
            kind: "laser-tank",
            position: { x: 160, y: 118 },
            health: 28,
            scoreValue: 1_400,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance"
          }
        ]
      },
      {
        id: "stage-2-hard-late-car",
        trigger: { type: "scroll", scrollY: 232 },
        cabinetProfiles: ["hard"],
        enemies: [
          {
            id: "stage-2-late-car",
            kind: "late-bonus-car",
            position: { x: 284, y: 168 },
            health: 10,
            scoreValue: 10_000,
            behaviorId: "dash-across"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-2-checkpoint-base-return",
        scrollY: 196,
        position: { x: 160, y: 472 },
        waveCursor: 4
      }
    ],
    hiddenTriggers: [],
    boss: {
      id: "stage-2-albatross",
      trigger: {
        type: "waves-cleared",
        minScrollY: 276
      },
      position: { x: 160, y: 92 },
      maxHealth: 760,
      scoreValue: 70_000,
      phases: [
        {
          id: "stage-2-albatross-opening",
          healthAtOrBelow: 760,
          patternId: "wing-guns"
        },
        {
          id: "stage-2-albatross-hornet-missiles",
          healthAtOrBelow: 560,
          patternId: "hornet-burst"
        },
        {
          id: "stage-2-albatross-desperation",
          healthAtOrBelow: 240,
          patternId: "desperation-rotary"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-3"
    }
  },
  "stage-3": {
    id: "stage-3",
    name: "Harbor Assault",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 12,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-3-superstructure-break",
        trigger: { type: "scroll", scrollY: 16 },
        enemies: [
          {
            id: "stage-3-opening-gunship-left",
            kind: "harbor-gunship",
            position: { x: 82, y: 88 },
            health: 14,
            scoreValue: 800,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-3-opening-gunship-right",
            kind: "harbor-gunship",
            position: { x: 238, y: 88 },
            health: 14,
            scoreValue: 800,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-3-opening-turret-core",
            kind: "superstructure-turret",
            position: { x: 160, y: 114 },
            health: 30,
            scoreValue: 1_500,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-3-crusher-tank-route",
        trigger: { type: "scroll", scrollY: 44 },
        enemies: [
          {
            id: "stage-3-opening-silver-crate",
            kind: "silver-crate",
            position: { x: 152, y: 156 },
            health: 12,
            scoreValue: 500,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-3-opening-crusher-tank-1",
            kind: "crusher-tank",
            position: { x: 124, y: 126 },
            health: 28,
            scoreValue: 1_400,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-3-opening-crusher-tank-2",
            kind: "crusher-tank",
            position: { x: 188, y: 126 },
            health: 28,
            scoreValue: 1_400,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance",
            scriptedDefeats: [
              {
                targetEnemyId: "stage-3-opening-silver-crate",
                afterFrames: 6
              }
            ]
          }
        ]
      },
      {
        id: "stage-3-open-water-gunboats",
        trigger: { type: "scroll", scrollY: 96 },
        enemies: [
          {
            id: "stage-3-open-water-gunboat-left",
            kind: "gunboat",
            position: { x: 96, y: 112 },
            health: 34,
            scoreValue: 1_800,
            behaviorId: "gunboat-midline"
          },
          {
            id: "stage-3-open-water-gunboat-right",
            kind: "gunboat",
            position: { x: 224, y: 112 },
            health: 34,
            scoreValue: 1_800,
            spawnOffsetFrames: 3,
            behaviorId: "gunboat-midline"
          },
          {
            id: "stage-3-open-water-rear-boat",
            kind: "gunboat",
            position: { x: 160, y: 136 },
            health: 34,
            scoreValue: 1_800,
            spawnOffsetFrames: 6,
            behaviorId: "gunboat-midline"
          }
        ]
      },
      {
        id: "stage-3-oil-platform-crossfire",
        trigger: { type: "scroll", scrollY: 146 },
        enemies: [
          {
            id: "stage-3-oil-platform-core",
            kind: "oil-platform-core",
            position: { x: 160, y: 112 },
            health: 42,
            scoreValue: 2_200,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-3-gunboat-power-drop",
            kind: "stationary-gunboat",
            position: { x: 228, y: 132 },
            health: 22,
            scoreValue: 1_300,
            spawnOffsetFrames: 3,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-3-dual-platform-route",
        trigger: { type: "scroll", scrollY: 196 },
        enemies: [
          {
            id: "stage-3-left-platform-core",
            kind: "dock-platform-core",
            position: { x: 98, y: 136 },
            health: 38,
            scoreValue: 1_900,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-3-right-platform-core",
            kind: "dock-platform-core",
            position: { x: 222, y: 136 },
            health: 38,
            scoreValue: 1_900,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-3-war-barge-approach",
        trigger: { type: "scroll", scrollY: 238 },
        enemies: [
          {
            id: "stage-3-war-barge-left",
            kind: "war-barge",
            position: { x: 108, y: 108 },
            health: 62,
            scoreValue: 3_600,
            behaviorId: "barge-broadside"
          },
          {
            id: "stage-3-war-barge-right",
            kind: "war-barge",
            position: { x: 212, y: 108 },
            health: 62,
            scoreValue: 3_600,
            spawnOffsetFrames: 4,
            behaviorId: "barge-broadside"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-3-checkpoint-war-barge-approach",
        scrollY: 238,
        position: { x: 160, y: 472 },
        waveCursor: 5
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-3-hidden-crushed-crate-extend",
        trigger: {
          type: "enemy-destroyed-by",
          enemyId: "stage-3-opening-silver-crate",
          sourceEnemyId: "stage-3-opening-crusher-tank-2"
        },
        reward: {
          pickupId: "stage-3-hidden-extend",
          kind: "extend",
          position: { x: 152, y: 210 },
          scoreValue: 0
        }
      },
      {
        id: "stage-3-hidden-gunboat-power",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-3-gunboat-power-drop"
        },
        reward: {
          pickupId: "stage-3-gunboat-main-laser",
          kind: "main-laser",
          position: { x: 228, y: 222 },
          scoreValue: 0
        }
      },
      {
        id: "stage-3-hidden-right-platform-miclus",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-3-right-platform-core"
        },
        reward: {
          pickupId: "stage-3-right-platform-miclus",
          kind: "miclus",
          position: { x: 222, y: 214 },
          scoreValue: 10_000
        }
      }
    ],
    boss: {
      id: "stage-3-battle-axe",
      trigger: {
        type: "waves-cleared",
        minScrollY: 302
      },
      position: { x: 160, y: 86 },
      maxHealth: 760,
      scoreValue: 80_000,
      phases: [
        {
          id: "stage-3-battle-axe-pop-up-battery",
          healthAtOrBelow: 760,
          patternId: "pop-up-batteries"
        },
        {
          id: "stage-3-battle-axe-broadside-pressure",
          healthAtOrBelow: 520,
          patternId: "broadside-lattice"
        },
        {
          id: "stage-3-battle-axe-exposed-core",
          healthAtOrBelow: 200,
          patternId: "exposed-core-spread"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-4"
    }
  },
  "stage-4": {
    id: "stage-4",
    name: "Ruins And Platforms",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 12,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-4-forest-advance",
        trigger: { type: "scroll", scrollY: 18 },
        enemies: [
          {
            id: "stage-4-forest-gunship-left",
            kind: "forest-gunship",
            position: { x: 82, y: 92 },
            health: 14,
            scoreValue: 800,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-4-forest-gunship-right",
            kind: "forest-gunship",
            position: { x: 238, y: 92 },
            health: 14,
            scoreValue: 800,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-4-forest-tank",
            kind: "forest-tank",
            position: { x: 160, y: 122 },
            health: 24,
            scoreValue: 1_200,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance"
          }
        ]
      },
      {
        id: "stage-4-ring-defense-circle",
        trigger: { type: "scroll", scrollY: 46 },
        enemies: [
          {
            id: "stage-4-ring-target-1",
            kind: "ring-target",
            position: { x: 160, y: 132 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-2",
            kind: "ring-target",
            position: { x: 194, y: 142 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 1,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-3",
            kind: "ring-target",
            position: { x: 216, y: 170 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 2,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-4",
            kind: "ring-target",
            position: { x: 194, y: 198 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 3,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-5",
            kind: "ring-target",
            position: { x: 160, y: 208 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 4,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-6",
            kind: "ring-target",
            position: { x: 126, y: 198 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 5,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-7",
            kind: "ring-target",
            position: { x: 104, y: 170 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 6,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-4-ring-target-8",
            kind: "ring-target",
            position: { x: 126, y: 142 },
            health: 10,
            scoreValue: 400,
            blocksProgression: false,
            spawnOffsetFrames: 7,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-4-first-platform-push",
        trigger: { type: "scroll", scrollY: 128 },
        enemies: [
          {
            id: "stage-4-platform-core-left",
            kind: "mobile-platform-core",
            position: { x: 110, y: 126 },
            health: 42,
            scoreValue: 2_000,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-4-platform-core-right",
            kind: "mobile-platform-core",
            position: { x: 210, y: 126 },
            health: 42,
            scoreValue: 2_000,
            spawnOffsetFrames: 3,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-4-third-platform-kamikaze-rush",
        trigger: { type: "scroll", scrollY: 214 },
        enemies: [
          {
            id: "stage-4-third-platform-core",
            kind: "mobile-platform-core",
            position: { x: 160, y: 126 },
            health: 54,
            scoreValue: 2_600,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-4-kamikaze-1",
            kind: "kamikaze-plane",
            position: { x: 68, y: 74 },
            health: 10,
            scoreValue: 700,
            spawnOffsetFrames: 1,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-4-kamikaze-2",
            kind: "kamikaze-plane",
            position: { x: 252, y: 74 },
            health: 10,
            scoreValue: 700,
            spawnOffsetFrames: 2,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-4-kamikaze-3",
            kind: "kamikaze-plane",
            position: { x: 112, y: 88 },
            health: 10,
            scoreValue: 700,
            spawnOffsetFrames: 3,
            behaviorId: "scoutcraft-swoop"
          },
          {
            id: "stage-4-kamikaze-4",
            kind: "kamikaze-plane",
            position: { x: 208, y: 88 },
            health: 10,
            scoreValue: 700,
            spawnOffsetFrames: 4,
            behaviorId: "scoutcraft-swoop"
          }
        ]
      },
      {
        id: "stage-4-twin-cannon-towers",
        trigger: { type: "scroll", scrollY: 258 },
        enemies: [
          {
            id: "stage-4-cannon-tower-left",
            kind: "cannon-tower",
            position: { x: 102, y: 132 },
            health: 38,
            scoreValue: 1_900,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-4-cannon-tower-right",
            kind: "cannon-tower",
            position: { x: 218, y: 132 },
            health: 38,
            scoreValue: 1_900,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-4-checkpoint-kamikaze-rush",
        scrollY: 214,
        position: { x: 160, y: 472 },
        waveCursor: 3
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-4-hidden-fairy-reveal",
        trigger: {
          type: "all-enemies-destroyed",
          enemyIds: [
            "stage-4-ring-target-1",
            "stage-4-ring-target-2",
            "stage-4-ring-target-3",
            "stage-4-ring-target-4",
            "stage-4-ring-target-5",
            "stage-4-ring-target-6",
            "stage-4-ring-target-7",
            "stage-4-ring-target-8"
          ]
        },
        revealEnemies: [
          {
            id: "stage-4-fairy-bush",
            kind: "hidden-bush",
            position: { x: 160, y: 176 },
            health: 14,
            scoreValue: 250,
            blocksProgression: false,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-4-hidden-fairy",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-4-fairy-bush"
        },
        reward: {
          pickupId: "stage-4-hidden-fairy-reward",
          kind: "fairy",
          position: { x: 160, y: 224 },
          scoreValue: 10_000
        }
      },
      {
        id: "stage-4-hidden-tower-power",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-4-cannon-tower-right"
        },
        reward: {
          pickupId: "stage-4-tower-main-plasma",
          kind: "main-plasma",
          position: { x: 218, y: 216 },
          scoreValue: 0
        }
      }
    ],
    boss: {
      id: "stage-4-thunder-fortress",
      trigger: {
        type: "waves-cleared",
        minScrollY: 318
      },
      position: { x: 160, y: 88 },
      maxHealth: 920,
      scoreValue: 90_000,
      parts: [
        {
          id: "stage-4-thunder-fortress-barricade-left",
          position: { x: 118, y: 96 },
          maxHealth: 160
        },
        {
          id: "stage-4-thunder-fortress-barricade-right",
          position: { x: 202, y: 96 },
          maxHealth: 160
        },
        {
          id: "stage-4-thunder-fortress-tower-left",
          position: { x: 104, y: 116 },
          maxHealth: 180
        },
        {
          id: "stage-4-thunder-fortress-tower-right",
          position: { x: 216, y: 116 },
          maxHealth: 180
        },
        {
          id: "stage-4-thunder-fortress-core",
          position: { x: 160, y: 88 },
          maxHealth: 240
        }
      ],
      phases: [
        {
          id: "stage-4-thunder-fortress-barricade",
          healthAtOrBelow: 920,
          patternId: "barricade-screen"
        },
        {
          id: "stage-4-thunder-fortress-tower-battery",
          healthAtOrBelow: 600,
          patternId: "tower-battery"
        },
        {
          id: "stage-4-thunder-fortress-core-storm",
          healthAtOrBelow: 240,
          patternId: "core-storm"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-5"
    }
  },
  "stage-5": {
    id: "stage-5",
    name: "Overrun Stronghold",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 13,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-5-ground-base-advance",
        trigger: { type: "scroll", scrollY: 18 },
        enemies: [
          {
            id: "stage-5-base-tank-left",
            kind: "base-tank",
            position: { x: 86, y: 124 },
            health: 20,
            scoreValue: 900,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-5-base-tank-right",
            kind: "base-tank",
            position: { x: 234, y: 124 },
            health: 20,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-5-base-bunker-core",
            kind: "base-bunker",
            position: { x: 160, y: 110 },
            health: 36,
            scoreValue: 1_800,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-5-rail-tank-gauntlet",
        trigger: { type: "scroll", scrollY: 58 },
        enemies: [
          {
            id: "stage-5-rail-tank-left",
            kind: "rail-tank",
            position: { x: 96, y: 118 },
            health: 28,
            scoreValue: 1_400,
            behaviorId: "rail-strafe"
          },
          {
            id: "stage-5-rail-tank-right",
            kind: "rail-tank",
            position: { x: 224, y: 118 },
            health: 28,
            scoreValue: 1_400,
            spawnOffsetFrames: 2,
            behaviorId: "rail-strafe"
          },
          {
            id: "stage-5-rail-gunship-center",
            kind: "rail-gunship",
            position: { x: 160, y: 84 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-5-bomber-corridor",
        trigger: { type: "scroll", scrollY: 106 },
        enemies: [
          {
            id: "stage-5-bomber-center",
            kind: "heavy-bomber",
            position: { x: 160, y: 78 },
            health: 44,
            scoreValue: 2_600,
            behaviorId: "bomber-lane"
          },
          {
            id: "stage-5-bomber-left",
            kind: "heavy-bomber",
            position: { x: 96, y: 92 },
            health: 40,
            scoreValue: 2_400,
            spawnOffsetFrames: 3,
            behaviorId: "bomber-lane"
          },
          {
            id: "stage-5-bomber-right",
            kind: "heavy-bomber",
            position: { x: 224, y: 92 },
            health: 40,
            scoreValue: 2_400,
            spawnOffsetFrames: 6,
            behaviorId: "bomber-lane"
          }
        ]
      },
      {
        id: "stage-5-refinery-crossfire",
        trigger: { type: "scroll", scrollY: 154 },
        enemies: [
          {
            id: "stage-5-refinery-core",
            kind: "refinery-core",
            position: { x: 160, y: 116 },
            health: 48,
            scoreValue: 2_400,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-5-refinery-turret-left",
            kind: "refinery-turret",
            position: { x: 104, y: 148 },
            health: 22,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-5-refinery-turret-right",
            kind: "refinery-turret",
            position: { x: 216, y: 148 },
            health: 22,
            scoreValue: 900,
            spawnOffsetFrames: 4,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-5-late-armor-surge",
        trigger: { type: "scroll", scrollY: 214 },
        enemies: [
          {
            id: "stage-5-armor-column-left",
            kind: "armor-column",
            position: { x: 100, y: 128 },
            health: 30,
            scoreValue: 1_500,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-5-armor-column-center",
            kind: "armor-column",
            position: { x: 160, y: 118 },
            health: 36,
            scoreValue: 1_800,
            spawnOffsetFrames: 2,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-5-armor-column-right",
            kind: "armor-column",
            position: { x: 220, y: 128 },
            health: 30,
            scoreValue: 1_500,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-5-late-fighter",
            kind: "late-fighter",
            position: { x: 160, y: 84 },
            health: 16,
            scoreValue: 800,
            spawnOffsetFrames: 6,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-5-pre-boss-cache",
        trigger: { type: "scroll", scrollY: 266 },
        enemies: [
          {
            id: "stage-5-cache-left",
            kind: "hidden-cache",
            position: { x: 112, y: 150 },
            health: 14,
            scoreValue: 500,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-5-cache-core",
            kind: "hidden-cache",
            position: { x: 160, y: 132 },
            health: 20,
            scoreValue: 800,
            spawnOffsetFrames: 2,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-5-cache-right",
            kind: "hidden-cache",
            position: { x: 208, y: 150 },
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
        id: "stage-5-checkpoint-refinery-exit",
        scrollY: 204,
        position: { x: 160, y: 472 },
        waveCursor: 4
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-5-hidden-cache-medal",
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-5-cache-core"
        },
        reward: {
          pickupId: "stage-5-hidden-cache-medal",
          kind: "hidden-medal",
          position: { x: 160, y: 216 },
          scoreValue: 10_000
        }
      }
    ],
    boss: {
      id: "stage-5-black-bird",
      trigger: {
        type: "waves-cleared",
        minScrollY: 318
      },
      position: { x: 160, y: 88 },
      maxHealth: 880,
      scoreValue: 100_000,
      phases: [
        {
          id: "stage-5-black-bird-opening",
          healthAtOrBelow: 880,
          patternId: "bomber-shell"
        },
        {
          id: "stage-5-black-bird-blue-form",
          healthAtOrBelow: 600,
          patternId: "blue-form-pincer"
        },
        {
          id: "stage-5-black-bird-red-form",
          healthAtOrBelow: 340,
          patternId: "red-form-desperation"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-6"
    }
  },
  "stage-6": {
    id: "stage-6",
    name: "Crystal Orbit",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 13,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-6-launch-scramble",
        trigger: { type: "scroll", scrollY: 18 },
        enemies: [
          {
            id: "stage-6-launch-fighter-left",
            kind: "launch-fighter",
            position: { x: 88, y: 88 },
            health: 16,
            scoreValue: 800,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-6-launch-fighter-right",
            kind: "launch-fighter",
            position: { x: 232, y: 88 },
            health: 16,
            scoreValue: 800,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-6-launch-turret-core",
            kind: "launch-turret",
            position: { x: 160, y: 116 },
            health: 34,
            scoreValue: 1_700,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-6-crystal-corridor",
        trigger: { type: "scroll", scrollY: 60 },
        enemies: [
          {
            id: "stage-6-crystal-spire-left",
            kind: "crystal-spire",
            position: { x: 98, y: 146 },
            health: 24,
            scoreValue: 1_000,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-6-crystal-spire-core",
            kind: "crystal-spire",
            position: { x: 160, y: 128 },
            health: 28,
            scoreValue: 1_200,
            spawnOffsetFrames: 2,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-6-crystal-spire-right",
            kind: "crystal-spire",
            position: { x: 222, y: 146 },
            health: 24,
            scoreValue: 1_000,
            spawnOffsetFrames: 4,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-6-asteroid-ambush",
        trigger: { type: "scroll", scrollY: 112 },
        enemies: [
          {
            id: "stage-6-asteroid-fighter-left",
            kind: "asteroid-fighter",
            position: { x: 92, y: 82 },
            health: 18,
            scoreValue: 900,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-6-asteroid-fighter-right",
            kind: "asteroid-fighter",
            position: { x: 228, y: 82 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-6-meteor-carrier",
            kind: "meteor-carrier",
            position: { x: 160, y: 102 },
            health: 40,
            scoreValue: 2_000,
            spawnOffsetFrames: 5,
            behaviorId: "carrier-drift"
          }
        ]
      },
      {
        id: "stage-6-defense-array",
        trigger: { type: "scroll", scrollY: 166 },
        enemies: [
          {
            id: "stage-6-defense-turret-left",
            kind: "defense-turret",
            position: { x: 104, y: 144 },
            health: 26,
            scoreValue: 1_100,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-6-defense-array-core",
            kind: "defense-array-core",
            position: { x: 160, y: 116 },
            health: 52,
            scoreValue: 2_600,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-6-defense-turret-right",
            kind: "defense-turret",
            position: { x: 216, y: 144 },
            health: 26,
            scoreValue: 1_100,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-6-red-crystal-escape",
        trigger: { type: "scroll", scrollY: 222 },
        enemies: [
          {
            id: "stage-6-red-crystal",
            kind: "red-crystal",
            position: { x: 160, y: 154 },
            health: 12,
            scoreValue: 600,
            blocksProgression: false,
            stateTag: "hovering",
            stateTransitions: [
              {
                afterFrames: 12,
                stateTag: "escape-window"
              }
            ],
            behaviorId: "escape-crystal"
          },
          {
            id: "stage-6-escape-escort-left",
            kind: "crystal-escort",
            position: { x: 96, y: 98 },
            health: 16,
            scoreValue: 800,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-6-escape-escort-right",
            kind: "crystal-escort",
            position: { x: 224, y: 98 },
            health: 16,
            scoreValue: 800,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-6-reactor-approach",
        trigger: { type: "scroll", scrollY: 278 },
        enemies: [
          {
            id: "stage-6-reactor-guard-left",
            kind: "reactor-guard",
            position: { x: 102, y: 134 },
            health: 28,
            scoreValue: 1_300,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-6-reactor-core",
            kind: "reactor-core",
            position: { x: 160, y: 116 },
            health: 56,
            scoreValue: 3_200,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-6-reactor-guard-right",
            kind: "reactor-guard",
            position: { x: 218, y: 134 },
            health: 28,
            scoreValue: 1_300,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-6-checkpoint-defense-exit",
        scrollY: 212,
        position: { x: 160, y: 472 },
        waveCursor: 4
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-6-hidden-red-crystal-extend",
        trigger: {
          type: "enemy-destroyed-in-state",
          enemyId: "stage-6-red-crystal",
          stateTag: "escape-window"
        },
        reward: {
          pickupId: "stage-6-red-crystal-extend",
          kind: "extend",
          position: { x: 160, y: 230 },
          scoreValue: 0
        }
      }
    ],
    boss: {
      id: "stage-6-graphite",
      trigger: {
        type: "waves-cleared",
        minScrollY: 336
      },
      position: { x: 160, y: 88 },
      maxHealth: 960,
      scoreValue: 110_000,
      phases: [
        {
          id: "stage-6-graphite-prism-opening",
          healthAtOrBelow: 960,
          patternId: "prism-opening"
        },
        {
          id: "stage-6-graphite-rotary-lattice",
          healthAtOrBelow: 620,
          patternId: "rotary-lattice"
        },
        {
          id: "stage-6-graphite-core-rush",
          healthAtOrBelow: 260,
          patternId: "core-rush"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-7"
    }
  },
  "stage-7": {
    id: "stage-7",
    name: "Battleship Gauntlet",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 13,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-7-battleship-deck",
        trigger: { type: "scroll", scrollY: 18 },
        enemies: [
          {
            id: "stage-7-deck-gunship-left",
            kind: "deck-gunship",
            position: { x: 84, y: 90 },
            health: 16,
            scoreValue: 800,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-7-deck-gunship-right",
            kind: "deck-gunship",
            position: { x: 236, y: 90 },
            health: 16,
            scoreValue: 800,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-7-deck-turret-core",
            kind: "deck-turret",
            position: { x: 160, y: 118 },
            health: 36,
            scoreValue: 1_800,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-7-meteor-scramble",
        trigger: { type: "scroll", scrollY: 72 },
        enemies: [
          {
            id: "stage-7-meteor-fighter-left",
            kind: "meteor-fighter",
            position: { x: 92, y: 80 },
            health: 18,
            scoreValue: 900,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-7-meteor-fighter-right",
            kind: "meteor-fighter",
            position: { x: 228, y: 80 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-7-meteor-barge",
            kind: "meteor-barge",
            position: { x: 160, y: 106 },
            health: 44,
            scoreValue: 2_200,
            spawnOffsetFrames: 4,
            behaviorId: "barge-broadside"
          }
        ]
      },
      {
        id: "stage-7-nuclear-rocket-battery",
        trigger: { type: "scroll", scrollY: 134 },
        enemies: [
          {
            id: "stage-7-rocket-battery-1",
            kind: "rocket-battery",
            position: { x: 100, y: 152 },
            health: 16,
            scoreValue: 600,
            blocksProgression: false,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-7-rocket-battery-2",
            kind: "rocket-battery",
            position: { x: 140, y: 136 },
            health: 16,
            scoreValue: 600,
            blocksProgression: false,
            spawnOffsetFrames: 1,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-7-rocket-battery-3",
            kind: "rocket-battery",
            position: { x: 180, y: 136 },
            health: 16,
            scoreValue: 600,
            blocksProgression: false,
            spawnOffsetFrames: 2,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-7-rocket-battery-4",
            kind: "rocket-battery",
            position: { x: 220, y: 152 },
            health: 16,
            scoreValue: 600,
            blocksProgression: false,
            spawnOffsetFrames: 3,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-7-artillery-corridor",
        trigger: { type: "scroll", scrollY: 198 },
        enemies: [
          {
            id: "stage-7-artillery-left",
            kind: "artillery-tower",
            position: { x: 104, y: 140 },
            health: 30,
            scoreValue: 1_400,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-7-artillery-core",
            kind: "artillery-core",
            position: { x: 160, y: 116 },
            health: 60,
            scoreValue: 3_000,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-7-artillery-right",
            kind: "artillery-tower",
            position: { x: 216, y: 140 },
            health: 30,
            scoreValue: 1_400,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-7-launch-apron",
        trigger: { type: "scroll", scrollY: 264 },
        enemies: [
          {
            id: "stage-7-launch-apron-core",
            kind: "launch-apron-core",
            position: { x: 160, y: 118 },
            health: 64,
            scoreValue: 3_600,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-7-launch-apron-guard-left",
            kind: "launch-apron-guard",
            position: { x: 102, y: 132 },
            health: 24,
            scoreValue: 1_200,
            spawnOffsetFrames: 2,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-7-launch-apron-guard-right",
            kind: "launch-apron-guard",
            position: { x: 218, y: 132 },
            health: 24,
            scoreValue: 1_200,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-7-checkpoint-artillery-corridor",
        scrollY: 252,
        position: { x: 160, y: 472 },
        waveCursor: 4
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-7-hidden-rocket-cache-reveal",
        expiresOnBossStart: true,
        trigger: {
          type: "all-enemies-destroyed",
          enemyIds: [
            "stage-7-rocket-battery-1",
            "stage-7-rocket-battery-2",
            "stage-7-rocket-battery-3",
            "stage-7-rocket-battery-4"
          ]
        },
        revealEnemies: [
          {
            id: "stage-7-fairy-beacon",
            kind: "fairy-beacon",
            position: { x: 160, y: 188 },
            health: 14,
            scoreValue: 250,
            blocksProgression: false,
            behaviorId: "static-scenery"
          }
        ]
      },
      {
        id: "stage-7-hidden-fairy",
        expiresOnBossStart: true,
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-7-fairy-beacon"
        },
        reward: {
          pickupId: "stage-7-hidden-fairy-reward",
          kind: "fairy",
          position: { x: 160, y: 228 },
          scoreValue: 10_000
        }
      }
    ],
    boss: {
      id: "stage-7-huge-satellite",
      trigger: {
        type: "waves-cleared",
        minScrollY: 332
      },
      position: { x: 160, y: 86 },
      maxHealth: 1_020,
      scoreValue: 120_000,
      phases: [
        {
          id: "stage-7-huge-satellite-dish-array",
          healthAtOrBelow: 1_020,
          patternId: "dish-array"
        },
        {
          id: "stage-7-huge-satellite-orbital-burst",
          healthAtOrBelow: 640,
          patternId: "orbital-burst"
        },
        {
          id: "stage-7-huge-satellite-core-collapse",
          healthAtOrBelow: 280,
          patternId: "core-collapse"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-8"
    }
  },
  "stage-8": {
    id: "stage-8",
    name: "Alien Hive",
    arenaBounds: { width: 320, height: 568 },
    baseScrollSpeed: 14,
    difficulty: sharedDifficulty,
    loopTuning: sharedLoopTuning,
    waves: [
      {
        id: "stage-8-alien-surface",
        trigger: { type: "scroll", scrollY: 18 },
        enemies: [
          {
            id: "stage-8-surface-fighter-left",
            kind: "alien-fighter",
            position: { x: 88, y: 88 },
            health: 18,
            scoreValue: 900,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-8-surface-fighter-right",
            kind: "alien-fighter",
            position: { x: 232, y: 88 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-8-surface-node-core",
            kind: "surface-node",
            position: { x: 160, y: 116 },
            health: 42,
            scoreValue: 2_200,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-8-roaming-crystal-chase",
        trigger: { type: "scroll", scrollY: 76 },
        enemies: [
          {
            id: "stage-8-roaming-crystal",
            kind: "roaming-crystal",
            position: { x: 160, y: 150 },
            health: 18,
            scoreValue: 1_000,
            blocksProgression: false,
            behaviorId: "roaming-crystal"
          },
          {
            id: "stage-8-chase-escort-left",
            kind: "chase-escort",
            position: { x: 92, y: 96 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-8-chase-escort-right",
            kind: "chase-escort",
            position: { x: 228, y: 96 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-8-facility-crossfire",
        trigger: { type: "scroll", scrollY: 146 },
        enemies: [
          {
            id: "stage-8-facility-turret-left",
            kind: "facility-turret",
            position: { x: 104, y: 144 },
            health: 26,
            scoreValue: 1_100,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-8-facility-core",
            kind: "facility-core",
            position: { x: 160, y: 116 },
            health: 58,
            scoreValue: 3_200,
            spawnOffsetFrames: 2,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-8-facility-turret-right",
            kind: "facility-turret",
            position: { x: 216, y: 144 },
            health: 26,
            scoreValue: 1_100,
            spawnOffsetFrames: 4,
            behaviorId: "fixed-aimed-burst"
          }
        ]
      },
      {
        id: "stage-8-pre-boss-miclus-line",
        trigger: { type: "scroll", scrollY: 224 },
        enemies: [
          {
            id: "stage-8-miclus-obelisk",
            kind: "miclus-obelisk",
            position: { x: 160, y: 162 },
            health: 18,
            scoreValue: 800,
            blocksProgression: false,
            behaviorId: "static-scenery"
          },
          {
            id: "stage-8-preboss-escort-left",
            kind: "preboss-escort",
            position: { x: 96, y: 102 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 2,
            behaviorId: "escort-sweep"
          },
          {
            id: "stage-8-preboss-escort-right",
            kind: "preboss-escort",
            position: { x: 224, y: 102 },
            health: 18,
            scoreValue: 900,
            spawnOffsetFrames: 4,
            behaviorId: "escort-sweep"
          }
        ]
      },
      {
        id: "stage-8-mother-haven-approach",
        trigger: { type: "scroll", scrollY: 294 },
        enemies: [
          {
            id: "stage-8-approach-core",
            kind: "approach-core",
            position: { x: 160, y: 116 },
            health: 72,
            scoreValue: 4_000,
            behaviorId: "fixed-aimed-burst"
          },
          {
            id: "stage-8-approach-guard-left",
            kind: "approach-guard",
            position: { x: 104, y: 132 },
            health: 28,
            scoreValue: 1_300,
            spawnOffsetFrames: 2,
            behaviorId: "ground-lane-advance"
          },
          {
            id: "stage-8-approach-guard-right",
            kind: "approach-guard",
            position: { x: 216, y: 132 },
            health: 28,
            scoreValue: 1_300,
            spawnOffsetFrames: 4,
            behaviorId: "ground-lane-advance"
          }
        ]
      }
    ],
    checkpoints: [
      {
        id: "stage-8-checkpoint-facility-exit",
        scrollY: 214,
        position: { x: 160, y: 472 },
        waveCursor: 3
      }
    ],
    hiddenTriggers: [
      {
        id: "stage-8-hidden-miclus-line",
        expiresOnBossStart: true,
        trigger: {
          type: "enemy-destroyed",
          enemyId: "stage-8-miclus-obelisk"
        },
        rewards: [
          {
            pickupId: "stage-8-hidden-miclus",
            kind: "miclus",
            position: { x: 128, y: 232 },
            scoreValue: 10_000
          },
          {
            pickupId: "stage-8-hidden-medal-1",
            kind: "medal",
            position: { x: 152, y: 220 },
            scoreValue: 500
          },
          {
            pickupId: "stage-8-hidden-medal-2",
            kind: "medal",
            position: { x: 176, y: 208 },
            scoreValue: 500
          },
          {
            pickupId: "stage-8-hidden-medal-3",
            kind: "medal",
            position: { x: 200, y: 196 },
            scoreValue: 500
          }
        ]
      }
    ],
    boss: {
      id: "stage-8-mother-haven",
      trigger: {
        type: "waves-cleared",
        minScrollY: 360
      },
      position: { x: 160, y: 84 },
      maxHealth: 960,
      scoreValue: 150_000,
      phases: [
        {
          id: "stage-8-mother-haven-shell",
          healthAtOrBelow: 960,
          patternId: "shell-volley"
        },
        {
          id: "stage-8-mother-haven-siege",
          healthAtOrBelow: 600,
          patternId: "siege-lattice"
        },
        {
          id: "stage-8-mother-haven-core",
          healthAtOrBelow: 280,
          patternId: "core-collapse"
        }
      ]
    },
    clearTransition: {
      nextStageId: "stage-1",
      incrementLoop: true,
      enterEnding: true
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
