import type { PlayerSlot } from "../../game/core/types";
import type { HudProjection } from "../hudProjection";
import type { BrowserRuntimeSnapshot } from "./BrowserRuntime";
import type { GameFlowScreen } from "./GameFlowState";

export interface BrowserRuntimeViewBindings {
  onStart(): void;
  onSelectMode(mode: "single" | "co-op"): void;
  onSelectCabinet(profile: "easy" | "hard"): void;
  onAcceptContinue(playerId: PlayerSlot): void;
  onJoinPlayer(playerId: PlayerSlot): void;
  onReturnToTitle(): void;
}

interface PlayerPanelElements {
  root: HTMLElement;
  score: HTMLElement;
  stock: HTMLElement;
  weapons: HTMLElement;
  continue: HTMLElement;
}

function createButton(action: string, label: string): string {
  return `<button class="arcade-button" data-action="${action}" type="button">${label}</button>`;
}

function createControlsEducation(): string {
  return `
    <div class="controls-legend" data-role="controls-legend" aria-label="1P controls">
      <span class="controls-legend__label">1P Controls</span>
      <span class="control-chip"><kbd>Arrow Keys</kbd><span>Move</span></span>
      <span class="control-chip"><kbd>Z</kbd><span>Fire</span></span>
      <span class="control-chip"><kbd>X</kbd><span>Bomb</span></span>
      <span class="control-chip"><kbd>Right Shift</kbd><span>Focus</span></span>
    </div>
  `;
}

export class BrowserRuntimeView {
  private readonly root: HTMLDivElement;

  private readonly viewportHost: HTMLDivElement;

  private readonly stageLabel: HTMLSpanElement;

  private readonly loopLabel: HTMLSpanElement;

  private readonly bossBar: HTMLDivElement;

  private readonly bossCaption: HTMLSpanElement;

  private readonly continueStatus: HTMLParagraphElement;

  private readonly assetLoadingStatus: HTMLParagraphElement;

  private readonly assetErrorStatus: HTMLParagraphElement;

  private readonly playerPanels: Record<PlayerSlot, PlayerPanelElements>;

  private readonly overlays: Record<GameFlowScreen, HTMLElement>;

