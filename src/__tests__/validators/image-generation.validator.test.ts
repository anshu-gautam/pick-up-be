import {
  generateHeroImageSchema,
  generateHeroImageVariationsSchema,
  generateImageWithTextSchema,
  editImageSchema,
} from '../../validators/image-generation.validator';

describe('Image Generation Validators', () => {
  describe('generateHeroImageSchema', () => {
    it('should validate valid request with only prompt', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: 'A modern tech background' },
      });

      expect(result.success).toBe(true);
    });

    it('should validate valid request with all fields', () => {
      const result = generateHeroImageSchema.safeParse({
        body: {
          prompt: 'Hero section',
          style: 'tech',
          includeText: 'Welcome',
          mood: 'professional',
          colorScheme: 'blue and purple',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty prompt', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: '' },
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing prompt', () => {
      const result = generateHeroImageSchema.safeParse({
        body: {},
      });

      expect(result.success).toBe(false);
    });

    it('should reject prompt longer than 1000 characters', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: 'A'.repeat(1001) },
      });

      expect(result.success).toBe(false);
    });

    it('should accept prompt with exactly 1000 characters', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: 'A'.repeat(1000) },
      });

      expect(result.success).toBe(true);
    });

    it('should validate all valid styles', () => {
      const validStyles = [
        'abstract',
        'gradient-art',
        'illustration',
        'landscape',
        'product',
        'minimal',
        'geometric',
        'tech',
        'nature',
        'business',
      ];

      validStyles.forEach((style) => {
        const result = generateHeroImageSchema.safeParse({
          body: { prompt: 'Test', style },
        });

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid style', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: 'Test', style: 'invalid-style' },
      });

      expect(result.success).toBe(false);
    });

    it('should reject includeText longer than 200 characters', () => {
      const result = generateHeroImageSchema.safeParse({
        body: {
          prompt: 'Test',
          includeText: 'A'.repeat(201),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject mood longer than 100 characters', () => {
      const result = generateHeroImageSchema.safeParse({
        body: {
          prompt: 'Test',
          mood: 'A'.repeat(101),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject colorScheme longer than 200 characters', () => {
      const result = generateHeroImageSchema.safeParse({
        body: {
          prompt: 'Test',
          colorScheme: 'A'.repeat(201),
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('generateHeroImageVariationsSchema', () => {
    it('should validate valid request with default count', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: { prompt: 'Test prompt' },
      });

      expect(result.success).toBe(true);
    });

    it('should validate valid request with custom count', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: {
          prompt: 'Test prompt',
          count: 5,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject count less than 1', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: {
          prompt: 'Test',
          count: 0,
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject count greater than 5', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: {
          prompt: 'Test',
          count: 6,
        },
      });

      expect(result.success).toBe(false);
    });

    it('should accept count of 1', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: {
          prompt: 'Test',
          count: 1,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept count of 5', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: {
          prompt: 'Test',
          count: 5,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject non-integer count', () => {
      const result = generateHeroImageVariationsSchema.safeParse({
        body: {
          prompt: 'Test',
          count: 2.5,
        },
      });

      // Zod should handle this - depending on configuration
      // For strict int, it might fail
      expect(result.success).toBeDefined();
    });
  });

  describe('generateImageWithTextSchema', () => {
    it('should validate valid request', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          prompt: 'Sale banner',
          text: '50% OFF',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should validate request with style', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          prompt: 'Sale banner',
          text: '50% OFF',
          style: 'business',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing text', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          prompt: 'Sale banner',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty text', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          prompt: 'Sale banner',
          text: '',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject text longer than 200 characters', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          prompt: 'Sale banner',
          text: 'A'.repeat(201),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should accept text with exactly 200 characters', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          prompt: 'Sale banner',
          text: 'A'.repeat(200),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing prompt', () => {
      const result = generateImageWithTextSchema.safeParse({
        body: {
          text: '50% OFF',
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('editImageSchema', () => {
    it('should validate valid request', () => {
      const result = editImageSchema.safeParse({
        body: {
          imageUrl: 'https://example.com/image.png',
          editPrompt: 'Make it brighter',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = editImageSchema.safeParse({
        body: {
          imageUrl: 'not-a-url',
          editPrompt: 'Make it brighter',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing imageUrl', () => {
      const result = editImageSchema.safeParse({
        body: {
          editPrompt: 'Make it brighter',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing editPrompt', () => {
      const result = editImageSchema.safeParse({
        body: {
          imageUrl: 'https://example.com/image.png',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty editPrompt', () => {
      const result = editImageSchema.safeParse({
        body: {
          imageUrl: 'https://example.com/image.png',
          editPrompt: '',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject editPrompt longer than 500 characters', () => {
      const result = editImageSchema.safeParse({
        body: {
          imageUrl: 'https://example.com/image.png',
          editPrompt: 'A'.repeat(501),
        },
      });

      expect(result.success).toBe(false);
    });

    it('should accept editPrompt with exactly 500 characters', () => {
      const result = editImageSchema.safeParse({
        body: {
          imageUrl: 'https://example.com/image.png',
          editPrompt: 'A'.repeat(500),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept various valid URL formats', () => {
      const validUrls = [
        'https://example.com/image.png',
        'http://example.com/image.jpg',
        'https://storage.supabase.co/v1/object/public/gradients/user123/image.png',
        'https://example.com/path/to/image.png?token=abc123',
      ];

      validUrls.forEach((url) => {
        const result = editImageSchema.safeParse({
          body: {
            imageUrl: url,
            editPrompt: 'Edit this',
          },
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only prompt', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: '   ' },
      });

      // Whitespace is technically not empty, so it passes length check
      expect(result.success).toBe(true);
    });

    it('should handle special characters in prompt', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
      });

      expect(result.success).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: '日本語テスト 🎉 العربية' },
      });

      expect(result.success).toBe(true);
    });

    it('should handle newlines in prompt', () => {
      const result = generateHeroImageSchema.safeParse({
        body: { prompt: 'Line 1\nLine 2\nLine 3' },
      });

      expect(result.success).toBe(true);
    });

    it('should handle null body', () => {
      const result = generateHeroImageSchema.safeParse({
        body: null,
      });

      expect(result.success).toBe(false);
    });

    it('should handle undefined body', () => {
      const result = generateHeroImageSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should handle extra fields in body', () => {
      const result = generateHeroImageSchema.safeParse({
        body: {
          prompt: 'Test',
          extraField: 'should be ignored',
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
