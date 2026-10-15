// Style "zarbe" — Red Punch talking head (see styles/zarbe/STYLE.md).
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {Ctx, SourceLayer, TP} from '../../core/Edit';
import {clamp01, disp, eBack, eOut, faDigits, popScale, prog, RTL, tF, WordRow} from '../../core/text';
import {SvgDefs} from '../saye';

const W = 1080;
const H = 1920;
const RED_TOP = '#C8102E';
const RED_BOT = '#8E0A1C';
const RED_EXT = '#5A0611';
const STICK_RED = '#B0101F';

const isLatin = (s: string) => /^[\x00-\x7F]+$/.test(s);
const heroFont = (s: string) => (isLatin(s) ? 'Anton' : 'Lalezar');
const out = (frame: number, f1: number, dur = 3) => clamp01((frame - f1) / dur);

// Measured width-fit for a single line (fonts are already loaded by fonts.ts before render).
const fit = (text: string, family: string, weight: number | string, maxW: number, maxSize: number) => {
  try {
    const {fontSize} = fitText({text, withinWidth: maxW, fontFamily: family, fontWeight: String(weight)});
    return Math.min(maxSize, fontSize);
  } catch {
    return maxSize;
  }
};

const extrusion = (depth: number, color: string, dx = 0.6) => {
  const s: string[] = [];
  for (let i = 1; i <= depth; i++) s.push(`${i * dx}px ${i}px 0 ${color}`);
  s.push(`${depth * dx + 6}px ${depth + 10}px 22px rgba(0,0,0,.45)`);
  return s.join(',');
};

