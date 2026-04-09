// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRaidenApp } from "../src/app/createRaidenApp";
import type { AudioFrame, PresentationalScene } from "../src/game/core/types";

class FakeSceneAdapter {
  public attached = false;

  public syncedScenes: PresentationalScene[] = [];

  async attach(_host?: HTMLElement): Promise<void> {
    this.attached = true;
  }

  sync(scene: PresentationalScene): void {
    this.syncedScenes.push(scene);
  }

  resize(): void {}

  destroy(): void {
    this.attached = false;
  }
}

class FakeAudioPlaybackAdapter {
  public unlocked = false;

  public syncedFrames: AudioFrame[] = [];

  unlock(): void {
    this.unlocked = true;
  }

  sync(frame: AudioFrame): void {
    this.syncedFrames.push(frame);
  }

  setSuspended(): void {}

  destroy(): void {}
}

describe("Browser shell DOM runtime", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.restoreAllMocks();
  });

  it("RNT-001 mounts gameplay, HUD, and overlay containers", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter()
    });

    expect(root.querySelector("[data-role='gameplay-viewport']")).not.toBeNull();
    expect(root.querySelector("[data-role='hud-layer']")).not.toBeNull();
    expect(root.querySelector("[data-role='overlay-layer']")).not.toBeNull();

    app.destroy();
  });

  it("RNT-001 advances clock, simulation, renderer, and audio after entering gameplay", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const fakeAudio = new FakeAudioPlaybackAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => fakeAudio
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-co-op']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-hard']") as HTMLButtonElement).click();

    expect(root.getAttribute("data-flow")).toBe("gameplay");

    app.runtime.tickHostDelta(50);

    expect(fakeScene.attached).toBe(true);
    expect(fakeScene.syncedScenes.length).toBeGreaterThan(0);
    expect(fakeAudio.unlocked).toBe(true);
    expect(fakeAudio.syncedFrames.length).toBeGreaterThan(0);
    expect(root.querySelector("[data-role='hud-stage-label']")?.textContent).toContain("Stage");

    app.destroy();
  });

  it("RNT-001 clears audio and HUD state when returning to title", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const fakeAudio = new FakeAudioPlaybackAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => fakeAudio
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-co-op']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-hard']") as HTMLButtonElement).click();
    app.runtime.tickHostDelta(50);

    expect(root.querySelector("[data-role='player2-stock']")?.textContent).toContain("Lives");

    app.runtime.returnToTitle();

    expect(root.getAttribute("data-flow")).toBe("title");
    expect(root.querySelector("[data-role='hud-stage-label']")?.textContent).toBe("Stage 1");
    expect(root.querySelector("[data-role='hud-boss-caption']")?.textContent).toBe("No active boss");
    expect(root.querySelector("[data-role='player1-stock']")?.textContent).toBe("Lives 0 · Bombs 0");
    expect(root.querySelector("[data-role='player2-weapons']")?.textContent).toBe("Awaiting join");
    expect(fakeAudio.syncedFrames.at(-1)).toEqual({
      bgmCue: null,
      sfxCues: []
    });

    app.destroy();
  });

  it("RNT-001 clears latched gameplay input across hide, title return, and new session start", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter()
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    app.runtime.setVisibilityHidden(true);
    app.runtime.returnToTitle();

    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();

    const startScene = fakeScene.syncedScenes.at(-1);
    const startX = startScene?.players[0]?.x;

    app.runtime.tickHostDelta(50);

    const latestScene = fakeScene.syncedScenes.at(-1);
    expect(latestScene?.players[0]?.x).toBe(startX);

    app.destroy();
  });
});