  constructor(root: HTMLDivElement) {
    this.root = root;
    root.innerHTML = `
      <main class="arcade-shell" data-flow="title">
        <header class="shell-marquee">
            <div>
            <p class="shell-kicker">Raiden II Private Prototype</p>
            <h1 class="shell-title">Stage 1 Vertical Slice</h1>
          </div>
          <p class="shell-status">Desktop shell + Pixi viewport</p>
        </header>
        <section class="shell-main">
          <aside class="hud-stack" data-role="hud-layer">
            <div class="hud-block hud-block--stage">
              <span class="hud-label">Stage</span>
              <strong data-role="hud-stage-label">Stage 1</strong>
              <span data-role="hud-loop-label">Loop 1</span>
            </div>
            <div class="hud-block hud-block--boss">
              <span class="hud-label">Boss</span>
              <div class="boss-meter">
                <div class="boss-meter__fill"></div>
              </div>
              <span class="hud-subtle" data-role="hud-boss-caption">No active boss</span>
            </div>
            <div class="player-panels">
              <section class="player-panel" data-player="player1">
                <h2>1P</h2>
                <p class="player-stat" data-role="player1-score">000000</p>
                <p class="player-meta" data-role="player1-stock">Lives 0 · Bombs 0</p>
                <p class="player-meta" data-role="player1-weapons">Vulcan Lv1</p>
                <p class="player-meta player-meta--accent" data-role="player1-continue">Ready</p>
              </section>
              <section class="player-panel" data-player="player2">
                <h2>2P</h2>
                <p class="player-stat" data-role="player2-score">000000</p>
                <p class="player-meta" data-role="player2-stock">Lives 0 · Bombs 0</p>
                <p class="player-meta" data-role="player2-weapons">Awaiting join</p>
                <p class="player-meta player-meta--accent" data-role="player2-continue">Stand by</p>
              </section>
            </div>
          </aside>
          <section class="viewport-shell">
            <div class="viewport-bezel">
              <div class="viewport-scanline"></div>
              <div class="viewport-stage" data-role="gameplay-viewport"></div>
              <div class="overlay-layer" data-role="overlay-layer">
                <section class="overlay-card" data-screen="title">
                  <p class="overlay-eyebrow">Internal Prototype Build</p>
                  <h2>Scramble Stage 1</h2>
                  <p class="overlay-copy">Desktop-first arcade shell focused on a playable Stage 1 slice, with structured HUD, real viewport fitting, and prototype visuals.</p>
                  ${createControlsEducation()}
                  ${createButton("start", "Start Mission")}
                </section>
                <section class="overlay-card" data-screen="mode-select">
                  <p class="overlay-eyebrow">Mode Select</p>
                  <h2>Crew Configuration</h2>
                  ${createControlsEducation()}
                  <div class="overlay-actions">
                    ${createButton("mode-single", "1P Solo Sortie")}
                    ${createButton("mode-co-op", "2P Co-op Sortie")}
                  </div>
                </section>
                <section class="overlay-card" data-screen="cabinet-select">
                  <p class="overlay-eyebrow">Cabinet Select</p>
                  <h2>Choose Field Tuning</h2>
                  ${createControlsEducation()}
                  <div class="overlay-actions">
                    ${createButton("cabinet-easy", "Easy Cabinet")}
                    ${createButton("cabinet-hard", "Hard Cabinet")}
                  </div>
                </section>
                <section class="overlay-card overlay-card--compact" data-screen="asset-loading">
                  <p class="overlay-eyebrow">Replacement Assets</p>
                  <h2>Loading Stage 1</h2>
                  <p class="overlay-copy" data-role="asset-loading-status">Checking required Stage 1 replacement art and audio before sortie.</p>
                </section>
                <section class="overlay-card overlay-card--compact" data-screen="asset-error">
                  <p class="overlay-eyebrow">Replacement Assets Missing</p>
                  <h2>Stage 1 cannot launch</h2>
                  <p class="overlay-copy" data-role="asset-error-status">Missing required replacement assets.</p>
                  ${createButton("return-title", "Back To Title")}
                </section>
                <section class="overlay-card overlay-card--compact" data-screen="continue">
                  <p class="overlay-eyebrow">Continue</p>
                  <h2>Re-arm the squadron</h2>
                  <p class="overlay-copy" data-role="continue-status">Awaiting pilot confirmation.</p>
                  <div class="overlay-actions">
                    ${createButton("continue-player1", "Continue 1P")}
                    ${createButton("continue-player2", "Continue 2P")}
                  </div>
                </section>
                <section class="overlay-card overlay-card--compact" data-screen="game-over">
                  <p class="overlay-eyebrow">Mission Failed</p>
                  <h2>Return to Hangar</h2>
                  <p class="overlay-copy">The squadron is out of stock. Reconfigure and sortie again.</p>
                  ${createButton("return-title", "Back To Title")}
                </section>
                <section class="overlay-card overlay-card--compact" data-screen="ending">
                  <p class="overlay-eyebrow">Stage Clear</p>
                  <h2>After Action Debrief</h2>
                  <p class="overlay-copy">Hold the field while the shell stages the next banner transition.</p>
                </section>
                <section class="overlay-card overlay-card--compact" data-screen="loop-transition">
                  <p class="overlay-eyebrow">Loop Advance</p>
                  <h2>Threat Level Escalated</h2>
                  <p class="overlay-copy">Re-entering Stage 1 with the next loop’s pressure profile.</p>
                </section>
                <section class="overlay-card overlay-card--ghost" data-screen="gameplay">
                  <div class="overlay-inline">
                    <span>Gameplay is live. Use keyboard or gamepad while the HUD mirrors the active prototype state.</span>
                    ${createButton("join-player2", "Rejoin 2P")}
                  </div>
                  ${createControlsEducation()}
                </section>
              </div>
            </div>
          </section>
        </section>
      </main>
    `;

    this.viewportHost = this.query<HTMLDivElement>("[data-role='gameplay-viewport']");
    this.stageLabel = this.query<HTMLSpanElement>("[data-role='hud-stage-label']");
    this.loopLabel = this.query<HTMLSpanElement>("[data-role='hud-loop-label']");
    this.bossBar = this.query<HTMLDivElement>(".boss-meter__fill");
    this.bossCaption = this.query<HTMLSpanElement>("[data-role='hud-boss-caption']");
    this.continueStatus = this.query<HTMLParagraphElement>("[data-role='continue-status']");
    this.assetLoadingStatus = this.query<HTMLParagraphElement>("[data-role='asset-loading-status']");
    this.assetErrorStatus = this.query<HTMLParagraphElement>("[data-role='asset-error-status']");
    this.playerPanels = {
      player1: this.createPlayerPanel("player1"),
      player2: this.createPlayerPanel("player2")
    };
    this.overlays = {
      title: this.query<HTMLElement>("[data-screen='title']"),
      "mode-select": this.query<HTMLElement>("[data-screen='mode-select']"),
      "cabinet-select": this.query<HTMLElement>("[data-screen='cabinet-select']"),
      "asset-loading": this.query<HTMLElement>("[data-screen='asset-loading']"),
      "asset-error": this.query<HTMLElement>("[data-screen='asset-error']"),
      gameplay: this.query<HTMLElement>("[data-screen='gameplay']"),
      continue: this.query<HTMLElement>("[data-screen='continue']"),
      "game-over": this.query<HTMLElement>("[data-screen='game-over']"),
      ending: this.query<HTMLElement>("[data-screen='ending']"),
      "loop-transition": this.query<HTMLElement>("[data-screen='loop-transition']")
    };
  }

