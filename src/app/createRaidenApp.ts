import { BrowserRuntime, type BrowserRuntimeOptions } from "./runtime/BrowserRuntime";
import { BrowserRuntimeView } from "./runtime/BrowserRuntimeView";

export type CreateRaidenAppBootstrapPhase =
  | "view-ready"
  | "attaching-runtime"
  | "runtime-attached"
  | "ready";

export interface CreateRaidenAppOptions extends BrowserRuntimeOptions {
  autoStartLoop?: boolean;
  onBootstrapPhase?: (phase: CreateRaidenAppBootstrapPhase) => void;
}

export interface CreatedRaidenApp {
  runtime: BrowserRuntime;
  destroy(): void;
}

export async function createRaidenApp(
  root: HTMLDivElement,
  options: CreateRaidenAppOptions = {}
): Promise<CreatedRaidenApp> {
  const view = new BrowserRuntimeView(root);
  options.onBootstrapPhase?.("view-ready");
  const runtime = new BrowserRuntime({
    ...options,
    onSnapshot: (snapshot) => {
      options.onSnapshot?.(snapshot);
      view.render(snapshot);
    }
  });
  options.onBootstrapPhase?.("attaching-runtime");
  await runtime.attach(view.getViewportHost());
  options.onBootstrapPhase?.("runtime-attached");
  const ResizeObserverConstructor = globalThis.ResizeObserver;
  const resizeObserver =
    ResizeObserverConstructor
      ? new ResizeObserverConstructor((entries) => {
          const entry = entries[0];
          if (!entry) {
            return;
          }

          runtime.resizeViewport(entry.contentRect.width, entry.contentRect.height);
        })
      : null;
  resizeObserver?.observe(view.getViewportHost());
  runtime.resizeViewport(
    view.getViewportHost().clientWidth,
    view.getViewportHost().clientHeight
  );

  const handlePointerUnlock = () => {
    runtime.unlockAudio();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    runtime.unlockAudio();
    runtime.handleKeyDown(event.code);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    runtime.handleKeyUp(event.code);
  };

  const handleVisibilityChange = () => {
    runtime.setVisibilityHidden(document.hidden);
  };

  view.bind({
    onStart: () => runtime.beginModeSelect(),
    onSelectMode: (mode) => runtime.selectMode(mode),
    onSelectCabinet: (profile) => {
      runtime.selectCabinetProfile(profile);
      void runtime.startGameplay();
    },
    onAcceptContinue: (playerId) => runtime.acceptContinue(playerId),
    onJoinPlayer: (playerId) => runtime.joinPlayer(playerId),
    onReturnToTitle: () => runtime.returnToTitle()
  });

  root.addEventListener("pointerdown", handlePointerUnlock);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  view.render(runtime.getSnapshot());

  if (options.autoStartLoop) {
    runtime.startAnimationLoop();
  }

  options.onBootstrapPhase?.("ready");

  return {
    runtime,
    destroy(): void {
      resizeObserver?.disconnect();
      runtime.destroy();
      root.removeEventListener("pointerdown", handlePointerUnlock);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      view.destroy();
    }
  };
}
