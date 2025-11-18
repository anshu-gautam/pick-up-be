import OpenAI from 'openai';
import { env } from '../config/env';
import { Gradient, ColorStop } from '../types';
import { logger } from '../config/logger';
import { generateAnalogousColors, generateTriadicColors } from '../utils/colorUtils';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export class AIService {
  static async generateGradients(prompt: string, count: number = 3): Promise<Gradient[]> {
    try {
      const systemPrompt = `You are an expert gradient designer with deep knowledge of color theory, design principles, and accessibility.
Your task is to generate beautiful, harmonious gradients based on user descriptions.

Return a JSON array of gradient objects with this exact structure:
[
  {
    "name": "Gradient name (creative and descriptive)",
    "type": "linear" | "radial" | "conic",
    "angle": 45-360 (for linear gradients),
    "colorStops": [
      {"color": "#HEXCODE", "position": 0-100},
      {"color": "#HEXCODE", "position": 0-100}
    ],
    "tags": ["tag1", "tag2"]
  }
]

Guidelines:
- Create ${count} unique gradient variations
- Use 2-5 color stops per gradient
- Ensure color stops are ordered by position (0-100)
- Choose appropriate gradient types (linear for directional, radial for centered, conic for circular)
- Consider color harmony (complementary, analogous, triadic, monochromatic)
- Add descriptive tags related to mood, theme, or use case
- Avoid extreme contrast that might cause accessibility issues
- Return ONLY valid JSON, no additional text`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from AI');
      }

      const gradients = parsedResponse.gradients || [parsedResponse];

      const validGradients = gradients
        .filter((g: any) => g.colorStops && g.colorStops.length >= 2)
        .map((g: any) => ({
          name: g.name || 'AI Generated Gradient',
          type: g.type || 'linear',
          angle: g.angle || 90,
          colorStops: g.colorStops.sort((a: ColorStop, b: ColorStop) => a.position - b.position),
          tags: g.tags || ['ai-generated'],
          isPublic: false,
        }))
        .slice(0, count);

      if (validGradients.length === 0) {
        return this.generateFallbackGradients(prompt, count);
      }

      logger.info(`Generated ${validGradients.length} gradients for prompt: "${prompt}"`);
      return validGradients;
    } catch (error) {
      logger.error('Error generating gradients with AI:', error);
      return this.generateFallbackGradients(prompt, count);
    }
  }

  private static generateFallbackGradients(_prompt: string, count: number): Gradient[] {
    const baseColors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];
    const gradients: Gradient[] = [];

    for (let i = 0; i < count; i++) {
      const baseColor = baseColors[i % baseColors.length];
      const colors = i % 2 === 0 ? generateAnalogousColors(baseColor) : generateTriadicColors(baseColor);

      gradients.push({
        name: `Gradient ${i + 1}`,
        type: i % 3 === 0 ? 'linear' : i % 3 === 1 ? 'radial' : 'conic',
        angle: 45 + i * 30,
        colorStops: [
          { color: colors[0], position: 0 },
          { color: colors[1] || colors[0], position: 50 },
          { color: colors[2] || colors[1] || colors[0], position: 100 },
        ],
        tags: ['fallback', 'generated'],
        isPublic: false,
      });
    }

    logger.info(`Generated ${count} fallback gradients`);
    return gradients;
  }

  static async enhanceGradient(gradient: Gradient): Promise<Gradient> {
    try {
      const prompt = `Enhance this gradient to make it more visually appealing while maintaining its general character:
Type: ${gradient.type}
Current colors: ${gradient.colorStops.map((cs) => cs.color).join(', ')}

Suggest improvements to color harmony, positioning, or additional color stops.
Return the enhanced gradient in the same JSON format.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a gradient enhancement expert. Improve gradients while preserving their essence.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        return gradient;
      }

      const enhanced = JSON.parse(content);
      return {
        ...gradient,
        colorStops: enhanced.colorStops || gradient.colorStops,
        angle: enhanced.angle || gradient.angle,
      };
    } catch (error) {
      logger.error('Error enhancing gradient:', error);
      return gradient;
    }
  }
}
