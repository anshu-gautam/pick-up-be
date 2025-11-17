export interface ColorStop {
  color: string;
  position: number;
}

export interface Gradient {
  id?: string;
  userId?: string;
  name: string;
  type: 'linear' | 'radial' | 'conic';
  angle?: number;
  colorStops: ColorStop[];
  accessibilityScore?: number;
  tags?: string[];
  isPublic?: boolean;
  conversationId?: string;
  messageId?: string;
  previewUrl?: string;
  storagePath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GenerateGradientRequest {
  prompt: string;
  count?: number;
}

export interface GenerateGradientResponse {
  gradients: Gradient[];
  metadata: {
    prompt: string;
    generatedAt: Date;
  };
}

export interface AccessibilityValidationRequest {
  gradient: Gradient;
  foregroundColor: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
}

export interface ContrastResult {
  colorStop: ColorStop;
  contrastRatio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  suggestions?: string[];
}

export interface AccessibilityValidationResponse {
  results: ContrastResult[];
  overallScore: number;
  passed: boolean;
  recommendations: string[];
}

export interface ExportCSSRequest {
  gradient: Gradient;
}

export interface ExportTailwindRequest {
  gradient: Gradient;
}

export interface ExportImageRequest {
  gradient: Gradient;
  width: number;
  height: number;
  format: 'png' | 'svg';
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  preferences?: {
    defaultGradientType?: 'linear' | 'radial' | 'conic';
    theme?: 'light' | 'dark';
  };
}

export interface UserStats {
  totalGradients: number;
  publicGradients: number;
  generationsUsed: number;
  generationsLimit: number;
  favoriteGradients: number;
}

export interface AnalyticsEvent {
  eventType: 'generation' | 'export' | 'save' | 'view';
  gradientId?: string;
  metadata?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

export interface TrendingGradient {
  gradient: Gradient;
  viewCount: number;
  saveCount: number;
  exportCount: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Conversation and Message types for chat-based gradient generation
export interface Conversation {
  id?: string;
  userId: string;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Message {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestedGradients?: Gradient[];
  createdAt?: Date;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export interface CreateConversationRequest {
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  message: Message;
  conversation: Conversation;
}
