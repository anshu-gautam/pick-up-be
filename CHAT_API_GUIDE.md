# Chat-Based Gradient Generation API Guide

Complete guide for using the chat-based gradient generation system powered by Vercel AI SDK and Supabase Storage.

## Overview

The API now supports conversational gradient generation where users can:
- Have natural conversations with AI to create gradients
- Refine gradients through follow-up messages
- Access full chat history with all generated gradients
- Get real-time streaming responses
- Automatically save gradient previews to Supabase Storage

## Architecture

### Hybrid Storage Approach

```
┌─────────────────────────────────────────────────────────────┐
│  User sends message: "Create ocean sunset gradients"        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Message saved to messages table                             │
│  { role: 'user', content: '...', conversation_id: xxx }     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel AI SDK generates gradients with context             │
│  - Uses conversation history for context                    │
│  - Tool calling for gradient generation                     │
│  - Streaming support for real-time responses                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  For each gradient:                                          │
│  1. Generate PNG preview (400x300)                          │
│  2. Upload to Supabase Storage (userId/gradientId.png)     │
│  3. Get public URL                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AI response saved to messages table with gradients:        │
│  {                                                           │
│    role: 'assistant',                                       │
│    content: 'I created 3 ocean sunset gradients...',       │
│    suggested_gradients: [                                   │
│      { name: '...', colorStops: [...], previewUrl: '...' } │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  User can:                                                   │
│  - View gradients inline in chat                            │
│  - Save favorites to gradients table                        │
│  - Continue conversation to refine                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Storage Layers:**
1. **JSONB in messages table** - Temporary AI suggestions
2. **Supabase Storage** - Gradient preview images
3. **gradients table** - User-saved gradients (references conversation)

## API Endpoints

### 1. Create Conversation

**Endpoint**: `POST /api/conversations`

**Description**: Create a new conversation session.

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
Content-Type: application/json
```

**Request Body** (optional):
```json
{
  "title": "Ocean Themed Gradients"
}
```

**Response** (201 Created):
```json
{
  "id": "conv_123",
  "userId": "user_456",
  "title": "Ocean Themed Gradients",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### 2. Send Message (Generate Gradients)

**Endpoint**: `POST /api/conversations/messages`

**Description**: Send a message and get AI response with generated gradients.

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "content": "Create 3 gradients inspired by ocean sunset with warm colors",
  "conversationId": "conv_123"
}
```

Note: If `conversationId` is omitted, a new conversation will be created automatically.

**Response** (200 OK):
```json
{
  "conversation": {
    "id": "conv_123",
    "userId": "user_456",
    "title": "Create 3 gradients inspired by ocean sunset with warm colors",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "userMessage": {
    "id": "msg_user_789",
    "conversationId": "conv_123",
    "role": "user",
    "content": "Create 3 gradients inspired by ocean sunset with warm colors",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": {
    "id": "msg_ai_790",
    "conversationId": "conv_123",
    "role": "assistant",
    "content": "I've created 3 beautiful ocean sunset gradients with warm tones for you!",
    "suggestedGradients": [
      {
        "name": "Coral Sunset",
        "type": "linear",
        "angle": 135,
        "colorStops": [
          { "color": "#FF6B6B", "position": 0 },
          { "color": "#FFD93D", "position": 50 },
          { "color": "#FF8C42", "position": 100 }
        ],
        "previewUrl": "https://xxx.supabase.co/storage/v1/object/public/gradients/user_456/grad_1.png",
        "storagePath": "user_456/grad_1.png",
        "accessibilityScore": 78,
        "tags": ["sunset", "ocean", "warm"]
      },
      {
        "name": "Dusk Horizon",
        "type": "linear",
        "angle": 90,
        "colorStops": [
          { "color": "#F38181", "position": 0 },
          { "color": "#FCE38A", "position": 100 }
        ],
        "previewUrl": "https://xxx.supabase.co/storage/v1/object/public/gradients/user_456/grad_2.png",
        "storagePath": "user_456/grad_2.png",
        "accessibilityScore": 85,
        "tags": ["sunset", "warm", "elegant"]
      },
      {
        "name": "Amber Wave",
        "type": "radial",
        "colorStops": [
          { "color": "#FFB88C", "position": 0 },
          { "color": "#DE6262", "position": 100 }
        ],
        "previewUrl": "https://xxx.supabase.co/storage/v1/object/public/gradients/user_456/grad_3.png",
        "storagePath": "user_456/grad_3.png",
        "accessibilityScore": 72,
        "tags": ["sunset", "radial", "warm"]
      }
    ],
    "createdAt": "2024-01-15T10:30:05Z"
  }
}
```

