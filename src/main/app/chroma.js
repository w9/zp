/**
 * A lot of the code is forked from Chroma.js [1].
 * Restructured to fit my need.
 *
 * [1] https://github.com/gka/chroma.js
 */

const { PI, sin, cos, sqrt, atan2, round, pow } = Math;

const TWOPI = PI * 2;
const PITHIRD = PI / 3;
const DEG2RAD = PI / 180;
const RAD2DEG = 180 / PI;

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
  return t > LAB_CONSTANTS.t1 ? t * t * t : LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
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

  return [r, g, b_];
};

export const lch2rgb = (lch) => lab2rgb(lch2lab(lch));

const lab2lch = ([l, a, b]) => {
  const c = sqrt(a * a + b * b);
  let h = (atan2(b, a) * RAD2DEG + 360) % 360;
  if (round(c * 10000) === 0) h = Number.NaN;
  return [l, c, h];
};

export const rgb2lab = ([r, g, b]) => {
  const [x, y, z] = rgb2xyz([r, g, b]);
  const l = 116 * y - 16;
  return [l < 0 ? 0 : l, 500 * (x - y), 200 * (y - z)];
};

const rgb_xyz = (r) => {
  if ((r /= 255) <= 0.04045) return r / 12.92;
  return pow((r + 0.055) / 1.055, 2.4);
};

const xyz_lab = (t) => {
  if (t > LAB_CONSTANTS.t3) return pow(t, 1 / 3);
  return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
};

export const rgb2xyz = ([r, g, b]) => {
  r = rgb_xyz(r);
  g = rgb_xyz(g);
  b = rgb_xyz(b);
  const x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn);
  const y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.072175 * b) / LAB_CONSTANTS.Yn);
  const z = xyz_lab((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn);
  return [x, y, z];
};

export const rgb2lch = (rgb) => lab2lch(rgb2lab(rgb));

