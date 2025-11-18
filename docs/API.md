# Gradient Generation API Documentation

Complete API reference for connecting your frontend to the Gradient Generation backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses **Clerk JWT tokens** for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-clerk-jwt-token>
```

### Authentication Types

- **Required**: Endpoint requires valid JWT token
- **Optional**: Endpoint works with or without token (additional features with auth)
- **None**: No authentication needed

---

## Clerk Setup Guide

This API uses [Clerk](https://clerk.com) for authentication. Clerk handles all user management on the frontend, and this API verifies the JWT tokens.

### 1. Create a Clerk Application

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Choose your sign-in methods (Email, Google, GitHub, etc.)
4. Get your API keys from the dashboard

### 2. Get Your API Keys

From your Clerk Dashboard, you'll need:

| Key | Location | Used For |
|-----|----------|----------|
| `CLERK_PUBLISHABLE_KEY` | API Keys page | Frontend SDK |
| `CLERK_SECRET_KEY` | API Keys page | Backend verification |

### 3. Frontend Setup (React/Next.js)

#### Install Clerk

```bash
npm install @clerk/nextjs
# or
npm install @clerk/clerk-react
```

#### Configure Environment Variables

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### Wrap Your App with ClerkProvider

**Next.js (app/layout.tsx)**:
```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**React (main.tsx)**:
```tsx
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
)
```

#### Add Sign In/Sign Up Components

```tsx
import { SignIn, SignUp, UserButton } from '@clerk/nextjs'

// Sign In Page
export default function SignInPage() {
  return <SignIn />
}

// Sign Up Page
export default function SignUpPage() {
  return <SignUp />
}

// User Button (shows user menu when signed in)
export default function Header() {
  return (
    <header>
      <UserButton afterSignOutUrl="/" />
    </header>
  )
}
```

### 4. Making Authenticated API Requests

#### Using useAuth Hook

```tsx
import { useAuth } from '@clerk/nextjs'

function GradientGenerator() {
  const { getToken, isSignedIn } = useAuth()

  const generateGradient = async () => {
    if (!isSignedIn) {
      // Redirect to sign in
      return
    }

    // Get the JWT token from Clerk
    const token = await getToken()

    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: 'Create a sunset gradient',
        count: 3,
      }),
    })

    const data = await response.json()
    console.log(data.gradients)
  }

  return (
    <button onClick={generateGradient}>
      Generate Gradient
    </button>
  )
}
```

#### Creating an API Client

```typescript
// lib/api.ts
import { useAuth } from '@clerk/nextjs'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export function useApiClient() {
  const { getToken } = useAuth()

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken()

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  return {
    // Generate gradients
    generate: (prompt: string, count?: number) =>
      fetchWithAuth('/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, count }),
      }),

    // Get user's gradients
    getGradients: (page = 1, limit = 10) =>
      fetchWithAuth(`/gradients?page=${page}&limit=${limit}`),

    // Get single gradient
    getGradient: (id: string) =>
      fetchWithAuth(`/gradients/${id}`),

    // Save gradient
    saveGradient: (gradient: any) =>
      fetchWithAuth('/gradients', {
        method: 'POST',
        body: JSON.stringify(gradient),
      }),

    // Delete gradient
    deleteGradient: (id: string) =>
      fetchWithAuth(`/gradients/${id}`, { method: 'DELETE' }),

    // Send chat message
    sendMessage: (content: string, conversationId?: string) =>
      fetchWithAuth('/conversations/messages', {
        method: 'POST',
        body: JSON.stringify({ content, conversationId }),
      }),

    // Get conversations
    getConversations: () =>
      fetchWithAuth('/conversations'),

    // Get user profile
    getProfile: () =>
      fetchWithAuth('/users/profile'),

    // Get user stats
    getStats: () =>
      fetchWithAuth('/users/stats'),

    // Export as CSS
    exportCSS: (gradient: any) =>
      fetchWithAuth('/export/css', {
        method: 'POST',
        body: JSON.stringify({ gradient }),
      }),

    // Validate accessibility
    validateAccessibility: (gradient: any, foregroundColor: string) =>
      fetchWithAuth('/validate/accessibility', {
        method: 'POST',
        body: JSON.stringify({ gradient, foregroundColor }),
      }),
  }
}
```

