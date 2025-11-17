import Color from 'color';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const color = Color(hex);
  return color.rgb().object();
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return Color.rgb(r, g, b).hex();
};

export const getRelativeLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);

  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAG = (
  contrastRatio: number,
  level: 'AA' | 'AAA',
  fontSize: number = 16,
  fontWeight: 'normal' | 'bold' = 'normal'
): boolean => {
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');

  if (level === 'AA') {
    return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
  } else {
    return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
  }
};

export const generateComplementaryColor = (hex: string): string => {
  const color = Color(hex);
  return color.rotate(180).hex();
};

export const generateAnalogousColors = (hex: string): string[] => {
  const color = Color(hex);
  return [color.rotate(-30).hex(), hex, color.rotate(30).hex()];
};

export const generateTriadicColors = (hex: string): string[] => {
  const color = Color(hex);
  return [hex, color.rotate(120).hex(), color.rotate(240).hex()];
};

export const adjustColorBrightness = (hex: string, amount: number): string => {
  const color = Color(hex);
  return color.lighten(amount).hex();
};

export const suggestAccessibleColor = (
  backgroundColor: string,
  targetContrast: number = 4.5
): string => {
  const bgLuminance = getRelativeLuminance(backgroundColor);
  const isDark = bgLuminance < 0.5;

  let suggestion = isDark ? '#FFFFFF' : '#000000';
  const currentRatio = getContrastRatio(backgroundColor, suggestion);

  if (currentRatio >= targetContrast) {
    return suggestion;
  }

  const baseColor = Color(isDark ? '#FFFFFF' : '#000000');
  let adjustedColor = baseColor;
  let steps = 0;

  while (steps < 10) {
    const ratio = getContrastRatio(backgroundColor, adjustedColor.hex());
    if (ratio >= targetContrast) {
      return adjustedColor.hex();
    }
    adjustedColor = isDark ? adjustedColor.darken(0.1) : adjustedColor.lighten(0.1);
    steps++;
  }

  return suggestion;
};
