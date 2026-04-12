import replacementAssetCatalog from "./replacementAssetCatalog.json";

export interface AssetBundle {
  id: "shell" | "shared";
  assetIds: string[];
}

export interface TextureAssetDefinition {
  id: string;
  fallbackRelativePath: string;
  replacementRelativePath?: string;
  width: number;
  height: number;
  kind: "ui" | "entity" | "background";
}

export interface AudioCueDefinition {
  id: string;
  replacementRelativePath?: string;
}

export interface RequiredReplacementAssetDefinition {
  id: string;
  path: string;
  sourceUrl: string;
  sourceTitle: string;
  author: string;
  license: string;
  modified: boolean;
}

export interface StageAssetBundle {
  stageId: string;
  assetIds: string[];
  audioCueIds: string[];
  preloadGroups: string[];
  requiredReplacementTextureIds: string[];
  requiredReplacementAudioCueIds: string[];
}

export interface AssetManifest {
  basePath: string;
  shellBundle: AssetBundle;
  sharedBundle: AssetBundle;
  getStageBundle(stageId: string): StageAssetBundle;
  getTextureAsset(assetId: string): TextureAssetDefinition;
  getAudioCue(cueId: string): AudioCueDefinition;
  listTextureAssets(): TextureAssetDefinition[];
  listAudioCues(): AudioCueDefinition[];
  getRequiredReplacementTextureAssets(stageId: string): Array<
    TextureAssetDefinition & { replacementRelativePath: string }
  >;
  getRequiredReplacementAudioCues(stageId: string): Array<
    AudioCueDefinition & { replacementRelativePath: string }
  >;
  getReplacementAssetCatalog(stageId: string): {
    requiredReplacementTextures: RequiredReplacementAssetDefinition[];
    requiredReplacementAudioCues: RequiredReplacementAssetDefinition[];
  };
  resolveTextureCandidates(assetId: string): string[];
  resolveAudioCandidates(cueId: string): string[];
  resolveUrl(assetId: string): string;
  resolvePath(relativePath: string): string;
}

type ReplacementAssetCatalogRecord = Record<
  string,
  {
    requiredReplacementTextures: RequiredReplacementAssetDefinition[];
    requiredReplacementAudioCues: RequiredReplacementAssetDefinition[];
  }
>;

