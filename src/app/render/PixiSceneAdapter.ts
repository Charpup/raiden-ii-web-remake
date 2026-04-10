import {
  Application,
  Container,
  Sprite,
  Texture,
  TilingSprite
} from "pixi.js";
import type {
  PresentationalBackgroundLayer,
  PresentationalEntity,
  PresentationalScene
} from "../../game/core/types";
import {
  createAssetManifest,
  type AssetManifest
} from "../assets/assetManifest";
import { computeViewportFit } from "../runtime/viewportLayout";

export interface SceneAdapter {
  attach(host: HTMLElement): Promise<void>;
  sync(scene: PresentationalScene): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

const WORLD_WIDTH = 320;
const WORLD_HEIGHT = 568;

function destroyRemovedEntries<TDisplayObject extends { destroy(): void }>(
  registry: Map<string, TDisplayObject>,
  nextIds: Set<string>
): void {
  for (const [id, displayObject] of registry.entries()) {
    if (nextIds.has(id)) {
      continue;
    }

    displayObject.destroy();
    registry.delete(id);
  }
}

export class PixiSceneAdapter implements SceneAdapter {
  private readonly app = new Application();

  private readonly assetManifest: AssetManifest;

  private readonly worldRoot = new Container();

  private readonly backgroundLayer = new Container();

  private readonly entityLayer = new Container();

  private readonly backgroundRegistry = new Map<string, TilingSprite>();

  private readonly entityRegistry = new Map<string, Sprite>();

  private readonly textureCache = new Map<string, Texture>();

  private attached = false;

  constructor(assetManifest: AssetManifest = createAssetManifest()) {
    this.assetManifest = assetManifest;
  }

  async attach(host: HTMLElement): Promise<void> {
    if (this.attached) {
      return;
    }

    await this.app.init({
      width: Math.max(1, host.clientWidth || WORLD_WIDTH),
      height: Math.max(1, host.clientHeight || WORLD_HEIGHT),
      backgroundColor: 0x050b14,
      preference: "webgl",
      skipExtensionImports: true,
      antialias: false,
      autoStart: false
    });

    this.worldRoot.addChild(this.backgroundLayer);
    this.worldRoot.addChild(this.entityLayer);
    this.app.stage.addChild(this.worldRoot);
    host.appendChild(this.app.canvas);
    this.app.canvas.classList.add("gameplay-canvas");
    this.attached = true;
    this.resize(host.clientWidth, host.clientHeight);
  }

  sync(scene: PresentationalScene): void {
    if (!this.attached) {
      return;
    }

    const nextIds = new Set<string>();
    this.syncBackgrounds(scene.backgroundLayers, nextIds);
    this.syncEntityList(scene.players, "player", nextIds);
    this.syncEntityList(scene.enemies, "enemy", nextIds);
    this.syncEntityList(scene.playerBullets, "player-bullet", nextIds);
    this.syncEntityList(scene.enemyBullets, "enemy-bullet", nextIds);
    this.syncEntityList(scene.pickups, "pickup", nextIds);
    this.syncEntityList(scene.effects, "effect", nextIds);
    if (scene.boss) {
      this.syncEntityList([scene.boss], "boss", nextIds);
    }
    this.syncEntityList(scene.bossParts, "boss-part", nextIds);

    destroyRemovedEntries(this.backgroundRegistry, nextIds);
    destroyRemovedEntries(this.entityRegistry, nextIds);
    this.app.render();
  }

  resize(width: number, height: number): void {
    if (!this.attached || width <= 0 || height <= 0) {
      return;
    }

    this.app.renderer.resize(width, height);
    const fit = computeViewportFit({
      containerWidth: width,
      containerHeight: height,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT
    });
    this.worldRoot.scale.set(fit.scale);
    this.worldRoot.position.set(fit.offsetX, fit.offsetY);
  }

  destroy(): void {
    destroyRemovedEntries(this.backgroundRegistry, new Set<string>());
    destroyRemovedEntries(this.entityRegistry, new Set<string>());
    this.textureCache.clear();
    this.app.destroy();
    this.attached = false;
  }

  private syncBackgrounds(
    layers: PresentationalBackgroundLayer[],
    nextIds: Set<string>
  ): void {
    for (const layer of layers) {
      const key = `background:${layer.id}`;
      nextIds.add(key);
      let sprite = this.backgroundRegistry.get(key);
      if (!sprite) {
        const texture = this.getTexture(layer.spriteId);
        sprite = new TilingSprite({
          texture,
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT
        });
        sprite.position.set(0, 0);
        this.backgroundLayer.addChild(sprite);
        this.backgroundRegistry.set(key, sprite);
      }

      sprite.tilePosition.y = layer.offsetY;
      sprite.alpha = layer.opacity ?? 1;
    }
  }

  private syncEntityList(
    entities: PresentationalEntity[],
    kind: string,
    nextIds: Set<string>
  ): void {
    for (const entity of entities) {
      const key = `${kind}:${entity.id}`;
      nextIds.add(key);
      let sprite = this.entityRegistry.get(key);
      if (!sprite) {
        const texture = this.getTexture(entity.spriteId);
        sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        const asset = this.assetManifest.getTextureAsset(entity.spriteId);
        sprite.width = asset.width;
        sprite.height = asset.height;
        this.entityLayer.addChild(sprite);
        this.entityRegistry.set(key, sprite);
      }

      sprite.texture = this.getTexture(entity.spriteId);
      sprite.x = entity.x;
      sprite.y = entity.y;
      sprite.rotation = entity.rotation ?? 0;
      sprite.alpha = entity.alpha ?? 1;
      const scale = entity.scale ?? 1;
      sprite.scale.set(scale);
    }
  }

  private getTexture(assetId: string): Texture {
    let texture = this.textureCache.get(assetId);
    if (!texture) {
      texture = Texture.from(this.assetManifest.resolveUrl(assetId));
      this.textureCache.set(assetId, texture);
    }
    return texture;
  }
}
