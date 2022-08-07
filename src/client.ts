import httpClient from './http';
import storageClient from './storage';

import { toRagnarPayload, PartialRagnar, Ragnar } from './types';

export interface Options {
  baseUrl: string;
}

export default function(options: Options) {
  return new APIClient(options.baseUrl);
}

interface API {
  ragnars: () => {
    list: () => Promise<Ragnar[]>;
    create: (ragnar: PartialRagnar) => Promise<Ragnar>;
    find: (id: string) => Promise<Ragnar>;
  };
}

interface Auth {
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    reenter: () => Promise<void>;
}

interface Internal {
    eggcorn: () => Promise<object>;
    whoami: () => Promise<object>;
}

class APIClient {
  private http = httpClient();
  private storage = storageClient('mf', localStorage);

  private refreshToken = '';
  private session = { userId: '', accessToken: '' };

  constructor(private baseUrl: string) {}

  async startup() {
    const refreshToken = this.storage.get('rt');
    if (refreshToken) {
      this.refreshToken = refreshToken;
      await this.auth().reenter();
      return;
    }
    return 'no refresh token found, proceeding without checking in';
  }

  api(): API {
    const authClient = this.http.withTokenAuth(this.accessTokenProvider);
    return {
      ragnars: () => {
        const adminClient = authClient.withBaseUrl(this.adminUrl('ragnars'));
        return {
          list: () => adminClient.doGet(''),
          create: ragnar => adminClient.doPost('', toRagnarPayload(ragnar)),
          find: id => adminClient.doGet(id),
        };
      },
    };
  }

  auth(): Auth {
    return {
      login: async (username: string, password: string) => {
        try {
          const { at, rt, uid } = await this.http.doPost(this.clientUrl('login'), { username, password });
          this.setRefreshToken(rt);
          this.setSession(uid, at);
        } catch (e) {}
      },
      logout: async () => {
        try {
          this.http.doDelete(this.clientUrl('auth/session'));
          this.setSession('', '');
        } catch (e) {}
      },
      reenter: async () => {
        try {
          const { at, uid } = await this.http.doPost(this.clientUrl('auth/session'), {
            body: { rt: this.refreshToken },
          });
          this.setSession(uid, at);
        } catch (e) {
          this.setSession('', '');
        }
      },
    };
  }

  internal(): Internal {
    const authClient = this.http.withTokenAuth(this.accessTokenProvider);
    return {
      eggcorn: () => this.http.doGet(this.privateUrl('eggcorn')),
      whoami: () => authClient.doGet(this.privateUrl('whoami')),
    };
  }

  accessTokenProvider() {
    return this.session.accessToken;
  }

  clientUrl(path: string) {
    return url(this.baseUrl, `client/v1/${path}`);
  }

  adminUrl(path: string) {
    return url(this.baseUrl, `admin/v1/${path}`);
  }

  privateUrl(path: string) {
    return url(this.baseUrl, `private/v1/${path}`);
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    this.storage.set('rt', refreshToken);
  }

  setSession(userId: string, accessToken: string) {
    this.session = { userId, accessToken };
  }
}

const url = (base: string, path: string) => `${base}/${path}`;
