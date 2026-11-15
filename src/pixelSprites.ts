// Biblioteca de sprites Pixel Art estilo Stardew Valley (16x16, 20x20 e 24x24)
// Pre-renderizada em canvases offscreen para desempenho constante a 60 FPS com nitidez pixelada.

import type { BuildingType } from './types';

type PixelPalette = Record<string, string>;

const spriteCache = new Map<string, HTMLCanvasElement>();

function bakePixelMatrix(key: string, rows: string[], palette: PixelPalette): HTMLCanvasElement {
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const h = rows.length;
  const w = Math.max(1, ...rows.map((r) => r.length));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  spriteCache.set(key, canvas);
  return canvas;
}

// Paleta aconchegante pixel art (Moonlight Valley + NASA Artemis)
const PAL_TERRAIN_MOON: PixelPalette = {
  A: '#3d3f6b', // solo base suave
  B: '#464878', // variacao clara
  C: '#34365c', // sombra de pedrinha
  D: '#585b91', // brilho de cratera
  E: '#2a2b4d', // contorno escuro
  P: '#7e7394', // pedra quentinha
  Q: '#9c92b3', // topo pedra
};

const PAL_TERRAIN_MARS: PixelPalette = {
  A: '#8c4a32',
  B: '#9e563a',
  C: '#733824',
  D: '#b86c48',
  E: '#592919',
  P: '#c97d55',
  Q: '#e09b72',
};

const PAL_PATH: PixelPalette = {
  A: '#5f648f',
  B: '#7a80ad',
  C: '#494c70',
  D: '#949bc9',
};

const PAL_CRATER_RIM: PixelPalette = {
  A: '#2b2c4d',
  B: '#3a3d69',
  C: '#1f203b',
  D: '#4e5285',
};

const PAL_ICE: PixelPalette = {
  O: '#164e63', // borda escura
  D: '#0284c7', // agua profunda
  M: '#0ea5e9', // gelo medio
  L: '#67e8f9', // brilho ciano
  W: '#f0f9ff', // reflexo branco
};

const PAL_CRYSTAL: PixelPalette = {
  O: '#451a03', // contorno escuro
  R: '#78350f', // rocha base
  T: '#9a3412', // rocha clara
  G: '#f59e0b', // cristal ambar
  Y: '#fde047', // brilho dourado
  W: '#fef9c3', // faisca branca
};

const PAL_ASTRO: PixelPalette = {
  O: '#1e1b4b', // contorno pixel escuro (estilo Stardew)
  W: '#f8fafc', // traje branco
  S: '#cbd5e1', // sombra traje
  B: '#38bdf8', // visor azul ciano
  H: '#bae6fd', // reflexo visor
  C: '#f97316', // detalhes laranja NASA
  K: '#facc15', // ouro antena
  D: '#334155', // botas
};

const PAL_ROVER: PixelPalette = {
  O: '#1e1b4b',
  Y: '#facc15',
  A: '#d97706',
  B: '#38bdf8',
  W: '#f8fafc',
  D: '#1e293b',
  G: '#4ade80',
  R: '#ef4444',
};

const PAL_BUILDING: PixelPalette = {
  O: '#1a1638', // contorno escuro pixel art
  W: '#f8fafc', // parede branca espacial
  S: '#cbd5e1', // sombra cinza azulada
  D: '#64748b', // metal escuro
  N: '#2563eb', // azul NASA
  K: '#1d4ed8', // azul sombra
  C: '#38bdf8', // vidro ciano
  L: '#bae6fd', // brilho vidro
  Y: '#fde047', // janela dourada / energia
  G: '#f59e0b', // ambar / antena / madeira
  E: '#22c55e', // planta / vida verde
  P: '#86efac', // folha clara
  R: '#ef4444', // fruta / detalhe vermelho
  M: '#92400e', // terra plantio (Stardew soil)
  U: '#78350f', // borda canteiro
  T: '#a855f7', // nucleo energia / radar
};

