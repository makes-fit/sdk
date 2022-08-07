export default function() {
  return new HTTPClient('');
}

class HTTPClient {
  constructor(private authorization = '', private baseUrl = '') {}

  withBasicAuth(credentialsProvider: () => { username: string; password: string }) {
    const { username, password } = credentialsProvider();
    return new HTTPClient(basicAuth(username, password), this.baseUrl);
  }

  withTokenAuth(tokenProvider: () => string) {
    const token = tokenProvider();
    return new HTTPClient(tokenAuth(token), this.baseUrl);
  }

  withBaseUrl(baseUrl: string) {
    return new HTTPClient(this.authorization, baseUrl);
  }

  doGet<RES = {}>(path: string) {
    return this.doFetch<RES>(path, 'GET');
  }

  doPost<REQ = any, RES = any>(path: string, body?: REQ) {
    return this.doFetch<RES>(path, 'POST', body);
  }

  doPut<REQ = any, RES = any>(path: string, body?: REQ) {
    return this.doFetch<RES>(path, 'PUT', body);
  }

  doPatch<REQ = any, RES = any>(path: string, body?: REQ) {
    return this.doFetch<RES>(path, 'PATCH', body);
  }

  doDelete<REQ = any, RES = any>(path: string, body?: REQ) {
    return this.doFetch<RES>(path, 'DELETE', body);
  }

  doFetch<RES>(path: string, method: string, body?: any): Promise<RES> {
    const options = { method, body, headers: {} };

    if (this.authorization) {
      options.headers['Authorization'] = this.authorization;
    }

    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }

    let url = path
    if (this.baseUrl) {
      url = `${this.baseUrl}/${path}`
    }

    return fetch(url, options).then(res => {
      const responseHandler = (body: any) => {
        if (res.status >= 200 && res.status <= 299) {
          return body;
        }
        throw body;
      };

      let bodyParser: Promise<any>;
      if (hasContentType(res, 'application/json')) {
        bodyParser = res.json();
      } else if (hasContentType(res, 'text/plain')) {
        bodyParser = res.text();
      }
      if (bodyParser) {
        return bodyParser.then(responseHandler);
      }

      throw {
        xref: '__system__',
        status: 0,
        message: 'unable to decode response',
        data: { res, req: { url, method, body, auth: !!this.authorization } },
        timestamp: new Date().getTime(),
      };
    });
  }
}

const options = (m: string, o: any, a?: string) => (!a ? o : { ...o, method: m, Authorization: a });

interface FetchArgs {
  method: string;
  auth?: () => string;
  body?: any;
}

function doFetch<RES>(url: string, args: FetchArgs): Promise<RES> {
  const { auth = () => '', body, method } = args;

  const options = { method, body, headers: {} };

  const authHeader = auth();
  if (authHeader) {
    options.headers['Authorization'] = authHeader;
  }

  if (body) {
    options.headers['Content-Type'] = 'application/json';
  }

  return fetch(url, options).then(res => {
    const responseHandler = (body: any) => {
      if (res.status >= 200 && res.status <= 299) {
        return body;
      }
      throw body;
    };

    let bodyParser: Promise<any>;
    if (hasContentType(res, 'application/json')) {
      bodyParser = res.json();
    } else if (hasContentType(res, 'text/plain')) {
      bodyParser = res.text();
    }
    if (bodyParser) {
      return bodyParser.then(responseHandler);
    }

    throw {
      xref: '__system__',
      status: 0,
      message: 'unable to decode response',
      data: { res, req: { url, method, body, auth: !!args.auth } },
      timestamp: new Date().getTime(),
    };
  });
}

function basicAuth(username: string, password: string) {
  return `Basic ${new Buffer(username + ':' + password).toString('base64')}`;
}

function tokenAuth(token: string) {
  return `Bearer ${token}`;
}

function getHeader(res: Response, header: string) {
  return res.headers.get(header);
}

function hasContentType(res: Response, type: string) {
  return (
    getHeader(res, 'Content-Type')
      .split(';')
      .indexOf(type) >= 0
  );
}
