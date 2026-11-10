import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { app } from 'electron';
import { Account } from '../../types';

export class TokenStore {
  private filePath: string;
  private masterKey: Buffer;

  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(os.homedir(), '.hextra-studio');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.filePath = path.join(userDataPath, 'accounts.enc.json');

    // Deriving deterministic machine-based key + salt for AES-256-GCM
    const saltPath = path.join(userDataPath, '.hextra_entropy');
    let salt: Buffer;
    if (fs.existsSync(saltPath)) {
      salt = fs.readFileSync(saltPath);
    } else {
      salt = crypto.randomBytes(32);
      fs.writeFileSync(saltPath, salt);
    }

    const machineIdentifier = `${os.hostname()}::${os.userInfo().username}::HextraStudioKey2026`;
    this.masterKey = crypto.scryptSync(machineIdentifier, salt, 32);
  }

  private encrypt(text: string): { iv: string; tag: string; data: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return {
      iv: iv.toString('hex'),
      tag,
      data: encrypted
    };
  }

  private decrypt(encrypted: { iv: string; tag: string; data: string }): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(encrypted.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public getAccounts(): Account[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const payload = JSON.parse(raw);
      if (!payload.iv || !payload.tag || !payload.data) {
        return [];
      }
      const decryptedStr = this.decrypt(payload);
      return JSON.parse(decryptedStr) as Account[];
    } catch (err) {
      console.error('[TokenStore] Failed to decrypt or read accounts:', err);
      return [];
    }
  }

  public saveAccounts(accounts: Account[]): void {
    try {
      const serialized = JSON.stringify(accounts, null, 2);
      const encrypted = this.encrypt(serialized);
      fs.writeFileSync(this.filePath, JSON.stringify(encrypted, null, 2), 'utf8');
    } catch (err) {
      console.error('[TokenStore] Failed to save encrypted accounts:', err);
      throw err;
    }
  }

  public addOrUpdateAccount(account: Account): void {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex(a => a.id === account.id || a.token === account.token);
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...account };
    } else {
      accounts.push(account);
    }
    this.saveAccounts(accounts);
  }

  public removeAccount(id: string): void {
    const accounts = this.getAccounts().filter(a => a.id !== id);
    this.saveAccounts(accounts);
  }
}

export const tokenStore = new TokenStore();

