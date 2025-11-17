# API Documentation

Complete API reference for the AI Gradient Generation API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using Clerk JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
  "data": {...},
  "metadata": {...}
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Endpoints

### 1. AI Generation

#### Generate Gradients

**Endpoint**: `POST /api/generate`

**Authentication**: Required

**Description**: Generate AI-powered gradients from natural language prompts.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "prompt": "sunset over the ocean with warm colors",
  "count": 3
}
```

**Parameters**:
- `prompt` (string, required): Natural language description of desired gradient
- `count` (number, optional): Number of gradients to generate (1-5, default: 3)

**Success Response** (200 OK):
```json
{
  "gradients": [
    {
      "name": "Ocean Sunset Harmony",
      "type": "linear",
      "angle": 135,
      "colorStops": [
        { "color": "#FF6B6B", "position": 0 },
        { "color": "#FFD93D", "position": 50 },
        { "color": "#4ECDC4", "position": 100 }
      ],
      "accessibilityScore": 78,
      "tags": ["sunset", "ocean", "warm"],
      "isPublic": false
    }
  ],
  "metadata": {
    "prompt": "sunset over the ocean with warm colors",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `429 Too Many Requests`: Rate limit exceeded (10 requests/minute)
- `400 Bad Request`: Invalid request parameters

**Rate Limit**: 10 requests per minute

---

### 2. Gradient Library

#### Get User Gradients

**Endpoint**: `GET /api/gradients`

**Authentication**: Required

**Description**: Retrieve paginated list of user's saved gradients.

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `sortBy` (string, optional): Field to sort by (created_at, name, accessibility_score)
- `sortOrder` (string, optional): asc or desc (default: desc)

**Example**:
```
GET /api/gradients?page=1&limit=20&sortBy=created_at&sortOrder=desc
```

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user_abc123",
      "name": "Ocean Gradient",
      "type": "linear",
      "angle": 90,
      "colorStops": [...],
      "accessibilityScore": 85,
      "tags": ["ocean", "blue"],
      "isPublic": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Public Gradients

**Endpoint**: `GET /api/gradients/public`

**Authentication**: Optional

**Description**: Browse community-shared public gradients.

**Query Parameters**: Same as "Get User Gradients"

#### Get Specific Gradient

**Endpoint**: `GET /api/gradients/:id`

**Authentication**: Optional (required for private gradients)

**Description**: Retrieve a specific gradient by ID.

**URL Parameters**:
- `id` (UUID, required): Gradient ID

**Success Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_abc123",
  "name": "Ocean Gradient",
  "type": "linear",
  "angle": 90,
  "colorStops": [
    { "color": "#1A535C", "position": 0 },
    { "color": "#4ECDC4", "position": 100 }
  ],
  "accessibilityScore": 85,
  "tags": ["ocean"],
  "isPublic": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Gradient doesn't exist
- `403 Forbidden`: Private gradient, authentication required

#### Create Gradient

**Endpoint**: `POST /api/gradients`

**Authentication**: Required

**Description**: Save a new gradient to user's library.

**Request Body**:
```json
{
  "name": "My Custom Gradient",
  "type": "linear",
  "angle": 90,
  "colorStops": [
    { "color": "#FF0000", "position": 0 },
    { "color": "#0000FF", "position": 100 }
  ],
  "tags": ["custom", "red-blue"],
  "isPublic": false
}
```

**Parameters**:
- `name` (string, required): Gradient name (1-255 characters)
- `type` (string, required): linear, radial, or conic
- `angle` (number, optional): Angle in degrees (0-360)
- `colorStops` (array, required): Array of color stops (minimum 2)
  - `color` (string): Hex color (#RRGGBB)
  - `position` (number): Position 0-100
- `tags` (array, optional): Array of tag strings
- `isPublic` (boolean, optional): Whether gradient is public (default: false)

**Success Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_abc123",
  "name": "My Custom Gradient",
  "type": "linear",
  "angle": 90,
  "colorStops": [...],
  "accessibilityScore": 72,
  "tags": ["custom", "red-blue"],
  "isPublic": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Update Gradient

**Endpoint**: `PUT /api/gradients/:id`

**Authentication**: Required

**Description**: Update an existing gradient (only owned gradients).

**URL Parameters**:
- `id` (UUID, required): Gradient ID

**Request Body**: Same as Create Gradient (all fields optional)

**Success Response** (200 OK): Updated gradient object

**Error Responses**:
- `404 Not Found`: Gradient doesn't exist
- `403 Forbidden`: Not the gradient owner

#### Delete Gradient

**Endpoint**: `DELETE /api/gradients/:id`

**Authentication**: Required

**Description**: Delete a gradient (only owned gradients).

**URL Parameters**:
- `id` (UUID, required): Gradient ID

**Success Response** (204 No Content): Empty response

---

### 3. Accessibility Validation

#### Validate Gradient Accessibility

**Endpoint**: `POST /api/validate/accessibility`

**Authentication**: Optional

**Description**: Validate gradient against WCAG 2.1 accessibility standards.

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
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

**Parameters**:
- `gradient` (object, required): Gradient to validate
- `foregroundColor` (string, required): Foreground/text color (#RRGGBB)
- `fontSize` (number, optional): Font size in pixels (8-72, default: 16)
- `fontWeight` (string, optional): normal or bold (default: normal)

**Success Response** (200 OK):
```json
{
  "results": [
    {
      "colorStop": { "color": "#000000", "position": 0 },
      "contrastRatio": 21.00,
      "wcagAA": true,
      "wcagAAA": true
    },
    {
      "colorStop": { "color": "#FFFFFF", "position": 100 },
      "contrastRatio": 1.00,
      "wcagAA": false,
      "wcagAAA": false,
      "suggestions": [
        "Consider using #000000 instead of #FFFFFF for better contrast"
      ]
    }
  ],
  "overallScore": 65,
  "passed": false,
  "recommendations": [
    "Some color stops do not meet WCAG AA standards for the given text size",
    "Consider using larger text or adjusting foreground colors"
  ]
}
```

---

### 4. Export Services

#### Export as CSS

**Endpoint**: `POST /api/export/css`

**Authentication**: Optional

**Description**: Generate CSS code for a gradient.

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
    "colorStops": [
      { "color": "#FF0000", "position": 0 },
      { "color": "#0000FF", "position": 100 }
    ]
  }
}
```

**Success Response** (200 OK):
```json
{
  "css": "background: linear-gradient(90deg, #FF0000 0%, #0000FF 100%);"
}
```

#### Export as Tailwind

**Endpoint**: `POST /api/export/tailwind`

**Authentication**: Optional

**Description**: Generate Tailwind CSS configuration.

**Request Body**: Same as Export CSS

**Success Response** (200 OK):
```json
{
  "tailwind": "/* Tailwind configuration and usage instructions */"
}
```

#### Export as Image

**Endpoint**: `POST /api/export/image`

**Authentication**: Optional

**Description**: Generate PNG or SVG image of gradient.

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
    "colorStops": [...]
  },
  "width": 800,
  "height": 600,
  "format": "png"
}
```

**Parameters**:
- `gradient` (object, required): Gradient definition
- `width` (number, required): Image width in pixels (100-4000)
- `height` (number, required): Image height in pixels (100-4000)
- `format` (string, required): png or svg

**Success Response** (200 OK):
- Content-Type: image/png or image/svg+xml
- Body: Binary image data
- Headers: Content-Disposition: attachment; filename="gradient.{format}"

---

### 5. User Management

#### Get Profile

**Endpoint**: `GET /api/users/profile`

**Authentication**: Required

**Description**: Get current user's profile.

**Success Response** (200 OK):
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "preferences": {
    "defaultGradientType": "linear",
    "theme": "dark"
  }
}
```

#### Update Profile

**Endpoint**: `PUT /api/users/profile`

**Authentication**: Required

**Description**: Update user profile.

**Request Body**:
```json
{
  "name": "Jane Doe",
  "preferences": {
    "defaultGradientType": "radial",
    "theme": "light"
  }
}
```

**Success Response** (200 OK): Updated user profile

#### Get Stats

**Endpoint**: `GET /api/users/stats`

**Authentication**: Required

**Description**: Get user usage statistics.

**Success Response** (200 OK):
```json
{
  "totalGradients": 25,
  "publicGradients": 10,
  "generationsUsed": 45,
  "generationsLimit": 100,
  "favoriteGradients": 8
}
```

---

### 6. Analytics

#### Track Event

**Endpoint**: `POST /api/analytics/track`

**Authentication**: Optional

**Description**: Track analytics events.

**Request Body**:
```json
{
  "eventType": "generation",
  "gradientId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "source": "web",
    "version": "1.0"
  }
}
```

**Parameters**:
- `eventType` (string, required): generation, export, save, or view
- `gradientId` (UUID, optional): Related gradient ID
- `metadata` (object, optional): Additional event data

**Success Response** (201 Created):
```json
{
  "success": true
}
```

#### Get Trending Gradients

**Endpoint**: `GET /api/analytics/trending`

**Authentication**: None

**Description**: Get trending gradients based on recent activity.

**Query Parameters**:
- `limit` (number, optional): Number of results (default: 10, max: 50)

**Success Response** (200 OK):
```json
[
  {
    "gradient": {...},
    "viewCount": 1250,
    "saveCount": 340,
    "exportCount": 890
  }
]
```

#### Get Popular Gradients

**Endpoint**: `GET /api/analytics/popular`

**Authentication**: None

**Description**: Get most popular gradients by accessibility score.

**Query Parameters**: Same as Trending

**Success Response** (200 OK): Array of gradient objects

---

## Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| AI Generation | 10 requests | 1 minute |
| Default | 100 requests | 15 minutes |
| Analytics | 200 requests | 15 minutes |

Rate limit headers included in responses:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1642251600
```

## Webhooks

Coming soon: Clerk webhook integration for user lifecycle events.

## Versioning

Current API version: v1

Future versions will be accessible via `/api/v2` prefix.
