import { useEffect, useRef, useState } from 'react';
import { createVoiceAgent, type VoiceAgentStatus, type TranscriptEntry } from '../utils/voiceAgent';
import type { ExpressionType } from '../components/expressions';

type UseVoiceAgentOptions = {
  apiKey: string;
  instructions?: string;
  onExpressionChange?: (expression: ExpressionType) => void;
  onTextChange?: (text: string) => void;
  onSpeakChange?: (speak: boolean) => void;
};

export function useVoiceAgent(options: UseVoiceAgentOptions) {
  const [status, setStatus] = useState<VoiceAgentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const agentRef = useRef<ReturnType<typeof createVoiceAgent> | null>(null);

  // Detect emotion/expression from text (supports Sinhala and English)
  const detectExpression = (text: string): ExpressionType => {
    const lowerText = text.toLowerCase();
    
    // Happy - සතුටුයි, ලස්සනයි, අපූරුයි, හොඳයි
    if (lowerText.match(/\b(happy|joy|great|love|wonderful|amazing|excited|yay)\b|සතුටු|ලස්සන|අපූරු|හොඳ|වාව්|අනේ|ආදරෙයි/)) {
      return 'happy';
    }
    // Sad - කණගාටුයි, දුකයි
    if (lowerText.match(/\b(sad|sorry|unfortunately|regret|disappointed)\b|කණගාටු|දුක|අඩෝ|අනේ මන්දා/)) {
      return 'sad';
    }
    // Angry - තරහයි, කෝප
    if (lowerText.match(/\b(angry|mad|furious|upset|annoyed)\b|තරහ|කෝප|හෙන|අමාරු/)) {
      return 'angry';
    }
    // Surprised - පුදුම, විස්මිත
    if (lowerText.match(/\b(surprised|wow|omg|shocked|unbelievable)\b|පුදුම|විස්මිත|මොකක්ද|එහෙම|වාව්/)) {
      return 'surprised';
    }
    // Confused - අවුල, තේරෙන්නේ නෑ
    if (lowerText.match(/\b(confused|unclear|not sure|don't understand)\b|අවුල|තේරෙන්නේ\s*නෑ|තේරෙන්නෑ|ඇයි|මොකද්ද/)) {
      return 'confused';
    }
    // Thinking - හිතමු, හිතනවා
    if (lowerText.match(/\b(think|hmm|consider|ponder|wondering)\b|හිත|හ්ම්|හ්ම්ම්|හම්ම්|එහෙනම්/)) {
      return 'thinking';
    }
    // Fearful - බයයි, බිය
    if (lowerText.match(/\b(scared|afraid|frightened|terrified)\b|බය|බියෙන්|බිහිසුණු/)) {
      return 'fearful';
    }
    // Excited - උනන්දුයි
    if (lowerText.match(/\b(excited|thrilled|pumped)\b|උනන්දු|සතුටු|සතුටුයි|වාව්/)) {
      return 'excited';
    }
    
    return 'neutral';
  };

  useEffect(() => {
    agentRef.current = createVoiceAgent({
      getApiKey: async () => options.apiKey,
      instructions: options.instructions || 
        `You are "Ava", a friendly and expressive Sinhala-speaking virtual assistant avatar. Your role is to communicate naturally in Sinhala language while maintaining emotional expressiveness.

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

Remember: Keep it SHORT, NATURAL, and EMOTIONALLY EXPRESSIVE in Sinhala!`,
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        setError(null);
      },
      onTranscript: (entries) => {
        setTranscripts(entries);
        
        // Get the last assistant message
        const lastAssistant = entries.filter(e => e.role === 'assistant').pop();
        if (lastAssistant) {
          const expression = detectExpression(lastAssistant.text);
          options.onExpressionChange?.(expression);
          options.onTextChange?.(lastAssistant.text);
          options.onSpeakChange?.(true);
        }
      },
      onError: (err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Voice agent error:', err);
      },
    });

    return () => {
      if (agentRef.current) {
        agentRef.current.stop();
      }
    };
  }, [options.apiKey, options.instructions]);

  const start = async () => {
    if (!agentRef.current) return;
    try {
      await agentRef.current.start();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  };

  const stop = async () => {
    if (!agentRef.current) return;
    await agentRef.current.stop();
  };

  return {
    status,
    error,
    transcripts,
    start,
    stop,
  };
}