export function getTerrainTileSprite(variant: number, isMars: boolean): HTMLCanvasElement {
  const pal = isMars ? PAL_TERRAIN_MARS : PAL_TERRAIN_MOON;
  const key = `tile_${isMars ? 'mars' : 'moon'}_${variant % 4}`;
  const v = variant % 4;

  const baseRows: string[][] = [
    [
      'AAAAAAAAAAAAAAAA',
      'AABAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAPQAAAAAAA',
      'AAAAAAACAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAABAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AACAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAABA',
      'AAAAAAAAAAAAAAAA',
      'AAAABAAAAAAAAAAA',
      'AAAAAAAAAAAPAAAA',
      'AAAAAAAAAAACAAAA',
      'AAAAAAAAAAAAAAAA',
    ],
    [
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAABAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAABAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AADAAAAAAAAAAAAA',
      'ACAAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAPQAAAAA',
      'AAAAAAAAACAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AABAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAABAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
    ],
    [
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAABAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAABAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAADDDAAAAAAA',
      'AAAAADCCCDAAAAAA',
      'AAAAAADDDAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAAAABAA',
      'AAAAAAAAAAAAAAAA',
      'AAAPQAAAAAAAAAAA',
      'AAACAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAABAAAAA',
      'AAAAAAAAAAAAAAAA',
    ],
    [
      'AAAAAAAAAAAAAAAA',
      'AAAAABAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAAAABAA',
      'AAAAAAAAAAAAAAAA',
      'AACAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAABAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAABAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAAABAAA',
      'AAAAAAAPQAAAAAAA',
      'AAAAAAACAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAAAAAAAAAAAA',
    ],
  ];

  return bakePixelMatrix(key, baseRows[v], pal);
}

export function getPathTileSprite(): HTMLCanvasElement {
  return bakePixelMatrix(
    'tile_path',
    [
      'CCCCCCCCCCCCCCCC',
      'CBBBBBACCBBBBBAC',
      'CBDDDDACCBBBBBAC',
      'CBAAAABCCAAAAABC',
      'CCCCCCCCCCCCCCCC',
      'CBABCCBBBBBACCBC',
      'CBABCCDDDDDACCBC',
      'CBABCCAAAAABCCBC',
      'CCCCCCCCCCCCCCCC',
      'CBBBBACCBBBBBBAC',
      'CDDDDACCBBBBDDAC',
      'CAAAABCCAAAAAABC',
      'CCCCCCCCCCCCCCCC',
      'CCBBBBBBACCBBBAC',
      'CCBBBBBDACCBBBAC',
      'CCCCCCCCCCCCCCCC',
    ],
    PAL_PATH
  );
}

export function getCraterCliffSprite(): HTMLCanvasElement {
  return bakePixelMatrix(
    'tile_cliff',
    [
      'CCCCCCCCCCCCCCCC',
      'CDDDDDDDDDDDDDDC',
      'DBBBBBBBBBBBBBBD',
      'DBBBBDDDDDDBBBBD',
      'DAAAAAAAAAAAAAAD',
      'DAAAAABBBBAAAAAD',
      'CCCCCCCCCCCCCCCC',
      'CBBBBBBBBBBBBBBC',
      'CBBDDDDCCDDDDBBC',
      'CAAAAAAAAAAAAAAC',
      'CCCCCCCCCCCCCCCC',
      'CAAAAAAAAAAAAAAC',
      'CBBBBBBBBBBBBBBC',
      'CAAAAAAAAAAAAAAC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
    ],
    PAL_CRATER_RIM
  );
}

export function getEarthSprite(): HTMLCanvasElement {
  return bakePixelMatrix(
    'pixel_earth',
    [
      '.....OOOOOO.....',
      '...OOBBBGGGOO...',
      '..OBBBBBGGGGGO..',
      '.OBWWBBBBGGGGBO.',
      '.OBBBBWWBBGGGGO.',
      'OBBBGGGGGBBWWBBO',
      'OBBGGGGGGGBBBBBO',
      'OBBGGGGGGBBWWBBO',
      'OBBBGGGGBBBBBBBO',
      'OBBBBBBBBBGGGGBO',
      '.OBBWWWBBBGGGGO.',
      '.OBBBBBBBBBGBBO.',
      '..OOBBBBBBBBBOO.',
      '...OOOBBBBBBOO..',
      '.....OOOOOO.....',
      '................',
    ],
    {
      O: '#38bdf8',
      B: '#2563eb',
      G: '#22c55e',
      W: '#f8fafc',
    }
  );
}

