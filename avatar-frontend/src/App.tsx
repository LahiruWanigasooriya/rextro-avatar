import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Avatar from './components/Avatar';
import { Suspense, useState } from 'react';
import { useVoiceAgent } from './utils/useVoiceAgent';
import type { ExpressionType } from './components/expressions';

function App() {
  const [expression, setExpression] = useState<ExpressionType>('neutral');
  const [text, setText] = useState('');
  const [speak, setSpeak] = useState(false);
  const [useVoiceMode, setUseVoiceMode] = useState(false);

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

  // Initialize voice agent
  const voiceAgent = useVoiceAgent({
    apiKey,
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