---

### 3. Stream Message (Real-time AI Response)

**Endpoint**: `POST /api/conversations/messages/stream`

**Description**: Get real-time streaming AI responses using Server-Sent Events (SSE).

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
Content-Type: application/json
Accept: text/event-stream
```

**Request Body**:
```json
{
  "content": "Make it more vibrant",
  "conversationId": "conv_123"
}
```

Note: `conversationId` is required for streaming.

**Response** (SSE Stream):
```
data: {"text":"I"}

data: {"text":"'ve"}

data: {"text":" adjusted"}

data: {"text":" the"}

data: {"text":" gradients"}

data: {"text":" to"}

data: {"text":" be"}

data: {"text":" more"}

data: {"text":" vibrant"}

data: {"text":"!"}

data: [DONE]
```

**Client-side Example (JavaScript)**:
```javascript
const eventSource = new EventSource('/api/conversations/messages/stream', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  method: 'POST',
  body: JSON.stringify({
    content: 'Make it more vibrant',
    conversationId: 'conv_123'
  })
});

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }

  const { text } = JSON.parse(event.data);
  console.log(text); // Append to UI
};
```

---

### 4. Get Conversation with Messages

**Endpoint**: `GET /api/conversations/:id`

**Description**: Retrieve full conversation with all messages and gradients.

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
```

**Response** (200 OK):
```json
{
  "conversation": {
    "id": "conv_123",
    "userId": "user_456",
    "title": "Ocean Themed Gradients",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "messages": [
    {
      "id": "msg_1",
      "conversationId": "conv_123",
      "role": "user",
      "content": "Create ocean sunset gradients",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_2",
      "conversationId": "conv_123",
      "role": "assistant",
      "content": "I've created 3 beautiful gradients...",
      "suggestedGradients": [...],
      "createdAt": "2024-01-15T10:30:05Z"
    },
    {
      "id": "msg_3",
      "conversationId": "conv_123",
      "role": "user",
      "content": "Make the first one more vibrant",
      "createdAt": "2024-01-15T10:35:00Z"
    },
    {
      "id": "msg_4",
      "conversationId": "conv_123",
      "role": "assistant",
      "content": "Here's a more vibrant version...",
      "suggestedGradients": [...],
      "createdAt": "2024-01-15T10:35:05Z"
    }
  ]
}
```

---

### 5. List Conversations

**Endpoint**: `GET /api/conversations`

**Description**: Get all user conversations (paginated).

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: updated_at)
- `sortOrder` (optional): asc or desc (default: desc)

**Example**:
```
GET /api/conversations?page=1&limit=10&sortOrder=desc
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "conv_123",
      "userId": "user_456",
      "title": "Ocean Themed Gradients",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    },
    {
      "id": "conv_124",
      "userId": "user_456",
      "title": "Dark Mode Backgrounds",
      "createdAt": "2024-01-14T15:20:00Z",
      "updatedAt": "2024-01-14T15:45:00Z"
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

### 6. Update Conversation Title

**Endpoint**: `PUT /api/conversations/:id`

**Description**: Update conversation title.

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Beautiful Ocean Gradients Collection"
}
```

**Response** (200 OK):
```json
{
  "id": "conv_123",
  "userId": "user_456",
  "title": "Beautiful Ocean Gradients Collection",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

---

### 7. Delete Conversation

**Endpoint**: `DELETE /api/conversations/:id`

**Description**: Delete conversation and all its messages.

**Headers**:
```
Authorization: Bearer <clerk-jwt-token>
```

**Response** (204 No Content): Empty response

---

## Supabase Storage Setup

### 1. Create Storage Bucket

In Supabase Dashboard > Storage, create a bucket named `gradients`.

**Settings**:
- Public bucket: Yes
- File size limit: 10 MB
- Allowed MIME types: `image/png`, `image/svg+xml`

### 2. Set Up Storage Policies

Run the following SQL in Supabase SQL Editor (already included in migration `002_add_conversations.sql`):

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own gradient images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gradients' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own gradient images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gradients' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own gradient images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gradients' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to gradient images
CREATE POLICY "Anyone can view gradient images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gradients');
```

