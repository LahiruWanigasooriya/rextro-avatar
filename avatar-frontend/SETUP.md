# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set up your OpenAI API Key

1. Copy the example environment file:
```bash
copy .env.example .env.local
```

2. Edit `.env.local` and add your OpenAI API key:
```
VITE_OPENAI_API_KEY=sk-your-actual-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## Step 3: Start the Development Server
```bash
npm run dev
```

## Step 4: Use the Application

### Voice Mode (Requires OpenAI API Key)
- Click "🎤 Start Voice Chat"
- Allow microphone access
- Start speaking naturally
- The avatar will respond with voice and expressions

### Text Mode (Works without API Key)
- Type in the text input at the bottom
- Try: "hi", "angry", "love", "scared", "confused"
- Press Enter or click Send

## Troubleshooting

### "Please set VITE_OPENAI_API_KEY" error
- Make sure you created `.env.local` file
- Verify the API key is correct
- Restart the dev server after adding the key

### Voice not connecting
- Check your API key has Realtime API access
- Check browser console for detailed errors
- Ensure stable internet connection

### Avatar not visible
- Confirm `public/models/avatar.glb` exists
- Check browser console for loading errors

## Features

✅ Voice chat with OpenAI Realtime API
✅ Text-based chat mode
✅ 12 different facial expressions
✅ Automatic lip-sync
✅ Real-time emotion detection
✅ Live transcript display
