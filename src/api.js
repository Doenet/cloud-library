import { decode as decodeJwt } from "./jwt";
import getAccessToken from "./token";
import sha256 from "./sha256";
import JWP from 'json-work-proof';

async function doenetFetch( worksheetUrl, url, initialOptions ) {
  const token = await getAccessToken();
  if (token === undefined) return undefined;
  const jwt = decodeJwt(token);

  let options = {};
  if (initialOptions) options = {...initialOptions };
  if (!options.headers) options.headers = {};
  options.headers.Authorization = 'Bearer ' + token;
  options.headers['X-Worksheet'] = worksheetUrl;

  options.headers.Accept = 'application/json';

  if ('body' in options) {
    const body = JSON.stringify(options.body);
    options.body = body;
    
    options.headers['Content-Type'] = 'application/json';

    const bodyHash = await sha256(body);
    options.headers['X-Body-SHA256'] = bodyHash;

    // TODO: the difficulty should be chosen by the server
    const jwp = new JWP(10);
    const workToken = await jwp.generate({ sub: jwt.payload.sub,
                                           worksheet: worksheetUrl,
                                           body: bodyHash });
    options.headers['X-JSON-Work-Proof'] = workToken;
  }
  
  let userId = jwt.payload.sub;
  let audience = jwt.payload.aud;
  let clientId = jwt.payload.client_id;
  let domain = (new URL(worksheetUrl)).hostname;
  
  if (clientId !== domain) {
    throw new Error('JWT client_id does not match worksheet URI domain');
  }

  const worksheetHash = await sha256(worksheetUrl);
  
  const resolvedAudience = new URL(`worksheets/${worksheetHash}/users/${userId}/`, audience);
  const endpoint = new URL(url, resolvedAudience);

  console.log(endpoint.toString(), options);

  return window.fetch(endpoint, options);
}

async function get( kind, uri ) {
  let url = uri;
  if (uri === undefined) url = window.location.toString();

  return doenetFetch( url, kind, {method: 'GET'} );
}

export async function getState( uri ) {
  const response = await get('state', uri);

  if (response.ok) {
    const payload = await response.json();
    return payload;
  }
  
  return null;
}

export async function getScore( uri ) {
  const response = await get('score',uri);

  if (response.ok) {
    const payload = await response.json();
    console.log(payload);
    return payload.score;
  }
  
  return null;
}

async function put( kind, body, uri ) {
  let url = uri;
  if (uri === undefined) url = window.location.toString();
  
  return doenetFetch( url, kind, {
    method: 'PUT',
    body
  });
}

export async function putState( state, uri ) {
  return put( 'state', state, uri );
}

export async function putScore( score, uri ) {
  let url = uri;
  if (uri === undefined) url = window.location.toString();

  return doenetFetch( url, 'score', {
    method: 'PUT',
    body: { score }
  });
}
