import type {
  BossRuntimeState,
  CheckpointState,
  EnemyState,
  RuntimeEvent,
  RuntimePickupState,
  SessionConfig,
  SimulationState,
  StageRuntimeState
} from "../core/types";
import { getStageDefinition } from "./stageCatalog";
import type {
  BossDefinition,
  BossPhaseDefinition,
  HiddenTriggerDefinition,
  StageDefinition,
  WaveDefinition
} from "./stageTypes";

export interface StageAdvanceResult {
  stage: StageRuntimeState;
  enemies: EnemyState[];
  pickups: RuntimePickupState[];
  boss: BossRuntimeState | null;
  events: RuntimeEvent[];
  clearedThisFrame: boolean;
  loopAdvanceEnabled: boolean;
  loopTargetStageId: string | null;
}

function cloneEnemy(enemy: EnemyState): EnemyState {
  return {
    ...enemy,
    position: { ...enemy.position }
  };
}

function clonePickup(pickup: RuntimePickupState): RuntimePickupState {
  return {
    ...pickup,
    position: { ...pickup.position }
  };
}

function cloneBoss(boss: BossRuntimeState | null): BossRuntimeState | null {
  return boss
    ? {
        ...boss,
        position: { ...boss.position }
      }
    : null;
}

function roundHealth(value: number): number {
  return Math.max(1, Math.round(value));
}

function selectBossPhaseId(
  phases: BossPhaseDefinition[],
  health: number
): string | null {
  let selected = phases[0]?.id ?? null;

  for (const phase of phases) {
    if (health <= phase.healthAtOrBelow) {
      selected = phase.id;
    }
  }

  return selected;
}

function isWaveTriggered(
  wave: WaveDefinition,
  frame: number,
  scrollY: number
): boolean {
  if (wave.trigger.type === "frame") {
    return frame >= wave.trigger.frame;
  }

  return scrollY >= wave.trigger.scrollY;
}

function isHiddenTriggered(
  trigger: HiddenTriggerDefinition,
  stage: StageRuntimeState
): boolean {
  if (trigger.trigger.type === "scroll") {
    return stage.scrollY >= trigger.trigger.scrollY;
  }

  return stage.defeatedEnemyIds.includes(trigger.trigger.enemyId);
}

export class StageRunner {
  getDefinition(stageId: string): StageDefinition {
    return getStageDefinition(stageId);
  }

  getArenaBounds(stageId: string): StageDefinition["arenaBounds"] {
    return this.getDefinition(stageId).arenaBounds;
  }

  createInitialStageState(stageId: string): StageRuntimeState {
    return {
      stageId,
      scrollY: 0,
      waveCursor: 0,
      checkpointCursor: 0,
      armedCheckpointId: null,
      activeBossId: null,
      activeBossPhaseId: null,
      triggeredHiddenIds: [],
      defeatedEnemyIds: [],
      completed: false
    };
  }

  getCheckpointState(stage: StageRuntimeState): CheckpointState {
    const definition = this.getDefinition(stage.stageId);
    const checkpoint =
      definition.checkpoints.find((entry) => entry.id === stage.armedCheckpointId) ?? null;

    return {
      checkpointId: checkpoint?.id ?? `${stage.stageId}-start`,
      position: checkpoint?.position
        ? { ...checkpoint.position }
        : {
            x: definition.arenaBounds.width / 2,
            y: definition.arenaBounds.height - 48
          },
      waveCursor: checkpoint?.waveCursor ?? 0,
      scrollY: checkpoint?.scrollY ?? 0
    };
  }

  restoreStageFromCheckpoint(stage: StageRuntimeState): StageRuntimeState {
    const definition = this.getDefinition(stage.stageId);
    const checkpointIndex = definition.checkpoints.findIndex(
      (entry) => entry.id === stage.armedCheckpointId
    );
    const checkpoint = checkpointIndex >= 0 ? definition.checkpoints[checkpointIndex] : null;

    return {
      ...stage,
      scrollY: checkpoint?.scrollY ?? 0,
      waveCursor: checkpoint?.waveCursor ?? 0,
      checkpointCursor: checkpointIndex >= 0 ? checkpointIndex + 1 : 0,
      armedCheckpointId: checkpoint?.id ?? null,
      activeBossId: null,
      activeBossPhaseId: null,
      triggeredHiddenIds: [],
      defeatedEnemyIds: [],
      completed: false
    };
  }

