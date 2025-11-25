import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Avatar from './components/Avatar';
import { Suspense, useState } from 'react';
import { RESPONSES } from './constants/responses';

function App() {
  const [input, setInput] = useState('');
  const [expression, setExpression] = useState<'happy' | 'sad' | 'angry' | 'neutral' | 'surprised' | 'confused' | 'thinking'>('neutral');
  const [text, setText] = useState('');
  const [speak, setSpeak] = useState(false);

  const handleSubmit = () => {
    const lowerInput = input.toLowerCase().trim();
    const matchedKey = Object.keys(RESPONSES).find(key => 
      key === lowerInput || lowerInput.includes(key) || key.includes(lowerInput)
    );

    if (matchedKey) {
      const { response, expression: expr } = RESPONSES[matchedKey as keyof typeof RESPONSES];
      setExpression(expr);
      setText(response);
      setSpeak(true);
    }
    setInput('');
  };

  const handleSpeakEnd = () => {
    setSpeak(false);
    setExpression('neutral');
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Try: hi, angry, love, scared, confused..."
          style={{
            padding: '12px',
            width: '320px',
            borderRadius: 8,
            border: 'none',
            marginRight: 8,
            fontSize: 16
          }}
        />
        <button onClick={handleSubmit} style={{
          padding: '12px 20px',
          background: '#00ff88',
          color: 'black',
          border: 'none',
          borderRadius: 8,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;