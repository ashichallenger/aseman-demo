import {continueRender, delayRender, staticFile} from 'remotion';

// family name -> list of [file, weight, style]
export const FONT_FILES: Record<string, [string, number, 'normal' | 'italic'][]> = {
  Vazirmatn: [300, 400, 500, 600, 700, 800, 900].map((w) => [`Vazirmatn-${w}.ttf`, w, 'normal']),
  Estedad: [300, 500, 700, 800, 900].map((w) => [`Estedad-${w}.ttf`, w, 'normal']),
  Lalezar: [['Lalezar-400.ttf', 400, 'normal']],
  NotoNastaliqUrdu: [['NotoNastaliqUrdu-400.ttf', 400, 'normal'], ['NotoNastaliqUrdu-700.ttf', 700, 'normal']],
  ArefRuqaa: [['ArefRuqaa-400.ttf', 400, 'normal'], ['ArefRuqaa-700.ttf', 700, 'normal']],
  NotoKufiArabic: [['NotoKufiArabic-900.ttf', 900, 'normal']],
  BalooBhaijaan2: [['BalooBhaijaan2-800.ttf', 800, 'normal']],
  Tajawal: [['Tajawal-500.ttf', 500, 'normal'], ['Tajawal-800.ttf', 800, 'normal']],
  Cairo: [['Cairo-600.ttf', 600, 'normal'], ['Cairo-900.ttf', 900, 'normal']],
  Lemonada: [['Lemonada-700.ttf', 700, 'normal']],
  Montserrat: [
    ['Montserrat-800.ttf', 800, 'normal'], ['Montserrat-900.ttf', 900, 'normal'],
    ['Montserrat-800-italic.ttf', 800, 'italic'], ['Montserrat-900-italic.ttf', 900, 'italic'],
  ],
  Poppins: [
    ['Poppins-500.ttf', 500, 'normal'], ['Poppins-600.ttf', 600, 'normal'],
    ['Poppins-600-italic.ttf', 600, 'italic'], ['Poppins-900.ttf', 900, 'normal'],
  ],
  Anton: [['Anton-400.ttf', 400, 'normal']],
  BebasNeue: [['BebasNeue-400.ttf', 400, 'normal']],
  Oswald: [['Oswald-700.ttf', 700, 'normal']],
  GreatVibes: [['GreatVibes-400.ttf', 400, 'normal']],
  AlexBrush: [['AlexBrush-400.ttf', 400, 'normal']],
  Lobster: [['Lobster-400.ttf', 400, 'normal']],
  Pacifico: [['Pacifico-400.ttf', 400, 'normal']],
  KaushanScript: [['KaushanScript-400.ttf', 400, 'normal']],
  Caveat: [['Caveat-700.ttf', 700, 'normal']],
  Inter: [300, 400, 500, 600].map((w) => [`Inter-${w}.ttf`, w, 'normal']),
  PlayfairDisplay: [
    ['PlayfairDisplay-900.ttf', 900, 'normal'], ['PlayfairDisplay-400-italic.ttf', 400, 'italic'],
    ['PlayfairDisplay-700-italic.ttf', 700, 'italic'],
  ],
  DMSerifDisplay: [['DMSerifDisplay-400.ttf', 400, 'normal']],
};

let loaded: Promise<void> | null = null;

export const loadAllFonts = (): Promise<void> => {
  if (loaded) return loaded;
  const ps: Promise<unknown>[] = [];
  for (const [family, files] of Object.entries(FONT_FILES)) {
    for (const [file, weight, style] of files) {
      const ff = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('truetype')`, {
        weight: String(weight),
        style,
      });
      ps.push(
        ff.load().then((f) => {
          (document.fonts as any).add(f);
        }),
      );
    }
  }
  loaded = Promise.all(ps).then(() => undefined);
  return loaded;
};

// Call once at module load: blocks rendering until every font is ready (no fallback renders).
const handle = delayRender('Loading fonts');
loadAllFonts()
  .then(() => continueRender(handle))
  .catch((e) => {
    // Fail hard: a render with fallback fonts is a failed render.
    throw e;
  });
