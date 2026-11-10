import { request, ProxyAgent, Dispatcher } from 'undici';
import { EventEmitter } from 'events';

export const DISCORD_DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9175 Chrome/128.0.6613.186 Electron/32.2.7 Safari/537.36';

export const SUPER_PROPERTIES_OBJ = {
  os: 'Windows',
  browser: 'Discord Client',
  release_channel: 'stable',
  client_version: '1.0.9175',
  os_version: '10.0.22631',
  os_arch: 'x64',
  system_locale: 'tr',
  client_build_number: 359505
};

export const SUPER_PROPERTIES_BASE64 = Buffer.from(
  JSON.stringify(SUPER_PROPERTIES_OBJ)
).toString('base64');

export class DiscordApiError extends Error {
  constructor(
    public status: number,
    public code: number | undefined,
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'DiscordApiError';
  }
}

export class DiscordAuthError extends DiscordApiError {
  constructor(message: string = 'Invalid or expired Discord token (401/4004)') {
    super(401, 4004, message);
    this.name = 'DiscordAuthError';
  }
}

export class DiscordApiClient extends EventEmitter {
  private dispatcher?: Dispatcher;

  constructor(proxyUrl?: string) {
    super();
    if (proxyUrl) {
      try {
        this.dispatcher = new ProxyAgent(proxyUrl);
      } catch (e) {
        console.error('[DiscordApiClient] Failed to initialize ProxyAgent:', e);
      }
    }
  }

  public setProxy(proxyUrl?: string) {
    if (proxyUrl) {
      this.dispatcher = new ProxyAgent(proxyUrl);
    } else {
      this.dispatcher = undefined;
    }
  }

  public async fetchWithRetry<T = any>(
    url: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      token?: string;
      body?: any;
      headers?: Record<string, string>;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      token,
      body,
      headers: customHeaders = {},
      maxRetries = 3
    } = options;

    let retries = 0;

    while (retries <= maxRetries) {
      const headers: Record<string, string> = {
        'User-Agent': DISCORD_DESKTOP_USER_AGENT,
        'Accept': '*/*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        ...customHeaders
      };

      // Discord's /quests endpoints return an empty array if X-Super-Properties contains an outdated build number
      if (!url.includes('/quests') && customHeaders['X-Super-Properties'] === undefined) {
        headers['X-Super-Properties'] = SUPER_PROPERTIES_BASE64;
      }

      if (token) {
        headers['Authorization'] = token;
      }

      let payload: string | undefined;
      if (body !== undefined) {
        if (typeof body === 'string') {
          payload = body;
        } else {
          headers['Content-Type'] = 'application/json';
          payload = JSON.stringify(body);
        }
      }

      const response = await request(url, {
        method,
        headers,
        body: payload,
        dispatcher: this.dispatcher
      });

      const statusCode = response.statusCode;

      // Check for Authentication Failures (401 / 4004)
      if (statusCode === 401 || statusCode === 403) {
        const text = await response.body.text();
        let json: any = {};
        try {
          json = JSON.parse(text);
        } catch (_) {}

        if (statusCode === 401 || json.code === 4004) {
          const authErr = new DiscordAuthError(`Discord Auth Failed: ${json.message || text}`);
          this.emit('auth_error', { url, token, error: authErr });
          throw authErr;
        }

        throw new DiscordApiError(statusCode, json.code, json.message || text);
      }

      // Check for Rate Limit (429)
      if (statusCode === 429) {
        const text = await response.body.text();
        let retryAfter = 1.5;
        try {
          const json = JSON.parse(text);
          if (json.retry_after) {
            retryAfter = Number(json.retry_after);
          }
        } catch (_) {}

        this.emit('rate_limit', { url, retryAfter });
        console.warn(`[DiscordApi] 429 Rate limited on ${url}. Sleeping ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, Math.ceil(retryAfter * 1000) + 100));
        retries++;
        continue;
      }

      if (statusCode >= 200 && statusCode < 300) {
        if (statusCode === 204) {
          return null as any;
        }
        const text = await response.body.text();
        if (!text) return null as any;
        try {
          return JSON.parse(text) as T;
        } catch {
          return text as unknown as T;
        }
      }

      // Non-2xx error handling
      const errText = await response.body.text();
      let errJson: any = {};
      try {
        errJson = JSON.parse(errText);
      } catch (_) {}

      throw new DiscordApiError(
        statusCode,
        errJson.code,
        errJson.message || `Request failed with status ${statusCode}: ${errText}`
      );
    }

    throw new Error(`Max retries (${maxRetries}) exceeded for ${url}`);
  }

  public async getMe(token: string) {
    return this.fetchWithRetry('https://discord.com/api/v9/users/@me', {
      method: 'GET',
      token
    });
  }
}

export const discordApi = new DiscordApiClient();