#### Usage Example

```tsx
import { useApiClient } from '@/lib/api'

function MyComponent() {
  const api = useApiClient()
  const [gradients, setGradients] = useState([])

  useEffect(() => {
    const loadGradients = async () => {
      try {
        const data = await api.getGradients()
        setGradients(data.data)
      } catch (error) {
        console.error('Failed to load gradients:', error)
      }
    }

    loadGradients()
  }, [])

  const handleGenerate = async () => {
    const result = await api.generate('ocean sunset colors', 3)
    setGradients(prev => [...result.gradients, ...prev])
  }

  return (
    <div>
      <button onClick={handleGenerate}>Generate</button>
      {gradients.map(g => <GradientCard key={g.id} gradient={g} />)}
    </div>
  )
}
```

### 5. Backend Environment Variables

Set these in your backend `.env` file:

```env
# Clerk (required for auth)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 6. Protecting Routes in Frontend

**Next.js Middleware (middleware.ts)**:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/gallery(.*)',
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

**Protect Specific Pages**:
```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <Dashboard />
}
```

### 7. Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │    Clerk    │     │   Backend   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Sign In        │                   │
       │──────────────────>│                   │
       │                   │                   │
       │ 2. JWT Token      │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 3. API Request with Bearer Token      │
       │──────────────────────────────────────>│
       │                   │                   │
       │                   │ 4. Verify Token   │
       │                   │<──────────────────│
       │                   │                   │
       │                   │ 5. Token Valid    │
       │                   │──────────────────>│
       │                   │                   │
       │ 6. API Response                       │
       │<──────────────────────────────────────│
       │                   │                   │
```

### 8. Handling Auth Errors

```tsx
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

function ProtectedComponent() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  // Wait for Clerk to load
  if (!isLoaded) {
    return <LoadingSpinner />
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    router.push('/sign-in')
    return null
  }

  return <YourComponent />
}
```

### 9. Clerk Webhooks (Optional)

To sync user data when users sign up/update in Clerk:

1. Go to Clerk Dashboard > Webhooks
2. Add endpoint: `https://your-api.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`

---

## Table of Contents

