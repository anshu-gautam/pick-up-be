import { openai } from '@ai-sdk/openai';
import { generateText, generateObject, streamText, CoreMessage } from 'ai';
import { env } from '../config/env';
import { Gradient, Message } from '../types';
import { logger } from '../config/logger';
import { AccessibilityService } from './accessibility.service';
import { StorageService } from './storage.service';
import { ExportService } from './export.service';
import { z } from 'zod';

const gradientSchema = z.object({
  gradients: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['linear', 'radial', 'conic']),
      angle: z.number().min(0).max(360).optional(),
      colorStops: z.array(
        z.object({
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
          position: z.number().min(0).max(100),
        })
      ).min(2),
      tags: z.array(z.string()).optional(),
    })
  ),
});

export class AIChatService {
  private static model = openai(env.AI_MODEL);

  private static systemPrompt = `You are an expert gradient designer with deep knowledge of color theory, design principles, and accessibility.
Your role is to help users create beautiful, harmonious gradients through conversation.

When users describe what they want, generate gradients that match their vision. Consider:
- Color harmony (complementary, analogous, triadic, monochromatic)
- Mood and emotion
- Use case (web design, branding, backgrounds, etc.)
- Accessibility (good contrast, WCAG compliance)
- Modern design trends

You can generate linear, radial, or conic gradients with 2-5 color stops.
Each gradient should have a creative, descriptive name and relevant tags.

Respond naturally to user messages and use the generateGradients tool when they want to create gradients.`;

  /**
   * Generate gradients from a user prompt using Vercel AI SDK
   * Supports streaming and tool calling
   */
  static async generateGradientsWithChat(
    userPrompt: string,
    conversationHistory: Message[] = [],
    userId: string
  ): Promise<{ gradients: Gradient[]; responseText: string }> {
    try {
      const messages: CoreMessage[] = [
        { role: 'system', content: this.systemPrompt },
        ...this.convertToAIMessages(conversationHistory),
        { role: 'user', content: userPrompt },
      ];

      const { text, toolResults } = await generateText({
        model: this.model,
        messages,
        tools: {
          generateGradients: {
            description:
              'Generate gradient designs based on user requirements. Use this when user wants to create gradients.',
            inputSchema: z.object({
              count: z.number().min(1).max(5).describe('Number of gradients to generate'),
              theme: z.string().describe('Theme or mood for the gradients'),
              colors: z
                .array(z.string())
                .optional()
                .describe('Specific colors to include if mentioned'),
            }) as any,
            execute: async ({ count, theme }: { count: number; theme: string }) => {
              const generatedGradients = await this.generateGradientsFromTheme(
                theme,
                count,
                userId
              );
              return { gradients: generatedGradients };
            },
          },
        },
        maxOutputTokens: 1000,
        temperature: 0.8,
      });

      // Extract gradients from tool results or fallback
      let gradients: Gradient[] = [];

      if (toolResults && toolResults.length > 0) {
        for (const toolResult of toolResults) {
          if (toolResult.toolName === 'generateGradients' && 'output' in toolResult) {
            const result = toolResult.output as { gradients: Gradient[] };
            gradients = result.gradients || [];
          }
        }
      }

      // If no gradients from tools, generate fallback
      if (gradients.length === 0) {
        gradients = await this.generateFallbackGradients(userPrompt, 3, userId);
      }

      logger.info(`Generated ${gradients.length} gradients with AI chat`);

      return {
        gradients,
        responseText: text || `I've created ${gradients.length} gradients for you!`,
      };
    } catch (error) {
      logger.error('Error in AI chat service:', error);
      // Fallback to simple generation
      const gradients = await this.generateFallbackGradients(userPrompt, 3, userId);
      return {
        gradients,
        responseText: 'Here are some gradients I created for you!',
      };
    }
  }

