import { createVerify, generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Mock } from 'vitest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiKeyAuthProvider,
  createAuthProviderFromEnv,
  createRestAuthProvider,
  DEFAULT_JWT_AUDIENCE,
  loadPrivateKey,
  normalizePem,
  SystemIdentityAuthProvider,
  signClientAssertion,
} from '../../src/client/auth';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const CLIENT_ID = '11111111-2222-4333-8444-555555555555';

const originalFetch = global.fetch;
beforeAll(() => {
  // @ts-expect-error override in tests
  global.fetch = vi.fn();
});
afterAll(() => {
  global.fetch = originalFetch;
});

const tokenResponse = (token = 'tok', expiresIn = 3600) => ({
  ok: true,
  status: 200,
  json: async () => ({ access_token: token, expires_in: expiresIn, token_type: 'Bearer' }),
});

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString());

describe('signClientAssertion', () => {
  it('produces a verifiable RS256 JWT with the expected claims', () => {
    const jwt = signClientAssertion(CLIENT_ID, privateKey, DEFAULT_JWT_AUDIENCE, 1000);
    const [h, p, s] = jwt.split('.');
    expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    const claims = decode(p);
    expect(claims).toMatchObject({
      iss: CLIENT_ID,
      sub: CLIENT_ID,
      aud: DEFAULT_JWT_AUDIENCE,
      iat: 1000,
      exp: 1180,
    });
    const verifier = createVerify('RSA-SHA256').update(`${h}.${p}`);
    expect(verifier.verify(publicKey, Buffer.from(s, 'base64url'))).toBe(true);
  });

  it('uses a unique jti every time', () => {
    const a = decode(signClientAssertion(CLIENT_ID, privateKey, 'x').split('.')[1]);
    const b = decode(signClientAssertion(CLIENT_ID, privateKey, 'x').split('.')[1]);
    expect(a.jti).not.toBe(b.jti);
  });
});

describe('private key loading', () => {
  it('accepts real newlines, escaped \\n and base64 PEM', () => {
    expect(loadPrivateKey(pem).asymmetricKeyType).toBe('rsa');
    expect(loadPrivateKey(pem.replace(/\n/g, '\\n')).asymmetricKeyType).toBe('rsa');
    expect(loadPrivateKey(Buffer.from(pem).toString('base64')).asymmetricKeyType).toBe('rsa');
    expect(normalizePem(`  ${pem}  `)).toBe(pem.trim());
  });

  it('rejects invalid PEM and non-RSA keys without echoing the input', () => {
    expect(() => loadPrivateKey('super-secret-garbage')).toThrow(/not a valid/);
    try {
      loadPrivateKey('super-secret-garbage');
    } catch (e) {
      expect((e as Error).message).not.toContain('super-secret-garbage');
    }
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' })
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString();
    expect(() => loadPrivateKey(ec)).toThrow(/RSA/);
  });
});

describe('SystemIdentityAuthProvider', () => {
  let now: number;
  const make = () =>
    new SystemIdentityAuthProvider({ clientId: CLIENT_ID, privateKeyPem: pem, now: () => now });

  beforeEach(() => {
    now = 1_700_000_000_000;
    (global.fetch as Mock).mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('exchanges a signed assertion and sends a bearer header', async () => {
    (global.fetch as Mock).mockResolvedValueOnce(tokenResponse('abc'));
    const headers = await make().getHeaders();
    expect(headers).toEqual({ Authorization: 'Bearer abc' });
    const [url, init] = (global.fetch as Mock).mock.calls[0];
    expect(url).toBe('https://system-identity-oauth.service.newrelic.com/oauth2/token');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      client_id: CLIENT_ID,
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    });
    expect(body.client_assertion.split('.')).toHaveLength(3);
  });

  it('caches the token and refreshes inside the 5 minute window', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(tokenResponse('one'))
      .mockResolvedValueOnce(tokenResponse('two'));
    const auth = make();
    await auth.getHeaders();
    now += 54 * 60 * 1000;
    expect((await auth.getHeaders()).Authorization).toBe('Bearer one');
    now += 2 * 60 * 1000;
    expect((await auth.getHeaders()).Authorization).toBe('Bearer two');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('shares one token request between concurrent callers', async () => {
    (global.fetch as Mock).mockResolvedValue(tokenResponse('shared'));
    const auth = make();
    await Promise.all([auth.getHeaders(), auth.getHeaders(), auth.getHeaders()]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('refetches after invalidate()', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(tokenResponse('one'))
      .mockResolvedValueOnce(tokenResponse('two'));
    const auth = make();
    await auth.getHeaders();
    auth.invalidate();
    expect((await auth.getHeaders()).Authorization).toBe('Bearer two');
  });

  it('retries after a failed request instead of caching the failure', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce(tokenResponse('ok'));
    const auth = make();
    await expect(auth.getHeaders()).rejects.toThrow('(503)');
    expect((await auth.getHeaders()).Authorization).toBe('Bearer ok');
  });

  it('surfaces the server error description but never the key or assertion', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error_description: 'bad signature' }),
    });
    const err = await make()
      .getHeaders()
      .catch((e: Error) => e);
    expect((err as Error).message).toBe(
      'System identity token request failed (401): bad signature'
    );
    expect((err as Error).message).not.toContain('PRIVATE KEY');
  });

  it('handles non-JSON errors and missing access_token', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });
    await expect(make().getHeaders()).rejects.toThrow('(500)');
    (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(make().getHeaders()).rejects.toThrow(/access_token/);
  });

  it('rejects a non-https token URL', () => {
    expect(
      () =>
        new SystemIdentityAuthProvider({
          clientId: CLIENT_ID,
          privateKeyPem: pem,
          tokenUrl: 'http://example.com/token',
        })
    ).toThrow(/https/);
  });
});

