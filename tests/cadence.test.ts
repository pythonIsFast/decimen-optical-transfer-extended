import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_REFRESH_CYCLES,
  bestFpsFor,
  medianGapMs,
  refreshHzFromGaps,
  snapRefreshHz,
} from "../shared/cadence.ts";
import { TX_FPS_OPTIONS } from "../shared/send-settings.ts";

/**
 * rAF gaps from a panel at `hz`.
 *
 * Jitter is proportional to the period, not absolute: rAF timestamps are
 * presentation times quantised to vsync, so a 120 Hz panel does not jitter by
 * the same milliseconds a 60 Hz one does. On top of that the sample carries
 * what a real one carries and the verdict must survive: a long hitch (layout
 * or GC), a near-zero double callback, and dropped frames that land the gap on
 * two periods instead of one.
 */
function gapsFor(hz: number, count = 200): number[] {
  const period = 1000 / hz;
  return Array.from({ length: count }, (_, i) => {
    if (i === 5) return 240;
    if (i === 40) return 0.4;
    if (i % 17 === 0) return period * 2; // dropped frame
    return period * (i % 3 === 0 ? 1.015 : 0.99);
  });
}

test("median ignores the outliers a mean would swallow", () => {
  assert.equal(medianGapMs([16, 16, 17, 16, 240]), 16);
  assert.equal(medianGapMs([]), undefined);
});

test("a jittery sample still names the panel it came from", () => {
  for (const hz of [60, 120, 144, 240]) {
    assert.equal(refreshHzFromGaps(gapsFor(hz)), hz);
  }
});

test("snapping only pulls a measurement onto a rate that is genuinely near", () => {
  assert.equal(snapRefreshHz(63), 60); // within 6% — the jitter case
  assert.equal(snapRefreshHz(58.5), 60);
  assert.equal(snapRefreshHz(200), 200); // matches nothing: reported as measured
  assert.equal(snapRefreshHz(0), undefined);
  assert.equal(snapRefreshHz(Number.NaN), undefined);
});

test("the snap tolerance has an edge, and it is where it was designed to be", () => {
  assert.equal(snapRefreshHz(60 * 1.059), 60); // inside ±6%
  assert.equal(snapRefreshHz(60 * 1.08), 65); // outside: reported, not forced
});

test("144 and 165 do not collapse onto each other", () => {
  assert.equal(snapRefreshHz(144), 144);
  assert.equal(snapRefreshHz(165), 165);
});

test("a sample of pure garbage yields no verdict rather than a wrong one", () => {
  // Every gap outside a plausible refresh period — a throttled background tab.
  assert.equal(refreshHzFromGaps([500, 900, 1200]), undefined);
  assert.equal(refreshHzFromGaps([]), undefined);
});

test("the warning fires exactly when a frame gets under two refresh cycles", () => {
  const warns = (hz: number, txFps: number) => hz / txFps < MIN_REFRESH_CYCLES;
  assert.equal(warns(60, 60), true);
  assert.equal(warns(60, 55), true);
  assert.equal(warns(60, 30), false); // exactly 2 is the point of the rule
  assert.equal(warns(120, 60), false);
  assert.equal(warns(120, 55), false);
});

test("the advice names the fastest setting that actually works", () => {
  assert.equal(bestFpsFor(60, TX_FPS_OPTIONS), 30);
  assert.equal(bestFpsFor(120, TX_FPS_OPTIONS), 60);
  assert.equal(bestFpsFor(240, TX_FPS_OPTIONS), 60); // capped by the dropdown
});

test("the advice is always a value the dropdown offers", () => {
  for (const hz of [50, 60, 75, 90, 100, 120, 144, 165, 240]) {
    const advice = bestFpsFor(hz, TX_FPS_OPTIONS);
    if (advice !== undefined) assert.ok(TX_FPS_OPTIONS.includes(advice));
  }
});

test("a display too slow for any offered rate gets no advice, not a bad one", () => {
  assert.equal(bestFpsFor(15, TX_FPS_OPTIONS), undefined);
});