export function getNodeSprite(type: 'ice_crater' | 'regolith_vein', frame: number): HTMLCanvasElement {
  if (type === 'ice_crater') {
    const f = frame % 2;
    const rows =
      f === 0
        ? [
            '....OOOOOOOO....',
            '..OOLLLLLLLLOO..',
            '.OLLMMMMMMMMLLO.',
            '.OLMMWWMMMMMMLO.',
            'OLMMWWMMDDDMMMLO',
            'OLMMMMMDDDDDMLLO',
            'ODMMMDDDDWDDMMDO',
            'ODMMMDDDDDDMMMDO',
            '.ODMMMMMMMMMMDO.',
            '.OLMMMMMMMMMMLO.',
            '..OOMMMMMMMMOO..',
            '....OOOOOOOO....',
            '......LLLL......',
            '.....LWWWWL.....',
            '......LLLL......',
            '................',
          ]
        : [
            '....OOOOOOOO....',
            '..OOLLLLLLLLOO..',
            '.OLLMMMMMMMMLLO.',
            '.OLMMMMMMMWWMLO.',
            'OLMMMMMDDDDWWMLO',
            'OLMMMDDDDDDMMLLO',
            'ODMMWWDDDDDDMMDO',
            'ODMMMDDDDDDMMMDO',
            '.ODMMMMMMMMMMDO.',
            '.OLMMMWWMMMMMLO.',
            '..OOMMMMMMMMOO..',
            '....OOOOOOOO....',
            '.......LL.......',
            '......LWWL......',
            '.......LL.......',
            '................',
          ];
    return bakePixelMatrix(`node_ice_${f}`, rows, PAL_ICE);
  }

  const f = frame % 2;
  const rows =
    f === 0
      ? [
          '......OO........',
          '.....OGYO.......',
          '....OGWGYO..OO..',
          '....OGGGYO.OGYO.',
          '..OOORGGROOGWYO.',
          '.ORTTRRROOOGGRO.',
          'ORTTGGGGTTTRRRO.',
          'ORRGGWYGTTTRRRO.',
          'ORRGGGGTTTTTTRO.',
          'ORRRRRRRRRRRRRO.',
          '.ORRRRRRRRRRRO..',
          '..OOOOOOOOOOO...',
          '......YY........',
          '................',
          '................',
          '................',
        ]
      : [
          '......OO........',
          '.....OGYO.......',
          '....OGGGYO..OO..',
          '....OGWGYO.OGYO.',
          '..OOORGGROOGGYO.',
          '.ORTTRRROOOGWRO.',
          'ORTTGGGGTTTRRRO.',
          'ORRGGGGTTTTRRRO.',
          'ORRGWYGGTTTTTRO.',
          'ORRRRRRRRRRRRRO.',
          '.ORRRRRRRRRRRO..',
          '..OOOOOOOOOOO...',
          '.......WW.......',
          '................',
          '................',
          '................',
        ];
  return bakePixelMatrix(`node_reg_${f}`, rows, PAL_CRYSTAL);
}

