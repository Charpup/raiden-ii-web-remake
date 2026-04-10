import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const ROOT_DIR = process.cwd();
const OUTPUT_DIR = path.join(ROOT_DIR, "output", "playwright");
const HOST = process.env.RAIDEN_PREVIEW_HOST ?? "127.0.0.1";
const PORT = process.env.RAIDEN_PREVIEW_PORT ?? "4176";
const BASE_URL =
  process.env.RAIDEN_PREVIEW_URL ?? `http://${HOST}:${PORT}/games/raiden-ii/`;
const SIGNOFF_FRAMES = Number.parseInt(process.env.RAIDEN_SIGNOFF_FRAMES ?? "1800", 10);
const SCREENSHOT_PATH = path.join(OUTPUT_DIR, "sprint1-preview-signoff.png");
const REPORT_PATH = path.join(OUTPUT_DIR, "sprint1-preview-signoff.json");
const PREVIEW_STDOUT_PATH = path.join(OUTPUT_DIR, "sprint1-preview.stdout.log");
const PREVIEW_STDERR_PATH = path.join(OUTPUT_DIR, "sprint1-preview.stderr.log");

function npmExecutable() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function npxExecutable() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}.`));
    });
  });
}

async function isPreviewReachable() {
  try {
    const response = await fetch(BASE_URL, {
      redirect: "manual"
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForPreviewReady(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isPreviewReachable()) {
      return;
    }
    await delay(250);
  }

  throw new Error(`Preview server at ${BASE_URL} did not become ready within ${timeoutMs}ms.`);
}

function spawnPreviewServer() {
  const stdoutChunks = [];
  const stderrChunks = [];
  const child = spawn(
    npmExecutable(),
    ["run", "preview", "--", "--host", HOST, "--port", PORT, "--strictPort"],
    {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32"
    }
  );

  child.stdout?.on("data", (chunk) => {
    stdoutChunks.push(String(chunk));
  });
  child.stderr?.on("data", (chunk) => {
    stderrChunks.push(String(chunk));
  });

  return {
    child,
    async flushLogs() {
      await writeFile(PREVIEW_STDOUT_PATH, stdoutChunks.join(""), "utf8");
      await writeFile(PREVIEW_STDERR_PATH, stderrChunks.join(""), "utf8");
    }
  };
}

async function stopChildProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32" && child.pid) {
    await runCommand("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore"
    }).catch(() => {});
    return;
  }

  child.kill("SIGTERM");
}

async function launchPreviewBrowser() {
  const preferredChannel = process.env.RAIDEN_PLAYWRIGHT_CHANNEL;
  const launchAttempts = preferredChannel
    ? [{ channel: preferredChannel, label: preferredChannel }]
    : [
        { channel: "msedge", label: "msedge" },
        { channel: "chrome", label: "chrome" },
        { channel: undefined, label: "playwright-bundled" }
      ];

  let lastError = null;
  for (const attempt of launchAttempts) {
    try {
      return await chromium.launch({
        headless: true,
        channel: attempt.channel
      });
    } catch (error) {
      lastError = error;
    }
  }

  await runCommand(npxExecutable(), ["playwright", "install", "chromium"]);
  return chromium.launch({
    headless: true
  });
}

function activePilotKeysForFrame(frame) {
  const horizontalSway = Math.sin(frame / 40);
  const keys = ["KeyZ"];

  if (horizontalSway < -0.35) {
    keys.push("ArrowLeft");
  } else if (horizontalSway > 0.35) {
    keys.push("ArrowRight");
  }

  if (frame % 12 < 4) {
    keys.push("ArrowUp");
  }

  return keys;
}

async function getDebugSnapshot(page) {
  return page.evaluate(() => {
    const debug = window.__RAIDEN_DEBUG__;
    if (!debug) {
      throw new Error("Missing window.__RAIDEN_DEBUG__ debug hook.");
    }

    return debug.getSnapshot();
  });
}

async function stopPreviewLoop(page) {
  await page.evaluate(() => {
    const debug = window.__RAIDEN_DEBUG__;
    if (!debug) {
      throw new Error("Missing window.__RAIDEN_DEBUG__ debug hook.");
    }

    debug.stopAnimationLoop();
    window.__RAIDEN_SIGNOFF_HELD_KEYS__ = [];
  });
}

async function releaseHeldKeys(page) {
  await page.evaluate(() => {
    const heldKeys = Array.isArray(window.__RAIDEN_SIGNOFF_HELD_KEYS__)
      ? window.__RAIDEN_SIGNOFF_HELD_KEYS__
      : [];

    for (const code of heldKeys) {
      window.dispatchEvent(
        new KeyboardEvent("keyup", {
          code,
          bubbles: true
        })
      );
    }

    window.__RAIDEN_SIGNOFF_HELD_KEYS__ = [];
  });
}

async function syncHeldKeysAndTick(page, nextKeys, deltaMs) {
  return page.evaluate(
    ({ nextKeys, deltaMs }) => {
      const debug = window.__RAIDEN_DEBUG__;
      if (!debug) {
        throw new Error("Missing window.__RAIDEN_DEBUG__ debug hook.");
      }

      const heldKeys = new Set(
        Array.isArray(window.__RAIDEN_SIGNOFF_HELD_KEYS__)
          ? window.__RAIDEN_SIGNOFF_HELD_KEYS__
          : []
      );
      const desiredKeys = new Set(nextKeys);

      for (const code of heldKeys) {
        if (desiredKeys.has(code)) {
          continue;
        }

        window.dispatchEvent(
          new KeyboardEvent("keyup", {
            code,
            bubbles: true
          })
        );
      }

      for (const code of desiredKeys) {
        if (heldKeys.has(code)) {
          continue;
        }

        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            code,
            bubbles: true
          })
        );
      }

      window.__RAIDEN_SIGNOFF_HELD_KEYS__ = [...desiredKeys];
      return debug.tick(deltaMs);
    },
    { nextKeys, deltaMs }
  );
}

async function driveSprint1Opening(page) {
  const startSnapshot = await getDebugSnapshot(page);
  const startFrame = startSnapshot.simulationFrame ?? 0;
  const transitions = [
    {
      absoluteFrame: startSnapshot.simulationFrame,
      relativeFrame: 0,
      screen: startSnapshot.flow.screen,
      reason: startSnapshot.lastFlowTransitionReason
    }
  ];
  const samples = [];
  let lateWindowActivity = false;
  let previousScreen = startSnapshot.flow.screen;
  let previousReason = startSnapshot.lastFlowTransitionReason;
  let observedFrames = 0;
  const timedOut = false;

  try {
    for (let scriptedFrame = 0; scriptedFrame < SIGNOFF_FRAMES; scriptedFrame += 1) {
      const snapshot = await syncHeldKeysAndTick(
        page,
        activePilotKeysForFrame(scriptedFrame),
        1000 / 60
      );
      const absoluteFrame = snapshot.simulationFrame ?? startFrame;
      const relativeFrame = Math.max(0, absoluteFrame - startFrame);
      observedFrames = relativeFrame;

      if (
        snapshot.flow.screen !== previousScreen ||
        snapshot.lastFlowTransitionReason !== previousReason
      ) {
        transitions.push({
          absoluteFrame,
          relativeFrame,
          screen: snapshot.flow.screen,
          reason: snapshot.lastFlowTransitionReason
        });
        previousScreen = snapshot.flow.screen;
        previousReason = snapshot.lastFlowTransitionReason;
      }

      if (
        relativeFrame >= Math.max(0, SIGNOFF_FRAMES - 300) &&
        snapshot.sceneCounts.players > 0 &&
        (snapshot.sceneCounts.enemies > 0 ||
          snapshot.sceneCounts.enemyBullets > 0 ||
          snapshot.sceneCounts.effects > 0)
      ) {
        lateWindowActivity = true;
      }

      if (
        samples.length === 0 ||
        relativeFrame >= samples[samples.length - 1].relativeFrame + 300 ||
        snapshot.flow.screen !== "gameplay"
      ) {
        samples.push({
          absoluteFrame,
          relativeFrame,
          screen: snapshot.flow.screen,
          reason: snapshot.lastFlowTransitionReason,
          sceneCounts: snapshot.sceneCounts,
          recentEventTypes: snapshot.recentEventTypes
        });
      }

      if (snapshot.flow.screen !== "gameplay" || relativeFrame >= SIGNOFF_FRAMES) {
        return {
          startFrame,
          observedFrames,
          lateWindowActivity,
          timedOut,
          transitions,
          samples,
          finalSnapshot: snapshot
        };
      }
    }

    const finalSnapshot = await getDebugSnapshot(page);
    return {
      startFrame,
      observedFrames,
      lateWindowActivity,
      timedOut,
      transitions,
      samples,
      finalSnapshot
    };
  } finally {
    await releaseHeldKeys(page);
  }
}

async function runSignoff() {
  await ensureOutputDir();
  await runCommand(npmExecutable(), ["run", "build"]);

  const previewLogs = spawnPreviewServer();
  const previewProcess = previewLogs.child;
  await waitForPreviewReady();

  const browser = await launchPreviewBrowser();
  const page = await browser.newPage({
    viewport: {
      width: 1600,
      height: 1000
    }
  });

  const consoleMessages = [];
  const failedRequests = [];

  page.on("console", (message) => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location()
    });
  });

  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? "unknown"
    });
  });

  let result;
  let pass = false;
  let finalDataFlow = null;

  try {
    await page.goto(BASE_URL, {
      waitUntil: "networkidle"
    });
    await page.waitForFunction(
      () => window.__RAIDEN_DEBUG__?.bootstrapPhase === "ready"
    );

    await page.getByRole("button", { name: "Start Mission" }).click();
    await page.waitForFunction(
      () => document.querySelector("#app")?.getAttribute("data-flow") === "mode-select"
    );

    await page.getByRole("button", { name: "1P Solo Sortie" }).click();
    await page.waitForFunction(
      () => document.querySelector("#app")?.getAttribute("data-flow") === "cabinet-select"
    );

    await stopPreviewLoop(page);
    await page.getByRole("button", { name: "Easy Cabinet" }).click();
    await page.waitForFunction(
      () => document.querySelector("#app")?.getAttribute("data-flow") === "gameplay"
    );

    result = await driveSprint1Opening(page);
    finalDataFlow = await page.locator("#app").getAttribute("data-flow");
    pass =
      finalDataFlow === "gameplay" &&
      result.observedFrames >= SIGNOFF_FRAMES &&
      !result.timedOut &&
      result.finalSnapshot?.simulationFrame !== null &&
      result.finalSnapshot?.sceneCounts.players > 0 &&
      result.lateWindowActivity;
  } finally {
    await page.screenshot({
      path: SCREENSHOT_PATH,
      fullPage: true
    });
  }

  const report = {
    url: BASE_URL,
    reusedPreview: false,
    pass,
    finalDataFlow,
    result,
    consoleErrors: consoleMessages.filter((message) => message.type === "error"),
    consoleMessages,
    failedRequests,
    screenshotPath: SCREENSHOT_PATH
  };

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await browser.close();

  await previewLogs.flushLogs();
  await stopChildProcess(previewProcess);

  if (!pass) {
    throw new Error(
      `Sprint 1 preview signoff failed. See ${REPORT_PATH} and ${SCREENSHOT_PATH} for evidence.`
    );
  }
}

runSignoff().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
