import { Gradient } from '../types';
import sharp from 'sharp';
import { logger } from '../config/logger';

export class ExportService {
  static generateCSS(gradient: Gradient): string {
    try {
      const colorStops = gradient.colorStops
        .map((cs) => `${cs.color} ${cs.position}%`)
        .join(', ');

      let css = '';

      switch (gradient.type) {
        case 'linear':
          css = `background: linear-gradient(${gradient.angle || 90}deg, ${colorStops});`;
          break;
        case 'radial':
          css = `background: radial-gradient(circle, ${colorStops});`;
          break;
        case 'conic':
          css = `background: conic-gradient(from ${gradient.angle || 0}deg, ${colorStops});`;
          break;
      }

      logger.info(`Generated CSS for gradient type: ${gradient.type}`);
      return css;
    } catch (error) {
      logger.error('Error generating CSS:', error);
      throw error;
    }
  }

  static generateTailwind(gradient: Gradient): string {
    try {
      const firstColor = gradient.colorStops[0].color;
      const lastColor = gradient.colorStops[gradient.colorStops.length - 1].color;

      const directionMap: Record<number, string> = {
        0: 'to-t',
        45: 'to-tr',
        90: 'to-r',
        135: 'to-br',
        180: 'to-b',
        225: 'to-bl',
        270: 'to-l',
        315: 'to-tl',
      };

      const angle = gradient.angle || 90;
      const direction = directionMap[angle] || 'to-r';

      const tailwindClass = `bg-gradient-${gradient.type === 'radial' ? 'radial' : gradient.type === 'conic' ? 'conic' : 'to'}-${direction}`;

      const comment = `/* Note: Tailwind CSS has limited gradient support.
   For exact color matching, consider using custom CSS or the @apply directive with arbitrary values:

   className="${tailwindClass}"
   style={{
     background: '${this.generateCSS(gradient).replace('background: ', '')}'
   }}

   Or add to your tailwind.config.js:
   {
     backgroundImage: {
       'custom-gradient': '${this.generateCSS(gradient).replace('background: ', '')}'
     }
   }
*/`;

      logger.info(`Generated Tailwind configuration for gradient`);
      return comment;
    } catch (error) {
      logger.error('Error generating Tailwind:', error);
      throw error;
    }
  }

  static async generateImage(
    gradient: Gradient,
    width: number,
    height: number,
    format: 'png' | 'svg'
  ): Promise<Buffer> {
    try {
      if (format === 'svg') {
        return this.generateSVG(gradient, width, height);
      } else {
        return this.generatePNG(gradient, width, height);
      }
    } catch (error) {
      logger.error('Error generating image:', error);
      throw error;
    }
  }

  private static async generatePNG(
    gradient: Gradient,
    width: number,
    height: number
  ): Promise<Buffer> {
    const svg = this.createSVGGradient(gradient, width, height);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    logger.info(`Generated PNG image: ${width}x${height}`);
    return buffer;
  }

  private static async generateSVG(
    gradient: Gradient,
    width: number,
    height: number
  ): Promise<Buffer> {
    const svg = this.createSVGGradient(gradient, width, height);
    logger.info(`Generated SVG image: ${width}x${height}`);
    return Buffer.from(svg);
  }

  private static createSVGGradient(gradient: Gradient, width: number, height: number): string {
    const stops = gradient.colorStops
      .map(
        (cs) => `<stop offset="${cs.position}%" stop-color="${cs.color}"/>`
      )
      .join('\n      ');

    let gradientDef = '';
    let fillRef = '';

    switch (gradient.type) {
      case 'linear':
        const angle = gradient.angle || 90;
        const radians = ((angle - 90) * Math.PI) / 180;
        const x1 = 50 + 50 * Math.cos(radians);
        const y1 = 50 + 50 * Math.sin(radians);
        const x2 = 50 - 50 * Math.cos(radians);
        const y2 = 50 - 50 * Math.sin(radians);

        gradientDef = `
    <linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>`;
        fillRef = 'url(#grad)';
        break;

      case 'radial':
        gradientDef = `
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
      ${stops}
    </radialGradient>`;
        fillRef = 'url(#grad)';
        break;

      case 'conic':
        gradientDef = `
    <defs>
      <linearGradient id="grad">
        ${stops}
      </linearGradient>
    </defs>`;
        fillRef = 'url(#grad)';
        break;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradientDef}
  </defs>
  <rect width="${width}" height="${height}" fill="${fillRef}"/>
</svg>`;
  }
}
