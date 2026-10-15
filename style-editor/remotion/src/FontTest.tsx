import React from 'react';
import {AbsoluteFill} from 'remotion';
import './fonts';

const rows: [string, number, string][] = [
  ['Vazirmatn', 500, 'پژوهش گرگ چه‌قدر جی‌تی‌ای ۶'],
  ['Vazirmatn', 900, 'خبر جدید بازی'],
  ['Estedad', 900, 'پژوهش گرگ ژاله'],
  ['Lalezar', 400, 'میلیون نفر مرخصی'],
  ['NotoNastaliqUrdu', 400, 'عجیب‌ترین خبر'],
  ['ArefRuqaa', 700, 'پچ ژگ کی'],
  ['NotoKufiArabic', 900, 'گیم پچ'],
  ['BalooBhaijaan2', 800, 'پیشنهاد ویژه'],
  ['Anton', 400, 'NOBODY GTA VI'],
  ['Montserrat', 900, 'TEAM 26'],
  ['GreatVibes', 400, "Here's what"],
  ['BebasNeue', 400, 'ATTENTION'],
];

export const FontTest: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#222', padding: 40, color: 'white'}}>
    {rows.map(([f, w, t]) => (
      <div key={f + w} style={{fontFamily: f, fontWeight: w, fontSize: 90, direction: 'rtl', unicodeBidi: 'plaintext', lineHeight: 1.45}}>
        {t} <span style={{fontFamily: 'Inter', fontSize: 28, color: '#ff0'}}>{f} {w}</span>
      </div>
    ))}
  </AbsoluteFill>
);
