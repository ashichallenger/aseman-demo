// Style "neon" — Neon glass product ad (EXPERIMENTAL; see styles/neon/STYLE.md).
// Palette is derived from the scene: this job's set is warm amber → amber palette everywhere.
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {Ctx, SourceLayer, TP} from '../../core/Edit';
import {clamp01, disp, eBack, eOut, faDigits, popScale, prog, RTL, tF, WordRow} from '../../core/text';

const W = 1080;
const H = 1920;
export const PAL = {
  text: '#FFC24A',
  glow: '#FF8A00',
  gold: 'linear-gradient(180deg, #FFF1C4 0%, #FFD36A 35%, #FFB53A 65%, #E07A00 100%)',
  glass: 'rgba(255,210,150,.14)',
  rim: 'rgba(255,214,150,.75)',
};
const NEON_FONT = 'Lalezar';
const glow = (c = PAL.glow, k = 1) => `0 0 ${6 * k}px ${c}, 0 0 ${16 * k}px ${c}, 0 0 ${36 * k}px ${c}`;
const out = (frame: number, f1: number, d = 5) => clamp01((frame - f1) / d);
const fit = (text: string, family: string, weight: number | string, maxW: number, maxSize: number) => {
  try {
    return Math.min(maxSize, fitText({text, withinWidth: maxW, fontFamily: family, fontWeight: String(weight)}).fontSize);
  } catch {
    return maxSize;
  }
};
// flicker-on: 3 f of on/off then steady
const flicker = (frame: number, s: number) => {
  const d = frame - s;
  if (d < 0) return 0;
  if (d === 0) return 0.6;
  if (d === 1) return 0.15;
  if (d === 2) return 0.9;
  return 1;
};

const GoldText: React.FC<{text: string; size: number; style?: React.CSSProperties}> = ({text, size, style}) => (
  <div style={{position: 'relative', display: 'inline-block', whiteSpace: 'nowrap', ...RTL, ...style}}>
    <div style={{fontFamily: NEON_FONT, fontSize: size, lineHeight: 1.2, color: '#7a3c00', textShadow: `0 4px 0 #5a2a00, ${glow(PAL.glow, 1.1)}`}}>{text}</div>
    <div style={{position: 'absolute', inset: 0, fontFamily: NEON_FONT, fontSize: size, lineHeight: 1.2, backgroundImage: PAL.gold,
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{text}</div>
  </div>
);

// NeonWord — emotional hook: big gold neon word(s) behind/above the head + small white line
export const NeonWord: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const key = toks.find((t) => t.key) ?? toks[toks.length - 1];
  const small = toks.filter((t) => t !== key);
  const A = Aavg;
  const text = disp(key.w);
  const size = fit(text, NEON_FONT, 400, 0.78 * W, 230);
  const fl = flicker(frame, tF(key, ctx.fps));
  const o = out(frame, f1);
  // our set has no room above the head: the gold word sits on the dark desk in the lower third (never on the face)
  const y = item.props?.y != null ? item.props.y * H : Math.max(0.7 * H, (A.chin + 0.3) * H);
  const sw = eOut(prog(frame, tF(key, ctx.fps), 10));
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: fl}}>
        <path d={`M ${W * 0.1} ${y + size * 0.9} Q ${W * 0.5} ${y + size * 1.15} ${W * 0.92} ${y + size * 0.45}`} stroke={PAL.text} strokeWidth={10}
          fill="none" strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - sw)} style={{filter: `drop-shadow(0 0 10px ${PAL.glow})`}} />
      </svg>
      <WordRow style={{position: 'absolute', left: 0, right: 0, top: Math.max(0.03 * H, y - 64)}} gap={0.25}>
        {small.map((t, i) => <span key={i} style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: 52, color: '#fff',
          opacity: prog(frame, tF(t, ctx.fps), 4), textShadow: glow('rgba(255,160,40,.8)', 0.5)}}>{disp(t.w)}</span>)}
      </WordRow>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: fl}}>
        <GoldText text={text} size={size} />
      </div>
    </AbsoluteFill>
  );
};

