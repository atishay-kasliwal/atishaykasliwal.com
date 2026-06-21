import { useEffect, useRef } from 'react';

// ─── Birth moment ────────────────────────────────────────────────────────────
// June 18 1999, 12:05 AM IST  →  June 17 1999, 18:35 UTC
// Ujjain, Madhya Pradesh, India: 23.1765°N, 75.7885°E
const BIRTH_JD  = 2451347.2743; // Julian Date
const OBS_LAT   = 23.1765;      // degrees N
const OBS_LON   = 75.7885;      // degrees E

// ─── Astronomy helpers ───────────────────────────────────────────────────────
function gmst(jd) {
  const T  = (jd - 2451545.0) / 36525;
  const g  = 280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T
    - (T * T * T) / 38710000;
  return ((g % 360) + 360) % 360;
}

function raDecToAltAz(ra_h, dec_d, lst_d, lat_d) {
  const D2R  = Math.PI / 180;
  const ha   = (lst_d - ra_h * 15) * D2R;
  const dec  = dec_d  * D2R;
  const lat  = lat_d  * D2R;
  const sinA = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt  = Math.asin(Math.max(-1, Math.min(1, sinA)));
  const cosZ = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  let az = Math.acos(Math.max(-1, Math.min(1, cosZ)));
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;
  return { alt: alt / D2R, az: az / D2R };
}

const LST = ((gmst(BIRTH_JD) + OBS_LON) % 360 + 360) % 360;