describe('ApiKeyAuthProvider', () => {
  it('returns the API-Key header, or errors when empty', async () => {
    expect(await new ApiKeyAuthProvider('k').getHeaders()).toEqual({ 'API-Key': 'k' });
    const none = new ApiKeyAuthProvider('');
    expect(none.mode).toBe('none');
    await expect(none.getHeaders()).rejects.toThrow(/No New Relic credentials/);
    expect(() => none.invalidate()).not.toThrow();
  });
});

describe('createAuthProviderFromEnv', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => spy.mockRestore());

  it('falls back to the API key', () => {
    expect(createAuthProviderFromEnv({ NEW_RELIC_API_KEY: 'k' }).mode).toBe('api-key');
    expect(createAuthProviderFromEnv({}).mode).toBe('none');
  });

  it('prefers system identity when client id and key are set', () => {
    const p = createAuthProviderFromEnv({
      NEW_RELIC_CLIENT_ID: CLIENT_ID,
      NEW_RELIC_PRIVATE_KEY: pem,
      NEW_RELIC_API_KEY: 'k',
    });
    expect(p.mode).toBe('system-identity');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('only be used for REST'));
  });

  it('reads the key from a file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nr-key-'));
    const file = join(dir, 'key.pem');
    writeFileSync(file, pem);
    const p = createAuthProviderFromEnv({
      NEW_RELIC_CLIENT_ID: CLIENT_ID,
      NEW_RELIC_PRIVATE_KEY_PATH: file,
    });
    expect(p.mode).toBe('system-identity');
  });

  it('rejects both key sources and ignores partial configuration', () => {
    expect(() =>
      createAuthProviderFromEnv({
        NEW_RELIC_CLIENT_ID: CLIENT_ID,
        NEW_RELIC_PRIVATE_KEY: pem,
        NEW_RELIC_PRIVATE_KEY_PATH: '/x',
      })
    ).toThrow(/only one/);
    expect(createAuthProviderFromEnv({ NEW_RELIC_CLIENT_ID: CLIENT_ID }).mode).toBe('none');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('needs both'));
  });
});

describe('createRestAuthProvider', () => {
  const si = new SystemIdentityAuthProvider({ clientId: CLIENT_ID, privateKeyPem: pem });

  it('passes API key providers through', () => {
    const api = new ApiKeyAuthProvider('k');
    expect(createRestAuthProvider(api, {})).toBe(api);
  });

  it('uses NEW_RELIC_API_KEY for REST in system identity mode', async () => {
    const rest = createRestAuthProvider(si, { NEW_RELIC_API_KEY: 'rest-key' });
    expect(await rest.getHeaders()).toEqual({ 'API-Key': 'rest-key' });
  });

  it('gives a clear error when no API key is available', async () => {
    const rest = createRestAuthProvider(si, {});
    await expect(rest.getHeaders()).rejects.toThrow(/Set NEW_RELIC_API_KEY/);
    expect(() => rest.invalidate()).not.toThrow();
  });
});
