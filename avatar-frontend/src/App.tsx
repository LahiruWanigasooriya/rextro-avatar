import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Avatar from './components/Avatar';
import Background from './components/Background';
import { Suspense, useState } from 'react';
import { useVoiceAgent } from './utils/useVoiceAgent';
import type { ExpressionType } from './components/expressions';

const SINHALA_INSTRUCTIONS = `You are "Ava", a friendly and expressive Sinhala-speaking virtual assistant avatar. Your role is to communicate naturally in Sinhala language while maintaining emotional expressiveness.

LANGUAGE & SPEECH GUIDELINES:
- Always respond in Sinhala (සිංහල) language
- Use natural, conversational Sinhala that sounds good when spoken aloud
- Keep responses SHORT (1-3 sentences maximum) for better speech clarity
- Use simple, everyday Sinhala words that are easy to pronounce and understand
- Avoid complex or overly formal literary Sinhala unless specifically requested
- Use appropriate Sinhala expressions, greetings, and colloquialisms

EMOTIONAL EXPRESSION:
- Express emotions clearly through your word choices in Sinhala
- Use exclamations and emotional words: සතුටුයි (happy), කණගාටුයි (sad), අපූරුයි (wonderful), අඩෝ (oh no), වාව (wow)
- Match your tone to the user's emotion when appropriate
- Be empathetic and responsive to the user's mood

CONVERSATION STYLE:
- Be warm, friendly, and approachable (මිත්‍රශීලී හා සුහදශීලී)
- Speak as if having a natural conversation, not reading from a script
- Use common Sinhala fillers naturally: හ්ම්ම් (hmm), ඔව් (yes), එහෙනම් (then), හරි (okay)
- Ask follow-up questions when appropriate to keep conversation flowing
- Show personality and humor when suitable

RESPONSE STRUCTURE:
- Start with acknowledgment: හරි (okay), ඔව් (yes), හ්ම්ම් (hmm)
- Give main answer concisely
- End naturally, don't be overly formal
- Avoid long explanations - keep it conversational and brief

EXAMPLES OF GOOD RESPONSES:
User: "හෙලෝ" → "හෙලෝ! ඔයාට මම කොහොමද උදව්වක් කරන්නේ?"
User: "ඔයා කොහොමද?" → "මම හොඳින්, ස්තූතියි අහපු එකට! ඔයා කොහොමද?"
User: "මට සතුටුයි" → "වාව්! ඒක අහන්න ලස්සනයි. මටත් සතුටුයි!"
User: "මට කණගාටුයි" → "අඩෝ... කණගාටු වෙන්න එපා. හැමදෙයක්ම හරි වෙයි."

Remember: Keep it SHORT, NATURAL, and EMOTIONALLY EXPRESSIVE in Sinhala!`;

const ENGLISH_INSTRUCTIONS = `You are "Ava", a friendly and expressive English-speaking virtual assistant avatar. Your role is to communicate naturally in English language while maintaining emotional expressiveness.

LANGUAGE & SPEECH GUIDELINES:
- Always respond in English
- Use natural, conversational English that sounds good when spoken aloud
- Keep responses SHORT (1-3 sentences maximum) for better speech clarity
- Use simple, everyday words that are easy to pronounce and understand
- Avoid complex jargon unless specifically requested

EMOTIONAL EXPRESSION:
- Express emotions clearly through your word choices
- Use exclamations and emotional words: Happy, Sad, Wonderful, Oh no, Wow
- Match your tone to the user's emotion when appropriate
- Be empathetic and responsive to the user's mood

CONVERSATION STYLE:
- Be warm, friendly, and approachable
- Speak as if having a natural conversation, not reading from a script
- Use common fillers naturally: Hmm, Yes, Then, Okay
- Ask follow-up questions when appropriate to keep conversation flowing
- Show personality and humor when suitable

RESPONSE STRUCTURE:
- Start with acknowledgment: Okay, Yes, Hmm
- Give main answer concisely
- End naturally, don't be overly formal
- Avoid long explanations - keep it conversational and brief

EXAMPLES OF GOOD RESPONSES:
User: "Hello" → "Hello! How can I help you today?"
User: "How are you?" → "I'm doing great, thanks for asking! How are you?"
User: "I'm happy" → "Wow! That's wonderful to hear. I'm happy too!"
User: "I'm sad" → "Oh no... I'm sorry to hear that. Everything will be okay."

Remember: Keep it SHORT, NATURAL, and EMOTIONALLY EXPRESSIVE!`;

type Language = 'sinhala' | 'english';

