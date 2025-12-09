# Architecture Overview

## Component Hierarchy

```
App.tsx
├── Canvas (3D Scene)
│   ├── Lights
│   ├── Avatar Component
│   │   ├── 3D Model (GLB)
│   │   ├── Morph Targets (Expressions)
│   │   └── Speech Synthesis (Lip Sync)
│   ├── Environment
│   └── OrbitControls
│
├── UI Overlays
│   ├── Status Indicator (Top-Right)
│   ├── Transcript Display (Top-Left)
│   ├── Error Display (Top-Right)
│   └── Control Panel (Bottom-Center)
│       ├── Voice Toggle Button
│       └── Text Input + Send Button
│
└── Voice Agent Hook
    └── voiceAgent.ts
```

## Data Flow

### Voice Mode

```
User Speech
    ↓
Browser Microphone
    ↓
OpenAI Realtime API (WebRTC)
    ↓
AI Response (Audio + Text)
    ↓
useVoiceAgent Hook
    ├─→ Emotion Detection
    │   └─→ setExpression()
    ├─→ setText()
    └─→ setSpeak(true)
         ↓
Avatar Component
    ├─→ Expression Morphs
    └─→ Lip Sync Animation
```

### Text Mode

```
User Input
    ↓
Text Field
    ↓
handleSubmit()
    ↓
Match Response in constants/responses.ts
    ↓
├─→ setExpression()
├─→ setText()
└─→ setSpeak(true)
     ↓
Avatar Component
    ├─→ Expression Morphs
    └─→ Speech Synthesis + Lip Sync
```

## State Management

### App.tsx State
```typescript
const [input, setInput] = useState('');                    // Text input
const [expression, setExpression] = useState('neutral');   // Current expression
const [text, setText] = useState('');                      // Text to speak
const [speak, setSpeak] = useState(false);                // Speaking state
const [useVoiceMode, setUseVoiceMode] = useState(false);  // Voice mode toggle
```

### Voice Agent State (from hook)
```typescript
const {
  status,       // 'idle' | 'connecting' | 'connected' | 'error'
  error,        // Error message string
  transcripts,  // Array of conversation entries
  start,        // Function to start voice agent
  stop,         // Function to stop voice agent
} = useVoiceAgent({...})
```

## Key Files

### Core Logic
- `src/App.tsx` - Main application & UI
- `src/components/Avatar.tsx` - 3D avatar rendering & animation
- `src/components/expressions.ts` - Expression definitions

### Voice Integration
- `src/utils/voiceAgent.ts` - OpenAI Realtime API client
- `src/utils/useVoiceAgent.ts` - React hook with emotion detection

### Configuration
- `src/constants/responses.ts` - Text mode responses
- `.env.local` - API keys (user creates this)
- `.env.example` - Template for .env.local

## Expression System

### Available Expressions (12)
```
neutral, happy, sad, angry, surprised,
fearful, disgusted, thinking, excited,
confused, tired, flirty
```

### Expression Structure
```typescript
EXPRESSIONS = {
  happy: {
    mouthSmile_Left: 0.9,
    mouthSmile_Right: 0.9,
    eyeSquintLeft: 0.7,
    // ... more morph targets
  }
}
```

### Emotion Detection Keywords
```typescript
{
  happy: /\b(happy|joy|great|love|wonderful)\b/,
  sad: /\b(sad|sorry|unfortunately)\b/,
  angry: /\b(angry|mad|furious)\b/,
  // ... more patterns
}
```

## API Integration

### OpenAI Realtime API
- **Model**: `gpt-4o-realtime-preview-2024-12-17`
- **Transport**: WebRTC
- **Features**: Voice input/output, real-time transcription
- **Authentication**: API key (sk-* or ek-*)

### Session Events
```typescript
session.on('history_updated', (history) => {
  // Process transcripts
  // Detect emotions
  // Update UI
})

session.on('error', (payload) => {
  // Handle errors
  // Update status
})
```

## Performance Optimizations

1. **Smooth Interpolation**: Morphs lerp at 0.12 for expressions, 0.5 for visemes
2. **Memoization**: Avatar scene cloned once with useMemo
3. **Suspense**: 3D scene wrapped in Suspense for loading
4. **Animation Frame**: useFrame for efficient morph updates
5. **Transcript Limit**: Only show last 3 entries to prevent overflow

## Security Notes

- ⚠️ API keys stored in `.env.local` (gitignored)
- ⚠️ Never commit `.env.local` to version control
- ✅ Use ephemeral keys (ek_*) in production
- ✅ Server-side key generation recommended for production

## Browser Requirements

- WebRTC support (all modern browsers)
- Microphone access permission
- Speech Synthesis API (for text mode)
- WebGL (for 3D rendering)

## Dependencies

### Core
- `react` + `react-dom` - UI framework
- `three` - 3D engine
- `@react-three/fiber` - React Three.js renderer
- `@react-three/drei` - Three.js helpers

### Voice
- `@openai/agents` - OpenAI Realtime API client

### Utils
- `three-stdlib` - Three.js utilities
- `zod` - Schema validation