// HERO type: back layer = extrusion, front layer = vertical red gradient fill (or white).
export const HeroType: React.FC<{text: string; size: number; stretch?: number; depth?: number; white?: boolean;
  skew?: number; style?: React.CSSProperties; family?: string}> = ({text, size, stretch = 1.5, depth = 8, white, skew = 0, style, family}) => {
  const fam = family ?? heroFont(text);
  const common: React.CSSProperties = {fontFamily: fam, fontWeight: fam === 'Estedad' ? 900 : 400, fontSize: size,
    lineHeight: 1, whiteSpace: 'nowrap', ...(isLatin(text) ? {} : RTL)};
  const shown = isLatin(text) ? text.toUpperCase() : faDigits(text);
  return (
    <div style={{position: 'relative', display: 'inline-block', transform: `scaleY(${stretch}) skewX(${skew}deg)`, ...style}}>
      <div style={{...common, color: white ? '#B8001A' : RED_EXT, textShadow: extrusion(depth, white ? '#7a0010' : RED_EXT)}}>{shown}</div>
      <div style={{...common, position: 'absolute', inset: 0,
        backgroundImage: white ? 'linear-gradient(180deg,#ffffff 0%,#f1e9e9 60%,#d9caca 100%)'
          : `linear-gradient(180deg, ${RED_TOP} 0%, #B30D27 55%, ${RED_BOT} 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        filter: 'drop-shadow(0 -1px 0 rgba(255,255,255,.35))'}}>{shown}</div>
    </div>
  );
};

// ---------------------------------------------------------------- 5.1 HeroBehind (layer: behind)
// props.text, props.stretch, props.white, props.y ('eye-chin' default | 'above')
export const HeroBehind: React.FC<TP> = ({item, frame, f0, f1, Aavg}) => {
  const text: string = item.props?.text ?? '';
  const stretch = item.props?.stretch ?? 1.55;
  const A = Aavg;
  const maxW = (item.props?.maxW ?? 0.92) * W;
  const size = fit(isLatin(text) ? text.toUpperCase() : faDigits(text), heroFont(text), 400, maxW, item.props?.maxSize ?? 330);
  const glyphH = size * 0.75 * stretch; // approx visual height
  let baseY = ((A.eye + A.chin) / 2) * H; // baseline between eyes and chin
  if (item.props?.y === 'above') baseY = A.headTop * H + glyphH * 0.55;
  if (item.props?.yAbs != null) baseY = item.props.yAbs * H;
  const p = prog(frame, f0, 4);
  const sc = interpolate(eOut(p), [0, 1], [1.18, 1]);
  const mb = (1 - prog(frame, f0, 3)) * 6;
  const o = out(frame, f1, 3);
  return (
    <AbsoluteFill style={{opacity: (1 - o) * (frame >= f0 ? 1 : 0), filter: `blur(${mb + o * 8}px)`}}>
      <div style={{position: 'absolute', left: A.head.x * W - W, width: 2 * W, top: baseY - glyphH * 0.95,
        display: 'flex', justifyContent: 'center', transform: `scale(${sc})`, transformOrigin: '50% 60%'}}>
        <HeroType text={text} size={size} stretch={stretch} white={item.props?.white} depth={9} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.2 Stack (front)
// props.rows: [{kind:'script'|'hero'|'sans', idx:number[] (token indices) | text, align:'left'|'right'|'center'}]
export const Stack: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const rows: any[] = item.props?.rows ?? [];
  const A = Aavg;
  const cx = (A.chest.x + A.chest.w / 2) * W;
  const top = (item.props?.y ?? Math.max(A.chin + 0.03, A.chest.y)) * H;
  const drift = interpolate(frame, [f0, f1 + 3], [0, -0.02 * H], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const o = out(frame, f1, 3);
  const bw = 0.84 * W;
  return (
    <AbsoluteFill style={{opacity: 1 - o, filter: `blur(${o * 8}px)`}}>
      <div style={{position: 'absolute', left: cx - bw / 2, width: bw, top: top + drift, display: 'flex', flexDirection: 'column'}}>
        {rows.map((r, ri) => {
          const rt: any[] = r.idx ? r.idx.map((i: number) => toks[i]) : [];
          const text = r.text ?? rt.map((t) => disp(t.w)).join(' ');
          const start = rt.length ? tF(rt[0], ctx.fps) : f0 + (r.delay ?? 0);
          const just = r.align === 'left' ? 'flex-end' : r.align === 'right' ? 'flex-start' : 'center'; // RTL flex
          if (r.kind === 'hero') {
            const size = fit(isLatin(text) ? text.toUpperCase() : text, heroFont(text), 400, bw * 0.98, r.maxSize ?? 260);
            const p = prog(frame, start, 4);
            return (
              <div key={ri} style={{display: 'flex', justifyContent: 'center', height: size * 0.95 * (r.stretch ?? 1.3),
                alignItems: 'center', opacity: frame >= start ? 1 : 0, transform: `scale(${interpolate(eOut(p), [0, 1], [1.18, 1])})`,
                filter: `blur(${(1 - prog(frame, start, 3)) * 6}px)`, marginTop: r.mt ?? -10, marginBottom: r.mb ?? -10}}>
                <HeroType text={text} size={size} stretch={r.stretch ?? 1.3} depth={7} />
              </div>
            );
          }
          if (r.kind === 'script') {
            const p = prog(frame, start, 8);
            const latin = isLatin(text);
            return (
              <div key={ri} style={{display: 'flex', justifyContent: just, ...RTL, zIndex: 3, marginTop: r.mt ?? -24, marginBottom: r.mb ?? -24}}>
                <div style={{fontFamily: latin ? 'GreatVibes' : 'NotoNastaliqUrdu', fontSize: latin ? 110 : (r.size ?? 92), color: '#fff',
                  lineHeight: latin ? 1.1 : 2.0, whiteSpace: 'nowrap', textShadow: '0 0 10px rgba(255,255,255,.35), 0 2px 8px rgba(0,0,0,.5)',
                  clipPath: `inset(-40% ${latin ? (1 - p) * 100 : 0}% -40% ${latin ? 0 : (1 - p) * 100}%)`}}>{text}</div>
              </div>
            );
          }
          // sans
          return (
            <WordRow key={ri} align={just} style={{zIndex: 3, marginTop: r.mt ?? -18, marginBottom: r.mb ?? -18}}>
              {rt.length ? rt.map((t, k) => {
                const pp = eOut(prog(frame, tF(t, ctx.fps), 5));
                return <span key={k} style={{fontFamily: 'Vazirmatn', fontWeight: 700, fontSize: r.size ?? 64, color: '#fff',
                  opacity: pp, transform: `translateY(${(1 - pp) * 10}px)`, display: 'inline-block',
                  textShadow: '0 2px 8px rgba(0,0,0,.55), 0 0 14px rgba(255,255,255,.25)'}}>{disp(t.w)}</span>;
              }) : <span style={{fontFamily: 'Vazirmatn', fontWeight: 700, fontSize: r.size ?? 64, color: '#fff'}}>{text}</span>}
            </WordRow>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.3 PairWide (front)
// tokens: [sans..., hero]; props.hero = token index of the hero word; props.swaps: [{i, t}] hero swaps (list)
export const PairWide: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const hi: number = item.props?.hero ?? toks.length - 1;
  const swaps: {i: number}[] = item.props?.swaps ?? [];
  let heroTok = toks[hi];
  let swapStart = tF(heroTok, ctx.fps);
  for (const s of swaps) if (frame >= tF(toks[s.i], ctx.fps)) { heroTok = toks[s.i]; swapStart = tF(toks[s.i], ctx.fps); }
  const sans = toks.filter((_, i) => i !== hi && !swaps.some((s) => s.i === i));
  const A = Aavg;
  const handsY = Math.min(A.handL.y, A.handR.y);
  const y = (item.props?.y ?? Math.min(A.chest.y + A.chest.h * 0.25, handsY - 0.08)) * H;
  const cx = (A.chest.x + A.chest.w / 2) * W;
  const heroText = disp(heroTok.w);
  const size = fit(heroText, 'Estedad', 900, 0.8 * W, 190);
  const hs = tF(toks[hi], ctx.fps);
  const slide = eOut(prog(frame, hs, 5));
  const ext = prog(frame, hs + 2, 3);
  const pop = swapStart !== hs ? interpolate(prog(frame, swapStart, 3), [0, 1], [1.15, 1]) : 1;
  const o = out(frame, f1, 3);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <div style={{position: 'absolute', left: cx - 0.45 * W, width: 0.9 * W, top: y, display: 'flex', flexDirection: 'column'}}>
        <WordRow align="flex-end" style={{marginBottom: -size * 0.12, paddingLeft: 30}}>
          {sans.map((t, k) => {
            const p = prog(frame, tF(t, ctx.fps), 4);
            return <span key={k} style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: 64, color: '#fff', opacity: p,
              textShadow: '0 2px 8px rgba(0,0,0,.5)'}}>{disp(t.w)}</span>;
          })}
        </WordRow>
        <div style={{display: 'flex', justifyContent: 'center', opacity: frame >= hs ? 1 : 0,
          transform: `translateX(${(1 - slide) * -0.12 * W}px) scale(${pop})`}}>
          <HeroType text={heroText} size={size} stretch={1.0} skew={-10} family="Estedad" depth={Math.round(6 * ext)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- SansLine (front): the SANS role on its own —
// the words around a hero, white Vazirmatn on the chest, word by word (keeps "clean face" ≤ 1.5 s).
export const SansLine: React.FC<TP> = ({item, frame, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const A = Aavg;
  const o = out(frame, f1, 3);
  const handsY = Math.min(A.handL.y, A.handR.y);
  const y = (item.props?.y ?? Math.max(A.chin + 0.05, Math.min(A.chest.y + A.chest.h * 0.3, handsY - 0.06))) * H;
  return (
    <AbsoluteFill style={{opacity: 1 - o, filter: `blur(${o * 6}px)`}}>
      <WordRow style={{position: 'absolute', left: 0.06 * W, right: 0.06 * W, top: y}} gap={0.26}>
        {toks.map((t, k) => {
          const p = eOut(prog(frame, tF(t, ctx.fps), 5));
          return <span key={k} style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: item.props?.size ?? 66, color: '#fff',
            opacity: p, transform: `translateY(${(1 - p) * 10}px)`, display: 'inline-block',
            textShadow: '0 2px 8px rgba(0,0,0,.55), 0 0 14px rgba(255,255,255,.2)'}}>{disp(t.w)}</span>;
        })}
      </WordRow>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.4 ArcText (front)
// Whole words on a circle concentric with the head; rotates ~10°/s; accent token red.
export const ArcText: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const A = Aavg;
  // circle concentric with the head/upper body; the phrase is centred over the top of the subject
  const r = (item.props?.radiusW ?? 0.4) * W;
  const cx = A.head.x * W;
  const cy = (A.head.y + 0.11) * H;
  const rot = ((frame - f0) / ctx.fps) * (item.props?.speed ?? 10);
  const span = item.props?.span ?? 200; // degrees covered by the phrase
  const start = -90 - span / 2 - ((f1 - f0) / ctx.fps) * (item.props?.speed ?? 10) * 0.5;
  const o = out(frame, f1, 4);
  const n = toks.length;
  return (
    <AbsoluteFill style={{opacity: 1 - o, filter: `blur(${o * 10}px)`}}>
      {toks.map((t, i) => {
        // RTL: first word on the right side of the arc
        const ang = ((start + span - (span * (i + 0.5)) / n + rot) * Math.PI) / 180;
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        const p = eOut(prog(frame, tF(t, ctx.fps), 4));
        const deg = (ang * 180) / Math.PI + 90;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${deg}deg) scale(${0.6 + 0.4 * p})`,
            fontFamily: 'Estedad', fontWeight: 900, fontSize: item.props?.size ?? 92, whiteSpace: 'nowrap', opacity: p,
            color: t.key || item.props?.onLight ? RED_TOP : '#fbfbfb',
            textShadow: t.key || item.props?.onLight ? `2px 4px 0 ${RED_EXT}, 0 8px 18px rgba(0,0,0,.35)` : '2px 4px 0 #9a9a9a, 0 8px 18px rgba(0,0,0,.5)'}}>
            {disp(t.w)}</div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.5 SurfaceWord (front, tracked to the chest every frame)
export const SurfaceWord: React.FC<TP> = ({item, frame, f1, A, ctx}) => {
  const toks = item.tokens ?? [];
  let cur = -1;
  toks.forEach((t, i) => { if (frame >= tF(t, ctx.fps)) cur = i; });
  if (cur < 0 || frame > f1 + 2) return null;
  const cx = (A.chest.x + A.chest.w / 2) * W;
  const cy = (A.chest.y + A.chest.h * 0.42) * H;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: cx - W / 2, width: W, top: cy - 50, textAlign: 'center', ...RTL,
        fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: 112, color: '#E2E2E2', mixBlendMode: 'screen', opacity: 0.92,
        transform: `perspective(900px) rotateX(6deg)`}}>{disp(toks[cur].w)}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.6 Stickers (front)
export const Stickers: React.FC<TP> = ({item, frame, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const A = Aavg;
  const x0 = (A.face.x + A.face.w + 0.04) * W;
  const y0 = (A.face.y + A.face.h * 0.2) * H;
  const x1 = (A.chest.x + 0.05) * W;
  const y1 = (A.chest.y + A.chest.h * 0.55) * H;
  const o = out(frame, f1, 3);
  const n = Math.max(1, toks.length - 1);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      {toks.map((t, i) => {
        const p = prog(frame, tF(t, ctx.fps), 7);
        if (p <= 0) return null;
        const x = x0 + ((x1 - x0) * i) / n;
        const y = y0 + ((y1 - y0) * i) / n;
        const tilt = ((t.i * 37) % 17) - 8;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${tilt}deg) scale(${popScale(p)})`,
            background: `linear-gradient(180deg, #d1182b 0%, ${STICK_RED} 60%, #8d0b17 100%)`, borderRadius: 18, padding: '4px 26px 10px',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(0,0,0,.25), 0 8px 16px rgba(0,0,0,.45)',
            fontFamily: 'Lalezar', fontSize: 64, color: '#FFF4E0', whiteSpace: 'nowrap', ...RTL,
            textShadow: '0 2px 0 rgba(0,0,0,.25)'}}>{disp(t.w)}</div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.7 BrollCard (scene) — card with the subject's own punch-in footage
export const BrollCard: React.FC<TP> = ({item, frame, f0, f1, ctx, Aavg}) => {
  const p = eOut(prog(frame, f0, 8));
  const o = out(frame, f1, 4);
  const cw = 0.82 * W;
  const ch = 0.62 * H;
  const tilt = Math.sin((frame - f0) / 25) * 4;
  const stat: string = item.props?.stat ?? '';
  const statWord: string = item.props?.statWord ?? '';
  const ss = prog(frame, f0 + 6, 6);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a1612 0%, #0b0605 70%)', opacity: 1 - o}}>
      <div style={{position: 'absolute', left: (W - cw) / 2, top: (H - ch) / 2, width: cw, height: ch, borderRadius: 0.06 * W,
        overflow: 'hidden', transform: `perspective(1600px) rotateY(${tilt}deg) rotateX(${tilt * 0.4}deg) scale(${0.85 + 0.15 * p})`,
        boxShadow: '0 0 40px rgba(255,255,255,.55), 0 0 90px rgba(255,255,255,.25)', opacity: p}}>
        <AbsoluteFill style={{transform: `scale(${1.25})`, filter: 'grayscale(1) contrast(1.15) brightness(1.05)'}}>
          <SourceLayer ctx={ctx} frame={frame} src={ctx.videoSrc} muted extraScale={1.0} />
        </AbsoluteFill>
      </div>
      <div style={{position: 'absolute', right: (W - cw) / 2 - 30, top: (H - ch) / 2 - 70, textAlign: 'right', ...RTL,
        transform: `scale(${popScale(ss)})`, transformOrigin: '80% 50%'}}>
        <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontStyle: 'italic', fontSize: 120, color: '#fff', lineHeight: 1,
          direction: 'ltr', textShadow: '0 6px 18px rgba(0,0,0,.6)'}}>{stat}</div>
        <div style={{fontFamily: 'Lalezar', fontSize: 110, color: RED_TOP, lineHeight: 1.1, textShadow: `3px 5px 0 ${RED_EXT}`}}>{faDigits(statWord)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.9 RedCard (scene)
export const RedCard: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const title: string = item.props?.title ?? '';
  const pre: number[] = item.props?.pre ?? [];
  const script: string = item.props?.script ?? '';
  const size = fit(faDigits(title), 'Lalezar', 400, 0.86 * W, 300);
  const tp = prog(frame, item.props?.titleAt != null ? Math.round(item.props.titleAt * ctx.fps) : f0 + 6, 4);
  const sp = prog(frame, (item.props?.titleAt != null ? Math.round(item.props.titleAt * ctx.fps) : f0 + 6) + 5, 8);
  const lineY = [0.33, 0.335, 0.66, 0.665];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #840A04 0%, #6F0702 100%)'}}>
      <div style={{position: 'absolute', left: W / 2 - 34, top: 0.24 * H, width: 68, height: 68, border: '4px solid #2a0201', borderRadius: 6,
        fontFamily: 'Anton', fontSize: 48, color: '#2a0201', textAlign: 'center', lineHeight: '60px'}}>Z</div>
      {lineY.map((y, i) => <div key={i} style={{position: 'absolute', left: 0.06 * W, right: 0.06 * W, top: y * H, height: 2, background: 'rgba(30,0,0,.55)'}} />)}
      <div style={{position: 'absolute', left: 0.07 * W, top: 0.67 * H, fontFamily: 'Inter', fontSize: 15, color: 'rgba(30,0,0,.6)', lineHeight: 1.5}}>
        VOL. 06 — ISSUE 26<br />PRINTED 2026 · ROCKSTAR NEWS DESK<br />EDITION ZARBE / 001</div>
      <div style={{position: 'absolute', right: 0.07 * W, top: 0.67 * H, fontFamily: 'Inter', fontSize: 15, color: 'rgba(30,0,0,.6)', textAlign: 'right'}}>
        NO. 1.5M — 26.11<br />MMXXVI</div>
      <WordRow style={{position: 'absolute', left: 0, right: 0, top: 0.36 * H}}>
        {pre.map((i) => <span key={i} style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: 52, color: '#1a0303',
          opacity: frame >= tF(toks[i], ctx.fps) ? 1 : 0}}>{disp(toks[i].w)}</span>)}
      </WordRow>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0.42 * H, display: 'flex', justifyContent: 'center', opacity: tp > 0 ? 1 : 0,
        transform: `scale(${interpolate(eOut(tp), [0, 1], [1.15, 1])})`}}>
        <div style={{fontFamily: 'Lalezar', fontSize: size, color: '#1A0303', lineHeight: 1, transform: 'scaleY(1.45)', ...RTL,
          whiteSpace: 'nowrap'}}>{faDigits(title)}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0.53 * H, textAlign: 'center', ...RTL, fontFamily: 'NotoNastaliqUrdu',
        fontSize: 92, color: '#fff', lineHeight: 2, clipPath: `inset(-50% 0 -50% ${(1 - sp) * 100}%)`,
        textShadow: '0 0 12px rgba(255,255,255,.35)'}}>{faDigits(script)}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5.10 SilhouetteCut (scene)
