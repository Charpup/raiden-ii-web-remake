import { Application, Container, Graphics } from "pixi.js";
import type { PresentationalEntity, PresentationalScene } from "../../game/core/types";

export interface SceneAdapter {
  attach(host: HTMLElement): Promise<void>;
  sync(scene: PresentationalScene): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

type EntityKind = "player" | "enemy" | "pickup" | "boss" | "boss-part";

function destroyRemovedEntities(
  registry: Map<string, Graphics>,
  nextIds: Set<string>
): void {
  for (const [id, graphic] of registry.entries()) {
    if (nextIds.has(id)) {
      continue;
    }

    graphic.destroy();
    registry.delete(id);
  }
}

function drawEntityShape(graphic: Graphics, kind: EntityKind): void {
  graphic.clear();

  switch (kind) {
    case "player":
      graphic.roundRect(-10, -12, 20, 24, 6).fill({ color: 0x57d8ff });
      break;
    case "enemy":
      graphic.roundRect(-9, -9, 18, 18, 4).fill({ color: 0xff8d57 });
      break;
    case "pickup":
      graphic.circle(0, 0, 6).fill({ color: 0xffd25e });
      break;
    case "boss":
      graphic.roundRect(-36, -22, 72, 44, 8).fill({ color: 0xa0b4c9 });
      break;
    case "boss-part":
      graphic.roundRect(-18, -14, 36, 28, 6).fill({ color: 0xe2edf7 });
      break;
  }
}

export class PixiSceneAdapter implements SceneAdapter {
  private readonly app = new Application();

  private readonly entityLayer = new Container();

  private readonly entityRegistry = new Map<string, Graphics>();

  private attached = false;

  async attach(host: HTMLElement): Promise<void> {
    if (this.attached) {
      return;
    }

    await this.app.init({
      width: 384,
      height: 640,
      backgroundColor: 0x07121d,
      antialias: false,
      autoStart: false
    });
    this.app.stage.addChild(this.entityLayer);
    host.appendChild(this.app.canvas);
    this.app.canvas.classList.add("gameplay-canvas");
    this.attached = true;
  }

  sync(scene: PresentationalScene): void {
    if (!this.attached) {
      return;
    }

    const nextIds = new Set<string>();
    this.syncEntityList(scene.players, "player", nextIds);
    this.syncEntityList(scene.enemies, "enemy", nextIds);
    this.syncEntityList(scene.pickups, "pickup", nextIds);
    if (scene.boss) {
      this.syncEntityList([scene.boss], "boss", nextIds);
    }
    this.syncEntityList(scene.bossParts, "boss-part", nextIds);
    destroyRemovedEntities(this.entityRegistry, nextIds);
    this.app.render();
  }

  resize(width: number, height: number): void {
    if (!this.attached || width <= 0 || height <= 0) {
      return;
    }

    this.app.renderer.resize(width, height);
  }

  destroy(): void {
    for (const graphic of this.entityRegistry.values()) {
      graphic.destroy();
    }
    this.entityRegistry.clear();
    this.app.destroy();
    this.attached = false;
  }

  private syncEntityList(
    entities: PresentationalEntity[],
    kind: EntityKind,
    nextIds: Set<string>
  ): void {
    for (const entity of entities) {
      const key = `${kind}:${entity.id}`;
      nextIds.add(key);
      let graphic = this.entityRegistry.get(key);
      if (!graphic) {
        graphic = new Graphics();
        drawEntityShape(graphic, kind);
        this.entityLayer.addChild(graphic);
        this.entityRegistry.set(key, graphic);
      }

      graphic.x = entity.x;
      graphic.y = entity.y;
    }
  }
}
