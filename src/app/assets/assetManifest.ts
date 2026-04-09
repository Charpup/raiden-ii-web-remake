export interface AssetBundle {
  id: "shell" | "shared";
  assetIds: string[];
}

export interface StageAssetBundle {
  stageId: string;
  assetIds: string[];
  audioCueIds: string[];
}

export interface AssetManifest {
  basePath: string;
  shellBundle: AssetBundle;
  sharedBundle: AssetBundle;
  getStageBundle(stageId: string): StageAssetBundle;
  resolveUrl(assetId: string): string;
  resolvePath(relativePath: string): string;
}

const assetRegistry: Record<string, string> = {
  "shell.marquee": "assets/ui/marquee.svg",
  "shell.scanline": "assets/ui/scanline.svg",
  "shell.panel-grid": "assets/ui/panel-grid.svg",
  "shared.player-ship": "assets/gameplay/player-ship.svg",
  "shared.enemy-drone": "assets/gameplay/enemy-drone.svg",
  "shared.pickup-medal": "assets/gameplay/pickup-medal.svg",
  "shared.boss-shell": "assets/gameplay/boss-shell.svg",
  "stage-1.backdrop": "assets/stages/stage-1/backdrop.svg",
  "stage-2.backdrop": "assets/stages/stage-2/backdrop.svg",
  "stage-3.backdrop": "assets/stages/stage-3/backdrop.svg",
  "stage-4.backdrop": "assets/stages/stage-4/backdrop.svg",
  "stage-5.backdrop": "assets/stages/stage-5/backdrop.svg",
  "stage-6.backdrop": "assets/stages/stage-6/backdrop.svg",
  "stage-7.backdrop": "assets/stages/stage-7/backdrop.svg",
  "stage-8.backdrop": "assets/stages/stage-8/backdrop.svg"
};

const stageBundles: Record<string, StageAssetBundle> = {
  "stage-1": {
    stageId: "stage-1",
    assetIds: ["stage-1.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-1", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-2": {
    stageId: "stage-2",
    assetIds: ["stage-2.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-2", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-3": {
    stageId: "stage-3",
    assetIds: ["stage-3.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-3", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-4": {
    stageId: "stage-4",
    assetIds: ["stage-4.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-4", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-5": {
    stageId: "stage-5",
    assetIds: ["stage-5.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-5", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-6": {
    stageId: "stage-6",
    assetIds: ["stage-6.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-6", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-7": {
    stageId: "stage-7",
    assetIds: ["stage-7.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-7", "sfx-player1-fire", "sfx-player1-bomb"]
  },
  "stage-8": {
    stageId: "stage-8",
    assetIds: ["stage-8.backdrop", "shared.player-ship", "shared.enemy-drone"],
    audioCueIds: ["bgm-stage-8", "sfx-player1-fire", "sfx-player1-bomb"]
  }
};

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/^\/+/, "");
}

export function createAssetManifest(basePath = "/games/raiden-ii/"): AssetManifest {
  const normalizedBasePath = normalizeBasePath(basePath);

  return {
    basePath: normalizedBasePath,
    shellBundle: {
      id: "shell",
      assetIds: ["shell.marquee", "shell.scanline", "shell.panel-grid"]
    },
    sharedBundle: {
      id: "shared",
      assetIds: [
        "shared.player-ship",
        "shared.enemy-drone",
        "shared.pickup-medal",
        "shared.boss-shell"
      ]
    },
    getStageBundle(stageId: string): StageAssetBundle {
      return (
        stageBundles[stageId] ?? {
          stageId,
          assetIds: ["shared.player-ship", "shared.enemy-drone"],
          audioCueIds: [`bgm-${stageId}`]
        }
      );
    },
    resolveUrl(assetId: string): string {
      const relativePath = assetRegistry[assetId];
      if (!relativePath) {
        throw new Error(`Unknown asset id: ${assetId}`);
      }

      return `${normalizedBasePath}${normalizeRelativePath(relativePath)}`;
    },
    resolvePath(relativePath: string): string {
      return `${normalizedBasePath}${normalizeRelativePath(relativePath)}`;
    }
  };
}
