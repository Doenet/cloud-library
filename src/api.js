import { decode as decodeJwt } from "./jwt";
import getAccessToken from "./token";
import sha256 from "./sha256";

async function doenetFetch( worksheetUrl, url, initialOptions ) {
  const token = await getAccessToken();
  if (token === undefined) return undefined;
  const jwt = decodeJwt(token);

  let options = {};
  if (initialOptions) options = {...initialOptions };
  if (!options.headers) options.headers = {};
  options.headers.Authorization = 'Bearer ' + token;
  options.headers['X-Worksheet'] = worksheetUrl;
  
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

async function put( kind, value, uri ) {
  let url = uri;
  if (uri === undefined) url = window.location.toString();

  return doenetFetch( url, kind, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
}

export async function putState( value, uri ) {
  return put( 'state', value, uri );
}

export async function putScore( value, uri ) {
  let url = uri;
  if (uri === undefined) url = window.location.toString();

  return doenetFetch( url, 'score', {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'text/plain'
    },
    body: parseFloat(value).toString()
  });
}
