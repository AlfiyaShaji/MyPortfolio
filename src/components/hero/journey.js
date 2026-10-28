// Shared definition of the scroll-controlled career journey.
//
// The master GSAP timeline (see useHeroTimeline) tweens a single plain
// `journey` state object. The WebGL scene reads that object every frame, so
// scroll -> timeline -> state -> scene happens without React re-renders.
//
// Time is measured in "stage units": stage N occupies [N-1, N). A short hold
// after stage 4 lets the final composition settle before the hero ends.

export const STAGE_COUNT = 4
export const END_HOLD = 0.45
export const TIMELINE_LENGTH = STAGE_COUNT + END_HOLD

// How much vertical scroll (in viewport heights) one stage unit takes.
// Tuned so each stage has room to breathe without making the hero tedious.
export const SCROLL_PER_UNIT = { desktop: 0.95, tablet: 0.85, mobile: 0.72 }

export function createJourneyState() {
  return {
    // camera rig (world space, before responsive framing is applied)
    camX: 0, camY: 0.3, camZ: 10.8,
    tgtX: 0, tgtY: 0, tgtZ: 0,
    // scene parameters, all 0..1 unless noted
    reveal: 0.3,   // how many floating code fragments are visible
    assemble: 0,   // fragments -> lines of code
    beam: 0,       // electric-blue guide light
    browser: 0,    // browser chrome around the code
    ui: 0,         // code lines -> website layout blocks
    devices: 0,    // responsive tablet / phone outlines
    yaw: 0,        // stack rotation around Y (radians)
    tilt: 0,       // stack rotation around X (radians)
    separate: 0,   // browser splits into frontend / API / backend / database
    stack: 0,      // UI blocks redistribute across the layers
    flow: 0,       // data pulses between layers
    project: 0,    // DeepCampus label
    network: 0,    // neural nodes emerge
    connect: 0,    // neural connections draw in
    glow: 0,       // overall light intensity
    aiMix: 0,      // palette shift from electric blue toward purple
  }
}

// Camera keyframes at the end of each stage. Eased between with sine.inOut.
export const cameraKeys = [
  { at: 0, pos: [0, 0.3, 10.8], target: [0, 0, 0] },
  { at: 1, pos: [0.4, 0.15, 6.6], target: [0, 0, 0] },
  { at: 2, pos: [-1.9, 0.7, 6.9], target: [0.25, 0, 0] },
  { at: 3, pos: [4.8, 4.6, 7.6], target: [0, -1.35, 0] },
  { at: 4, pos: [6.2, 1.9, 12.6], target: [0, 0.75, 0] },
]

// Scene parameter segments: [param, value, start, end, ease?]
export const sceneSegments = [
  ['reveal', 1, 0, 0.6],
  ['assemble', 1, 0.12, 0.95, 'power2.inOut'],
  ['beam', 1, 0.35, 1.0],
  ['beam', 0.25, 1.4, 2.2],
  ['glow', 0.3, 0.3, 1.0],
  ['browser', 1, 1.0, 1.45, 'power2.out'],
  ['ui', 1, 1.2, 1.9, 'power2.inOut'],
  ['devices', 1, 1.35, 1.8],
  ['devices', 0, 2.0, 2.35],
  ['glow', 0.55, 1.3, 2.0],
  ['yaw', -0.32, 1.0, 2.0, 'sine.inOut'],
  ['yaw', 0.55, 2.0, 3.0, 'sine.inOut'],
  ['yaw', 0.8, 3.0, 4.0, 'sine.inOut'],
  ['tilt', -1.22, 2.0, 2.8, 'power2.inOut'],
  ['separate', 1, 2.15, 2.9, 'power2.inOut'],
  ['stack', 1, 2.25, 2.95, 'power2.inOut'],
  ['flow', 1, 2.55, 3.0],
  ['project', 1, 2.5, 2.9],
  ['project', 0, 3.05, 3.45],
  ['glow', 0.75, 2.4, 3.0],
  ['network', 1, 3.0, 3.75, 'power2.out'],
  ['connect', 1, 3.2, 3.95],
  ['aiMix', 1, 3.0, 4.0],
  ['glow', 1, 3.3, 4.0],
]

// Overlay copy timing (stage units). Captions cross-fade around boundaries.
export const captionWindows = [
  { in: [0.45, 0.7], out: [1.02, 1.2] },
  { in: [1.2, 1.42], out: [2.02, 2.2] },
  { in: [2.2, 2.42], out: [3.02, 3.2] },
  { in: [3.2, 3.45], out: null },
]
export const introOut = [0.3, 0.55]

// Scroll position (0..1 of the hero's scroll range) where a stage is fully
// composed. Used by the stage menu and the CTAs.
export function stageAnchor(stageIndex) {
  const t = Math.min(stageIndex + 0.75, TIMELINE_LENGTH)
  return t / TIMELINE_LENGTH
}

export function stageFromTime(t) {
  return Math.max(0, Math.min(STAGE_COUNT - 1, Math.floor(t + 0.08)))
}
