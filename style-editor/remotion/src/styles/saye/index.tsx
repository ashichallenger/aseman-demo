// Style "saye" — Studio Red Silhouette (see styles/saye/STYLE.md).
// Every treatment is a reusable component driven by the EDL item + subject anchors.
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {Ctx, SourceLayer, TP} from '../../core/Edit';
import {clamp01, disp, eBack, eOut, faDigits, popScale, prog, RTL, tF, WordRow} from '../../core/text';
import {Token} from '../../core/types';

const W = 1080;
const H = 1920;
export const RED = '#B00012';
const RED_HERO = '#C0101C';
const RED_DARK = '#6E000A';
const CAP_FONT = 'Vazirmatn';

// ---------------------------------------------------------------- helpers
export const SvgDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id="fillRed" colorInterpolationFilters="sRGB">
        <feFlood floodColor={RED_HERO} result="c" />
        <feComposite in="c" in2="SourceAlpha" operator="in" />
      </filter>
      <filter id="fillBlack" colorInterpolationFilters="sRGB">
        <feFlood floodColor="#000000" result="c" />
        <feComposite in="c" in2="SourceAlpha" operator="in" />
      </filter>
      <filter id="fillWhite" colorInterpolationFilters="sRGB">
        <feFlood floodColor="#ffffff" result="c" />
        <feComposite in="c" in2="SourceAlpha" operator="in" />
      </filter>
    </defs>
  </svg>
);

const itemOut = (frame: number, f1: number, dur = 5) => clamp01((frame - f1) / dur);

// Word that blurs/fades/rises in on its spoken frame.
const InWord: React.FC<{
  tok: Token; frame: number; fps: number; size: number; weight: number; color?: string; isKey?: boolean;
}> = ({tok, frame, fps, size, weight, color = '#fff', isKey}) => {
  const s = tF(tok, fps);
  const p = eOut(prog(frame, s, 6));
  const base: React.CSSProperties = {
    fontFamily: CAP_FONT, fontWeight: weight, fontSize: size, lineHeight: 1.25, display: 'inline-block',
    opacity: p, filter: `blur(${(1 - p) * 8}px)`, transform: `translateY(${(1 - p) * 9}px)`,
    textShadow: '0 1px 6px rgba(0,0,0,.25)',
  };
  if (!isKey) return <span style={{...base, color}}>{disp(tok.w)}</span>;
  // KEY: enters bold; colour sweeps white -> red right-to-left over 4 f, then 3 % scale bump (6 f)
  const sweep = prog(frame, s + 2, 4);
  const bump = prog(frame, s + 6, 6);
  const sc = 1 + 0.03 * Math.sin(Math.PI * bump);
  return (
    <span style={{...base, position: 'relative', transform: `${base.transform} scale(${sc})`}}>
      <span style={{color: '#fff'}}>{disp(tok.w)}</span>
      <span style={{position: 'absolute', inset: 0, color: RED, clipPath: `inset(0 0 0 ${(1 - sweep) * 100}%)`,
        textShadow: '0 1px 6px rgba(0,0,0,.2)'}}>{disp(tok.w)}</span>
    </span>
  );
};

