import type {
  PresentationalBackgroundLayer,
  PresentationalEntity,
  PresentationalScene
} from "../../game/core/types";
import {
  createAssetManifest,
  type AssetManifest,
  type TextureAssetDefinition
} from "../assets/assetManifest";
import type { ReplacementAssetStore } from "../assets/ReplacementAssetStore";
import { computeViewportFit } from "../runtime/viewportLayout";
import type { SceneAdapter } from "./PixiSceneAdapter";

const WORLD_WIDTH = 320;
const WORLD_HEIGHT = 568;

interface CachedImageAsset {
  image: HTMLImageElement;
  loaded: boolean;
}

function createPlaceholderColor(assetId: string): string {
  if (assetId.includes("player")) {
    return "#6dd3ff";
  }

  if (assetId.includes("enemy")) {
    return "#ff915c";
  }

  if (assetId.includes("pickup")) {
    return "#ffd75c";
  }

  if (assetId.includes("effect")) {
    return "#ffffff";
  }

  if (assetId.includes("boss")) {
    return "#ff5f7d";
  }

  return "#7aa2ff";
}

export class Canvas2DSceneAdapter implements SceneAdapter {
  private readonly assetManifest: AssetManifest;

  private readonly assetPackStore?: Pick<ReplacementAssetStore, "getImage">;

  private readonly imageCache = new Map<string, CachedImageAsset>();

  private readonly canvas = document.createElement("canvas");

  private context: CanvasRenderingContext2D | null = null;

  private latestScene: PresentationalScene | null = null;

  private attached = false;

  private viewportWidth = WORLD_WIDTH;

  private viewportHeight = WORLD_HEIGHT;

  constructor(
    assetManifest: AssetManifest = createAssetManifest(),
    assetPackStore?: Pick<ReplacementAssetStore, "getImage">
  ) {
    this.assetManifest = assetManifest;
    this.assetPackStore = assetPackStore;
  }

  async attach(host: HTMLElement): Promise<void> {
    if (this.attached) {
      return;
    }

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Canvas2DSceneAdapter could not acquire a 2D context.");
    }

    this.canvas.classList.add("gameplay-canvas");
    host.appendChild(this.canvas);
    this.attached = true;
    this.resize(host.clientWidth, host.clientHeight);
  }

  sync(scene: PresentationalScene): void {
    if (!this.attached || !this.context) {
      return;
    }

    this.latestScene = scene;
    this.render();
  }

  resize(width: number, height: number): void {
    if (!this.attached) {
      return;
    }

    this.viewportWidth = Math.max(1, width || WORLD_WIDTH);
    this.viewportHeight = Math.max(1, height || WORLD_HEIGHT);
    this.canvas.width = this.viewportWidth;
    this.canvas.height = this.viewportHeight;
    this.canvas.style.width = `${this.viewportWidth}px`;
    this.canvas.style.height = `${this.viewportHeight}px`;
    this.render();
  }

  destroy(): void {
    this.imageCache.clear();
    this.latestScene = null;
    this.context = null;
    this.canvas.remove();
    this.attached = false;
  }

  private render(): void {
    const context = this.context;
    if (!context) {
      return;
    }

    const fit = computeViewportFit({
      containerWidth: this.viewportWidth,
      containerHeight: this.viewportHeight,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT
    });

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
    context.fillStyle = "#07111f";
    context.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    if (!this.latestScene || fit.scale <= 0) {
      return;
    }

    context.save();
    context.translate(fit.offsetX, fit.offsetY);
    context.scale(fit.scale, fit.scale);
    context.beginPath();
    context.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.clip();

    this.drawBackgrounds(context, this.latestScene.backgroundLayers);
    this.drawEntities(context, this.latestScene.players);
    this.drawEntities(context, this.latestScene.enemies);
    this.drawEntities(context, this.latestScene.playerBullets);
    this.drawEntities(context, this.latestScene.enemyBullets);
    this.drawEntities(context, this.latestScene.pickups);
    this.drawEntities(context, this.latestScene.effects);
    if (this.latestScene.boss) {
      this.drawEntities(context, [this.latestScene.boss]);
    }
    this.drawEntities(context, this.latestScene.bossParts);

    context.restore();
  }

  private drawBackgrounds(
    context: CanvasRenderingContext2D,
    layers: PresentationalBackgroundLayer[]
  ): void {
    for (const layer of layers) {
      const asset = this.assetManifest.getTextureAsset(layer.spriteId);
      const cached = this.getOrStartImageLoad(layer.spriteId);
      context.save();
      context.globalAlpha = layer.opacity ?? 1;

      if (cached.loaded) {
        const imageHeight = asset.height || WORLD_HEIGHT;
        const normalizedOffset = ((layer.offsetY % imageHeight) + imageHeight) % imageHeight;
        let drawY = -normalizedOffset;
        while (drawY < WORLD_HEIGHT) {
          context.drawImage(cached.image, 0, drawY, WORLD_WIDTH, imageHeight);
          drawY += imageHeight;
        }
      } else {
        context.fillStyle = layer.id.includes("terrain") ? "#17324b" : "#0b1830";
        context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      context.restore();
    }
  }

  private drawEntities(
    context: CanvasRenderingContext2D,
    entities: PresentationalEntity[]
  ): void {
    for (const entity of entities) {
      const asset = this.assetManifest.getTextureAsset(entity.spriteId);
      const cached = this.getOrStartImageLoad(entity.spriteId);
      const scale = entity.scale ?? 1;
      const width = asset.width * scale;
      const height = asset.height * scale;
      context.save();
      context.translate(entity.x, entity.y);
      context.rotate(entity.rotation ?? 0);
      context.globalAlpha = entity.alpha ?? 1;

      if (cached.loaded) {
        context.drawImage(cached.image, -width / 2, -height / 2, width, height);
      } else {
        this.drawPlaceholderEntity(context, asset, width, height);
      }

      context.restore();
    }
  }

  private drawPlaceholderEntity(
    context: CanvasRenderingContext2D,
    asset: TextureAssetDefinition,
    width: number,
    height: number
  ): void {
    const color = createPlaceholderColor(asset.id);
    context.fillStyle = color;
    context.strokeStyle = "rgba(255,255,255,0.35)";
    context.lineWidth = 1.5;

    if (asset.id.includes("bullet")) {
      context.beginPath();
      context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      context.fill();
      return;
    }

    context.beginPath();
    context.roundRect(-width / 2, -height / 2, width, height, Math.min(width, height) * 0.24);
    context.fill();
    context.stroke();
  }

  private getOrStartImageLoad(assetId: string): CachedImageAsset {
    const existing = this.imageCache.get(assetId);
    if (existing) {
      return existing;
    }

    const preloadedImage = this.assetPackStore?.getImage(assetId);
    if (preloadedImage) {
      const cached: CachedImageAsset = {
        image: preloadedImage,
        loaded: true
      };
      this.imageCache.set(assetId, cached);
      return cached;
    }

    const candidates = this.assetManifest.resolveTextureCandidates(assetId);
    const image = new Image();
    const cached: CachedImageAsset = {
      image,
      loaded: false
    };

    let candidateIndex = 0;
    const tryNext = (): void => {
      const nextUrl = candidates[candidateIndex];
      candidateIndex += 1;
      if (!nextUrl) {
        return;
      }

      image.src = nextUrl;
    };

    image.addEventListener("load", () => {
      cached.loaded = true;
      this.render();
    });
    image.addEventListener("error", () => {
      cached.loaded = false;
      tryNext();
    });

    tryNext();
    this.imageCache.set(assetId, cached);
    return cached;
  }
}
