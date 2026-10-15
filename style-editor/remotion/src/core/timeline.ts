import {EDL, Pt, Segment, Subject, SubjectFrame} from './types';

export type SegF = Segment & {inF: number; outF: number; startF: number; len: number; idx: number};

export const segFrames = (edl: EDL): SegF[] => {
  const fps = edl.fps;
  let acc = 0;
  return edl.segments.map((s, idx) => {
    const inF = Math.round(s.src_in * fps);
    const outF = Math.round(s.src_out * fps);
    const len = Math.max(1, outF - inF);
    const r = {...s, inF, outF, startF: acc, len, idx};
    acc += len;
    return r;
  });
};

export const totalFrames = (edl: EDL): number => {
  const segs = segFrames(edl);
  const last = segs[segs.length - 1];
  return last.startF + last.len + Math.round((edl.outro?.dur ?? 0) * edl.fps);
};

export const segAt = (segs: SegF[], outFrame: number): SegF => {
  for (const s of segs) {
    if (outFrame < s.startF + s.len) return s;
  }
  return segs[segs.length - 1];
};

export const outToSrcFrame = (segs: SegF[], outFrame: number): number => {
  const s = segAt(segs, outFrame);
  return s.inF + Math.min(s.len - 1, Math.max(0, outFrame - s.startF));
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Zoom of a segment at a given output frame (linear push from zoom[0] to zoom[1]).
export const zoomAt = (s: SegF, outFrame: number): number => {
  const p = clamp((outFrame - s.startF) / Math.max(1, s.len - 1), 0, 1);
  return s.zoom[0] + (s.zoom[1] - s.zoom[0]) * p;
};

export const subjAt = (subject: Subject, srcFrame: number): SubjectFrame => {
  const fr = subject.frames;
  return fr[clamp(srcFrame, 0, fr.length - 1)];
};

export const focusOf = (s: SegF, subject: Subject): Pt => {
  if (s.focus) return s.focus;
  const a = subjAt(subject, s.inF);
  return a.head_center;
};

// Map a source-normalized point to output-normalized coordinates under the segment framing.
export type Framing = {z: number; fx: number; fy: number};
export const mapX = (fr: Framing, x: number) => fr.fx + (x - fr.fx) * fr.z;
export const mapY = (fr: Framing, y: number) => fr.fy + (y - fr.fy) * fr.z;
export const mapLen = (fr: Framing, l: number) => l * fr.z;

// Anchors of the subject in OUTPUT coordinates (normalized 0–1) at an output frame.
export type Anchors = {
  face: {x: number; y: number; w: number; h: number};
  headTop: number;
  head: {x: number; y: number};
  eye: number;
  chin: number;
  chest: {x: number; y: number; w: number; h: number};
  torso: {x: number; y: number};
  handL: {x: number; y: number};
  handR: {x: number; y: number};
  empty: 'left' | 'right';
  sbox: {x: number; y: number; w: number; h: number};
  framing: Framing;
};

export const anchorsAt = (segs: SegF[], subject: Subject, outFrame: number): Anchors => {
  const s = segAt(segs, outFrame);
  const src = outToSrcFrame(segs, outFrame);
  const a = subjAt(subject, src);
  const [fx, fy] = focusOf(s, subject);
  const fr = {z: zoomAt(s, outFrame), fx, fy};
  const box = (b: number[]) => ({x: mapX(fr, b[0]), y: mapY(fr, b[1]), w: mapLen(fr, b[2]), h: mapLen(fr, b[3])});
  return {
    face: box(a.face_box),
    headTop: mapY(fr, a.head_top),
    head: {x: mapX(fr, a.head_center[0]), y: mapY(fr, a.head_center[1])},
    eye: mapY(fr, a.eye_line),
    chin: mapY(fr, a.chin),
    chest: box(a.chest_box),
    torso: {x: mapX(fr, a.torso_center[0]), y: mapY(fr, a.torso_center[1])},
    handL: {x: mapX(fr, a.hands.l[0]), y: mapY(fr, a.hands.l[1])},
    handR: {x: mapX(fr, a.hands.r[0]), y: mapY(fr, a.hands.r[1])},
    empty: a.empty_side,
    sbox: box(a.subject_box),
    framing: fr,
  };
};

// Average anchors over an output frame range (stable placement for a whole item).
export const anchorsAvg = (segs: SegF[], subject: Subject, f0: number, f1: number): Anchors => {
  const n = Math.max(1, Math.min(12, f1 - f0));
  const acc: Anchors[] = [];
  for (let k = 0; k < n; k++) acc.push(anchorsAt(segs, subject, Math.round(f0 + ((f1 - f0) * k) / n)));
  const avg = (sel: (x: Anchors) => number) => acc.reduce((p, x) => p + sel(x), 0) / acc.length;
  const b = acc[0];
  return {
    ...b,
    face: {x: avg((x) => x.face.x), y: avg((x) => x.face.y), w: avg((x) => x.face.w), h: avg((x) => x.face.h)},
    headTop: avg((x) => x.headTop),
    head: {x: avg((x) => x.head.x), y: avg((x) => x.head.y)},
    eye: avg((x) => x.eye),
    chin: avg((x) => x.chin),
    chest: {x: avg((x) => x.chest.x), y: avg((x) => x.chest.y), w: avg((x) => x.chest.w), h: avg((x) => x.chest.h)},
    torso: {x: avg((x) => x.torso.x), y: avg((x) => x.torso.y)},
    handL: {x: avg((x) => x.handL.x), y: avg((x) => x.handL.y)},
    handR: {x: avg((x) => x.handR.x), y: avg((x) => x.handR.y)},
    sbox: {x: avg((x) => x.sbox.x), y: avg((x) => x.sbox.y), w: avg((x) => x.sbox.w), h: avg((x) => x.sbox.h)},
  };
};
