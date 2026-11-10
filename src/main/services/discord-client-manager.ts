import { EventEmitter } from 'events';
import { Client } from '@lng2004/discord.js-selfbot-v13';
import { discordApi, SUPER_PROPERTIES_OBJ } from './discord-api';
import { tokenStore } from './token-store';
import { Account } from '../../types';

export class DiscordClientManager extends EventEmitter {
  private clients: Map<string, Client> = new Map();
  private connectingTokens: Set<string> = new Set();
  private authFailedTokens: Set<string> = new Set();

  constructor() {
    super();
    // Listen to API auth errors
    discordApi.on('auth_error', ({ token, error }) => {
      this.handleAuthFailure(token, error.message);
    });
  }

  private handleAuthFailure(token: string, reason: string) {
    if (this.authFailedTokens.has(token)) return;
    this.authFailedTokens.add(token);

    this.emit('log', {
      module: 'AUTH',
      level: 'error',
      message: `Authentication failed (401/4004): ${reason}. Halting active jobs.`
    });

    const client = this.clients.get(token);
    if (client) {
      try {
        client.destroy();
      } catch (_) {}
      this.clients.delete(token);
    }

    // Update account status in store
    const accounts = tokenStore.getAccounts();
    const target = accounts.find(a => a.token === token);
    if (target) {
      target.status = 'error';
      target.lastError = reason;
      tokenStore.addOrUpdateAccount(target);
      this.emit('accounts_updated', tokenStore.getAccounts());
    }

    this.emit('auth_error', { token, reason });
  }

  public async validateToken(token: string): Promise<Account> {
    const raw = token.trim().replace(/^Bot\s+/i, '');
    try {
      const data = await discordApi.getMe(raw);
      const account: Account = {
        id: data.id,
        token: raw,
        username: data.username,
        discriminator: data.discriminator || '0',
        globalName: data.global_name || data.username,
        avatar: data.avatar
          ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
          : undefined,
        status: 'online',
        createdAt: Date.now()
      };
      tokenStore.addOrUpdateAccount(account);
      this.emit('accounts_updated', tokenStore.getAccounts());
      this.emit('log', {
        module: 'AUTH',
        level: 'success',
        message: `Validated token for @${data.username} (${data.id})`
      });
      return account;
    } catch (err: any) {
      this.emit('log', {
        module: 'AUTH',
        level: 'error',
        message: `Token validation error: ${err.message}`
      });
      throw err;
    }
  }

  /**
   * Shared Gateway Protection:
   * Returns existing Client instance if already connected, preventing duplicate logins.
   */
  public async getClient(token: string): Promise<Client> {
    const cleanToken = token.trim();

    if (this.authFailedTokens.has(cleanToken)) {
      throw new Error('Token is marked invalid (401/4004). Please re-enter a valid token.');
    }

    const existing = this.clients.get(cleanToken);
    if (existing && existing.isReady()) {
      return existing;
    }

    if (this.connectingTokens.has(cleanToken)) {
      // Wait for existing connection attempt
      let attempts = 0;
      while (this.connectingTokens.has(cleanToken) && attempts < 20) {
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
      const readyClient = this.clients.get(cleanToken);
      if (readyClient && readyClient.isReady()) {
        return readyClient;
      }
    }

    this.connectingTokens.add(cleanToken);

    try {
      this.emit('log', {
        module: 'AUTH',
        level: 'info',
        message: 'Establishing shared Discord Gateway connection...'
      });

      const client = new Client({
        checkUpdate: false,
        patchVoice: true,
        ws: {
          properties: {
            $os: SUPER_PROPERTIES_OBJ.os,
            $browser: SUPER_PROPERTIES_OBJ.browser,
            $device: 'desktop'
          }
        }
      } as any);

      const loginPromise = new Promise<Client>((resolve, reject) => {
        const timeout = setTimeout(() => {
          client.destroy();
          reject(new Error('Gateway connection timed out (15s)'));
        }, 15000);

        client.once('ready', () => {
          clearTimeout(timeout);
          this.clients.set(cleanToken, client);
          this.emit('log', {
            module: 'AUTH',
            level: 'success',
            message: `Gateway ready as ${client.user?.tag} (${client.user?.id})`
          });
          resolve(client);
        });

        client.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      await client.login(cleanToken);
      return await loginPromise;
    } catch (err: any) {
      if (err.message?.includes('TOKEN_INVALID') || err.message?.includes('4004') || err.message?.includes('401')) {
        this.handleAuthFailure(cleanToken, err.message);
      }
      throw err;
    } finally {
      this.connectingTokens.delete(cleanToken);
    }
  }

  public getActiveClient(token: string): Client | undefined {
    return this.clients.get(token.trim());
  }

  public disconnect(token: string) {
    const client = this.clients.get(token.trim());
    if (client) {
      try {
        client.destroy();
      } catch (_) {}
      this.clients.delete(token.trim());
      this.emit('log', {
        module: 'AUTH',
        level: 'info',
        message: `Disconnected gateway session for token.`
      });
    }
  }

  public disconnectAll() {
    for (const [token, client] of this.clients.entries()) {
      try {
        client.destroy();
      } catch (_) {}
    }
    this.clients.clear();
  }
}

export const clientManager = new DiscordClientManager();