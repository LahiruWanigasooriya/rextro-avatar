import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import type { RealtimeItem } from '@openai/agents/realtime';

export type VoiceAgentStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type TranscriptEntry = {
  role: 'user' | 'assistant';
  text: string;
};

type VoiceAgentOptions = {
  /** Async provider for the API key (use server-issued ephemeral keys in production). */
  getApiKey: () => Promise<string>;
  instructions?: string;
  voice?: string;
  onStatusChange?: (status: VoiceAgentStatus) => void;
  onTranscript?: (entries: TranscriptEntry[]) => void;
  onError?: (error: unknown) => void;
};

function pickLatestTranscript(history: RealtimeItem[]): TranscriptEntry[] {
  return history
    .filter((item): item is RealtimeItem & { type: 'message' } => item.type === 'message')
    .flatMap((item) => {
      const content = item.content ?? [];
      const transcript = content.find((c) => 'transcript' in c && c.transcript);
      const textBlock = content.find((c) => 'text' in c && c.text);
      const text =
        (transcript && 'transcript' in transcript && transcript.transcript) ||
        (textBlock && 'text' in textBlock && textBlock.text) ||
        '';
      if (!text) return [];
      if (item.role === 'user' || item.role === 'assistant') {
        return [{ role: item.role, text }];
      }
      return [];
    });
}

export function createVoiceAgent(options: VoiceAgentOptions) {
  const agent = new RealtimeAgent({
    name: 'Voice Assistant',
    instructions:
      options.instructions ??
      'You are a clear and concise voice assistant. Keep responses short and friendly.',
  });

  const session = new RealtimeSession(agent, {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    transport: 'webrtc',
  });

  let status: VoiceAgentStatus = 'idle';

  const setStatus = (next: VoiceAgentStatus) => {
    status = next;
    options.onStatusChange?.(status);
  };

  session.on('history_updated', (history) => {
    const transcripts = pickLatestTranscript(history);
    if (transcripts.length) {
      options.onTranscript?.(transcripts);
    }
  });

  session.on('error', (payload) => {
    console.error('Session error payload:', JSON.stringify(payload, null, 2));
    if (payload.error) {
      const err = payload.error as any;
      console.error('Error details:', {
        type: err.type,
        code: err.code,
        message: err.message,
      });
    }
    
    setStatus('error');
    options.onError?.(payload.error ?? payload);
  });

  const start = async () => {
    if (status === 'connected' || status === 'connecting') return;
    setStatus('connecting');
    try {
      const apiKey = await options.getApiKey();
      if (!apiKey) throw new Error('Missing Realtime API key');
      
      // Websocket transport works with ephemeral keys (ek_) or standard keys (sk-)
      if (!apiKey.startsWith('ek_') && !apiKey.startsWith('sk-')) {
        throw new Error(
          'Invalid API key format. Expected key starting with "ek_" (ephemeral) or "sk-" (standard).\n' +
          'Generate ephemeral keys at: https://platform.openai.com/docs/guides/realtime-webrtc'
        );
      }
      
      console.log('Connecting to OpenAI Realtime API...');
      console.log('Using model:', 'gpt-4o-realtime-preview-2024-12-17');
      console.log('Transport:', 'websocket');
      console.log('API key type:', apiKey.startsWith('ek_') ? 'Ephemeral (ek_)' : 'Standard (sk-)');
      
      await session.connect({ apiKey });
      console.log('Successfully connected to Realtime API');
      console.log('Microphone is now active and listening...');
      setStatus('connected');
    } catch (err) {
      console.error('Connection failed:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
      setStatus('error');
      options.onError?.(err);
      throw err;
    }
  };

  const stop = async () => {
    if (status === 'idle') return;
    session.close();
    setStatus('idle');
  };

  return {
    start,
    stop,
    getStatus: () => status,
    session,
  };
}