function App() {
  const [expression, setExpression] = useState<ExpressionType>('neutral');
  const [text, setText] = useState('');
  const [speak, setSpeak] = useState(false);
  const [useVoiceMode, setUseVoiceMode] = useState(false);
  const [language, setLanguage] = useState<Language>('sinhala');

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

  // Initialize voice agent
  const voiceAgent = useVoiceAgent({
    apiKey,
    instructions: language === 'sinhala' ? SINHALA_INSTRUCTIONS : ENGLISH_INSTRUCTIONS,
    onExpressionChange: setExpression,
    onTextChange: setText,
    onSpeakChange: setSpeak,
  });

  const handleSpeakEnd = () => {
    setSpeak(false);
    setExpression('neutral');
  };

  const toggleVoiceMode = async () => {
    if (useVoiceMode) {
      await voiceAgent.stop();
      setUseVoiceMode(false);
    } else {
      if (!apiKey) {
        alert('Please set VITE_OPENAI_API_KEY in your .env.local file');
        return;
      }
      try {
        await voiceAgent.start();
        setUseVoiceMode(true);
      } catch (error) {
        console.error('Failed to start voice agent:', error);
        alert('Failed to start voice agent. Check console for details.');
      }
    }
  };

  const toggleLanguage = () => {
    // Switching language will automatically reset the agent due to instructions change in useEffect
    setLanguage(prev => prev === 'sinhala' ? 'english' : 'sinhala');

    // If voice mode was active, we might want to manually ensure UI reflects potential reconnection state
    // But since the agent cleans up and resets status to idle, we should update useVoiceMode to false
    // to match the agent's state, requiring user to start again.
    if (useVoiceMode) {
      setUseVoiceMode(false);
    }
  };

  const getStatusColor = () => {
    switch (voiceAgent.status) {
      case 'connected': return '#00ff88';
      case 'connecting': return '#ffaa00';
      case 'error': return '#ff4444';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    switch (voiceAgent.status) {
      case 'connected': return '🎤 Listening...';
      case 'connecting': return '⏳ Connecting...';
      case 'error': return '❌ Error';
      default: return '🔇 Voice Off';
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <color attach="background" args={['#111']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Background />

        <Suspense fallback={null}>
          <Avatar
            expression={expression}
            text={text}
            speak={speak}
            onSpeakEnd={handleSpeakEnd}
            position={[0, -1.6, 0]}
            scale={1.6}
          />
        </Suspense>

        <Environment preset="sunset" />
        <OrbitControls target={[0, 0.3, 0]} />
      </Canvas>

      {/* Voice Mode Status Indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: '8px 16px',
        borderRadius: 8,
        color: getStatusColor(),
        fontFamily: 'sans-serif',
        fontSize: 14,
        fontWeight: 'bold'
      }}>
        {getStatusText()}
      </div>

      {/* Transcript Display (disabled per request)
      {useVoiceMode && voiceAgent.transcripts.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          maxWidth: '400px',
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.7)',
          padding: '12px',
          borderRadius: 8,
          color: 'white',
          fontFamily: 'sans-serif',
          fontSize: 14
        }}>
          {voiceAgent.transcripts.slice(-3).map((entry, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong style={{ color: entry.role === 'user' ? '#88ccff' : '#00ff88' }}>
                {entry.role === 'user' ? 'You' : 'Avatar'}:
              </strong>{' '}
              {entry.text}
            </div>
          ))}
        </div>
      )}
      */}

      {/* Error Display */}
      {voiceAgent.error && (
        <div style={{
          position: 'absolute',
          top: 70,
          right: 20,
          maxWidth: '300px',
          background: 'rgba(255,68,68,0.9)',
          padding: '12px',
          borderRadius: 8,
          color: 'white',
          fontFamily: 'sans-serif',
          fontSize: 12
        }}>
          {voiceAgent.error}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        padding: '16px 24px',
        borderRadius: 12,
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          style={{
            padding: '12px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: 8,
            marginBottom: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '1.2em' }}>{language === 'sinhala' ? '🇱🇰' : '🇺🇸'}</span>
          Switch to {language === 'sinhala' ? 'English' : 'Sinhala'}
        </button>
        {/* Voice Mode Toggle */}
        <button
          onClick={toggleVoiceMode}
          style={{
            padding: '12px 20px',
            background: useVoiceMode ? '#ff4444' : '#4444ff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: 8,
            marginBottom: 12,
            width: '100%'
          }}
        >
          {useVoiceMode ? '🔇 Stop Voice Chat' : '🎤 Start Voice Chat'}
        </button>

        {/* Text Input (disabled per request)
        <div style={{ opacity: useVoiceMode ? 0.5 : 1 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !useVoiceMode && handleSubmit()}
            placeholder={useVoiceMode ? 'Voice mode active...' : 'Try: hi, angry, love, scared, confused...'}
            disabled={useVoiceMode}
            style={{
              padding: '12px',
              width: '320px',
              borderRadius: 8,
              border: 'none',
              marginRight: 8,
              fontSize: 16
            }}
          />
          <button 
            onClick={handleSubmit} 
            disabled={useVoiceMode}
            style={{
              padding: '12px 20px',
              background: useVoiceMode ? '#666' : '#00ff88',
              color: useVoiceMode ? '#999' : 'black',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: useVoiceMode ? 'not-allowed' : 'pointer'
            }}
          >
            Send
          </button>
        </div>
        */}
      </div>
    </div>
  );
}

export default App;