// ---------------------------------------------------------------- 5.1 / 5.2 WordCaption + KeyWord
// props.lines: number[][] (indices into item.tokens) — each line is a row; props.bigLine: index of CAPTION-BIG line
// props.mode: 'chest' (default, front shots) | 'side' (staggered beside neck) ; props.cursor: show cursor on key
export const WordCaption: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const big: number = item.props?.bigLine ?? -1;
  const mode = item.props?.mode ?? 'chest';
  const capSize = item.props?.size ?? 60;
  const keySize = Math.round(capSize * 1.6);
  const out = itemOut(frame, f1);
  // placement relative to subject (normalized -> px)
  const A = Aavg;
  const handsX = (A.handL.x + A.handR.x) / 2;
  const toward = handsX > A.torso.x ? 1 : -1;
  let cx = (A.torso.x + toward * 0.04) * W;
  let top = Math.max(A.chin + 0.06, A.chest.y + A.chest.h * 0.32) * H;
  if (item.props?.y != null) top = item.props.y * H;
  if (item.props?.x != null) cx = item.props.x * W;
  const rows = lines.map((ln, li) => {
    const isBig = li === big;
    const shift = mode === 'side' ? (li % 2 === 0 ? 1 : -1) * 0.05 * W : 0;
    return (
      <WordRow key={li} style={{transform: `translateX(${shift}px)`}}>
        {ln.map((ti) => {
          const tok = toks[ti];
          const isKey = !!tok.key;
          return (
            <InWord key={ti} tok={tok} frame={frame} fps={ctx.fps} isKey={isKey}
              size={isKey ? keySize : isBig ? Math.round(capSize * 1.5) : capSize}
              weight={isKey ? 900 : isBig ? 600 : 500} />
          );
        })}
      </WordRow>
    );
  });
  const keyTok = toks.find((t) => t.key);
  return (
    <AbsoluteFill style={{opacity: 1 - out, filter: `blur(${out * 10}px)`}}>
      <div style={{position: 'absolute', left: cx - W / 2, width: W, top, display: 'flex', flexDirection: 'column',
        alignItems: 'center', rowGap: 4}}>
        {rows}
      </div>
      {item.props?.cursor && keyTok ? <CursorIcon frame={frame} at={tF(keyTok, ctx.fps)} x={cx + 0.22 * W * -toward}
        y={top + keySize * 0.9} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.10 Cursor
const CursorIcon: React.FC<{frame: number; at: number; x: number; y: number}> = ({frame, at, x, y}) => {
  const pIn = eOut(prog(frame, at - 6, 6));
  const click = prog(frame, at, 6);
  const sc = 1 - 0.18 * Math.sin(Math.PI * click);
  return (
    <svg width={64} height={64} viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y + (1 - pIn) * 40,
      opacity: pIn, transform: `scale(${sc}) rotate(-8deg)`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.35))'}}>
      <path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.6 L11 13.8 L18 13.8 Z" fill="#fff" stroke="#222" strokeWidth={0.6} />
    </svg>
  );
};
export const Cursor: React.FC<TP> = ({item, frame, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const k = toks.find((t) => t.key) ?? toks[0];
  return <AbsoluteFill><CursorIcon frame={frame} at={tF(k, ctx.fps)} x={(item.props?.x ?? Aavg.torso.x + 0.18) * W}
    y={(item.props?.y ?? Aavg.chest.y + 0.05) * H} /></AbsoluteFill>;
};

// ---------------------------------------------------------------- 5.3 Hero3DBehind (layer: behind)
// props.text (hero word, e.g. "GTA VI"), props.label (small red Persian line above)
const extrude = (depth: number, color: string) => {
  const s: string[] = [];
  for (let i = 1; i <= depth; i++) s.push(`${i * 0.55}px ${i}px 0 ${color}`);
  s.push(`${depth * 0.55 + 4}px ${depth + 8}px 18px rgba(0,0,0,.35)`);
  return s.join(',');
};
// Hero geometry shared by the behind-layer word and its front-layer label: the word must be clearly wider
// than the head (≥ 2.1 × face width) so the head only occludes its middle, never the whole word.
const heroGeom = (A: TP['Aavg'], text: string, props: Record<string, any> | undefined) => {
  const latin = /^[\x00-\x7F]+$/.test(text);
  const fam = latin ? 'Montserrat' : 'Estedad';
  const want = Math.min(0.94 * W, Math.max((text.length <= 4 ? 2.7 : 2.2) * A.face.w * W, 0.62 * W));
  let size = props?.size ?? 220;
  try {
    size = Math.min(props?.maxSize ?? 320, fitText({text: latin ? text : faDigits(text), withinWidth: want, fontFamily: fam, fontWeight: '900'}).fontSize);
  } catch {
    // keep default
  }
  const headH = A.chin - A.headTop;
  const cy = (A.headTop + headH * (props?.yFrac ?? 0.25)) * H;
  const cx = Math.min(Math.max(A.head.x * W, want / 2 + 20), W - want / 2 - 20);
  return {latin, fam, size, cx, cy, width: want};
};

export const Hero3DBehind: React.FC<TP> = ({item, frame, f0, f1, Aavg}) => {
  const text: string = item.props?.text ?? 'GTA';
  const g = heroGeom(Aavg, text, item.props);
  const out = itemOut(frame, f1, 5);
  const depthP = eOut(prog(frame, f0 + 2, 6));
  const letters = g.latin ? text.split('') : [text];
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', left: g.cx - W, width: 2 * W, top: g.cy - g.size * 0.55, display: 'flex',
        justifyContent: 'center', ...(g.latin ? {} : RTL)}}>
        {letters.map((ch, i) => {
          const p = eBack(prog(frame, f0 + i * 2, 7));
          return (
            <span key={i} style={{display: 'inline-block', fontFamily: g.fam, fontWeight: 900,
              fontSize: g.size, lineHeight: 1, color: RED_HERO, whiteSpace: 'pre', letterSpacing: g.latin ? '-0.01em' : 0,
              transform: `translateY(${(1 - p) * 40}%)`, opacity: clamp01(p * 2),
              textShadow: extrude(Math.round(11 * depthP), RED_DARK)}}>{g.latin ? ch : faDigits(ch)}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// HERO-LABEL (front layer): small red Persian line right-aligned above the hero word, never hidden by the head.
export const HeroLabel: React.FC<TP> = ({item, frame, f0, f1, Aavg}) => {
  const text: string = item.props?.text ?? '';
  const label: string = item.props?.label ?? '';
  const g = heroGeom(Aavg, text, item.props);
  const ls = Math.round(Math.min(78, g.size * 0.36));
  const out = itemOut(frame, f1, 5);
  const p = eOut(prog(frame, f0, 6));
  const right = Math.max(24, W - (g.cx + g.width / 2));
  return (
    <AbsoluteFill style={{opacity: (1 - out) * p}}>
      <div style={{position: 'absolute', right, top: g.cy - g.size * 0.55 - ls * 1.35, ...RTL, fontFamily: CAP_FONT,
        fontWeight: 900, fontSize: ls, color: RED, whiteSpace: 'nowrap', transform: `translateY(${(1 - p) * 12}px)`,
        textShadow: '0 2px 6px rgba(0,0,0,.25)'}}>{faDigits(label)}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.4 RedEcho (layer: behind)
export const RedEcho: React.FC<TP> = ({frame, f0, f1, ctx, item, Aavg}) => {
  if (!ctx.fgSrc) return null;
  const p = eOut(prog(frame, f0, 8));
  const out = itemOut(frame, f1, 6);
  const [dx, dy] = item.props?.offset ?? [-30, -8];
  // the matte is cut by the desk: never let the echo show along the desk edge
  const fr = Aavg.framing;
  const deskOut = (fr.fy + ((item.props?.deskY ?? 0.646) - 0.012 - fr.fy) * fr.z) * H;
  return (
    <AbsoluteFill style={{opacity: 1 - out, clipPath: `inset(0 0 ${H - deskOut}px 0)`}}>
      <SvgDefs />
      <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted offset={[dx * p, dy * p]}
        style={{filter: 'url(#fillRed)'}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.5 RedCircle (layer: behind) + ArcCaption
export const RedCircle: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const A = Aavg;
  const d = (item.props?.diam ?? 0.75) * W;
  const cx = A.head.x * W;
  const cy = (A.head.y + 0.08) * H;
  const p = eBack(prog(frame, f0, 10));
  const out = itemOut(frame, f1, 6);
  const ring = (k: number, o: number) => (
    <div style={{position: 'absolute', left: cx - (d * k) / 2, top: cy - (d * k) / 2, width: d * k, height: d * k,
      borderRadius: '50%', border: '3px solid rgba(255,120,130,.55)', filter: 'blur(2px)', opacity: o * p,
      transform: `scale(${p})`}} />
  );
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      {ring(1.12, 0.6)}
      {ring(1.22, 0.3)}
      <div style={{position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: '50%',
        background: `radial-gradient(circle at 50% 45%, #C80E1E 0%, ${RED} 62%, #8E000C 100%)`,
        boxShadow: '0 0 60px rgba(176,0,18,.45)', transform: `scale(${p})`}} />
    </AbsoluteFill>
  );
};

// Caption on an arc along the lower edge of the red circle (front layer). Whole words placed along the arc.
export const ArcCaption: React.FC<TP> = ({item, frame, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const A = Aavg;
  const d = (item.props?.diam ?? 0.75) * W;
  const size = item.props?.size ?? 66;
  const r = d / 2 + size * 0.55;
  const cx = A.head.x * W;
  const cy = (A.head.y + 0.08) * H;
  const out = itemOut(frame, f1, 5);
  // RTL along the lower-left edge: first word near the bottom (≈ 95°), following words go clockwise to the left
  const widths = toks.map((t) => Math.max(2, disp(t.w).length) * size * 0.5 + size * 0.35);
  const total = widths.reduce((p, v) => p + v, 0);
  const a0 = item.props?.a0 ?? 92;
  const span = (total / r) * (180 / Math.PI);
  let acc = 0;
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      {toks.map((tok, i) => {
        const mid = acc + widths[i] / 2;
        acc += widths[i];
        const ang = ((a0 + (mid / total) * span) * Math.PI) / 180;
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        const rot = (ang * 180) / Math.PI - 90;
        const p = eOut(prog(frame, tF(tok, ctx.fps), 6));
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`,
            fontFamily: CAP_FONT, fontWeight: tok.key ? 900 : 600, fontSize: tok.key ? size * 1.15 : size,
            color: '#fff', whiteSpace: 'nowrap', opacity: p, filter: `blur(${(1 - p) * 8}px)`,
            textShadow: '0 1px 8px rgba(0,0,0,.35)'}}>{disp(tok.w)}</div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.6 SilhouetteScene (layer: scene)
// props.deskY: source-normalized y of the desk edge (everything below is filled black with the silhouette)
export const SilhouetteScene: React.FC<TP> = ({item, frame, f0, f1, ctx, Aavg}) => {
  const p = eOut(prog(frame, f0, 12));
  const deskY = item.props?.deskY ?? 0.646;
  const fr = Aavg.framing;
  const deskOut = (fr.fy + (deskY - fr.fy) * fr.z) * H;
  const sw = prog(frame, f0 + 2, 12);
  return (
    <AbsoluteFill>
      <SvgDefs />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 55% 45%, #D0101E 0%, #B00814 45%, #7A0008 100%)'}} />
      {/* white swoosh ribbon sweeping behind the silhouette */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d={`M ${-200 + (1 - sw) * -900} ${H * 0.62} Q ${W * 0.5} ${H * 0.43} ${W + 200} ${H * 0.47}`}
          stroke="#f4f4f4" strokeWidth={70} fill="none" strokeLinecap="round" opacity={0.95}
          strokeDasharray={2600} strokeDashoffset={2600 * (1 - eOut(sw))} />
        <path d={`M ${-200} ${H * 0.65} Q ${W * 0.5} ${H * 0.465} ${W + 200} ${H * 0.5}`}
          stroke="#bdbdbd" strokeWidth={14} fill="none" opacity={0.7 * sw}
          strokeDasharray={2600} strokeDashoffset={2600 * (1 - eOut(sw))} />
      </svg>
      {ctx.fgSrc ? <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted style={{filter: 'url(#fillBlack)'}} /> : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: deskOut, bottom: 0, background: '#000'}} />
      <AbsoluteFill style={{opacity: p}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.7 QuestionCloud
// props.bubbles: number[][] token groups, one bubble per group; question marks pop around the head.
const QMark: React.FC<{x: number; y: number; size: number; rot: number; p: number; red?: boolean}> = ({x, y, size, rot, p, red}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${popScale(p)})`,
    fontFamily: 'Estedad', fontWeight: 900, fontSize: size, lineHeight: 1, color: red ? RED : '#fafafa',
    textShadow: red ? `2px 5px 0 ${RED_DARK}, 0 10px 18px rgba(0,0,0,.35)` : '2px 5px 0 #c9c9c9, 0 10px 18px rgba(0,0,0,.35)'}}>؟</div>
);
export const QuestionCloud: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const A = Aavg;
  const toks = item.tokens ?? [];
  const groups: number[][] = item.props?.bubbles ?? [toks.map((_, i) => i)];
  const out = itemOut(frame, f1, 6);
  const hx = A.head.x * W;
  const hy = A.head.y * H;
  const fw = A.face.w * W;
  const marks = [
    {dx: -1.35, dy: -0.2, s: 360, r: -12, d: 0},
    {dx: 1.25, dy: -0.05, s: 210, r: 14, d: 4},
    {dx: -0.05, dy: -1.35, s: 150, r: 6, d: 8},
    {dx: 1.15, dy: 0.85, s: 150, r: -8, d: 12, red: true},
  ];
  const by0 = (A.chest.y + A.chest.h * 0.25) * H;
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      {marks.map((m, i) => (
        <QMark key={i} x={hx + m.dx * fw} y={hy + m.dy * fw} size={m.s} rot={m.r} p={prog(frame, f0 + m.d, 7)}
          red={m.red && frame >= f0 + m.d + 14} />
      ))}
      {groups.map((g, gi) => {
        const first = toks[g[0]];
        const p = eOut(prog(frame, tF(first, ctx.fps), 7));
        return (
          <div key={gi} style={{position: 'absolute', right: W * 0.08, top: by0 + gi * 0.072 * H, display: 'flex',
            flexDirection: 'row', ...RTL, alignItems: 'center', columnGap: 16, opacity: p,
            transform: `translateY(${(1 - p) * 30}px)`}}>
            <div style={{width: 62, height: 62, borderRadius: '50%', background: '#111', display: 'flex',
              alignItems: 'center', justifyContent: 'center'}}>
              <div style={{width: 22, height: 22, borderRadius: '50%', background: '#fff', marginTop: -8}} />
            </div>
            <div style={{background: 'rgba(255,255,255,.72)', borderRadius: 40, padding: '10px 34px',
              fontFamily: CAP_FONT, fontWeight: 500, fontSize: 46, color: '#222', backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 14px rgba(0,0,0,.18)', whiteSpace: 'nowrap'}}>
              {g.map((ti) => <span key={ti} style={{opacity: frame >= tF(toks[ti], ctx.fps) ? 1 : 0}}>{disp(toks[ti].w, true)} </span>)}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.8 Stepper
// props.title (string), props.steps: string[] labels, props.stepTimes: output seconds when each step becomes active
export const Stepper: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const steps: string[] = item.props?.steps ?? [];
  const times: number[] = item.props?.stepTimes ?? [];
  const title: string = item.props?.title ?? '';
  const out = itemOut(frame, f1, 6);
  const pIn = eOut(prog(frame, f0, 10));
  const pw = 0.66 * W;
  const ph = 0.085 * H;
  const top = (item.props?.y ?? Aavg.chest.y + Aavg.chest.h * 0.45) * H;
  const left = (W - pw) / 2;
  let active = 0;
  times.forEach((t, i) => { if (frame >= Math.round(t * ctx.fps)) active = i; });
  const lastT = Math.round((times[active] ?? item.from) * ctx.fps);
  const slide = eOut(prog(frame, lastT, 8));
  const n = Math.max(steps.length, 2);
  const xs = steps.map((_, i) => pw * 0.12 + ((pw * 0.76) * (n - 1 - i)) / (n - 1)); // RTL: first step on the right
  const prevX = xs[Math.max(0, active - 1)] ?? xs[0];
  const curX = active === 0 ? xs[0] : prevX + (xs[active] - prevX) * slide;
  return (
    <AbsoluteFill style={{opacity: (1 - out) * pIn, transform: `translateY(${(1 - pIn) * 120}px)`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: top - 0.05 * H, textAlign: 'center', ...RTL,
        fontFamily: CAP_FONT, fontWeight: 600, fontSize: 52, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.35)'}}>
        {faDigits(title)}
      </div>
      <div style={{position: 'absolute', left, top, width: pw, height: ph, borderRadius: 0.03 * W,
        background: 'rgba(255,255,255,.42)', backdropFilter: 'blur(14px)', boxShadow: '0 8px 24px rgba(0,0,0,.25)'}}>
        <div style={{position: 'absolute', left: Math.min(...xs), width: Math.max(...xs) - Math.min(...xs), top: ph * 0.4,
          height: 4, background: 'rgba(30,30,30,.65)'}} />
        <div style={{position: 'absolute', left: curX, width: Math.max(...xs) - curX, top: ph * 0.4, height: 4, background: '#fff'}} />
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: xs[i] - 13, top: ph * 0.4 - 11, width: 26, height: 26, borderRadius: '50%',
              background: i <= active ? '#fff' : '#1a1a1a', boxShadow: i === active ? '0 0 12px rgba(255,255,255,.9)' : 'none'}} />
            <div style={{position: 'absolute', left: xs[i] - 110, width: 220, top: ph * 0.58, textAlign: 'center', ...RTL,
              fontFamily: CAP_FONT, fontWeight: i === active ? 700 : 500, fontSize: 36, color: i <= active ? '#111' : '#333'}}>
              {faDigits(s)}</div>
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.9 PaperNotes
// props.notes: string[]; props.noteTimes: output seconds each note enters (previous one exits)
export const PaperNotes: React.FC<TP> = ({item, frame, f1, Aavg, ctx}) => {
  const notes: string[] = item.props?.notes ?? [];
  const times: number[] = item.props?.noteTimes ?? [];
  const out = itemOut(frame, f1, 6);
  const cx = Aavg.torso.x * W;
  const cy = Math.max((Aavg.chest.y + Aavg.chest.h * 0.45) * H, (Aavg.chin + 0.02) * H + 0.13 * H);
  return (
    <AbsoluteFill style={{opacity: 1 - out, perspective: 1400}}>
      {notes.map((n, i) => {
        const s = Math.round((times[i] ?? item.from) * ctx.fps);
        const e = i + 1 < notes.length ? Math.round(times[i + 1] * ctx.fps) : 1e9;
        if (frame < s - 1 || frame > e + 10) return null;
        const pin = eOut(prog(frame, s, 10));
        const pout = eOut(prog(frame, e, 10));
        const fromRight = i % 2 === 0;
        const x = cx + (fromRight ? 1 : -1) * ((1 - pin) * 0.7 * W) + (fromRight ? -1 : 1) * pout * 0.8 * W;
        const ry = (fromRight ? 1 : -1) * (60 * (1 - pin) + 50 * pout);
        const rot = fromRight ? -6 : 5;
        return (
          <div key={i} style={{position: 'absolute', left: x - 0.17 * W, top: cy - 0.14 * H, width: 0.34 * W, height: 0.26 * H,
            transform: `rotateY(${ry}deg) rotate(${rot}deg)`, transformStyle: 'preserve-3d',
            background: 'linear-gradient(160deg, #f4ead2 0%, #e9dcbc 55%, #d9c79d 100%)',
            clipPath: 'polygon(2% 3%, 18% 0%, 35% 2%, 52% 0%, 70% 3%, 86% 0%, 99% 2%, 97% 22%, 100% 45%, 97% 70%, 99% 97%, 80% 100%, 60% 97%, 42% 100%, 22% 97%, 4% 100%, 1% 78%, 3% 55%, 0% 30%)',
            boxShadow: '0 10px 30px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{position: 'absolute', inset: 0, background:
              'repeating-linear-gradient(0deg, rgba(120,90,50,.08) 0 2px, transparent 2px 46px), radial-gradient(circle at 20% 15%, rgba(140,90,40,.25), transparent 35%)'}} />
            <div style={{...RTL, fontFamily: 'Lalezar', fontSize: 120, color: '#5A2A16', mixBlendMode: 'multiply',
              transform: 'rotate(-90deg)', whiteSpace: 'nowrap'}}>{faDigits(n)}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- transitions / grade
// 5.11 BlurTransition: blur 0→24 px over 5 f before the cut, 30→0 over 8 f after.
export const blurAt = (frame: number, ctx: Ctx) => {
  let b = 0;
  for (const tr of ctx.edl.transitions) {
    if (tr.type !== 'BlurTransition') continue;
    const at = Math.round(tr.at * ctx.fps);
    if (frame >= at - 5 && frame < at) b = Math.max(b, interpolate(frame, [at - 5, at - 1], [0, 24]));
    if (frame >= at && frame < at + 8) b = Math.max(b, interpolate(frame, [at, at + 7], [30, 0]));
  }
  return b;
};

export const sayeStyle = {
  treatments: {WordCaption, KeyWord: WordCaption, Hero3DBehind, HeroLabel, RedEcho, RedCircle, ArcCaption, SilhouetteScene,
    QuestionCloud, Stepper, PaperNotes, Cursor},
  wrapperStyle: (frame: number, ctx: Ctx): React.CSSProperties => {
    const b = blurAt(frame, ctx);
    return b > 0.05 ? {filter: `blur(${b}px)`} : {};
  },
};
