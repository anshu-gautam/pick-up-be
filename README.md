# AI Gradient Generation API

A powerful RESTful API built with Express.js and TypeScript that powers AI-driven gradient generation, user authentication, gradient library management, and accessibility validation services.

## Features

- **AI-Powered Gradient Generation**: Uses OpenAI GPT-4 to generate beautiful gradients from natural language prompts
- **Gradient Library Management**: Full CRUD operations for saving and managing gradients
- **Accessibility Validation**: WCAG 2.1 compliance checking for gradients
- **Multiple Export Formats**: Export gradients as CSS, Tailwind classes, or images (PNG/SVG)
- **User Management**: Profile management and usage statistics
- **Analytics**: Track gradient usage, trending gradients, and popular presets
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **Authentication**: Clerk-based JWT authentication
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: Supabase PostgreSQL
- **Caching**: Redis
- **Authentication**: Clerk (JWT-based)
- **AI**: OpenAI GPT-4
- **Image Processing**: Sharp
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Logging**: Winston

## Prerequisites

- Node.js >= 18.x
- PostgreSQL (via Supabase)
- Redis
- Clerk account
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pick-up-be
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with the following variables:
```env
NODE_ENV=development
PORT=3000

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
JWT_SECRET=your_jwt_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

5. Set up the database:
```bash
# Run the schema.sql file in your Supabase SQL editor
psql -h your-supabase-host -U postgres -d postgres -f database/schema.sql
```

6. Start Redis (if not already running):
```bash
redis-server
```

7. Run in development mode:
```bash
npm run dev
```

8. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### AI Generation

#### `POST /api/generate`
Generate gradients from natural language prompts using AI.

**Authentication**: Required

**Request Body**:
```json
{
  "prompt": "sunset over the ocean",
  "count": 3
}
```

**Response**:
```json
{
  "gradients": [
    {
      "name": "Ocean Sunset",
      "type": "linear",
      "angle": 135,
      "colorStops": [
        { "color": "#FF6B6B", "position": 0 },
        { "color": "#4ECDC4", "position": 100 }
      ],
      "accessibilityScore": 75,
      "tags": ["sunset", "ocean"]
    }
  ],
  "metadata": {
    "prompt": "sunset over the ocean",
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Gradient Library

#### `GET /api/gradients`
Retrieve user's saved gradients (paginated).

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Field to sort by (default: created_at)
- `sortOrder` (optional): asc or desc (default: desc)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `GET /api/gradients/public`
Browse community gradients.

**Authentication**: Optional

#### `GET /api/gradients/:id`
Retrieve a specific gradient.

**Authentication**: Optional (required for private gradients)

#### `POST /api/gradients`
Save a new gradient.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "My Gradient",
  "type": "linear",
  "angle": 90,
  "colorStops": [
    { "color": "#FF0000", "position": 0 },
    { "color": "#0000FF", "position": 100 }
  ],
  "tags": ["custom"],
  "isPublic": false
}
```

#### `PUT /api/gradients/:id`
Update an existing gradient.

**Authentication**: Required

#### `DELETE /api/gradients/:id`
Delete a gradient.

**Authentication**: Required

### Accessibility Validation

#### `POST /api/validate/accessibility`
Validate gradient accessibility against WCAG standards.

**Authentication**: Optional

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "colorStops": [
      { "color": "#000000", "position": 0 },
      { "color": "#FFFFFF", "position": 100 }
    ]
  },
  "foregroundColor": "#FFFFFF",
  "fontSize": 16,
  "fontWeight": "normal"
}
```

**Response**:
```json
{
  "results": [
    {
      "colorStop": { "color": "#000000", "position": 0 },
      "contrastRatio": 21,
      "wcagAA": true,
      "wcagAAA": true
    }
  ],
  "overallScore": 100,
  "passed": true,
  "recommendations": []
}
```

### Export Services

#### `POST /api/export/css`
Generate CSS code for a gradient.

**Authentication**: Optional

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
    "colorStops": [...]
  }
}
```

**Response**:
```json
{
  "css": "background: linear-gradient(90deg, #FF0000 0%, #0000FF 100%);"
}
```

#### `POST /api/export/tailwind`
Generate Tailwind CSS configuration.

**Authentication**: Optional

#### `POST /api/export/image`
Generate PNG or SVG image.

**Authentication**: Optional

**Request Body**:
```json
{
  "gradient": {...},
  "width": 800,
  "height": 600,
  "format": "png"
}
```

**Response**: Image file (binary)

### User Management

#### `GET /api/users/profile`
Get user profile.

**Authentication**: Required

#### `PUT /api/users/profile`
Update user profile.

**Authentication**: Required

#### `GET /api/users/stats`
Get user statistics.

**Authentication**: Required

**Response**:
```json
{
  "totalGradients": 25,
  "publicGradients": 10,
  "generationsUsed": 45,
  "generationsLimit": 100,
  "favoriteGradients": 8
}
```

### Analytics

#### `POST /api/analytics/track`
Track analytics events.

**Authentication**: Optional

#### `GET /api/analytics/trending`
Get trending gradients.

**Query Parameters**:
- `limit` (optional): Number of results (default: 10)

#### `GET /api/analytics/popular`
Get popular gradients.

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Project Structure

```
pick-up-be/
├── database/
│   └── schema.sql
├── logs/
├── src/
│   ├── __tests__/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.test.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   └── redis.ts
│   ├── controllers/
│   │   ├── accessibility.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── export.controller.ts
│   │   ├── generate.controller.ts
│   │   ├── gradient.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── validator.middleware.ts
│   ├── models/
│   │   ├── analytics.model.ts
│   │   ├── gradient.model.ts
│   │   └── user.model.ts
│   ├── routes/
│   │   ├── accessibility.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── export.routes.ts
│   │   ├── generate.routes.ts
│   │   ├── gradient.routes.ts
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   ├── accessibility.service.ts
│   │   ├── ai.service.ts
│   │   └── export.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── colorUtils.ts
│   ├── validators/
│   │   ├── accessibility.validator.ts
│   │   ├── export.validator.ts
│   │   └── gradient.validator.ts
│   ├── app.ts
│   └── index.ts
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── jest.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## Error Handling

The API uses standard HTTP status codes:

- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message",
  "details": [...]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Strict** (10 requests/minute): AI generation endpoints
- **Default** (100 requests/15 minutes): Most endpoints
- **Generous** (200 requests/15 minutes): Analytics tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
