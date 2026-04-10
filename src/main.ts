import "./style.css";
import { createRaidenApp } from "./app/createRaidenApp";
import type {
  BrowserRuntimeAttachPhase,
  BrowserRuntimeSnapshot
} from "./app/runtime/BrowserRuntime";

declare global {
  interface Window {
    __RAIDEN_DEBUG__?: {
      bootstrapPhase: "booting" | "view-ready" | "attaching-runtime" | "runtime-attached" | "ready" | "error";
      runtimeAttachPhase: BrowserRuntimeAttachPhase;
      lastError: string | null;
      getSnapshot(): BrowserRuntimeSnapshot | null;
      tick(deltaMs: number): BrowserRuntimeSnapshot | null;
      stopAnimationLoop(): void;
      startAnimationLoop(): void;
    };
  }
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

window.__RAIDEN_DEBUG__ = {
  bootstrapPhase: "booting",
  runtimeAttachPhase: "idle",
  lastError: null,
  getSnapshot: () => null,
  tick: () => null,
  stopAnimationLoop: () => {},
  startAnimationLoop: () => {}
};

try {
  const createdApp = await createRaidenApp(app, {
    autoStartLoop: true,
    onBootstrapPhase: (phase) => {
      if (!window.__RAIDEN_DEBUG__) {
        return;
      }

      window.__RAIDEN_DEBUG__.bootstrapPhase = phase;
    },
    onAttachPhase: (phase) => {
      if (!window.__RAIDEN_DEBUG__) {
        return;
      }

      window.__RAIDEN_DEBUG__.runtimeAttachPhase = phase;
    }
  });

  window.__RAIDEN_DEBUG__ = {
    bootstrapPhase: "ready",
    runtimeAttachPhase: "scene-adapter-attached",
    lastError: null,
    getSnapshot: () => createdApp.runtime.getSnapshot(),
    tick: (deltaMs) => {
      createdApp.runtime.tickHostDelta(deltaMs);
      return createdApp.runtime.getSnapshot();
    },
    stopAnimationLoop: () => {
      createdApp.runtime.stopAnimationLoop();
    },
    startAnimationLoop: () => {
      createdApp.runtime.startAnimationLoop();
    }
  };
} catch (error) {
  window.__RAIDEN_DEBUG__ = {
    bootstrapPhase: "error",
    runtimeAttachPhase: window.__RAIDEN_DEBUG__?.runtimeAttachPhase ?? "idle",
    lastError: error instanceof Error ? error.message : String(error),
    getSnapshot: () => null,
    tick: () => null,
    stopAnimationLoop: () => {},
    startAnimationLoop: () => {}
  };
  throw error;
}
