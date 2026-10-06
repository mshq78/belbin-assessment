/**
 * Vertical focal point (object-position Y, in %) for each Section A photo, chosen so heads are never
 * cropped in the short card frame (face detection + manual review). Default for new images: 25.
 */
export const IMAGE_FOCUS_Y: Record<string, number> = {
  A01_1: 9,
  A01_2: 12,
  A02_1: 5,
  A02_2: 21,
  A03_1: 10,
  A03_2: 14,
  A04_1: 13,
  A04_2: 16,
  A05_1: 10,
  A05_2: 24,
  A06_1: 0,
  A06_2: 12,
  A07_1: 38,
  A07_2: 26,
  A08_1: 27,
  A08_2: 29,
  A09_1: 29,
  A09_2: 32,
  A10_1: 42,
  A10_2: 20,
  A11_1: 40,
  A11_2: 37,
  A12_1: 0,
  A12_2: 25,
  A13_1: 22,
  A13_2: 0,
  A14_1: 25,
  A14_2: 32,
  A15_1: 8,
  A15_2: 33,
  A16_1: 8,
  A16_2: 11,
  A17_1: 0,
  A17_2: 10,
  A18_1: 62,
  A18_2: 24,
};

export const DEFAULT_FOCUS_Y = 25;

export function focusYFor(imagePath: string): number {
  const key = imagePath.split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? '';
  return IMAGE_FOCUS_Y[key] ?? DEFAULT_FOCUS_Y;
}