const textureRegistry: Record<string, TextureAssetDefinition> = {
  "shell.marquee": {
    id: "shell.marquee",
    fallbackRelativePath: "assets/ui/marquee.svg",
    width: 1920,
    height: 240,
    kind: "ui"
  },
  "shell.scanline": {
    id: "shell.scanline",
    fallbackRelativePath: "assets/ui/scanline.svg",
    width: 256,
    height: 256,
    kind: "ui"
  },
  "shell.panel-grid": {
    id: "shell.panel-grid",
    fallbackRelativePath: "assets/ui/panel-grid.svg",
    width: 256,
    height: 256,
    kind: "ui"
  },
  "shared.player-ship": {
    id: "shared.player-ship",
    fallbackRelativePath: "assets/gameplay/player-ship.svg",
    replacementRelativePath: "assets/replacement/gameplay/player-ship.png",
    width: 28,
    height: 34,
    kind: "entity"
  },
  "shared.enemy-scout": {
    id: "shared.enemy-scout",
    fallbackRelativePath: "assets/gameplay/enemy-scout.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-scout.png",
    width: 24,
    height: 24,
    kind: "entity"
  },
  "shared.enemy-warplane": {
    id: "shared.enemy-warplane",
    fallbackRelativePath: "assets/gameplay/enemy-warplane.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-warplane.png",
    width: 38,
    height: 28,
    kind: "entity"
  },
  "shared.enemy-ground": {
    id: "shared.enemy-ground",
    fallbackRelativePath: "assets/gameplay/enemy-ground.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-ground.png",
    width: 26,
    height: 22,
    kind: "entity"
  },
  "shared.enemy-turret": {
    id: "shared.enemy-turret",
    fallbackRelativePath: "assets/gameplay/enemy-turret.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-turret.png",
    width: 26,
    height: 26,
    kind: "entity"
  },
  "shared.enemy-carrier": {
    id: "shared.enemy-carrier",
    fallbackRelativePath: "assets/gameplay/enemy-carrier.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-carrier.png",
    width: 34,
    height: 28,
    kind: "entity"
  },
  "shared.enemy-gunboat": {
    id: "shared.enemy-gunboat",
    fallbackRelativePath: "assets/gameplay/enemy-gunboat.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-gunboat.png",
    width: 42,
    height: 24,
    kind: "entity"
  },
  "shared.enemy-scenery": {
    id: "shared.enemy-scenery",
    fallbackRelativePath: "assets/gameplay/enemy-scenery.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-scenery.png",
    width: 28,
    height: 32,
    kind: "entity"
  },
  "shared.pickup-medal": {
    id: "shared.pickup-medal",
    fallbackRelativePath: "assets/gameplay/pickup-medal.svg",
    replacementRelativePath: "assets/replacement/gameplay/pickup-medal.png",
    width: 16,
    height: 16,
    kind: "entity"
  },
  "shared.pickup-fairy": {
    id: "shared.pickup-fairy",
    fallbackRelativePath: "assets/gameplay/pickup-fairy.svg",
    replacementRelativePath: "assets/replacement/gameplay/pickup-fairy.png",
    width: 18,
    height: 20,
    kind: "entity"
  },
  "shared.pickup-weapon": {
    id: "shared.pickup-weapon",
    fallbackRelativePath: "assets/gameplay/pickup-weapon.svg",
    replacementRelativePath: "assets/replacement/gameplay/pickup-weapon.png",
    width: 18,
    height: 18,
    kind: "entity"
  },
  "shared.pickup-bomb": {
    id: "shared.pickup-bomb",
    fallbackRelativePath: "assets/gameplay/pickup-bomb.svg",
    replacementRelativePath: "assets/replacement/gameplay/pickup-bomb.png",
    width: 18,
    height: 18,
    kind: "entity"
  },
  "shared.pickup-extend": {
    id: "shared.pickup-extend",
    fallbackRelativePath: "assets/gameplay/pickup-extend.svg",
    replacementRelativePath: "assets/replacement/gameplay/pickup-extend.png",
    width: 18,
    height: 18,
    kind: "entity"
  },
  "shared.pickup-miclus": {
    id: "shared.pickup-miclus",
    fallbackRelativePath: "assets/gameplay/pickup-miclus.svg",
    replacementRelativePath: "assets/replacement/gameplay/pickup-miclus.png",
    width: 20,
    height: 20,
    kind: "entity"
  },
  "shared.boss-shell": {
    id: "shared.boss-shell",
    fallbackRelativePath: "assets/gameplay/boss-shell.svg",
    replacementRelativePath: "assets/replacement/gameplay/boss-shell.png",
    width: 92,
    height: 52,
    kind: "entity"
  },
  "shared.boss-walker-body": {
    id: "shared.boss-walker-body",
    fallbackRelativePath: "assets/gameplay/boss-walker-body.svg",
    replacementRelativePath: "assets/replacement/gameplay/boss-walker-body.png",
    width: 96,
    height: 56,
    kind: "entity"
  },
  "shared.boss-walker-part": {
    id: "shared.boss-walker-part",
    fallbackRelativePath: "assets/gameplay/boss-walker-part.svg",
    replacementRelativePath: "assets/replacement/gameplay/boss-walker-part.png",
    width: 38,
    height: 28,
    kind: "entity"
  },
  "shared.player-bullet": {
    id: "shared.player-bullet",
    fallbackRelativePath: "assets/gameplay/player-bullet.svg",
    replacementRelativePath: "assets/replacement/gameplay/player-bullet.png",
    width: 10,
    height: 18,
    kind: "entity"
  },
  "shared.enemy-bullet": {
    id: "shared.enemy-bullet",
    fallbackRelativePath: "assets/gameplay/enemy-bullet.svg",
    replacementRelativePath: "assets/replacement/gameplay/enemy-bullet.png",
    width: 10,
    height: 18,
    kind: "entity"
  },
  "shared.effect-hit": {
    id: "shared.effect-hit",
    fallbackRelativePath: "assets/gameplay/effect-hit.svg",
    replacementRelativePath: "assets/replacement/gameplay/effect-hit.png",
    width: 24,
    height: 24,
    kind: "entity"
  },
  "shared.effect-explosion": {
    id: "shared.effect-explosion",
    fallbackRelativePath: "assets/gameplay/effect-explosion.svg",
    replacementRelativePath: "assets/replacement/gameplay/effect-explosion.png",
    width: 42,
    height: 42,
    kind: "entity"
  },
  "shared.effect-respawn": {
    id: "shared.effect-respawn",
    fallbackRelativePath: "assets/gameplay/effect-respawn.svg",
    replacementRelativePath: "assets/replacement/gameplay/effect-respawn.png",
    width: 48,
    height: 48,
    kind: "entity"
  },
  "stage-1.backdrop-sky": {
    id: "stage-1.backdrop-sky",
    fallbackRelativePath: "assets/stages/stage-1/backdrop-sky.svg",
    replacementRelativePath: "assets/replacement/stages/stage-1/backdrop-sky.png",
    width: 320,
    height: 192,
    kind: "background"
  },
  "stage-1.backdrop-terrain": {
    id: "stage-1.backdrop-terrain",
    fallbackRelativePath: "assets/stages/stage-1/backdrop-terrain.svg",
    replacementRelativePath: "assets/replacement/stages/stage-1/backdrop-terrain.png",
    width: 320,
    height: 192,
    kind: "background"
  },
  "stage-2.backdrop": {
    id: "stage-2.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-water.svg",
    width: 320,
    height: 568,
    kind: "background"
  },
  "stage-3.backdrop": {
    id: "stage-3.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-water.svg",
    width: 320,
    height: 568,
    kind: "background"
  },
  "stage-4.backdrop": {
    id: "stage-4.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-industrial.svg",
    width: 320,
    height: 568,
    kind: "background"
  },
  "stage-5.backdrop": {
    id: "stage-5.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-desert.svg",
    width: 320,
    height: 568,
    kind: "background"
  },
  "stage-6.backdrop": {
    id: "stage-6.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-industrial.svg",
    width: 320,
    height: 568,
    kind: "background"
  },
  "stage-7.backdrop": {
    id: "stage-7.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-void.svg",
    width: 320,
    height: 568,
    kind: "background"
  },
  "stage-8.backdrop": {
    id: "stage-8.backdrop",
    fallbackRelativePath: "assets/stages/shared/backdrop-void.svg",
    width: 320,
    height: 568,
    kind: "background"
  }
};