// GlassCard — benefit / explanation lines on a warm frosted card under the face (desk level) or on the empty side
export const GlassCard: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const A = Aavg;
  const p = eOut(prog(frame, f0, 8));
  const o = out(frame, f1);
  const cw = (item.props?.w ?? 0.8) * W;
  const top = (item.props?.y ?? Math.min(0.66, A.chest.y + A.chest.h + 0.04)) * H;
  return (
    <AbsoluteFill style={{opacity: (1 - o) * p}}>
      <div style={{position: 'absolute', left: (W - cw) / 2, width: cw, top: top + (1 - p) * 60, padding: '26px 34px', borderRadius: 24,
        background: `linear-gradient(180deg, rgba(255,214,150,.22), ${PAL.glass})`, backdropFilter: 'blur(20px)',
        border: `2px solid ${PAL.rim}`, boxShadow: `0 0 24px rgba(255,138,0,.45), inset 0 0 30px rgba(255,190,90,.25)`}}>
        {lines.map((ln, li) => (
          <WordRow key={li} gap={0.24} style={{flexWrap: 'wrap', whiteSpace: 'normal'}}>
            {ln.map((i) => {
              const t = toks[i];
              const pp = prog(frame, tF(t, ctx.fps), 4);
              return <span key={i} style={{fontFamily: 'Vazirmatn', fontWeight: t.key ? 800 : 600, fontSize: li === 0 ? 58 : 50,
                color: t.key ? PAL.text : '#FFF6E6', opacity: pp, lineHeight: 1.45,
                textShadow: t.key ? glow(PAL.glow, 0.6) : '0 2px 6px rgba(0,0,0,.45)'}}>{disp(t.w)}</span>;
            })}
          </WordRow>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// GlowNumber — counts up to the spoken number, giant on the empty side, behind the subject
export const GlowNumber: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const value: number = item.props?.value ?? 0;
  const suffix: string = item.props?.suffix ?? '';
  const label: string = item.props?.label ?? '';
  const A = Aavg;
  const p = eOut(prog(frame, f0, 14));
  const o = out(frame, f1);
  const shown = item.props?.text ?? (value >= 1000 ? (value * p / 1e6).toFixed(1) : Math.round(value * p).toString());
  const right = A.empty === 'right';
  const room = right ? W - (A.face.x + A.face.w) * W - 30 : A.face.x * W - 30;
  const bw = Math.max(0.3 * W, Math.min(0.46 * W, room));
  const x = right ? W - bw / 2 - 24 : bw / 2 + 24;
  const full = faDigits(item.props?.text ?? (value >= 1000 ? (value / 1e6).toFixed(1) : String(value))) + suffix;
  const ns = fit(full, 'Montserrat', 900, bw * 0.95, 300);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <div style={{position: 'absolute', left: x - bw / 2, width: bw, top: 0.09 * H, textAlign: 'center',
        transform: `perspective(1200px) rotateY(${right ? -14 : 14}deg) scale(${0.7 + 0.3 * p})`}}>
        <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: ns, lineHeight: 1, backgroundImage: PAL.gold, WebkitBackgroundClip: 'text', whiteSpace: 'nowrap',
          backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 18px ${PAL.glow}) drop-shadow(0 8px 0 #6a3200)`}}>{faDigits(shown)}{suffix}</div>
        <div style={{...RTL, fontFamily: 'Vazirmatn', fontWeight: 700, fontSize: Math.min(52, fit(faDigits(label), 'Vazirmatn', 700, bw, 52)), color: '#fff', textShadow: glow('rgba(255,150,30,.9)', 0.6), whiteSpace: 'nowrap',
          opacity: prog(frame, f0 + 8, 6)}}>{faDigits(label)}</div>
      </div>
    </AbsoluteFill>
  );
};

// VerticalPill — brand/value line in a tall glass pill at the frame edge on the empty side
export const VerticalPill: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const text = toks.map((t) => disp(t.w)).join(' ');
  const A = Aavg;
  const p = eBack(prog(frame, f0, 10));
  const o = out(frame, f1);
  const right = A.empty === 'right';
  const ph = 0.42 * H;
  const pw = 150;
  const size = fit(text, NEON_FONT, 400, ph * 0.86, 110);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <div style={{position: 'absolute', [right ? 'right' : 'left']: 40, top: 0.14 * H, width: pw, height: ph, borderRadius: pw / 2,
        background: PAL.glass, border: `2px solid ${PAL.rim}`, backdropFilter: 'blur(16px)', boxShadow: '0 0 30px rgba(255,138,0,.4)',
        transform: `translateY(${(1 - p) * -80}px)`, opacity: clamp01(p), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
        <div style={{transform: 'rotate(-90deg)', whiteSpace: 'nowrap', ...RTL, fontFamily: NEON_FONT, fontSize: size, color: PAL.text,
          textShadow: glow(PAL.glow, 0.8), opacity: flicker(frame, f0 + 4)}}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

// StepDots — 1-2-3-4 glass pill, active number neon
export const StepDots: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const n: number = item.props?.n ?? 4;
  const times: number[] = item.props?.stepTimes ?? [];
  const labels: string[] = item.props?.labels ?? [];
  let active = 0;
  times.forEach((t, i) => { if (frame >= Math.round(t * ctx.fps)) active = i; });
  const p = eOut(prog(frame, f0, 8));
  const o = out(frame, f1);
  const pw = 0.72 * W;
  return (
    <AbsoluteFill style={{opacity: (1 - o) * p}}>
      <div style={{position: 'absolute', left: (W - pw) / 2, width: pw, top: 0.075 * H, height: 120, borderRadius: 60, background: PAL.glass,
        border: `2px solid ${PAL.rim}`, backdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center'}}>
        {Array.from({length: n}).map((_, i) => {
          const on = i === active;
          return <div key={i} style={{width: 92, height: 92, borderRadius: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Montserrat', fontWeight: 900, fontSize: on ? 70 : 52, color: on ? PAL.text : 'rgba(255,240,220,.45)',
            textShadow: on ? glow(PAL.glow, 0.9) : 'none', border: on ? `2px solid ${PAL.text}` : '2px solid rgba(255,220,170,.25)'}}>{faDigits(String(i + 1))}</div>;
        })}
      </div>
      {labels[active] ? <div style={{position: 'absolute', left: 0, right: 0, top: 0.075 * H + 135, textAlign: 'center', ...RTL, fontFamily: 'Vazirmatn',
        fontWeight: 700, fontSize: 48, color: '#fff', textShadow: glow('rgba(255,150,30,.9)', 0.5)}}>{faDigits(labels[active])}</div> : null}
    </AbsoluteFill>
  );
};

// ProductCard — tilted sticker card that pops next to the real toys on the desk
export const ProductCard: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const title: string = item.props?.title ?? toks.map((t) => disp(t.w)).join(' ');
  const sub: string = item.props?.sub ?? '';
  const [x, y] = item.props?.at ?? [0.3, 0.6];
  const tilt = item.props?.tilt ?? -7;
  const p = prog(frame, f0, 8);
  const o = out(frame, f1);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <div style={{position: 'absolute', left: x * W, top: y * H, transform: `translate(-50%,-100%) rotate(${tilt}deg) scale(${popScale(p)})`,
        padding: '18px 30px', borderRadius: 22, background: 'linear-gradient(160deg, #3a1d05 0%, #1c0d02 100%)', border: `3px solid ${PAL.text}`,
        boxShadow: `0 0 26px ${PAL.glow}, 0 14px 30px rgba(0,0,0,.5)`, textAlign: 'center', ...RTL, whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: NEON_FONT, fontSize: 70, color: PAL.text, textShadow: glow(PAL.glow, 0.7), lineHeight: 1.2}}>{faDigits(title)}</div>
        {sub ? <div style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: 34, color: '#FFF1D6'}}>{faDigits(sub)}</div> : null}
      </div>
      <div style={{position: 'absolute', left: x * W - 3, top: y * H, width: 6, height: 70 * popScale(p), background: PAL.text,
        boxShadow: glow(PAL.glow, 0.5), borderRadius: 3}} />
    </AbsoluteFill>
  );
};

// CircleFrame (scene) — glowing circular close-up portrait of the presenter over the blurred amber set,
// the live presenter small at the bottom, caption under the circle (reference: amber tile 05.2 s)
export const CircleFrame: React.FC<TP> = ({item, frame, f0, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const A = Aavg;
  const d = 0.68 * W;
  const cx = W / 2;
  const cy = 0.29 * H;
  const p = eBack(prog(frame, f0, 10));
  const o = out(frame, f1);
  const fx = A.face.x + A.face.w / 2;
  const fy = A.face.y + A.face.h * 0.55;
  const z = d / (A.face.w * W * 1.6);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <AbsoluteFill style={{filter: 'blur(18px) brightness(.55) saturate(1.3)', transform: 'scale(1.1)'}}>
        <SourceLayer ctx={ctx} frame={frame} src={ctx.videoSrc} muted />
      </AbsoluteFill>
      {/* the presenter small at the bottom, like the reference tile */}
      <div style={{position: 'absolute', left: W * 0.3, top: H * 0.6, width: W * 0.4, height: H * 0.4, overflow: 'hidden',
        borderRadius: 24, border: `2px solid ${PAL.rim}`, boxShadow: `0 0 24px ${PAL.glow}`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: 'scale(0.4)', transformOrigin: '0 0'}}>
          <SourceLayer ctx={ctx} frame={frame} src={ctx.videoSrc} muted />
        </div>
      </div>
      <div style={{position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: '50%', overflow: 'hidden',
        border: `5px solid ${PAL.text}`, boxShadow: `0 0 30px ${PAL.glow}, 0 0 80px rgba(255,138,0,.55)`, transform: `scale(${p})`}}>
        <div style={{position: 'absolute', left: d / 2 - fx * W * z, top: d / 2 - fy * H * z, width: W, height: H,
          transform: `scale(${z})`, transformOrigin: '0 0'}}>
          <SourceLayer ctx={ctx} frame={frame} src={ctx.videoSrc} muted />
        </div>
      </div>
      <WordRow style={{position: 'absolute', left: 0.06 * W, right: 0.06 * W, top: cy + d / 2 + 26, flexWrap: 'wrap', whiteSpace: 'normal'}}>
        {toks.map((t, i) => <span key={i} style={{fontFamily: t.key ? NEON_FONT : 'Vazirmatn', fontWeight: t.key ? 400 : 700,
          fontSize: t.key ? 84 : 58, color: t.key ? PAL.text : '#fff', opacity: prog(frame, tF(t, ctx.fps), 4),
          textShadow: t.key ? glow(PAL.glow, 0.8) : glow('rgba(255,150,30,.9)', 0.5)}}>{disp(t.w)}</span>)}
      </WordRow>
    </AbsoluteFill>
  );
};

// PropFly — glowing sparkles / ring props flying along the frame edges (never across the face)
export const PropFly: React.FC<TP> = ({item, frame, f0, f1}) => {
  const n = item.props?.n ?? 5;
  const o = out(frame, f1, 6);
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      {Array.from({length: n}).map((_, i) => {
        const p = clamp01((frame - f0 - i * 3) / 40);
        const left = i % 2 === 0;
        const x = left ? 0.04 * W + p * 0.12 * W : W - 0.04 * W - p * 0.12 * W;
        const y = (0.15 + i * 0.13) * H - p * 0.08 * H;
        const s = 30 + (i % 3) * 18;
        return (
          <svg key={i} width={s * 2} height={s * 2} viewBox="-1 -1 2 2" style={{position: 'absolute', left: x - s, top: y - s,
            transform: `rotate(${p * 180 + i * 40}deg) scale(${popScale(clamp01(p * 4))})`, filter: `drop-shadow(0 0 8px ${PAL.glow})`}}>
            <path d="M0,-1 L0.22,-0.22 L1,0 L0.22,0.22 L0,1 L-0.22,0.22 L-1,0 L-0.22,-0.22 Z" fill={i % 2 ? '#FFE6A8' : PAL.text} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

// Caption (always-on readable line, neon-amber key)
export const NeonCaption: React.FC<TP> = ({item, frame, f1, Aavg, ctx}) => {
  const toks = item.tokens ?? [];
  const A = Aavg;
  const o = out(frame, f1, 3);
  const top = (item.props?.y ?? A.chest.y + A.chest.h * 0.5) * H;
  return (
    <AbsoluteFill style={{opacity: 1 - o}}>
      <WordRow style={{position: 'absolute', left: 0.06 * W, right: 0.06 * W, top}} gap={0.24}>
        {toks.map((t, i) => {
          const s = tF(t, ctx.fps);
          const vis = frame >= s ? 1 : 0;
          return <span key={i} style={{fontFamily: t.key ? NEON_FONT : 'Vazirmatn', fontWeight: t.key ? 400 : 700, fontSize: t.key ? 88 : 60,
            color: t.key ? PAL.text : '#fff', opacity: t.key ? flicker(frame, s) : vis,
            textShadow: t.key ? glow(PAL.glow, 0.8) : '0 2px 10px rgba(0,0,0,.6)'}}>{disp(t.w)}</span>;
        })}
      </WordRow>
    </AbsoluteFill>
  );
};

export const neonStyle = {
  treatments: {NeonWord, GlassCard, GlowNumber, VerticalPill, StepDots, ProductCard, CircleFrame, PropFly, NeonCaption},
  baseStyle: (): React.CSSProperties => ({filter: 'saturate(1.15) contrast(1.05)'}),
  Grade: () => (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 40%, rgba(0,0,0,0) 50%, rgba(40,15,0,.45) 100%)'}} />
  ),
  wrapperStyle: (frame: number, ctx: Ctx): React.CSSProperties => {
    // quick glow-flash punch on cuts marked "Flash"
    let s = 1;
    for (const tr of ctx.edl.transitions) {
      const at = Math.round(tr.at * ctx.fps);
      if (tr.type === 'Punch' && frame >= at && frame < at + 6) s = interpolate(frame, [at, at + 5], [1.06, 1], {easing: eOut});
    }
    return s === 1 ? {} : {transform: `scale(${s})`};
  },
};
