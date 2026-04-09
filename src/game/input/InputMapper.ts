import type {
  CapturedFrameInput,
  PlayerInputState,
  PlayerSlot,
  Vector2
} from "../core/types";

type KeyboardAction = "up" | "down" | "left" | "right" | "fire" | "bomb" | "focus";

interface KeyboardBinding {
  player: PlayerSlot;
  key: string;
  action: KeyboardAction;
}

interface RawGamepadInput {
  player: PlayerSlot;
  axes: [number, number];
  buttons?: Partial<Record<"fire" | "bomb" | "focus", boolean>>;
}

export interface RawFrameInput {
  keyboardPressed?: string[];
  gamepads?: RawGamepadInput[];
}

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function createEmptyPlayerInput(): PlayerInputState {
  return {
    move: { x: 0, y: 0 },
    fire: false,
    bomb: false,
    focus: false
  };
}

function normalizeVector(vector: Vector2): Vector2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0 || length <= 1) {
    return vector;
  }

  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

export class InputMapper {
  constructor(private readonly keyboardBindings: KeyboardBinding[]) {}

  captureFrame(raw: RawFrameInput): CapturedFrameInput {
    const state: Record<PlayerSlot, PlayerInputState> = {
      player1: createEmptyPlayerInput(),
      player2: createEmptyPlayerInput()
    };

    const pressedKeys = new Set(raw.keyboardPressed ?? []);
    for (const binding of this.keyboardBindings) {
      if (!pressedKeys.has(binding.key)) {
        continue;
      }

      const player = state[binding.player];
      switch (binding.action) {
        case "up":
          player.move.y -= 1;
          break;
        case "down":
          player.move.y += 1;
          break;
        case "left":
          player.move.x -= 1;
          break;
        case "right":
          player.move.x += 1;
          break;
        case "fire":
          player.fire = true;
          break;
        case "bomb":
          player.bomb = true;
          break;
        case "focus":
          player.focus = true;
          break;
      }
    }

    for (const gamepad of raw.gamepads ?? []) {
      const player = state[gamepad.player];
      player.move.x = clampAxis(player.move.x + gamepad.axes[0]);
      player.move.y = clampAxis(player.move.y + gamepad.axes[1]);
      player.fire ||= gamepad.buttons?.fire ?? false;
      player.bomb ||= gamepad.buttons?.bomb ?? false;
      player.focus ||= gamepad.buttons?.focus ?? false;
    }

    for (const player of Object.values(state)) {
      player.move = normalizeVector(player.move);
    }

    return {
      players: state
    };
  }
}

export function createDefaultInputMapper(): InputMapper {
  return new InputMapper([
    { player: "player1", key: "ArrowUp", action: "up" },
    { player: "player1", key: "ArrowDown", action: "down" },
    { player: "player1", key: "ArrowLeft", action: "left" },
    { player: "player1", key: "ArrowRight", action: "right" },
    { player: "player1", key: "KeyZ", action: "fire" },
    { player: "player1", key: "KeyX", action: "bomb" },
    { player: "player1", key: "ShiftRight", action: "focus" },
    { player: "player2", key: "KeyW", action: "up" },
    { player: "player2", key: "KeyS", action: "down" },
    { player: "player2", key: "KeyA", action: "left" },
    { player: "player2", key: "KeyD", action: "right" },
    { player: "player2", key: "Period", action: "fire" },
    { player: "player2", key: "Comma", action: "bomb" },
    { player: "player2", key: "Slash", action: "focus" }
  ]);
}