1. [Health Check](#health-check)
2. [Generate Gradients](#generate-gradients)
3. [Gradients CRUD](#gradients-crud)
4. [Conversations (Chat-based Generation)](#conversations)
5. [Accessibility Validation](#accessibility-validation)
6. [Export](#export)
7. [User Profile](#user-profile)
8. [Analytics](#analytics)

---

## Health Check

### GET /api/health

Check if the API is running.

**Authentication**: None

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Generate Gradients

### POST /api/generate

Generate gradients from a natural language prompt using AI.

**Authentication**: Required

**Rate Limit**: Strict (10 requests per minute)

**Request Body**:
```json
{
  "prompt": "sunset over the ocean with warm orange and purple tones",
  "count": 3
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Natural language description (1-500 chars) |
| count | number | No | Number of gradients to generate (1-5, default: 3) |

**Response** (200 OK):
```json
{
  "gradients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Ocean Sunset",
      "type": "linear",
      "angle": 135,
      "colorStops": [
        { "color": "#FF6B35", "position": 0 },
        { "color": "#F7931E", "position": 50 },
        { "color": "#9B4DCA", "position": 100 }
      ],
      "tags": ["sunset", "ocean", "warm"],
      "accessibilityScore": 8.5,
      "isPublic": false,
      "previewUrl": "https://storage.supabase.co/...",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "prompt": "sunset over the ocean with warm orange and purple tones",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Gradients CRUD

### GET /api/gradients

Get user's gradients (paginated).

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| sortBy | string | No | Sort field (default: "createdAt") |
| sortOrder | string | No | "asc" or "desc" (default: "desc") |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user_123",
      "name": "My Gradient",
      "type": "linear",
      "angle": 90,
      "colorStops": [
        { "color": "#667eea", "position": 0 },
        { "color": "#764ba2", "position": 100 }
      ],
      "accessibilityScore": 7.5,
      "tags": ["purple", "blue"],
      "isPublic": false,
      "previewUrl": "https://storage.supabase.co/...",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET /api/gradients/public

Get public gradients from all users.

**Authentication**: Optional

**Query Parameters**: Same as GET /api/gradients

**Response**: Same structure as GET /api/gradients

---

### GET /api/gradients/:id

Get a specific gradient by ID.

**Authentication**: Optional (can view own private + all public)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Gradient ID |

**Response** (200 OK):
```json
{
  "gradient": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_123",
    "name": "Ocean Sunset",
    "type": "linear",
    "angle": 135,
    "colorStops": [
      { "color": "#FF6B35", "position": 0 },
      { "color": "#9B4DCA", "position": 100 }
    ],
    "accessibilityScore": 8.5,
    "tags": ["sunset", "ocean"],
    "isPublic": true,
    "previewUrl": "https://storage.supabase.co/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/gradients

Create a new gradient.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "My Custom Gradient",
  "type": "linear",
  "angle": 45,
  "colorStops": [
    { "color": "#667eea", "position": 0 },
    { "color": "#764ba2", "position": 100 }
  ],
  "tags": ["purple", "custom"],
  "isPublic": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Gradient name (1-255 chars) |
| type | string | Yes | "linear", "radial", or "conic" |
| angle | number | No | Angle in degrees (0-360) |
| colorStops | array | Yes | Min 2 color stops |
| colorStops[].color | string | Yes | Hex color (#RRGGBB) |
| colorStops[].position | number | Yes | Position (0-100) |
| tags | string[] | No | Array of tags |
| isPublic | boolean | No | Make gradient public (default: false) |

**Response** (201 Created):
```json
{
  "gradient": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Custom Gradient",
    "type": "linear",
    "angle": 45,
    "colorStops": [...],
    "tags": ["purple", "custom"],
    "isPublic": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT /api/gradients/:id

Update an existing gradient.

**Authentication**: Required (must own gradient)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Gradient ID |

**Request Body**: Same fields as POST (all optional)
```json
{
  "name": "Updated Gradient Name",
  "isPublic": true
}
```

**Response** (200 OK): Returns updated gradient

---

### DELETE /api/gradients/:id

Delete a gradient.

**Authentication**: Required (must own gradient)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Gradient ID |

**Response** (200 OK):
```json
{
  "message": "Gradient deleted successfully"
}
```

---

## Conversations

Chat-based gradient generation with conversation history.

### GET /api/conversations

Get all user conversations.

**Authentication**: Required

**Query Parameters**: Same pagination as gradients

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "conv_123",
      "userId": "user_123",
      "title": "Sunset gradients for website",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /api/conversations/:id

Get conversation with all messages.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Conversation ID |

**Response** (200 OK):
```json
{
  "conversation": {
    "id": "conv_123",
    "userId": "user_123",
    "title": "Sunset gradients",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "messages": [
    {
      "id": "msg_1",
      "conversationId": "conv_123",
      "role": "user",
      "content": "Create a sunset gradient",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "msg_2",
      "conversationId": "conv_123",
      "role": "assistant",
      "content": "I've created 3 beautiful sunset gradients for you!",
      "suggestedGradients": [
        {
          "name": "Golden Hour",
          "type": "linear",
          "angle": 180,
          "colorStops": [...]
        }
      ],
      "createdAt": "2024-01-15T10:30:05.000Z"
    }
  ]
}
```

---

### POST /api/conversations

Create a new conversation.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "My gradient project"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Conversation title |

**Response** (201 Created):
```json
{
  "conversation": {
    "id": "conv_123",
    "userId": "user_123",
    "title": "My gradient project",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/conversations/messages

Send a message and get AI response with gradients.

**Authentication**: Required

**Rate Limit**: Strict (10 requests per minute)

**Request Body**:
```json
{
  "content": "Create 3 ocean-themed gradients with blues and teals",
  "conversationId": "conv_123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | Yes | User message |
| conversationId | string | No | Existing conversation ID (creates new if omitted) |

**Response** (200 OK):
```json
{
  "message": {
    "id": "msg_456",
    "conversationId": "conv_123",
    "role": "assistant",
    "content": "I've created 3 ocean-themed gradients featuring calming blues and teals...",
    "suggestedGradients": [
      {
        "name": "Deep Ocean",
        "type": "linear",
        "angle": 180,
        "colorStops": [
          { "color": "#0077B6", "position": 0 },
          { "color": "#00B4D8", "position": 50 },
          { "color": "#90E0EF", "position": 100 }
        ],
        "tags": ["ocean", "blue", "teal"],
        "accessibilityScore": 8.2,
        "previewUrl": "https://storage.supabase.co/..."
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "conversation": {
    "id": "conv_123",
    "title": "Create 3 ocean-themed gradients...",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/conversations/messages/stream

Stream AI response in real-time (Server-Sent Events).

**Authentication**: Required

**Rate Limit**: Strict (10 requests per minute)

**Request Body**: Same as POST /api/conversations/messages

**Response**: Server-Sent Events stream
```
data: {"chunk": "I've"}
data: {"chunk": " created"}
data: {"chunk": " beautiful"}
...
data: {"done": true}
```

---

### PUT /api/conversations/:id

Update conversation title.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Updated conversation title"
}
```

**Response** (200 OK): Returns updated conversation

---

### DELETE /api/conversations/:id

Delete a conversation and all its messages.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Conversation deleted successfully"
}
```

---

## Accessibility Validation

### POST /api/validate/accessibility

Validate gradient accessibility for text contrast.

**Authentication**: Optional

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
    "colorStops": [
      { "color": "#667eea", "position": 0 },
      { "color": "#764ba2", "position": 100 }
    ]
  },
  "foregroundColor": "#FFFFFF",
  "fontSize": 16,
  "fontWeight": "normal"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| gradient | object | Yes | Gradient to validate |
| foregroundColor | string | Yes | Text color (#RRGGBB) |
| fontSize | number | No | Font size in px (8-72, default: 16) |
| fontWeight | string | No | "normal" or "bold" (default: "normal") |

**Response** (200 OK):
```json
{
  "results": [
    {
      "colorStop": { "color": "#667eea", "position": 0 },
      "contrastRatio": 4.52,
      "wcagAA": true,
      "wcagAAA": false,
      "suggestions": ["Consider using #FFFFFF for better contrast"]
    },
    {
      "colorStop": { "color": "#764ba2", "position": 100 },
      "contrastRatio": 7.21,
      "wcagAA": true,
      "wcagAAA": true
    }
  ],
  "overallScore": 8.5,
  "passed": true,
  "recommendations": [
    "All color stops meet WCAG AA requirements"
  ]
}
```

---

## Export

### POST /api/export/css

Export gradient as CSS code.

**Authentication**: Optional

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
    "colorStops": [
      { "color": "#667eea", "position": 0 },
      { "color": "#764ba2", "position": 100 }
    ]
  }
}
```

**Response** (200 OK):
```json
{
  "css": "background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);"
}
```

---

### POST /api/export/tailwind

Export gradient as Tailwind CSS configuration.

**Authentication**: Optional

**Request Body**: Same as /api/export/css

**Response** (200 OK):
```json
{
  "tailwind": "/* Note: Tailwind CSS has limited gradient support...\n   className=\"bg-gradient-to-r\"\n   style={{\n     background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'\n   }}\n*/"
}
```

---

### POST /api/export/image

Export gradient as PNG or SVG image.

**Authentication**: Optional

**Request Body**:
```json
{
  "gradient": {
    "type": "linear",
    "angle": 90,
    "colorStops": [
      { "color": "#667eea", "position": 0 },
      { "color": "#764ba2", "position": 100 }
    ]
  },
  "width": 800,
  "height": 600,
  "format": "png"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| gradient | object | Yes | Gradient to export |
| width | number | Yes | Image width (100-4000) |
| height | number | Yes | Image height (100-4000) |
| format | string | Yes | "png" or "svg" |

**Response**: Binary image file with appropriate Content-Type header

---

## User Profile

### GET /api/users/profile

Get current user's profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "profile": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "preferences": {
      "defaultGradientType": "linear",
      "theme": "dark"
    }
  }
}
```

---

### PUT /api/users/profile

Update user profile.

**Authentication**: Required

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

**Response** (200 OK): Returns updated profile

---

### GET /api/users/stats

Get user statistics.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "stats": {
    "totalGradients": 25,
    "publicGradients": 10,
    "generationsUsed": 150,
    "generationsLimit": 1000,
    "favoriteGradients": 5
  }
}
```

---

## Analytics

### POST /api/analytics/track

Track an analytics event.

**Authentication**: Optional

**Request Body**:
```json
{
  "eventType": "view",
  "gradientId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "source": "gallery"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| eventType | string | Yes | "generation", "export", "save", or "view" |
| gradientId | string | No | Related gradient ID |
| metadata | object | No | Additional event data |

**Response** (200 OK):
```json
{
  "message": "Event tracked successfully"
}
```

---

### GET /api/analytics/trending

Get trending gradients.

**Authentication**: None

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of results (default: 10) |

**Response** (200 OK):
```json
{
  "gradients": [
    {
      "gradient": {
        "id": "grad_123",
        "name": "Sunset Vibes",
        "type": "linear",
        "colorStops": [...],
        "previewUrl": "https://..."
      },
      "viewCount": 1250,
      "saveCount": 89,
      "exportCount": 45
    }
  ]
}
```

---

### GET /api/analytics/popular

Get popular gradients by accessibility score.

**Authentication**: None

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of results (default: 10) |

**Response** (200 OK):
```json
{
  "gradients": [
    {
      "id": "grad_123",
      "name": "Accessible Blue",
      "type": "linear",
      "colorStops": [...],
      "accessibilityScore": 9.5,
      "previewUrl": "https://..."
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "body.colorStops",
      "message": "Array must contain at least 2 element(s)"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "No authorization token provided"
}
```

### 404 Not Found
```json
{
  "error": "Gradient not found"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Strict (AI generation) | 10 requests | 1 minute |
| Default | 100 requests | 15 minutes |
| Generous (analytics) | 200 requests | 15 minutes |

---

## Data Types

### ColorStop
```typescript
{
  color: string;    // Hex color (#RRGGBB)
  position: number; // 0-100
}
```

### Gradient
```typescript
{
  id?: string;
  userId?: string;
  name: string;
  type: "linear" | "radial" | "conic";
  angle?: number;           // 0-360
  colorStops: ColorStop[];  // Min 2
  accessibilityScore?: number;
  tags?: string[];
  isPublic?: boolean;
  previewUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## Frontend Integration Example

### React/Next.js Example

```typescript
// api.ts
const API_BASE = 'http://localhost:3000/api';

export async function generateGradients(prompt: string, count: number = 3) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getClerkToken()}`,
    },
    body: JSON.stringify({ prompt, count }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate gradients');
  }

  return response.json();
}

export async function sendMessage(content: string, conversationId?: string) {
  const response = await fetch(`${API_BASE}/conversations/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getClerkToken()}`,
    },
    body: JSON.stringify({ content, conversationId }),
  });

  return response.json();
}

export async function exportGradientAsImage(gradient: Gradient, format: 'png' | 'svg') {
  const response = await fetch(`${API_BASE}/export/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gradient,
      width: 800,
      height: 600,
      format,
    }),
  });

  return response.blob();
}
```

### Using with Clerk

```typescript
import { useAuth } from '@clerk/nextjs';

function GradientGenerator() {
  const { getToken } = useAuth();

  const handleGenerate = async () => {
    const token = await getToken();

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: 'Create a sunset gradient',
        count: 3,
      }),
    });

    const data = await response.json();
    console.log(data.gradients);
  };

  return (
    <button onClick={handleGenerate}>Generate</button>
  );
}
```
