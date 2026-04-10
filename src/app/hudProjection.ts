import type {
  CabinetProfile,
  PlayerLifeState,
  PlayerSlot,
  SessionFlowState,
  SimulationState
} from "../game/core/types";

export interface HudPlayerProjection {
  id: PlayerSlot;
  joined: boolean;
  score: number;
  scoreLabel: string;
  lives: number;
  bombs: number;
  mainWeaponLabel: string;
  subWeaponLabel: string | null;
  lifeState: PlayerLifeState;
  continueSecondsRemaining: number | null;
}

export interface HudBossProjection {
  id: string;
  phaseLabel: string | null;
  healthRatio: number;
  healthLabel: string;
}

export interface HudProjection {
  stageId: string;
  stageLabel: string;
  loopIndex: number;
  loopLabel: string;
  cabinetProfile: CabinetProfile;
  flow: SessionFlowState;
  players: HudPlayerProjection[];
  boss: HudBossProjection | null;
}

const stageLabels: Record<string, string> = {
  "stage-1": "Stage 1",
  "stage-2": "Stage 2",
  "stage-3": "Stage 3",
  "stage-4": "Stage 4",
  "stage-5": "Stage 5",
  "stage-6": "Stage 6",
  "stage-7": "Stage 7",
  "stage-8": "Stage 8"
};

function formatScore(score: number): string {
  return score.toString().padStart(6, "0");
}

function formatMainWeaponLabel(
  type: SimulationState["players"][number]["mainWeapon"]["type"],
  level: number
): string {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)} Lv${level}`;
}

function formatSubWeaponLabel(
  subWeapon: SimulationState["players"][number]["subWeapon"]
): string | null {
  if (!subWeapon) {
    return null;
  }

  return `${subWeapon.type.charAt(0).toUpperCase()}${subWeapon.type.slice(1)} Lv${subWeapon.level}`;
}

export function projectHud(state: SimulationState): HudProjection {
  const boss = state.boss?.active
    ? {
        id: state.boss.bossId,
        phaseLabel: state.boss.currentPhaseId,
        healthRatio:
          state.boss.maxHealth > 0
            ? Math.max(0, Math.min(1, state.boss.health / state.boss.maxHealth))
            : 0,
        healthLabel: `${Math.max(0, state.boss.health)} / ${Math.max(0, state.boss.maxHealth)}`
      }
    : null;

  return {
    stageId: state.stage.stageId,
    stageLabel: stageLabels[state.stage.stageId] ?? state.stage.stageId,
    loopIndex: state.session.loopIndex,
    loopLabel: `Loop ${state.session.loopIndex + 1}`,
    cabinetProfile: state.session.cabinetProfile,
    flow: state.flow,
    players: state.players.map((player) => ({
      id: player.id,
      joined: player.joined,
      score: player.score,
      scoreLabel: formatScore(player.score),
      lives: player.lives,
      bombs: player.bombs,
      mainWeaponLabel: formatMainWeaponLabel(player.mainWeapon.type, player.mainWeapon.level),
      subWeaponLabel: formatSubWeaponLabel(player.subWeapon),
      lifeState: player.lifeState,
      continueSecondsRemaining:
        player.continueFramesRemaining === null
          ? null
          : Math.max(0, Math.ceil(player.continueFramesRemaining / 60))
    })),
    boss
  };
}
