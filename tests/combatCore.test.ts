import { describe, expect, it } from "vitest";

import {
  advancePlayerMovement,
  applyMainWeaponPickup,
  applyPlayerDamage,
  applySubWeaponPickup,
  awardPoints,
  collectMedal,
  createCombatPlayerState,
  defaultCombatRules,
  triggerBomb
} from "../src/game/combat/CombatSystems";

describe("Combat core", () => {
  it("PLY-001 normalizes diagonal movement and preserves hitbox", () => {
    const player = createCombatPlayerState("player1", {
      position: { x: 100, y: 100 }
    });

    const moved = advancePlayerMovement(
      player,
      {
        move: { x: 1, y: 1 },
        fire: false,
        bomb: false,
        focus: false
      },
      { width: 320, height: 568 }
    );

    const displacement = Math.hypot(
      moved.position.x - player.position.x,
      moved.position.y - player.position.y
    );

    expect(displacement).toBeCloseTo(defaultCombatRules.moveSpeed, 4);
    expect(moved.hitRadius).toBe(player.hitRadius);
  });

  it("PLY-001 applies focused movement speed", () => {
    const player = createCombatPlayerState("player1", {
      position: { x: 100, y: 100 }
    });

    const moved = advancePlayerMovement(
      player,
      {
        move: { x: 1, y: 0 },
        fire: false,
        bomb: false,
        focus: true
      },
      { width: 320, height: 568 }
    );

    expect(moved.position.x - player.position.x).toBeCloseTo(
      defaultCombatRules.moveSpeed * defaultCombatRules.focusMultiplier,
      4
    );
  });

  it("PLY-001 clamps movement against hitbox bounds and decays invulnerability", () => {
    const player = createCombatPlayerState("player1", {
      position: { x: 4, y: 4 },
      invulnerableFrames: 3
    });

    const moved = advancePlayerMovement(
      player,
      {
        move: { x: -1, y: -1 },
        fire: false,
        bomb: false,
        focus: false
      },
      { width: 320, height: 568 }
    );

    expect(moved.position.x).toBe(defaultCombatRules.hitRadius);
    expect(moved.position.y).toBe(defaultCombatRules.hitRadius);
    expect(moved.invulnerableFrames).toBe(2);
  });

  it("WPN-001 levels same main weapon and switches route at base level", () => {
    let player = createCombatPlayerState("player1");

    player = applyMainWeaponPickup(player, "vulcan");
    expect(player.mainWeapon.type).toBe("vulcan");
    expect(player.mainWeapon.level).toBe(2);

    player = applyMainWeaponPickup(player, "laser");
    expect(player.mainWeapon.type).toBe("laser");
    expect(player.mainWeapon.level).toBe(1);
  });

  it("WPN-002 levels same sub-weapon and switches route independently", () => {
    let player = createCombatPlayerState("player1");

    player = applySubWeaponPickup(player, "homing");
    expect(player.subWeapon).not.toBeNull();
    expect(player.subWeapon?.type).toBe("homing");
    expect(player.subWeapon?.level).toBe(1);

    player = applySubWeaponPickup(player, "homing");
    expect(player.subWeapon?.level).toBe(2);

    player = applySubWeaponPickup(player, "straight");
    expect(player.subWeapon?.type).toBe("straight");
    expect(player.subWeapon?.level).toBe(1);
  });

  it("BMB-001 consumes a bomb, clears bullets, and grants invulnerability", () => {
    const player = createCombatPlayerState("player1", { bombs: 2 });

    const result = triggerBomb(player, [
      {
        id: "bullet-a",
        owner: "enemy",
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 2 }
      },
      {
        id: "bullet-b",
        owner: "enemy",
        position: { x: 120, y: 100 },
        velocity: { x: 0, y: 2 }
      }
    ]);

    expect(result.activated).toBe(true);
    expect(result.player.bombs).toBe(1);
    expect(result.player.invulnerableFrames).toBe(
      defaultCombatRules.bombInvulnerabilityFrames
    );
    expect(result.remainingBullets).toHaveLength(0);
  });

  it("BMB-001 does nothing when no bombs remain", () => {
    const player = createCombatPlayerState("player1", { bombs: 0 });

    const result = triggerBomb(player, [
      {
        id: "bullet-a",
        owner: "enemy",
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 2 }
      }
    ]);

    expect(result.activated).toBe(false);
    expect(result.player.bombs).toBe(0);
    expect(result.remainingBullets).toHaveLength(1);
  });

  it("DMG-001 respawns player at checkpoint with downgraded gear", () => {
    const player = createCombatPlayerState("player1", {
      lives: 2,
      mainWeapon: { type: "laser", level: 4 },
      subWeapon: { type: "homing", level: 3 }
    });

    const result = applyPlayerDamage(player, {
      checkpointId: "cp-1",
      position: { x: 140, y: 460 },
      waveCursor: 2,
      scrollY: 180
    });

    expect(result.outcome).toBe("respawned");
    expect(result.player.lives).toBe(1);
    expect(result.player.position).toEqual({ x: 140, y: 460 });
    expect(result.player.mainWeapon.level).toBe(2);
    expect(result.player.subWeapon?.level).toBe(2);
    expect(result.player.invulnerableFrames).toBe(
      defaultCombatRules.respawnInvulnerabilityFrames
    );
  });

  it("DMG-001 ignores damage during invulnerability", () => {
    const player = createCombatPlayerState("player1", {
      invulnerableFrames: 10,
      lives: 2
    });

    const result = applyPlayerDamage(player, {
      checkpointId: "cp-1",
      position: { x: 120, y: 420 },
      waveCursor: 1,
      scrollY: 120
    });

    expect(result.outcome).toBe("blocked");
    expect(result.player.lives).toBe(2);
  });

  it("DMG-001 destroys player when no reserve lives remain", () => {
    const player = createCombatPlayerState("player1", {
      lives: 0
    });

    const result = applyPlayerDamage(player, {
      checkpointId: "cp-1",
      position: { x: 120, y: 420 },
      waveCursor: 1,
      scrollY: 120
    });

    expect(result.outcome).toBe("destroyed");
  });

  it("SCR-001 medals increase score and extend thresholds grant reserve lives", () => {
    let player = createCombatPlayerState("player1", {
      lives: 2,
      score: 199_800
    });

    player = collectMedal(player);
    player = collectMedal(player);
    player = awardPoints(player, 200);

    expect(player.score).toBe(200_300);
    expect(player.medalTier).toBe(2);
    expect(player.lives).toBe(3);
    expect(player.extendsAwarded).toBe(1);
  });
});