const audioCueRegistry: Record<string, AudioCueDefinition> = {
  "bgm-stage-1": {
    id: "bgm-stage-1",
    replacementRelativePath: "assets/replacement/audio/bgm-stage-1.ogg"
  },
  "bgm-stage-2": {
    id: "bgm-stage-2"
  },
  "bgm-stage-3": {
    id: "bgm-stage-3"
  },
  "bgm-stage-4": {
    id: "bgm-stage-4"
  },
  "bgm-stage-5": {
    id: "bgm-stage-5"
  },
  "bgm-stage-6": {
    id: "bgm-stage-6"
  },
  "bgm-stage-7": {
    id: "bgm-stage-7"
  },
  "bgm-stage-8": {
    id: "bgm-stage-8"
  },
  "sfx-player1-fire": {
    id: "sfx-player1-fire",
    replacementRelativePath: "assets/replacement/audio/sfx-player1-fire.ogg"
  },
  "sfx-player2-fire": {
    id: "sfx-player2-fire"
  },
  "sfx-player1-bomb": {
    id: "sfx-player1-bomb",
    replacementRelativePath: "assets/replacement/audio/sfx-player1-bomb.ogg"
  },
  "sfx-player2-bomb": {
    id: "sfx-player2-bomb"
  },
  "sfx-player-hit": {
    id: "sfx-player-hit",
    replacementRelativePath: "assets/replacement/audio/sfx-player-hit.ogg"
  },
  "sfx-player-respawn": {
    id: "sfx-player-respawn",
    replacementRelativePath: "assets/replacement/audio/sfx-player-respawn.ogg"
  },
  "sfx-enemy-destroyed": {
    id: "sfx-enemy-destroyed",
    replacementRelativePath: "assets/replacement/audio/sfx-enemy-destroyed.ogg"
  }
};