export const SilhouetteCut: React.FC<TP> = ({item, frame, f0, ctx, Aavg}) => {
  const deskY = item.props?.deskY ?? 0.646;
  const fr = Aavg.framing;
  const deskOut = (fr.fy + (deskY - fr.fy) * fr.z) * H;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 55% at 50% 38%, #ffffff 0%, #e6e6e6 35%, #9a9a9a 100%)'}}>
      <SvgDefs />
      {ctx.fgSrc ? <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted
        style={{filter: 'url(#fillWhite) blur(18px)', opacity: 0.9}} /> : null}
      {ctx.fgSrc ? <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted style={{filter: 'brightness(0.12) contrast(1.4)'}} /> : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: deskOut, bottom: 0, background: '#111'}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- transitions, grade
const burstAt = (frame: number, ctx: Ctx) => {
  let v = 0;
  for (const tr of ctx.edl.transitions) {
    if (tr.type !== 'LightBurst') continue;
    const at = Math.round(tr.at * ctx.fps);
    if (frame >= at - 4 && frame <= at) v = Math.max(v, interpolate(frame, [at - 4, at], [0, 1]));
    if (frame > at && frame <= at + 6) v = Math.max(v, interpolate(frame, [at, at + 6], [1, 0]));
  }
  return v;
};

const LightBurst: React.FC<{frame: number; ctx: Ctx}> = ({frame, ctx}) => {
  const v = burstAt(frame, ctx);
  if (v <= 0.01 || !ctx.fgSrc) return null;
  return (
    <AbsoluteFill>
      <SvgDefs />
      <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted style={{filter: `url(#fillWhite) blur(${40 * v}px)`, opacity: v}} />
      <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted style={{filter: 'url(#fillWhite)', opacity: v}} />
      <AbsoluteFill style={{background: 'white', opacity: Math.pow(v, 1.6) * 0.85}} />
    </AbsoluteFill>
  );
};

// punch-in on hero words: +8 % over 6 f (applied to the whole stack so overlays stay aligned)
const punchAt = (frame: number, ctx: Ctx) => {
  let s = 1;
  for (const it of ctx.edl.items) {
    if (!it.props?.punch) continue;
    const f0 = Math.round(it.from * ctx.fps);
    const f1 = Math.round(it.to * ctx.fps);
    if (frame >= f0 && frame < f1) s = 1 + 0.08 * eOut(prog(frame, f0, 6));
  }
  return s;
};

export const zarbeStyle = {
  treatments: {HeroBehind, SansLine, Stack, PairWide, ArcText, SurfaceWord, Stickers, BrollCard, RedCard, SilhouetteCut},
  wrapperStyle: (frame: number, ctx: Ctx): React.CSSProperties => {
    const s = punchAt(frame, ctx);
    if (s === 1) return {};
    const a = ctx.subject.frames[0].head_center;
    return {transform: `scale(${s})`, transformOrigin: `${a[0] * 100}% ${a[1] * 100}%`};
  },
  baseStyle: (): React.CSSProperties => ({filter: 'saturate(1.12) contrast(1.06) brightness(1.02)'}),
  Grade: () => (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,.32) 100%)'}} />
  ),
  Overlay: LightBurst,
};
