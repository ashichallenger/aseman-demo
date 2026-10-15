import React from 'react';
import type {Ctx, TP} from '../core/Edit';
import {sayeStyle} from './saye';
import {zarbeStyle} from './zarbe';
import {majalleStyle} from './majalle';
import {neonStyle} from './neon';

export type StyleModule = {
  treatments: Record<string, React.FC<TP>>;
  wrapperStyle?: (frame: number, ctx: Ctx) => React.CSSProperties;
  baseStyle?: (frame: number, ctx: Ctx) => React.CSSProperties;
  Grade?: React.FC<{frame: number; ctx: Ctx}>;
  Overlay?: React.FC<{frame: number; ctx: Ctx}>;
  Outro?: React.FC<{frame: number; start: number; ctx: Ctx}>;
};

export const STYLES: Record<string, StyleModule> = {
  saye: sayeStyle,
  zarbe: zarbeStyle as StyleModule,
  majalle: majalleStyle as StyleModule,
  neon: neonStyle as StyleModule,
};
