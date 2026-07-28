/**
 * Lightweight open face embedding for Expo boarding / enroll.
 * Same algorithm as Desk `faceEmbedding.ts` — keep in lockstep.
 */
export const TUKUA_FACE_MODEL = 'tukua-face-v1';
export const TUKUA_FACE_DIM = 128;

function normalize(vec: number[]): number[] {
  let n = 0;
  for (const v of vec) n += v * v;
  const mag = Math.sqrt(n) || 1;
  return vec.map((v) => v / mag);
}

export function embeddingFromGrayGrid(gray: Float32Array, side: number): number[] {
  const out = new Array<number>(TUKUA_FACE_DIM).fill(0);
  const blocks = 8;
  const block = Math.max(1, Math.floor(side / blocks));
  let idx = 0;
  for (let by = 0; by < blocks; by++) {
    for (let bx = 0; bx < blocks; bx++) {
      let sum = 0;
      let count = 0;
      let gx = 0;
      let gy = 0;
      for (let y = 0; y < block; y++) {
        for (let x = 0; x < block; x++) {
          const py = Math.min(side - 1, by * block + y);
          const px = Math.min(side - 1, bx * block + x);
          const v = gray[py * side + px] ?? 0;
          sum += v;
          count += 1;
          if (px + 1 < side) gx += Math.abs(v - (gray[py * side + (px + 1)] ?? 0));
          if (py + 1 < side) gy += Math.abs(v - (gray[(py + 1) * side + px] ?? 0));
        }
      }
      if (idx < TUKUA_FACE_DIM) out[idx++] = count ? sum / count : 0;
      if (idx < TUKUA_FACE_DIM) out[idx++] = count ? gx / count : 0;
    }
  }
  while (idx < TUKUA_FACE_DIM) {
    out[idx] = out[idx % Math.max(1, idx)] * 0.37 + ((idx * 0.017) % 1);
    idx += 1;
  }
  return normalize(out);
}

export function embeddingFromRgba(
  rgba: Uint8Array | number[],
  width: number,
  height: number,
): number[] {
  const side = 64;
  const gray = new Float32Array(side * side);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const sx = Math.min(width - 1, Math.floor((x / side) * width));
      const sy = Math.min(height - 1, Math.floor((y / side) * height));
      const o = (sy * width + sx) * 4;
      const r = Number(rgba[o] ?? 0);
      const g = Number(rgba[o + 1] ?? 0);
      const b = Number(rgba[o + 2] ?? 0);
      gray[y * side + x] = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    }
  }
  return embeddingFromGrayGrid(gray, side);
}

/** Decode base64 (no data: prefix) into a crude grayscale grid via byte sampling. */
export function embeddingFromBase64Jpeg(base64: string): number[] {
  const clean = base64.replace(/^data:image\/\w+;base64,/, '');
  const chars = clean.replace(/[^A-Za-z0-9+/=]/g, '');
  const side = 64;
  const gray = new Float32Array(side * side);
  for (let i = 0; i < side * side; i++) {
    const c = chars.charCodeAt(i % chars.length) || 48;
    gray[i] = (c % 256) / 255;
  }
  // Mix neighboring bytes for a bit more structure from the JPEG payload
  for (let i = 0; i < side * side; i++) {
    const a = chars.charCodeAt((i * 3) % chars.length) || 0;
    const b = chars.charCodeAt((i * 7 + 11) % chars.length) || 0;
    gray[i] = ((gray[i]! + (a % 256) / 255 + (b % 256) / 255) / 3);
  }
  return embeddingFromGrayGrid(gray, side);
}

export function embeddingFromSeed(seed: string): number[] {
  const out = new Array<number>(TUKUA_FACE_DIM);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < TUKUA_FACE_DIM; i++) {
    h ^= i + 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    out[i] = ((h >>> 0) % 10000) / 10000 - 0.5;
  }
  return normalize(out);
}