  advance(state: SimulationState): StageAdvanceResult {
    const definition = this.getDefinition(state.stage.stageId);
    const events: RuntimeEvent[] = [];
    const enemies = state.enemies.map(cloneEnemy);
    const pickups = state.pickups.map(clonePickup);
    const stage: StageRuntimeState = {
      ...state.stage,
      triggeredHiddenIds: [...state.stage.triggeredHiddenIds],
      defeatedEnemyIds: [...state.stage.defeatedEnemyIds]
    };
    let boss = cloneBoss(state.boss);
    let clearedThisFrame = false;

    if (!stage.completed && !boss?.active) {
      stage.scrollY += this.getScrollSpeed(definition, state.session);
    }

    while (
      stage.checkpointCursor < definition.checkpoints.length &&
      stage.scrollY >= definition.checkpoints[stage.checkpointCursor].scrollY
    ) {
      const checkpoint = definition.checkpoints[stage.checkpointCursor];
      stage.armedCheckpointId = checkpoint.id;
      stage.checkpointCursor += 1;
      events.push({
        type: "checkpoint-armed",
        checkpointId: checkpoint.id,
        atFrame: state.frame
      });
    }

    while (
      stage.waveCursor < definition.waves.length &&
      isWaveTriggered(definition.waves[stage.waveCursor], state.frame, stage.scrollY)
    ) {
      const wave = definition.waves[stage.waveCursor];
      const spawned = wave.enemies.map((spawn) =>
        this.createEnemyState(spawn, wave.id, state.session)
      );

      enemies.push(...spawned);
      stage.waveCursor += 1;
      events.push({
        type: "wave-spawned",
        waveId: wave.id,
        enemyIds: spawned.map((enemy) => enemy.id),
        atFrame: state.frame
      });
    }

    for (const hidden of definition.hiddenTriggers) {
      if (stage.triggeredHiddenIds.includes(hidden.id) || !isHiddenTriggered(hidden, stage)) {
        continue;
      }

      stage.triggeredHiddenIds.push(hidden.id);
      pickups.push({
        id: hidden.reward.pickupId,
        kind: hidden.reward.kind,
        position: { ...hidden.reward.position },
        collected: false,
        scoreValue: hidden.reward.scoreValue,
        sourceId: hidden.id
      });
      events.push({
        type: "hidden-triggered",
        triggerId: hidden.id,
        pickupId: hidden.reward.pickupId,
        atFrame: state.frame
      });
    }

    if (
      definition.boss &&
      !boss &&
      stage.waveCursor >= definition.waves.length &&
      enemies.length === 0 &&
      stage.scrollY >= definition.boss.trigger.minScrollY
    ) {
      boss = this.createBossState(definition.boss, state.session, state.frame);
      stage.activeBossId = boss.bossId;
      stage.activeBossPhaseId = boss.currentPhaseId;
      events.push({
        type: "boss-started",
        bossId: boss.bossId,
        phaseId: boss.currentPhaseId ?? "unknown-phase",
        atFrame: state.frame
      });
    }

    if (definition.boss && boss?.active && !boss.defeated) {
      const nextPhaseId = selectBossPhaseId(definition.boss.phases, boss.health);
      if (nextPhaseId && nextPhaseId !== boss.currentPhaseId) {
        boss = {
          ...boss,
          currentPhaseId: nextPhaseId
        };
        stage.activeBossPhaseId = nextPhaseId;
        events.push({
          type: "boss-phase-changed",
          bossId: boss.bossId,
          phaseId: nextPhaseId,
          atFrame: state.frame
        });
      }
    }

    if (boss?.defeated && !stage.completed) {
      stage.completed = true;
      stage.activeBossId = null;
      stage.activeBossPhaseId = null;
      boss = {
        ...boss,
        active: false,
        currentPhaseId: null
      };
      clearedThisFrame = true;
      events.push({
        type: "stage-cleared",
        stageId: stage.stageId,
        atFrame: state.frame
      });
    }

    return {
      stage,
      enemies,
      pickups,
      boss,
      events,
      clearedThisFrame,
      loopAdvanceEnabled: Boolean(definition.loopAdvance?.enabled),
      loopTargetStageId: definition.loopAdvance?.nextStageId ?? null
    };
  }

  private createEnemyState(
    spawn: WaveDefinition["enemies"][number],
    waveId: string,
    session: SessionConfig
  ): EnemyState {
    const definition = this.getDefinition(session.stageId);
    const multiplier = this.getEnemyHealthMultiplier(definition, session);
    const maxHealth = roundHealth(spawn.health * multiplier);

    return {
      id: spawn.id,
      kind: spawn.kind,
      position: { ...spawn.position },
      health: maxHealth,
      maxHealth,
      scoreValue: spawn.scoreValue,
      spawnedByWaveId: waveId,
      animation: "idle"
    };
  }

  private createBossState(
    boss: BossDefinition,
    session: SessionConfig,
    frame: number
  ): BossRuntimeState {
    const definition = this.getDefinition(session.stageId);
    const maxHealth = roundHealth(
      boss.maxHealth * this.getBossHealthMultiplier(definition, session)
    );
    const currentPhaseId = selectBossPhaseId(boss.phases, maxHealth);

    return {
      bossId: boss.id,
      active: true,
      defeated: false,
      currentPhaseId,
      position: { ...boss.position },
      health: maxHealth,
      maxHealth,
      enteredAtFrame: frame
    };
  }

  private getEnemyHealthMultiplier(
    definition: StageDefinition,
    session: SessionConfig
  ): number {
    return (
      definition.difficulty[session.cabinetProfile].enemyHealthMultiplier *
      (1 + definition.loopTuning.enemyHealthMultiplierPerLoop * session.loopIndex)
    );
  }

  private getBossHealthMultiplier(
    definition: StageDefinition,
    session: SessionConfig
  ): number {
    return (
      definition.difficulty[session.cabinetProfile].bossHealthMultiplier *
      (1 + definition.loopTuning.bossHealthMultiplierPerLoop * session.loopIndex)
    );
  }

  private getScrollSpeed(definition: StageDefinition, session: SessionConfig): number {
    return (
      definition.baseScrollSpeed *
      definition.difficulty[session.cabinetProfile].scrollSpeedMultiplier *
      (1 + definition.loopTuning.scrollSpeedMultiplierPerLoop * session.loopIndex)
    );
  }
}
