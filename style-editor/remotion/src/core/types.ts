// Data contracts (see CLAUDE.md "Data contracts").

export type Word = {i: number; w: string; start: number; end: number; stress: number; sent: number};
export type Sentence = {id: number; text: string; start: number; end: number; kind: string};
export type Transcript = {language: string; words: Word[]; sentences: Sentence[]};

export type Box = [number, number, number, number]; // x, y, w, h normalized
export type Pt = [number, number];
export type SubjectFrame = {
  f: number;
  face_box: Box;
  head_top: number;
  head_center: Pt;
  eye_line: number;
  chin: number;
  chest_box: Box;
  torso_center: Pt;
  hands: {l: Pt; r: Pt};
  empty_side: 'left' | 'right';
  subject_box: Box;
};
export type Subject = {fps: number; w: number; h: number; frames: SubjectFrame[]};

export type Segment = {
  src_in: number; // seconds, source
  src_out: number;
  framing: string; // wide | medium | close | ...
  zoom: [number, number]; // scale at segment start/end
  focus?: Pt; // transform origin in source-normalized coords (defaults to face center)
  grade?: string; // optional per-segment CSS filter
};

// A token = one spoken word placed on the OUTPUT timeline.
export type Token = {i: number; w: string; t: number; e: number; stress: number; key?: boolean};

export type Item = {
  id: string;
  treatment: string;
  from: number; // output seconds
  to: number;
  words?: number[];
  key?: number;
  anchor?: string;
  side?: 'left' | 'right' | 'center';
  layer?: 'behind' | 'front' | 'scene';
  props?: Record<string, any>;
  tokens?: Token[];
};

export type Transition = {at: number; type: string; dur?: number};

export type EDL = {
  style: string;
  fps: number;
  job: string; // e.g. jobs/20261015-gta6
  video: string; // file inside job, e.g. src30.mp4
  fg?: string; // transparent subject cut-out, e.g. fg.webm
  segments: Segment[];
  items: Item[];
  transitions: Transition[];
  map?: {src_in: number; src_out: number; out_in: number}[];
  outro?: {dur: number};
};

export type EditProps = {
  edlFile: string; // path under public, e.g. jobs/20261015-gta6/edl_saye.json
  edl?: EDL;
  subject?: Subject;
  transcript?: Transcript;
};