// ─── Star catalog  [name, RA_hours, Dec_degrees, Vmag] ───────────────────────
// Yale Bright Star Catalog subset — all Vmag < 3.5 visible from India
const CATALOG = [
  ['Sirius',         6.7525, -16.716, -1.46],
  ['Canopus',        6.3992, -52.696, -0.72],
  ['Arcturus',      14.2612,  19.182, -0.04],
  ['Rigil Kent',    14.6600, -60.835, -0.27],
  ['Vega',          18.6157,  38.784,  0.03],
  ['Capella',        5.2775,  45.998,  0.08],
  ['Rigel',          5.2423,  -8.202,  0.12],
  ['Procyon',        7.6553,   5.225,  0.34],
  ['Achernar',       1.6285, -57.237,  0.46],
  ['Betelgeuse',     5.9195,   7.407,  0.50],
  ['Hadar',         14.0637, -60.373,  0.61],
  ['Altair',        19.8460,   8.868,  0.76],
  ['Acrux',         12.4433, -63.099,  0.76],
  ['Aldebaran',      4.5987,  16.509,  0.85],
  ['Antares',       16.4901, -26.432,  0.96],
  ['Spica',         13.4198, -11.161,  0.97],
  ['Pollux',         7.7553,  28.026,  1.14],
  ['Fomalhaut',     22.9608, -29.622,  1.16],
  ['Deneb',         20.6905,  45.280,  1.25],
  ['Mimosa',        12.7954, -59.689,  1.25],
  ['Regulus',       10.1395,  11.967,  1.35],
  ['Adhara',         6.9771, -28.972,  1.50],
  ['Castor',         7.5766,  31.888,  1.57],
  ['Gacrux',        12.5194, -57.113,  1.59],
  ['Shaula',        17.5601, -37.103,  1.62],
  ['Bellatrix',      5.4188,   6.350,  1.64],
  ['Elnath',         5.4381,  28.607,  1.65],
  ['Alnilam',        5.6036,  -1.202,  1.69],
  ['Alioth',        12.9004,  55.960,  1.76],
  ['Mirfak',         3.4053,  49.861,  1.79],
  ['Dubhe',         11.0621,  61.751,  1.79],
  ['Kaus Australis',18.4028, -34.384,  1.85],
  ['Sargas',        17.6222, -42.998,  1.86],
  ['Alkaid',        13.7921,  49.313,  1.86],
  ['Atria',         16.8113, -69.028,  1.91],
  ['Peacock',       20.4277, -56.735,  1.94],
  ['Alhena',         6.6285,  16.399,  1.93],
  ['Mirzam',         6.3785, -17.956,  1.98],
  ['Alphard',        9.4597,  -8.659,  1.98],
  ['Polaris',        2.5303,  89.264,  1.97],
  ['Alnair',        22.1373, -46.961,  1.74],
  ['Hamal',          2.1195,  23.462,  2.00],
  ['Nunki',         18.9211, -26.297,  2.02],
  ['Menkent',       14.1114, -36.370,  2.06],
  ['Saiph',          5.7957,  -9.670,  2.07],
  ['Kochab',        14.8451,  74.156,  2.07],
  ['Rasalhague',    17.5822,  12.560,  2.08],
  ['Denebola',      11.8174,  14.572,  2.14],
  ['Muhlifain',     14.5913, -42.158,  2.20],
  ['Izar',          14.7498,  27.074,  2.35],
  ['Wezen',          7.1397, -26.393,  1.83],
  ['Dschubba',      16.0055, -22.622,  2.32],
  ['Eps Scorpii',   16.8354, -34.293,  2.29],
  ['Alphecca',      15.5782,  26.715,  2.21],
  ['Algieba',       10.3330,  19.842,  2.61],
  ['Porrima',       12.6943,  -1.449,  2.74],
  ['Muphrid',       13.9116,  18.398,  2.68],
  ['Sabik',         17.1731, -15.725,  2.43],
  ['Ascella',       19.0430, -29.880,  2.60],
  ['Kaus Media',    18.3516, -29.828,  2.70],
  ['Merak',         11.0307,  56.382,  2.37],
  ['Phecda',        11.8971,  53.695,  2.44],
  ['Mizar',         13.3992,  54.925,  2.23],
  ['Acrab',         15.9483, -19.806,  2.56],
  ['Tau Scorpii',   16.5987, -28.216,  2.82],
  ['Kaus Borealis', 18.3479, -21.059,  2.81],
  ['Lesath',        17.5308, -37.296,  2.70],
  ['Eta Ophiuchi',  17.7246,   4.567,  2.76],
  ['Alnasl',        18.0966, -30.424,  2.98],
  ['Zeta Ophiuchi', 16.6194, -10.567,  2.56],
  ['Vindemiatrix',  13.0363,  10.959,  2.83],
  ['Zubenelgenubi', 14.8450, -15.998,  2.75],
  ['Miaplacidus',    9.2198, -69.717,  1.67],
  ['Avior',          8.3752, -59.509,  1.86],
  ['Suhail',         9.1332, -43.433,  2.21],
  ['Regor',          8.1591, -47.337,  1.72],
  ['Aludra',         7.4013, -29.303,  2.45],
  ['Pi Puppis',      7.2861, -37.097,  2.71],
  ['Rho Puppis',     8.1253, -24.304,  2.81],
  ['Zeta Puppis',    8.0597, -40.003,  2.25],
  ['Naos',           8.0597, -40.003,  2.25],
  ['Tureis',         8.1253, -24.304,  2.81],
  ['Aspidiske',      9.2846, -59.275,  2.25],
  ['Mu Velorum',    10.7796, -49.420,  2.69],
  ['Delta Velorum', 10.7796, -49.420,  2.00],
  ['Lambda Velorum', 9.1332, -43.433,  2.21],
  ['Kappa Velorum',  9.3687, -55.011,  2.47],
  ['Alp2 Librae',   14.8450, -15.998,  2.75],
  // dim fill stars for Milky Way band density
  ['Alp Lup',       14.6980, -47.388,  2.30],
  ['Bet Lup',       15.2048, -43.134,  2.68],
  ['Gam Lup',       15.5859, -41.167,  2.78],
  ['Del Lup',       15.3561, -40.648,  3.22],
  ['Eps Lup',       15.3796, -44.690,  3.37],
  ['Alp Ara',       17.5308, -49.876,  2.84],
  ['Bet Ara',       17.4219, -55.530,  2.84],
  ['Zeta Ara',      16.9773, -55.990,  3.13],
  ['Gam Ara',       17.4219, -56.378,  3.34],
  ['Eta Ara',       17.5308, -49.876,  3.76],
  ['Theta Sco',     17.6222, -42.998,  1.87],
  ['Mu Sco',        16.8618, -38.047,  3.00],
  ['Kap Sco',       17.7081, -39.030,  2.41],
  ['G Sco',         17.7930, -37.043,  3.19],
  ['Q Sco',         17.7930, -40.127,  3.03],
  ['Ups Sco',       17.5126, -37.296,  2.70],
  ['Lam Sco',       17.5601, -37.103,  1.62],
  ['Pi Sco',        15.9812, -26.114,  2.89],
  ['Rho Sco',       16.0055, -29.214,  3.88],
  ['Sig Sco',       16.3524, -25.593,  2.89],
  ['Omi1 Sco',      16.8354, -24.178,  3.20],
  ['Xi Sco',        16.1989, -11.374,  4.16],
  ['Yed Prior',     16.2353,  -3.694,  2.73],
  ['36 Oph',        17.2995, -26.603,  5.08],
  ['Alp Oph',       17.5822,  12.560,  2.08],
  ['Bet Oph',       17.7246,   4.567,  2.76],
  ['Del Oph',       16.2353,  -3.694,  2.73],
  ['Eps Oph',       16.3054,  -4.693,  3.24],
  ['Zeta Oph',      16.6194, -10.567,  2.56],
  ['Eta Oph',       17.1731, -15.725,  2.43],
  ['The Oph',       17.3661,  -2.996,  3.27],
  ['Iot Oph',       17.6905,  10.156,  4.38],
  ['Kap Oph',       16.9614,   9.375,  3.20],
  ['Lam Oph',       16.5189,   1.984,  3.82],
  ['Nu Oph',        17.9836,  -9.773,  3.34],
  ['Xi Oph',        18.0105,  -7.900,  4.39],
  ['72 Oph',        18.1265,   9.563,  3.73],
  ['Phi Oph',       16.9610, -16.636,  4.28],
  ['Alp Ser',       15.7377,   6.426,  2.63],
  ['Bet Ser',       15.7711,  15.422,  3.67],
  ['Gam Ser',       15.9407,  15.661,  3.85],
  ['Del Ser',       15.5782,  10.538,  3.80],
  ['Eps Ser',       15.8494,   4.478,  3.71],
  ['Sig Ser',       16.1069,  -2.899,  3.62],
  ['Alp CrB',       15.5782,  26.715,  2.21],
  ['Bet CrB',       15.4630,  29.105,  3.66],
  ['Gam CrB',       15.7020,  26.296,  3.83],
  ['Del CrB',       15.8272,  26.069,  4.63],
  ['Eps CrB',       15.9593,  26.878,  4.15],
  ['Zeta CrB',      15.9593,  36.636,  4.98],
  ['Iot CrB',       16.0241,  29.851,  4.99],
  ['Alp Her',       17.2442,  14.390,  3.48],
  ['Bet Her',       16.5039,  21.490,  2.77],
  ['Gam Her',       16.3657,  19.153,  3.75],
  ['Del Her',       17.2500,  24.839,  3.14],
  ['Eps Her',       17.0050,  30.926,  3.92],
  ['Zeta Her',      16.6883,  31.602,  2.81],
  ['Eta Her',       16.7148,  38.922,  3.53],
  ['The Her',       17.9376,  37.145,  3.86],
  ['Iot Her',       17.6574,  46.006,  3.80],
  ['Kap Her',       16.7773,  17.047,  5.00],
  ['Lam Her',       17.5126,  26.110,  4.41],
  ['Mu Her',        17.7746,  27.721,  3.42],
  ['Nu Her',        17.9751,  30.189,  4.41],
  ['Xi Her',        17.9622,  29.248,  3.70],
  ['Omi Her',       18.1239,  28.763,  3.83],
  // Sagittarius stars
  ['Phi Sgr',       18.4600, -26.987,  3.17],
  ['Tau Sgr',       19.1153, -27.670,  3.32],
  ['Zeta Sgr',      19.0437, -29.880,  2.60],
  ['Omi Sgr',       19.0785, -21.742,  3.77],
  ['Pi Sgr',        19.1648, -21.023,  2.89],
  ['Rho1 Sgr',      19.3611, -17.848,  3.93],
  ['Eps Sgr',       18.4028, -34.384,  1.85],
  ['Eta Sgr',       18.2930, -36.762,  3.11],
  ['Lam Sgr',       18.4665, -25.422,  2.81],
  ['Mu Sgr',        18.2294, -21.058,  3.84],
  ['Del Sgr',       18.3499, -29.828,  2.70],
  ['Gam Sgr',       18.0966, -30.424,  2.98],
  ['Bet1 Sgr',      19.3766, -44.459,  4.01],
  ['Alp Sgr',       19.3928, -40.616,  3.97],
  ['Bet2 Sgr',      19.3869, -44.459,  4.29],
  // fill stars for Milky Way
  ['V Sgr',         18.8659, -29.248,  4.61],
  ['W Sgr',         18.0540, -29.574,  4.29],
  ['X Sgr',         17.7995, -27.830,  4.55],
  ['Y Sgr',         18.3201, -18.873,  5.37],
  ['9 Sgr',         18.0177, -24.364,  5.97],
  ['HV Sgr',        18.5295, -17.822,  5.00],
  ['Alp Sct',       18.5869,  -8.244,  3.85],
  ['Bet Sct',       18.7865, -10.258,  4.22],
  ['Del Sct',       18.7046,  -9.052,  4.71],
  ['Gam Sct',       18.4897,  -14.566, 4.70],
  ['Eps Sct',       18.7228, -14.285,  4.90],
  ['Alp Aql',       19.8460,   8.868,  0.76],
  ['Bet Aql',       19.9217,   6.407,  3.71],
  ['Gam Aql',       19.7715,  10.613,  2.72],
  ['Del Aql',       19.4254,   3.115,  3.36],
  ['Eps Aql',       18.9942,  15.068,  4.02],
  ['Zeta Aql',      19.0902,  13.864,  2.99],
  ['Eta Aql',       19.8736,   1.006,  3.87],
  ['Lam Aql',       19.1066,  -4.883,  3.44],
  ['Alp Lyr',       18.6157,  38.784,  0.03],
  ['Bet Lyr',       18.8341,  33.363,  3.45],
  ['Gam Lyr',       18.9822,  32.690,  3.25],
  ['Del Lyr',       18.9083,  36.898,  4.30],
  ['Zeta1 Lyr',     18.7453,  37.606,  4.34],
  ['Eps1 Lyr',      18.7396,  39.673,  4.66],
  ['Iot Lyr',       19.0979,  36.064,  5.28],
  ['Kap Lyr',       18.9560,  36.065,  4.33],
  ['Lam Lyr',       19.1090,  32.146,  4.93],
  ['Mu Lyr',        19.2300,  31.000,  5.11],
  ['Alp Cyg',       20.6905,  45.280,  1.25],
  ['Bet Cyg',       19.5122,  27.960,  3.08],
  ['Gam Cyg',       20.3705,  40.257,  2.23],
  ['Del Cyg',       19.7495,  45.131,  2.87],
  ['Eps Cyg',       20.7702,  33.970,  2.46],
  ['Zeta Cyg',      21.2157,  30.227,  3.20],
  ['Eta Cyg',       19.9382,  35.084,  3.89],
  ['Iot Cyg',       21.7228,  51.730,  3.79],
  ['Kap Cyg',       19.7486,  53.368,  3.77],
  ['Lam Cyg',       20.7900,  36.494,  4.53],
  ['Nu Cyg',        20.9697,  41.168,  3.94],
  ['Xi Cyg',        21.0793,  43.924,  3.72],
  ['Omi1 Cyg',      20.1386,  46.744,  3.80],
  ['Pi1 Cyg',       21.0436,  51.191,  3.91],
  ['Rho Cyg',       21.5617,  45.590,  3.99],
  ['Tau Cyg',       21.1470,  38.045,  3.72],
  // Aquila, Cygnus, Vulpecula fill
  ['Alp Sge',       19.9794,  18.014,  4.37],
  ['Gam Sge',       19.9794,  19.492,  3.47],
  ['Del Sge',       19.7907,  18.534,  3.82],
  ['Eps Vul',       19.9270,  24.665,  4.44],
  ['Alp Vul',       19.4787,  24.665,  4.44],
  ['13 Vul',        20.0033,  20.567,  4.57],
  ['1 Vul',         19.2747,  21.391,  4.77],
  ['Alp Ser2',      18.3553,  -2.899,  3.26],
  ['Bet Ser2',      18.9411, -10.701,  3.67],
  ['Gam Ser2',      18.4280,  -2.895,  3.85],
  ['Mu Ser2',       18.9108, -12.720,  3.54],
  ['Xi Ser2',       17.6261, -15.399,  3.54],
  ['Omi Ser2',      17.7005, -12.880,  4.26],
];

