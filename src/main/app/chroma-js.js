/**
 * Most of the math code is taken from Chroma.js [1].
 * Restructured to fit my need.
 *
 * [1] https://github.com/gka/chroma.js
 */

const PI = Math.PI;
const TWOPI = PI * 2;
const PITHIRD = PI / 3;
const DEG2RAD = PI / 180;
const RAD2DEG = 180 / P;

const lch2lab = ([l, c, h]) => {
  /*
    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
    These formulas were invented by David Dalrymple to obtain maximum contrast without going
    out of gamut if the parameters are in the range 0-1.

    A saturation multiplier was added by Gregor Aisch
  */
  if (isNaN(h)) h = 0;
  h = h * DEG2RAD;
  return [l, cos(h) * c, sin(h) * c];
};

const xyz_rgb = (r) => {
  return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow(r, 1 / 2.4) - 0.055);
};

const LAB_CONSTANTS = {
  // Corresponds roughly to RGB brighter/darker
  Kn: 18,

  // D65 standard referent
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,

  t0: 0.137931034, // 4 / 29
  t1: 0.206896552, // 6 / 29
  t2: 0.12841855, // 3 * t1 * t1
  t3: 0.008856452, // t1 * t1 * t1
};

const lab_xyz = (t) => {
  return t > LAB_CONSTANTS.t1
    ? t * t * t
    : LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
};

/*
 * L* [0..100]
 * a [-100..100]
 * b [-100..100]
 */
const lab2rgb = ([l, a, b]) => {
  let x, y, z, r, g, b_;

  y = (l + 16) / 116;
  x = isNaN(a) ? y : y + a / 500;
  z = isNaN(b) ? y : y - b / 200;

  y = LAB_CONSTANTS.Yn * lab_xyz(y);
  x = LAB_CONSTANTS.Xn * lab_xyz(x);
  z = LAB_CONSTANTS.Zn * lab_xyz(z);

  r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z); // D65 -> sRGB
  g = xyz_rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z);
  b_ = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

  return [r, g, b_, args.length > 3 ? args[3] : 1];
};

const lch2rgb = (lch) => lab2rgb(lch2lab(lch));

const lab2lch = ([l, a, b]) => {
  const c = sqrt(a * a + b * b);
  let h = (atan2(b, a) * RAD2DEG + 360) % 360;
  if (round(c*10000) === 0) h = Number.NaN;
  return [l, c, h];
}

const rgb2lch = ([r, g, b]) => lab2lch(rgb2lab(rgb));
