import { decode as decodeJwt } from "./jwt";

export default async function get() {
  const location = (new URL(window.document.location));
  const code = location.searchParams.get("code");
  const returnedState = location.searchParams.get("state");  
  
  if (!code || !returnedState) {
    const previousJwt = window.localStorage.getItem('doenet.cloud:jwt');
  
    // TODO: check if this has expired
    if (previousJwt) {
      const decoded = decodeJwt(previousJwt);
      const expiry = new Date(1000 * decoded.payload.exp);

      if (Date.now() > expiry) {
        // Remove it so we don't confuse ourselves later
        window.localStorage.removeItem('doenet.cloud:jwt');
        
        // Nevertheless, we don't have a code and a state, so we can't do anything now
        return undefined;
      } else {
        // It is still valid!
        return previousJwt;
      }
    }
  }

  // Create the URL to the token endpoint
  const target = window.localStorage.getItem(`doenet.cloud:target`);
  window.localStorage.removeItem('doenet.cloud:target');
  
  let url = new URL('https://id.doenet.cloud/');
  if (target) {
    url = new URL(target);
  }
  url.pathname = '/token';
  url.searchParams.set('code', code);
  
  const state = window.localStorage.getItem('doenet.cloud:state');
  url.searchParams.set('state',state);
  window.localStorage.removeItem('doenet.cloud:state');

  if (state !== returnedState) {
    throw new Error('previously provided state does not match returned state');
  }
  
  const redirectUri = window.localStorage.getItem('doenet.cloud:redirect_uri');
  url.searchParams.set('redirect_uri',redirectUri);
  window.localStorage.removeItem('doenet.cloud:redirect_uri');

  const clientId = window.localStorage.getItem('doenet.cloud:client_id');
  url.searchParams.set('client_id',clientId);
  window.localStorage.removeItem('doenet.cloud:client_id');
 
  const codeVerifier = window.localStorage.getItem('doenet.cloud:code_verifier');
  url.searchParams.set('code_verifier',codeVerifier);
  window.localStorage.removeItem('doenet.cloud:code_verifier');      

  url.searchParams.set('grant_type','authorization_code');

  const settings = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  };
  
  const response = await window.fetch(url.toString(), settings);
  
  if (response.status !== 200) {
    throw new Error(`received ${response.status} when fetching access token`);
  }
  
  const data = await response.json();
  const token = data.access_token;
  
  window.localStorage.setItem('doenet.cloud:jwt', token);

  // Get rid of code and state params
  location.searchParams.delete("code");
  location.searchParams.delete("state");  
  window.history.replaceState(null, '', location);
  
  return token;
}

