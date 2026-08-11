// Does the sending display actually hold each frame long enough to be caught?
//
// A frame needs at least two refresh cycles on screen. With one, a camera
// exposure straddles the flip and catches a torn code — early field runs
// measured catch rates of 0.2–0.4 at 60 fps on a 60 Hz panel, which is the
// difference between a transfer that crawls and one that flies. Nothing about
// this is visible from the sending side: the stream looks perfect and the
// receiver just grinds, so the sender has to measure and say so.
//
// requestAnimationFrame fires once per refresh, so the gaps between callbacks
// are the refresh period. main.ts collects them; everything here is pure.

/** Refresh cycles a frame needs on screen to survive a camera exposure. */
export const MIN_REFRESH_CYCLES = 2;

/** Rates real panels run at, used to clean up a jittery measurement. */
export const PANEL_HZ: readonly number[] = [50, 60, 75, 90, 100, 120, 144, 165, 240];

/**
 * Median of the sampled gaps, in milliseconds.
 *
 * Median rather than mean: the first callbacks after a stream starts are lumpy
 * with layout and QR generation, and a single 200 ms hitch drags an average
 * into nonsense. Returns undefined for an empty sample so callers cannot
 * accidentally divide by a made-up number.
 */
export function medianGapMs(gaps: readonly number[]): number | undefined {
  if (gaps.length === 0) return undefined;
  const sorted = [...gaps].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}

/**
 * Round a measured refresh to the nearest rate a display plausibly runs at.
 *
 * Frame gaps jitter, and jitter is rarely symmetric, so the median of a real
 * 60 Hz panel can land a few percent off 16.67 ms and come out as 63 Hz.
 * Reporting that undermines the advice attached to it — a reader who knows
 * their panel is 60 Hz stops believing the rest of the sentence. The
 * candidates sit far enough apart that ±6% cannot pull a value onto the wrong
 * one (144 and 165 are the closest pair, ~14% apart), and a measurement that
 * matches nothing is reported as-is rather than forced onto a neighbour.
 */
export function snapRefreshHz(raw: number): number | undefined {
  if (!Number.isFinite(raw) || raw <= 0) return undefined;
  return PANEL_HZ.find((hz) => Math.abs(raw - hz) / hz <= 0.06) ?? Math.round(raw);
}

/**
 * Refresh rate implied by a sample of rAF gaps, or undefined when the sample
 * says nothing useful. Gaps outside any plausible refresh period are dropped:
 * a throttled tab or a GC pause would otherwise report a display nobody owns.
 */
export function refreshHzFromGaps(gaps: readonly number[]): number | undefined {
  const median = medianGapMs(gaps.filter((gap) => gap > 1 && gap < 100));
  return median === undefined ? undefined : snapRefreshHz(1000 / median);
}

/**
 * The fastest offered tx fps that still gets `min` refresh cycles per frame on
 * a display running at `hz`. Callers pass the list the dropdown actually
 * offers, so the advice can only ever name a value the user can pick.
 */
export function bestFpsFor(
  hz: number,
  options: readonly number[],
  min = MIN_REFRESH_CYCLES,
): number | undefined {
  return options.filter((fps) => fps * min <= hz).sort((a, b) => b - a)[0];
}
