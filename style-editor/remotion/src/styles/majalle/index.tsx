// Style "majalle" — Editorial poster pages (see styles/majalle/STYLE.md).
// Talking-head adaptation: the hero image of each page is the presenter cut-out (RVM matte), duotoned.
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {Ctx, SourceLayer, TP} from '../../core/Edit';
import {clamp01, disp, eInOut, eOut, faDigits, prog, RTL, tF} from '../../core/text';
import {Token} from '../../core/types';

const W = 1080;
const H = 1920;
const RED = '#B3122E';
const PINK = '#F04A5E';
const INK = '#111111';
const CREAM = '#F3E6D3';
const PAPER = '#FBEFD6';
const NAVY = '#0E2A3B';

const fit = (text: string, family: string, weight: number | string, maxW: number, maxSize: number) => {
  try {
    return Math.min(maxSize, fitText({text, withinWidth: maxW, fontFamily: family, fontWeight: String(weight)}).fontSize);
  } catch {
    return maxSize;
  }
};

// 5.1 WordReveal: invisible until spoken, then opacity 0→1 + blur 6→0 over 5 f. Layout never shifts.
const Rev: React.FC<{tok: Token; frame: number; fps: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({tok, frame, fps, style, children}) => {
  const p = eOut(prog(frame, tF(tok, fps), 5));
  return <span style={{display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 6}px)`, whiteSpace: 'nowrap', ...style}}>{children ?? disp(tok.w)}</span>;
};

const Row: React.FC<{children: React.ReactNode; gap?: number; style?: React.CSSProperties; justify?: string}> = ({children, gap = 0.26, style, justify = 'flex-start'}) => (
  <div style={{display: 'flex', flexDirection: 'row', ...RTL, columnGap: `${gap}em`, alignItems: 'baseline', flexWrap: 'wrap', justifyContent: justify, ...style}}>{children}</div>
);

// Presenter cut-out as the page's hero image (warm gold duotone by default).
const Hero: React.FC<{ctx: Ctx; frame: number; tone?: 'gold' | 'gray' | 'natural'; style?: React.CSSProperties; scale?: number; dx?: number; dy?: number; image?: string}> = ({ctx, frame, tone = 'gold', style, scale = 1, dx = 0, dy = 0, image}) => {
  if (image) {
    // user-supplied hero image replaces the presenter cut-out
    return (
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${scale})`, alignItems: 'center', justifyContent: 'center', ...style}}>
        <Img src={staticFile(image)} style={{width: '86%', objectFit: 'contain'}} />
      </AbsoluteFill>
    );
  }
  if (!ctx.fgSrc) return null;
  const filt = tone === 'gold' ? 'grayscale(1) sepia(1) saturate(2.2) hue-rotate(-12deg) contrast(1.25) brightness(1.05)'
    : tone === 'gray' ? 'grayscale(1) contrast(1.2) brightness(1.05)' : 'contrast(1.08)';
  return (
    <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${scale})`, ...style}}>
      <SourceLayer ctx={ctx} frame={frame} src={ctx.fgSrc} transparent muted style={{filter: filt}} />
    </AbsoluteFill>
  );
};

const Micro: React.FC<{dark?: boolean}> = ({dark}) => {
  const c = dark ? 'rgba(243,230,211,.5)' : 'rgba(17,17,17,.5)';
  return (
    <>
      <div style={{position: 'absolute', left: 0.08 * W, right: 0.08 * W, top: 0.075 * H, display: 'flex', justifyContent: 'space-between',
        fontFamily: 'Inter', fontSize: 14, color: c, letterSpacing: '0.04em'}}>
        <span>Rockstar</span><span>Vice City</span><span>Leonida Press</span><span>Edition 06</span>
      </div>
      <div style={{position: 'absolute', left: 0.035 * W, top: 0.2 * H, transform: 'rotate(-90deg)', transformOrigin: '0 0',
        fontFamily: 'PlayfairDisplay', fontStyle: 'italic', fontWeight: 400, fontSize: 22, color: c, whiteSpace: 'nowrap', marginTop: 260}}>The Confession — vol. VI</div>
      <div style={{position: 'absolute', right: 0.03 * W, top: 0.2 * H, transform: 'rotate(90deg)', transformOrigin: '100% 0',
        fontFamily: 'Inter', fontSize: 18, color: c, whiteSpace: 'nowrap', marginTop: 10}}>2026. 11. 26 · ۲۶ آبان</div>
      <div style={{position: 'absolute', left: 0.08 * W, top: 0.8 * H, width: 0.84 * W, display: 'flex', justifyContent: 'space-between',
        fontFamily: 'Inter', fontSize: 12, color: c, lineHeight: 1.6}}>
        <div>The Confession<br />Directed by — R*<br />Leonida Studio</div>
        <div>2026.11.26<br />Vice City, FL<br />1.5M tickets</div>
        <div style={{...RTL, fontFamily: 'Vazirmatn', fontWeight: 300}}>نسخه‌ی ویژه<br />چاپ اول<br />شماره‌ی ۶</div>
      </div>
    </>
  );
};

const Leaks: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 35% at 15% 85%, rgba(140,20,20,.45), transparent 70%), radial-gradient(ellipse 50% 30% at 90% 20%, rgba(120,30,10,.35), transparent 70%)'}} />
);

const Grain: React.FC<{opacity?: number}> = ({opacity = 0.18}) => (
  <AbsoluteFill style={{opacity, mixBlendMode: 'multiply', backgroundImage:
    'repeating-radial-gradient(circle at 17% 32%, rgba(90,60,30,.18) 0 1px, transparent 1px 3px), repeating-radial-gradient(circle at 73% 61%, rgba(90,60,30,.12) 0 1px, transparent 1px 4px)'}} />
);

const pagePush = (frame: number, f0: number, f1: number, pull = false) => {
  const p = clamp01((frame - f0) / Math.max(1, f1 - f0));
  return pull ? 1.06 - 0.06 * p : 1 + 0.06 * p;
};

// --------------------------------------------------------------------------- page types
// item.props: lines (token idx arrays), accent (token idx), hand (token idx), hl ([from,to] token idx), chips (token idx[])
export const Page: React.FC<TP> = (tp) => {
  const kind = tp.item.props?.page ?? 'dark';
  const C = ({dark: DarkHeadline, object: ObjectPage, split: SplitPage, frame: FramePage, grotesk: GroteskPage, quote: QuotePage} as Record<string, React.FC<TP>>)[kind] ?? DarkHeadline;
  return <C {...tp} />;
};

const DarkHeadline: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const accent = item.props?.accent ?? -1;
  const head = lines[0] ?? [];
  const bar = lines.slice(1).flat();
  const headText = head.map((i) => disp(toks[i].w)).join(' ');
  const size = fit(headText, 'Lalezar', 400, 0.84 * W, 150);
  const barP = eOut(prog(frame, bar.length ? tF(toks[bar[0]], ctx.fps) : f0, 6));
  const s = pagePush(frame, f0, f1);
  return (
    <AbsoluteFill style={{background: '#0B0806', overflow: 'hidden'}}>
      <Leaks />
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <Hero ctx={ctx} frame={frame} tone="gold" scale={0.95} dy={0.16 * H} image={item.props?.image} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 0.7 * H, height: 0.3 * H,
          background: 'linear-gradient(180deg, rgba(11,8,6,0) 0%, rgba(11,8,6,.85) 45%, #0B0806 80%)'}} />
        <div style={{position: 'absolute', left: 0.08 * W, right: 0.08 * W, top: 0.11 * H}}>
          <Row justify="center" style={{fontFamily: 'Lalezar', fontSize: size, color: CREAM, lineHeight: 1.15}}>
            {head.map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} style={{color: i === accent ? RED : CREAM,
              transition: 'none'}} />)}
          </Row>
          {bar.length ? (
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 8}}>
              <div style={{background: '#8E0F1C', padding: '6px 22px', clipPath: `inset(0 0 0 ${(1 - barP) * 100}%)`}}>
                <Row style={{fontFamily: 'Vazirmatn', fontWeight: 400, fontSize: 38, color: '#fff'}}>
                  {bar.map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} style={{color: i === accent ? '#FFD6D6' : '#fff'}} />)}
                </Row>
              </div>
            </div>
          ) : null}
        </div>
        <div style={{position: 'absolute', left: 0.08 * W, top: 0.75 * H, width: 0.6 * W, fontFamily: 'Inter', fontSize: 16,
          color: 'rgba(243,230,211,.55)', lineHeight: 1.5}}>Your goal is not to attract everyone but to capture<br />the attention of the people who matter.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ObjectPage: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const chips: number[] = item.props?.chips ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const accent = item.props?.accent ?? -1;
  const s = pagePush(frame, f0, f1);
  const sw = eOut(prog(frame, f0, 10));
  const pos = [[0.2, 0.2], [0.78, 0.27], [0.24, 0.38], [0.8, 0.43]];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #2a1a12 0%, #0B0806 65%)', overflow: 'hidden'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <polygon points={`${-60 + sw * 60},${0.18 * H} ${70 * sw},${0.22 * H} ${20 * sw},${0.32 * H} ${90 * sw},${0.36 * H} ${-60 + sw * 60},${0.5 * H}`} fill={PINK} opacity={0.9} />
        <polygon points={`${W + 60 - sw * 60},${0.12 * H} ${W - 80 * sw},${0.2 * H} ${W - 30 * sw},${0.27 * H} ${W - 95 * sw},${0.4 * H} ${W + 60 - sw * 60},${0.46 * H}`} fill={PINK} opacity={0.9} />
      </svg>
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <Hero ctx={ctx} frame={frame} tone="gold" scale={0.62} dy={-0.08 * H} image={item.props?.image} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 0.43 * H, height: 0.14 * H,
          background: 'linear-gradient(180deg, rgba(11,8,6,0) 0%, #0B0806 75%)'}} />
        {chips.map((ci, k) => {
          const t = toks[ci];
          const p = eOut(prog(frame, tF(t, ctx.fps), 5));
          const [x, y] = pos[k % pos.length];
          return (
            <div key={k} style={{position: 'absolute', left: x * W, top: y * H, transform: `translate(-50%, ${(1 - p) * 4}px)`, opacity: p,
              background: 'rgba(20,20,20,.75)', border: '1px solid rgba(200,200,200,.5)', borderRadius: 10, padding: '6px 18px',
              fontFamily: 'Vazirmatn', fontWeight: 400, fontSize: 30, color: '#fff', ...RTL, whiteSpace: 'nowrap', zIndex: k % 2 ? 0 : 2}}>{disp(t.w)}</div>
          );
        })}
        <div style={{position: 'absolute', left: 0.08 * W, right: 0.08 * W, top: 0.6 * H}}>
          {lines.map((ln, li) => (
            <Row key={li} justify="center" style={{fontFamily: 'Vazirmatn', fontWeight: li === 0 ? 600 : 300,
              fontSize: fit(ln.map((i) => disp(toks[i].w)).join(' '), 'Vazirmatn', li === 0 ? 600 : 300, 0.8 * W, li === 0 ? 110 : 66), flexWrap: 'nowrap',
              color: CREAM, lineHeight: 1.3, letterSpacing: '-0.01em'}}>
              {ln.map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} style={{color: i === accent ? PINK : CREAM}} />)}
            </Row>
          ))}
        </div>
        <svg width={W} height={60} style={{position: 'absolute', left: 0, top: 0.85 * H}}>
          <path d={`M ${W * 0.3} 30 Q ${W * 0.5} 0 ${W * 0.7} 30`} stroke="#b08a4a" strokeWidth={3} fill="none" />
          <circle cx={W / 2} cy={22} r={7} fill="#b08a4a" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SplitPage: React.FC<TP> = ({item, frame, f0, f1, ctx, Aavg}) => {
  const toks = item.tokens ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const accent = item.props?.accent ?? -1;
  const left = lines[0] ?? [];
  const right = lines.slice(1).flat();
  const s = pagePush(frame, f0, f1);
  const open = eOut(prog(frame, f0, 10));
  const slitW = 0.2 * W * open;
  const cx = Aavg.face.x * W + (Aavg.face.w * W) / 2;
  const slitL = W * 0.5 - slitW / 2;
  const leftText = left.map((i) => disp(toks[i].w)).join(' ');
  const lsize = fit(leftText, 'Lalezar', 400, 0.62 * W, 120);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        {/* face through the slit: presenter (grey) re-centred on the slit */}
        <AbsoluteFill style={{clipPath: `inset(0 ${W - (slitL + slitW)}px 0 ${slitL}px)`}}>
          <AbsoluteFill style={{transform: `translateX(${W / 2 - cx}px) scale(1.25)`, filter: 'grayscale(.85) contrast(1.2)'}}>
            <SourceLayer ctx={ctx} frame={frame} src={ctx.videoSrc} muted />
          </AbsoluteFill>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0.45 * H, height: 0.05 * H, background: 'rgba(179,18,46,.55)', mixBlendMode: 'multiply'}} />
        </AbsoluteFill>
        {/* paper sheets */}
        {[0, 1].map((k) => (
          <div key={k} style={{position: 'absolute', top: -20, bottom: -20, ...(k === 0 ? {left: 0, width: slitL} : {left: slitL + slitW, right: 0}),
            background: 'linear-gradient(90deg, #e9e6df, #f6f4ef 40%, #dcd8cf)', boxShadow: k === 0 ? '8px 0 24px rgba(0,0,0,.45)' : '-8px 0 24px rgba(0,0,0,.45)'}}>
            <Grain opacity={0.35} />
          </div>
        ))}
        <div style={{position: 'absolute', right: W - slitL + 24, top: 0.36 * H, width: W, display: 'flex', justifyContent: 'flex-end'}}>
          <div style={{fontFamily: 'PlayfairDisplay', fontWeight: 900, fontSize: 120, color: NAVY, lineHeight: 0.6, position: 'absolute', right: -10, top: -70}}>”</div>
          <Row justify="flex-start" style={{fontFamily: 'Lalezar', fontSize: lsize, color: RED, lineHeight: 1.1, flexWrap: 'nowrap'}}>
            {left.map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} style={{color: i === accent ? RED : INK}} />)}
          </Row>
        </div>
        <div style={{position: 'absolute', left: slitL + slitW + 30, right: 0.04 * W, top: 0.52 * H}}>
          <Row justify="flex-start" style={{fontFamily: 'NotoNastaliqUrdu', fontSize: 58, color: INK, lineHeight: 2.1}}>
            {right.filter((i) => i !== accent).map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} />)}
          </Row>
          {accent >= 0 && right.includes(accent) ? (
            <div style={{fontFamily: 'Lalezar', fontSize: 120, color: RED, lineHeight: 1.1, ...RTL, textAlign: 'right'}}>
              <Rev tok={toks[accent]} frame={frame} fps={ctx.fps} /></div>) : null}
        </div>
        {/* hands-free: small poster marks */}
        <div style={{position: 'absolute', right: 0.04 * W, top: 0.86 * H, fontFamily: 'Inter', fontSize: 13, color: 'rgba(17,17,17,.5)'}}>✕ ✦ ✕ · Leonida Press</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FramePage: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const accent = item.props?.accent ?? -1;
  const s = pagePush(frame, f0, f1);
  const fw = 0.62 * W;
  const fh = 0.42 * H;
  const fin = eOut(prog(frame, f0, 10));
  return (
    <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
      <Grain opacity={0.22} />
      <div style={{position: 'absolute', right: -0.15 * W, top: 0.42 * H, width: 0.8 * W, height: 0.09 * H, background: '#fff', transform: 'rotate(-12deg)', opacity: 0.85}} />
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <div style={{position: 'absolute', left: 0.08 * W, right: 0.08 * W, top: 0.15 * H}}>
          {lines.map((ln, li) => (
            <Row key={li} justify="center" style={{fontFamily: li === 0 ? 'Vazirmatn' : 'Lalezar', fontWeight: li === 0 ? 500 : 400,
              fontSize: fit(ln.map((i) => disp(toks[i].w)).join(' '), li === 0 ? 'Vazirmatn' : 'Lalezar', li === 0 ? 500 : 400, 0.82 * W, li === 0 ? 56 : 120),
              color: li === 0 ? INK : RED, lineHeight: li === 0 ? 1.5 : 1.15, flexWrap: 'nowrap'}}>
              {ln.map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} style={{color: i === accent ? RED : li === 0 ? INK : RED}} />)}
            </Row>
          ))}
        </div>
        <div style={{position: 'absolute', left: (W - fw) / 2 - 40, top: 0.45 * H, width: fw, height: fh,
          transform: `rotate(-8deg) translateY(${(1 - fin) * 80}px)`, opacity: fin, padding: 34,
          background: 'linear-gradient(135deg, #8a5a12, #f1c66a 30%, #a8701c 55%, #f7d98a 75%, #7a4c0e)',
          boxShadow: '0 22px 50px rgba(60,30,0,.45), inset 0 0 0 6px rgba(80,40,0,.4)'}}>
          <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#2a1408',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,.8)'}}>
            <AbsoluteFill style={{transform: 'scale(1.25) translateY(4%)', transformOrigin: '50% 25%'}}>
              <div style={{position: 'absolute', left: -(W - (fw - 68)) / 2, top: -0.14 * H, width: W, height: H}}>
                <Hero ctx={ctx} frame={frame} tone="gold" />
              </div>
            </AbsoluteFill>
          </div>
        </div>
        <div style={{position: 'absolute', right: 0.07 * W, top: 0.5 * H, width: 0.2 * W, ...RTL, fontFamily: 'Vazirmatn', fontWeight: 300,
          fontSize: 15, color: 'rgba(17,17,17,.6)', lineHeight: 1.5}}><span style={{color: RED, fontWeight: 700}}>مهم</span><br />
          آن‌چه مخاطب می‌خواهد را بفهم، آن‌چه به آن اهمیت می‌دهد و آن‌چه او را نگه می‌دارد.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const GroteskPage: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const lines: number[][] = item.props?.lines ?? [toks.map((_, i) => i)];
  const accent = item.props?.accent ?? -1;
  const s = pagePush(frame, f0, f1);
  const longest = lines.map((ln) => ln.map((i) => disp(toks[i].w)).join(' ')).sort((a, b) => b.length - a.length)[0] ?? '';
  const size = fit(longest, 'Vazirmatn', 600, 0.84 * W, 170);
  return (
    <AbsoluteFill style={{background: '#0B0806', overflow: 'hidden'}}>
      <Leaks />
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <Hero ctx={ctx} frame={frame} tone="gray" scale={0.75} dy={-0.2 * H} style={{opacity: 0.22, filter: 'blur(6px)'}} />
        <div style={{position: 'absolute', left: 0.08 * W, right: 0.08 * W, top: 0.56 * H}}>
          {lines.map((ln, li) => (
            <Row key={li} justify="flex-start" style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: size, color: CREAM, lineHeight: 1.18,
              letterSpacing: '-0.02em'}}>
              {ln.map((i) => <Rev key={i} tok={toks[i]} frame={frame} fps={ctx.fps} style={{color: i === accent ? RED : CREAM}} />)}
            </Row>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const QuotePage: React.FC<TP> = ({item, frame, f0, f1, ctx}) => {
  const toks = item.tokens ?? [];
  const hand: number = item.props?.hand ?? -1;
  const hl: [number, number] | undefined = item.props?.hl;
  const s = pagePush(frame, f0, f1, true);
  const hlP = hl ? eOut(prog(frame, tF(toks[hl[0]], ctx.fps), 6)) : 0;
  return (
    <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
      <Grain opacity={0.2} />
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <Micro />
        <div style={{position: 'absolute', right: 0.08 * W, top: 0.33 * H, fontFamily: 'PlayfairDisplay', fontWeight: 900, fontSize: 170, color: NAVY, lineHeight: 0.8}}>“</div>
        <div style={{position: 'absolute', right: 0.08 * W, width: 0.8 * W, top: 0.41 * H}}>
          <Row justify="flex-start" gap={0.24} style={{fontFamily: 'Vazirmatn', fontWeight: 600, fontSize: 64, color: INK, lineHeight: 1.45, rowGap: 6}}>
            {toks.map((_, i) => {
              if (i === hand) {
                return (
                  <span key={i} style={{display: 'inline-block', fontFamily: 'NotoNastaliqUrdu', fontWeight: 700, fontSize: 74, color: RED,
                    lineHeight: 1, clipPath: `inset(-60% 0 -60% ${(1 - eInOut(prog(frame, tF(toks[hand], ctx.fps), 8))) * 100}%)`}}>{disp(toks[hand].w)}</span>
                );
              }
              const inHl = hl && i >= hl[0] && i <= hl[1];
              return (
                <span key={i} style={{position: 'relative', display: 'inline-block'}}>
                  {inHl ? <span style={{position: 'absolute', left: -8, right: -8, top: 4, bottom: 0, background: '#000',
                    clipPath: `inset(0 0 0 ${(1 - hlP) * 100}%)`}} /> : null}
                  <Rev tok={toks[i]} frame={frame} fps={ctx.fps} style={{position: 'relative', color: inHl && hlP > 0.5 ? PAPER : INK}} />
                </span>
              );
            })}
          </Row>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --------------------------------------------------------------------------- transitions (5.8)
const trAt = (frame: number, ctx: Ctx) => {
  const r = {blur: 0, scale: 1, white: 0};
  for (const tr of ctx.edl.transitions) {
    const at = Math.round(tr.at * ctx.fps);
    if (tr.type === 'Defocus') {
      if (frame >= at - 4 && frame < at) r.blur = Math.max(r.blur, interpolate(frame, [at - 4, at - 1], [0, 20]));
      if (frame >= at && frame < at + 6) r.blur = Math.max(r.blur, interpolate(frame, [at, at + 5], [20, 0]));
    } else if (tr.type === 'WhiteBloom') {
      if (frame >= at - 5 && frame < at) r.white = Math.max(r.white, interpolate(frame, [at - 5, at - 1], [0, 1]));
      if (frame >= at && frame < at + 8) r.white = Math.max(r.white, interpolate(frame, [at, at + 7], [1, 0]));
    } else if (tr.type === 'ZoomThrough') {
      if (frame >= at - 5 && frame < at) { r.scale = interpolate(frame, [at - 5, at - 1], [1, 1.6]); r.blur = interpolate(frame, [at - 5, at - 1], [0, 18]); }
      if (frame >= at && frame < at + 7) { r.scale = interpolate(frame, [at, at + 6], [1.3, 1], {easing: eOut}); r.blur = Math.max(r.blur, interpolate(frame, [at, at + 6], [12, 0])); }
    }
  }
  return r;
};

export const majalleStyle = {
  treatments: {Page},
  wrapperStyle: (frame: number, ctx: Ctx): React.CSSProperties => {
    const r = trAt(frame, ctx);
    const st: React.CSSProperties = {};
    if (r.blur > 0.05) st.filter = `blur(${r.blur}px)`;
    if (r.scale !== 1) st.transform = `scale(${r.scale})`;
    return st;
  },
  Overlay: ({frame, ctx}: {frame: number; ctx: Ctx}) => {
    const r = trAt(frame, ctx);
    return r.white > 0.01 ? <AbsoluteFill style={{background: '#fffaf0', opacity: r.white}} /> : null;
  },
};
