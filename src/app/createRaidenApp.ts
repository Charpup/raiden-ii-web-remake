import { BrowserRuntime, type BrowserRuntimeOptions } from "./runtime/BrowserRuntime";
import { BrowserRuntimeView } from "./runtime/BrowserRuntimeView";

export interface CreateRaidenAppOptions extends BrowserRuntimeOptions {
  autoStartLoop?: boolean;
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
  const runtime = new BrowserRuntime({
    ...options,
    onSnapshot: (snapshot) => {
      options.onSnapshot?.(snapshot);
      view.render(snapshot);
    }
  });
  await runtime.attach(view.getViewportHost());

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
      runtime.startGameplay();
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

  return {
    runtime,
    destroy(): void {
      runtime.destroy();
      root.removeEventListener("pointerdown", handlePointerUnlock);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      view.destroy();
    }
  };
}
