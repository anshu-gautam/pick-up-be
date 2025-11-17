import {
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAG,
  generateComplementaryColor,
  generateAnalogousColors,
  generateTriadicColors,
} from '../../utils/colorUtils';

describe('Color Utils', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      const rgb = hexToRgb('#FF5733');
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(87);
      expect(rgb.b).toBe(51);
    });

    it('should handle black color', () => {
      const rgb = hexToRgb('#000000');
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should handle white color', () => {
      const rgb = hexToRgb('#FFFFFF');
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      const hex = rgbToHex(255, 87, 51);
      expect(hex.toUpperCase()).toBe('#FF5733');
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio between black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBe(21);
    });

    it('should calculate contrast ratio for similar colors', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FEFEFE');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(1.1);
    });
  });

  describe('meetsWCAG', () => {
    it('should pass AA for high contrast', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(meetsWCAG(ratio, 'AA', 16, 'normal')).toBe(true);
    });

    it('should pass AAA for very high contrast', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(meetsWCAG(ratio, 'AAA', 16, 'normal')).toBe(true);
    });

    it('should fail AA for low contrast', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FEFEFE');
      expect(meetsWCAG(ratio, 'AA', 16, 'normal')).toBe(false);
    });
  });

  describe('generateComplementaryColor', () => {
    it('should generate complementary color', () => {
      const complementary = generateComplementaryColor('#FF0000');
      expect(complementary).toBeDefined();
      expect(complementary).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('generateAnalogousColors', () => {
    it('should generate 3 analogous colors', () => {
      const colors = generateAnalogousColors('#FF0000');
      expect(colors).toHaveLength(3);
      expect(colors[1]).toBe('#FF0000');
    });
  });

  describe('generateTriadicColors', () => {
    it('should generate 3 triadic colors', () => {
      const colors = generateTriadicColors('#FF0000');
      expect(colors).toHaveLength(3);
      expect(colors[0]).toBe('#FF0000');
    });
  });
});
