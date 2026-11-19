import { createPrivateKey, createSign, type KeyObject, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

export type AuthMode = 'api-key' | 'system-identity' | 'none';

export interface AuthProvider {
  readonly mode: AuthMode;
  /** Headers to attach to a NerdGraph request. Throws when no credentials are configured. */
  getHeaders(): Promise<Record<string, string>>;
  /** Discard any cached token so the next getHeaders() fetches a fresh one. */
  invalidate(): void;
}

export const DEFAULT_TOKEN_URL = 'https://system-identity-oauth.service.newrelic.com/oauth2/token';
// Matches the audience used by New Relic's own newrelic-auth-rs client.
export const DEFAULT_JWT_AUDIENCE = 'https://www.newrelic.com/';
const JWT_LIFETIME_SECONDS = 180;
const REFRESH_WINDOW_MS = 5 * 60 * 1000;
const TOKEN_REQUEST_TIMEOUT_MS = 15_000;

const b64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');

export function normalizePem(raw: string): string {
  let value = raw.trim();
  if (!value.includes('-----BEGIN')) {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN')) value = decoded.trim();
  }
  return value.replace(/\\n/g, '\n');
}

export function loadPrivateKey(pem: string): KeyObject {
  let key: KeyObject;
  try {
    key = createPrivateKey(normalizePem(pem));
  } catch {
    throw new Error(
      'NEW_RELIC_PRIVATE_KEY is not a valid unencrypted PEM private key (RSA-4096 expected)'
    );
  }
  if (key.asymmetricKeyType !== 'rsa') {
    throw new Error('NEW_RELIC_PRIVATE_KEY must be an RSA private key');
  }
  return key;
}

export function signClientAssertion(
  clientId: string,
  key: KeyObject,
  audience: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: clientId,
      sub: clientId,
      aud: audience,
      jti: randomUUID(),
      iat: nowSeconds,
      exp: nowSeconds + JWT_LIFETIME_SECONDS,
    })
  );
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(key);
  return `${header}.${payload}.${b64url(signature)}`;
}

export class ApiKeyAuthProvider implements AuthProvider {
  readonly mode: AuthMode;
  constructor(private readonly apiKey: string) {
    this.mode = apiKey ? 'api-key' : 'none';
  }

  async getHeaders(): Promise<Record<string, string>> {
    if (!this.apiKey) {
      throw new Error(
        'No New Relic credentials configured: set NEW_RELIC_API_KEY, or NEW_RELIC_CLIENT_ID with NEW_RELIC_PRIVATE_KEY'
      );
    }
    return { 'API-Key': this.apiKey };
  }

  invalidate(): void {}
}

export interface SystemIdentityOptions {
  clientId: string;
  privateKeyPem: string;
  tokenUrl?: string;
  audience?: string;
  now?: () => number;
}

export class SystemIdentityAuthProvider implements AuthProvider {
  readonly mode: AuthMode = 'system-identity';
  private readonly clientId: string;
  private readonly privateKeyPem: string;
  private readonly tokenUrl: string;
  private readonly audience: string;
  private readonly now: () => number;
  private key?: KeyObject;
  private token?: string;
  private expiresAt = 0;
  private inflight?: Promise<string>;

  constructor(options: SystemIdentityOptions) {
    this.clientId = options.clientId;
    this.privateKeyPem = options.privateKeyPem;
    this.tokenUrl = options.tokenUrl ?? DEFAULT_TOKEN_URL;
    this.audience = options.audience ?? DEFAULT_JWT_AUDIENCE;
    this.now = options.now ?? Date.now;
    if (new URL(this.tokenUrl).protocol !== 'https:') {
      throw new Error('NEW_RELIC_OAUTH_TOKEN_URL must use https');
    }
  }

  async getHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.getToken()}` };
  }

  invalidate(): void {
    this.token = undefined;
    this.expiresAt = 0;
  }

  private getToken(): Promise<string> {
    if (this.token && this.now() < this.expiresAt - REFRESH_WINDOW_MS) {
      return Promise.resolve(this.token);
    }
    // Concurrent tool calls share one token request.
    this.inflight ??= this.fetchToken().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  private async fetchToken(): Promise<string> {
    this.key ??= loadPrivateKey(this.privateKeyPem);
    const assertion = signClientAssertion(
      this.clientId,
      this.key,
      this.audience,
      Math.floor(this.now() / 1000)
    );

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: assertion,
        grant_type: 'client_credentials',
      }),
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const body = (await response.json()) as { error_description?: string };
        detail = body.error_description ? `: ${body.error_description}` : '';
      } catch {
        // non-JSON error body
      }
      throw new Error(`System identity token request failed (${response.status})${detail}`);
    }

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw new Error('System identity token response did not contain an access_token');
    }
    this.token = data.access_token;
    this.expiresAt = this.now() + (data.expires_in ?? 3600) * 1000;
    return this.token;
  }
}

/**
 * Chooses system identity auth when NEW_RELIC_CLIENT_ID and a private key are set,
 * otherwise falls back to NEW_RELIC_API_KEY.
 */
export function createAuthProviderFromEnv(env: NodeJS.ProcessEnv = process.env): AuthProvider {
  const clientId = env.NEW_RELIC_CLIENT_ID?.trim();
  const inlineKey = env.NEW_RELIC_PRIVATE_KEY;
  const keyPath = env.NEW_RELIC_PRIVATE_KEY_PATH;

  if (inlineKey && keyPath) {
    throw new Error('Set only one of NEW_RELIC_PRIVATE_KEY and NEW_RELIC_PRIVATE_KEY_PATH');
  }
  if (clientId && (inlineKey || keyPath)) {
    const privateKeyPem = inlineKey ?? readFileSync(keyPath as string, 'utf8');
    if (env.NEW_RELIC_API_KEY) {
      console.error(
        'New Relic MCP: system identity configured; NEW_RELIC_API_KEY will only be used for REST v2 tools'
      );
    }
    return new SystemIdentityAuthProvider({
      clientId,
      privateKeyPem,
      tokenUrl: env.NEW_RELIC_OAUTH_TOKEN_URL || undefined,
    });
  }
  if (clientId || inlineKey || keyPath) {
    console.error(
      'New Relic MCP: system identity needs both NEW_RELIC_CLIENT_ID and a private key; ignoring partial configuration'
    );
  }
  return new ApiKeyAuthProvider(env.NEW_RELIC_API_KEY || '');
}

/**
 * REST v2 documents only the Api-Key header, so system identity mode uses the API key
 * for REST when one is set.
 */
export function createRestAuthProvider(
  primary: AuthProvider,
  env: NodeJS.ProcessEnv = process.env
): AuthProvider {
  if (primary.mode !== 'system-identity') return primary;
  const apiKey = env.NEW_RELIC_API_KEY;
  if (apiKey) return new ApiKeyAuthProvider(apiKey);
  return {
    mode: 'none',
    async getHeaders() {
      throw new Error(
        'This tool uses the New Relic REST v2 API, which does not accept system identity tokens. Set NEW_RELIC_API_KEY to use it.'
      );
    },
    invalidate() {},
  };
}
