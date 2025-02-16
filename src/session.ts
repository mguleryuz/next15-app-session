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

  private async getCookie(name: string) {
    if (this.req?.cookies) {
      return this.req.cookies[name];
    }
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  }

  private async setCookie(name: string, value: any, cookieOpts?: any) {
    if (this.req?.headers) {
      // @ts-ignore
      const headers = new Headers(this.req.headers);
      const cookies = new RequestCookies(headers);
      cookies.set(name, value);
    }
    const cookieStore = await cookies();
    return cookieStore.set(name, value, cookieOpts);
  }

  private async _getID(): Promise<string | null | undefined> {
    return this.decode(await this.getCookie(this.name));
  }

  private async _initID() {
    let id = await this._getID();
    if (!id && this.genid) {
      id = this.genid();
    }
    this.sid = id || '';
  }

  private encode(sid: string): string {
    if (!this.secret || this.secret == '') return sid;
    return sid ? 's:' + signature.sign(sid, this.secret || '') : '';
  }

  private decode(raw: string | null | undefined): string | null {
    if (!raw || !this.secret || this.secret == '') return raw || null;
    return signature.unsign(raw.slice(2), this.secret || '') || null;
  }

  async all(): Promise<SessionData<T> | null | undefined> {
    await this._initID();
    const data = await this.store?.get(this.sid);
    return data ?? {};
  }
  async get(key: string | keyof T): Promise<any> {
    const data = await this.all();
    return data?.[key] ?? null;
  }
  async has(key: string | keyof T): Promise<boolean> {
    const data = await this.all();
    return !!data?.[key] && data?.[key] !== '';
  }
  async set(key: string | keyof T, value: any): Promise<void> {
    let data: any = await this.all();
    if (!data) {
      data = {};
    }
    data[key] = value;
    await this.setAll(data);
  }
  async setAll(data: T): Promise<void> {
    await this._initID();
    const existingID = await this._getID();
    if (!existingID || existingID == '') {
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
    await this.store.set(this.sid, { ...data });
  }
  async destroy(key?: string | keyof T | undefined): Promise<void> {
    if (key) {
      const data = (await this.all()) || ({} as T);
      delete data[key];
      await this.setAll(data);
    } else {
      await this.setAll({} as T);
    }
  }
}
