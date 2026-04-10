import { describe, expect, it } from "vitest";

import { computeViewportFit } from "../src/app/runtime/viewportLayout";

describe("Viewport fit", () => {
  it("PRT-001 fits the vertical playfield inside a 1920x1080 desktop shell without overflow", () => {
    const fit = computeViewportFit({
      containerWidth: 1260,
      containerHeight: 900,
      worldWidth: 320,
      worldHeight: 568
    });

    expect(fit.width).toBeLessThanOrEqual(1260);
    expect(fit.height).toBeLessThanOrEqual(900);
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.offsetX).toBeGreaterThanOrEqual(0);
    expect(fit.offsetY).toBeGreaterThanOrEqual(0);
  });

  it("PRT-001 fits the vertical playfield inside a 1366x768 desktop shell without overflow", () => {
    const fit = computeViewportFit({
      containerWidth: 930,
      containerHeight: 620,
      worldWidth: 320,
      worldHeight: 568
    });

    expect(fit.width).toBeLessThanOrEqual(930);
    expect(fit.height).toBeLessThanOrEqual(620);
    expect(fit.scale).toBeGreaterThan(0);
  });
});