  bind(bindings: BrowserRuntimeViewBindings): void {
    this.bindClick("start", bindings.onStart);
    this.bindClick("mode-single", () => bindings.onSelectMode("single"));
    this.bindClick("mode-co-op", () => bindings.onSelectMode("co-op"));
    this.bindClick("cabinet-easy", () => bindings.onSelectCabinet("easy"));
    this.bindClick("cabinet-hard", () => bindings.onSelectCabinet("hard"));
    this.bindClick("continue-player1", () => bindings.onAcceptContinue("player1"));
    this.bindClick("continue-player2", () => bindings.onAcceptContinue("player2"));
    this.bindClick("join-player2", () => bindings.onJoinPlayer("player2"));
    this.bindClick("return-title", bindings.onReturnToTitle);
  }

  render(snapshot: BrowserRuntimeSnapshot): void {
    this.root.dataset.flow = snapshot.flow.screen;
    this.updateOverlayVisibility(snapshot.flow.screen);
    this.updateHud(snapshot.hud);
    this.updateAssetLoad(snapshot);
  }

  getViewportHost(): HTMLDivElement {
    return this.viewportHost;
  }

  destroy(): void {
    this.root.innerHTML = "";
  }

  private createPlayerPanel(playerId: PlayerSlot): PlayerPanelElements {
    return {
      root: this.query<HTMLElement>(`.player-panel[data-player='${playerId}']`),
      score: this.query<HTMLElement>(`[data-role='${playerId}-score']`),
      stock: this.query<HTMLElement>(`[data-role='${playerId}-stock']`),
      weapons: this.query<HTMLElement>(`[data-role='${playerId}-weapons']`),
      continue: this.query<HTMLElement>(`[data-role='${playerId}-continue']`)
    };
  }

  private updateOverlayVisibility(activeScreen: GameFlowScreen): void {
    for (const [screen, overlay] of Object.entries(this.overlays)) {
      overlay.toggleAttribute("hidden", screen !== activeScreen);
    }
  }