// ─── Pre-compute alt/az for every star once ───────────────────────────────────
const COMPUTED = CATALOG.map(([name, ra, dec, mag]) => {
  const { alt, az } = raDecToAltAz(ra, dec, LST, OBS_LAT);
  return { name, ra, dec, mag, alt, az };
}).filter(s => s.alt > -5); // only above (or just below) horizon

// ─── Constellation line pairs (indices into COMPUTED by name) ────────────────
const SCORPIUS_LINES = [
  ['Acrab',    'Dschubba'],
  ['Dschubba', 'Pi Sco'],
  ['Dschubba', 'Antares'],
  ['Antares',  'Tau Scorpii'],
  ['Tau Scorpii','Eps Scorpii'],
  ['Eps Scorpii','Mu Sco'],
  ['Mu Sco',   'Zeta Ara'],
  ['Eps Scorpii','Theta Sco'],
  ['Theta Sco','Lesath'],
  ['Theta Sco','Sargas'],
  ['Lesath',   'Shaula'],
];
const SAGITTARIUS_LINES = [
  ['Kaus Borealis', 'Kaus Media'],
  ['Kaus Media',    'Kaus Australis'],
  ['Kaus Australis','Alnasl'],
  ['Kaus Media',    'Ascella'],
  ['Ascella',       'Tau Sgr'],
  ['Alnasl',        'Phi Sgr'],
  ['Kaus Borealis', 'Del Sgr'],
  ['Del Sgr',       'Gam Sgr'],
];
const ALL_LINES = [...SCORPIUS_LINES, ...SAGITTARIUS_LINES];

