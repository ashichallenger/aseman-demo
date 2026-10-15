import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Token} from './types';

export const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const prog = (frame: number, start: number, dur: number) => clamp01((frame - start) / Math.max(1, dur));
export const eOut = Easing.out(Easing.cubic);
export const eInOut = Easing.inOut(Easing.cubic);
export const eBack = Easing.out(Easing.back(1.7));

export const tF = (tok: Token, fps: number) => Math.round(tok.t * fps);

// Spring-ish overshoot: 0 -> 1.12 -> 1 over `dur` frames
export const popScale = (p: number, peak = 1.12) =>
  p <= 0 ? 0 : p < 0.6 ? interpolate(p, [0, 0.6], [0, peak]) : interpolate(p, [0.6, 1], [peak, 1]);

export const RTL: React.CSSProperties = {direction: 'rtl', unicodeBidi: 'plaintext'};

// A row of whole words (never split into letters — keeps Persian joining intact).
export const WordRow: React.FC<{
  children: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
  align?: 'flex-start' | 'center' | 'flex-end';
}> = ({children, gap = 0.28, style, align = 'center'}) => (
  <div style={{display: 'flex', flexDirection: 'row', ...RTL, columnGap: `${gap}em`, alignItems: 'baseline',
    justifyContent: align, whiteSpace: 'nowrap', ...style}}>
    {children}
  </div>
);

// Display text for a token: Persian digits, trimmed punctuation.
export const disp = (w: string, keepPunct = false) => {
  let s = faDigits(w);
  if (!keepPunct) s = s.replace(/[\.,،!]+$/u, '');
  return s;
};
