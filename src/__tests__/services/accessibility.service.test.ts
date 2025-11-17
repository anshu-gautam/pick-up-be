import { AccessibilityService } from '../../services/accessibility.service';
import { Gradient } from '../../types';

describe('AccessibilityService', () => {
  const mockGradient: Gradient = {
    name: 'Test Gradient',
    type: 'linear',
    angle: 90,
    colorStops: [
      { color: '#000000', position: 0 },
      { color: '#FFFFFF', position: 100 },
    ],
  };

  describe('validateGradient', () => {
    it('should validate gradient with good contrast', () => {
      const result = AccessibilityService.validateGradient(
        mockGradient,
        '#FFFFFF',
        16,
        'normal'
      );

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(2);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should provide recommendations for poor contrast', () => {
      const poorGradient: Gradient = {
        name: 'Poor Contrast',
        type: 'linear',
        angle: 90,
        colorStops: [
          { color: '#FFFFFF', position: 0 },
          { color: '#FEFEFE', position: 100 },
        ],
      };

      const result = AccessibilityService.validateGradient(
        poorGradient,
        '#FFFFFF',
        16,
        'normal'
      );

      expect(result.passed).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate contrast ratios correctly', () => {
      const result = AccessibilityService.validateGradient(
        mockGradient,
        '#FFFFFF',
        16,
        'normal'
      );

      result.results.forEach((r) => {
        expect(r.contrastRatio).toBeGreaterThan(0);
        expect(typeof r.wcagAA).toBe('boolean');
        expect(typeof r.wcagAAA).toBe('boolean');
      });
    });
  });

  describe('calculateGradientScore', () => {
    it('should calculate a score between 0 and 100', () => {
      const score = AccessibilityService.calculateGradientScore(mockGradient);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give high score to high contrast gradients', () => {
      const score = AccessibilityService.calculateGradientScore(mockGradient);
      expect(score).toBeGreaterThan(50);
    });
  });
});
