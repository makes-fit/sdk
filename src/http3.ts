interface GetRequestOptions {
  auth?: () => string;
}

interface RequestOptions extends GetRequestOptions {
  body?: any;
}

export default function() {
  return {
    get: <RES = {}>(url: string, options?: GetRequestOptions) => doFetch<RES>(url, { method: 'GET', ...options }),
    post: <RES = any>(url: string, options?: RequestOptions) => doFetch<RES>(url, { method: 'POST', ...options }),
    put: <RES = void>(url: string, options?: RequestOptions) => doFetch<RES>(url, { method: 'PUT', ...options }),
    patch: <RES = void>(url: string, options?: RequestOptions) => doFetch<RES>(url, { method: 'PATCH', ...options }),
    delete: <RES = void>(url: string, options?: RequestOptions) => doFetch<RES>(url, { method: 'DELETE', ...options }),
  };
}

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

export function basicAuth(username: string, password: string) {
  return `Basic ${new Buffer(username + ':' + password).toString('base64')}`;
}

export function tokenAuth(token: string) {
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
