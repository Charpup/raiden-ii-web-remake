import type {
  PickupKind,
  PresentationalBackgroundLayer,
  PresentationalScene,
  SimulationState
} from "../core/types";

const BACKGROUND_SCROLL_SCALE = 0.35;

function enemySpriteId(kind: string): string {
  switch (kind) {
    case "beige-scoutcraft":
      return "shared.enemy-scout";
    case "alpha-warplane":
      return "shared.enemy-warplane";
    case "small-tank":
      return "shared.enemy-ground";
    case "farm-turret":
    case "marsh-turret":
      return "shared.enemy-turret";
    case "item-carrier":
      return "shared.enemy-carrier";
    case "gunboat":
      return "shared.enemy-gunboat";
    case "hidden-tree":
    case "hidden-crate":
    case "revealed-fairy-bush":
      return "shared.enemy-scenery";
    default:
      return "shared.enemy-scout";
  }
}

function pickupSpriteId(kind: PickupKind): string {
  switch (kind) {
    case "medal":
    case "hidden-medal":
      return "shared.pickup-medal";
    case "fairy":
      return "shared.pickup-fairy";
    case "bomb":
      return "shared.pickup-bomb";
    case "extend":
      return "shared.pickup-extend";
    case "miclus":
      return "shared.pickup-miclus";
    case "main-vulcan":
    case "main-laser":
    case "main-plasma":
    case "sub-homing":
    case "sub-straight":
      return "shared.pickup-weapon";
  }
}

function effectSpriteId(kind: "hit" | "explosion" | "respawn"): string {
  switch (kind) {
    case "hit":
      return "shared.effect-hit";
    case "explosion":
      return "shared.effect-explosion";
    case "respawn":
      return "shared.effect-respawn";
  }
}

function backgroundLayersForStage(
  stageId: string,
  scrollY: number
): PresentationalBackgroundLayer[] {
  const scaledScroll = scrollY * BACKGROUND_SCROLL_SCALE;

  if (stageId === "stage-1") {
    return [
      {
        id: "stage-1-sky",
        spriteId: "stage-1.backdrop-sky",
        offsetY: -scaledScroll * 0.32,
        parallax: 0.32,
        opacity: 1
      },
      {
        id: "stage-1-terrain",
        spriteId: "stage-1.backdrop-terrain",
        offsetY: -scaledScroll,
        parallax: 1,
        opacity: 0.94
      }
    ];
  }

  return [
    {
      id: `${stageId}-backdrop`,
      spriteId: `${stageId}.backdrop`,
      offsetY: -scaledScroll * 0.72,
      parallax: 0.72,
      opacity: 1
    }
  ];
}

export class Renderer {
  sync(state: SimulationState): PresentationalScene {
    const effectPresentation = state.effects.map((effect) => {
      const progress = 1 - effect.framesRemaining / effect.totalFrames;
      const scale =
        effect.kind === "hit"
          ? 0.85 + progress * 0.6
          : effect.kind === "explosion"
            ? 0.95 + progress * 1.05
            : 1 + Math.sin(progress * Math.PI) * 0.28;
      const alpha =
        effect.kind === "respawn"
          ? 0.45 + Math.sin(progress * Math.PI) * 0.5
          : Math.max(0.25, 1 - progress * 0.72);

      return {
        id: effect.id,
        x: effect.position.x,
        y: effect.position.y,
        animation: effect.kind,
        spriteId: effectSpriteId(effect.kind),
        alpha,
        scale
      };
    });

    return {
      frame: state.frame,
      stageId: state.stage.stageId,
      scrollY: state.stage.scrollY,
      backgroundLayers: backgroundLayersForStage(state.stage.stageId, state.stage.scrollY),
      players: state.players
        .filter(
          (player) =>
            player.joined &&
            player.active &&
            (player.lifeState === "alive" || player.lifeState === "respawning")
        )
        .map((player) => ({
          id: player.id,
          x: player.position.x,
          y: player.position.y,
          animation: player.animation,
          spriteId: "shared.player-ship",
          alpha: player.lifeState === "respawning" ? 0.86 : 1
        })),
      enemies: state.enemies.map((enemy) => ({
        id: enemy.id,
        x: enemy.position.x,
        y: enemy.position.y,
        animation: enemy.animation,
        spriteId: enemySpriteId(enemy.kind)
      })),
      playerBullets: state.bullets
        .filter((bullet) => bullet.owner === "player")
        .map((bullet) => ({
          id: bullet.id,
          x: bullet.position.x,
          y: bullet.position.y,
          animation: "travel",
          spriteId: "shared.player-bullet"
        })),
      enemyBullets: state.bullets
        .filter((bullet) => bullet.owner === "enemy")
        .map((bullet) => ({
          id: bullet.id,
          x: bullet.position.x,
          y: bullet.position.y,
          animation: "travel",
          spriteId: "shared.enemy-bullet"
        })),
      pickups: state.pickups
        .filter((pickup) => !pickup.collected)
        .map((pickup) => ({
          id: pickup.id,
          x: pickup.position.x,
          y: pickup.position.y,
          animation: pickup.kind,
          spriteId: pickupSpriteId(pickup.kind),
          alpha: 0.9 + Math.sin((state.frame + pickup.position.x) / 18) * 0.08,
          scale: 1.08 + Math.sin((state.frame + pickup.position.y) / 22) * 0.08
        })),
      effects: effectPresentation,
      bossParts:
        state.boss?.active && state.boss.parts.length > 0
          ? state.boss.parts
              .filter((part) => part.active)
              .map((part) => ({
                id: part.id,
                x: part.position.x,
                y: part.position.y,
                animation: state.boss?.currentPhaseId ?? "boss-idle",
                spriteId: "shared.boss-walker-part"
              }))
          : [],
      boss:
        state.boss?.active
          ? {
              id: state.boss.bossId,
              x: state.boss.position.x,
              y: state.boss.position.y,
              animation: state.boss.currentPhaseId ?? "boss-idle",
              spriteId:
                state.boss.bossId === "stage-1-death-walkers"
                  ? "shared.boss-walker-body"
                  : "shared.boss-shell",
              scale: state.boss.bossId === "stage-1-death-walkers" ? 1.08 : 1
            }
          : null
    };
  }
}
