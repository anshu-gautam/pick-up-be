import { ExportService } from '../../services/export.service';
import { Gradient } from '../../types';

describe('ExportService', () => {
  const mockGradient: Gradient = {
    name: 'Test Gradient',
    type: 'linear',
    angle: 90,
    colorStops: [
      { color: '#FF0000', position: 0 },
      { color: '#0000FF', position: 100 },
    ],
  };

  describe('generateCSS', () => {
    it('should generate linear gradient CSS', () => {
      const css = ExportService.generateCSS(mockGradient);

      expect(css).toContain('linear-gradient');
      expect(css).toContain('90deg');
      expect(css).toContain('#FF0000');
      expect(css).toContain('#0000FF');
    });

    it('should generate radial gradient CSS', () => {
      const radialGradient: Gradient = {
        ...mockGradient,
        type: 'radial',
      };

      const css = ExportService.generateCSS(radialGradient);

      expect(css).toContain('radial-gradient');
      expect(css).toContain('circle');
    });

    it('should generate conic gradient CSS', () => {
      const conicGradient: Gradient = {
        ...mockGradient,
        type: 'conic',
        angle: 45,
      };

      const css = ExportService.generateCSS(conicGradient);

      expect(css).toContain('conic-gradient');
      expect(css).toContain('45deg');
    });
  });

  describe('generateTailwind', () => {
    it('should generate Tailwind configuration', () => {
      const tailwind = ExportService.generateTailwind(mockGradient);

      expect(tailwind).toBeDefined();
      expect(typeof tailwind).toBe('string');
      expect(tailwind.length).toBeGreaterThan(0);
    });
  });

  describe('generateImage', () => {
    it('should generate PNG image', async () => {
      const buffer = await ExportService.generateImage(mockGradient, 400, 300, 'png');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should generate SVG image', async () => {
      const buffer = await ExportService.generateImage(mockGradient, 400, 300, 'svg');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const svgString = buffer.toString();
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('</svg>');
    });
  });
});
