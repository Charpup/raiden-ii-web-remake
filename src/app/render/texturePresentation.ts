import type { TextureAssetDefinition } from "../assets/assetManifest";

export interface TextureAnchor {
  x: number;
  y: number;
}

export interface AnchoredDrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function resolveTextureAnchor(asset: TextureAssetDefinition): TextureAnchor {
  return asset.anchor ?? { x: 0.5, y: 0.5 };
}

export function computeAnchoredDrawRect(
  asset: TextureAssetDefinition,
  scale: number
): AnchoredDrawRect {
  const anchor = resolveTextureAnchor(asset);
  const width = asset.width * scale;
  const height = asset.height * scale;

  return {
    x: Number((-width * anchor.x).toFixed(2)),
    y: Number((-height * anchor.y).toFixed(2)),
    width,
    height
  };
}