const RE_HEX = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const hex2rgb = (hex) => {
  if (!hex.match(RE_HEX)) {
    throw new Error(`unknown hex color: ${hex}`);
  }

  // remove optional leading #
  if (hex.length === 4 || hex.length === 7) {
    hex = hex.substr(1);
  }

  // expand short-notation to full six-digit
  if (hex.length === 3) {
    hex = hex.split("");
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const u = parseInt(hex, 16);
  const r = u >> 16;
  const g = (u >> 8) & 0xff;
  const b = u & 0xff;

  return [r, g, b];
};

export const rgb2hex = ([r, g, b]) => {
  r = round(r);
  g = round(g);
  b = round(b);
  const u = (r << 16) | (g << 8) | b;
  const str = u.toString(16).padStart(6, "0");
  return "#" + str;
};

export const hsluv = (function () {
  function f(a) {
    var c = [],
      b = Math.pow(a + 16, 3) / 1560896;
    b = b > g ? b : a / k;
    for (var d = 0; 3 > d; ) {
      var e = d++,
        h = l[e][0],
        w = l[e][1];
      e = l[e][2];
      for (var x = 0; 2 > x; ) {
        var y = x++,
          z = (632260 * e - 126452 * w) * b + 126452 * y;
        c.push({
          b: ((284517 * h - 94839 * e) * b) / z,
          a: ((838422 * e + 769860 * w + 731718 * h) * a * b - 769860 * y * a) / z,
        });
      }
    }
    return c;
  }
  function m(a) {
    a = f(a);
    for (var c = Infinity, b = 0; b < a.length; ) {
      var d = a[b];
      ++b;
      c = Math.min(c, Math.abs(d.a) / Math.sqrt(Math.pow(d.b, 2) + 1));
    }
    return c;
  }
  function n(a, c) {
    c = (c / 360) * Math.PI * 2;
    a = f(a);
    for (var b = Infinity, d = 0; d < a.length; ) {
      var e = a[d];
      ++d;
      e = e.a / (Math.sin(c) - e.b * Math.cos(c));
      0 <= e && (b = Math.min(b, e));
    }
    return b;
  }
  function p(a, c) {
    for (var b = 0, d = 0, e = a.length; d < e; ) {
      var h = d++;
      b += a[h] * c[h];
    }
    return b;
  }
  function q(a) {
    return 0.0031308 >= a ? 12.92 * a : 1.055 * Math.pow(a, 0.4166666666666667) - 0.055;
  }
  function r(a) {
    return 0.04045 < a ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
  }
  function t(a) {
    return [q(p(l[0], a)), q(p(l[1], a)), q(p(l[2], a))];
  }
  function u(a) {
    a = [r(a[0]), r(a[1]), r(a[2])];
    return [p(v[0], a), p(v[1], a), p(v[2], a)];
  }
  function A(a) {
    var c = a[0],
      b = a[1];
    a = c + 15 * b + 3 * a[2];
    0 != a ? ((c = (4 * c) / a), (a = (9 * b) / a)) : (a = c = NaN);
    b = b <= g ? (b / B) * k : 116 * Math.pow(b / B, 0.3333333333333333) - 16;
    return 0 == b ? [0, 0, 0] : [b, 13 * b * (c - C), 13 * b * (a - D)];
  }
  function E(a) {
    var c = a[0];
    if (0 == c) return [0, 0, 0];
    var b = a[1] / (13 * c) + C;
    a = a[2] / (13 * c) + D;
    c = 8 >= c ? (B * c) / k : B * Math.pow((c + 16) / 116, 3);
    b = 0 - (9 * c * b) / ((b - 4) * a - b * a);
    return [b, c, (9 * c - 15 * a * c - a * b) / (3 * a)];
  }
  function F(a) {
    var c = a[0],
      b = a[1],
      d = a[2];
    a = Math.sqrt(b * b + d * d);
    1e-8 > a ? (b = 0) : ((b = (180 * Math.atan2(d, b)) / Math.PI), 0 > b && (b = 360 + b));
    return [c, a, b];
  }
  function G(a) {
    var c = a[1],
      b = (a[2] / 360) * 2 * Math.PI;
    return [a[0], Math.cos(b) * c, Math.sin(b) * c];
  }
  function H(a) {
    var c = a[0],
      b = a[1];
    a = a[2];
    if (99.9999999 < a) return [100, 0, c];
    if (1e-8 > a) return [0, 0, c];
    b = (n(a, c) / 100) * b;
    return [a, b, c];
  }
  function I(a) {
    var c = a[0],
      b = a[1];
    a = a[2];
    if (99.9999999 < c) return [a, 0, 100];
    if (1e-8 > c) return [a, 0, 0];
    var d = n(c, a);
    return [a, (b / d) * 100, c];
  }
  function J(a) {
    var c = a[0],
      b = a[1];
    a = a[2];
    if (99.9999999 < a) return [100, 0, c];
    if (1e-8 > a) return [0, 0, c];
    b = (m(a) / 100) * b;
    return [a, b, c];
  }
  function K(a) {
    var c = a[0],
      b = a[1];
    a = a[2];
    if (99.9999999 < c) return [a, 0, 100];
    if (1e-8 > c) return [a, 0, 0];
    var d = m(c);
    return [a, (b / d) * 100, c];
  }
  function L(a) {
    for (var c = "#", b = 0; 3 > b; ) {
      var d = b++;
      d = Math.round(255 * a[d]);
      var e = d % 16;
      c += M.charAt(((d - e) / 16) | 0) + M.charAt(e);
    }
    return c;
  }
  function N(a) {
    a = a.toLowerCase();
    for (var c = [], b = 0; 3 > b; ) {
      var d = b++;
      c.push((16 * M.indexOf(a.charAt(2 * d + 1)) + M.indexOf(a.charAt(2 * d + 2))) / 255);
    }
    return c;
  }
  function O(a) {
    return t(E(G(a)));
  }
  function P(a) {
    return F(A(u(a)));
  }
  function Q(a) {
    return O(H(a));
  }
  function R(a) {
    return I(P(a));
  }
  function S(a) {
    return O(J(a));
  }
  function T(a) {
    return K(P(a));
  }
  var l = [
      [3.240969941904521, -1.537383177570093, -0.498610760293],
      [-0.96924363628087, 1.87596750150772, 0.041555057407175],
      [0.055630079696993, -0.20397695888897, 1.056971514242878],
    ],
    v = [
      [0.41239079926595, 0.35758433938387, 0.18048078840183],
      [0.21263900587151, 0.71516867876775, 0.072192315360733],
      [0.019330818715591, 0.11919477979462, 0.95053215224966],
    ],
    B = 1,
    C = 0.19783000664283,
    D = 0.46831999493879,
    k = 903.2962962,
    g = 0.0088564516,
    M = "0123456789abcdef";
  return {
    hsluvToRgb: Q,
    rgbToHsluv: R,
    hpluvToRgb: S,
    rgbToHpluv: T,
    hsluvToHex: function (a) {
      return L(Q(a));
    },
    hexToHsluv: function (a) {
      return R(N(a));
    },
    hpluvToHex: function (a) {
      return L(S(a));
    },
    hexToHpluv: function (a) {
      return T(N(a));
    },
    lchToHpluv: K,
    hpluvToLch: J,
    lchToHsluv: I,
    hsluvToLch: H,
    lchToLuv: G,
    luvToLch: F,
    xyzToLuv: A,
    luvToXyz: E,
    xyzToRgb: t,
    rgbToXyz: u,
    lchToRgb: O,
    rgbToLch: P,
  };
})();
