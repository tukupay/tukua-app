/**
 * Face presence gate before embedding.
 *
 * expo-face-detector was removed from Expo SDK 51+ (not compatible with Expo 54).
 * We decode the JPEG with jpeg-js and analyze luminance variance + edge density
 * in a center oval — much more reliable than sampling base64 char codes.
 */
import { decode } from 'jpeg-js';

export type FaceDetectResult = {
  detected: boolean;
  confidence: number;
  reason?: string;
};

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
  if (typeof globalThis.atob === 'function') {
    const bin = globalThis.atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Manual base64 decode fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)!] = i;
  const len = clean.length;
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const outLen = (len * 3) / 4 - pad;
  const out = new Uint8Array(outLen);
  let j = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[clean.charCodeAt(i)!] ?? 0;
    const b = lookup[clean.charCodeAt(i + 1)!] ?? 0;
    const c = lookup[clean.charCodeAt(i + 2)!] ?? 0;
    const d = lookup[clean.charCodeAt(i + 3)!] ?? 0;
    out[j++] = (a << 2) | (b >> 4);
    if (j < outLen) out[j++] = ((b & 15) << 4) | (c >> 2);
    if (j < outLen) out[j++] = ((c & 3) << 6) | d;
  }
  return out;
}

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Center-oval sample: variance + horizontal edge strength (eyes/cheeks). */
export function detectFaceFromBase64Jpeg(base64: string): FaceDetectResult {
  try {
    const bytes = base64ToBytes(base64);
    if (bytes.length < 400) {
      return {
        detected: false,
        confidence: 0,
        reason: 'Image too small — hold the camera steady on a face.',
      };
    }

    const decoded = decode(bytes, { useTArray: true });
    const { width, height, data } = decoded;
    if (!width || !height || !data?.length) {
      return { detected: false, confidence: 0, reason: 'Could not read photo — try again.' };
    }

    const cx = width / 2;
    const cy = height / 2;
    const rx = width * 0.22;
    const ry = height * 0.28;

    let sum = 0;
    let sumSq = 0;
    let edgeSum = 0;
    let n = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;

        const i = (y * width + x) * 4;
        const lum = luminance(data[i]!, data[i + 1]!, data[i + 2]!);
        const lumL = luminance(data[i - 4]!, data[i - 3]!, data[i - 2]!);
        const lumR = luminance(data[i + 4]!, data[i + 5]!, data[i + 6]!);
        const lumU = luminance(data[i - width * 4]!, data[i - width * 4 + 1]!, data[i - width * 4 + 2]!);
        const lumD = luminance(data[i + width * 4]!, data[i + width * 4 + 1]!, data[i + width * 4 + 2]!);

        sum += lum;
        sumSq += lum * lum;
        edgeSum += Math.abs(lum - lumL) + Math.abs(lum - lumR) + Math.abs(lum - lumU) + Math.abs(lum - lumD);
        n += 1;
      }
    }

    if (n < 80) {
      return {
        detected: false,
        confidence: 0,
        reason: 'No face-sized region — center a face in the oval.',
      };
    }

    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const edge = edgeSum / n;

    // Blank / overexposed frames fail; faces have moderate variance + edges
    const varianceScore = Math.max(0, Math.min(1, variance * 18));
    const edgeScore = Math.max(0, Math.min(1, edge * 4.5));
    const confidence = varianceScore * 0.55 + edgeScore * 0.45;

    if (variance < 0.004 || mean < 0.06 || mean > 0.94) {
      return {
        detected: false,
        confidence,
        reason: 'No clear face detected — center a face in the frame with normal lighting.',
      };
    }
    if (edge < 0.018 && variance < 0.012) {
      return {
        detected: false,
        confidence,
        reason: 'Image looks flat or blurry — move closer and hold steady.',
      };
    }

    return { detected: true, confidence: Math.max(0.58, confidence) };
  } catch {
    return {
      detected: false,
      confidence: 0,
      reason: 'Could not read photo — retake with your face centered in the oval.',
    };
  }
}

export function assertFaceDetected(base64: string): void {
  const hit = detectFaceFromBase64Jpeg(base64);
  if (!hit.detected) {
    throw new Error(hit.reason || 'No face detected');
  }
}