const stageBundles: Record<string, StageAssetBundle> = {
  "stage-1": {
    stageId: "stage-1",
    assetIds: [
      "stage-1.backdrop-sky",
      "stage-1.backdrop-terrain",
      "shared.player-ship",
      "shared.enemy-scout",
      "shared.enemy-warplane",
      "shared.enemy-ground",
      "shared.enemy-turret",
      "shared.enemy-carrier",
      "shared.enemy-gunboat",
      "shared.enemy-scenery",
      "shared.pickup-medal",
      "shared.pickup-fairy",
      "shared.pickup-weapon",
      "shared.pickup-bomb",
      "shared.pickup-extend",
      "shared.boss-walker-body",
      "shared.boss-walker-part",
      "shared.player-bullet",
      "shared.enemy-bullet",
      "shared.effect-hit",
      "shared.effect-explosion",
      "shared.effect-respawn"
    ],
    audioCueIds: [
      "bgm-stage-1",
      "sfx-player1-fire",
      "sfx-player1-bomb",
      "sfx-player-hit",
      "sfx-player-respawn",
      "sfx-enemy-destroyed"
    ],
    preloadGroups: ["shell", "shared", "stage-1"],
    requiredReplacementTextureIds: replacementAssetCatalog.stageBundles["stage-1"].requiredReplacementTextures.map(
      (asset) => asset.id
    ),
    requiredReplacementAudioCueIds: replacementAssetCatalog.stageBundles["stage-1"].requiredReplacementAudioCues.map(
      (cue) => cue.id
    )
  },
  "stage-2": {
    stageId: "stage-2",
    assetIds: ["stage-2.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-2", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-2"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
  },
  "stage-3": {
    stageId: "stage-3",
    assetIds: ["stage-3.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-3", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-3"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
  },
  "stage-4": {
    stageId: "stage-4",
    assetIds: ["stage-4.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-4", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-4"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
  },
  "stage-5": {
    stageId: "stage-5",
    assetIds: ["stage-5.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-5", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-5"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
  },
  "stage-6": {
    stageId: "stage-6",
    assetIds: ["stage-6.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-6", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-6"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
  },
  "stage-7": {
    stageId: "stage-7",
    assetIds: ["stage-7.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-7", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-7"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
  },
  "stage-8": {
    stageId: "stage-8",
    assetIds: ["stage-8.backdrop", "shared.player-ship", "shared.enemy-scout"],
    audioCueIds: ["bgm-stage-8", "sfx-player1-fire", "sfx-player1-bomb"],
    preloadGroups: ["shell", "shared", "stage-8"],
    requiredReplacementTextureIds: [],
    requiredReplacementAudioCueIds: []
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

function getReplacementStageCatalog(stageId: string): {
  requiredReplacementTextures: RequiredReplacementAssetDefinition[];
  requiredReplacementAudioCues: RequiredReplacementAssetDefinition[];
} {
  const contract = (replacementAssetCatalog.stageBundles as ReplacementAssetCatalogRecord)[stageId];
  return (
    contract ?? {
      requiredReplacementTextures: [],
      requiredReplacementAudioCues: []
    }
  );
}

export function createAssetManifest(basePath = "/games/raiden-ii/"): AssetManifest {
  const normalizedBasePath = normalizeBasePath(basePath);

  function resolveTextureAsset(assetId: string): TextureAssetDefinition {
    const asset = textureRegistry[assetId];
    if (!asset) {
      throw new Error(`Unknown texture asset id: ${assetId}`);
    }

    return asset;
  }

  function resolveAudioCue(cueId: string): AudioCueDefinition {
    const cue = audioCueRegistry[cueId];
    if (!cue) {
      throw new Error(`Unknown audio cue id: ${cueId}`);
    }

    return cue;
  }

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
        "shared.enemy-scout",
        "shared.enemy-warplane",
        "shared.enemy-ground",
        "shared.enemy-turret",
        "shared.enemy-carrier",
        "shared.enemy-gunboat",
        "shared.enemy-scenery",
        "shared.pickup-medal",
        "shared.pickup-fairy",
        "shared.pickup-weapon",
        "shared.pickup-bomb",
        "shared.pickup-extend",
        "shared.pickup-miclus",
        "shared.boss-shell",
        "shared.boss-walker-body",
        "shared.boss-walker-part",
        "shared.player-bullet",
        "shared.enemy-bullet",
        "shared.effect-hit",
        "shared.effect-explosion",
        "shared.effect-respawn"
      ]
    },
    getStageBundle(stageId: string): StageAssetBundle {
      return (
        stageBundles[stageId] ?? {
          stageId,
          assetIds: ["shared.player-ship", "shared.enemy-scout"],
          audioCueIds: [`bgm-${stageId}`],
          preloadGroups: ["shell", "shared", stageId],
          requiredReplacementTextureIds: [],
          requiredReplacementAudioCueIds: []
        }
      );
    },
    getTextureAsset(assetId: string): TextureAssetDefinition {
      return resolveTextureAsset(assetId);
    },
    getAudioCue(cueId: string): AudioCueDefinition {
      return resolveAudioCue(cueId);
    },
    listTextureAssets(): TextureAssetDefinition[] {
      return Object.values(textureRegistry);
    },
    listAudioCues(): AudioCueDefinition[] {
      return Object.values(audioCueRegistry);
    },
    getRequiredReplacementTextureAssets(stageId: string): Array<
      TextureAssetDefinition & { replacementRelativePath: string }
    > {
      return getReplacementStageCatalog(stageId).requiredReplacementTextures.map((entry) => {
        const asset = resolveTextureAsset(entry.id);
        if (!asset.replacementRelativePath) {
          throw new Error(`Missing replacement path for required texture asset: ${entry.id}`);
        }

        return asset as TextureAssetDefinition & { replacementRelativePath: string };
      });
    },
    getRequiredReplacementAudioCues(stageId: string): Array<
      AudioCueDefinition & { replacementRelativePath: string }
    > {
      return getReplacementStageCatalog(stageId).requiredReplacementAudioCues.map((entry) => {
        const cue = resolveAudioCue(entry.id);
        if (!cue.replacementRelativePath) {
          throw new Error(`Missing replacement path for required audio cue: ${entry.id}`);
        }

        return cue as AudioCueDefinition & { replacementRelativePath: string };
      });
    },
    getReplacementAssetCatalog(stageId: string): {
      requiredReplacementTextures: RequiredReplacementAssetDefinition[];
      requiredReplacementAudioCues: RequiredReplacementAssetDefinition[];
    } {
      return getReplacementStageCatalog(stageId);
    },
    resolveTextureCandidates(assetId: string): string[] {
      const asset = resolveTextureAsset(assetId);
      const candidates: string[] = [];
      if (asset.replacementRelativePath) {
        candidates.push(`${normalizedBasePath}${normalizeRelativePath(asset.replacementRelativePath)}`);
      }
      candidates.push(`${normalizedBasePath}${normalizeRelativePath(asset.fallbackRelativePath)}`);
      return candidates;
    },
    resolveAudioCandidates(cueId: string): string[] {
      const cue = resolveAudioCue(cueId);
      return cue.replacementRelativePath
        ? [`${normalizedBasePath}${normalizeRelativePath(cue.replacementRelativePath)}`]
        : [];
    },
    resolveUrl(assetId: string): string {
      return `${normalizedBasePath}${normalizeRelativePath(
        resolveTextureAsset(assetId).fallbackRelativePath
      )}`;
    },
    resolvePath(relativePath: string): string {
      return `${normalizedBasePath}${normalizeRelativePath(relativePath)}`;
    }
  };
}