export function getDropSprite(type: 'supply_pod' | 'meteorite_crystal', frame: number): HTMLCanvasElement {
  const f = frame % 2;
  if (type === 'supply_pod') {
    const pal: PixelPalette = {
      O: '#1e1b4b',
      W: '#f8fafc',
      B: '#38bdf8',
      R: '#ef4444',
      Y: '#facc15',
      C: '#d97706',
      M: '#f59e0b',
    };
    return bakePixelMatrix(
      `drop_pod_${f}`,
      [
        '....OOOOOOOO....',
        '..OOWWWBBWWWOO..',
        '.OWWWWBBBBWWWWO.',
        '.OWWRRRRRRRRWWOO',
        '..O..O....O..O..',
        '...O..O..O..O...',
        '....OOOOOOOO....',
        '....OMMRRMMO....',
        '....OMMRRMMO....',
        '....ORRRRRRO....',
        '....OCCRRCCO....',
        '....OCCYYCCO....',
        '....OCCCCCC0....'.replace('0', 'O'),
        '....OOOOOOOO....',
        f === 0 ? '..Y..........Y..' : '...Y........Y...',
        '................',
      ],
      pal
    );
  }
  const pal: PixelPalette = {
    O: '#1e1b4b',
    P: '#c084fc',
    D: '#7e22ce',
    Y: '#fde047',
    W: '#ffffff',
  };
  return bakePixelMatrix(
    `drop_met_${f}`,
    [
      '.......OO.......',
      '......OPPO......',
      '.....OPWWPO.....',
      '....OPPYYPPO....',
      '...OPPPYYPPPO...',
      '...ODPPYYPPDO...',
      '....ODPPPPDO....',
      '.....ODPPDO.....',
      '......ODDO......',
      '.......OO.......',
      f === 0 ? '...Y........Y...' : '....W......W....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
    pal
  );
}

export function getAstronautSprite(
  facingRight: boolean,
  walkFrame: number,
  carryResource: 'water' | 'oxygen' | 'regolith' | 'food' | 'energy' | null,
  isWorking: boolean
): HTMLCanvasElement {
  const f = walkFrame % 2;
  const dir = facingRight ? 'R' : 'L';
  const work = isWorking ? 'W' : 'I';
  const key = `astro_${dir}_${f}_${work}`;

  // 16x20 chibi astronaut estilo Stardew Valley
  const rowsBase = [
    '......OOOO......',
    '....OOWWWWOO....',
    '...OWWWWWWWWO...',
    '...OWBBBBBBWO...',
    '...OWBHHHBBWO...',
    '...OWBBBBBBWO...',
    '....OOWWWWOO....',
    '....OOCCCCOO....',
    '...OWWWWWWWWO...',
    f === 0 ? '..OWWCCWWCCWWO..' : '...OWCCWWCCWO...',
    f === 0 ? '..OSWCCCCCCWSO..' : '..OWSCCCCCCSWO..',
    '...OOWWWWWWO....',
    '....OOWWWWOO....',
    f === 0 ? '....OOD..DOO....' : '.....OD..DO.....',
    f === 0 ? '...ODDO..ODDO...' : '....ODO..ODO....',
    '................',
  ];

  // Se estiver trabalhando, adiciona ferramente pixelada na mao
  if (isWorking) {
    rowsBase[7] = f === 0 ? '..K.OOCCCCOO....' : '....OOCCCCOO.K..';
    rowsBase[8] = f === 0 ? '..KKOWWWWWWWWO..' : '...OWWWWWWWWOKK.';
  }

  let rows = rowsBase;
  if (!facingRight) {
    rows = rowsBase.map((r) => r.split('').reverse().join(''));
  }

  // Sem carry desenhamos por cima no renderer para flexibilidade ou cache rapido
  void carryResource;
  return bakePixelMatrix(key, rows, PAL_ASTRO);
}

export function getCarryIconSprite(res: 'water' | 'oxygen' | 'regolith' | 'food' | 'energy'): HTMLCanvasElement {
  if (res === 'oxygen') {
    return bakePixelMatrix(
      'carry_o2',
      [
        '..OOOOOO..',
        '.OLLLLLLO.',
        '.OLWWWWLO.',
        '.OLMMMMMO.',
        '.ODDDDDDO.',
        '..OOOOOO..',
      ],
      PAL_ICE
    );
  }
  if (res === 'food') {
    return bakePixelMatrix(
      'carry_food',
      [
        '...OEEO...',
        '..OEPPPO..',
        '.ORRRRRRO.',
        '.ORWWWRRO.',
        '..ORRRRO..',
        '...OOOO...',
      ],
      PAL_BUILDING
    );
  }
  return bakePixelMatrix(
    'carry_reg',
    [
      '..OOOOOO..',
      '.OGYYYYGO.',
      '.OGGWWGGO.',
      '.ORGGGGRO.',
      '..OOOOOO..',
    ],
    PAL_CRYSTAL
  );
}

export function getRoverSprite(facingRight: boolean, frame: number): HTMLCanvasElement {
  const f = frame % 2;
  const rowsBase = [
    '......K.........'.replace('K', 'Y'),
    '......O.........',
    '....OOOOOO......',
    '...OYYYYYYO.....',
    '..OYYBBBBYYO....',
    '..OYYWWWWYYO....',
    '.OOOOOOOOOOOO...',
    '.OAAAAAAAAAAO...',
    f === 0 ? '.ODDODDDODDD0...'.replace('0', 'O') : '..ODDODDDODDO...',
    f === 0 ? '..OO..OO..OO....' : '..OO..OO..OO....',
    '................',
  ];
  const rows = facingRight ? rowsBase : rowsBase.map((r) => r.split('').reverse().join(''));
  return bakePixelMatrix(`rover_${facingRight ? 'R' : 'L'}_${f}`, rows, PAL_ROVER);
}

export function getEmoteBubbleSprite(icon: 'heart' | 'water' | 'plant' | 'pick' | 'star'): HTMLCanvasElement {
  const pal: PixelPalette = {
    O: '#1e1b4b',
    W: '#fffbeb',
    R: '#ef4444',
    B: '#0ea5e9',
    G: '#22c55e',
    Y: '#facc15',
  };
  let inner = [
    '.OWWWWWWWWO.',
    '.OWRWWWWWRWO',
    '.OWRRRRRRWO.',
    '.OWWRRRRWWOO',
  ];
  if (icon === 'heart') {
    inner = [
      '.OWRRWWRRWO.',
      '.ORRRRRRRRO.',
      '.OWRRRRRRWO.',
      '.OWWWRRWWWO.',
    ];
  } else if (icon === 'water') {
    inner = [
      '.OWWWBBWWWO.',
      '.OWWBBBBWWO.',
      '.OWBBBBBBWO.',
      '.OWWBBBBWWO.',
    ];
  } else if (icon === 'plant') {
    inner = [
      '.OWGGGGGGWO.',
      '.OWWGGGGWWO.',
      '.OWWWGGWWWO.',
      '.OWWWGGWWWO.',
    ];
  } else if (icon === 'star') {
    inner = [
      '.OWWWYYWWWO.',
      '.OWYYYYYYWO.',
      '.OWWWYYWWWO.',
      '.OWYYWWYYWO.',
    ];
  } else {
    inner = [
      '.OWYYYYYYWO.',
      '.OWWYYYYWWO.',
      '.OWWWOOWWWO.',
      '.OWWWOOWWWO.',
    ];
  }
  return bakePixelMatrix(
    `emote_${icon}`,
    [
      '..OOOOOOOO..',
      '.OWWWWWWWWO.',
      ...inner,
      '.OWWWWWWWWO.',
      '..OOOOWOOO..',
      '.....OO.....',
    ],
    pal
  );
}

// Sprites 24x24 detalhados de cada construcao estilo Stardew Valley
export function getBuildingSprite(type: BuildingType, frame: number, isNight: boolean): HTMLCanvasElement {
  const f = frame % 2;
  const win = isNight ? 'Y' : 'C';
  const key = `bld_${type}_${f}_${isNight ? 'N' : 'D'}`;

  if (type === 'command_center') {
    const flag1 = f === 0 ? 'NNNN' : '.NNN';
    const flag2 = f === 0 ? 'NNWN' : '.NNW';
    const rows = [
      `.......O${flag1}O...........`,
      `.......O${flag2}O...........`,
      '.......O................',
      '.......O................',
      '.....OOOOOO.............',
      '....OWWWWWWO....OOO.....',
      '...OWWNNNNWWO..OYYYO....',
      '..OWWNCCCCNWWO..OGO.....',
      '..OWWNNNNNNWWO..OOO.....',
      '.OOWWWWWWWWWWO..ODO.....',
      '.OWWGGGGGGGGWWO.ODO.....',
      f === 0
        ? `.OWW${win}${win}NN${win}${win}WWO.ODO.....`
        : `.OWW${win}YNN${win}YWWO.ODO.....`,
      '.OWWWWWWWWWWWWO.ODO.....',
      '.OSSGGGGGGGGSSOODOO.....',
      'OSSSSSSSSSSSSSSOOOOO....',
      'OSDDDDDDDDDDDDSSDDDO....',
      'OSDDDDGGGGDDDDSSDDDO....',
      'ODDDDDDDDDDDDDDDDDDO....',
      'OOOOOOOOOOOOOOOOOOOO....',
      '.DDDDDDDDDDDDDDDDDD.....',
    ];
    return bakePixelMatrix(key, rows.map((r) => r.slice(0, 20)), PAL_BUILDING);
  }

  if (type === 'solar_array') {
    const glint = f === 0 ? 'LCNNCLNN' : 'NNLCNNLC';
    const rows = [
      '................',
      '..OOOOOOOOOOOO..',
      '.ONNNNNNNNNNNNO.',
      `.ONN${glint}NNO.`,
      '.ONNNNNNNNNNNNO.',
      `.ONN${glint}NNO.`,
      '.ONNNNNNNNNNNNO.',
      '..OOOOOOOOOOOO..',
      '......OGGO......',
      '......OGGO......',
      '.....OSSSSO.....',
      '....ODDDDDDO....',
      '....OOOOOOOO....',
      f === 0 ? '..Y..........Y..' : '................',
      '................',
      '................',
    ];
    return bakePixelMatrix(key, rows, PAL_BUILDING);
  }

  if (type === 'ice_extractor') {
    const bob = f === 0;
    const rows = [
      '.....OOOOOO.....',
      '....OWWWWWWO....',
      '....OWCCCCWO....',
      '....OWCCCCWO....',
      '...OOWLLLLWOO...',
      '...OWCCWWCCWO...',
      '...OSSSSSSSSO...',
      bob ? '....ODDDDDDO....' : '....OCCCCCC0....'.replace('0', 'O'),
      '.....OCCCCO.....',
      bob ? '......OLLO......' : '.....OLLLL0.....'.replace('0', 'O'),
      '......ODDO......',
      '...OOCCCCCCOO...',
      '..OCLLLLLLCCCO..',
      '..OCCCCCCCCCCO..',
      '...OOOOOOOOOO...',
      '................',
    ];
    return bakePixelMatrix(key, rows, PAL_BUILDING);
  }

  if (type === 'hydroponics') {
    // Horta Lunar / Estufa Stardew Valley com plantinhas e morangos crescendo!
    const leaf = f === 0 ? 'P' : 'E';
    const fruit = f === 0 ? 'R' : 'Y';
    const rows = [
      '....OOOOOOOO....',
      '..OOCCCCCCCCOO..',
      '.OCLLLLLLLLLLCO.',
      '.OCLLWWWWWWLLCO.',
      'OCLCCCCCCCCCCLCO',
      `OC.${leaf}E.${leaf}E.${leaf}E..CO`,
      `OC.E${fruit}E.E${fruit}E.E${fruit}E.CO`,
      'OC.MMM.MMM.MMMCO',
      'OUUUUUUUUUUUUUUO',
      'OUMMMMMMMMMMMMUO',
      'OUUUUUUUUUUUUUUO',
      'OSSSSSSSSSSSSSSO',
      'ODDDDDDDDDDDDDDO',
      'OOOOOOOOOOOOOOOO',
      '................',
      '................',
    ];
    return bakePixelMatrix(key, rows, PAL_BUILDING);
  }

  if (type === 'habitat_pod') {
    const smoke = f === 0 ? '....WW..........' : '.....WW.........';
    const rows = [
      smoke,
      '.....OO.........',
      '....OOOOOO......',
      '..OORRRRRROO....',
      '.ORRRRRRRRRRRO..',
      '.ORRWWWWWWWWRRO.',
      'OOWWWWWWWWWWWWOO',
      `OWWW${win}${win}WW${win}${win}WWWO`,
      `OWWW${win}${win}WW${win}${win}WWWO`,
      'OWWWWWGGGGWWWWWO',
      'OWWWWWGGGGWWWWWO',
      'OSSSSSGGGGSSSSSO',
      'ODDDDDGGGGDDDDDO',
      'OOOOOOOOOOOOOOOO',
      '................',
      '................',
    ];
    return bakePixelMatrix(key, rows, PAL_BUILDING);
  }

  if (type === 'regolith_printer') {
    const spark = f === 0 ? 'YY' : 'RG';
    const rows = [
      '................',
      '..OOOOOOOOOOOO..',
      '.OGGGGGGGGGGGGO.',
      '.OGWWGGGGGGWWGO.',
      '.OGGGGGGGGGGGGO.',
      '..OSSSSSSSSSSO..',
      '..OSDDDDDDDDDO..',
      `..OSDD${spark}DDDDDO..`,
      '..OSDGGGGGGDDO..',
      '..OSSSSSSSSSSO..',
      '.ODDDDDDDDDDDDO.',
      '.OOOOOOOOOOOOOO.',
      '................',
      '................',
      '................',
      '................',
    ];
    return bakePixelMatrix(key, rows, PAL_BUILDING);
  }

  if (type === 'radiation_bunker') {
    const core = f === 0 ? 'LL' : 'CC';
    const rows = [
      '......OOOO......',
      `.....OO${core}OO.....`,
      '....OONNNNOO....',
      '..OONNNNNNNNOO..',
      '.ONNCCCCCCCCNNO.',
      '.ONDDDDDDDDDDNO.',
      'ODDDDDCCCCDDDDDO',
      'ODDDCCCCCCCCDDDO',
      'ODDDDDGGGGDDDDDO',
      'OSSSSSSSSSSSSSSO',
      'ODDDDDDDDDDDDDDO',
      'OOOOOOOOOOOOOOOO',
      '................',
      '................',
      '................',
      '................',
    ];
    return bakePixelMatrix(key, rows.map((r) => r.slice(0, 16)), PAL_BUILDING);
  }

  if (type === 'dsn_antenna') {
    const sig = f === 0 ? 'C' : 'Y';
    const rows = [
      `.......${sig}........`,
      `......${sig}.${sig}.......`,
      '.....OOOOOO.....',
      '....OWWWWWWO....',
      '...OWCCCCCCWO...',
      '...OWCCYYCCWO...',
      '....OCCCCCC0....'.replace('0', 'O'),
      '.....OOOOOO.....',
      '......ODDO......',
      '.....ODDDDO.....',
      '....ODDDDDDO....',
      '...OSSSSSSSSO...',
      '..ODDDDDDDDDDO..',
      '..OOOOOOOOOOOO..',
      '................',
      '................',
    ];
    return bakePixelMatrix(key, rows, PAL_BUILDING);
  }

  // kilopower
  const glow = f === 0 ? 'LL' : 'YY';
  return bakePixelMatrix(
    key,
    [
      '....OOOOOOOO....',
      '...OSSSSSSSSO...',
      '..OSDDDDDDDDSO..',
      `..OSDD${glow}${glow}DDSO..`,
      `..OSDD${glow}${glow}DDSO..`,
      '..OSDDDDDDDDSO..',
      '...OSSSSSSSSO...',
      '..OONNNNNNNNOO..',
      '.ONNNNNNNNNNNNO.',
      '.ODDDDDDDDDDDDO.',
      '.OOOOOOOOOOOOOO.',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
    PAL_BUILDING
  );
}

const iconDataUrlCache = new Map<string, string>();
export function getBuildingPixelIconUrl(type: BuildingType): string {
  const cached = iconDataUrlCache.get(type);
  if (cached) return cached;
  const sprite = getBuildingSprite(type, 0, false);
  const url = sprite.toDataURL();
  iconDataUrlCache.set(type, url);
  return url;
}