  private updateHud(hud: HudProjection | null): void {
    if (!hud) {
      this.stageLabel.textContent = "Stage 1";
      this.loopLabel.textContent = "Loop 1";
      this.bossBar.style.width = "0%";
      this.bossCaption.textContent = "No active boss";
      this.resetPlayerPanel("player1", "Vulcan Lv1", "Ready");
      this.resetPlayerPanel("player2", "Awaiting join", "Stand by");
      this.continueStatus.textContent = "Awaiting pilot confirmation.";
      return;
    }

    this.stageLabel.textContent = hud.stageLabel;
    this.loopLabel.textContent = hud.loopLabel;
    this.bossBar.style.width = `${Math.round((hud.boss?.healthRatio ?? 0) * 100)}%`;
    this.bossCaption.textContent = hud.boss
      ? `${hud.boss.id} · ${hud.boss.phaseLabel ?? "opening"}`
      : "No active boss";

    const seenPlayers = new Set<PlayerSlot>();
    for (const player of hud.players) {
      seenPlayers.add(player.id);
      const panel = this.playerPanels[player.id];
      panel.root.dataset.lifeState = player.lifeState;
      panel.score.textContent = player.scoreLabel;
      panel.stock.textContent = `Lives ${player.lives} · Bombs ${player.bombs}`;
      panel.weapons.textContent = player.subWeaponLabel
        ? `${player.mainWeaponLabel} / ${player.subWeaponLabel}`
        : player.mainWeaponLabel;
      panel.continue.textContent =
        player.continueSecondsRemaining === null
          ? player.lifeState === "game-over"
            ? "Game Over"
            : player.joined
              ? "Ready"
              : "Stand by"
          : `Continue ${player.continueSecondsRemaining}s`;
    }

    for (const playerId of Object.keys(this.playerPanels) as PlayerSlot[]) {
      if (seenPlayers.has(playerId)) {
        continue;
      }

      this.resetPlayerPanel(
        playerId,
        playerId === "player1" ? "Vulcan Lv1" : "Awaiting join",
        playerId === "player1" ? "Ready" : "Stand by"
      );
    }

    const pending = hud.players
      .filter((player) => player.continueSecondsRemaining !== null)
      .map((player) => `${player.id === "player1" ? "1P" : "2P"} ${player.continueSecondsRemaining}s`);

    this.continueStatus.textContent =
      pending.length > 0
        ? `Awaiting pilot confirmation: ${pending.join(" · ")}`
        : "Awaiting pilot confirmation.";
  }

  private resetPlayerPanel(
    playerId: PlayerSlot,
    weaponLabel: string,
    continueLabel: string
  ): void {
    const panel = this.playerPanels[playerId];
    panel.root.dataset.lifeState = "idle";
    panel.score.textContent = "000000";
    panel.stock.textContent = "Lives 0 · Bombs 0";
    panel.weapons.textContent = weaponLabel;
    panel.continue.textContent = continueLabel;
  }

  private bindClick(action: string, callback: () => void): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(`[data-action='${action}']`)) {
      button.addEventListener("click", callback);
    }
  }

  private updateAssetLoad(snapshot: BrowserRuntimeSnapshot): void {
    if (snapshot.assetLoad.state === "loading") {
      this.assetLoadingStatus.textContent = `Checking required Stage 1 replacement textures and audio for ${snapshot.assetLoad.stageId ?? "stage-1"}.`;
      return;
    }

    if (snapshot.assetLoad.state === "error") {
      const missingList = snapshot.assetLoad.missingAssets
        .map((asset) => `${asset.id} -> ${asset.path}`)
        .join(" | ");
      this.assetErrorStatus.textContent =
        missingList.length > 0
          ? `Missing required replacement assets: ${missingList}`
          : "Missing required replacement assets.";
      return;
    }

    this.assetLoadingStatus.textContent =
      "Checking required Stage 1 replacement art and audio before sortie.";
    this.assetErrorStatus.textContent = "Missing required replacement assets.";
  }

  private query<TElement extends Element>(selector: string): TElement {
    const element = this.root.querySelector<TElement>(selector);
    if (!element) {
      throw new Error(`Missing required view element: ${selector}`);
    }
    return element;
  }
}
