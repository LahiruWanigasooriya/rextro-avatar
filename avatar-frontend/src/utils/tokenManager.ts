/**
 * Token Manager for OpenAI Realtime API
 * Handles ephemeral token generation, validation, and storage
 */

const TOKEN_STORAGE_KEY = 'openai_realtime_token';
const TOKEN_EXPIRY_KEY = 'openai_realtime_token_expiry';
const TOKEN_VALIDITY_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface TokenData {
  value: string;
  expires_at?: number;
}

/**
 * Generate a new ephemeral token from OpenAI API
 */
async function generateNewToken(apiKey: string): Promise<string> {
  const sessionConfig = JSON.stringify({
    session: {
      type: "realtime",
      model: "gpt-realtime",
      audio: {
        output: { voice: "marin" },
      },
    },
  });

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: sessionConfig,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token generation failed:', errorText);
    throw new Error(`Failed to generate token: ${response.status} ${response.statusText}`);
  }

  const data: TokenData = await response.json();
  
  if (!data.value || !data.value.startsWith('ek_')) {
    throw new Error('Invalid token received from API');
  }

  return data.value;
}

/**
 * Validate if a token is still valid by checking its format and expiry
 */
function isTokenValid(token: string | null, expiryTime: string | null): boolean {
  if (!token || !token.startsWith('ek_')) {
    return false;
  }

  if (expiryTime) {
    const expiry = parseInt(expiryTime, 10);
    if (Date.now() >= expiry) {
      console.log('Token expired');
      return false;
    }
  }

  return true;
}

/**
 * Test if a token works by attempting a connection (optional advanced validation)
 * This is a simple check - you can enhance it if needed
 */
async function testToken(token: string): Promise<boolean> {
  try {
    // Basic format validation
    if (!token.startsWith('ek_') || token.length < 20) {
      return false;
    }
    
    // Token is valid if format is correct
    // The actual connection test will happen when the agent starts
    return true;
  } catch (error) {
    console.error('Token test failed:', error);
    return false;
  }
}

/**
 * Get a valid ephemeral token, generating a new one if necessary
 */
export async function getValidToken(openAiApiKey: string): Promise<string> {
  try {
    // Check localStorage for existing token
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    // Validate stored token
    if (isTokenValid(storedToken, storedExpiry)) {
      console.log('Using cached valid token');
      const isValid = await testToken(storedToken!);
      
      if (isValid) {
        return storedToken!;
      } else {
        console.log('Cached token failed validation, generating new token');
      }
    } else {
      console.log('No valid cached token found, generating new token');
    }

    // Generate new token
    console.log('Generating new ephemeral token...');
    const newToken = await generateNewToken(openAiApiKey);
    
    // Store token with expiry time
    const expiryTime = Date.now() + TOKEN_VALIDITY_DURATION;
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    console.log('New token generated and stored successfully');
    return newToken;
  } catch (error) {
    console.error('Error in getValidToken:', error);
    throw new Error(
      `Failed to get valid token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear stored token (useful for logout or manual refresh)
 */
export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  console.log('Stored token cleared');
}

/**
 * Get token info for debugging
 */
export function getTokenInfo(): { token: string | null; expiry: string | null; isValid: boolean } {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  const isValid = isTokenValid(token, expiry);
  
  return { token, expiry, isValid };
}
