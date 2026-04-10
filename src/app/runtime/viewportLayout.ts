export interface ViewportFitInput {
  containerWidth: number;
  containerHeight: number;
  worldWidth: number;
  worldHeight: number;
}

export interface ViewportFit {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function computeViewportFit(input: ViewportFitInput): ViewportFit {
  const {
    containerWidth,
    containerHeight,
    worldWidth,
    worldHeight
  } = input;

  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    worldWidth <= 0 ||
    worldHeight <= 0
  ) {
    return {
      width: 0,
      height: 0,
      scale: 0,
      offsetX: 0,
      offsetY: 0
    };
  }

  const scale = Math.min(containerWidth / worldWidth, containerHeight / worldHeight);
  const width = Math.min(containerWidth, worldWidth * scale);
  const height = Math.min(containerHeight, worldHeight * scale);

  return {
    width,
    height,
    scale,
    offsetX: Math.max(0, (containerWidth - width) / 2),
    offsetY: Math.max(0, (containerHeight - height) / 2)
  };
}