### 3. Storage Structure

```
gradients/
├── user_abc123/
│   ├── grad_1.png
│   ├── grad_2.png
│   └── grad_3.png
├── user_def456/
│   ├── grad_1.png
│   └── grad_2.png
```

Public URLs: `https://xxx.supabase.co/storage/v1/object/public/gradients/user_abc123/grad_1.png`

---

## Workflow Examples

### Example 1: Simple Gradient Generation

```javascript
// 1. Send message (auto-creates conversation)
const response = await fetch('/api/conversations/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Create a modern gradient for a tech startup'
  })
});

const { conversation, message } = await response.json();

// 2. Display gradients with previews
message.suggestedGradients.forEach(gradient => {
  console.log(`${gradient.name}: ${gradient.previewUrl}`);
  // Show preview image: <img src={gradient.previewUrl} />
});

// 3. Save favorite to library
await fetch('/api/gradients', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...message.suggestedGradients[0],
    conversationId: conversation.id,
    messageId: message.id
  })
});
```

### Example 2: Iterative Refinement

```javascript
const conversationId = 'conv_123';

// 1. Initial request
await sendMessage('Create sunset gradients', conversationId);

// 2. Refine
await sendMessage('Make them warmer', conversationId);

// 3. Further refinement
await sendMessage('Add more orange tones to the second one', conversationId);

// 4. Get full history
const history = await fetch(`/api/conversations/${conversationId}`);
// Shows all messages and gradients in order
```

### Example 3: Streaming Chat UI

```javascript
async function streamChat(message, conversationId) {
  const response = await fetch('/api/conversations/messages/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: message, conversationId })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        const { text } = JSON.parse(data);
        // Append text to UI in real-time
        updateChatUI(text);
      }
    }
  }
}
```

---

## Best Practices

### 1. Conversation Management
- Create new conversations for different projects/themes
- Use descriptive titles for easy navigation
- Clean up old conversations regularly

### 2. Storage Optimization
- Preview images are auto-generated (400x300 PNG)
- Only save gradients to library that users explicitly favorite
- Temporary suggested gradients in JSONB don't consume extra storage

### 3. Rate Limiting
- AI generation: 10 requests/minute (strict)
- Other endpoints: 100 requests/15 minutes (default)
- Plan accordingly for production usage

### 4. Error Handling
```javascript
try {
  const response = await sendMessage(content, conversationId);
  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit exceeded
      showError('Too many requests, please wait...');
    } else if (response.status === 401) {
      // Authentication failed
      redirectToLogin();
    }
  }
} catch (error) {
  // Network error
  showError('Connection failed, please try again');
}
```

---

## Migration Guide

### For Existing Users

If you were using the old `/api/generate` endpoint:

**Old Way**:
```javascript
POST /api/generate
{
  "prompt": "ocean sunset",
  "count": 3
}
```

**New Way (Recommended)**:
```javascript
POST /api/conversations/messages
{
  "content": "ocean sunset",
  "conversationId": null  // Creates new conversation
}
```

**Key Differences**:
- Chat provides context-aware responses
- Gradients include preview URLs
- Full conversation history preserved
- Can refine gradients through follow-up messages

**Old endpoint still works** but doesn't have conversation context or storage integration.

---

## Troubleshooting

### Issue: Preview images not loading

**Solution**: Check Supabase Storage bucket exists and has correct policies:
```sql
SELECT * FROM storage.buckets WHERE name = 'gradients';
```

### Issue: "Conversation not found"

**Solution**: Ensure you're passing the correct `conversationId` and it belongs to the authenticated user.

### Issue: Streaming not working

**Solution**: Ensure client supports EventSource/SSE and CORS is configured for your domain.

### Issue: Rate limit exceeded

**Solution**: Implement exponential backoff or reduce request frequency. Consider caching responses.

---

## Next Steps

1. **Frontend Integration**: Build a chat UI with gradient previews
2. **Real-time Updates**: Implement WebSocket for live collaboration
3. **Gradient Collections**: Group saved gradients by conversation
4. **Export from Chat**: Add export buttons directly in chat messages

For more details, see:
- [README.md](README.md) - General API overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [SETUP.md](SETUP.md) - Setup instructions
