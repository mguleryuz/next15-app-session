import type {
  CookieOptions,
  Options,
  SessionData,
  SessionHandler,
  SessionRecord,
  Store
} from './types';
import { nanoid } from 'nanoid';
import { MemoryStore } from './memory';
import signature from 'cookie-signature';
import { cookies } from 'next/headers';

// import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import type { NextApiRequest } from 'next';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';

export default function nextAppSession<T extends SessionRecord>(
  options: Options
): (req?: NextApiRequest) => AppSession<T> {
  const store = options.store || new MemoryStore();
  return (req?: NextApiRequest) => new AppSession<T>(store, options, req);
}

export class AppSession<T extends SessionRecord = SessionRecord>
  implements SessionHandler<T>
{
  static instance: AppSession;
  protected req?: NextApiRequest;
  protected store: Store;
  protected sid!: string;
  protected name: string;
  protected secret?: string;
  protected genid: () => string;
  protected cookieOpts?: Partial<CookieOptions>;
  protected touchAfter?: boolean;
  private _initialized: boolean = false;
  private _initPromise: Promise<void> | null = null;
  private _cookieStore: any = null;
  private _sessionData: T | null = null;
  private _dataLoaded: boolean = false;

  constructor(store: Store, options: Options, req?: NextApiRequest) {
    if (!req && typeof window !== 'undefined') {
      throw new Error(
        'Wrong implementation, please check the next-app-session docs for more info'
      );
    }
    this.req = req;
    this.store = store;
    this.name = options?.name || 'sid';
    this.secret = options?.secret;
    this.genid = options?.genid || nanoid;
    this.cookieOpts = options?.cookie;
    this.touchAfter = options?.touchAfter;

    return this;
  }

  private async getCookieStore() {
    if (!this._cookieStore) {
      this._cookieStore = await cookies();
    }
    return this._cookieStore;
  }

  private async getCookie(name: string) {
    if (this.req?.cookies) {
      return this.req.cookies[name];
    }
    const cookieStore = await this.getCookieStore();
    return cookieStore.get(name)?.value;
  }

  private async setCookie(name: string, value: any, cookieOpts?: any) {
    if (this.req?.headers) {
      // @ts-ignore
      const headers = new Headers(this.req.headers);
      const cookies = new RequestCookies(headers);
      cookies.set(name, value);
    }
    const cookieStore = await this.getCookieStore();
    return cookieStore.set(name, value, cookieOpts);
  }

  private async _getID(): Promise<string | null | undefined> {
    const rawCookie = await this.getCookie(this.name);
    return this.decode(rawCookie);
  }

  private async _initID() {
    if (this._initialized) return;

    let id = await this._getID();

    // Only generate a new ID if we don't have one
    if (!id) {
      // Check if there's existing data in the store before generating new ID
      // This handles cases where cookie might be temporarily unavailable
      if (this.genid) {
        id = this.genid();
      }
    }

    // Ensure we always have a valid session ID
    if (!id) {
      throw new Error('Failed to initialize session ID');
    }

    this.sid = id;
    this._initialized = true;
  }

  private async _ensureInitialized() {
    if (this._initialized) return;

    if (!this._initPromise) {
      this._initPromise = this._initID().catch((err) => {
        // Reset on error to allow retry
        this._initPromise = null;
        this._initialized = false;
        throw err;
      });
    }

    await this._initPromise;
  }

  private async _loadSessionData(): Promise<T | null> {
    if (this._dataLoaded && this._sessionData !== null) {
      return this._sessionData;
    }

    await this._ensureInitialized();

    try {
      const data = await this.store?.get(this.sid);
      // Extract just the user data, excluding the cookie property
      if (data) {
        const { cookie, ...userData } = data;
        this._sessionData = userData as T;
      } else {
        this._sessionData = null;
      }
      this._dataLoaded = true;
      return this._sessionData;
    } catch (error) {
      console.error('Failed to load session data:', error);
      this._sessionData = null;
      this._dataLoaded = true;
      return this._sessionData;
    }
  }

  private encode(sid: string): string {
    if (!this.secret || this.secret == '') return sid;
    return sid ? 's:' + signature.sign(sid, this.secret || '') : '';
  }

  private decode(raw: string | null | undefined): string | null {
    if (!raw) return null;
    if (!this.secret || this.secret == '') return raw;

    try {
      if (raw.startsWith('s:')) {
        return signature.unsign(raw.slice(2), this.secret || '') || null;
      }
      return raw;
    } catch (err) {
      return null;
    }
  }

  async all(): Promise<SessionData<T> | null | undefined> {
    const data = await this._loadSessionData();
    if (!data) return null;

    // Return data with cookie info for compatibility
    return {
      ...data,
      cookie: {
        path: this.cookieOpts?.path || '/',
        httpOnly: this.cookieOpts?.httpOnly ?? true,
        domain: this.cookieOpts?.domain || undefined,
        secure: this.cookieOpts?.secure || false,
        sameSite: this.cookieOpts?.sameSite,
        maxAge: this.cookieOpts?.maxAge || undefined,
        expires: this.cookieOpts?.expires || undefined
      } as CookieOptions
    };
  }

  async get(key: string | keyof T): Promise<any> {
    const data = await this._loadSessionData();
    return data?.[key] ?? null;
  }

  async has(key: string | keyof T): Promise<boolean> {
    const data = await this._loadSessionData();
    return !!data?.[key] && data?.[key] !== '';
  }

  async set(key: string | keyof T, value: any): Promise<void> {
    await this._ensureInitialized();

    let data = await this._loadSessionData();
    if (!data) {
      data = {} as T;
    }

    data[key] = value;

    // Update cache
    this._sessionData = data;
    this._dataLoaded = true;

    await this.setAll(data);
  }

  async setAll(data: T): Promise<void> {
    await this._ensureInitialized();

    const existingID = await this._getID();
    if (!existingID || existingID !== this.sid) {
      await this.setCookie(this.name, this.encode(this.sid), {
        path: this.cookieOpts?.path || '/',
        httpOnly: this.cookieOpts?.httpOnly ?? true,
        domain: this.cookieOpts?.domain || undefined,
        sameSite: this.cookieOpts?.sameSite,
        secure: this.cookieOpts?.secure || false,
        maxAge: this.cookieOpts?.maxAge || undefined,
        expires: this.cookieOpts?.expires || undefined
      });
    }

    // Update cache
    this._sessionData = { ...data };
    this._dataLoaded = true;

    // Store data with cookie metadata
    const sessionData: SessionData<T> = {
      ...data,
      cookie: {
        path: this.cookieOpts?.path || '/',
        httpOnly: this.cookieOpts?.httpOnly ?? true,
        domain: this.cookieOpts?.domain || undefined,
        secure: this.cookieOpts?.secure || false,
        sameSite: this.cookieOpts?.sameSite,
        maxAge: this.cookieOpts?.maxAge || undefined,
        expires: this.cookieOpts?.expires || undefined
      } as CookieOptions
    };

    await this.store.set(this.sid, sessionData);
  }

  async destroy(key?: string | keyof T | undefined): Promise<void> {
    await this._ensureInitialized();

    if (key) {
      const data = (await this._loadSessionData()) || ({} as T);
      delete data[key];
      await this.setAll(data);
    } else {
      // Clear cache
      this._sessionData = {} as T;
      this._dataLoaded = true;

      await this.setAll({} as T);
    }
  }
}
