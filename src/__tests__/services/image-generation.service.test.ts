import { ImageGenerationService, HeroImageStyle } from '../../services/image-generation.service';

// Mock the dependencies
jest.mock('@ai-sdk/google', () => ({
  google: jest.fn(() => 'mocked-model'),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('../../services/storage.service', () => ({
  StorageService: {
    uploadGradientImage: jest.fn(),
  },
}));

jest.mock('../../config/env', () => ({
  env: {
    GEMINI_IMAGE_MODEL: 'gemini-2.0-flash-exp',
    GOOGLE_GENERATIVE_AI_API_KEY: 'test-api-key',
  },
}));

jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

import { generateText } from 'ai';
import { StorageService } from '../../services/storage.service';

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockUploadGradientImage = StorageService.uploadGradientImage as jest.MockedFunction<typeof StorageService.uploadGradientImage>;

describe('ImageGenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage mock with default response
    mockUploadGradientImage.mockResolvedValue({
      publicUrl: 'https://storage.example.com/test-image.png',
      storagePath: 'user123/generated-test-uuid.png',
    });
  });

  describe('generateHeroImage', () => {
    const mockUserId = 'user123';
    const mockImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header

    beforeEach(() => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: mockImageData,
            mediaType: 'image/png',
            base64: 'iVBORw0KGgo=',
          },
        ],
        text: 'Image generated successfully',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);
    });

    it('should generate a hero image with default style', async () => {
      const result = await ImageGenerationService.generateHeroImage(
        { prompt: 'A modern tech background' },
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('storagePath');
      expect(result).toHaveProperty('prompt', 'A modern tech background');
      expect(result).toHaveProperty('style', 'abstract'); // default style
      expect(result).toHaveProperty('mimeType', 'image/png');
      expect(result).toHaveProperty('generatedAt');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate a hero image with specified style', async () => {
      const result = await ImageGenerationService.generateHeroImage(
        { prompt: 'Business landing page', style: 'business' },
        mockUserId
      );

      expect(result.style).toBe('business');
    });

    it('should include text in prompt when provided', async () => {
      await ImageGenerationService.generateHeroImage(
        {
          prompt: 'Sale banner',
          includeText: '50% OFF',
          style: 'minimal'
        },
        mockUserId
      );

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('50% OFF'),
            }),
          ]),
        })
      );
    });

    it('should include mood in prompt when provided', async () => {
      await ImageGenerationService.generateHeroImage(
        {
          prompt: 'Hero section',
          mood: 'calm and professional'
        },
        mockUserId
      );

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('calm and professional'),
            }),
          ]),
        })
      );
    });

    it('should include color scheme in prompt when provided', async () => {
      await ImageGenerationService.generateHeroImage(
        {
          prompt: 'Hero section',
          colorScheme: 'blue and purple'
        },
        mockUserId
      );

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('blue and purple'),
            }),
          ]),
        })
      );
    });

    it('should throw error when no image is generated', async () => {
      mockGenerateText.mockResolvedValue({
        files: [],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 0 },
      } as any);

      await expect(
        ImageGenerationService.generateHeroImage(
          { prompt: 'Test prompt' },
          mockUserId
        )
      ).rejects.toThrow('No image generated by Gemini');
    });

    it('should throw error when files is undefined', async () => {
      mockGenerateText.mockResolvedValue({
        files: undefined,
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 0 },
      } as any);

      await expect(
        ImageGenerationService.generateHeroImage(
          { prompt: 'Test prompt' },
          mockUserId
        )
      ).rejects.toThrow('No image generated by Gemini');
    });

    it('should handle jpeg images', async () => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: new Uint8Array([255, 216, 255]), // JPEG header
            mediaType: 'image/jpeg',
            base64: '/9j/4AAQSkZ=',
          },
        ],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);

      const result = await ImageGenerationService.generateHeroImage(
        { prompt: 'Test prompt' },
        mockUserId
      );

      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should default to png when mediaType is missing', async () => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: mockImageData,
            mediaType: undefined,
            base64: 'iVBORw0KGgo=',
          },
        ],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);

      const result = await ImageGenerationService.generateHeroImage(
        { prompt: 'Test prompt' },
        mockUserId
      );

      expect(result.mimeType).toBe('image/png');
    });

    it('should call storage service with correct parameters', async () => {
      await ImageGenerationService.generateHeroImage(
        { prompt: 'Test prompt' },
        mockUserId
      );

      expect(StorageService.uploadGradientImage).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'png',
        expect.stringContaining('generated-')
      );
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(
        ImageGenerationService.generateHeroImage(
          { prompt: 'Test prompt' },
          mockUserId
        )
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle storage errors gracefully', async () => {
      mockUploadGradientImage.mockRejectedValueOnce(
        new Error('Storage upload failed')
      );

      await expect(
        ImageGenerationService.generateHeroImage(
          { prompt: 'Test prompt' },
          mockUserId
        )
      ).rejects.toThrow('Storage upload failed');
    });
  });

  describe('generateHeroImageVariations', () => {
    const mockUserId = 'user123';
    const mockImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    beforeEach(() => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: mockImageData,
            mediaType: 'image/png',
            base64: 'iVBORw0KGgo=',
          },
        ],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);
    });

    it('should generate default 3 variations', async () => {
      const results = await ImageGenerationService.generateHeroImageVariations(
        { prompt: 'Landing page hero' },
        mockUserId
      );

      expect(results).toHaveLength(3);
      expect(mockGenerateText).toHaveBeenCalledTimes(3);
    });

    it('should generate specified number of variations', async () => {
      const results = await ImageGenerationService.generateHeroImageVariations(
        { prompt: 'Landing page hero' },
        mockUserId,
        5
      );

      expect(results).toHaveLength(5);
      expect(mockGenerateText).toHaveBeenCalledTimes(5);
    });

    it('should generate single variation when count is 1', async () => {
      const results = await ImageGenerationService.generateHeroImageVariations(
        { prompt: 'Landing page hero' },
        mockUserId,
        1
      );

      expect(results).toHaveLength(1);
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });

    it('should use related styles based on primary style', async () => {
      const results = await ImageGenerationService.generateHeroImageVariations(
        { prompt: 'Tech product', style: 'tech' },
        mockUserId,
        3
      );

      expect(results).toHaveLength(3);
      // First should be the primary style
      expect(results[0].style).toBe('tech');
    });

    it('should use default styles when no primary style provided', async () => {
      const results = await ImageGenerationService.generateHeroImageVariations(
        { prompt: 'Generic hero' },
        mockUserId,
        2
      );

      expect(results).toHaveLength(2);
    });

    it('should handle errors during variation generation', async () => {
      mockGenerateText
        .mockResolvedValueOnce({
          files: [
            {
              uint8Array: mockImageData,
              mediaType: 'image/png',
              base64: 'iVBORw0KGgo=',
            },
          ],
          text: '',
          toolResults: [],
          toolCalls: [],
          finishReason: 'stop',
          usage: { promptTokens: 100, completionTokens: 50 },
        } as any)
        .mockRejectedValueOnce(new Error('Generation failed'));

      await expect(
        ImageGenerationService.generateHeroImageVariations(
          { prompt: 'Test prompt' },
          mockUserId,
          2
        )
      ).rejects.toThrow('Generation failed');
    });
  });

  describe('generateImageWithText', () => {
    const mockUserId = 'user123';
    const mockImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    beforeEach(() => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: mockImageData,
            mediaType: 'image/png',
            base64: 'iVBORw0KGgo=',
          },
        ],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);
    });

    it('should generate image with text using default minimal style', async () => {
      const result = await ImageGenerationService.generateImageWithText(
        'Sale banner',
        '50% OFF',
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('style', 'minimal');
    });

    it('should generate image with text using specified style', async () => {
      const result = await ImageGenerationService.generateImageWithText(
        'Sale banner',
        '50% OFF',
        mockUserId,
        'business'
      );

      expect(result.style).toBe('business');
    });

    it('should include text in the generation prompt', async () => {
      await ImageGenerationService.generateImageWithText(
        'Banner',
        'SALE NOW',
        mockUserId
      );

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('SALE NOW'),
            }),
          ]),
        })
      );
    });
  });

  describe('editImage', () => {
    const mockUserId = 'user123';
    const mockImageUrl = 'https://storage.example.com/original.png';
    const mockImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    beforeEach(() => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: mockImageData,
            mediaType: 'image/png',
            base64: 'iVBORw0KGgo=',
          },
        ],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);
    });

    it('should edit an existing image', async () => {
      const result = await ImageGenerationService.editImage(
        mockImageUrl,
        'Make it brighter',
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('storagePath');
      expect(result).toHaveProperty('prompt', 'Make it brighter');
      expect(result).toHaveProperty('style', 'abstract');
    });

    it('should include image URL in the API call', async () => {
      await ImageGenerationService.editImage(
        mockImageUrl,
        'Add blue tint',
        mockUserId
      );

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image',
                }),
                expect.objectContaining({
                  type: 'text',
                  text: 'Add blue tint',
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should throw error when no edited image is generated', async () => {
      mockGenerateText.mockResolvedValue({
        files: [],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 0 },
      } as any);

      await expect(
        ImageGenerationService.editImage(
          mockImageUrl,
          'Test edit',
          mockUserId
        )
      ).rejects.toThrow('No edited image generated');
    });
  });

  describe('getAvailableStyles', () => {
    it('should return all available styles', () => {
      const styles = ImageGenerationService.getAvailableStyles();

      expect(styles).toBeInstanceOf(Array);
      expect(styles.length).toBe(10);
    });

    it('should include style and description for each style', () => {
      const styles = ImageGenerationService.getAvailableStyles();

      styles.forEach((styleInfo) => {
        expect(styleInfo).toHaveProperty('style');
        expect(styleInfo).toHaveProperty('description');
        expect(typeof styleInfo.style).toBe('string');
        expect(typeof styleInfo.description).toBe('string');
        expect(styleInfo.description.length).toBeGreaterThan(0);
      });
    });

    it('should contain all expected style types', () => {
      const styles = ImageGenerationService.getAvailableStyles();
      const styleNames = styles.map((s) => s.style);

      const expectedStyles: HeroImageStyle[] = [
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

      expectedStyles.forEach((expected) => {
        expect(styleNames).toContain(expected);
      });
    });

    it('should have descriptions ending with period', () => {
      const styles = ImageGenerationService.getAvailableStyles();

      styles.forEach((styleInfo) => {
        expect(styleInfo.description.endsWith('.')).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    const mockUserId = 'user123';
    const mockImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    beforeEach(() => {
      mockGenerateText.mockResolvedValue({
        files: [
          {
            uint8Array: mockImageData,
            mediaType: 'image/png',
            base64: 'iVBORw0KGgo=',
          },
        ],
        text: '',
        toolResults: [],
        toolCalls: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      } as any);
    });

    it('should handle empty prompt', async () => {
      const result = await ImageGenerationService.generateHeroImage(
        { prompt: '' },
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
    });

    it('should handle very long prompt', async () => {
      const longPrompt = 'A'.repeat(1000);
      const result = await ImageGenerationService.generateHeroImage(
        { prompt: longPrompt },
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
    });

    it('should handle special characters in prompt', async () => {
      const result = await ImageGenerationService.generateHeroImage(
        { prompt: 'Test with <script>alert("xss")</script> & special chars!' },
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
    });

    it('should handle unicode in text overlay', async () => {
      const result = await ImageGenerationService.generateImageWithText(
        'Banner',
        '特价销售 50% OFF! 🎉',
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
    });

    it('should handle all style types', async () => {
      const styles: HeroImageStyle[] = [
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

      for (const style of styles) {
        const result = await ImageGenerationService.generateHeroImage(
          { prompt: 'Test', style },
          mockUserId
        );

        expect(result.style).toBe(style);
      }
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        ImageGenerationService.generateHeroImage({ prompt: 'Test 1' }, mockUserId),
        ImageGenerationService.generateHeroImage({ prompt: 'Test 2' }, mockUserId),
        ImageGenerationService.generateHeroImage({ prompt: 'Test 3' }, mockUserId),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('imageUrl');
      });
    });

    it('should handle all optional parameters', async () => {
      const result = await ImageGenerationService.generateHeroImage(
        {
          prompt: 'Full test',
          style: 'tech',
          includeText: 'Welcome',
          mood: 'exciting',
          colorScheme: 'neon colors',
        },
        mockUserId
      );

      expect(result).toHaveProperty('imageUrl');
      expect(result.style).toBe('tech');
    });
  });
});
