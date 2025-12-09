# Rextro Avatar - AI Voice Assistant

A 3D interactive avatar with OpenAI Realtime API voice integration, built with React Three Fiber.

## Features

- 🎤 **Voice Chat**: Real-time voice conversation using OpenAI Realtime API
- 😊 **12 Facial Expressions**: Dynamic expressions based on conversation context
- 🗣️ **Lip Sync**: Realistic mouth movements during speech
- 💬 **Text Chat**: Traditional text-based interaction mode
- 🎨 **3D Rendering**: High-quality 3D avatar with Three.js

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OpenAI API Key

Create a `.env.local` file in the project root:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Getting your API key:**
- Standard API keys: https://platform.openai.com/api-keys
- Ephemeral keys (recommended for production): https://platform.openai.com/docs/guides/realtime-webrtc

### 3. Add Your Avatar Model

Place your avatar GLB file at:
```
public/models/avatar.glb
```

The model should include:
- `Wolf3D_Head` mesh with morph targets for facial expressions
- `Wolf3D_Teeth` mesh (optional) for mouth animations

### 4. Run Development Server

```bash
npm run dev
```

## Usage

### Voice Mode
1. Click **"🎤 Start Voice Chat"** button
2. Allow microphone access when prompted
3. Start speaking - the avatar will listen and respond
4. Watch the avatar's expressions change based on conversation
5. Click **"🔇 Stop Voice Chat"** to end voice session

### Text Mode
1. Type your message in the input field
2. Press Enter or click Send
3. The avatar will respond with predefined responses and expressions

**Try these keywords in text mode:**
- Greetings: `hi`, `hello`, `bye`
- Emotions: `angry`, `love`, `scared`, `confused`, `thinking`
- Questions: `how are you`, `how are you?`

## Available Expressions

The avatar supports 12 different expressions:
- `neutral` - Default calm state
- `happy` - Joyful with smile
- `sad` - Sorrowful expression
- `angry` - Aggressive look
- `surprised` - Shocked reaction
- `fearful` - Frightened expression
- `disgusted` - Repulsed look
- `thinking` - Contemplative state
- `excited` - Enthusiastic face
- `confused` - Puzzled look
- `tired` - Fatigued expression
- `flirty` - Playful look

## Project Structure

```
avatar-frontend/
├── src/
│   ├── components/
│   │   ├── Avatar.tsx          # 3D avatar component
│   │   └── expressions.ts      # Expression definitions
│   ├── constants/
│   │   └── responses.ts        # Text mode responses
│   ├── utils/
│   │   ├── voiceAgent.ts       # OpenAI Realtime API client
│   │   └── useVoiceAgent.ts    # Voice agent React hook
│   ├── App.tsx                 # Main application
│   └── main.tsx
├── public/
│   └── models/
│       └── avatar.glb          # 3D avatar model
└── .env.local                  # API keys (not in git)
```

## Technical Details

### Voice Agent Integration
- Uses `@openai/agents` package for Realtime API
- WebRTC transport for low-latency voice
- Automatic emotion detection from responses
- Real-time transcript display

### Expression System
- Based on ARKit-compatible morph targets
- Smooth interpolation between expressions
- Supports intensity and duration controls

### Lip Sync
- Character-based viseme mapping
- Synchronized with speech synthesis
- Automatic mouth movement generation

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Voice not working
- Ensure your API key is valid and has Realtime API access
- Check browser console for error messages
- Verify microphone permissions are granted

### Avatar not showing
- Confirm `avatar.glb` exists in `public/models/`
- Check browser console for loading errors
- Ensure the model has required mesh names

### Expressions not working
- Verify your model has morph targets
- Check that morph target names match the expressions file
- Open browser console to see available morphs

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
