import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../fonts';
import {Anchors, anchorsAt, anchorsAvg, focusOf, SegF, segAt, segFrames, totalFrames, zoomAt} from './timeline';
import {EDL, EditProps, Item, Subject, Transcript} from './types';
import {STYLES} from '../styles/registry';

export type Ctx = {
  edl: EDL;
  segs: SegF[];
  subject: Subject;
  transcript: Transcript;
  fps: number;
  W: number;
  H: number;
  videoSrc: string;
  fgSrc: string | null;
};

export type TP = {
  item: Item;
  frame: number; // absolute output frame
  f0: number; // item start frame
  f1: number; // item end frame
  A: Anchors; // anchors at this frame (output coords, normalized)
  Aavg: Anchors; // anchors averaged over the item
  ctx: Ctx;
};

export const sec2f = (t: number, fps: number) => Math.round(t * fps);

// Framed source layer for the segment playing at `frame` (base video or transparent cut-out).
export const SourceLayer: React.FC<{
  ctx: Ctx;
  frame: number;
  src: string;
  transparent?: boolean;
  muted?: boolean;
  style?: React.CSSProperties;
  offset?: [number, number]; // px offset (for echo outlines)
  extraScale?: number;
}> = ({ctx, frame, src, transparent, muted, style, offset, extraScale}) => {
  const s = segAt(ctx.segs, frame);
  return (
    <Sequence from={s.startF} durationInFrames={s.len} layout="none" name={`seg${s.idx}`}>
      <FramedVideo ctx={ctx} seg={s} frame={frame} src={src} transparent={transparent} muted={muted}
        style={style} offset={offset} extraScale={extraScale} />
    </Sequence>
  );
};

const FramedVideo: React.FC<{
  ctx: Ctx; seg: SegF; frame: number; src: string; transparent?: boolean; muted?: boolean;
  style?: React.CSSProperties; offset?: [number, number]; extraScale?: number;
}> = ({ctx, seg, frame, src, transparent, muted, style, offset, extraScale}) => {
  const [fx, fy] = focusOf(seg, ctx.subject);
  const z = zoomAt(seg, frame) * (extraScale ?? 1);
  const [ox, oy] = offset ?? [0, 0];
  return (
    <AbsoluteFill style={{transform: `translate(${ox}px, ${oy}px) scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%`, ...style}}>
      <OffthreadVideo src={src} trimBefore={seg.inF} transparent={transparent} muted={muted}
        style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

const isActive = (it: Item, frame: number, fps: number, pre = 0, post = 12) =>
  frame >= sec2f(it.from, fps) - pre && frame < sec2f(it.to, fps) + post;

export const Edit: React.FC<EditProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const edl = props.edl!;
  const subject = props.subject!;
  const transcript = props.transcript!;
  const segs = React.useMemo(() => segFrames(edl), [edl]);
  const ctx: Ctx = {
    edl, segs, subject, transcript, fps, W: width, H: height,
    videoSrc: staticFile(`${edl.job}/${edl.video}`),
    fgSrc: edl.fg ? staticFile(`${edl.job}/${edl.fg}`) : null,
  };
  const style = STYLES[edl.style];
  const lastSeg = segs[segs.length - 1];
  const contentEnd = lastSeg.startF + lastSeg.len;
  if (frame >= contentEnd && style.Outro) {
    return <style.Outro frame={frame} start={contentEnd} ctx={ctx} />;
  }
  const A = anchorsAt(segs, subject, Math.min(frame, contentEnd - 1));
  const active = edl.items.filter((it) => isActive(it, frame, fps, it.props?.preF ?? 0, it.props?.postF ?? 12));
  const render = (it: Item) => {
    const C = style.treatments[it.treatment];
    if (!C) return null;
    const f0 = sec2f(it.from, fps);
    const f1 = sec2f(it.to, fps);
    const Aavg = anchorsAvg(segs, subject, f0, Math.min(f1, contentEnd - 1));
    return <C key={it.id} item={it} frame={frame} f0={f0} f1={f1} A={A} Aavg={Aavg} ctx={ctx} />;
  };
  const scenes = active.filter((it) => it.layer === 'scene');
  const behind = active.filter((it) => it.layer === 'behind');
  const front = active.filter((it) => !it.layer || it.layer === 'front');
  const needFg = behind.length > 0 && ctx.fgSrc && scenes.length === 0;
  const wrap = style.wrapperStyle ? style.wrapperStyle(frame, ctx) : {};
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <AbsoluteFill style={wrap}>
        <AbsoluteFill style={style.baseStyle ? style.baseStyle(frame, ctx) : undefined}>
          <SourceLayer ctx={ctx} frame={frame} src={ctx.videoSrc} />
        </AbsoluteFill>
        {style.Grade ? <style.Grade frame={frame} ctx={ctx} /> : null}
        {scenes.map(render)}
        {behind.map(render)}
        {needFg ? <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc!} transparent muted /> : null}
        {front.map(render)}
      </AbsoluteFill>
      {style.Overlay ? <style.Overlay frame={frame} ctx={ctx} /> : null}
    </AbsoluteFill>
  );
};

const cache: Record<string, any> = {};
const getJson = async (url: string) => {
  if (!cache[url]) cache[url] = fetch(url).then((r) => r.json());
  return cache[url];
};

export const calcEditMetadata: CalculateMetadataFunction<EditProps> = async ({props}) => {
  const edl: EDL = await getJson(staticFile(props.edlFile));
  const subject: Subject = await getJson(staticFile(`${edl.job}/subject.json`));
  let transcript: Transcript = {language: 'fa', words: [], sentences: []};
  try {
    transcript = await getJson(staticFile(`${edl.job}/transcript.json`));
  } catch {
    // transcript is optional for rendering (items carry their own tokens)
  }
  return {
    durationInFrames: totalFrames(edl),
    fps: edl.fps,
    props: {...props, edl, subject, transcript},
  };
};