  /**
   * Stream text responses with gradient generation
   */
  static async* streamGradientGeneration(
    userPrompt: string,
    conversationHistory: Message[] = []
  ) {
    try {
      const messages: CoreMessage[] = [
        { role: 'system', content: this.systemPrompt },
        ...this.convertToAIMessages(conversationHistory),
        { role: 'user', content: userPrompt },
      ];

      const result = await streamText({
        model: this.model,
        messages,
        maxOutputTokens: 1000,
        temperature: 0.8,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      logger.error('Error streaming AI response:', error);
      throw error;
    }
  }

  /**
   * Generate gradients from a theme description
   */
  private static async generateGradientsFromTheme(
    theme: string,
    count: number,
    userId: string
  ): Promise<Gradient[]> {
    try {
      const { object } = await generateObject({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Generate gradient configurations as JSON. Return an object with a "gradients" array.',
          },
          {
            role: 'user',
            content: `Generate ${count} unique gradients for this theme: ${theme}.
            Each gradient should have: name, type (linear/radial/conic), angle (0-360),
            colorStops (array of {color: "#HEXCODE", position: 0-100}), and tags (array of strings).`,
          },
        ],
        schema: gradientSchema as any,
        maxOutputTokens: 2000,
      });

      const gradients = object.gradients.map((g: {
        name: string;
        type: 'linear' | 'radial' | 'conic';
        angle?: number;
        colorStops: Array<{ color: string; position: number }>;
        tags?: string[];
      }) => ({
        ...g,
        isPublic: false,
      }));

      // Generate previews and upload to storage
      const gradientsWithPreviews = await Promise.all(
        gradients.map(async (gradient: Gradient) => {
          try {
            const imageBuffer = await ExportService.generateImage(gradient, 400, 300, 'png');
            const { publicUrl, storagePath } = await StorageService.uploadGradientImage(
              userId,
              imageBuffer,
              'png'
            );
            return {
              ...gradient,
              previewUrl: publicUrl,
              storagePath,
              accessibilityScore: AccessibilityService.calculateGradientScore(gradient),
            };
          } catch (error) {
            logger.error('Error generating preview:', error);
            return {
              ...gradient,
              accessibilityScore: AccessibilityService.calculateGradientScore(gradient),
            };
          }
        })
      );

      return gradientsWithPreviews;
    } catch (error) {
      logger.error('Error generating gradients from theme:', error);
      return this.generateFallbackGradients(theme, count, userId);
    }
  }

  /**
   * Generate fallback gradients if AI fails
   */
  private static async generateFallbackGradients(
    _prompt: string,
    count: number,
    userId: string
  ): Promise<Gradient[]> {
    const baseColors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    const gradients: Gradient[] = [];

    for (let i = 0; i < count; i++) {
      const color1 = baseColors[i % baseColors.length];
      const color2 = baseColors[(i + 1) % baseColors.length];

      const gradient: Gradient = {
        name: `Gradient ${i + 1}`,
        type: i % 3 === 0 ? 'linear' : i % 3 === 1 ? 'radial' : 'conic',
        angle: 45 + i * 45,
        colorStops: [
          { color: color1, position: 0 },
          { color: color2, position: 100 },
        ],
        tags: ['fallback', 'generated'],
        isPublic: false,
        accessibilityScore: 0,
      };

      // Generate preview
      try {
        const imageBuffer = await ExportService.generateImage(gradient, 400, 300, 'png');
        const { publicUrl, storagePath } = await StorageService.uploadGradientImage(
          userId,
          imageBuffer,
          'png'
        );
        gradient.previewUrl = publicUrl;
        gradient.storagePath = storagePath;
        gradient.accessibilityScore = AccessibilityService.calculateGradientScore(gradient);
      } catch (error) {
        logger.error('Error generating fallback preview:', error);
      }

      gradients.push(gradient);
    }

    logger.info(`Generated ${count} fallback gradients`);
    return gradients;
  }

  /**
   * Convert Message[] to CoreMessage[] for AI SDK
   */
  private static convertToAIMessages(messages: Message[]): CoreMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }
}
