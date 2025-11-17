import {
  Gradient,
  AccessibilityValidationResponse,
  ContrastResult,
} from '../types';
import {
  getContrastRatio,
  meetsWCAG,
  suggestAccessibleColor,
} from '../utils/colorUtils';
import { logger } from '../config/logger';

export class AccessibilityService {
  static validateGradient(
    gradient: Gradient,
    foregroundColor: string,
    fontSize: number = 16,
    fontWeight: 'normal' | 'bold' = 'normal'
  ): AccessibilityValidationResponse {
    try {
      const results: ContrastResult[] = [];
      let totalScore = 0;

      for (const colorStop of gradient.colorStops) {
        const contrastRatio = getContrastRatio(colorStop.color, foregroundColor);
        const wcagAA = meetsWCAG(contrastRatio, 'AA', fontSize, fontWeight);
        const wcagAAA = meetsWCAG(contrastRatio, 'AAA', fontSize, fontWeight);

        const suggestions: string[] = [];
        if (!wcagAA) {
          const suggestedColor = suggestAccessibleColor(colorStop.color, 4.5);
          suggestions.push(
            `Consider using ${suggestedColor} instead of ${foregroundColor} for better contrast`
          );
        }

        results.push({
          colorStop,
          contrastRatio: Math.round(contrastRatio * 100) / 100,
          wcagAA,
          wcagAAA,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        });

        if (wcagAAA) totalScore += 100;
        else if (wcagAA) totalScore += 70;
        else totalScore += Math.min((contrastRatio / 4.5) * 50, 50);
      }

      const overallScore = Math.round(totalScore / gradient.colorStops.length);
      const passed = results.every((r) => r.wcagAA);

      const recommendations: string[] = [];
      if (!passed) {
        recommendations.push(
          'Some color stops do not meet WCAG AA standards for the given text size'
        );
        recommendations.push('Consider using larger text or adjusting foreground colors');
      }

      if (results.some((r) => !r.wcagAAA)) {
        recommendations.push(
          'For AAA compliance, consider increasing contrast ratios to 7:1 or higher'
        );
      }

      logger.info(
        `Accessibility validation completed. Score: ${overallScore}, Passed: ${passed}`
      );

      return {
        results,
        overallScore,
        passed,
        recommendations,
      };
    } catch (error) {
      logger.error('Error validating accessibility:', error);
      throw error;
    }
  }

  static calculateGradientScore(gradient: Gradient): number {
    try {
      const commonForegrounds = ['#FFFFFF', '#000000', '#333333'];
      let totalScore = 0;

      for (const foreground of commonForegrounds) {
        const validation = this.validateGradient(gradient, foreground);
        totalScore += validation.overallScore;
      }

      const averageScore = totalScore / commonForegrounds.length;
      logger.info(`Calculated gradient accessibility score: ${averageScore}`);
      return Math.round(averageScore);
    } catch (error) {
      logger.error('Error calculating gradient score:', error);
      return 0;
    }
  }
}