// ─── Milky Way band — approximate GC area (az/alt blobs) ────────────────────
// At LST ~16h from Ujjain, the galactic centre (Sgr A*) is ~Az=180°, Alt=25°
const MW_NODES = [
  // [az, alt, radius_frac, opacity]  — baked for birth moment
  [173, 22, 0.18, 0.055],
  [180, 28, 0.22, 0.070],
  [190, 24, 0.17, 0.055],
  [162, 14, 0.14, 0.040],
  [200, 18, 0.14, 0.040],
  [155,  8, 0.12, 0.030],
  [210, 12, 0.12, 0.030],
  [215, 32, 0.12, 0.025],
  [170, 38, 0.13, 0.035],
  [178, 48, 0.10, 0.025],
  [145,  5, 0.10, 0.022],
  [225,  8, 0.10, 0.020],
  [183, 58, 0.09, 0.018],
];

// ─── Project az/alt → screen xy ──────────────────────────────────────────────
// Equirectangular centred on (az=180°, alt=30°)
// Full canvas width ≈ 120° of azimuth, height ≈ 90° of altitude
function project(az, alt, W, H) {
  const AZ_CENTER  = 180;
  const ALT_CENTER = 28;
  const AZ_RANGE   = 150; // degrees visible across full width
  const ALT_RANGE  = 82;  // degrees visible across full height

  const x = ((az - AZ_CENTER) / AZ_RANGE + 0.5) * W;
  const y = (1 - (alt - (ALT_CENTER - ALT_RANGE / 2)) / ALT_RANGE) * H;
  return { x, y };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function StarBackground() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const tRef      = useRef(0);
  const meteorsRef = useRef([]);

  // Pre-build twinkle phases once, plus a parallax depth band per star
  const twinkle = useRef(
    COMPUTED.map((s) => ({
      phase:    Math.random() * Math.PI * 2,
      // 2× faster sparkle than before
      speed:    1.0 + Math.random() * 2.6,
      // Stronger twinkle so they feel alive
      depth:    0.22 + Math.random() * 0.32,
      // Independent secondary frequency for richer shimmer
      phase2:   Math.random() * Math.PI * 2,
      speed2:   2.4 + Math.random() * 3.0,
      // depth layer: bright → near (1.0), dim → far (0.3)
      parallax: Math.max(0.3, Math.min(1.0, (4.5 - s.mag) / 4.5)),
    }))
  );

  // Pre-build a foreground field of "dust" particles for extra depth
  const dust = useRef(
    Array.from({ length: 80 }, () => ({
      x:        Math.random(),     // 0..1 of width
      y:        Math.random(),     // 0..1 of height
      r:        Math.random() * 0.8 + 0.2,
      depth:    0.6 + Math.random() * 0.6,  // closer than most stars
      alpha:    0.15 + Math.random() * 0.25,
      phase:    Math.random() * Math.PI * 2,
      speed:    0.6 + Math.random() * 1.5,
    }))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    let cachedBg = null;
    const buildCachedBg = () => {
      const off = document.createElement('canvas');
      off.width  = canvas.width;
      off.height = canvas.height;
      const o = off.getContext('2d');
      const grad = o.createRadialGradient(
        canvas.width / 2, canvas.height * 0.4, 0,
        canvas.width / 2, canvas.height * 0.4, Math.max(canvas.width, canvas.height) * 0.7
      );
      grad.addColorStop(0,   '#0a0518');
      grad.addColorStop(0.5, '#040210');
      grad.addColorStop(1,   '#000005');
      o.fillStyle = grad;
      o.fillRect(0, 0, canvas.width, canvas.height);
      cachedBg = off;
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildCachedBg();
    };
    resize();
    window.addEventListener('resize', resize);

    // Name → index map for constellation lines
    const nameIdx = {};
    COMPUTED.forEach((s, i) => { nameIdx[s.name] = i; });

    // Periodic shooting star spawner
    const spawnMeteor = () => {
      const fromTop = Math.random() < 0.7;
      const startX  = fromTop ? Math.random() * canvas.width : -50;
      const startY  = fromTop ? -50 : Math.random() * canvas.height * 0.4;
      const angle   = (Math.PI / 4) + (Math.random() - 0.5) * 0.6; // 30°–55°
      const speed   = 12 + Math.random() * 9;
      meteorsRef.current.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 60 + Math.random() * 30,
        trail: [],
      });
    };
    // First meteor sooner so it's noticeable
    const firstTimer = setTimeout(spawnMeteor, 1200);
    const meteorTimer = setInterval(() => {
      // 80% chance every 3 seconds → about 1 meteor every 3.7s on average
      if (Math.random() < 0.8) spawnMeteor();
    }, 3000);

    const draw = () => {
      // 2× faster global tick
      tRef.current += 0.034;
      const tick = tRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // ── deep space background gradient (cached, redrawn on resize) ──
      if (cachedBg) ctx.drawImage(cachedBg, 0, 0);
      else {
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, W, H);
      }

      // ── Milky Way diffuse glow ────────────────────────────
      for (const [az, alt, rfrac, op] of MW_NODES) {
        const { x, y } = project(az, alt, W, H);
        const r = rfrac * Math.min(W, H);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0,   `rgba(190,180,255,${op * 1.1})`);
        g.addColorStop(0.5, `rgba(140,160,230,${op * 0.5})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── nebula tint near galactic core (warm orange) ────────
      const gc = project(180, 28, W, H);
      const neb = ctx.createRadialGradient(gc.x, gc.y, 0, gc.x, gc.y, Math.min(W, H) * 0.32);
      neb.addColorStop(0,   'rgba(255,140,80,0.06)');
      neb.addColorStop(0.6, 'rgba(140,80,200,0.04)');
      neb.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.arc(gc.x, gc.y, Math.min(W, H) * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // ── constellation lines (drawn under stars) ─────────────
      ctx.lineWidth = 0.5;
      for (const [a, b] of ALL_LINES) {
        const si = nameIdx[a], ti = nameIdx[b];
        if (si == null || ti == null) continue;
        const sa = COMPUTED[si], sb = COMPUTED[ti];
        if (sa.alt < 0 || sb.alt < 0) continue;
        const pa = project(sa.az, sa.alt, W, H);
        const pb = project(sb.az, sb.alt, W, H);
        ctx.strokeStyle = 'rgba(160,180,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // ── stars with diffraction spikes ───────────────────────
      COMPUTED.forEach((star, i) => {
        if (star.alt < 0) return;
        const { x, y } = project(star.az, star.alt, W, H);

        const tw = twinkle.current[i];

        if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;

        // Two superimposed sines + sharp boost on peaks → "sparkle" feel
        const t1 = 0.5 + 0.5 * Math.sin(tick * tw.speed  + tw.phase);
        const t2 = 0.5 + 0.5 * Math.sin(tick * tw.speed2 + tw.phase2);
        const sparkle = Math.pow(t1, 4) * 0.55; // sharp short flashes
        const blink = (1 - tw.depth * (t1 * 0.55 + t2 * 0.45)) + sparkle * 0.35;

        const r = Math.max(0.5, (3.6 - star.mag * 0.55) * blink);
        const alpha = Math.max(0.18, Math.min(1.0, (5.0 - star.mag) / 5.5)) * blink;

        // Color shift: hot blue stars vs warm red giants (Antares, Betelgeuse)
        let red = 255, green = 248, blue = 255;
        if (star.name === 'Antares' || star.name === 'Betelgeuse' || star.name === 'Aldebaran') {
          red = 255; green = 170; blue = 130;
        } else if (star.mag < 1.0) {
          red = 220; green = 240; blue = 255;
        } else if (star.mag > 3.5) {
          red = 230; green = 235; blue = 245;
        }

        // Soft glow halo for brighter stars
        if (star.mag < 2.8) {
          const glowR = r * (star.mag < 0.5 ? 7 : star.mag < 1.5 ? 5 : 3.5);
          const glow  = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          glow.addColorStop(0,   `rgba(${red},${green},${blue},${(alpha * 0.55).toFixed(3)})`);
          glow.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Diffraction spikes (cross flare) for the brightest stars
        if (star.mag < 2.0) {
          const spikeLen = (3 - star.mag) * 14 * blink;
          const spikeAlpha = alpha * 0.45;
          const grd = ctx.createLinearGradient(x - spikeLen, y, x + spikeLen, y);
          grd.addColorStop(0,    'rgba(0,0,0,0)');
          grd.addColorStop(0.5, `rgba(${red},${green},${blue},${spikeAlpha.toFixed(3)})`);
          grd.addColorStop(1,    'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(x - spikeLen, y - 0.5, spikeLen * 2, 1);
          const grdV = ctx.createLinearGradient(x, y - spikeLen, x, y + spikeLen);
          grdV.addColorStop(0,    'rgba(0,0,0,0)');
          grdV.addColorStop(0.5, `rgba(${red},${green},${blue},${spikeAlpha.toFixed(3)})`);
          grdV.addColorStop(1,    'rgba(0,0,0,0)');
          ctx.fillStyle = grdV;
          ctx.fillRect(x - 0.5, y - spikeLen, 1, spikeLen * 2);
        }

        // Star body
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha.toFixed(3)})`;
        ctx.fill();
      });

      // ── foreground dust particles ─────────────────────────
      for (const d of dust.current) {
        const dx = d.x * W;
        const dy = d.y * H;
        const a  = d.alpha * (0.6 + 0.4 * Math.sin(tick * d.speed + d.phase));
        ctx.beginPath();
        ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,230,255,${a.toFixed(3)})`;
        ctx.fill();
      }

      // ── shooting stars ────────────────────────────────────
      const meteors = meteorsRef.current;
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;
        m.trail.unshift({ x: m.x, y: m.y });
        if (m.trail.length > 22) m.trail.pop();

        // Draw trail as a fading polyline + bright head
        for (let j = 0; j < m.trail.length - 1; j++) {
          const p0 = m.trail[j];
          const p1 = m.trail[j + 1];
          const t  = 1 - j / m.trail.length;
          const lifeFade = 1 - m.life / m.maxLife;
          ctx.strokeStyle = `rgba(255,245,220,${(t * 0.85 * lifeFade).toFixed(3)})`;
          ctx.lineWidth = t * 2.2;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
        // Bright head with glow
        if (m.life < m.maxLife) {
          const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 14);
          headGlow.addColorStop(0,   'rgba(255,250,230,0.9)');
          headGlow.addColorStop(0.4, 'rgba(255,220,160,0.4)');
          headGlow.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = headGlow;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,250,1)';
          ctx.fill();
        }

        // Cleanup
        if (m.life > m.maxLife || m.x > W + 100 || m.y > H + 100) {
          meteors.splice(i, 1);
        }
      }

      // ── label Antares (your birth star) ────────────────────
      const antaresIdx = nameIdx['Antares'];
      if (antaresIdx != null) {
        const s = COMPUTED[antaresIdx];
        if (s.alt > 0) {
          const { x, y } = project(s.az, s.alt, W, H);
          ctx.font = '10px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255, 180, 140, 0.55)';
          ctx.fillText('Antares', x + 9, y - 6);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(firstTimer);
      clearInterval(meteorTimer);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
}
