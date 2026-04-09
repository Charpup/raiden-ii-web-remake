import type { AudioFrame, SimulationState } from "../core/types";

export class AudioDirector {
  private currentBgm: string | null = null;

  private lastSyncedFrame = -1;

  sync(state: SimulationState): AudioFrame {
    if (state.frame === this.lastSyncedFrame) {
      return {
        bgmCue: this.currentBgm,
        sfxCues: []
      };
    }

    this.lastSyncedFrame = state.frame;
    const sfxCues: string[] = [];

    for (const event of state.recentEvents) {
      if (event.type === "stage-started") {
        this.currentBgm = `bgm-${event.stageId}`;
      }

      if (event.type === "player-fired") {
        sfxCues.push(`sfx-${event.playerId}-fire`);
      }

      if (event.type === "bomb-triggered") {
        sfxCues.push(`sfx-${event.playerId}-bomb`);
      }

      if (event.type === "boss-phase-changed") {
        sfxCues.push(`sfx-${event.bossId}-${event.phaseId}`);
      }
    }

    return {
      bgmCue: this.currentBgm,
      sfxCues
    };
  }
}
