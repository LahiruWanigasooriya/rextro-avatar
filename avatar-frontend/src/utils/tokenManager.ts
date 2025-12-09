const TOKEN_STORAGE_KEY = 'openai_realtime_token';
const TOKEN_EXPIRY_KEY = 'openai_realtime_token_expiry';
const FALLBACK_TOKEN_LIFETIME_MS = 55 * 60 * 1000; // 55 minutes buffer

const SESSION_CONFIG_PAYLOAD = {
  session: {
    type: 'realtime',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    audio: {
      output: {
        voice: 'verse',
        format: {
          type: 'audio/pcm',
          rate: 24000,
        },
      },
    },
  },
};

type ClientSecretResponse = {
  value: string;
  expires_at?: number;
};

const getStorage = (): Storage | null => {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  const storage = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
  return storage ?? null;
};

const readExpiry = (raw: string | null): number | null => {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const isExpired = (expiresAt: number | null): boolean => {
  if (!expiresAt) return false;
  return Date.now() >= expiresAt;
};

const persistToken = (token: string, expiresAt: number | null) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(TOKEN_STORAGE_KEY, token);
  if (expiresAt) {
    storage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
  } else {
    storage.removeItem(TOKEN_EXPIRY_KEY);
  }
};

const removeStoredToken = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(TOKEN_STORAGE_KEY);
  storage.removeItem(TOKEN_EXPIRY_KEY);
};

const requestClientSecret = async (apiKey: string): Promise<ClientSecretResponse> => {
  const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(SESSION_CONFIG_PAYLOAD),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to generate realtime token: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ClientSecretResponse;
  if (!data.value?.startsWith('ek_')) {
    throw new Error('Unexpected realtime token format received');
  }
  return data;
};

const computeExpiry = (apiResponse: ClientSecretResponse): number | null => {
  if (typeof apiResponse.expires_at === 'number' && Number.isFinite(apiResponse.expires_at)) {
    return apiResponse.expires_at * 1000;
  }
  return Date.now() + FALLBACK_TOKEN_LIFETIME_MS;
};

const isStoredTokenValid = (token: string | null, expiryRaw: string | null): boolean => {
  if (!token?.startsWith('ek_')) {
    return false;
  }
  const expiresAt = readExpiry(expiryRaw);
  if (isExpired(expiresAt)) {
    return false;
  }
  return true;
};

export const clearStoredToken = () => {
  removeStoredToken();
};

export const markStoredTokenInvalid = () => {
  removeStoredToken();
};

export const getTokenInfo = () => {
  const storage = getStorage();
  if (!storage) {
    return { token: null, expiry: null, isValid: false };
  }
  const token = storage.getItem(TOKEN_STORAGE_KEY);
  const expiry = storage.getItem(TOKEN_EXPIRY_KEY);
  return { token, expiry, isValid: isStoredTokenValid(token, expiry) };
};

export const getValidToken = async (apiKey: string): Promise<string> => {
  if (!apiKey?.startsWith('sk-')) {
    throw new Error('A standard OpenAI API key (starts with sk-) is required to mint realtime tokens');
  }

  const storage = getStorage();
  const storedToken = storage?.getItem(TOKEN_STORAGE_KEY) ?? null;
  const storedExpiry = storage?.getItem(TOKEN_EXPIRY_KEY) ?? null;
  if (isStoredTokenValid(storedToken, storedExpiry) && storedToken) {
    return storedToken;
  }

  if (storedToken) {
    removeStoredToken();
  }

  const secret = await requestClientSecret(apiKey);
  const expiresAt = computeExpiry(secret);
  persistToken(secret.value, expiresAt);
  return secret.value;
};
